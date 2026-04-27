import { BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';

import { UsersService } from '@/users/users.service';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

type Mocked<T> = { [K in keyof T]: jest.Mock };

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Mocked<Pick<AuthService, 'login' | 'refreshToken'>>;
  let usersService: Mocked<Pick<UsersService, 'create' | 'resetPassword'>>;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      refreshToken: jest.fn(),
    };

    usersService = {
      create: jest.fn(),
      resetPassword: jest.fn(),
    };

    controller = new AuthController(authService as unknown as AuthService, usersService as any);
  });

  it('returns access token on login and sets refresh cookie', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const response = {
      cookie: jest.fn(),
    } as unknown as Response;

    const result = await controller.login({ id: 1 } as any, response);

    expect(authService.login).toHaveBeenCalled();
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(result).toEqual({ accessToken: 'access-token' });
  });

  it('throws bad request if refresh cookie is not provided', async () => {
    const request = {
      cookies: {},
      user: { sub: 1 },
    } as unknown as Request;

    await expect(
      controller.refreshToken(request, {
        cookie: jest.fn(),
      } as unknown as Response),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refreshes tokens using cookie-parser value', async () => {
    authService.refreshToken.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const request = {
      cookies: { refresh_token: 'old-refresh-token' },
      user: { sub: 1 },
    } as unknown as Request;
    const response = {
      cookie: jest.fn(),
    } as unknown as Response;

    const result = await controller.refreshToken(request, response);

    expect(authService.refreshToken).toHaveBeenCalledWith({ sub: 1 }, 'old-refresh-token');
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new-refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(result).toEqual({ accessToken: 'new-access-token' });
  });

  it('passes normalized request metadata to register flow', async () => {
    const sessionId = '11111111-1111-1111-1111-111111111111';
    const randomUUIDSpy = jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(sessionId);
    usersService.create.mockResolvedValue({ id: 120 });

    const request = {
      headers: {
        'x-forwarded-for': '203.0.113.2, 203.0.113.3',
        'user-agent': 'Jest Agent',
      },
      socket: {
        remoteAddress: '127.0.0.1',
      },
    } as unknown as Request;

    await controller.register({ email: 'runner.user@example.com' } as any, request);

    expect(usersService.create).toHaveBeenCalledWith(
      { email: 'runner.user@example.com' },
      {
        ip: '203.0.113.2',
        userAgent: 'Jest Agent',
        sessionId,
      },
    );

    randomUUIDSpy.mockRestore();
  });
});
