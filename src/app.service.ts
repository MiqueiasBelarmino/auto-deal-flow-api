import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureRootAndAdminUsers();
  }

  private async ensureRootAndAdminUsers() {
    try {
      // 1. Verificar e criar conta Root Invisível
      const rootExists = await this.prisma.user.findUnique({
        where: { username: 'root' },
      });
      if (!rootExists) {
        const rootPasswordHash = await bcrypt.hash('root123', 10);
        await this.prisma.user.create({
          data: {
            name: 'Sistema',
            username: 'root',
            password: rootPasswordHash,
            role: Role.ADMIN,
            phone: '5511999999990',
          },
        });
        console.log('Conta root de manutenção criada automaticamente no banco.');
      }

      // 2. Verificar e criar conta Admin padrão
      const adminExists = await this.prisma.user.findUnique({
        where: { username: 'admin' },
      });
      if (!adminExists) {
        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        await this.prisma.user.create({
          data: {
            name: 'Diretoria Auto Prime',
            username: 'admin',
            password: adminPasswordHash,
            role: Role.ADMIN,
            phone: '5511999999999',
          },
        });
        console.log('Conta admin padrão criada automaticamente no banco.');
      }
    } catch (error) {
      console.error('Erro na verificação de inicialização de usuários:', error);
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
