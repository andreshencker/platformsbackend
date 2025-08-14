import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlatformDocument = Platform & Document;

export enum PlatformCategory {
  TRADING = 'Trading',
  BROKER = 'Broker',
  BANKING = 'Banking',
  OTHERS = 'Others',
}

@Schema({ timestamps: true })
export class Platform {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ enum: PlatformCategory, required: true })
  category: PlatformCategory;

  @Prop()
  image: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const PlatformSchema = SchemaFactory.createForClass(Platform);
