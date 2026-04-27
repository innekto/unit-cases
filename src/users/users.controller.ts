import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { User } from 'src/common';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

import {
  BehaviorProfileResponseDto,
  WeeklyBehaviorAckResponseDto,
  WeeklyBehaviorProfileResponseDto,
} from './dto/response';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import {
  AckWeeklyBehaviorProfileDocs,
  DeleteMeDocs,
  GetBehaviorProfileDocs,
  GetMeDocs,
  GetWeeklyBehaviorProfileDocs,
  LogoutDocs,
  UpdateMeDocs,
  UploadImageDocs,
} from './swagger-docs';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @GetMeDocs()
  async loadUser(@User() user: UserEntity) {
    return await this.usersService.me(user.id);
  }

  @Get('behavior-profile')
  @GetBehaviorProfileDocs()
  async getBehaviorProfile(@User('id') userId: number): Promise<BehaviorProfileResponseDto> {
    return this.usersService.getBehaviorProfile(userId);
  }

  @Get('behavior-profile/weekly')
  @GetWeeklyBehaviorProfileDocs()
  async getWeeklyBehaviorProfile(
    @User('id') userId: number,
  ): Promise<WeeklyBehaviorProfileResponseDto | { message: string }> {
    return this.usersService.getWeeklyBehaviorProfile(userId);
  }

  @Post('behavior-profile/weekly/ack')
  @HttpCode(200)
  @AckWeeklyBehaviorProfileDocs()
  async ackWeeklyBehaviorProfile(
    @User('id') userId: number,
  ): Promise<WeeklyBehaviorAckResponseDto | { message: string }> {
    return this.usersService.ackWeeklyBehaviorProfile(userId);
  }

  @Patch('me')
  @UpdateMeDocs()
  updateMe(@User('id') userId: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(userId, updateUserDto);
  }

  @Post('logout')
  @LogoutDocs()
  async logout(@User('id') userId: number, @Res({ passthrough: true }) response: Response) {
    response.clearCookie('refresh_token');
    return this.usersService.logout(userId);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @DeleteMeDocs()
  async deleteMe(@User('id') id: number) {
    return this.usersService.deleteMe(id);
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  @UploadImageDocs()
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /image\// }),
        ],
      }),
    )
    image: Express.Multer.File,
    @User('id') userId: number,
  ) {
    const imageUrl = await this.usersService.uploadImage(image, userId);
    return imageUrl;
  }
}
