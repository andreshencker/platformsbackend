import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { PlatformCategory } from '../schemas/platform.schema';

export class UpdatePlatformDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PlatformCategory)
  category?: PlatformCategory;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true }, { message: 'imageUrl must be a valid URL with protocol' })
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSupported?: boolean;
}