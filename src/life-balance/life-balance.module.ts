import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@/users/entities/user.entity';
import { UsersModule } from '@/users/users.module';

import { LifeBalanceEntity } from './entities/life-balance.entity';
import { LifeBalanceController } from './life-balance.controller';
import { LifeBalanceService } from './life-balance.service';

@Module({
  imports: [TypeOrmModule.forFeature([LifeBalanceEntity, UserEntity]), UsersModule],
  controllers: [LifeBalanceController],
  providers: [LifeBalanceService],
})
export class LifeBalanceModule {}
