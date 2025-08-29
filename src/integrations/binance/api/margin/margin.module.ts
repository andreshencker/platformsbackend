// src/integrations/binance/api/margin/margin.module.ts
import { Module } from '@nestjs/common';
import { MarginService } from './margin.service';
import { MarginController } from './margin.controller';
import { BinanceClientFactory } from '../binance-client.factory';
import { SecurityModule } from '../../../../common/security/security.module';
import { BinanceAccountsModule } from '../../binance-accounts/binance-accounts.module';

@Module({
  imports: [SecurityModule, BinanceAccountsModule],
  providers: [BinanceClientFactory, MarginService],
  controllers: [MarginController],
  exports: [MarginService],
})
export class MarginModule {}