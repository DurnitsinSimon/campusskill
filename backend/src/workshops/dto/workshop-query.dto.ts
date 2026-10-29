import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SkillLevel, WorkshopFormat } from '../../generated/prisma/enums';

export enum PriceFilter {
  FREE = 'free',
  PAID = 'paid',
}

export enum WorkshopSort {
  DATE = 'date',
  RATING = 'rating',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  POPULAR = 'popular',
}

const toArray = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : value;

const toBoolean = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === '1';

export class WorkshopQueryDto {
  @ApiPropertyOptional({ description: 'Поиск по названию, описанию, тегам и имени ментора', example: 'figma' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Слаги навыков через запятую', example: 'react,typescript' })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Слаг категории', example: 'programming' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: WorkshopFormat })
  @IsOptional()
  @IsEnum(WorkshopFormat)
  format?: WorkshopFormat;

  @ApiPropertyOptional({ enum: SkillLevel })
  @IsOptional()
  @IsEnum(SkillLevel)
  level?: SkillLevel;

  @ApiPropertyOptional({ enum: PriceFilter, description: 'Бесплатные или платные' })
  @IsOptional()
  @IsEnum(PriceFilter)
  price?: PriceFilter;

  @ApiPropertyOptional({ description: 'Начало периода', example: '2026-11-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Конец периода (включительно)', example: '2026-11-30' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: 'Минимальный рейтинг воркшопа' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Только со свободными местами' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  hasSeats?: boolean;

  @ApiPropertyOptional({ enum: WorkshopSort, default: WorkshopSort.DATE })
  @IsOptional()
  @IsEnum(WorkshopSort)
  sort: WorkshopSort = WorkshopSort.DATE;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 12;
}