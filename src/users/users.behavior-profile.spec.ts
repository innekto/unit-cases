import { UsersService } from './users.service';

const createCasesQbMock = (raw: Record<string, number>) => {
  const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(raw),
  };

  return qb;
};

describe('UsersService behavior profile weekly flow', () => {
  const usersRepository = {
    findOneOrFail: jest.fn(),
  };
  const casesRepository = {
    createQueryBuilder: jest.fn(),
  };
  const lifeBalanceRepository = {
    findOne: jest.fn(),
  };
  const behaviorSnapshotRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const emailService = {};
  const cloudinaryService = {};
  const sessionService = {};
  const unverifiedQueue = {};

  const service = new UsersService(
    usersRepository as any,
    casesRepository as any,
    lifeBalanceRepository as any,
    behaviorSnapshotRepository as any,
    emailService as any,
    cloudinaryService as any,
    sessionService as any,
    unverifiedQueue as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-04-21T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns unseen weekly snapshot when user opens app later', async () => {
    const unseen = {
      id: 8,
      userId: 4,
      weekStart: '2026-04-13T00:00:00.000Z',
      weekEnd: '2026-04-19T23:59:59.999Z',
      seenAt: null,
      score: 0.72,
      type: 'replicant',
      metrics: {
        actualBalance: { creative: 0, learning: 20, life: 20, rest: 0, social: 0, work: 60 },
        targetBalance: { creative: 0, learning: 25, life: 25, rest: 0, social: 0, work: 50 },
      },
      createdAt: '2026-04-20T00:01:00.000Z',
    };
    behaviorSnapshotRepository.findOne.mockResolvedValueOnce(unseen);

    const result = await service.getWeeklyBehaviorProfile(4);

    expect(behaviorSnapshotRepository.findOne).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: 8,
      weekStart: unseen.weekStart,
      seenAt: null,
      type: 'replicant',
    });
  });

  it('creates one snapshot for latest completed week and reuses it after', async () => {
    behaviorSnapshotRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 12,
        userId: 7,
        weekStart: '2026-04-13T00:00:00.000Z',
        weekEnd: '2026-04-19T23:59:59.999Z',
        seenAt: null,
        score: 0.66,
        type: 'undefined',
        metrics: {
          actualBalance: { creative: 0, learning: 25, life: 25, rest: 0, social: 0, work: 50 },
          targetBalance: { creative: 0, learning: 25, life: 25, rest: 0, social: 0, work: 50 },
        },
        createdAt: '2026-04-21T10:00:00.000Z',
      });
    usersRepository.findOneOrFail.mockResolvedValue({
      id: 7,
      points: 45,
      emailVerified: true,
      createdAt: '2026-03-10T00:00:00.000Z',
    });
    casesRepository.createQueryBuilder.mockReturnValue(
      createCasesQbMock({
        caseCount: 10,
        completedCount: 6,
        failedCount: 1,
        activeDays: 4,
        creativeCompleted: 0,
        workCompleted: 3,
        lifeCompleted: 2,
        restCompleted: 0,
        socialCompleted: 0,
        learningCompleted: 1,
      }),
    );
    lifeBalanceRepository.findOne.mockResolvedValue({
      creative: 0,
      work: 50,
      life: 25,
      learning: 25,
      rest: 0,
      social: 0,
    });
    behaviorSnapshotRepository.save.mockResolvedValue({
      id: 12,
      userId: 7,
      weekStart: '2026-04-13T00:00:00.000Z',
      weekEnd: '2026-04-19T23:59:59.999Z',
      seenAt: null,
      score: 0.66,
      type: 'undefined',
      metrics: {
        actualBalance: { creative: 0, learning: 16.67, life: 33.33, rest: 0, social: 0, work: 50 },
        targetBalance: { creative: 0, learning: 25, life: 25, rest: 0, social: 0, work: 50 },
      },
      createdAt: '2026-04-21T10:00:00.000Z',
    });

    const first = await service.getWeeklyBehaviorProfile(7);
    const second = await service.getWeeklyBehaviorProfile(7);

    expect(behaviorSnapshotRepository.save).toHaveBeenCalledTimes(1);
    expect(first).toMatchObject({ id: 12 });
    expect(second).toMatchObject({ id: 12 });
  });

  it('ensureWeeklySnapshotForUser is idempotent by user+week', async () => {
    usersRepository.findOneOrFail.mockResolvedValue({
      id: 9,
      points: 40,
      emailVerified: true,
      createdAt: '2026-03-01T00:00:00.000Z',
    });
    behaviorSnapshotRepository.findOne.mockResolvedValue({
      id: 32,
      userId: 9,
      weekStart: '2026-04-13T00:00:00.000Z',
      weekEnd: '2026-04-19T23:59:59.999Z',
      seenAt: null,
      score: 0.63,
      type: 'undefined',
      metrics: {},
      createdAt: '2026-04-20T00:02:00.000Z',
    });

    const result = await service.ensureWeeklySnapshotForUser(9);

    expect(result.created).toBe(false);
    expect(result.snapshot).toBeTruthy();
    expect(behaviorSnapshotRepository.save).not.toHaveBeenCalled();
  });

  it('marks unseen snapshot as seen on ack', async () => {
    behaviorSnapshotRepository.findOne.mockResolvedValue({
      id: 22,
      userId: 5,
      seenAt: null,
    });

    const result = await service.ackWeeklyBehaviorProfile(5);

    expect(behaviorSnapshotRepository.update).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      message: 'Weekly result acknowledged',
    });
  });
});
