import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReplyReviewDto {
  @ApiProperty({ example: 'Спасибо! Учту на следующем воркшопе.' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  reply!: string;
}