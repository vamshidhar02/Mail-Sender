import 'reflect-metadata';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const prefix = config.get<string>('app.prefix', 'api');
  const port = config.get<number>('app.port', 4000);
  const origins = config.get<string[]>('app.corsOrigins', []);

  app.setGlobalPrefix(prefix);
  app.use(helmet());
  app.enableCors({ origin: origins.length ? origins : true, credentials: true });
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swagger = new DocumentBuilder()
    .setTitle('Mail Sender API')
    .setDescription('Bulk mail dispatcher')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup(prefix + '/docs', app, SwaggerModule.createDocument(app, swagger));

  await app.listen(port);
  Logger.log('API ready on http://localhost:' + port + '/' + prefix, 'Bootstrap');
}

void bootstrap();
