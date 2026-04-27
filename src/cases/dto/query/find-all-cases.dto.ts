import { IsEnum, IsOptional, IsString } from 'class-validator';

import { CaseCategories, CaseDateFilter, CasePriority } from '@/common';

enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FindAllCasesDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsEnum(CaseDateFilter)
  dateType?: CaseDateFilter;

  @IsOptional()
  @IsEnum(CaseCategories)
  category?: CaseCategories;

  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder;
}
