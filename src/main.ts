// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS y validación global

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        // 👇 imprime en consola exactamente qué campo falló
        const details = errors.flatMap((e) => Object.values(e.constraints ?? {}));
        console.error('[ValidationError]', JSON.stringify(errors, null, 2));
        return new BadRequestException(details.length ? details : 'Validation failed');
      },
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Binance Futures API')
    .setDescription('API para consultar Binance Futures y (opcional) persistir en MongoDB')
    .setVersion('1.0.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-api-key', in: 'header', description: 'API key interna (opcional)' },
      'internal',
    )
    .build();

  app.enableCors({
    origin: ['http://localhost:5173'], // tu frontend
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: '/docs/json' });

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);

  console.log(`🚀 Server running: http://localhost:${port}`);
  console.log(`📘 Swagger docs:  http://localhost:${port}/docs`);
}
bootstrap();