import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('financial')
  @ApiOperation({ summary: 'Estatísticas financeiras para o dashboard' })
  getFinancialStats() {
    return this.dashboardService.getFinancialStats();
  }
}
