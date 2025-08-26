// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// importa tus módulos reales
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BinanceModule } from './integrations/binance/futures/binance.module';
import { PlatformsModule } from './platforms/platforms.module';
import { BinanceAccountsModule } from './integrations/binance/binance-accounts/binance-accounts.module';
import { UserPlatformsModule } from './user-platforms/user-platforms.module';


@Module({
  imports: [
    // 1) Habilita variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,               // disponible en todos los módulos
      envFilePath: '.env',          // ajusta si usas otro nombre/ruta
    }),

    // 2) Conecta Mongoose leyendo MONGODB_URI
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const uri = cfg.get<string>('MONGODB_URI'); // <-- EXACTO: MONGODB_URI
        if (!uri) {
          // log claro si la variable no está definida
          throw new Error('MONGODB_URI no está definido en .env');
        }

        // Si quieres ver el host en logs sin revelar credenciales:
        const safe = uri.replace(/\/\/.*:.*@/, '//<hidden>@');
        console.log('[Mongo] connecting to:', safe);

        return {
          uri,
          serverSelectionTimeoutMS: 8000,
        };
      },
    }),

    // 3) Resto de módulos
    AuthModule,
    UsersModule,
    BinanceModule,
    PlatformsModule,
    BinanceAccountsModule,
    UserPlatformsModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}