import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminUsersQueryDto, AdminWorkshopsQueryDto, BlockUserDto, ChangeRoleDto, ReasonDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../generated/prisma/enums';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Сводка по платформе: пользователи, воркшопы, записи, отзывы' })
  stats() {
    return this.admin.stats();
  }

  @Get('workshops')
  @ApiOperation({ summary: 'Воркшопы по статусу (по умолчанию — очередь модерации)' })
  findWorkshops(@Query() query: AdminWorkshopsQueryDto) {
    return this.admin.findWorkshops(query.status);
  }

  @Get('workshops/:id')
  @ApiOperation({ summary: 'Воркшоп целиком для проверки, в любом статусе' })
  findWorkshop(@Param('id', ParseIntPipe) id: number) {
    return this.admin.findWorkshop(id);
  }

  @Post('workshops/:id/approve')
  @ApiOperation({ summary: 'Опубликовать воркшоп' })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.admin.approve(id);
  }

  @Post('workshops/:id/reject')
  @ApiOperation({ summary: 'Отклонить воркшоп с причиной' })
  reject(@Param('id', ParseIntPipe) id: number, @Body() dto: ReasonDto) {
    return this.admin.reject(id, dto.reason);
  }

  @Post('workshops/:id/cancel')
  @ApiOperation({ summary: 'Снять опубликованный воркшоп с причиной' })
  cancel(@Param('id', ParseIntPipe) id: number, @Body() dto: ReasonDto) {
    return this.admin.cancelWorkshop(id, dto.reason);
  }

  @Get('users')
  @ApiOperation({ summary: 'Пользователи с поиском и фильтром по роли' })
  findUsers(@Query() query: AdminUsersQueryDto) {
    return this.admin.findUsers(query);
  }

  @Patch('users/:id/block')
  @ApiOperation({ summary: 'Заблокировать или разблокировать пользователя' })
  setBlocked(@CurrentUser() admin: JwtPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: BlockUserDto) {
    return this.admin.setBlocked(admin.sub, id, dto);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Сменить роль: участник ↔ ментор' })
  changeRole(@CurrentUser() admin: JwtPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: ChangeRoleDto) {
    return this.admin.changeRole(admin.sub, id, dto);
  }
}