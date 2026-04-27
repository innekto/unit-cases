import { PartialType } from '@nestjs/swagger';

import { CreateLifeBalanceDto } from './create-life-balance.dto';

export class UpdateLifeBalanceDto extends PartialType(CreateLifeBalanceDto) {}
