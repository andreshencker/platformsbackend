import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BinanceService } from './binance.service';
import { EncryptionService } from '../../common/security/encryption.service';
import { UserPlatform, UserPlatformSchema } from '../../user-platforms/schemas/user-platform.schema';
import { BinanceAccount, BinanceAccountSchema } from './binance-accounts/schemas/binance-account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserPlatform.name, schema: UserPlatformSchema },
      { name: BinanceAccount.name, schema: BinanceAccountSchema },
    ]),
  ],
  providers: [BinanceService, EncryptionService],
  exports: [BinanceService],
})
export class BinanceModule {}