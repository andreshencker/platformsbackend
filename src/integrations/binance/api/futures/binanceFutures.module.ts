import { Module } from '@nestjs/common';
import { BinanceFuturesService } from './binanceFutures.service';
import { BinanceFuturesController } from './binanceFutures.controller';
import { BinanceClientFactory } from '../binance-client.factory';

import { SecurityModule } from '../../../../common/security/security.module';
import { BinanceAccountsModule } from '../../binance-accounts/binance-accounts.module';

@Module({
  imports: [
    SecurityModule,
    BinanceAccountsModule,
  ],
  providers: [BinanceClientFactory, BinanceFuturesService],
  controllers: [BinanceFuturesController],
  exports: [BinanceFuturesService, BinanceClientFactory],
})
export class BinanceFuturesModule {}