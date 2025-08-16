import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  BinanceAccount,
  BinanceAccountDocument,
} from './schemas/binance-account.schema';
import { Platform, PlatformDocument } from '../../platforms/schemas/platform.schema';

import { CreateBinanceAccountDto } from './dto/create-binance-account.dto';
import { UpdateBinanceAccountDto } from './dto/update-binance-account.dto';
import { EncryptionService } from '../../common/security/encryption.service';

@Injectable()
export class BinanceAccountsService {
  constructor(
    @InjectModel(BinanceAccount.name)
    private readonly accountModel: Model<BinanceAccountDocument>,
    @InjectModel(Platform.name)
    private readonly platformModel: Model<PlatformDocument>,
    private readonly enc: EncryptionService,
  ) {}

  /** Proyección base (nunca incluir apiSecret) */
  private baseProjection = '-apiSecret -__v';

  /** Serializa un documento a objeto plano sin apiSecret */
  private toSafe(obj: BinanceAccountDocument | (BinanceAccount & any)) {
    const o = typeof (obj as any).toObject === 'function'
      ? (obj as any).toObject()
      : obj;
    if (o?.apiSecret !== undefined) delete o.apiSecret;
    return o;
  }

  async findAllMine(userId: Types.ObjectId, platformId?: string) {
    const q: any = { userId };
    if (platformId) {
      if (!Types.ObjectId.isValid(platformId)) {
        throw new HttpException('Invalid platform id', HttpStatus.BAD_REQUEST);
      }
      q.platformId = new Types.ObjectId(platformId);
    }

    const rows = await this.accountModel
      .find(q)
      .select(this.baseProjection)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return rows; // ya viene sin apiSecret por la proyección
  }

  async createMine(userId: Types.ObjectId, dto: CreateBinanceAccountDto) {
    // 1) validar plataforma
    if (!Types.ObjectId.isValid(dto.platformId)) {
      throw new HttpException('Invalid platform id', HttpStatus.BAD_REQUEST);
    }
    const platform = await this.platformModel.findById(dto.platformId).lean();
    if (!platform || platform.isActive === false) {
      throw new HttpException('Platform not found', HttpStatus.NOT_FOUND);
    }

    // 2) construir doc (encriptar secret)
    const doc = new this.accountModel({
      userId,
      platformId: new Types.ObjectId(dto.platformId),
      description: dto.description.trim(),
      apiKey: dto.apiKey.trim(),
      apiSecret: this.enc.encode(dto.apiSecret.trim()),
      isActive: dto.isActive ?? true,
    });

    try {
      const created = await doc.save();
      // devolver sin apiSecret
      return this.toSafe(created);
    } catch (err: any) {
      // índice único duplicado (userId + platformId + description)
      if (err?.code === 11000) {
        throw new HttpException(
          'A record with same description already exists for this platform',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw err;
    }
  }

  async updateMine(
    userId: Types.ObjectId,
    id: string,
    dto: UpdateBinanceAccountDto,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid id', HttpStatus.BAD_REQUEST);
    }

    const doc = await this.accountModel.findOne({
      _id: new Types.ObjectId(id),
      userId,
    });
    if (!doc) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    if (dto.description !== undefined) doc.description = dto.description.trim();
    if (dto.apiKey !== undefined) doc.apiKey = dto.apiKey.trim();
    if (dto.apiSecret !== undefined)
      doc.apiSecret = this.enc.encode(dto.apiSecret.trim());
    if (dto.isActive !== undefined) doc.isActive = dto.isActive;

    try {
      const saved = await doc.save();
      return this.toSafe(saved);
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new HttpException(
          'A record with same description already exists for this platform',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw err;
    }
  }

  async removeMine(userId: Types.ObjectId, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException('Invalid id', HttpStatus.BAD_REQUEST);
    }

    const res = await this.accountModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId,
    });

    if (res.deletedCount === 0) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }
}