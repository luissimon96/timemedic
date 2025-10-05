import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as path from 'path';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get<string>('LOG_LEVEL', 'info');
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const logFileEnabled = configService.get<boolean>('LOG_FILE_ENABLED', true);
        const logFilePath = configService.get<string>('LOG_FILE_PATH', './logs/timemedic.log');

        const transports: winston.transport[] = [];

        // Console transport (sempre ativo)
        transports.push(
          new winston.transports.Console({
            level: logLevel,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize({ all: true }),
              winston.format.printf(({ timestamp, level, message, context, trace }) => {
                return `${timestamp} [${context || 'Application'}] ${level}: ${message}${
                  trace ? `\n${trace}` : ''
                }`;
              }),
            ),
          }),
        );

        // File transport (se habilitado)
        if (logFileEnabled) {
          transports.push(
            new winston.transports.File({
              level: logLevel,
              filename: logFilePath,
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json(),
              ),
              maxsize: 5242880, // 5MB
              maxFiles: 5,
            }),
          );

          // Log de erro separado em produção
          if (nodeEnv === 'production') {
            transports.push(
              new winston.transports.File({
                level: 'error',
                filename: path.join(path.dirname(logFilePath), 'error.log'),
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.errors({ stack: true }),
                  winston.format.json(),
                ),
                maxsize: 5242880, // 5MB
                maxFiles: 10,
              }),
            );
          }
        }

        return {
          level: logLevel,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
          ),
          transports,
          // Não sair do processo em caso de erro
          exitOnError: false,
          // Tratamento de exceções não capturadas
          exceptionHandlers: [
            new winston.transports.File({
              filename: path.join(path.dirname(logFilePath), 'exceptions.log'),
            }),
          ],
          // Tratamento de rejeições não capturadas
          rejectionHandlers: [
            new winston.transports.File({
              filename: path.join(path.dirname(logFilePath), 'rejections.log'),
            }),
          ],
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}