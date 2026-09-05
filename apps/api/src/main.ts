import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { API_PREFIX } from '@mdiscovershop/shared';
import { StorageService } from './modules/storage/storage.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  // MinIO is not public — proxy browser requests under /uploads/* to the bucket
  app.use('/uploads', app.get(StorageService).proxyUploads());
  app.enableCors({
    origin: [
      config.get('APP_URL', 'http://localhost:3000'),
      config.get('ADMIN_URL', 'http://localhost:3002'),
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    credentials: true,
  });

  app.setGlobalPrefix(API_PREFIX.replace(/^\//, ''));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('mDISCOVER API')
    .setDescription('API REST — Plateforme E-commerce mDISCOVER')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentification client & admin')
    .addTag('products', 'Catalogue produits')
    .addTag('cart', 'Panier')
    .addTag('orders', 'Commandes')
    .addTag('admin', 'Administration')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}${API_PREFIX}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
