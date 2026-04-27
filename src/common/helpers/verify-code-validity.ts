import { BadRequestException } from '@nestjs/common';

export const verifyCodeValidity = (updatedAt: string, validityPeriodInMinutes: number) => {
  const nowInMinutes = Math.floor(Date.now() / 1000 / 60);
  const updatedAtInMinutes = Math.floor(new Date(updatedAt).getTime() / 1000 / 60);

  const timeElapsedInMinutes = nowInMinutes - updatedAtInMinutes;

  if (timeElapsedInMinutes > validityPeriodInMinutes) {
    throw new BadRequestException('The code has expired');
  }
};
