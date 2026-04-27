import { BehaviorProfileSnapshotProcessor } from './behavior-profile-snapshot.processor';

describe('BehaviorProfileSnapshotProcessor', () => {
  const usersService = {
    getActiveUsersForBehaviorSnapshot: jest.fn(),
    ensureWeeklySnapshotForUser: jest.fn(),
  };

  const processor = new BehaviorProfileSnapshotProcessor(usersService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes users in batches and creates snapshots idempotently', async () => {
    usersService.getActiveUsersForBehaviorSnapshot
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([]);
    usersService.ensureWeeklySnapshotForUser
      .mockResolvedValueOnce({ snapshot: { id: 10 }, created: true })
      .mockResolvedValueOnce({ snapshot: { id: 11 }, created: false });

    await processor.process({ name: 'generate-weekly-behavior-snapshots' });

    expect(usersService.getActiveUsersForBehaviorSnapshot).toHaveBeenCalledWith(0, 200);
    expect(usersService.ensureWeeklySnapshotForUser).toHaveBeenNthCalledWith(1, 1);
    expect(usersService.ensureWeeklySnapshotForUser).toHaveBeenNthCalledWith(2, 2);
  });
});
