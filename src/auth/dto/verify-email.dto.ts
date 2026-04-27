import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'runner.user@example.com',
    description: 'Email used during registration.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'A1B2C3D4',
    description: '8-character verification code from registration email.',
  })
  @IsString()
  @Length(8, 8)
  code!: string;
}
