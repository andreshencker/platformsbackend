// src/integrations/binance/user-symbols/schemas/user-symbol.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

// Si ya tienes este enum en otro archivo común, impórtalo desde ahí.
// Lo dejo aquí para que sea autocontenido.
export enum Market {
  USDM = 'USDM',
  COINM = 'COINM',
  OPTIONS = 'OPTIONS',
  SPOT = 'SPOT',
  CROSS_MARGIN = 'CROSS_MARGIN',
  ISOLATED_MARGIN = 'ISOLATED_MARGIN',
}

@Schema({ timestamps: true, collection: 'binance_user_symbols' })
export class UserSymbol {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'BinanceAccount', required: true, index: true })
  binanceAccountId!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(Market), required: true, index: true })
  market!: Market;

  @Prop({ type: String, required: true, trim: true })
  symbol!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type UserSymbolDocument = HydratedDocument<UserSymbol>;
export const UserSymbolSchema = SchemaFactory.createForClass(UserSymbol);

// Evita duplicados por cuenta+mercado+símbolo
UserSymbolSchema.index(
  { binanceAccountId: 1, market: 1, symbol: 1 },
  { unique: true },
);