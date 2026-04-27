import { BadRequestException } from '@nestjs/common';

import { CreateLifeBalanceDto } from '@/life-balance/dto/create-life-balance.dto';
import { UpdateLifeBalanceDto } from '@/life-balance/dto/update-life-balance.dto';

export const validateLifeBalanceTotal = (
  payload: CreateLifeBalanceDto | UpdateLifeBalanceDto,
): void => {
  if (
    payload.creative === undefined ||
    payload.learning === undefined ||
    payload.life === undefined ||
    payload.rest === undefined ||
    payload.social === undefined ||
    payload.work === undefined
  ) {
    return;
  }

  const total =
    payload.creative +
    payload.learning +
    payload.life +
    payload.rest +
    payload.social +
    payload.work;
  if (total !== 100) {
    throw new BadRequestException(
      'The sum of creative, learning, life, rest, social, and work should be equal to 100',
    );
  }
};
