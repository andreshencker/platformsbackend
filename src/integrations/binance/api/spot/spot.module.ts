// src/integrations/binance/api/spot/spot.module.ts
import { Module } from '@nestjs/common';
import { SpotService } from './spot.service';
import { SpotController } from './spot.controller';
import { BinanceClientFactory } from '../binance-client.factory';

import { SecurityModule } from '../../../../common/security/security.module';
import { BinanceAccountsModule } from '../../binance-accounts/binance-accounts.module';

@Module({
  imports: [
    // Para desencriptar llaves y leer cuentas del usuario
    SecurityModule,
    BinanceAccountsModule,
  ],
  providers: [
    BinanceClientFactory, // centraliza obtención y desencriptación de llaves
    SpotService,
  ],
  controllers: [SpotController],
  exports: [SpotService],
})
export class SpotModule {}