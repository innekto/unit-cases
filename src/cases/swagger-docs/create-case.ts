import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CreateCaseDto } from '../dto/create-case.dto';
import { caseExample } from './case-example';

export const CreateCaseDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Create new case' }),
    ApiBody({
      type: CreateCaseDto,
      description: 'Case payload',
      examples: {
        success: {
          summary: 'Valid payload',
          value: {
            title: 'Buy groceries',
            description: 'Buy milk and bread',
            category: 'life',
            priority: 'low',
            pinned: false,
            deadline: '2025-04-06T18:27:11.797Z',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Case created successfully',
      content: {
        'application/json': {
          example: {
            case: caseExample,
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Validation failed',
      content: {
        'application/json': {
          example: {
            statusCode: 400,
            message: ['Incorrect title format'],
            error: 'Bad Request',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
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
    ApiConflictResponse({
      description: 'Business rule conflict (e.g. multi-day case)',
      content: {
        'application/json': {
          example: {
            statusCode: 409,
            message: 'The case should be limited to one day!',
            error: 'Conflict',
          },
        },
      },
    }),
  );
