import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const GetMeDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get current user profile',
      description:
        'Returns profile and balance information for the authenticated user from the active access token context.',
    }),
    ApiOkResponse({
      description: 'Current user profile and balance returned successfully.',
      content: {
        'application/json': {
          example: {
            id: 120,
            email: 'runner.user@example.com',
            username: 'runner_user',
            image: null,
            points: 0,
            isActive: true,
            isLoggedIn: true,
            lifeBalance: {
              id: 4,
              creative: 0,
              learning: 25,
              life: 25,
              rest: 0,
              social: 0,
              work: 50,
            },
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
    ApiNotFoundResponse({
      description: 'Authenticated user was not found.',
      content: {
        'application/json': {
          example: {
            statusCode: 404,
            message: 'User not found',
            error: 'Not Found',
          },
        },
      },
    }),
  );
