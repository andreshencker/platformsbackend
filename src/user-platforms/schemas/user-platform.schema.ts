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

  /** Nuevo: bandera para saber la plataforma por defecto del usuario */
  @Prop({ type: Boolean, default: false, index: true })
  isDefault!: boolean;

  // timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserPlatformSchema = SchemaFactory.createForClass(UserPlatform);

// Único por (userId, platformId)
UserPlatformSchema.index({ userId: 1, platformId: 1 }, { unique: true });