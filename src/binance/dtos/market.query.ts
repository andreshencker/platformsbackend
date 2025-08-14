import { IsIn, IsOptional } from 'class-validator';

export class MarketQueryDto {
  @IsIn(['USDM', 'COINM', 'OPTIONS'])
  market: 'USDM' | 'COINM' | 'OPTIONS';
}