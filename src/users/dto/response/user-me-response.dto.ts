import { ApiProperty } from '@nestjs/swagger';

import { LifeBalanceResponseDto } from './life-balance-response.dto';
import { UserProfileResponseDto } from './user-profile-response.dto';

export class UserMeResponseDto extends UserProfileResponseDto {
  @ApiProperty({ type: LifeBalanceResponseDto })
  lifeBalance!: LifeBalanceResponseDto;
}
