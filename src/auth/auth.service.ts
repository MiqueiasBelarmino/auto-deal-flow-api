import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private whatsappService: WhatsappService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const { password, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async requestOtp(dto: OtpRequestDto) {
    const user = await this.prisma.user.findFirst({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('Telefone não encontrado');

    // Rate limit: block if valid OTP exists with < 60s
    const existingOtp = await this.prisma.otpCode.findFirst({
      where: { phone: dto.phone, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (existingOtp) {
      const elapsed = Date.now() - existingOtp.createdAt.getTime();
      if (elapsed < 60_000) {
        throw new BadRequestException('Aguarde 60 segundos para solicitar novo código');
      }
    }

    // Invalidate previous OTPs
    await this.prisma.otpCode.updateMany({
      where: { phone: dto.phone, used: false },
      data: { used: true },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresMinutes = 5;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60_000);

    await this.prisma.otpCode.create({
      data: { phone: dto.phone, code, expiresAt },
    });

    await this.whatsappService.sendOtp(dto.phone, code);

    return { message: 'Código enviado' };
  }

  async verifyOtp(dto: OtpVerifyDto) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone: dto.phone,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || otpRecord.code !== dto.code) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const user = await this.prisma.user.findFirst({ where: { phone: dto.phone } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const { password, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }
}
