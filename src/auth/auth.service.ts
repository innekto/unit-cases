import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { DataSource } from 'typeorm';

import { JwtPayload } from '@/common';
import { UserEntity } from '@/users/entities/user.entity';

type LoginInput = UserEntity | { user: UserEntity };
type Tokens = { accessToken: string; refreshToken: string };

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private datasource: DataSource,
  ) {}

  async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.usersService.findOneByParams({
      email,
      isActive: true,
      deletedAt: null,
    });
    if (!user.password) {
      throw new BadRequestException('You must set a password for your account');
    }
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: LoginInput): Promise<Tokens> {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      const manager = queryRunner.manager;
      const normUser = this.normalizeLoginUser(user);

      normUser.isLoggedIn = true;
      normUser.updatedAt = new Date().toISOString();

      const savedUserId = await this.usersService.saveUser(normUser, manager);

      const session = await this.usersService.createSession(savedUserId, manager);

      await queryRunner.commitTransaction();

      const { accessToken, refreshToken } = await this.generateTokens(
        normUser.email,
        savedUserId,
        session.id,
      );

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refreshToken(user: JwtPayload, previousRefreshToken: string): Promise<Tokens> {
    let payload: JwtPayload;
    const refreshSecret = this.configService.get<string>('REFRESH_JWT_SECRET');
    if (!refreshSecret) {
      throw new UnauthorizedException('invalid token');
    }
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(previousRefreshToken, {
        secret: refreshSecret,
        ignoreExpiration: true,
      });
    } catch {
      throw new UnauthorizedException('invalid token');
    }

    if (!payload?.sub || !payload.email || !payload.sessionId || !payload.exp) {
      throw new UnauthorizedException('invalid token');
    }
    const now = Math.floor(Date.now() / 1000);

    if (payload.sub !== user.sub) {
      throw new UnauthorizedException('invalid token');
    }

    if (payload.exp <= now) {
      await this.usersService.logout(payload.sub);
      throw new UnauthorizedException('invalid token');
    }

    await this.usersService.findOneForRefreshToken(payload.email);
    const sessionId = payload.sessionId;

    const newSession = await this.usersService.findOpenedSessionAndDelete(sessionId, payload.sub);

    const { accessToken, refreshToken } = await this.generateTokens(
      payload.email,
      payload.sub,
      newSession.id,
    );

    return { accessToken, refreshToken };
  }

  private normalizeLoginUser(user: LoginInput): UserEntity {
    return (user as { user?: UserEntity }).user ?? (user as UserEntity);
  }

  private async generateTokens(
    email: string,
    id: number,
    sessionId: number,
  ): Promise<Tokens> {
    const refreshSecret = this.configService.get<string>('REFRESH_JWT_SECRET');
    if (!refreshSecret) {
      throw new Error('REFRESH_JWT_SECRET is not configured');
    }
    const payload: Pick<JwtPayload, 'email' | 'sub' | 'sessionId'> = {
      email,
      sub: id,
      sessionId,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: refreshSecret,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
