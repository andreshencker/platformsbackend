// src/integrations/binance/api/spot/spot.service.ts
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { BinanceClientFactory } from '../binance-client.factory';

export type SpotUserTradesParams = {
  symbol: string;
  startTime?: number;
  endTime?: number;
  fromId?: number;
  limit?: number;       // 1–1000 (default 500)
  recvWindow?: number;
};

@Injectable()
export class SpotService {
  private readonly log = new Logger(SpotService.name);

  constructor(private readonly factory: BinanceClientFactory) {}

  /** Symbols from /api/v3/exchangeInfo (spot) */
  async getSymbols(): Promise<string[]> {
    try {
      const { data } = await axios.get<any>('https://api.binance.com/api/v3/exchangeInfo');
      const arr: any[] = Array.isArray(data?.symbols) ? data.symbols : [];
      return arr
        .filter((s) => (s?.status ?? 'TRADING') === 'TRADING')
        .map((s) => s.symbol)
        .filter(Boolean)
        .sort();
    } catch (e: any) {
      const msg = e?.response?.data?.msg || e?.message || 'Failed to fetch spot symbols';
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  /** GET /api/v3/myTrades (signed) */
  async userTrades(accountId: string, p: SpotUserTradesParams) {
    if (!p?.symbol) throw new HttpException('symbol is required', HttpStatus.BAD_REQUEST);

    try {
      const { http } = await this.factory.spot(accountId);
      const { data } = await http.get('/api/v3/myTrades', {
        params: {
          symbol: p.symbol,
          startTime: p.startTime,
          endTime: p.endTime,
          fromId: p.fromId,
          limit: p.limit,
          recvWindow: p.recvWindow ?? 5000,
        },
        // marcar que este GET debe ir firmado
        // (el interceptor añadirá timestamp y signature)
        // @ts-ignore
        _signed: true,
      } as any);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.msg || e?.message || 'Spot userTrades failed';
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  /** GET /api/v3/account (balances, permissions…) */
  async accountInfo(accountId: string) {
    try {
      const { http } = await this.factory.spot(accountId);
      const { data } = await http.get('/api/v3/account', {
        params: { recvWindow: 5000 },
        // @ts-ignore
        _signed: true,
      } as any);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.msg || e?.message || 'Spot account failed';
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  /** Open orders (no firmado si pasas solo symbol? Para seguridad: lo firmamos) */
  async openOrders(accountId: string, symbol?: string) {
    try {
      const { http } = await this.factory.spot(accountId);
      const { data } = await http.get('/api/v3/openOrders', {
        params: { symbol, recvWindow: 5000 },
        // @ts-ignore
        _signed: true,
      } as any);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.msg || e?.message || 'Spot openOrders failed';
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }
}