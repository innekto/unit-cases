import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { join } from 'path';

import { AppModule } from './app.module';
import { logger } from './common';

config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const mode = configService.get<string>('NODE_ENV');
  const url = configService.get<string>('APP_URL');
  const port = configService.get<number>('PORT') || 3000;

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.set('trust proxy', 1);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Frame-Options',
    ],
    credentials: true,
  });

  app.useStaticAssets(join(__dirname, '..', 'node_modules', 'swagger-ui-dist'));

  const docConfig = new DocumentBuilder()
    .setTitle('Runner API')
    .setDescription(`Runner API - base URL: `)
    .setVersion('1.0')
    .addTag('Auth')
    .addTag('Users')
    .addTag('Cases')
    .addTag('Life-balance')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, docConfig);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  const path = mode === 'production' ? url : `http://localhost:${port}`;
  logger.log(`Application is running on: ${path}`);
  logger.log(`Swagger docs available at: ${path}/docs`);
}

bootstrap();
