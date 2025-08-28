import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserAdminDto {
  @IsString() @IsNotEmpty() firstName!: string;
  @IsOptional() @IsString() middleName?: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsOptional() @IsString() secondLastName?: string;

  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;

  @IsEnum(UserRole) role!: UserRole;
  @IsOptional() @IsBoolean() isActive?: boolean;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;
}