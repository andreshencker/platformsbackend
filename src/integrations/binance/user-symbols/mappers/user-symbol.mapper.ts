
import type { UserSymbol } from '../schemas/user-symbol.schema';

export type UserSymbolDto = {
  id: string;
  binanceAccountId: string;
  market: string;
  symbol: string;
  createdAt?: string;
  updatedAt?: string;
};

export const toUserSymbolDto = (doc: any): UserSymbolDto => {
  const src = typeof doc?.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(src._id),
    binanceAccountId: String(src.binanceAccountId),
    market: String(src.market),
    symbol: String(src.symbol),
    createdAt: src.createdAt ? new Date(src.createdAt).toISOString() : undefined,
    updatedAt: src.updatedAt ? new Date(src.updatedAt).toISOString() : undefined,
  };
};

export const toUserSymbolDtoList = (docs: any[]): UserSymbolDto[] =>
  docs.map(toUserSymbolDto);