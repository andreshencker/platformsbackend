// src/integrations/binance/api/binance-client.factory.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { BinanceAccountsService } from '../../binance/binance-accounts/binance-accounts.service';
import AxiosInstance = Axios.AxiosInstance;



type DecryptedCreds = {
  apiKey: string;
  apiSecret: string;
};

@Injectable()
export class BinanceClientFactory {
  private readonly log = new Logger(BinanceClientFactory.name);

  constructor(private readonly accounts: BinanceAccountsService) {}

  /* =========================
     Credenciales desencriptadas
     ========================= */
  private async getCreds(accountId: string): Promise<DecryptedCreds> {
    try {
      if (!accountId || typeof accountId !== 'string') {
        throw new HttpException('Invalid accountId', HttpStatus.BAD_REQUEST);
      }
      const creds = await this.accounts.getDecryptedCredsOrThrow(accountId);
      if (!creds?.apiKey || !creds?.apiSecret) {
        throw new HttpException('Missing API credentials in account', HttpStatus.BAD_REQUEST);
      }
      return creds;
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      this.log.error(`getCreds failed: ${e?.message ?? e}`);
      throw new HttpException('Could not load credentials', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /* =========================
     Instancias HTTP por mercado
     ========================= */
  async fapi(accountId: string): Promise<{ http: AxiosInstance; creds: DecryptedCreds }> {
    const creds = await this.getCreds(accountId);
    try {
      const http = axios.create({
        baseURL: 'https://fapi.binance.com',
        timeout: 15000,
        headers: { 'X-MBX-APIKEY': creds.apiKey },
      });
      return { http, creds };
    } catch (e: any) {
      this.log.error(`FAPI client init failed: ${e?.message ?? e}`);
      throw new HttpException('Failed to init FAPI client', HttpStatus.BAD_GATEWAY);
    }
  }

  async dapi(accountId: string): Promise<{ http: AxiosInstance; creds: DecryptedCreds }> {
    const creds = await this.getCreds(accountId);
    try {
      const http = axios.create({
        baseURL: 'https://dapi.binance.com',
        timeout: 15000,
        headers: { 'X-MBX-APIKEY': creds.apiKey },
      });
      return { http, creds };
    } catch (e: any) {
      this.log.error(`DAPI client init failed: ${e?.message ?? e}`);
      throw new HttpException('Failed to init DAPI client', HttpStatus.BAD_GATEWAY);
    }
  }

  async eapi(accountId: string): Promise<{ http: AxiosInstance; creds: DecryptedCreds }> {
    const creds = await this.getCreds(accountId);
    try {
      const http = axios.create({
        baseURL: 'https://eapi.binance.com',
        timeout: 15000,
        headers: { 'X-MBX-APIKEY': creds.apiKey },
      });
      return { http, creds };
    } catch (e: any) {
      this.log.error(`EAPI client init failed: ${e?.message ?? e}`);
      throw new HttpException('Failed to init EAPI client', HttpStatus.BAD_GATEWAY);
    }
  }
  async sapi(accountId: string): Promise<{ http: AxiosInstance; creds: DecryptedCreds }> {
    const creds = await this.getCreds(accountId);
    try {
      const http = axios.create({
        baseURL: 'https://api.binance.com',
        timeout: 15000,
        headers: { 'X-MBX-APIKEY': creds.apiKey },
      });
      return { http, creds };
    } catch (e: any) {
      this.log.error(`SAPI client init failed: ${e?.message ?? e}`);
      throw new HttpException('Failed to init SAPI client', HttpStatus.BAD_GATEWAY);
    }
  }

  /** Aliases para que tus services actuales no cambien */
  async spot(accountId: string) {
    return this.sapi(accountId);
  }
  async marginCross(accountId: string) {
    return this.sapi(accountId);
  }
  async marginIsolated(accountId: string) {
    return this.sapi(accountId);
  }

  /* =========================
     Firma de consultas (HMAC)
     ========================= */
  sign(
    params: Record<string, string | number | boolean | undefined>,
    apiSecret: string,
  ): string {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');

    const signature = crypto.createHmac('sha256', apiSecret).update(qs).digest('hex');
    return `${qs}&signature=${signature}`;
  }

  /* =========================
     Normalizador de errores axios
     ========================= */
  extractAxiosMessage(e: any, fallback = 'Binance request failed'): string {
    return (
      e?.response?.data?.msg ||
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      fallback
    );
  }
}