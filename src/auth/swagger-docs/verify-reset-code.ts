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

import { ResetCodeDto } from '../dto';

export const VerifyResetCodeDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verify password reset code',
      description:
        'Checks whether provided reset code is valid for the given email. On success, marks email as eligible for `/auth/set-new-password`.',
    }),
    ApiBody({
      type: ResetCodeDto,
      description: 'Email and reset code from recovery email.',
      examples: {
        success: {
          summary: 'Valid reset code verification',
          value: {
            email: 'runner.user@example.com',
            resetCode: '7F3A8D2C',
          },
        },
        invalidCodeFormat: {
          summary: 'Invalid code format',
          value: {
            email: 'runner.user@example.com',
            resetCode: '***',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Reset code verified successfully.',
      content: {
        'application/json': {
          example: {
            message: 'Reset code verified successfully',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'No reset code found or code has expired.',
      content: {
        'application/json': {
          examples: {
            noCode: {
              summary: 'Reset code was not requested',
              value: {
                statusCode: 400,
                message: 'No reset code found',
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
      description: 'Provided reset code is invalid.',
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
      description: 'Maximum reset verification attempts exceeded.',
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
