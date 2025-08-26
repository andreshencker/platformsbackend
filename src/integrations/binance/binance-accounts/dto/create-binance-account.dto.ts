import { IsBoolean, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBinanceAccountDto {
  @IsMongoId()
  userPlatformId!: string;

  @IsString()
  @MinLength(8)
  apiKey!: string;

  @IsString()
  @MinLength(8)
  apiSecret!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}