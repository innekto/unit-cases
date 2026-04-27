import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Session } from '@/session/entities/session.entity';

import { CronService } from './cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), ScheduleModule.forRoot()],
  controllers: [],
  providers: [CronService],
})
export class CronModule {}
