import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { caseExample } from './case-example';

export const GetCaseDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Get one case by id' }),
    ApiOkResponse({
      content: {
        'application/json': {
          example: caseExample,
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Case not found',
      content: {
        'application/json': {
          example: { statusCode: 404, message: 'Case not found', error: 'Not Found' },
        },
      },
    }),
  );
