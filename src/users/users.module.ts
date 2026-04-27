import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaseEntity } from '@/cases/entities/case.entity';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { EmailModule } from '@/email/email.module';
import { LifeBalanceEntity } from '@/life-balance/entities/life-balance.entity';
import { Session } from '@/session/entities/session.entity';
import { SessionService } from '@/session/session.service';

import { BEHAVIOR_PROFILE_SNAPSHOT_QUEUE } from './constants/behavior-profile-snapshot.queue';
import { UNVERIFIED_USER_CLEANUP_QUEUE } from './constants/unverified-user-cleanup.queue';
import { BehaviorProfileSnapshotEntity } from './entities/behavior-profile-snapshot.entity';
import { UserEntity } from './entities/user.entity';
import { BehaviorProfileSnapshotProcessor } from './processors/behavior-profile-snapshot.processor';
import { BehaviorProfileSnapshotScheduler } from './processors/behavior-profile-snapshot.scheduler';
import { UnverifiedUserCleanupProcessor } from './processors/unverified-user-cleanup.processor';
import { UnverifiedUserCleanupScheduler } from './processors/unverified-user-cleanup.scheduler';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CaseEntity,
      Session,
      LifeBalanceEntity,
      BehaviorProfileSnapshotEntity,
    ]),
    BullModule.registerQueue({
      name: UNVERIFIED_USER_CLEANUP_QUEUE,
    }),
    BullModule.registerQueue({
      name: BEHAVIOR_PROFILE_SNAPSHOT_QUEUE,
    }),
    EmailModule,
  ],
  controllers: [UsersController],
  providers: [
    SessionService,
    UsersService,
    CloudinaryService,
    UnverifiedUserCleanupProcessor,
    UnverifiedUserCleanupScheduler,
    BehaviorProfileSnapshotProcessor,
    BehaviorProfileSnapshotScheduler,
  ],
  exports: [UsersService],
})
export class UsersModule {}
