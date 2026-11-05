import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { UpdateMentorProfileDto } from './dto/update-mentor-profile.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch()
  @ApiOperation({ summary: 'Обновить профиль и настройки уведомлений' })
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.sub, dto);
  }

  @Patch('mentor-profile')
  @UseGuards(RolesGuard)
  @Roles(Role.MENTOR)
  @ApiOperation({ summary: 'Обновить профиль ментора' })
  updateMentorProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMentorProfileDto,
  ) {
    return this.users.updateMentorProfile(user.sub, dto);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Прогресс по навыкам и общая статистика обучения' })
  progress(@CurrentUser() user: JwtPayload) {
    return this.users.getProgress(user.sub);
  }
}
