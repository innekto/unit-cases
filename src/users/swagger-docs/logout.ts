import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const LogoutDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'User logout',
      description:
        'Clears `refresh_token` cookie on the client and invalidates active server-side sessions for the authenticated user.',
    }),
    ApiOkResponse({
      description: 'User logged out successfully.',
      content: {
        'application/json': {
          example: {
            message: 'Logout successful',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Access token is missing, expired, or invalid.',
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
