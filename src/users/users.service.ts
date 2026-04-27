import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { verifyCodeValidity } from 'src/common';
import { DeepPartial, EntityManager, FindOneOptions, IsNull, Repository } from 'typeorm';

import { ChangePasswordDto, ResetCodeDto, ResetPasswordDto, VerifyEmailDto } from '@/auth/dto';
import { CaseEntity } from '@/cases/entities/case.entity';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { CaseCategories } from '@/common';
import { publicIdExtract } from '@/common/helpers/pudlic-id.extraction';
import { EmailService } from '@/email/email.service';
import { LifeBalanceEntity } from '@/life-balance/entities/life-balance.entity';
import { Session } from '@/session/entities/session.entity';
import { SessionService } from '@/session/session.service';

import {
  getUnverifiedUserJobId,
  UNVERIFIED_USER_CLEANUP_QUEUE,
  UNVERIFIED_USER_DELETE_JOB,
} from './constants/unverified-user-cleanup.queue';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BehaviorProfileSnapshotEntity } from './entities/behavior-profile-snapshot.entity';
import { UserEntity } from './entities/user.entity';

const PASSWORD_RESET_EXPIRATION_MINUTES = 10;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_VERIFY_WINDOW_MINUTES = 10;
const BEHAVIOR_SCORE_MIN = 0;
const BEHAVIOR_SCORE_MAX = 1;
const DEFAULT_TARGET_MATCH = 0.5;
const BALANCE_CATEGORIES = ['creative', 'learning', 'life', 'rest', 'social', 'work'] as const;

type BehaviorType = 'human' | 'replicant' | 'undefined';
type BalanceByCategory = Record<(typeof BALANCE_CATEGORIES)[number], number>;
type TargetBalance = BalanceByCategory | null;

interface BehaviorMetrics {
  caseCount: number;
  completedCount: number;
  failedCount: number;
  activeDays: number;
  totalDays: number;
  completionRate: number;
  failureRate: number;
  consistency: number;
  actualBalance: BalanceByCategory;
  targetBalance: TargetBalance;
  deviationFromTarget: number | null;
  targetMatch: number;
  pointsSignal: number;
  verificationSignal: number;
}

interface EnsureSnapshotResult {
  snapshot: BehaviorProfileSnapshotEntity | null;
  created: boolean;
  reason?: 'no_completed_week' | 'user_created_after_week_end';
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(CaseEntity)
    private readonly casesRepository: Repository<CaseEntity>,
    @InjectRepository(LifeBalanceEntity)
    private readonly lifeBalanceRepository: Repository<LifeBalanceEntity>,
    @InjectRepository(BehaviorProfileSnapshotEntity)
    private readonly behaviorSnapshotRepository: Repository<BehaviorProfileSnapshotEntity>,
    private emailService: EmailService,
    private cloudinaryService: CloudinaryService,
    readonly sessionService: SessionService,
    @InjectQueue(UNVERIFIED_USER_CLEANUP_QUEUE)
    private readonly unverifiedUserQueue: Queue,
  ) {}

  async saveUser(user: UserEntity, manager: EntityManager) {
    const savedUser = await manager.save(user);
    return savedUser.id;
  }

  async findOneByParams(params: Record<string, any>, relations?: string[]): Promise<UserEntity> {
    const queryOptions: FindOneOptions<UserEntity> = {
      where: params,
      relations,
    };

    const user = await this.usersRepository.findOneOrFail(queryOptions);

    return user;
  }

  async findOneForRefreshToken(email: string) {
    const exists = await this.usersRepository.exists({
      where: { email, deletedAt: IsNull() },
    });

    if (!exists) {
      throw new UnauthorizedException('invalid token');
    }
  }

  async me(userId: number): Promise<DeepPartial<UserEntity>> {
    const me = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.lifeBalance', 'lifeBalance')
      .where('user.id = :userId', { userId })
      .select([
        'user.id',
        'user.email',
        'user.username',
        'user.image',
        'user.points',
        'user.isActive',
        'user.isLoggedIn',
        'lifeBalance.id',
        'lifeBalance.creative',
        'lifeBalance.work',
        'lifeBalance.life',
        'lifeBalance.learning',
        'lifeBalance.rest',
        'lifeBalance.social',
      ])
      .getOne();

    if (!me) {
      throw new NotFoundException('User not found');
    }

    return me;
  }

  async getBehaviorProfile(userId: number) {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      select: ['id', 'points', 'emailVerified', 'createdAt'],
    });
    const range = this.getCurrentWeekRangeUtc(new Date());
    const metrics = await this.buildBehaviorMetrics(user, range.weekStart, new Date(range.weekEnd));
    const { score, type } = this.calculateBehaviorScore(metrics);

    return {
      computedAt: new Date().toISOString(),
      range: {
        from: range.weekStart.toISOString(),
        to: range.weekEnd.toISOString(),
      },
      actualBalance: metrics.actualBalance,
      targetBalance: metrics.targetBalance,
      metrics,
      replicantScore: score,
      type,
    };
  }

  async getWeeklyBehaviorProfile(userId: number) {
    const unseen = await this.behaviorSnapshotRepository.findOne({
      where: { userId, seenAt: IsNull() },
      order: { weekStart: 'ASC' },
    });

    if (unseen) {
      return this.mapSnapshot(unseen);
    }

    const ensureResult = await this.ensureWeeklySnapshotForUser(userId);
    if (!ensureResult.snapshot) {
      return { message: 'No weekly result yet' };
    }

    return ensureResult.snapshot.seenAt
      ? { message: 'No unseen weekly result' }
      : this.mapSnapshot(ensureResult.snapshot);
  }

  async ackWeeklyBehaviorProfile(userId: number) {
    const unseen = await this.behaviorSnapshotRepository.findOne({
      where: { userId, seenAt: IsNull() },
      order: { weekStart: 'ASC' },
    });
    if (!unseen) {
      return { message: 'No unseen weekly result' };
    }

    const seenAt = new Date().toISOString();
    await this.behaviorSnapshotRepository.update(unseen.id, { seenAt });
    return { message: 'Weekly result acknowledged', seenAt };
  }

  async getActiveUsersForBehaviorSnapshot(offset = 0, limit = 200): Promise<Array<{ id: number }>> {
    return this.usersRepository.find({
      where: { deletedAt: IsNull() },
      select: ['id'],
      order: { id: 'ASC' },
      skip: offset,
      take: limit,
    });
  }

  async ensureWeeklySnapshotForUser(userId: number): Promise<EnsureSnapshotResult> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      select: ['id', 'points', 'emailVerified', 'createdAt'],
    });

    const latestCompletedWeek = this.getLatestCompletedWeekRangeUtc(new Date());
    if (!latestCompletedWeek) {
      return { snapshot: null, created: false, reason: 'no_completed_week' };
    }
    if (user.createdAt && new Date(user.createdAt) > latestCompletedWeek.weekEnd) {
      return { snapshot: null, created: false, reason: 'user_created_after_week_end' };
    }

    const weekStartIso = latestCompletedWeek.weekStart.toISOString();
    const existing = await this.behaviorSnapshotRepository.findOne({
      where: { userId, weekStart: weekStartIso },
    });
    if (existing) {
      return { snapshot: existing, created: false };
    }

    const metrics = await this.buildBehaviorMetrics(
      user,
      latestCompletedWeek.weekStart,
      latestCompletedWeek.weekEnd,
    );
    const { score, type } = this.calculateBehaviorScore(metrics);

    const snapshot = await this.behaviorSnapshotRepository.save({
      userId,
      weekStart: latestCompletedWeek.weekStart.toISOString(),
      weekEnd: latestCompletedWeek.weekEnd.toISOString(),
      score,
      type,
      metrics,
      seenAt: null,
      createdAt: new Date().toISOString(),
    });

    return { snapshot, created: true };
  }

  async create(
    createUserDto: CreateUserDto,
    meta: { ip: string; userAgent: string; sessionId: string },
  ) {
    const { password, email, username } = createUserDto;
    const { ip, userAgent, sessionId } = meta;
    const exists = await this.usersRepository.exists({
      where: { email },
      withDeleted: true,
    });

    if (exists) {
      throw new ConflictException('Email already exists');
    }
    const code = crypto
      .createHash('sha256')
      .update(`${email}:${Date.now()}:${sessionId}`)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();
    const ttlMinutes = Number(process.env.UNVERIFIED_USER_TTL_MINUTES || '10');
    const expires = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const insertUserData = {
      email,
      username,
      emailVerificationCode: code,
      emailVerificationExpires: expires.toISOString(),
      password: await bcrypt.hash(password, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const insertUser = await this.usersRepository
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values(insertUserData)
      .returning([
        'id',
        'email',
        'username',
        'createdAt',
        'updatedAt',
        'image',
        'points',
        'isActive',
        'isLoggedIn',
      ])
      .execute();

    void this.emailService.sendEmailVerification(email, code, sessionId, ip, userAgent);

    const created = insertUser.raw[0];

    (async () => {
      try {
        const delay = ttlMinutes * 60 * 1000;
        const jobId = getUnverifiedUserJobId(created.id);
        await this.unverifiedUserQueue.add(
          UNVERIFIED_USER_DELETE_JOB,
          { userId: created.id },
          { jobId, delay, removeOnComplete: true, removeOnFail: true },
        );
      } catch (err) {
        this.logger.warn(
          `Failed to enqueue unverified user cleanup job for user ${created.id}: ${String(err)}`,
        );
      }
    })();

    return {
      id: created.id,
      email: created.email,
      username: created.username,
      image: created.image ?? null,
      points: created.points ?? 0,
      isActive: created.isActive,
      isLoggedIn: created.isLoggedIn,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { email, code } = dto;

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      throw new BadRequestException('No verification code found');
    }

    const now = new Date();

    if (new Date(user.emailVerificationExpires) < now) {
      throw new BadRequestException('Code expired');
    }

    if (user.emailVerificationAttempts >= 5) {
      throw new BadRequestException('Too many attempts');
    }

    user.emailVerificationAttempts += 1;

    if (user.emailVerificationCode !== code.toUpperCase()) {
      await this.usersRepository.save(user);
      throw new UnauthorizedException('Invalid code');
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date().toISOString();
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    user.emailVerificationAttempts = 0;
    user.isActive = true;

    await this.usersRepository.save(user);

    try {
      const jobId = getUnverifiedUserJobId(user.id);
      const job = await this.unverifiedUserQueue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    } catch (err) {
      this.logger.warn(`Failed to remove cleanup job for user ${user.id}: ${String(err)}`);
    }

    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    };
  }

  async findOpenedSessionAndDelete(id: number, userId: number) {
    const user = await this.usersRepository.exists({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return await this.sessionService.deleteAndCreateNew(id, userId);
  }

  async createSession(userId: number, manager?: EntityManager) {
    if (manager) {
      const session = manager.create(Session, {
        user: { id: userId },
        createdAt: new Date().toISOString(),
      });
      return manager.save(Session, session);
    }

    const session = await this.sessionService.create(userId);
    return session;
  }

  async resetPassword(
    payload: ResetPasswordDto,
    meta: { ip: string; userAgent: string; sessionId: string },
  ): Promise<{ message: string }> {
    const { email } = payload;
    const { ip, userAgent, sessionId } = meta;

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordResetToken = crypto
      .createHash('sha256')
      .update(`${email}:${Date.now()}:${sessionId}`)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();
    const passwordResetExpires = new Date(
      Date.now() + PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000,
    );

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires.toISOString();
    user.passwordResetAttempts = 0;
    user.passwordResetVerifiedAt = null;
    user.updatedAt = new Date().toISOString();

    const updatedUser = await this.usersRepository.save(user);

    void this.emailService.sendPasswordReset(
      updatedUser.email,
      passwordResetToken,
      passwordResetExpires,
      sessionId,
      ip,
      userAgent,
    );

    return { message: 'Reset code sent successfully' };
  }

  async verifyResetCode(payload: ResetCodeDto): Promise<{ message: string }> {
    const { email, resetCode } = payload;

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordResetToken || !user.passwordResetExpires) {
      throw new BadRequestException('No reset code found');
    }

    if (new Date(user.passwordResetExpires) < new Date()) {
      throw new BadRequestException('Code expired');
    }

    if (user.passwordResetAttempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts');
    }

    user.passwordResetAttempts += 1;

    if (user.passwordResetToken !== resetCode.toUpperCase()) {
      await this.usersRepository.save(user);
      throw new UnauthorizedException('Invalid code');
    }

    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetAttempts = 0;
    user.passwordResetVerifiedAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    await this.usersRepository.save(user);

    return { message: 'Reset code verified successfully' };
  }

  async setPassword(body: ChangePasswordDto) {
    const { email, password } = body;

    const user = await this.usersRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.passwordResetVerifiedAt) {
      throw new UnauthorizedException('Reset code is not verified');
    }

    verifyCodeValidity(user.passwordResetVerifiedAt, PASSWORD_RESET_VERIFY_WINDOW_MINUTES);

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetAttempts = 0;
    user.passwordResetVerifiedAt = null;
    user.updatedAt = new Date().toISOString();

    const updatedUser = await this.usersRepository.save(user);

    void this.emailService.sendSetPasswordLetter(updatedUser.email);

    return updatedUser;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { username } = updateUserDto;

    const result = await this.usersRepository
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        username,
        updatedAt: () => 'NOW()',
      })
      .where('id = :id', { id })
      .returning(['id', 'username'])
      .execute();

    if (!result.affected) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const updatedUser = result.raw[0];

    return {
      userId: updatedUser.id,
      username: updatedUser.username,
    };
  }

  async logout(id: number) {
    await Promise.all([
      this.usersRepository
        .createQueryBuilder()
        .update()
        .set({
          isLoggedIn: false,
          updatedAt: new Date().toISOString(),
        })
        .where('id = :id', { id })
        .execute(),
      this.sessionService.closeSession(id),
    ]);

    return { message: 'Logout successful' };
  }

  async deleteMe(id: number): Promise<{ message: string }> {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return { message: 'User profile deleted successfully' };
  }

  async uploadImage(file: Express.Multer.File, userId: number): Promise<object> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId },
      select: ['id', 'image'],
    });

    const uploadPromise = this.cloudinaryService.uploadFile(file);

    let deletePromise: Promise<any> | null = null;

    if (user.image?.includes('res.cloudinary.com')) {
      const publicId = publicIdExtract(user.image);
      deletePromise = this.cloudinaryService.deleteFile(publicId);
    }

    const [uploadResult] = await Promise.all([uploadPromise, deletePromise]);

    const { secure_url } = uploadResult;

    if (!secure_url) {
      throw new InternalServerErrorException('Error uploading image');
    }

    await this.usersRepository.update(userId, {
      image: secure_url,
      updatedAt: new Date().toISOString(),
    });

    return { secure_url };
  }

  private mapSnapshot(snapshot: BehaviorProfileSnapshotEntity) {
    return {
      id: snapshot.id,
      weekStart: snapshot.weekStart,
      weekEnd: snapshot.weekEnd,
      seenAt: snapshot.seenAt,
      actualBalance: snapshot.metrics.actualBalance,
      targetBalance: snapshot.metrics.targetBalance,
      metrics: snapshot.metrics,
      replicantScore: snapshot.score,
      type: snapshot.type,
      createdAt: snapshot.createdAt,
    };
  }

  private getCurrentWeekRangeUtc(now: Date) {
    const dayOffset = (now.getUTCDay() + 6) % 7;
    const weekStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOffset, 0, 0, 0, 0),
    );
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }

  private getLatestCompletedWeekRangeUtc(now: Date) {
    const currentWeek = this.getCurrentWeekRangeUtc(now);
    const latestCompletedWeekEnd = new Date(currentWeek.weekStart.getTime() - 1);
    if (latestCompletedWeekEnd.getTime() < 0) {
      return null;
    }
    const latestCompletedWeekStart = new Date(latestCompletedWeekEnd);
    latestCompletedWeekStart.setUTCDate(latestCompletedWeekStart.getUTCDate() - 6);
    latestCompletedWeekStart.setUTCHours(0, 0, 0, 0);
    latestCompletedWeekEnd.setUTCHours(23, 59, 59, 999);

    return { weekStart: latestCompletedWeekStart, weekEnd: latestCompletedWeekEnd };
  }

  private async buildBehaviorMetrics(
    user: Pick<UserEntity, 'id' | 'points' | 'emailVerified'>,
    startDate: Date,
    endDate: Date,
  ): Promise<BehaviorMetrics> {
    const raw = await this.casesRepository
      .createQueryBuilder('case')
      .select('COUNT(case.id)', 'caseCount')
      .addSelect('COUNT(CASE WHEN case.completeDate IS NOT NULL THEN 1 END)', 'completedCount')
      .addSelect(
        'COUNT(CASE WHEN case.completeDate IS NOT NULL AND case.deadline IS NOT NULL AND case.completeDate > case.deadline THEN 1 END)',
        'failedCount',
      )
      .addSelect('COUNT(DISTINCT DATE(case.createDate))', 'activeDays')
      .addSelect(
        'SUM(CASE WHEN case.category = :creativeCategory AND case.completeDate IS NOT NULL THEN 1 ELSE 0 END)',
        'creativeCompleted',
      )
      .addSelect(
        'SUM(CASE WHEN case.category = :workCategory AND case.completeDate IS NOT NULL THEN 1 ELSE 0 END)',
        'workCompleted',
      )
      .addSelect(
        'SUM(CASE WHEN case.category = :lifeCategory AND case.completeDate IS NOT NULL THEN 1 ELSE 0 END)',
        'lifeCompleted',
      )
      .addSelect(
        'SUM(CASE WHEN case.category = :restCategory AND case.completeDate IS NOT NULL THEN 1 ELSE 0 END)',
        'restCompleted',
      )
      .addSelect(
        'SUM(CASE WHEN case.category = :socialCategory AND case.completeDate IS NOT NULL THEN 1 ELSE 0 END)',
        'socialCompleted',
      )
      .addSelect(
        'SUM(CASE WHEN case.category = :learningCategory AND case.completeDate IS NOT NULL THEN 1 ELSE 0 END)',
        'learningCompleted',
      )
      .where('case.userId = :userId', { userId: user.id })
      .andWhere('case.createDate BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
      .setParameters({
        creativeCategory: CaseCategories.Creative,
        workCategory: CaseCategories.Work,
        lifeCategory: CaseCategories.Life,
        restCategory: CaseCategories.Rest,
        socialCategory: CaseCategories.Social,
        learningCategory: CaseCategories.Learning,
      })
      .getRawOne();

    const totalDays = Math.max(
      1,
      Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1,
    );
    const caseCount = Number(raw?.caseCount ?? 0);
    const completedCount = Number(raw?.completedCount ?? 0);
    const failedCount = Number(raw?.failedCount ?? 0);
    const activeDays = Number(raw?.activeDays ?? 0);
    const creativeCompleted = Number(raw?.creativeCompleted ?? 0);
    const workCompleted = Number(raw?.workCompleted ?? 0);
    const lifeCompleted = Number(raw?.lifeCompleted ?? 0);
    const restCompleted = Number(raw?.restCompleted ?? 0);
    const socialCompleted = Number(raw?.socialCompleted ?? 0);
    const learningCompleted = Number(raw?.learningCompleted ?? 0);
    const targetBalance = await this.getTargetBalance(user.id);

    const behaviorCompletedTotal =
      creativeCompleted +
      learningCompleted +
      lifeCompleted +
      restCompleted +
      socialCompleted +
      workCompleted;
    const actualBalance = {
      creative: behaviorCompletedTotal ? (creativeCompleted / behaviorCompletedTotal) * 100 : 0,
      learning: behaviorCompletedTotal ? (learningCompleted / behaviorCompletedTotal) * 100 : 0,
      life: behaviorCompletedTotal ? (lifeCompleted / behaviorCompletedTotal) * 100 : 0,
      rest: behaviorCompletedTotal ? (restCompleted / behaviorCompletedTotal) * 100 : 0,
      social: behaviorCompletedTotal ? (socialCompleted / behaviorCompletedTotal) * 100 : 0,
      work: behaviorCompletedTotal ? (workCompleted / behaviorCompletedTotal) * 100 : 0,
    };
    const deviationFromTarget = targetBalance
      ? BALANCE_CATEGORIES.reduce(
          (acc, category) => acc + Math.abs(actualBalance[category] - targetBalance[category]),
          0,
        ) /
        (BALANCE_CATEGORIES.length * 100)
      : null;

    return {
      caseCount,
      completedCount,
      failedCount,
      activeDays,
      totalDays,
      completionRate: caseCount ? completedCount / caseCount : 0,
      failureRate: caseCount ? failedCount / caseCount : 0,
      consistency: totalDays ? Math.min(1, activeDays / totalDays) : 0,
      actualBalance,
      targetBalance,
      deviationFromTarget,
      targetMatch: deviationFromTarget === null ? DEFAULT_TARGET_MATCH : 1 - deviationFromTarget,
      pointsSignal: this.normalizePoints(user.points ?? 0),
      verificationSignal: user.emailVerified ? 1 : 0,
    };
  }

  private async getTargetBalance(userId: number): Promise<TargetBalance> {
    const target = await this.lifeBalanceRepository.findOne({
      where: { user: { id: userId } },
      // include primary key so TypeORM can build proper DISTINCT/aliasing in generated SQL
      select: ['id', 'creative', 'learning', 'life', 'rest', 'social', 'work'],
    });
    if (!target) {
      return null;
    }

    return {
      creative: Number(target.creative),
      learning: Number(target.learning),
      life: Number(target.life),
      rest: Number(target.rest),
      social: Number(target.social),
      work: Number(target.work),
    };
  }

  private normalizePoints(points: number) {
    if (points <= 0) {
      return 0;
    }
    if (points >= 100) {
      return 1;
    }
    return points / 100;
  }

  private calculateBehaviorScore(metrics: BehaviorMetrics): { score: number; type: BehaviorType } {
    const score =
      metrics.consistency * 0.3 +
      metrics.completionRate * 0.25 +
      (1 - metrics.failureRate) * 0.15 +
      metrics.targetMatch * 0.2 +
      metrics.pointsSignal * 0.07 +
      metrics.verificationSignal * 0.03;

    const clampedScore = Math.max(BEHAVIOR_SCORE_MIN, Math.min(BEHAVIOR_SCORE_MAX, score));
    if (clampedScore < 0.4) {
      return { score: clampedScore, type: 'human' };
    }
    if (clampedScore < 0.7) {
      return { score: clampedScore, type: 'undefined' };
    }

    return { score: clampedScore, type: 'replicant' };
  }
}
