import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { VehicleStatusLabel } from './helpers/vehicle-status-label';
import { Prisma } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ListVehiclesDto) {
    const { search, status, limit = 20, offset = 0, sort } = query;

    const where: Prisma.VehicleWhereInput = {};
    if (search) {
      where.OR = [
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    let orderBy: Prisma.VehicleOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort) {
      const [field, dir] = sort.split(':');
      orderBy = { [field]: dir } as Prisma.VehicleOrderByWithRelationInput;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({ where, orderBy, take: limit, skip: offset }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { data, total, limit, offset };
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');

    const margin = Number(vehicle.publicPrice) - Number(vehicle.minPrice);
    return { ...vehicle, margin };
  }

  async create(dto: CreateVehicleDto, userId: string) {
    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...dto,
        color: dto.color ?? '',
        optionals: dto.optionals ?? [],
        photos: [],
        history: {
          create: { action: 'Cadastrado', userId },
        },
      },
    });
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto, userId: string) {
    await this.findOne(id);
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        ...dto,
        history: {
          create: { action: 'Dados atualizados', userId },
        },
      },
    });
    return vehicle;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, userId: string) {
    await this.findOne(id);
    const label = VehicleStatusLabel[dto.status];
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        status: dto.status,
        history: {
          create: {
            action: `Status alterado para ${label}`,
            userId,
          },
        },
      },
    });
    return vehicle;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.vehicle.delete({ where: { id } });
    return { message: 'Veículo removido com sucesso' };
  }

  async getStats() {
    const groups = await this.prisma.vehicle.groupBy({
      by: ['status'],
      _count: true,
    });

    const counts: Record<string, number> = {};
    for (const g of groups) {
      counts[g.status] = g._count;
    }

    const total = groups.reduce((sum, g) => sum + g._count, 0);
    return {
      total,
      disponiveis: counts['DISPONIVEL'] ?? 0,
      reservados: counts['RESERVADO'] ?? 0,
      vendidos: counts['VENDIDO'] ?? 0,
    };
  }

  async getHistory(id: string) {
    await this.findOne(id);
    const history = await this.prisma.vehicleHistory.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
    return history.map((h) => ({
      action: h.action,
      user: h.user?.name ?? 'Sistema',
      createdAt: h.createdAt,
    }));
  }
}
