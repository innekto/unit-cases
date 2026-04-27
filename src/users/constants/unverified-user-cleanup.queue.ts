export const UNVERIFIED_USER_CLEANUP_QUEUE = 'unverified-user-cleanup';
export const UNVERIFIED_USER_DELETE_JOB = 'delete-unverified-user';
export const getUnverifiedUserJobId = (userId: number) => `unverified-user:${userId}`;
