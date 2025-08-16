// src/integrations/binance-accounts/schemas/binance-account.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class BinanceAccount {
  _id: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Platform', required: true })
  platformId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  description: string;

  @Prop({ type: String, required: true, trim: true })
  apiKey: string;

  @Prop({ type: String, required: true, trim: true })
  apiSecret: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export type BinanceAccountDocument = HydratedDocument<BinanceAccount> & {
  createdAt: Date;
  updatedAt: Date;
};


export const BinanceAccountSchema = SchemaFactory.createForClass(BinanceAccount);

// índice único: un usuario no puede repetir descripción en la misma plataforma
BinanceAccountSchema.index(
  { userId: 1, platformId: 1, description: 1 },
  { unique: true },
);