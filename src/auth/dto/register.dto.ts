import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @IsString() firstName!: string;
  @IsOptional() @IsString() middleName?: string;
  @IsString() lastName!: string;
  @IsOptional() @IsString() secondLastName?: string;

  @IsEmail() email!: string;
  @IsString() password!: string;
}