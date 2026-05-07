import { PrismaClient, Role, VehicleStatus, Fuel, Transmission } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const passwordHash = await bcrypt.hash('Admin@2024', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Administrador',
      username: 'admin',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log('Admin user created:', admin.username);

  // Criar veículos de exemplo se não existirem
  const count = await prisma.vehicle.count();
  
  if (count === 0) {
    const vehicle1 = await prisma.vehicle.create({
      data: {
        brand: 'Toyota',
        model: 'Corolla',
        color: 'Prata',
        year: 2022,
        km: 15000,
        fuel: Fuel.FLEX,
        transmission: Transmission.AUTOMATICO,
        publicPrice: 120000.0,
        minPrice: 115000.0,
        status: VehicleStatus.DISPONIVEL,
        photos: [],
        optionals: ['Ar condicionado', 'Direção elétrica'],
        history: {
          create: {
            action: 'Cadastrado no sistema (Seed)',
            userId: admin.id,
          }
        }
      }
    });

    const vehicle2 = await prisma.vehicle.create({
      data: {
        brand: 'Honda',
        model: 'Civic',
        color: 'Preto',
        year: 2021,
        km: 30000,
        fuel: Fuel.GASOLINA,
        transmission: Transmission.CVT,
        publicPrice: 140000.0,
        minPrice: 135000.0,
        status: VehicleStatus.RESERVADO,
        photos: [],
        optionals: ['Teto solar', 'Banco de couro'],
        history: {
          create: [
            {
              action: 'Cadastrado no sistema (Seed)',
              userId: admin.id,
            },
            {
              action: 'Status alterado para Reservado',
              userId: admin.id,
            }
          ]
        }
      }
    });

    console.log('Vehicles created:', vehicle1.model, vehicle2.model);
  } else {
    console.log('Vehicles already exist, skipping vehicle seed.');
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
