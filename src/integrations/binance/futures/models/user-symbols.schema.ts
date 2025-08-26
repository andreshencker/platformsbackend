
// src/binance/models/user-symbols.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserSymbolsDocument = HydratedDocument<UserSymbols>;

@Schema({ collection: 'user_symbols', timestamps: true })
export class UserSymbols {
  @Prop({ index: true, unique: true })
  userId: string;

  @Prop({ type: [String], default: [] })
  symbols: string[];
}

export const UserSymbolsSchema = SchemaFactory.createForClass(UserSymbols);