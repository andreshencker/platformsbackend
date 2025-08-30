// src/integrations/binance/user-symbols/user-symbols.service.ts
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  UserSymbol,
  UserSymbolDocument,
  Market,
} from './schemas/user-symbol.schema';

import { CreateUserSymbolDto } from './dto/create-user-symbol.dto';
import { UpdateUserSymbolDto } from './dto/update-user-symbol.dto';

import {
  toUserSymbolDto,
  toUserSymbolDtoList,
  UserSymbolDto,
} from './mappers/user-symbol.mapper';

// (Opcional) Valida que exista la cuenta a la que se asocia.
// Si quieres validar pertenencia con userId, puedes inyectar BinanceAccountsService aquí.
@Injectable()
export class UserSymbolsService {
  private readonly log = new Logger(UserSymbolsService.name);

  constructor(
    @InjectModel(UserSymbol.name)
    private readonly model: Model<UserSymbolDocument>,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  }

  /* ======================
     Queries (lectura)
     ====================== */

  async listByAccount(accountId: string, market?: Market): Promise<UserSymbolDto[]> {
    try {
      const binAccId = this.toObjectId(accountId);
      const q: any = { binanceAccountId: binAccId };
      if (market) q.market = market;

      const rows = await this.model.find(q).sort({ createdAt: -1 }).lean();
      return toUserSymbolDtoList(rows);
    } catch (e) {
      this.log.error(`listByAccount failed: ${e?.message ?? e}`);
      if (e instanceof HttpException) throw e;
      throw new HttpException('Failed to list user symbols', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getById(id: string): Promise<UserSymbolDto> {
    try {
      const _id = this.toObjectId(id);
      const row = await this.model.findById(_id).lean();
      if (!row) throw new NotFoundException('UserSymbol not found');
      return toUserSymbolDto(row);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException('Failed to get user symbol', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /* ======================
     Mutations
     ====================== */

  async create(dto: CreateUserSymbolDto): Promise<UserSymbolDto> {
    try {
      // Normaliza símbolo a MAYÚSCULAS y sin espacios
      const symbol = dto.symbol.trim().toUpperCase();
      const binAccId = this.toObjectId(dto.binanceAccountId);

      const created = await this.model.create({
        binanceAccountId: binAccId,
        market: dto.market,
        symbol,
      });

      return toUserSymbolDto(created);
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new ConflictException('Symbol already saved for this account/market');
      }
      if (e instanceof HttpException) throw e;
      throw new HttpException('Failed to create user symbol', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, dto: UpdateUserSymbolDto): Promise<UserSymbolDto> {
    try {
      const _id = this.toObjectId(id);
      const update: any = {};

      if (dto.market !== undefined) update.market = dto.market;
      if (dto.symbol !== undefined) update.symbol = dto.symbol.trim().toUpperCase();

      const saved = await this.model.findByIdAndUpdate(_id, update, { new: true });
      if (!saved) throw new NotFoundException('UserSymbol not found');

      return toUserSymbolDto(saved);
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new ConflictException('Symbol already saved for this account/market');
      }
      if (e instanceof HttpException) throw e;
      throw new HttpException('Failed to update user symbol', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: string): Promise<{ ok: true }> {
    try {
      const _id = this.toObjectId(id);
      const res = await this.model.deleteOne({ _id });
      if (res.deletedCount === 0) throw new NotFoundException('UserSymbol not found');
      return { ok: true };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException('Failed to delete user symbol', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}