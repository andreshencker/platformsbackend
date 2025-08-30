// src/integrations/binance/user-symbols/dto/create-user-symbol.dto.ts
import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Market } from '../schemas/user-symbol.schema';

export class CreateUserSymbolDto {
  @IsMongoId()
  binanceAccountId!: string;

  @IsEnum(Market)
  market!: Market;

  @IsString()
  @IsNotEmpty()
  symbol!: string; // ej: BTCUSDT (en mayúsculas idealmente)
}