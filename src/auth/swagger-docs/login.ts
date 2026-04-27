import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { LoginUserDto } from '../dto';

export const LoginDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'User login',
      description:
        'Authenticates the user by email/password. Returns an access token in response body and sets `refresh_token` as an HTTP-only cookie.',
    }),
    ApiBody({
      type: LoginUserDto,
      description: 'User credentials.',
      examples: {
        success: {
          summary: 'Valid credentials',
          value: {
            email: 'runner.user@example.com',
            password: 'StrongPass1!',
          },
        },
        invalidEmail: {
          summary: 'Invalid email format',
          value: {
            email: 'runner.userexample.com',
            password: 'StrongPass1!',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Login successful. Access token issued.',
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
      description:
        'Validation failed or the account exists without password (for example social sign-up account).',

      content: {
        'application/json': {
          examples: {
            validationError: {
              summary: 'DTO validation error',
              value: {
                statusCode: 400,
                message: ['Incorrect email format'],
                error: 'Bad Request',
              },
            },
            passwordMissing: {
              summary: 'Password not set for account',
              value: {
                statusCode: 400,
                message: 'You must set a password for your account',
                error: 'Bad Request',
              },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid credentials or user not found.',
      content: {
        'application/json': {
          examples: {
            invalidCredentials: {
              summary: 'Password mismatch',
              value: {
                statusCode: 401,
                message: 'Unauthorized',
                error: 'Unauthorized',
              },
            },
            userNotFound: {
              summary: 'User does not exist',
              value: {
                statusCode: 401,
                message: 'User not found',
                error: 'Unauthorized',
              },
            },
          },
        },
      },
    }),
  );
