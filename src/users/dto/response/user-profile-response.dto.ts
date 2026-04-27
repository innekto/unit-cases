import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({ example: 120 })
  id!: number;

  @ApiProperty({ example: 'runner.user@example.com' })
  email!: string;

  @ApiProperty({ example: 'runner_user' })
  username!: string;

  @ApiProperty({
    nullable: true,
    example: null,
    description: 'Profile image URL. `null` if not set.',
  })
  image!: string | null;

  @ApiProperty({ example: 0 })
  points!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: false })
  isLoggedIn!: boolean;

  @ApiProperty({ example: '2026-04-12T17:38:48.095Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-04-12T17:38:48.095Z' })
  updatedAt!: string;
}
