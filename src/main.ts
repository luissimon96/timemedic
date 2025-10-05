import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Criação da aplicação NestJS
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const environment = configService.get<string>('NODE_ENV', 'development');

  // Configurações de segurança
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS para integração com frontend
  const corsOrigins = configService.get<string>('CORS_ORIGIN')?.split(',') || ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Prefixo global da API
  app.setGlobalPrefix('api/v1');

  // Documentação Swagger (apenas em desenvolvimento)
  if (environment === 'development') {
    const config = new DocumentBuilder()
      .setTitle('TimeMedic API')
      .setDescription('Sistema de gestão de medicamentos com foco em segurança do paciente')
      .setVersion('1.0')
      .setContact(
        'TimeMedic Support',
        'https://timemedic.com.br',
        'support@timemedic.com.br'
      )
      .setLicense('Proprietary', '')
      .addBearerAuth()
      .addTag('auth', 'Autenticação e autorização')
      .addTag('patients', 'Gestão de pacientes')
      .addTag('medications', 'Catálogo de medicamentos')
      .addTag('prescriptions', 'Prescrições médicas')
      .addTag('allergies', 'Gestão de alergias')
      .addTag('interactions', 'Análise de interações medicamentosas')
      .addTag('adverse-events', 'Eventos adversos e VigiMed')
      .addTag('dosages', 'Agendamento e registro de doses')
      .addTag('reports', 'Relatórios e exportações')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
  }

  // Inicialização da aplicação
  await app.listen(port);

  logger.log(`🚀 TimeMedic API running on http://localhost:${port}`);
  logger.log(`🌍 Environment: ${environment}`);
  logger.log(`🔒 Security headers enabled with Helmet`);
  
  if (environment === 'production') {
    logger.log('🏥 Production mode - Enhanced security and monitoring active');
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

bootstrap();