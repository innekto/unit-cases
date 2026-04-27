import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const AckWeeklyBehaviorProfileDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Acknowledge weekly behavior digest',
      description: 'Marks unseen weekly behavior digest as seen for the authenticated user.',
    }),
    ApiOkResponse({
      description: 'Weekly digest acknowledgement state.',
      content: {
        'application/json': {
          examples: {
            acknowledged: {
              summary: 'Weekly digest marked as seen',
              value: {
                message: 'Weekly result acknowledged',
                seenAt: '2026-04-21T09:14:22.000Z',
              },
            },
            noUnseen: {
              summary: 'No digest to acknowledge',
              value: {
                message: 'No unseen weekly result',
              },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
      content: {
        'application/json': {
          example: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Unauthorized',
          },
        },
      },
    }),
  );
