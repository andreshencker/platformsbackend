// src/integrations/binance/api/futures/binanceFutures.service.ts
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { BinanceClientFactory } from '../binance-client.factory';
export type Market = 'USDM' | 'COINM' | 'OPTIONS';
export type UserTradesParams = {
  symbol: string;
  startTime?: number;
  endTime?: number;
  fromId?: number;
  limit?: number;
  recvWindow?: number;
};

@Injectable()
export class BinanceFuturesService {
  private readonly log = new Logger(BinanceFuturesService.name);

  constructor(private readonly factory: BinanceClientFactory) {}

  /* ===========================
     Trades por mercado (firmado)
     =========================== */

  async usdmUserTrades(accountId: string, p: UserTradesParams) {
    try {
      const { http, creds } = await this.factory.fapi(accountId);
      const query = this.factory.sign(
        {
          symbol: p.symbol,
          startTime: p.startTime,
          endTime: p.endTime,
          fromId: p.fromId,
          limit: p.limit,
          recvWindow: p.recvWindow ?? 5000,
          timestamp: Date.now(),
        },
        creds.apiSecret,
      );
      const { data } = await http.get(`/fapi/v1/userTrades?${query}`);
      return data;
    } catch (e: any) {
      const msg = this.factory.extractAxiosMessage(e, 'USDM userTrades failed');
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  async coinmUserTrades(accountId: string, p: UserTradesParams) {
    try {
      const { http, creds } = await this.factory.dapi(accountId);
      const query = this.factory.sign(
        {
          symbol: p.symbol,
          startTime: p.startTime,
          endTime: p.endTime,
          fromId: p.fromId,
          limit: p.limit,
          recvWindow: p.recvWindow ?? 5000,
          timestamp: Date.now(),
        },
        creds.apiSecret,
      );
      const { data } = await http.get(`/dapi/v1/userTrades?${query}`);
      return data;
    } catch (e: any) {
      const msg = this.factory.extractAxiosMessage(e, 'COINM userTrades failed');
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  async optionsUserTrades(accountId: string, p: UserTradesParams) {
    try {
      const { http, creds } = await this.factory.eapi(accountId);
      const query = this.factory.sign(
        {
          symbol: p.symbol,
          startTime: p.startTime,
          endTime: p.endTime,
          fromId: p.fromId,
          limit: p.limit,
          recvWindow: p.recvWindow ?? 5000,
          timestamp: Date.now(),
        },
        creds.apiSecret,
      );
      const { data } = await http.get(`/eapi/v1/userTrades?${query}`);
      return data;
    } catch (e: any) {
      const msg = this.factory.extractAxiosMessage(e, 'OPTIONS userTrades failed');
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  async userTradesByMarket(market: Market, accountId: string, p: UserTradesParams) {
    switch (market) {
      case 'USDM':
        return this.usdmUserTrades(accountId, p);
      case 'COINM':
        return this.coinmUserTrades(accountId, p);
      case 'OPTIONS':
        return this.optionsUserTrades(accountId, p);
      default:
        return this.usdmUserTrades(accountId, p);
    }
  }

  /* ===========================
     Símbolos por mercado (público)
     =========================== */

  async getUsdmSymbols(): Promise<string[]> {
    const { data } = await axios.get<any>('https://fapi.binance.com/fapi/v1/exchangeInfo');
    const arr: any[] = Array.isArray(data?.symbols) ? data.symbols : [];
    return arr
      .filter((s) => (s?.status ?? 'TRADING') === 'TRADING' && s?.contractType === 'PERPETUAL')
      .map((s) => s.symbol)
      .filter(Boolean)
      .sort();
  }

  async getCoinmSymbols(): Promise<string[]> {
    const { data } = await axios.get<any>('https://dapi.binance.com/dapi/v1/exchangeInfo');
    const arr: any[] =
      (Array.isArray(data?.symbols) && data.symbols) ||
      (Array.isArray(data?.contracts) && data.contracts) ||
      [];
    const out = arr
      .filter((s) => (s?.status ?? 'TRADING') === 'TRADING' && s?.contractType === 'PERPETUAL')
      .map((s) => s.symbol)
      .filter(Boolean)
      .sort();
    if (out.length) return out;

    return arr
      .filter((s) => (s?.status ?? 'TRADING') === 'TRADING' && s?.symbol)
      .map((s) => s.symbol)
      .sort();
  }

  async getOptionSymbols(): Promise<string[]> {
    const { data } = await axios.get<any>('https://eapi.binance.com/eapi/v1/exchangeInfo');
    const arr: any[] =
      (Array.isArray(data?.optionSymbols) && data.optionSymbols) ||
      (Array.isArray(data?.symbols) && data.symbols) ||
      (Array.isArray(data?.optionContracts) && data.optionContracts) ||
      [];
    return arr
      .filter((s) => (s?.status ?? s?.contractStatus ?? 'TRADING') === 'TRADING')
      .map((s) =>
        s.symbol || (s.baseAsset && s.quoteAsset ? `${s.baseAsset}${s.quoteAsset}` : s.symbolName),
      )
      .filter(Boolean)
      .sort();
  }

  getSymbols(market: Market): Promise<string[]> {
    switch (market) {
      case 'USDM':
        return this.getUsdmSymbols();
      case 'COINM':
        return this.getCoinmSymbols();
      case 'OPTIONS':
        return this.getOptionSymbols();
      default:
        return this.getUsdmSymbols();
    }
  }

  /* ===========================
     Cuenta y posiciones USDM (firmado)
     =========================== */

  // /fapi/v2/account (firmado)
  async futuresAccount(accountId: string) {
    try {
      const { http, creds } = await this.factory.fapi(accountId);
      const query = this.factory.sign(
        {
          timestamp: Date.now(),
          recvWindow: 5000,
        },
        creds.apiSecret,
      );
      const { data } = await http.get(`/fapi/v2/account?${query}`);
      return data;
    } catch (e: any) {
      const msg = this.factory.extractAxiosMessage(e, 'USDM account failed');
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  // /fapi/v2/positionRisk (firmado)
  async futuresPositions(accountId: string) {
    try {
      const { http, creds } = await this.factory.fapi(accountId);
      const query = this.factory.sign(
        {
          timestamp: Date.now(),
          recvWindow: 5000,
        },
        creds.apiSecret,
      );
      const { data } = await http.get(`/fapi/v2/positionRisk?${query}`);
      return data;
    } catch (e: any) {
      const msg = this.factory.extractAxiosMessage(e, 'USDM positions failed');
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }
}