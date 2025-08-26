import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IncomeDocument = HydratedDocument<Income>;

@Schema({ collection: 'futures_income', timestamps: true })
export class Income {
  @Prop({ index: true }) symbol?: string;
  @Prop({ index: true }) incomeType: string;   // REALIZED_PNL, COMMISSION, FUNDING_FEE...
  @Prop() income: string;
  @Prop({ index: true }) time: number;
  @Prop() tranId?: number;
  @Prop() info?: string;
}
export const IncomeSchema = SchemaFactory.createForClass(Income);
IncomeSchema.index({ incomeType: 1, time: -1 });