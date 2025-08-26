import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { FuturesTradesQueryDto } from './dtos/futures-trades.query';

type Market = 'USDM' | 'COINM' | 'OPTIONS';

@Controller('binance')
export class BinanceController {
  constructor(private readonly binance: BinanceService) {}

  /* ====== Símbolos por mercado ====== */
  @Get('markets/symbols')
  async marketSymbols(@Query('market') market: string) {
    const m = (market || 'USDM').toUpperCase() as Market;
    if (!['USDM', 'COINM', 'OPTIONS'].includes(m)) {
      throw new BadRequestException('market must be USDM | COINM | OPTIONS');
    }
    return this.binance.getSymbols(m);
  }

  /* ====== Trades por mercado (unificado) ====== */
  @Get('markets/trades')
  async marketTrades(@Query('market') market: string, @Query() q: FuturesTradesQueryDto) {
    const m = (market || 'USDM').toUpperCase() as Market;
    if (!['USDM', 'COINM', 'OPTIONS'].includes(m)) {
      throw new BadRequestException('market must be USDM | COINM | OPTIONS');
    }
    if (q.startTime && q.endTime && q.startTime > q.endTime) {
      throw new BadRequestException('startTime must be <= endTime');
    }

    const params = {
      symbol: q.symbol,            // requerido
      startTime: q.startTime,
      endTime: q.endTime,
      fromId: q.fromId,
      limit: q.limit ?? 1000,      // por defecto el máximo
    };
    Object.keys(params).forEach((k) => (params as any)[k] === undefined && delete (params as any)[k]);

    return this.binance.userTradesByMarket(m, params as any);
  }

  /* ====== (opcionales) ====== */
  @Get('futures/account')
  futuresAccount() {
    return this.binance.futuresAccount();
  }

  @Get('futures/positions')
  futuresPositions() {
    return this.binance.futuresPositions();
  }
}