// src/integrations/binance-accounts/binance-accounts.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BinanceAccountsController } from './binance-accounts.controller';
import { BinanceAccountsService } from './binance-accounts.service';
import { BinanceAccount, BinanceAccountSchema } from './schemas/binance-account.schema';
import { Platform, PlatformSchema } from '../../platforms/schemas/platform.schema';
import { SecurityModule } from '../../common/security/security.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BinanceAccount.name, schema: BinanceAccountSchema },
      { name: Platform.name, schema: PlatformSchema },
    ]),
    SecurityModule,
  ],
  controllers: [BinanceAccountsController],
  providers: [BinanceAccountsService],
  exports: [BinanceAccountsService],
})
export class BinanceAccountsModule {}