import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { VerifyEmailDto } from '../dto';

export const VerifyEmailDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verify email code',
      description:
        'Validates the verification code sent during registration and activates the user account.',
    }),
    ApiBody({
      type: VerifyEmailDto,
      description: 'Email and one-time verification code.',
      examples: {
        success: {
          summary: 'Valid email verification request',
          value: {
            email: 'runner.user@example.com',
            code: 'A1B2C3D4',
          },
        },
        invalidCodeFormat: {
          summary: 'Invalid code length',
          value: {
            email: 'runner.user@example.com',
            code: '123',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description:
        'Verification completed. If already verified, returns a message without user payload.',
      content: {
        'application/json': {
          examples: {
            verified: {
              summary: 'Email verified',
              value: {
                message: 'Email verified successfully',
                user: {
                  id: 120,
                  email: 'runner.user@example.com',
                  emailVerified: true,
                },
              },
            },
            alreadyVerified: {
              summary: 'Email already verified',
              value: {
                message: 'Email already verified',
              },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Verification code missing or expired.',
      content: {
        'application/json': {
          examples: {
            noCode: {
              summary: 'Verification was not requested',
              value: {
                statusCode: 400,
                message: 'No verification code found',
                error: 'Bad Request',
              },
            },
            codeExpired: {
              summary: 'Code has expired',
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
      description: 'Provided verification code is invalid.',
      content: {
        'application/json': {
          examples: {
            invalidCode: {
              summary: 'Submitted code mismatch',
              value: {
                statusCode: 401,
                message: 'Invalid code',
                error: 'Unauthorized',
              },
            },
          },
        },
      },
    }),
    ApiTooManyRequestsResponse({
      description: 'Maximum verification attempts exceeded.',
      content: {
        'application/json': {
          examples: {
            tooManyAttempts: {
              summary: 'Attempts limit reached',
              value: {
                statusCode: 429,
                message: 'Too many attempts',
                error: 'Too Many Requests',
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'User with provided email was not found.',
      content: {
        'application/json': {
          examples: {
            userNotFound: {
              summary: 'User does not exist',
              value: {
                statusCode: 404,
                message: 'User not found',
                error: 'Not Found',
              },
            },
          },
        },
      },
    }),
  );
