import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { CaseCategories, CaseDateFilter, CasePriority } from '@/common';

import responses from '../../responses.json';

export const FindAllDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      description: 'Get cases with optional date range filter (by creation or completion date)',
    }),
    ApiQuery({
      name: 'dateType',
      required: false,
      enum: CaseDateFilter,
      description: 'Filter by created or completed date',
      example: CaseDateFilter.CREATED,
    }),
    ApiQuery({
      name: 'from',
      required: false,
      example: '2024-05-01T00:00:00.000Z',
      description: 'Start date in ISO 8601 format (full datetime, UTC)',
    }),
    ApiQuery({
      name: 'category',
      required: false,
      enum: CaseCategories,
      description: 'Filter by case category',
    }),
    ApiQuery({
      name: 'priority',
      required: false,
      enum: CasePriority,
      description: 'Filter by case priority',
    }),
    ApiQuery({
      name: 'order',
      required: false,
      enum: ['ASC', 'DESC'],
      example: 'DESC',
      description: 'Sort direction for the selected date field',
    }),
    ApiQuery({
      name: 'to',
      required: false,
      example: '2024-05-29T23:59:59.999Z',
      description: 'End date in ISO 8601 format (full datetime, UTC)',
    }),
    ApiOkResponse({
      content: {
        'application/json': {
          example: responses.casesByDay,
        },
      },
    }),
  );
