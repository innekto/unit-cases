import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { EntityNotFoundError } from 'typeorm';

import { UserEntity } from '@/users/entities/user.entity';

import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<UserEntity> {
    try {
      const user = await this.authService.validateUser(email.toLowerCase(), password);
      if (!user) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new UnauthorizedException('User not found');
      }
      throw error;
    }
  }
}
