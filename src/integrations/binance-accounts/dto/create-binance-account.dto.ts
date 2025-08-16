// src/integrations/binance-accounts/dto/create-binance-account.dto.ts
import { IsMongoId, IsOptional, IsString, IsBoolean, Length } from 'class-validator';

export class CreateBinanceAccountDto {
  @IsMongoId()
  platformId!: string;

  @IsString()
  @Length(1, 100)
  description!: string;

  @IsString()
  @Length(1, 200)
  apiKey!: string;

  @IsString()
  @Length(1, 200)
  apiSecret!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}