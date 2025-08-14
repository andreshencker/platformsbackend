import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { toMs, MIN_MS } from '../../common/time.util';

export class FuturesTradesQueryDto {
  @IsString()
  symbol!: string;

  @IsOptional()
  @Transform(({ value }) => toMs(value))
  @Type(() => Number)
  @IsInt()
  @Min(MIN_MS) // >= año 2000
  startTime?: number;

  @IsOptional()
  @Transform(({ value }) => toMs(value))
  @Type(() => Number)
  @IsInt()
  @Min(MIN_MS)
  endTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fromId?: number;
}