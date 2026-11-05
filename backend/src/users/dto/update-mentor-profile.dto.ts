import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { WorkshopFormat } from '../../generated/prisma/enums';

export class UpdateMentorProfileDto {
  @ApiPropertyOptional({ example: 'Backend-разработчик, Node.js и DevOps' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  headline?: string;

  @ApiPropertyOptional({ example: 'Разрабатываю микросервисы на NestJS…' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  experience?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ enum: WorkshopFormat, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(WorkshopFormat, { each: true })
  formats?: WorkshopFormat[];

  @ApiPropertyOptional({ example: '@timur_backend' })
  @IsOptional()
  @Matches(/^@[a-zA-Z0-9_]{5,32}$/, { message: 'Telegram в формате @username' })
  telegram?: string;
}