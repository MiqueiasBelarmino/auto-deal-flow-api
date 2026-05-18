-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'SELLER';

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "type" "VehicleType" NOT NULL DEFAULT 'CAR';
