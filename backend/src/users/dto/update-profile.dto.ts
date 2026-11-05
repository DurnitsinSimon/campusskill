import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export const REMINDER_OPTIONS = [1, 3, 12, 24, 48];

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Иван' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Смирнов' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Учусь на прикладной информатике, хочу во фронтенд.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'ИРИТ-РТФ, Прикладная информатика' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  university?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 6, example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  course?: number;

  @ApiPropertyOptional({ description: 'Присылать уведомления на почту' })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ enum: REMINDER_OPTIONS, description: 'За сколько часов напоминать о воркшопе' })
  @IsOptional()
  @IsIn(REMINDER_OPTIONS)
  reminderHoursBefore?: number;
}