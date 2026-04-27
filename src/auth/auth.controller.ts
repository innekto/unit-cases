import { BadRequestException, Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public, setRefreshTokenCookie, User } from 'src/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';

import { JwtPayload } from '@/common';
import { UserEntity } from '@/users/entities/user.entity';

import { AuthService } from './auth.service';
import { ChangePasswordDto, ResetCodeDto, ResetPasswordDto, VerifyEmailDto } from './dto';
import { RefreshJwtAuthGuard } from './guards/jwt-refresh-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import {
  LoginDocs,
  RefreshTokenDocs,
  RegisterDocs,
  ResetPasswordDocs,
  SetNewPasswordDocs,
  VerifyEmailDocs,
  VerifyResetCodeDocs,
} from './swagger-docs';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  private getRequestMeta(req: Request): { sessionId: string; ip: string; userAgent: string } {
    const sessionId = crypto.randomUUID();
    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0];
    const userAgentHeader = req.headers['user-agent'];
    const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader.join(' ') : userAgentHeader;
    const ip = forwardedIp || req.socket.remoteAddress || 'unknown';

    return { sessionId, ip, userAgent: userAgent || 'unknown' };
  }

  @UseGuards(LocalAuthGuard)
  @Public()
  @LoginDocs()
  @Post('login')
  async login(@User() user: UserEntity, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken } = await this.authService.login(user);

    setRefreshTokenCookie(response, refreshToken);

    return { accessToken };
  }

  @Public()
  @RegisterDocs()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    return this.usersService.create(createUserDto, this.getRequestMeta(req));
  }

  @VerifyEmailDocs()
  @Post('verify-email')
  @Public()
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.usersService.verifyEmail(dto);
  }

  @Public()
  @ResetPasswordDocs()
  @Post('reset-password')
  async requestPasswordReset(@Body() payload: ResetPasswordDto, @Req() req: Request) {
    return this.usersService.resetPassword(payload, this.getRequestMeta(req));
  }

  @Public()
  @VerifyResetCodeDocs()
  @Post('verify-reset-code')
  async verifyResetCode(@Body() payload: ResetCodeDto) {
    return this.usersService.verifyResetCode(payload);
  }

  @Public()
  @SetNewPasswordDocs()
  @Post('set-new-password')
  async verifyPasswordReset(
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.usersService.setPassword(body);
    const { accessToken, refreshToken } = await this.authService.login(user);

    setRefreshTokenCookie(response, refreshToken);

    return { accessToken };
  }

  @Public()
  @RefreshTokenDocs()
  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh-token')
  async refreshToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const authUser = request.user as JwtPayload | undefined;
    if (!authUser) {
      throw new BadRequestException('User is required!');
    }

    const existingRefreshToken = request.cookies?.refresh_token;
    if (!existingRefreshToken || typeof existingRefreshToken !== 'string') {
      throw new BadRequestException('Refresh token is required!');
    }

    const { accessToken, refreshToken } = await this.authService.refreshToken(
      authUser,
      existingRefreshToken,
    );

    setRefreshTokenCookie(response, refreshToken);

    return { accessToken };
  }
}
