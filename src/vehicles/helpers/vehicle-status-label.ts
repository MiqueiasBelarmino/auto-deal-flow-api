import { VehicleStatus } from '@prisma/client';

export const VehicleStatusLabel: Record<VehicleStatus, string> = {
  DISPONIVEL: 'Disponível',
  RESERVADO: 'Reservado',
  VENDIDO: 'Vendido',
};
