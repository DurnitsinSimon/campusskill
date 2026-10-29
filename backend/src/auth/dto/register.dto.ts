import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../generated/prisma/enums';

export class RegisterDto {
  @ApiProperty({ example: 'anna.petrova@urfu.me' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Str0ngPass!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @ApiProperty({ example: 'Анна' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Петрова' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @ApiPropertyOptional({
    enum: [Role.PARTICIPANT, Role.MENTOR],
    default: Role.PARTICIPANT,
  })
  @IsOptional()
  @IsIn([Role.PARTICIPANT, Role.MENTOR])
  role?: Role;
}