import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { CaseCategories, CasePriority } from '@/common';
import { AtLeastOneField } from '@/common/validators/at-least-one-field.validator';

export class UpdateCaseDto {
  @ApiHideProperty()
  @AtLeastOneField(['title', 'description', 'category', 'priority', 'pinned'], {
    message: 'At least one field must be provided',
  })
  _atLeastOneFieldCheck?: string;
  @ApiProperty({ example: 'Updated title', description: 'New title for the case' })
  @IsNotEmpty()
  @IsOptional()
  readonly title?: string;

  @ApiProperty({ example: 'Updated description', description: 'New description for the case' })
  @IsNotEmpty()
  @IsOptional()
  readonly description?: string;

  @ApiProperty({ example: 'life', description: 'New category for the case' })
  @IsNotEmpty()
  @IsEnum(CaseCategories)
  @IsOptional()
  readonly category?: CaseCategories;

  @ApiProperty({ example: 'low', description: 'New priority for the case' })
  @IsNotEmpty()
  @IsOptional()
  @IsEnum(CasePriority)
  readonly priority?: CasePriority;

  @ApiProperty({ example: true, description: 'New pinned status for the case' })
  @IsNotEmpty()
  @IsOptional()
  pinned?: boolean;
}
