import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { lowerCaseTransformer, NoDangerousChars, noSpaces } from '@/common';
import { emailRegex, passwordRegex } from '@/common/regex-patterns';

export class CreateUserDto {
  @ApiProperty({ example: 'example@ex.com' })
  @noSpaces({ message: 'The email address cannot contain spaces' })
  @Transform(lowerCaseTransformer)
  @Matches(emailRegex, { message: 'Incorrect email format' })
  @NoDangerousChars({
    message: 'The email contains potentially dangerous characters',
  })
  readonly email!: string;

  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers and underscores',
  })
  @NoDangerousChars({
    message: 'The username contains potentially dangerous characters',
  })
  readonly username!: string;

  @ApiProperty({ example: '182j2nsdk' })
  @IsString()
  @Matches(passwordRegex, {
    message:
      'The password must contain at least one capital letter, one digit, one special character, and must not include spaces, ", \', -, =, or ;',
  })
  @MinLength(8)
  @MaxLength(20)
  @NoDangerousChars({
    message: 'The password contains potentially dangerous characters',
  })
  readonly password!: string;
}
