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

  const isDevelopment = process.env.NODE_ENV === 'development';

  app.setGlobalPrefix(prefix);
  app.use(helmet());
  if (origins.length) {
    app.enableCors({ origin: origins, credentials: true });
  } else if (isDevelopment) {
    app.enableCors({ origin: true, credentials: true });
  } else {
    app.enableCors({ origin: false });
    Logger.warn(
      'CORS_ORIGINS is unset: cross-origin browser requests are blocked. Set it to ' +
        'the dashboard origin - see docs/deployment.md step 5.',
      'Bootstrap',
    );
  }
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

  // 0.0.0.0, not the default localhost: a container's health check and
  // router reach the process from outside its own loopback interface.
  await app.listen(port, '0.0.0.0');
  Logger.log('API ready on port ' + port + ' under /' + prefix, 'Bootstrap');
}

void bootstrap();
