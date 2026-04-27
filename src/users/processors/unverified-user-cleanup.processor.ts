import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UNVERIFIED_USER_CLEANUP_QUEUE } from '../constants/unverified-user-cleanup.queue';
import { UserEntity } from '../entities/user.entity';

@Processor(UNVERIFIED_USER_CLEANUP_QUEUE)
@Injectable()
export class UnverifiedUserCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(UnverifiedUserCleanupProcessor.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {
    super();
  }

  async process(job: any): Promise<void> {
    try {
      const userId = job.data?.userId;
      if (!userId) return;

      const user = await this.usersRepository.findOneBy({ id: userId });
      if (!user) {
        this.logger.debug(`User ${userId} not found, skipping delete`);
        return;
      }

      if (user.emailVerified) {
        this.logger.debug(`User ${userId} already verified, skipping delete`);
        return;
      }

      if (!user.emailVerificationExpires) {
        this.logger.debug(`User ${userId} has no verification expiry, skipping delete`);
        return;
      }

      const expires = new Date(user.emailVerificationExpires);
      const now = new Date();
      if (expires > now) {
        this.logger.debug(`User ${userId} verification not yet expired, skipping delete`);
        return;
      }

      await this.usersRepository.delete(userId);
      this.logger.log(`Deleted unverified user ${userId}`);
    } catch (error) {
      this.logger.error('Error in unverified user cleanup processor', error as any);
      throw error;
    }
  }
}
