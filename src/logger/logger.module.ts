import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { LoggerModule, type Params } from 'nestjs-pino';

function isNoisePath(url: string | undefined): boolean {
  const path = url?.split('?')[0] ?? '';
  return path === '/health' || path === '/favicon.ico';
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): Params => {
        const isDev = config.get<string>('NODE_ENV') === 'development';

        return {
          pinoHttp: {
            level: 'info',
            ...(isDev
              ? {
                  transport: {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                    },
                  },
                }
              : {}),
            autoLogging: {
              ignore: (req) => isNoisePath(req.url),
            },
            genReqId: () => randomUUID(),
            customProps: (req) => {
              const user = (req as Request & { user?: { id?: number } }).user;
              return {
                requestId: req.id,
                ...(user?.id != null ? { userId: user.id } : {}),
              };
            },
            wrapSerializers: false,
            serializers: {
              req: (req) => {
                const r = req as Request;
                return {
                  method: r.method,
                  url: r.url,
                  params: r.params,
                  query: r.query,
                  id: r.id,
                };
              },
              res: (res) => ({
                statusCode: res.statusCode,
              }),
            },
            customLogLevel: (_req, res, err) => {
              if (err) {
                return 'error';
              }
              const code = res.statusCode;
              if (code >= 500) {
                return 'error';
              }
              if (code >= 400) {
                return 'warn';
              }
              return 'info';
            },
            customSuccessMessage: (req, res, responseTime) =>
              `${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`,
            customErrorMessage: (req, res, err) =>
              `${req.method} ${req.url} ${res.statusCode} — ${err.message}`,
          },
        };
      },
    }),
  ],
})
export class AppLoggerModule {}
