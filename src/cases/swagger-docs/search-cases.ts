import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

import { caseExample } from './case-example';

export const SearchCasesDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Search cases by title' }),
    ApiQuery({ name: 'title', required: true, description: 'Search query' }),
    ApiQuery({ name: 'limit', required: false, example: 5 }),
    ApiQuery({ name: 'page', required: false, example: 1 }),
    ApiOkResponse({
      content: {
        'application/json': {
          example: {
            data: [caseExample],
            total: 1,
            page: 1,
            limit: 5,
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Validation failed',
      content: {
        'application/json': {
          example: { statusCode: 400, message: ['title must be provided'], error: 'Bad Request' },
        },
      },
    }),
  );
