import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TradeDocument = HydratedDocument<Trade>;

@Schema({ collection: 'futures_trades', timestamps: true })
export class Trade {
  @Prop({ index: true }) symbol: string;
  @Prop({ index: true }) id: number; // tradeId de Binance
  @Prop() orderId: number;
  @Prop() side: 'BUY' | 'SELL';
  @Prop() price: string;
  @Prop() qty: string;
  @Prop() quoteQty?: string;
  @Prop() realizedPnl?: string;
  @Prop({ index: true }) time: number; // epoch ms
  @Prop() commission?: string;
  @Prop() commissionAsset?: string;
}
export const TradeSchema = SchemaFactory.createForClass(Trade);
TradeSchema.index({ symbol: 1, id: 1 }, { unique: true });