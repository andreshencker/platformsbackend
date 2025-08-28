import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { PlatformCategory, ConnectionType } from '../schemas/platform.schema';

export class UpdatePlatformDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PlatformCategory)
  category?: PlatformCategory;

  @IsOptional()
  @IsEnum(ConnectionType, { message: 'connectionType must be either apikey or oauth' })
  connectionType?: ConnectionType;

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