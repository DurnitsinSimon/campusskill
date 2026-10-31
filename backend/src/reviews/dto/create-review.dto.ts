import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @Min(1)
  enrollmentId!: number;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5, description: 'Оценка воркшопа' })
  @IsInt()
  @Min(1)
  @Max(5)
  workshopRating!: number;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5, description: 'Оценка ментора' })
  @IsInt()
  @Min(1)
  @Max(5)
  mentorRating!: number;

  @ApiPropertyOptional({ example: 'Всё понятно объяснили, особенно про группировки.', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}