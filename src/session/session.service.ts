import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';

import { Session } from './entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private datasource: DataSource,
  ) {}

  async create(userId: number) {
    try {
      const session = this.sessionRepository.create({
        user: { id: userId },
        createdAt: new Date().toISOString(),
      });
      return this.sessionRepository.save(session);
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return `This action returns all session`;
  }

  async findOneForJwt(userId: number, sessionId: number) {
    const data = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.id = :sessionId', { sessionId })
      .andWhere('session.userId = :userId', { userId })
      .getOne();

    if (!data) {
      throw new UnauthorizedException('Session is closed!');
    }

    if (!data || !data.user.isLoggedIn) throw new UnauthorizedException();
  }

  async closeSession(userId: number) {
    const exists = await this.sessionRepository.exists({
      where: { user: { id: userId }, deletedAt: IsNull() },
    });

    if (!exists) {
      return;
    }

    await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .execute();
  }

  async deleteAndCreateNew(id: number, userId: number) {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      const openedSession = await queryRunner.manager.findOne(Session, {
        where: {
          id,
          user: { id: userId },
        },
      });

      if (!openedSession) {
        throw new UnauthorizedException('Session is closed!');
      }

      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Session)
        .where('id = :id', { id })
        .execute();

      const newSession = queryRunner.manager.create(Session, {
        user: { id: userId },
        createdAt: new Date().toISOString(),
      });
      const savedSession = await queryRunner.manager.save(Session, newSession);

      await queryRunner.commitTransaction();

      return savedSession;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
