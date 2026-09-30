import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    strategy = new JwtStrategy(prismaMock as PrismaService);
  });

  describe('validate', () => {
    it('should validate a token when tokenVersion matches', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'Huy',
        email: 'huy@test.com',
        password: 'hashed-password',
        tokenVersion: 0,
      });

      const result = await strategy.validate({
        sub: 1,
        email: 'huy@test.com',
        tokenVersion: 0,
      });

      expect(result).toEqual({
        id: 1,
        email: 'huy@test.com',
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it('should reject the token when tokenVersion does not match', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'Huy',
        email: 'huy@test.com',
        password: 'hashed-password',
        tokenVersion: 1,
      });

      await expect(
        strategy.validate({
          sub: 1,
          email: 'huy@test.com',
          tokenVersion: 0,
        }),
      ).rejects.toThrow(
        new UnauthorizedException('Token is no longer valid'),
      );
    });

    it('should reject the token when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        strategy.validate({
          sub: 999,
          email: 'notfound@test.com',
          tokenVersion: 0,
        }),
      ).rejects.toThrow(
        new UnauthorizedException('Token is no longer valid'),
      );
    });
  });
});