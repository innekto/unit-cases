import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateLifeBalanceDto {
  @ApiProperty({ example: 0, description: 'Creative balance' })
  @IsNotEmpty()
  readonly creative!: number;

  @ApiProperty({ example: 10, description: 'Work balance' })
  @IsNotEmpty()
  readonly work!: number;

  @ApiProperty({ example: 25, description: 'Life balance' })
  @IsNotEmpty()
  life!: number;

  @ApiProperty({ example: 25, description: 'Learning balance' })
  @IsNotEmpty()
  learning!: number;

  @ApiProperty({ example: 20, description: 'Rest balance' })
  @IsNotEmpty()
  rest!: number;

  @ApiProperty({ example: 20, description: 'Social balance' })
  @IsNotEmpty()
  social!: number;
}
