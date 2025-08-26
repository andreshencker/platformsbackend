// src/binance/binance.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BinanceController } from './binance.controller';
import { BinanceService } from './binance.service';

import { Trade, TradeSchema } from './models/trade.schema';
import { Income, IncomeSchema } from './models/income.schema';
import { UserSymbols, UserSymbolsSchema } from './models/user-symbols.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trade.name, schema: TradeSchema },
      { name: Income.name, schema: IncomeSchema },
      { name: UserSymbols.name, schema: UserSymbolsSchema }, // <- nuevo
    ]),
  ],
  controllers: [BinanceController],
  providers: [BinanceService],
  exports: [BinanceService],
})
export class BinanceModule {}