import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const UploadImageDocs = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Image file to upload.',
      schema: {
        type: 'object',
        properties: {
          image: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiOperation({
      summary: 'Update profile image',
      description:
        'Uploads a new profile image for the authenticated user. Accepts multipart/form-data with an `image` binary field.',
    }),
    ApiCreatedResponse({
      description: 'Profile image uploaded successfully.',
      content: {
        'application/json': {
          example: {
            secure_url: 'https://res.cloudinary.com/demo/image/upload/v1710000000/user/avatar.png',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Image file is missing, invalid type, or exceeds allowed size.',
      content: {
        'application/json': {
          examples: {
            fileMissing: {
              summary: 'File was not provided',
              value: {
                statusCode: 400,
                message: 'File is required',
                error: 'Bad Request',
              },
            },
            invalidType: {
              summary: 'Invalid file type',
              value: {
                statusCode: 400,
                message: 'Validation failed (expected type is /image//)',
                error: 'Bad Request',
              },
            },
            tooLarge: {
              summary: 'File too large',
              value: {
                statusCode: 400,
                message: 'Validation failed (expected size is less than 2097152)',
                error: 'Bad Request',
              },
            },
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
            message: 'UserEntity not found',
            error: 'Not Found',
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Unexpected error occurred while uploading image.',
      content: {
        'application/json': {
          example: {
            statusCode: 500,
            message: 'Error uploading image',
            error: 'Internal Server Error',
          },
        },
      },
    }),
  );
