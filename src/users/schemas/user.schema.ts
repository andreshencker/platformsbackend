import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
}

@Schema({ timestamps: true })
export class User {
  // Nombres y apellidos en inglés, con segundo apellido
  @Prop({ required: true }) firstName: string;
  @Prop() middleName?: string;
  @Prop({ required: true }) lastName: string;
  @Prop() secondLastName?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  // Guarda el HASH
  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.CLIENT })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ trim: true }) avatarUrl?: string;

  // Tipado explícito (timestamps los setea mongoose)
  @Prop() createdAt?: Date;
  @Prop() updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);