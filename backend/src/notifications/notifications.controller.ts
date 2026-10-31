import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Мои уведомления (последние 50) и счётчик непрочитанных' })
  @ApiQuery({ name: 'unread', required: false, type: Boolean })
  findMine(@CurrentUser() user: JwtPayload, @Query('unread') unread?: string) {
    return this.notifications.findForUser(user.sub, unread === 'true');
  }

  @Patch('read-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Отметить все уведомления прочитанными' })
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub);
  }

  @Patch(':id/read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Отметить уведомление прочитанным' })
  markRead(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.notifications.markRead(user.sub, id);
  }
}