import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlatformDocument = Platform & Document;

export enum PlatformCategory {
  EXCHANGE = 'exchange',
  BROKER = 'broker',
  DATA = 'data',
  CUSTODY = 'custody',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Platform {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ type: String, enum: Object.values(PlatformCategory), required: true })
  category: PlatformCategory;

  @Prop({ trim: true, default: '' })
  imageUrl?: string;

  @Prop({ default: true })
  isActive: boolean;

  /** Nuevo: indica si el frontend/backend tienen soporte para esta plataforma */
  @Prop({ default: false })
  isSupported: boolean;

  // timestamps (createdAt/updatedAt) los añade Mongoose por @Schema({ timestamps: true })
}

export const PlatformSchema = SchemaFactory.createForClass(Platform);

// Índice por nombre (único) ya está por Prop unique: true
// Puedes agregar más índices si luego haces búsquedas específicas:
// PlatformSchema.index({ category: 1, isActive: 1 });
