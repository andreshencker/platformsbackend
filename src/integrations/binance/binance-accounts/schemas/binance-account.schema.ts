import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BinanceAccountDocument = HydratedDocument<BinanceAccount>;

@Schema({ timestamps: true, collection: 'binance_accounts' })
export class BinanceAccount {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserPlatform', required: true, index: true })
  userPlatformId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  apiKey!: string;

  @Prop({ type: String, required: true }) // cifrada
  apiSecret!: string;

  @Prop({ type: String, default: '' })
  description?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Boolean, default: false, index: true })
  isDefault!: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt?: Date;
}

export const BinanceAccountSchema = SchemaFactory.createForClass(BinanceAccount);

BinanceAccountSchema.index(
  { userId: 1, userPlatformId: 1, description: 1 },
  { unique: true, partialFilterExpression: { description: { $type: 'string' } } },
);