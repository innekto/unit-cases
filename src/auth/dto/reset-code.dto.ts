import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

import { lowerCaseTransformer, noSpaces } from '@/common';
import { emailRegex } from '@/common/regex-patterns';

export class ResetCodeDto {
  @ApiProperty({
    example: 'runner.user@example.com',
    description: 'Email used when requesting the reset code.',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(lowerCaseTransformer)
  @noSpaces({ message: 'The email address cannot contain spaces' })
  @Matches(emailRegex, { message: 'Incorrect email format' })
  email!: string;

  @ApiProperty({
    example: '7F3A8D2C',
    description: '8-character one-time reset code from email.',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Length(8, 8)
  @Matches(/^[A-Z0-9]+$/, { message: 'Reset code must contain only letters and numbers' })
  resetCode!: string;
}
