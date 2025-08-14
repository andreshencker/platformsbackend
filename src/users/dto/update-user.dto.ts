import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() secondLastName?: string;

  @IsOptional() @IsEmail() email?: string;

  // OJO: password se gestiona en flujo aparte (cambio de contraseña), no aquí
  // @IsOptional() @IsString() password?: string;

  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsBoolean() isActive?: boolean;
}