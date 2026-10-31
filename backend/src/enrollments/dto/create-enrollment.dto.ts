import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  workshopId!: number;

  @ApiPropertyOptional({ example: 'Возьму свой ноутбук, нужен ли доступ к GitHub?', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}