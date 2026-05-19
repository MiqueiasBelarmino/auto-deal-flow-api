-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "auctionHistory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ipvaPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preparationCost" DECIMAL(12,2),
ADD COLUMN     "purchasePrice" DECIMAL(12,2),
ADD COLUMN     "spareKey" BOOLEAN NOT NULL DEFAULT false;
