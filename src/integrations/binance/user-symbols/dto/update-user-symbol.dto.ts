// src/integrations/binance/user-symbols/dto/update-user-symbol.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Market } from '../schemas/user-symbol.schema';

export class UpdateUserSymbolDto {
  @IsOptional()
  @IsEnum(Market)
  market?: Market;

  @IsOptional()
  @IsString()
  symbol?: string;
}