// src/integrations/binance/user-symbols/user-symbols.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserSymbolsController } from './user-symbols.controller';
import { UserSymbolsService } from './user-symbols.service';

import { UserSymbol, UserSymbolSchema } from './schemas/user-symbol.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSymbol.name, schema: UserSymbolSchema },
    ]),
  ],
  controllers: [UserSymbolsController],
  providers: [UserSymbolsService],
  exports: [UserSymbolsService],
})
export class UserSymbolsModule {}