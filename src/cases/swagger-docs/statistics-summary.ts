import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import responses from '../../responses.json';

export const SummaryStatisticsDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Cases summary statistics by createDate range' }),
    ApiQuery({
      name: 'from',
      required: false,
      example: '2024-05-01T00:00:00.000Z',
      description: 'Start date in ISO 8601 format (full datetime, UTC)',
    }),
    ApiQuery({
      name: 'to',
      required: false,
      example: '2024-05-29T23:59:59.999Z',
      description: 'End date in ISO 8601 format (full datetime, UTC)',
    }),
    ApiOkResponse({
      description: 'Summary statistics',
      content: {
        'application/json': {
          example: responses.summaryStatistics,
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid date parameters',
      content: {
        'application/json': {
          example: { statusCode: 400, message: 'Invalid from or to', error: 'Bad Request' },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      content: {
        'application/json': {
          example: { statusCode: 401, message: 'Unauthorized' },
        },
      },
    }),
  );
