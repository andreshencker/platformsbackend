import { IsArray, IsString, ArrayUnique, ArrayMaxSize } from 'class-validator';

export class SaveUserSymbolsDto {
  @IsString()
  userId: string;

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(500)
  symbols: string[];
}

export class RemoveUserSymbolDto {
  @IsString() userId: string;
  @IsString() symbol: string;
}
