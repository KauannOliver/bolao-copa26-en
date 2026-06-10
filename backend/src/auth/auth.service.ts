import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(data: any) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const password_hash = await bcrypt.hash(data.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash,
        role: 'PENDING',
        status: 'PENDING'
      }
    });

    return { message: 'User registered successfully. Waiting for admin approval.', user: { id: user.id, email: user.email, status: user.status } };
  }

  async login(data: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'REJECTED') {
      throw new UnauthorizedException('Your account has been rejected');
    }

    const payload = { email: user.email, sub: user.id, role: user.role, status: user.status };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    };
  }
}
