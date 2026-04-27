import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { validateLifeBalanceTotal } from '@/common';
import { UsersService } from '@/users/users.service';

import { CreateLifeBalanceDto } from './dto/create-life-balance.dto';
import { LifeBalanceEntity } from './entities/life-balance.entity';

@Injectable()
export class LifeBalanceService {
  constructor(
    @InjectRepository(LifeBalanceEntity)
    private readonly lifeBalanceRepository: Repository<LifeBalanceEntity>,
    private userService: UsersService,
  ) {}

  async upsertBalance(
    userId: number,
    payload: CreateLifeBalanceDto,
  ): Promise<{ balance: LifeBalanceEntity; created: boolean }> {
    validateLifeBalanceTotal(payload);

    const existing = await this.lifeBalanceRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existing) {
      await this.lifeBalanceRepository.update(
        existing.id,
        payload as DeepPartial<LifeBalanceEntity>,
      );
      const updated = await this.lifeBalanceRepository.findOneOrFail({
        where: { id: existing.id },
      });
      return { balance: updated, created: false };
    }

    const user = await this.userService.findOneByParams({ id: userId });
    const lifeBalance = new LifeBalanceEntity(payload as CreateLifeBalanceDto);
    lifeBalance.user = user;

    const saved = await this.lifeBalanceRepository.save(lifeBalance);
    return { balance: saved, created: true };
  }

  async getBalance(userId: number): Promise<LifeBalanceEntity> {
    const balance = await this.lifeBalanceRepository.findOneByOrFail({
      user: { id: userId },
    });

    return balance;
  }
}
