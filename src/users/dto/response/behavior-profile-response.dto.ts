import { ApiProperty } from '@nestjs/swagger';

class BalanceDto {
  @ApiProperty({ example: 60 })
  work!: number;

  @ApiProperty({ example: 20 })
  life!: number;

  @ApiProperty({ example: 20 })
  learning!: number;
}

class BehaviorRangeDto {
  @ApiProperty({ example: '2026-04-20T00:00:00.000Z' })
  from!: string;

  @ApiProperty({ example: '2026-04-26T23:59:59.999Z' })
  to!: string;
}

class BehaviorMetricsDto {
  @ApiProperty({ example: 18 })
  caseCount!: number;

  @ApiProperty({ example: 9 })
  completedCount!: number;

  @ApiProperty({ example: 2 })
  failedCount!: number;

  @ApiProperty({ example: 5 })
  activeDays!: number;

  @ApiProperty({ example: 7 })
  totalDays!: number;

  @ApiProperty({ example: 0.5 })
  completionRate!: number;

  @ApiProperty({ example: 0.11 })
  failureRate!: number;

  @ApiProperty({ example: 0.71 })
  consistency!: number;

  @ApiProperty({ type: BalanceDto })
  actualBalance!: BalanceDto;

  @ApiProperty({ type: BalanceDto, nullable: true })
  targetBalance!: BalanceDto | null;

  @ApiProperty({ example: 0.12, nullable: true })
  deviationFromTarget!: number | null;

  @ApiProperty({ example: 0.88 })
  targetMatch!: number;

  @ApiProperty({ example: 0.64 })
  pointsSignal!: number;

  @ApiProperty({ example: 1 })
  verificationSignal!: number;
}

export class BehaviorProfileResponseDto {
  @ApiProperty({ example: '2026-04-21T12:00:00.000Z' })
  computedAt!: string;

  @ApiProperty({ type: BehaviorRangeDto })
  range!: BehaviorRangeDto;

  @ApiProperty({ type: BalanceDto })
  actualBalance!: BalanceDto;

  @ApiProperty({ type: BalanceDto, nullable: true })
  targetBalance!: BalanceDto | null;

  @ApiProperty({ type: BehaviorMetricsDto })
  metrics!: BehaviorMetricsDto;

  @ApiProperty({ example: 0.67 })
  replicantScore!: number;

  @ApiProperty({ example: 'undefined', enum: ['human', 'replicant', 'undefined'] })
  type!: 'human' | 'replicant' | 'undefined';
}

export class WeeklyBehaviorProfileResponseDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: '2026-04-13T00:00:00.000Z' })
  weekStart!: string;

  @ApiProperty({ example: '2026-04-19T23:59:59.999Z' })
  weekEnd!: string;

  @ApiProperty({ example: null, nullable: true })
  seenAt!: string | null;

  @ApiProperty({ type: BalanceDto })
  actualBalance!: BalanceDto;

  @ApiProperty({ type: BalanceDto, nullable: true })
  targetBalance!: BalanceDto | null;

  @ApiProperty({
    example: {
      caseCount: 18,
      completedCount: 9,
      failedCount: 2,
      activeDays: 5,
      totalDays: 7,
      completionRate: 0.5,
      failureRate: 0.11,
      consistency: 0.71,
      actualBalance: { work: 60, life: 20, learning: 20 },
      targetBalance: { work: 50, life: 25, learning: 25 },
      deviationFromTarget: 0.12,
      targetMatch: 0.88,
      pointsSignal: 0.64,
      verificationSignal: 1,
    },
  })
  metrics!: Record<string, any>;

  @ApiProperty({ example: 0.74 })
  replicantScore!: number;

  @ApiProperty({ example: 'replicant', enum: ['human', 'replicant', 'undefined'] })
  type!: 'human' | 'replicant' | 'undefined';

  @ApiProperty({ example: '2026-04-20T00:01:00.000Z' })
  createdAt!: string;
}

export class WeeklyBehaviorAckResponseDto {
  @ApiProperty({ example: 'Weekly result acknowledged' })
  message!: string;

  @ApiProperty({ example: '2026-04-21T09:14:22.000Z', nullable: true })
  seenAt?: string;
}

