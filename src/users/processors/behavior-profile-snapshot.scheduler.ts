import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
  BEHAVIOR_PROFILE_SNAPSHOT_QUEUE,
  GENERATE_WEEKLY_BEHAVIOR_SNAPSHOTS_JOB,
} from '../constants/behavior-profile-snapshot.queue';

@Injectable()
export class BehaviorProfileSnapshotScheduler implements OnModuleInit {
  constructor(
    @InjectQueue(BEHAVIOR_PROFILE_SNAPSHOT_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      GENERATE_WEEKLY_BEHAVIOR_SNAPSHOTS_JOB,
      {},
      {
        jobId: GENERATE_WEEKLY_BEHAVIOR_SNAPSHOTS_JOB,
        repeat: {
          pattern: '5 0 * * 1',
          tz: 'UTC',
        },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }
}
