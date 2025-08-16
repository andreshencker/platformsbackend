// src/integrations/binance-accounts/dto/update-binance-account.dto.ts
import { IsOptional, IsString, IsBoolean, Length } from 'class-validator';

export class UpdateBinanceAccountDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  apiKey?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  apiSecret?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}