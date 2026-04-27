import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const DeleteMeDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Delete current user profile',
      description:
        'Deletes the authenticated user profile and related access to protected resources.',
    }),
    ApiOkResponse({
      description: 'User profile deleted successfully.',
      content: {
        'application/json': {
          example: {
            message: 'User profile deleted successfully',
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
            message: 'User with id 120 not found',
            error: 'Not Found',
          },
        },
      },
    }),
  );
