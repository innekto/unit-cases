import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';

import responses from '../../responses.json';
import { CreateLifeBalanceDto } from '../dto/create-life-balance.dto';

export const UpsertLifeBalanceDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Create or update life balance' }),
    ApiBody({
      type: CreateLifeBalanceDto,
      description: 'Life balance payload — sum of all fields must equal 100',
      examples: {
        success: {
          summary: 'Valid payload',
          value: {
            creative: 0,
            learning: 25,
            life: 25,
            rest: 0,
            social: 0,
            work: 50,
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Life balance created or updated successfully',
      content: {
        'application/json': {
          example: responses.lifeBalance,
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Validation failed (e.g., sum != 100 or missing fields)',
      content: {
        'application/json': {
          example: {
            statusCode: 400,
            message: 'The sum of creative, learning, life, rest, social, and work should be equal to 100',
            error: 'Bad Request',
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
    ApiInternalServerErrorResponse({
      description: 'Unexpected error occurred while saving life balance.',
      content: {
        'application/json': {
          example: {
            statusCode: 500,
            message: 'Error saving life balance',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );

export const GetLifeBalanceDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Get life balance for current user' }),
    ApiOkResponse({
      description: 'Returned life balance',
      content: {
        'application/json': {
          example: responses.lifeBalance,
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
      description: 'Life balance not found for user.',
      content: {
        'application/json': {
          example: {
            statusCode: 404,
            message: 'LifeBalanceEntity not found',
            error: 'Not Found',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Unexpected error occurred while fetching life balance.',
      content: {
        'application/json': {
          example: {
            statusCode: 500,
            message: 'Error fetching life balance',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );

