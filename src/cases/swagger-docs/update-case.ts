import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { UpdateCaseDto } from '../dto/update-case.dto';
import { caseExample } from './case-example';

export const UpdateCaseDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({ summary: 'Update one case by id' }),
    ApiBody({
      type: UpdateCaseDto,
      description: 'Fields to update',
    }),
    ApiOkResponse({
      content: {
        'application/json': {
          example: caseExample,
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Validation failed',
      content: {
        'application/json': {
          example: { statusCode: 400, message: ['Incorrect field'], error: 'Bad Request' },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Case item not found',
      content: {
        'application/json': {
          example: { statusCode: 404, message: 'Case not found', error: 'Not Found' },
        },
      },
    }),
  );
