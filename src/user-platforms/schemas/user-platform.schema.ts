import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type UserPlatformDocument = HydratedDocument<UserPlatform>;

export enum UserPlatformStatus {
  Pending = 'pending',
  Connected = 'connected',
  Disconnected = 'disconnected',
  Error = 'error',
}

@Schema({
  timestamps: true,
  collection: 'user_platforms',
  // 👇 importante para que los virtuales se incluyan en las respuestas
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserPlatform {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Platform', required: true, index: true })
  platformId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(UserPlatformStatus),
    default: UserPlatformStatus.Pending,
    index: true,
  })
  status!: UserPlatformStatus;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  /** Bandera para plataforma por defecto del usuario */
  @Prop({ type: Boolean, default: false, index: true })
  isDefault!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserPlatformSchema = SchemaFactory.createForClass(UserPlatform);

// Único por (userId, platformId)
UserPlatformSchema.index({ userId: 1, platformId: 1 }, { unique: true });

/**
 * Virtual populate: expone un campo "platform" con la doc de Platform
 * sin reemplazar platformId. Así tendrás ambos: platformId (ObjectId) y
 * platform (objeto con name, imageUrl, connectionType, etc.)
 */
UserPlatformSchema.virtual('platform', {
  ref: 'Platform',
  localField: 'platformId',
  foreignField: '_id',
  justOne: true,
  options: {
    // Campos que queremos traer de Platform
    select: 'name category imageUrl isActive isSupported connectionType',
  },
});