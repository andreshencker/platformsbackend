import { Injectable, Logger } from '@nestjs/common';
import Binance from 'binance-api-node';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

type Market = 'USDM' | 'COINM' | 'OPTIONS';

type UserTradesParams = {
  symbol: string;
  startTime?: number;
  endTime?: number;
  fromId?: number;
  limit?: number;
  recvWindow?: number;
};

@Injectable()
export class BinanceService {
  private readonly log = new Logger(BinanceService.name);

  private readonly apiKey: string;
  private readonly apiSecret: string;

  // USDM: usamos binance-api-node
  private readonly fapiClient: ReturnType<typeof Binance>;

  // COIN-M y OPTIONS: axios firmado
  private readonly dapi: ReturnType<typeof axios.create>;
  private readonly eapi: ReturnType<typeof axios.create>;

  constructor(private readonly config: ConfigService) {
    // Lee de `binance.apiKey` o fallback a `BINANCE_API_KEY`
    const k =
      this.config.get<string>('binance.apiKey') ??
      this.config.get<string>('BINANCE_API_KEY');
    const s =
      this.config.get<string>('binance.apiSecret') ??
      this.config.get<string>('BINANCE_API_SECRET');

    if (!k || !s) {
      throw new Error(
        'Binance API key/secret no configurados (binance.apiKey / BINANCE_API_KEY).',
      );
    }
    this.apiKey = k;
    this.apiSecret = s;

    this.fapiClient = Binance({
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
    });

    this.dapi = axios.create({
      baseURL: 'https://dapi.binance.com',
      headers: { 'X-MBX-APIKEY': this.apiKey },
      timeout: 15000,
    });

    this.eapi = axios.create({
      baseURL: 'https://eapi.binance.com',
      headers: { 'X-MBX-APIKEY': this.apiKey },
      timeout: 15000,
    });
  }

  /* ============ Helpers de firma ============ */
  private sign(params: Record<string, string | number | undefined>) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');

    const signature = crypto.createHmac('sha256', this.apiSecret).update(qs).digest('hex');
    return `${qs}&signature=${signature}`;
  }

  /* ============ Trades por mercado ============ */

  // USDM (fapi) via SDK
  usdmUserTrades(params: UserTradesParams) {
    return this.fapiClient.futuresUserTrades(params);
  }

  // COIN-M (dapi) via axios firmado
  async coinmUserTrades(params: UserTradesParams) {
    const query = this.sign({
      ...params,
      recvWindow: params.recvWindow ?? 5000,
      timestamp: Date.now(),
    });
    const { data } = await this.dapi.get(`/dapi/v1/userTrades?${query}`);
    return data;
  }

  // OPTIONS (eapi) via axios firmado
  async optionsUserTrades(params: UserTradesParams) {
    const query = this.sign({
      ...params,
      recvWindow: params.recvWindow ?? 5000,
      timestamp: Date.now(),
    });
    const { data } = await this.eapi.get(`/eapi/v1/userTrades?${query}`);
    return data;
  }

  // Switch unificado (lo llama el controller)
  userTradesByMarket(market: Market, params: UserTradesParams) {
    switch (market) {
      case 'USDM':
        return this.usdmUserTrades(params);
      case 'COINM':
        return this.coinmUserTrades(params);
      case 'OPTIONS':
        return this.optionsUserTrades(params);
      default:
        return this.usdmUserTrades(params);
    }
  }

  /* ============ Símbolos por mercado ============ */

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
    // fallback menos estricto
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
      .map(
        (s) => s.symbol || (s.baseAsset && s.quoteAsset ? `${s.baseAsset}${s.quoteAsset}` : s.symbolName),
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

  /* ============ Extras (controller los usa) ============ */
  futuresAccount() {
    return this.fapiClient.futuresAccountInfo();
  }

  futuresPositions() {
    return this.fapiClient.futuresPositionRisk();
  }
}