import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';

import {
  BEHAVIOR_PROFILE_SNAPSHOT_QUEUE,
  GENERATE_WEEKLY_BEHAVIOR_SNAPSHOTS_JOB,
} from '../constants/behavior-profile-snapshot.queue';
import { UsersService } from '../users.service';

@Processor(BEHAVIOR_PROFILE_SNAPSHOT_QUEUE)
@Injectable()
export class BehaviorProfileSnapshotProcessor extends WorkerHost {
  private readonly logger = new Logger(BehaviorProfileSnapshotProcessor.name);
  private readonly batchSize = 200;

  constructor(private readonly usersService: UsersService) {
    super();
  }

  async process(job: any): Promise<void> {
    if (job?.name !== GENERATE_WEEKLY_BEHAVIOR_SNAPSHOTS_JOB) {
      return;
    }

    let offset = 0;
    let processed = 0;
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (;;) {
      const users = await this.usersService.getActiveUsersForBehaviorSnapshot(
        offset,
        this.batchSize,
      );
      if (!users.length) {
        break;
      }

      for (const user of users) {
        processed += 1;
        try {
          const result = await this.usersService.ensureWeeklySnapshotForUser(user.id);
          if (result.created) {
            created += 1;
          } else {
            skipped += 1;
          }
        } catch (error) {
          errors += 1;
          this.logger.error(`Failed weekly behavior snapshot for user ${user.id}`, error as any);
        }
      }

      offset += users.length;
    }

    this.logger.log(
      `Weekly behavior snapshot job completed. processed=${processed}, created=${created}, skipped=${skipped}, errors=${errors}`,
    );
  }
}
