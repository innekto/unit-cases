import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { CaseCategories, CasePriority, description } from '@/common';
import { IsValidDate } from '@/common/helpers/case-utils/decorators/is-valid-date';
import { taskTitleRegex } from '@/common/regex-patterns';
import { lowerCaseTransformer } from '@/common/transformers/lower-case.transformer';

export class CreateCaseDto {
  @IsNotEmpty()
  @Matches(taskTitleRegex, { message: 'incorrect format of title' })
  @MinLength(2)
  @MaxLength(200)
  @Transform(lowerCaseTransformer)
  readonly title!: string;

  @IsNotEmpty()
  @IsOptional()
  @Matches(taskTitleRegex, { message: 'incorrect format of description' })
  @MinLength(2)
  @MaxLength(2000)
  readonly description?: string;

  @IsNotEmpty()
  @IsEnum(CaseCategories)
  readonly category!: CaseCategories;

  @IsNotEmpty()
  @IsEnum(CasePriority)
  readonly priority!: CasePriority;

  @IsNotEmpty()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  pinned?: boolean;

  @ApiProperty({ example: '2024-05-29T17:27:11.797Z', description })
  @IsValidDate()
  @IsNotEmpty()
  deadline!: string;
}
