import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { dataSourceOptions } from '../data-source';
import { AdminSeedModule } from './admin/admin.seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
    }),
    AdminSeedModule,
  ],
})
export class SeedModule {}
