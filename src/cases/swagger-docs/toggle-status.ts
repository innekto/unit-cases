import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export const ToggleStatusDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Mark a case as completed/uncompleted' }),
    ApiOkResponse({
      content: {
        'application/json': {
          example: { message: 'Case status toggled successfully' },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Case item not found',
      content: {
        'application/json': {
          example: { statusCode: 404, message: 'Case item not found', error: 'Not Found' },
        },
      },
    }),
  );
