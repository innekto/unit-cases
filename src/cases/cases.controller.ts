import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  CreateCaseDocs,
  DeleteCaseDocs,
  FindAllDocs,
  GetCaseDocs,
  SearchCasesDocs,
  SummaryStatisticsDocs,
  ToggleStatusDocs,
  UpdateCaseDocs,
} from '@/cases/swagger-docs';
import { CaseDateFilter, User } from '@/common';

import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { FindAllCasesDto } from './dto/query/find-all-cases.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseEntity } from './entities/case.entity';

@Controller('cases')
@ApiTags('Cases')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @CreateCaseDocs()
  async createOne(@User('id') userId: number, @Body() payload: CreateCaseDto) {
    return await this.casesService.create(userId, payload);
  }

  @SearchCasesDocs()
  @Get('search')
  searchCases(
    @User('id') userId: number,
    @Query('title') title: string,
    @Query('limit', new ParseIntPipe()) limit = 5,
    @Query('page', new ParseIntPipe()) page = 1,
  ): Promise<
    | {
        data: CaseEntity[];
        total: number;
        page: number;
        limit: number;
      }
    | { message: string }
  > {
    return this.casesService.searchCases(title, userId, limit, page);
  }

  @Get()
  @FindAllDocs()
  async findAll(@User('id') userId: number, @Query() query: FindAllCasesDto) {
    const { from, to, dateType, category, priority, order } = query;

    const resolvedDateType = dateType ?? CaseDateFilter.CREATED;

    return this.casesService.findAll(userId, from, to, resolvedDateType, category, priority, order);
  }

  @Get(':id')
  @GetCaseDocs()
  async getById(
    @User('id') userId: number,
    @Param('id', new ParseIntPipe()) caseId: number,
  ): Promise<CaseEntity> {
    return await this.casesService.findOne(userId, caseId);
  }

  @Patch(':id')
  @UpdateCaseDocs()
  async update(
    @User('id') userId: number,
    @Param('id', new ParseIntPipe()) caseId: number,
    @Body() payload: UpdateCaseDto,
  ) {
    return await this.casesService.update(userId, caseId, payload);
  }

  @Delete(':id')
  @DeleteCaseDocs()
  async remove(@User('id') userId: number, @Param('id') caseId: number) {
    return await this.casesService.remove(userId, caseId);
  }

  @Patch('toggle-status/:caseId')
  @ToggleStatusDocs()
  async toggleCaseStatus(
    @User('id') userId: number,
    @Param('caseId', new ParseIntPipe()) caseId: number,
  ): Promise<{ message: string }> {
    return this.casesService.toggleCaseStatus(userId, caseId);
  }

  // chart-period endpoint removed

  @SummaryStatisticsDocs()
  @Get('statistics/summary')
  async getCasesStatisticsSummary(
    @User('id') userId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<object> {
    return this.casesService.getSummaryStatisticsForPeriod(userId, from, to);
  }
}
