import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { CreateUserDto } from '@/users/dto/create-user.dto';

export const RegisterDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register new user',
      description:
        'Creates a new account and sends an email verification code. Account remains inactive until `/auth/verify-email` is completed.',
    }),
    ApiBody({
      type: CreateUserDto,
      description: 'User registration data.',
      examples: {
        success: {
          summary: 'Valid registration payload',
          value: {
            email: 'runner.user@example.com',
            username: 'runner_user',
            password: 'StrongPass1!',
          },
        },
        weakPassword: {
          summary: 'Weak password',
          value: {
            email: 'runner.user@example.com',
            username: 'runner_user',
            password: '12345678',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'User account created successfully.',
      content: {
        'application/json': {
          example: {
            id: 120,
            email: 'runner.user@example.com',
            username: 'runner_user',
            image: null,
            points: 0,
            isActive: false,
            isLoggedIn: false,
            createdAt: '2026-04-12T17:38:48.095Z',
            updatedAt: '2026-04-12T17:38:48.095Z',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Validation failed for request body fields.',
      content: {
        'application/json': {
          examples: {
            validationError: {
              summary: 'DTO validation error',
              value: {
                statusCode: 400,
                message: [
                  'The password must contain at least one capital letter, one digit, one special character, and must not include spaces, ", \', -, =, or ;',
                ],
                error: 'Bad Request',
              },
            },
          },
        },
      },
    }),
    ApiConflictResponse({
      description: 'User with provided email already exists.',
      content: {
        'application/json': {
          examples: {
            emailExists: {
              summary: 'Email already registered',
              value: {
                statusCode: 409,
                message: 'Email already exists',
                error: 'Conflict',
              },
            },
          },
        },
      },
    }),
  );
