import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private exclude<T extends object>(obj: T, keys: (keyof T)[]): Omit<T, (typeof keys)[number]> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: { username: { not: 'root' } },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.exclude(u, ['password']));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.exclude(user, ['password']);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('Username já está em uso');

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { ...dto, password },
    });
    return this.exclude(user, ['password']);
  }

  async update(id: string, dto: UpdateUserDto) {
    const targetUser = await this.prisma.user.findUnique({ where: { id } });
    if (!targetUser) throw new NotFoundException('Usuário não encontrado');
    if (targetUser.username === 'root') {
      throw new UnauthorizedException('Ação não permitida para o usuário root');
    }

    if (dto.username) {
      const conflict = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id } },
      });
      if (conflict) throw new ConflictException('Username já está em uso');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });
    return this.exclude(user, ['password']);
  }

  async changePassword(id: string, dto: ChangePasswordDto, requesterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.username === 'root' && requesterId !== id) {
      throw new UnauthorizedException('Ação não permitida para o usuário root');
    }

    // Requester must verify their own current password only if changing own account
    if (requesterId === id) {
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) throw new UnauthorizedException('Senha atual incorreta');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: newHash },
    });
    return this.exclude(updated, ['password']);
  }

  async remove(id: string) {
    const targetUser = await this.prisma.user.findUnique({ where: { id } });
    if (!targetUser) throw new NotFoundException('Usuário não encontrado');
    if (targetUser.username === 'root') {
      throw new UnauthorizedException('Ação não permitida para o usuário root');
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return this.exclude(user, ['password']);
  }
}
