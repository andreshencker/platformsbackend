// src/integrations/binance-accounts/binance-accounts.service.ts
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Binance from 'binance-api-node'; // ← FALTABA ESTE IMPORT
import { EncryptionService } from '../../../common/security/encryption.service';
import {
  UserPlatform,
  UserPlatformDocument,
} from '../../../user-platforms/schemas/user-platform.schema';
import {
  BinanceAccount,
  BinanceAccountDocument,
} from './schemas/binance-account.schema';
import { CreateBinanceAccountDto } from './dto/create-binance-account.dto';
import { UpdateBinanceAccountDto } from './dto/update-binance-account.dto';
import { BinanceService } from '../binance.service';

@Injectable()
export class BinanceAccountsService {
  private readonly log = new Logger(BinanceAccountsService.name);

  constructor(
    @InjectModel(BinanceAccount.name)
    private readonly accountModel: Model<BinanceAccountDocument>,
    @InjectModel(UserPlatform.name)
    private readonly userPlatformModel: Model<UserPlatformDocument>,
    private readonly enc: EncryptionService,
    private readonly binanceService: BinanceService,
  ) {}

  private baseProjection = '-apiSecret -__v';

  private toSafe(doc: any) {
    const o = typeof doc?.toObject === 'function' ? doc.toObject() : doc;
    if (o?.apiSecret !== undefined) delete o.apiSecret;
    return o;
  }
  async getOrThrow(accountId: string): Promise<BinanceAccountDocument> {
    const id = (accountId ?? '').trim();
    const is24hex = /^[0-9a-fA-F]{24}$/.test(id);
    if (!is24hex) {
      this.log.warn(`Invalid accountId received: "${accountId}" -> cleaned "${id}"`);
      throw new HttpException('Invalid accountId', HttpStatus.BAD_REQUEST);
    }
    const doc = await this.accountModel.findById(new Types.ObjectId(id)).lean();
    if (!doc) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    // @ts-ignore: devolvemos el doc lean como Document para reutilizar tipos
    return doc as unknown as BinanceAccountDocument;
  }

  // 👇 utilitario centralizado para desencriptar
  async getDecryptedCredsOrThrow(id: string): Promise<{ apiKey: string; apiSecret: string }> {
    const doc = await this.getOrThrow(id);
    if (!doc.apiKey || !doc.apiSecret) {
      throw new HttpException('Missing API credentials in account', HttpStatus.BAD_REQUEST);
    }
    try {
      return {
        apiKey: doc.apiKey,
        apiSecret: this.enc.decode(doc.apiSecret),
      };
    } catch (e: any) {
      this.log.error(`Decrypt failed for account ${id}: ${e?.message ?? e}`);
      throw new HttpException('Could not decrypt API secret', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** Normaliza un error desconocido a HttpException */
  private asHttpError(e: any, fallback: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    if (e instanceof HttpException) return e;
    const msg =
      e?.response?.data?.message ||
      e?.response?.data?.msg ||
      e?.message ||
      'Unexpected error';
    return new HttpException(msg, fallback);
  }

  async listMine(userId: Types.ObjectId, userPlatformId?: string) {
    try {
      const q: any = { userId };
      if (userPlatformId) {
        if (!Types.ObjectId.isValid(userPlatformId)) {
          throw new HttpException('Invalid userPlatformId', HttpStatus.BAD_REQUEST);
        }
        q.userPlatformId = new Types.ObjectId(userPlatformId);
      }

      const rows = await this.accountModel
        .find(q)
        .select(this.baseProjection)
        .sort({ isDefault: -1, createdAt: -1 })
        .lean()
        .exec();

      return rows;
    } catch (e) {
      this.log.error('listMine failed', e instanceof Error ? e.stack : String(e));
      throw this.asHttpError(e);
    }
  }

  async createMine(userId: Types.ObjectId, dto: CreateBinanceAccountDto) {
    try {
      // Validaciones básicas
      if (!Types.ObjectId.isValid(dto.userPlatformId)) {
        throw new HttpException('Invalid userPlatformId', HttpStatus.BAD_REQUEST);
      }
      if (!dto.apiKey?.trim() || !dto.apiSecret?.trim()) {
        throw new HttpException('Missing API credentials', HttpStatus.BAD_REQUEST);
      }

      // Validar UserPlatform (pertenencia + activo)
      const up = await this.userPlatformModel
        .findOne({ _id: new Types.ObjectId(dto.userPlatformId), userId })
        .lean();

      if (!up) {
        throw new HttpException('UserPlatform not found', HttpStatus.NOT_FOUND);
      }
      if (up.isActive === false) {
        throw new HttpException('UserPlatform inactive', HttpStatus.FORBIDDEN);
      }

      // Verificar llaves ANTES de guardar (llamada real al SDK)
      // Puedes usar binanceService.verifyKeys si prefieres centralizar:
      // await this.binanceService.verifyKeys(userId, dto.userPlatformId);
      const tempClient = Binance({
        apiKey: dto.apiKey.trim(),
        apiSecret: dto.apiSecret.trim(),
      });

      try {
        await tempClient.ping(); // spot ping (no firma)
      } catch (err) {
        this.log.warn(`Spot ping failed (non-blocking): ${String(err?.message ?? err)}`);
      }

      try {
        // llamada firmada que valida de verdad
        await tempClient.futuresAccountInfo();
      } catch (err: any) {
        const msg =
          err?.response?.data?.msg ||
          err?.message ||
          'Invalid Binance credentials (or IP not allowlisted)';
        throw new HttpException(msg, HttpStatus.BAD_REQUEST);
      }

      // Construcción del documento (encriptando secret)
      const doc = new this.accountModel({
        userId,
        userPlatformId: new Types.ObjectId(dto.userPlatformId),
        description: dto.description?.trim() ?? '',
        apiKey: dto.apiKey.trim(),
        apiSecret: this.enc.encode(dto.apiSecret.trim()),
        isActive: dto.isActive ?? true,
        isDefault: !!dto.isDefault,
      });

      const created = await doc.save();

      // Si isDefault → desmarcar otros del mismo user+userPlatform
      if (created.isDefault) {
        await this.accountModel.updateMany(
          {
            userId,
            userPlatformId: created.userPlatformId,
            _id: { $ne: created._id },
          },
          { $set: { isDefault: false } },
        );
      }

      return this.toSafe(created);
    } catch (e: any) {
      // Duplicados por unique index
      if (e?.code === 11000) {
        throw new HttpException(
          'Duplicated description for this platform',
          HttpStatus.BAD_REQUEST,
        );
      }
      this.log.error('createMine failed', e instanceof Error ? e.stack : String(e));
      throw this.asHttpError(e);
    }
  }

  async updateMine(userId: Types.ObjectId, id: string, dto: UpdateBinanceAccountDto) {
    try {
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

      // Si viene cambio de credenciales, validar mínimamente
      if (dto.apiKey !== undefined) {
        if (!dto.apiKey.trim()) {
          throw new HttpException('apiKey cannot be empty', HttpStatus.BAD_REQUEST);
        }
        doc.apiKey = dto.apiKey.trim();
      }
      if (dto.apiSecret !== undefined) {
        if (!dto.apiSecret.trim()) {
          throw new HttpException('apiSecret cannot be empty', HttpStatus.BAD_REQUEST);
        }
        doc.apiSecret = this.enc.encode(dto.apiSecret.trim());
      }

      if (dto.description !== undefined) doc.description = dto.description.trim();
      if (dto.isActive !== undefined) doc.isActive = dto.isActive;
      if (dto.isDefault !== undefined) doc.isDefault = dto.isDefault;

      const saved = await doc.save();

      // Si quedó default → desmarcar los demás
      if (saved.isDefault) {
        await this.accountModel.updateMany(
          {
            userId,
            userPlatformId: saved.userPlatformId,
            _id: { $ne: saved._id },
          },
          { $set: { isDefault: false } },
        );
      }

      return this.toSafe(saved);
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new HttpException(
          'Duplicated description for this platform',
          HttpStatus.BAD_REQUEST,
        );
      }
      this.log.error('updateMine failed', e instanceof Error ? e.stack : String(e));
      throw this.asHttpError(e);
    }
  }

  async removeMine(userId: Types.ObjectId, id: string) {
    try {
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
    } catch (e) {
      this.log.error('removeMine failed', e instanceof Error ? e.stack : String(e));
      throw this.asHttpError(e);
    }
  }
}