import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

import { lowerCaseTransformer, noSpaces } from '@/common';
import { emailRegex } from '@/common/regex-patterns';

export class LoginUserDto {
  @ApiProperty({
    example: 'runner.user@example.com',
    description: 'User email used for authentication.',
  })
  @Transform(lowerCaseTransformer)
  @noSpaces({ message: 'The email address cannot contain spaces' })
  @Matches(emailRegex, { message: 'Incorrect email format' })
  email!: string;

  @IsString()
  @ApiProperty({
    example: 'StrongPass1!',
    description: 'Account password.',
  })
  password!: string;
}
