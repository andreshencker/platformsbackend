import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BinanceClientFactory } from '../binance-client.factory';

/** CROSS | ISOLATED */
export type MarginMarket = 'CROSS' | 'ISOLATED';

export type MarginTradesParams = {
  symbol: string;
  startTime?: number;
  endTime?: number;
  fromId?: number;
  limit?: number;        // 1–1000
  recvWindow?: number;   // default 5000
};

@Injectable()
export class MarginService {
  private readonly log = new Logger(MarginService.name);

  constructor(private readonly factory: BinanceClientFactory) {}

  /* ===========================
     Implementaciones por mercado
     =========================== */

  /** CROSS: /sapi/v1/margin/myTrades */
  private async crossTrades(accountId: string, p: MarginTradesParams) {
    try {
      const { http } = await this.factory.marginCross(accountId);
      const { data } = await http.get('/sapi/v1/margin/myTrades', {
        params: {
          symbol: p.symbol,
          startTime: p.startTime,
          endTime: p.endTime,
          fromId: p.fromId,
          limit: p.limit,
          recvWindow: p.recvWindow ?? 5000,
        },
        // @ts-ignore
        _signed: true,
      } as any);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.msg || e?.message || 'Cross Margin userTrades failed';
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  /** ISOLATED: /sapi/v1/margin/isolated/myTrades */
  private async isolatedTrades(accountId: string, p: MarginTradesParams) {
    try {
      const { http } = await this.factory.marginIsolated(accountId);
      const { data } = await http.get('/sapi/v1/margin/isolated/myTrades', {
        params: {
          symbol: p.symbol,
          startTime: p.startTime,
          endTime: p.endTime,
          fromId: p.fromId,
          limit: p.limit,
          recvWindow: p.recvWindow ?? 5000,
        },
        // @ts-ignore
        _signed: true,
      } as any);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.msg || e?.message || 'Isolated Margin userTrades failed';
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  /** CROSS: /sapi/v1/margin/account */
  private async crossAccount(accountId: string) {
    try {
      const { http } = await this.factory.marginCross(accountId);
      const { data } = await http.get('/sapi/v1/margin/account', {
        params: { recvWindow: 5000 },
        // @ts-ignore
        _signed: true,
      } as any);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.msg || e?.message || 'Cross Margin account failed';
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  /** ISOLATED: /sapi/v1/margin/isolated/account (symbols csv opcional) */
  private async isolatedAccount(accountId: string, symbolsCsv?: string) {
    try {
      const { http } = await this.factory.marginIsolated(accountId);
      const { data } = await http.get('/sapi/v1/margin/isolated/account', {
        params: { symbols: symbolsCsv, recvWindow: 5000 },
        // @ts-ignore
        _signed: true,
      } as any);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.msg || e?.message || 'Isolated Margin account failed';
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  /** CROSS: /sapi/v1/margin/openOrders */
  private async crossOpenOrders(accountId: string, symbol?: string) {
    try {
      const { http } = await this.factory.marginCross(accountId);
      const { data } = await http.get('/sapi/v1/margin/openOrders', {
        params: { symbol, recvWindow: 5000 },
        // @ts-ignore
        _signed: true,
      } as any);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.msg || e?.message || 'Cross Margin openOrders failed';
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  /** ISOLATED: /sapi/v1/margin/openOrders?isIsolated=TRUE */
  private async isolatedOpenOrders(accountId: string, symbol?: string) {
    try {
      const { http } = await this.factory.marginIsolated(accountId);
      const { data } = await http.get('/sapi/v1/margin/openOrders', {
        params: { isIsolated: 'TRUE', symbol, recvWindow: 5000 },
        // @ts-ignore
        _signed: true,
      } as any);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.msg || e?.message || 'Isolated Margin openOrders failed';
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  /* ===========================
     Switch unificado por market
     =========================== */

  async userTradesByMarket(market: MarginMarket, accountId: string, p: MarginTradesParams) {
    if (!p?.symbol) throw new HttpException('symbol is required', HttpStatus.BAD_REQUEST);

    switch (market) {
      case 'CROSS':
        return this.crossTrades(accountId, p);
      case 'ISOLATED':
        return this.isolatedTrades(accountId, p);
      default:
        throw new HttpException('Invalid market (use CROSS | ISOLATED)', HttpStatus.BAD_REQUEST);
    }
  }

  async accountByMarket(market: MarginMarket, accountId: string, symbolsCsv?: string) {
    switch (market) {
      case 'CROSS':
        return this.crossAccount(accountId);
      case 'ISOLATED':
        return this.isolatedAccount(accountId, symbolsCsv);
      default:
        throw new HttpException('Invalid market (use CROSS | ISOLATED)', HttpStatus.BAD_REQUEST);
    }
  }

  async openOrdersByMarket(market: MarginMarket, accountId: string, symbol?: string) {
    switch (market) {
      case 'CROSS':
        return this.crossOpenOrders(accountId, symbol);
      case 'ISOLATED':
        return this.isolatedOpenOrders(accountId, symbol);
      default:
        throw new HttpException('Invalid market (use CROSS | ISOLATED)', HttpStatus.BAD_REQUEST);
    }
  }
}