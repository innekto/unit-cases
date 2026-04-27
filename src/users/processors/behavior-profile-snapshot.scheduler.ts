import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, QueueScheduler } from 'bullmq';

import {
  BEHAVIOR_PROFILE_SNAPSHOT_QUEUE,
  GENERATE_WEEKLY_BEHAVIOR_SNAPSHOTS_JOB,
} from '../constants/behavior-profile-snapshot.queue';

@Injectable()
export class BehaviorProfileSnapshotScheduler implements OnModuleInit, OnModuleDestroy {
  private scheduler?: QueueScheduler;

  constructor(
    @InjectQueue(BEHAVIOR_PROFILE_SNAPSHOT_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    this.scheduler = new QueueScheduler(BEHAVIOR_PROFILE_SNAPSHOT_QUEUE, {
      connection: this.queue.opts.connection as any,
    });
    await this.scheduler.waitUntilReady();

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

  async onModuleDestroy(): Promise<void> {
    if (this.scheduler) {
      await this.scheduler.close();
    }
  }
}
