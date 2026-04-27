import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { ResetPasswordDto } from '../dto';

export const ResetPasswordDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Send password reset code',
      description:
        'Generates a one-time password reset code and sends it to the user email together with request metadata (session, IP, user-agent).',
    }),
    ApiBody({
      type: ResetPasswordDto,
      description: 'User email for password recovery.',
      examples: {
        success: {
          summary: 'Valid password reset request',
          value: {
            email: 'runner.user@example.com',
          },
        },
        invalidEmail: {
          summary: 'Invalid email format',
          value: {
            email: 'runner.userexample.com',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Reset code was generated and sent.',
      content: {
        'application/json': {
          example: {
            message: 'Reset code sent successfully',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Validation failed for email field.',
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
