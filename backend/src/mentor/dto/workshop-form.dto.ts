import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SkillLevel, WorkshopFormat } from '../../generated/prisma/enums';

export class ProgramItemDto {
  @ApiProperty({ example: 'Образы, контейнеры и слои' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ example: 'Чем контейнер отличается от виртуальной машины' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;
}

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Docker для студентов: упаковываем свой проект' })
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'Пишем Dockerfile и docker-compose для учебного проекта.' })
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  shortDescription!: string;

  @ApiProperty({ example: 'Разберём, чем контейнер отличается от виртуальной машины…' })
  @IsString()
  @MinLength(30)
  @MaxLength(3000)
  description!: string;

  @ApiPropertyOptional({ example: 'Установленный Docker Desktop' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  requirements?: string;

  @ApiProperty({ enum: WorkshopFormat })
  @IsEnum(WorkshopFormat)
  format!: WorkshopFormat;

  @ApiPropertyOptional({ example: 'Главный учебный корпус, ауд. 412' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 'https://telemost.yandex.ru/j/12345678901234' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  meetingUrl?: string;

  @ApiProperty({ enum: SkillLevel })
  @IsEnum(SkillLevel)
  level!: SkillLevel;

  @ApiProperty({ example: '2026-11-20T14:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(30)
  @Max(480)
  durationMinutes!: number;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  @Max(200)
  capacity!: number;

  @ApiProperty({ example: 0, description: 'В рублях, 0 — бесплатно' })
  @IsInt()
  @Min(0)
  @Max(100000)
  price!: number;

  @ApiProperty({ example: ['docker', 'git'], description: 'Слаги навыков, первый — основной' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  skills!: string[];

  @ApiProperty({ type: [ProgramItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => ProgramItemDto)
  program!: ProgramItemDto[];
}

export class UpdateWorkshopDto extends PartialType(CreateWorkshopDto) {}