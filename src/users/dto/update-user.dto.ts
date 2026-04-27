import { IsString, Matches } from 'class-validator';

import { userNameRegex } from '@/common/regex-patterns';

export class UpdateUserDto {
  @IsString()
  @Matches(userNameRegex, { message: 'Incorrect format of user name' })
  username!: string;
}
