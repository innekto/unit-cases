import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/v1710000000/user/avatar.png',
  })
  secure_url!: string;
}
