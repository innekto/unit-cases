import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from '@/common';
import { SessionService } from '@/session/session.service';
import { UsersService } from '@/users/users.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly userService: UsersService,
    private readonly sessionService: SessionService,
    configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub || !payload.sessionId || !payload.exp) {
      throw new UnauthorizedException();
    }

    const nowInSeconds = Date.now() / 1000;
    const payloadExpInSeconds = payload.exp;

    if (nowInSeconds - payloadExpInSeconds >= 2 * 3600) {
      await this.userService.logout(payload.sub);
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    await this.sessionService.findOneForJwt(payload.sub, payload.sessionId);

    return payload;
  }
}
