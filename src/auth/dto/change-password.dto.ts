import { IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsString() current!: string;
  @IsString() next!: string;
}