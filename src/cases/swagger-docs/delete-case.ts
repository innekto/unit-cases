import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export const DeleteCaseDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Delete one case by id' }),
    ApiOkResponse({
      content: {
        'application/json': {
          example: { id: 554 },
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
