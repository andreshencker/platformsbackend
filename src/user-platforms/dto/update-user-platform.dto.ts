import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserPlatformDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}