import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PlatformCategory } from '../schemas/platform.schema';

export class CreatePlatformDto {
  @IsString()
  name: string;

  @IsEnum(PlatformCategory, { message: 'category must be a valid PlatformCategory' })
  category: PlatformCategory;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // por defecto true en el schema
}