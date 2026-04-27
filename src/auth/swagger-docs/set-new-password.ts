import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ChangePasswordDto } from '../dto';

export const SetNewPasswordDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Set new password',
      description:
        'Sets a new password after successful reset-code verification. Returns a new access token and sets refresh_token cookie.',
    }),

    ApiBody({
      type: ChangePasswordDto,
      examples: {
        success: {
          summary: 'Valid request',
          value: {
            email: 'runner.user@example.com',
            password: 'NewStrongPass1!',
          },
        },
        invalidPassword: {
          summary: 'Weak password',
          value: {
            email: 'runner.user@example.com',
            password: '123',
          },
        },
      },
    }),

    ApiCreatedResponse({
      description: 'Password successfully changed',
      content: {
        'application/json': {
          example: {
            accessToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMCwiZW1haWwiOiJydW5uZXIudXNlckBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwic2Vzc2lvbklkIjozMSwiaWF0IjoxNzEzMDAwMDAwLCJleHAiOjE3MTMwMDM2MDB9.signature',
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: 'Validation failed or code expired',
      content: {
        'application/json': {
          examples: {
            validationError: {
              summary: 'DTO validation error',
              value: {
                statusCode: 400,
                message: [
                  'password must be longer than or equal to 8 characters',
                  'the password must contain one capital letter, one digit and one special character',
                ],
                error: 'Bad Request',
              },
            },
            invalidEmail: {
              summary: 'Invalid email format',
              value: {
                statusCode: 400,
                message: ['Incorrect email format'],
                error: 'Bad Request',
              },
            },
            codeExpired: {
              summary: 'Reset code expired',
              value: {
                statusCode: 400,
                message: 'Code expired',
                error: 'Bad Request',
              },
            },
          },
        },
      },
    }),

    ApiUnauthorizedResponse({
      description: 'Authentication-related errors',
      content: {
        'application/json': {
          examples: {
            userNotFound: {
              summary: 'User does not exist',
              value: {
                statusCode: 401,
                message: 'User not found',
                error: 'Unauthorized',
              },
            },
            resetNotVerified: {
              summary: 'Reset code not verified',
              value: {
                statusCode: 401,
                message: 'Reset code is not verified',
                error: 'Unauthorized',
              },
            },
          },
        },
      },
    }),
  );
