import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Fuel, Transmission, VehicleType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  brand!: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(2000)
  @Max(2030)
  @Type(() => Number)
  year!: number;

  @ApiProperty({ example: 15000 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  km!: number;

  @ApiProperty({ enum: Fuel })
  @IsEnum(Fuel)
  fuel!: Fuel;

  @ApiProperty({ enum: Transmission })
  @IsEnum(Transmission)
  transmission!: Transmission;

  @ApiPropertyOptional({ enum: VehicleType, default: VehicleType.CAR })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @ApiPropertyOptional({ example: 'Prata' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 120000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  publicPrice!: number;

  @ApiProperty({ example: 115000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice!: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDiscount?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionals?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issues?: string;
}
