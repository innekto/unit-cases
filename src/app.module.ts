import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CasesModule } from './cases/cases.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DatesErrorsInterceptor, IsUniqueInterceptor, NotFoundInterceptor } from './common';
import { CronModule } from './cron/cron.module';
import { LifeBalanceModule } from './life-balance/life-balance.module';
import { AppLoggerModule } from './logger/logger.module';
import { SessionModule } from './session/session.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AppLoggerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST') || 'localhost';
        const port = Number(configService.get<string>('REDIS_PORT') || 6379);
        const password = configService.get<string>('REDIS_PASSWORD') || undefined;
        const db = Number(configService.get<string>('REDIS_DB') || 0);
        const tls = configService.get<string>('REDIS_TLS') === 'true';

        const connection: any = { host, port, db };
        if (password) connection.password = password;
        if (tls) connection.tls = {};

        return {
          connection,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('DATABASE_HOST');
        const port = Number(configService.get<string>('DATABASE_PORT'));
        const username = configService.get<string>('DATABASE_USERNAME');
        const password = configService.get<string>('DATABASE_PASSWORD');
        const database = configService.get<string>('DATABASE_NAME');
        const rawSsl = configService.get<string>('DATABASE_SSL');

        if (!host || !Number.isFinite(port) || !username || !password || !database) {
          throw new Error(
            'Database config is missing. Set DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME.',
          );
        }

        const useSsl =
          rawSsl !== undefined ? rawSsl === 'true' : host !== 'localhost' && host !== '127.0.0.1';

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [join(__dirname, '**', '*.entity.{ts,js}')],
          migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
          synchronize: true,
          migrationsRun: true,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
          extra: {
            max: 10,
            idleTimeoutMillis: 30000,
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CasesModule,
    LifeBalanceModule,
    CloudinaryModule,
    SessionModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    { provide: APP_INTERCEPTOR, useClass: DatesErrorsInterceptor },
    {
      provide: APP_INTERCEPTOR,
      useClass: NotFoundInterceptor,
    },
    { provide: APP_INTERCEPTOR, useClass: IsUniqueInterceptor },
  ],
})
export class AppModule {}
