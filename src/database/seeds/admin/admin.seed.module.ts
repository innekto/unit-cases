import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@/users/entities/user.entity';

import { AdminSeedService } from './admin.seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [AdminSeedService],
  exports: [AdminSeedService],
})
export class AdminSeedModule {}
