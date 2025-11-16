import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configure body parser - CRITICAL: Webhooks MUST use raw body
  // This MUST come before express.json() middleware
  app.use((req: any, res, next) => {
    if (req.originalUrl && req.originalUrl.includes('/webhooks/stripe')) {
      express.raw({ type: '*/*' })(req, res, next);
    } else {
      next();
    }
  });
  
  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        // Store raw body for Stripe webhook signature verification
        if (req.originalUrl && req.originalUrl.includes('/webhooks/stripe')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // API prefix
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // CORS configuration
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Tutor Scene API')
    .setDescription('The Tutor Scene API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  const swaggerPath = configService.get('SWAGGER_PATH', 'docs');
  SwaggerModule.setup(swaggerPath, app, document);

  // IMPORTANT: Use process.env.PORT for Elastic Beanstalk compatibility
  // Elastic Beanstalk sets the PORT environment variable
  const port = process.env.PORT || configService.get<number>('PORT', 3000);
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/${swaggerPath}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();