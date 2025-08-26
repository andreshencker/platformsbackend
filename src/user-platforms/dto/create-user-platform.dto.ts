import { IsMongoId, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserPlatformDto {
  @IsMongoId()
  platformId!: string;

  /** Permite marcar esta relación como default al crearla */
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}