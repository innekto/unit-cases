import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { lowerCaseTransformer, noSpaces } from '@/common';
import { emailRegex, passwordRegex } from '@/common/regex-patterns';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'runner.user@example.com',
    description: 'Email that has successfully verified the reset code.',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(lowerCaseTransformer)
  @noSpaces({ message: 'The email address cannot contain spaces' })
  @Matches(emailRegex, { message: 'Incorrect email format' })
  email!: string;

  @ApiProperty({
    example: 'NewStrongPass1!',
    description: 'New password for the account.',
    minLength: 8,
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(passwordRegex, {
    message: 'the password must contain one capital letter, one digit and one special character',
  })
  @MinLength(8)
  @MaxLength(20)
  password!: string;
}
