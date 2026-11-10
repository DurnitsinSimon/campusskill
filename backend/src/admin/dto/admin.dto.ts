import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Role, WorkshopStatus } from '../../generated/prisma/enums';

export class AdminWorkshopsQueryDto {
  @ApiPropertyOptional({ enum: WorkshopStatus, default: WorkshopStatus.PENDING_REVIEW })
  @IsOptional()
  @IsEnum(WorkshopStatus)
  status: WorkshopStatus = WorkshopStatus.PENDING_REVIEW;
}

export class ReasonDto {
  @ApiProperty({ example: 'Добавьте в программу практическую часть и уточните требования к ноутбуку.' })
  @IsString()
  @MinLength(10, { message: 'Причина должна быть не короче 10 символов' })
  @MaxLength(500)
  reason!: string;
}

export class AdminUsersQueryDto {
  @ApiPropertyOptional({ description: 'Имя, фамилия или email', example: 'смирнов' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}

export class BlockUserDto {
  @ApiProperty()
  @IsBoolean()
  isBlocked!: boolean;
}

export class ChangeRoleDto {
  @ApiProperty({ enum: [Role.PARTICIPANT, Role.MENTOR] })
  @IsIn([Role.PARTICIPANT, Role.MENTOR], { message: 'Можно назначить только участника или ментора' })
  role!: Role;
}