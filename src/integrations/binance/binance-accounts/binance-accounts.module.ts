import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BinanceAccountsController } from './binance-accounts.controller';
import { BinanceAccountsService } from './binance-accounts.service';
import { BinanceAccount, BinanceAccountSchema } from './schemas/binance-account.schema';
import { UserPlatform, UserPlatformSchema } from '../../../user-platforms/schemas/user-platform.schema';
import { EncryptionService } from '../../../common/security/encryption.service';
import { BinanceModule } from '../binance.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BinanceAccount.name, schema: BinanceAccountSchema },
      { name: UserPlatform.name, schema: UserPlatformSchema },
    ]),
    BinanceModule,
  ],
  controllers: [BinanceAccountsController],
  providers: [BinanceAccountsService, EncryptionService],
  exports: [BinanceAccountsService],
})
export class BinanceAccountsModule {}