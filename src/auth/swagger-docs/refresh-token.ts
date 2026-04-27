import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const RefreshTokenDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Requires `Authorization: Bearer <accessToken>` and `refresh_token` cookie. Rotates session tokens and returns a fresh access token.',
    }),
    ApiCreatedResponse({
      description: 'Tokens refreshed successfully.',
      content: {
        'application/json': {
          example: {
            accessToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMCwiZW1haWwiOiJydW5uZXIudXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwic2Vzc2lvbklkIjozMiwiaWF0IjoxNzEzMDAwMTAwLCJleHAiOjE3MTMwMDM3MDB9.signature',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Cookie header is missing or `refresh_token` cookie is not provided.',
      content: {
        'application/json': {
          examples: {
            cookieMissing: {
              summary: 'Refresh cookie missing',
              value: {
                statusCode: 400,
                message: 'Refresh token is required!',
                error: 'Bad Request',
              },
            },
            userMissing: {
              summary: 'Guard did not provide user payload',
              value: {
                statusCode: 400,
                message: 'User is required!',
                error: 'Bad Request',
              },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid/expired token or closed session.',
      content: {
        'application/json': {
          examples: {
            invalidToken: {
              summary: 'Refresh token is invalid/expired',
              value: {
                statusCode: 401,
                message: 'invalid token',
                error: 'Unauthorized',
              },
            },
            sessionClosed: {
              summary: 'Session already closed',
              value: {
                statusCode: 401,
                message: 'Session is closed!',
                error: 'Unauthorized',
              },
            },
          },
        },
      },
    }),
  );
