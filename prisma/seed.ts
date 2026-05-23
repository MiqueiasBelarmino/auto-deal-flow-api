import { PrismaClient, Role, VehicleStatus, Fuel, Transmission, VehicleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed and database cleanup...');

  // Limpar tabelas mantendo integridade
  await prisma.vehicleHistory.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('admin123', 10);

  // Criar Usuário Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Diretoria Auto Prime',
      username: 'admin',
      password: passwordHash,
      role: Role.ADMIN,
      phone: '5511999999999', // telefone fictício com DDI/DDD
    },
  });

  // Criar Usuário Vendedor
  const seller = await prisma.user.create({
    data: {
      name: 'João Vendedor',
      username: 'joao',
      password: passwordHash,
      role: Role.SELLER,
      phone: '5511988888888',
    },
  });

  console.log('Users created: admin (admin123), joao (admin123)');

  // 1. Toyota Corolla XEi 2020 (DISPONIVEL)
  const v1 = await prisma.vehicle.create({
    data: {
      brand: 'Toyota',
      model: 'Corolla XEi',
      color: 'Prata',
      year: 2020,
      km: 45000,
      fuel: Fuel.FLEX,
      transmission: Transmission.AUTOMATICO,
      type: VehicleType.CAR,
      publicPrice: 102000.0,
      minPrice: 98000.0,
      purchasePrice: 85000.0,
      preparationCost: 2500.0, // R$ 2.500,00
      status: VehicleStatus.DISPONIVEL,
      photos: [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=600&q=80'
      ],
      optionals: ['Ar Condicionado Digital', 'Direção Elétrica', 'Piloto Automático', 'Central Multimídia'],
      ipvaPaid: true,
      auctionHistory: false,
      spareKey: true,
      manual: true,
      history: {
        create: {
          action: 'Cadastrado no estoque por seed',
          userId: admin.id,
        }
      }
    }
  });

  // 2. Honda Civic EXL 2021 (RESERVADO)
  const v2 = await prisma.vehicle.create({
    data: {
      brand: 'Honda',
      model: 'Civic EXL',
      color: 'Preto',
      year: 2021,
      km: 30000,
      fuel: Fuel.FLEX,
      transmission: Transmission.CVT,
      type: VehicleType.CAR,
      publicPrice: 116000.0,
      minPrice: 112000.0,
      purchasePrice: 95000.0,
      preparationCost: 1500.0, // R$ 1.500,00
      status: VehicleStatus.RESERVADO,
      photos: [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'
      ],
      optionals: ['Teto Solar', 'Bancos em Couro', 'Faróis de LED', 'Painel Digital'],
      ipvaPaid: true,
      auctionHistory: false,
      spareKey: true,
      manual: true,
      history: {
        create: [
          {
            action: 'Cadastrado no estoque por seed',
            userId: admin.id,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            action: 'Status alterado para RESERVADO (Cliente: Maria Silva - 11 98765-4321)',
            userId: seller.id,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    }
  });

  // 3. Jeep Compass Longitude 2019 (VENDIDO)
  const v3 = await prisma.vehicle.create({
    data: {
      brand: 'Jeep',
      model: 'Compass Longitude',
      color: 'Branco',
      year: 2019,
      km: 60000,
      fuel: Fuel.DIESEL,
      transmission: Transmission.AUTOMATICO,
      type: VehicleType.CAR,
      publicPrice: 94500.0, // Preço de venda fechado
      minPrice: 92000.0,
      purchasePrice: 80000.0,
      preparationCost: 4000.0, // R$ 4.000,00
      status: VehicleStatus.VENDIDO,
      photos: [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'
      ],
      optionals: ['Tração 4x4', 'Bancos em Couro', 'Ar Condicionado Dual Zone'],
      ipvaPaid: true,
      auctionHistory: false,
      spareKey: false,
      manual: true,
      history: {
        create: [
          {
            action: 'Cadastrado no estoque por seed',
            userId: admin.id,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
          },
          {
            action: 'Status alterado para VENDIDO (Valor: R$ 94.500 | Obs: À vista pix)',
            userId: seller.id,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    }
  });

  // 4. Chevrolet Onix LTZ 2018 (DISPONIVEL com Leilão)
  const v4 = await prisma.vehicle.create({
    data: {
      brand: 'Chevrolet',
      model: 'Onix LTZ',
      color: 'Vermelho',
      year: 2018,
      km: 85000,
      fuel: Fuel.FLEX,
      transmission: Transmission.MANUAL,
      type: VehicleType.CAR,
      publicPrice: 58000.0,
      minPrice: 54000.0,
      purchasePrice: 45000.0,
      preparationCost: 1000.0, // R$ 1.000,00
      status: VehicleStatus.DISPONIVEL,
      photos: [
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
      ],
      optionals: ['MyLink', 'Rodas de Liga Leve', 'Sensor de Ré'],
      ipvaPaid: false,
      auctionHistory: true, // Passagem por leilão para testar UX alerta
      spareKey: false,
      manual: false,
      history: {
        create: {
          action: 'Cadastrado no estoque por seed',
          userId: admin.id,
        }
      }
    }
  });

  // 5. Yamaha MT-03 2022 (DISPONIVEL - MOTO)
  const v5 = await prisma.vehicle.create({
    data: {
      brand: 'Yamaha',
      model: 'MT-03',
      color: 'Azul',
      year: 2022,
      km: 12000,
      fuel: Fuel.GASOLINA,
      transmission: Transmission.MANUAL,
      type: VehicleType.MOTORCYCLE,
      publicPrice: 28500.0,
      minPrice: 27000.0,
      purchasePrice: 22000.0,
      preparationCost: 500.0, // R$ 500,00
      status: VehicleStatus.DISPONIVEL,
      photos: [
        'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80'
      ],
      optionals: ['Freio ABS', 'Painel 100% Digital', 'Sliders Laterais'],
      ipvaPaid: true,
      auctionHistory: false,
      spareKey: true,
      manual: false,
      history: {
        create: {
          action: 'Cadastrado no estoque por seed',
          userId: admin.id,
        }
      }
    }
  });

  // 6. Sea-Doo RXT-X 300 RS 2021 (DISPONIVEL - JETS KI / WATERCRAFT)
  const v6 = await prisma.vehicle.create({
    data: {
      brand: 'Sea-Doo',
      model: 'RXT-X 300 RS',
      color: 'Amarelo/Preto',
      year: 2021,
      km: 45, // 45 horas de uso
      fuel: Fuel.GASOLINA,
      transmission: Transmission.AUTOMATICO,
      type: VehicleType.WATERCRAFT,
      publicPrice: 135000.0,
      minPrice: 128000.0,
      purchasePrice: 110000.0,
      preparationCost: 1500.0,
      status: VehicleStatus.DISPONIVEL,
      photos: [
        'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=600&q=80'
      ],
      optionals: ['Sistema iBR (Freio e Ré)', 'Som Premium Bluetooth', 'Modo Eco/Sport', 'Escada de Embarque', 'Carreta Rodoviária de Alumínio'],
      ipvaPaid: true,
      auctionHistory: false,
      spareKey: true,
      manual: true,
      history: {
        create: {
          action: 'Cadastrado no estoque por seed',
          userId: admin.id,
        }
      }
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
