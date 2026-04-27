import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindManyOptions, FindOneOptions, Repository } from 'typeorm';

import { CaseCategories, CaseDateFilter, CasePriority, isValidCategory } from '@/common';
import { UserEntity } from '@/users/entities/user.entity';

import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseEntity } from './entities/case.entity';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(CaseEntity)
    private readonly caseRepository: Repository<CaseEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private datasource: DataSource,
  ) {}

  async searchCases(
    title: string,
    userId: number,
    limit: number,
    page: number,
  ): Promise<
    | {
        data: CaseEntity[];
        total: number;
        page: number;
        limit: number;
      }
    | { message: string }
  > {
    const [cases, total] = await this.caseRepository
      .createQueryBuilder('case')
      .where('case.userId = :userId', { userId })
      .andWhere('case.title LIKE :query', { query: `%${title}%` })
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (!total) {
      return { message: 'cases not found' };
    }

    return {
      data: cases,
      total,
      page: +page,
      limit: +limit,
    };
  }

  async findAllByParams(params: Record<string, any>, relations?: string[]): Promise<CaseEntity[]> {
    const queryOptions: FindManyOptions<CaseEntity> = {
      where: params,
      relations,
    };

    return await this.caseRepository.find(queryOptions);
  }

  async findOneByParams(params: Record<string, any>, relations?: string[]): Promise<CaseEntity> {
    const queryOptions: FindOneOptions<CaseEntity> = {
      where: params,
      relations,
    };

    return await this.caseRepository.findOneOrFail(queryOptions);
  }

  async findAll(
    userId: number,
    from?: string,
    to?: string,
    dateType: CaseDateFilter = CaseDateFilter.CREATED,
    category?: CaseCategories,
    priority?: CasePriority,
    order?: 'ASC' | 'DESC',
  ) {
    if (category && !isValidCategory(category)) {
      throw new ConflictException('No such category exists');
    }

    const qb = this.caseRepository.createQueryBuilder('c').where('c.userId = :userId', { userId });

    const isCompleted = dateType === CaseDateFilter.COMPLETED;
    const dateField = isCompleted ? 'c.completeDate' : 'c.createDate';

    if (isCompleted) {
      qb.andWhere('c.completeDate IS NOT NULL');
    }

    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    if (fromDate && isNaN(fromDate.getTime())) {
      throw new Error('Invalid from');
    }

    if (toDate && isNaN(toDate.getTime())) {
      throw new Error('Invalid to');
    }

    if (fromDate) {
      qb.andWhere(`${dateField} >= :from`, { from: fromDate.toISOString() });
    }

    if (toDate) {
      qb.andWhere(`${dateField} <= :to`, { to: toDate.toISOString() });
    }

    if (category) {
      qb.andWhere('c.category = :category', { category });
    }

    if (priority) {
      qb.andWhere('c.priority = :priority', { priority });
    }

    const finalOrder = order && (order === 'ASC' || order === 'DESC') ? order : 'DESC';
    qb.orderBy(dateField, finalOrder);

    return qb.getMany();
  }

  async create(userId: number, payload: CreateCaseDto) {
    const { deadline, ...caseData } = payload;

    const result = await this.caseRepository
      .createQueryBuilder()
      .insert()
      .into(CaseEntity)
      .values({
        ...caseData,
        createDate: new Date().toISOString(),
        deadline: new Date(deadline).toISOString(),
        user: { id: userId },
      })
      .returning('*')
      .execute();

    const createdCase = result.raw[0];
    return { case: createdCase };
  }
  async update(userId: number, caseId: number, payload: UpdateCaseDto) {
    const caseItem = await this.caseRepository.findOneOrFail({
      where: { user: { id: userId }, id: caseId },
    });

    await this.caseRepository.update(caseItem.id, payload);
    return await this.findOne(userId, caseId);
  }

  async remove(userId: number, caseId: number) {
    const caseItem = await this.caseRepository.findOneOrFail({
      where: { id: caseId, user: { id: userId } },
      select: ['id'],
    });

    await this.caseRepository.remove(caseItem);
    return caseItem;
  }

  async findOne(userId: number, caseId: number): Promise<CaseEntity> {
    return await this.findOneByParams({ id: caseId, user: { id: userId } });
  }

  async toggleCaseStatus(userId: number, caseId: number): Promise<{ message: string }> {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const manager = queryRunner.manager;

    try {
      const caseItem = await manager
        .createQueryBuilder(CaseEntity, 'case')
        .select(['case.id', 'case.deadline', 'case.completeDate'])
        .where('case.id = :caseId', { caseId })
        .andWhere('case.userId = :userId', { userId })
        .getOneOrFail();

      const isSuccessfulCompleted =
        !!caseItem.completeDate && caseItem.completeDate < caseItem.deadline;
      const newCompleteDate = caseItem.completeDate ? null : new Date().toISOString();
      const isSuccessfulComplete = !!newCompleteDate && newCompleteDate < caseItem.deadline;

      await manager.update(CaseEntity, caseItem.id, { completeDate: newCompleteDate });

      const pointsDelta = Number(isSuccessfulComplete) * 10 - Number(isSuccessfulCompleted) * 10;
      if (pointsDelta > 0) {
        await manager.increment(UserEntity, { id: userId }, 'points', pointsDelta);
      } else if (pointsDelta < 0) {
        await manager.decrement(UserEntity, { id: userId }, 'points', Math.abs(pointsDelta));
      }

      await queryRunner.commitTransaction();
      return { message: 'Case status toggled successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getCasesStatisticsForPeriod(
    userId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<object> {
    const user = await this.userRepository.findOneByOrFail({ id: userId });

    const casesStatistics = await this.caseRepository
      .createQueryBuilder('case')
      .select('COUNT(case.id) as "caseCount"')
      .addSelect(
        'COUNT(CASE WHEN case.completeDate IS NOT NULL THEN 1 END) as "completedCasesCount"',
      )
      .addSelect(
        'SUM(CASE WHEN case.category = :workCategory AND case.completeDate IS NOT NULL THEN 1 ELSE 0 END)',
        'work',
      )
      .addSelect(
        'SUM(CASE WHEN case.category = :lifeCategory AND case.completeDate IS NOT NULL THEN 1 ELSE 0 END)',
        'life',
      )
      .addSelect(
        'SUM(CASE WHEN case.category = :learningCategory AND case.completeDate IS NOT NULL THEN 1 ELSE 0 END)',
        'learning',
      )
      .where('case.userId = :userId', { userId: user.id })
      .andWhere('DATE(case.createDate) BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .setParameters({
        userId,
        workCategory: CaseCategories.Work,
        lifeCategory: CaseCategories.Life,
        learningCategory: CaseCategories.Learning,
        startDate,
        endDate,
      })
      .getRawOne();

    const { caseCount, completedCasesCount, work, life, learning } = casesStatistics;

    return {
      caseCount: +caseCount,
      completedCasesCount: +completedCasesCount,
      work: +work,
      life: +life,
      learning: +learning,
    };
  }

  async getSummaryStatisticsForPeriod(userId: number, from?: string, to?: string): Promise<object> {
    const user = await this.userRepository.findOneByOrFail({ id: userId });

    const startDate = from ? new Date(from) : new Date(0);
    const endDate = to ? new Date(to) : new Date();

    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid from');
    }
    if (isNaN(endDate.getTime())) {
      throw new Error('Invalid to');
    }

    const cats: string[] = Object.values(CaseCategories) as string[];

    const qb = this.caseRepository
      .createQueryBuilder('case')
      .where('case.userId = :userId', { userId: user.id });

    qb.andWhere('case.createDate BETWEEN :startDate AND :endDate', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    qb.select('COUNT(case.id)', 'caseCount');

    for (const cat of cats) {
      const safe = cat;
      qb.addSelect(
        `SUM(CASE WHEN case.category = :${safe}_cat AND case.completeDate IS NOT NULL THEN 1 ELSE 0 END)`,
        `completed_${safe}`,
      );
      qb.addSelect(
        `SUM(CASE WHEN case.category = :${safe}_cat AND case.completeDate IS NOT NULL AND case.deadline IS NOT NULL AND case.completeDate > case.deadline THEN 1 ELSE 0 END)`,
        `failed_${safe}`,
      );
      qb.addSelect(
        `SUM(CASE WHEN case.category = :${safe}_cat AND case.completeDate IS NULL THEN 1 ELSE 0 END)`,
        `uncompleted_${safe}`,
      );
      qb.setParameter(`${safe}_cat`, cat);
    }

    const raw = await qb.getRawOne();

    const completedCases: Record<string, number> = {};
    const failedCases: Record<string, number> = {};
    const uncompletedCases: Record<string, number> = {};

    for (const cat of cats) {
      const key = cat;
      completedCases[key] = Number(raw[`completed_${cat}`] ?? 0);
      failedCases[key] = Number(raw[`failed_${cat}`] ?? 0);
      uncompletedCases[key] = Number(raw[`uncompleted_${cat}`] ?? 0);
    }

    return {
      caseCount: Number(raw.caseCount ?? 0),
      completedCases,
      failedCases,
      uncompletedCases,
    };
  }
}
