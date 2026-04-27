import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, QueueScheduler } from 'bullmq';

import { UNVERIFIED_USER_CLEANUP_QUEUE } from '../constants/unverified-user-cleanup.queue';

@Injectable()
export class UnverifiedUserCleanupScheduler implements OnModuleInit, OnModuleDestroy {
  private scheduler?: QueueScheduler;

  constructor(
    @InjectQueue(UNVERIFIED_USER_CLEANUP_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    this.scheduler = new QueueScheduler(UNVERIFIED_USER_CLEANUP_QUEUE, {
      connection: this.queue.opts.connection as any,
    });

    await this.scheduler.waitUntilReady();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.scheduler) {
      await this.scheduler.close();
    }
  }
}
