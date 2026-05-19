import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getFinancialStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Todos os veículos vendidos no mês atual (lucro realizado)
    const soldVehicles = await this.prisma.vehicle.findMany({
      where: { 
        status: 'VENDIDO',
        updatedAt: { gte: startOfMonth } // Assuming updatedAt is when it was sold
      }
    });

    const realizedProfit = soldVehicles.reduce((acc, v) => {
      // Lucro líquido = Preço de Venda Final - Preço de Compra - Custo de Preparação
      // Mas se não tivermos price history, usamos o publicPrice como fallback ou o salePrice do history?
      // O Vehicle model deve ter salePrice ou usamos publicPrice se for um MVP.
      // Wait, we don't have salePrice in the Vehicle model directly, we probably save it in history or not?
      // Let's check schema. If no salePrice, use publicPrice - purchasePrice - preparationCost
      const revenue = Number(v.publicPrice || 0);
      const cost = Number(v.purchasePrice || 0) + Number(v.preparationCost || 0);
      return acc + (revenue > cost ? revenue - cost : 0);
    }, 0);

    // Veículos em estoque (lucro previsto e capital investido)
    const activeVehicles = await this.prisma.vehicle.findMany({
      where: { 
        status: { in: ['DISPONIVEL', 'RESERVADO'] }
      }
    });

    let expectedProfit = 0;
    let allocatedCapital = 0;

    activeVehicles.forEach(v => {
      const pubPrice = Number(v.publicPrice || 0);
      const buyPrice = Number(v.purchasePrice || 0);
      const prepCost = Number(v.preparationCost || 0);
      const totalCost = buyPrice + prepCost;
      
      allocatedCapital += totalCost;
      
      if (pubPrice > totalCost) {
        expectedProfit += (pubPrice - totalCost);
      }
    });

    return {
      realizedProfit,
      expectedProfit,
      allocatedCapital,
      soldCount: soldVehicles.length,
      activeCount: activeVehicles.length,
    };
  }
}
