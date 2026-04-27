import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from 'src/common';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

import { CreateLifeBalanceDto } from './dto/create-life-balance.dto';
import { LifeBalanceEntity } from './entities/life-balance.entity';
import { LifeBalanceService } from './life-balance.service';
import { GetLifeBalanceDocs, UpsertLifeBalanceDocs } from './swagger-docs/life-balance.docs';

@ApiTags('Life-balance')
@Controller('life-balance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LifeBalanceController {
  constructor(private readonly lifeBalanceService: LifeBalanceService) {}
  @Put()
  @UpsertLifeBalanceDocs()
  async upsert(
    @User('id') userId: number,
    @Body() payload: CreateLifeBalanceDto,
  ): Promise<LifeBalanceEntity> {
    const { balance } = await this.lifeBalanceService.upsertBalance(userId, payload);
    return balance;
  }

  @Get()
  @GetLifeBalanceDocs()
  async get(@User('id') userId: number): Promise<LifeBalanceEntity> {
    return await this.lifeBalanceService.getBalance(userId);
  }
}
