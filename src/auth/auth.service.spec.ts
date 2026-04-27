import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

import { JwtPayload } from '@/common';
import { UsersService } from '@/users/users.service';

import { AuthService } from './auth.service';

type Mocked<T> = { [K in keyof T]: jest.Mock };

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Mocked<
    Pick<
      UsersService,
      | 'findOneByParams'
      | 'saveUser'
      | 'createSession'
      | 'findOneForRefreshToken'
      | 'findOpenedSessionAndDelete'
      | 'logout'
    >
  >;
  let jwtService: Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync'>>;
  let configService: Mocked<Pick<ConfigService, 'get'>>;
  let queryRunner: any;

  beforeEach(() => {
    usersService = {
      findOneByParams: jest.fn(),
      saveUser: jest.fn(),
      createSession: jest.fn(),
      findOneForRefreshToken: jest.fn(),
      findOpenedSessionAndDelete: jest.fn(),
      logout: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('refresh-secret'),
    };

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      isTransactionActive: true,
      manager: {},
    };

    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      dataSource,
    );
  });

  it('logs in and issues both tokens', async () => {
    usersService.saveUser.mockResolvedValue(12);
    usersService.createSession.mockResolvedValue({ id: 73 });
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({
      id: 12,
      email: 'runner.user@example.com',
      isLoggedIn: false,
      updatedAt: null,
    } as any);

    expect(usersService.saveUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 12,
        isLoggedIn: true,
      }),
      queryRunner.manager,
    );
    expect(usersService.createSession).toHaveBeenCalledWith(12, queryRunner.manager);
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('refreshes tokens when refresh token is valid and user matches access token', async () => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const refreshPayload: JwtPayload = {
      email: 'runner.user@example.com',
      sub: 12,
      sessionId: 73,
      iat: nowInSeconds - 10,
      exp: nowInSeconds + 60,
    };

    jwtService.verifyAsync.mockResolvedValue(refreshPayload);
    usersService.findOpenedSessionAndDelete.mockResolvedValue({ id: 74 });
    jwtService.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const result = await service.refreshToken(
      { ...refreshPayload, sessionId: 999 } as JwtPayload,
      'refresh-token',
    );

    expect(usersService.findOneForRefreshToken).toHaveBeenCalledWith(refreshPayload.email);
    expect(usersService.findOpenedSessionAndDelete).toHaveBeenCalledWith(73, 12);
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('throws unauthorized when refresh token belongs to another user', async () => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const refreshPayload: JwtPayload = {
      email: 'runner.user@example.com',
      sub: 55,
      sessionId: 10,
      iat: nowInSeconds - 10,
      exp: nowInSeconds + 60,
    };

    jwtService.verifyAsync.mockResolvedValue(refreshPayload);

    await expect(
      service.refreshToken({ ...refreshPayload, sub: 12 }, 'refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs out and rejects when refresh token is expired', async () => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const refreshPayload: JwtPayload = {
      email: 'runner.user@example.com',
      sub: 12,
      sessionId: 73,
      iat: nowInSeconds - 120,
      exp: nowInSeconds - 60,
    };

    jwtService.verifyAsync.mockResolvedValue(refreshPayload);

    await expect(service.refreshToken(refreshPayload, 'refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersService.logout).toHaveBeenCalledWith(12);
  });
});
