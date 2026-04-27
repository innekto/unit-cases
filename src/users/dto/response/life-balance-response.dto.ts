import { ApiProperty } from '@nestjs/swagger';

export class LifeBalanceResponseDto {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: 0 })
  creative!: number;

  @ApiProperty({ example: 50 })
  work!: number;

  @ApiProperty({ example: 25 })
  life!: number;

  @ApiProperty({ example: 25 })
  learning!: number;

  @ApiProperty({ example: 0 })
  rest!: number;

  @ApiProperty({ example: 0 })
  social!: number;
}
