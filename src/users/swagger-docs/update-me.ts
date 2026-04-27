import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UpdateUserDto } from '../dto/update-user.dto';

export const UpdateMeDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),

    ApiOperation({
      summary: 'Update current user',
      description:
        'Updates the authenticated user profile. Only editable fields like username are allowed. Returns an object with the updated user id and username.',
    }),

    ApiBody({
      type: UpdateUserDto,
      required: true,
    }),

    ApiOkResponse({
      description: 'User successfully updated',
      content: {
        'application/json': {
          example: {
            userId: 9,
            username: 'Ronny',
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: 'Validation failed (invalid username)',
      content: {
        'application/json': {
          examples: {
            invalidUsername: {
              summary: 'Username does not match regex',
              value: {
                statusCode: 400,
                message: ['Incorrect format of user name'],
                error: 'Bad Request',
              },
            },
          },
        },
      },
    }),

    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
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
      description: 'User not found in database',
      content: {
        'application/json': {
          example: {
            statusCode: 404,
            message: 'User with id 9 not found',
            error: 'Not Found',
          },
        },
      },
    }),
  );
