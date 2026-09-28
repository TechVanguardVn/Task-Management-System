import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: jwtMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      prismaMock.user.create.mockResolvedValue({
        id: 1,
        name: 'Huy',
        email: 'huy@test.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register({
        name: 'Huy',
        email: 'huy@test.com',
        password: '12345678',
      });

      expect(result).toEqual({
        message: 'Registration successful',
        user: {
          id: 1,
          name: 'Huy',
          email: 'huy@test.com',
        },
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'huy@test.com',
        },
      });

      expect(prismaMock.user.create).toHaveBeenCalled();

      const createCall = prismaMock.user.create.mock.calls[0][0];

      expect(createCall.data.name).toBe('Huy');
      expect(createCall.data.email).toBe('huy@test.com');
      expect(createCall.data.password).not.toBe('12345678');

      expect(await bcrypt.compare('12345678', createCall.data.password)).toBe(
        true,
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'Existing User',
        email: 'huy@test.com',
        password: 'hashed-password',
      });

      await expect(
        service.register({
          name: 'Huy',
          email: 'huy@test.com',
          password: '12345678',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('12345678', 12);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'Huy',
        email: 'huy@test.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jwtMock.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.login({
        email: 'huy@test.com',
        password: '12345678',
      });

      expect(result).toEqual({
        message: 'Login successful',
        accessToken: 'mock-jwt-token',
        user: {
          id: 1,
          name: 'Huy',
          email: 'huy@test.com',
        },
      });

      expect(jwtMock.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'huy@test.com',
      });
    });

    it('should throw UnauthorizedException when email does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@test.com',
          password: '12345678',
        }),
      ).rejects.toThrow('Invalid email or password');

      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 12);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'Huy',
        email: 'huy@test.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.login({
          email: 'huy@test.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow('Invalid email or password');

      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });
  });
});