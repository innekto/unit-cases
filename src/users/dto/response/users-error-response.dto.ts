import { ApiProperty } from '@nestjs/swagger';

export class UsersErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP status code.',
  })
  statusCode!: number;

  @ApiProperty({
    description:
      'Error message. Validation errors can return an array, business errors return a string.',
    oneOf: [
      {
        type: 'string',
        example: 'User with id 123 not found',
      },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['Incorrect format of user name'],
      },
    ],
  })
  message!: string | string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'HTTP error name.',
  })
  error!: string;
}
