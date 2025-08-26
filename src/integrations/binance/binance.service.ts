import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import Binance from 'binance-api-node';
import { Model, Types } from 'mongoose';
import { EncryptionService } from '../../common/security/encryption.service';
import { UserPlatform, UserPlatformDocument } from '../../user-platforms/schemas/user-platform.schema';
import { BinanceAccount, BinanceAccountDocument } from './binance-accounts/schemas/binance-account.schema';

@Injectable()
export class BinanceService {
  private readonly log = new Logger(BinanceService.name);

  constructor(
    @InjectModel(UserPlatform.name) private readonly userPlatformModel: Model<UserPlatformDocument>,
    @InjectModel(BinanceAccount.name) private readonly accountModel: Model<BinanceAccountDocument>,
    private readonly enc: EncryptionService,
  ) {}

  /** Obtiene userPlatform + binanceAccount (default si no se pasa id) y retorna credenciales desencriptadas */
  private async getCredsOrThrow(userId: Types.ObjectId, userPlatformId?: string) {
    let up: UserPlatformDocument | null = null;

    if (userPlatformId) {
      if (!Types.ObjectId.isValid(userPlatformId)) {
        throw new HttpException('Invalid userPlatformId', HttpStatus.BAD_REQUEST);
      }
      up = await this.userPlatformModel.findOne({ _id: new Types.ObjectId(userPlatformId), userId }).lean();
    } else {
      up = await this.userPlatformModel.findOne({ userId, isDefault: true }).lean();
    }

    if (!up) {
      throw new HttpException('User platform not found', HttpStatus.NOT_FOUND);
    }
    if (up.isActive === false) {
      throw new HttpException('User platform is inactive', HttpStatus.FORBIDDEN);
    }

    const acct = await this.accountModel
      .findOne({ userId, userPlatformId: up._id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    if (!acct) {
      throw new HttpException('Binance account not found for this user platform', HttpStatus.NOT_FOUND);
    }

    if (!acct.apiKey || !acct.apiSecret) {
      throw new HttpException('Missing API credentials', HttpStatus.BAD_REQUEST);
    }

    const apiKey = acct.apiKey.trim();
    const apiSecret = this.enc.decode(acct.apiSecret);
    if (!apiSecret) {
      throw new HttpException('Unable to decrypt API secret', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { apiKey, apiSecret, userPlatform: up, account: acct };
  }

  /** Devuelve un cliente del SDK ya listo para llamar endpoints (Spot/Futures por el mismo objeto base) */
  async getClientFor(userId: Types.ObjectId, userPlatformId?: string) {
    const { apiKey, apiSecret } = await this.getCredsOrThrow(userId, userPlatformId);
    return Binance({ apiKey, apiSecret });
  }

  /** Verifica credenciales (ej: llamada simple a /fapi/v2/account o ping spot) */
  async verifyKeys(userId: Types.ObjectId, userPlatformId?: string) {
    const client = await this.getClientFor(userId, userPlatformId);
    // prueba “inofensiva” – primero ping spot, luego info futures
    try {
      await client.ping();
    } catch (e) {
      this.log.warn(`Spot ping failed: ${String((e as any)?.message ?? e)}`);
    }

    try {
      await client.futuresAccountInfo();
      return { ok: true };
    } catch (err: any) {
      // mensajes útiles si IP no está allowlisted o keys inválidas
      const msg = err?.response?.data?.msg || err?.message || 'Verification failed';
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }
}