import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@/users/entities/user.entity';

import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { CaseEntity } from './entities/case.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CaseEntity, UserEntity])],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
