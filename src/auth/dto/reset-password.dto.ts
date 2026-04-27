import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

import { lowerCaseTransformer, noSpaces } from '@/common';
import { emailRegex } from '@/common/regex-patterns';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'runner.user@example.com',
    description: 'Email where the password reset code will be sent.',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(lowerCaseTransformer)
  @noSpaces({ message: 'The email address cannot contain spaces' })
  @Matches(emailRegex, { message: 'Incorrect email format' })
  email!: string;
}
