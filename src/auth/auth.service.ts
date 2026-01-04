import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        position: dto.position,
        department: dto.department,
        role: 'TEACHER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        position: user.position,
        department: user.department,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Невірний refresh token');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token не знайдено');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      }).catch(() => {});
      
      throw new UnauthorizedException('Refresh token прострочений');
    }

    await this.prisma.refreshToken.deleteMany({
      where: { 
        id: storedToken.id 
      },
    });

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
    );

    return {
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
        position: storedToken.user.position,
        department: storedToken.user.department,
        role: storedToken.user.role,
      },
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        department: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Користувач не знайдений');
    }

    return user;
  }

  async validateRefreshToken(userId: string) {
    return this.validateUser(userId);
  }

  async getProfile(userId: string) {
    return this.validateUser(userId);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);

    const jti = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const refreshToken = this.jwtService.sign(
      { ...payload, jti },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}