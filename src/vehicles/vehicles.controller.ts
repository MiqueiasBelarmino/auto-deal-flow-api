import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Resumo de contagens por status' })
  getStats() {
    return this.vehiclesService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'Listar veículos com filtros e paginação' })
  findAll(@Query() query: ListVehiclesDto) {
    return this.vehiclesService.findAll(query);
  }

  @Public()
  @Get('catalog')
  @ApiOperation({ summary: 'Listar catálogo público de veículos (apenas disponíveis)' })
  findPublicCatalog(@Query() query: ListVehiclesDto) {
    return this.vehiclesService.findPublicCatalog(query);
  }

  @Public()
  @Get('catalog/:id')
  @ApiOperation({ summary: 'Detalhe público de um veículo para o catálogo' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  getCatalog(@Param('id') id: string) {
    return this.vehiclesService.findPublicOne(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um veículo' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Histórico de ações do veículo' })
  getHistory(@Param('id') id: string) {
    return this.vehiclesService.getHistory(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo veículo' })
  create(@Body() dto: CreateVehicleDto, @CurrentUser() user: any) {
    return this.vehiclesService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do veículo' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: any,
  ) {
    return this.vehiclesService.update(id, dto, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Alterar status do veículo' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.vehiclesService.updateStatus(id, dto, user.id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Remover veículo (apenas ADMIN)' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}

