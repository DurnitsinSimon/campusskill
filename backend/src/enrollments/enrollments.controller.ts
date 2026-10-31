import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Записаться на воркшоп (или встать в лист ожидания, если мест нет)',
  })
  enroll(@CurrentUser() user: JwtPayload, @Body() dto: CreateEnrollmentDto) {
    return this.enrollments.enroll(user.sub, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Мои записи: предстоящие или история' })
  @ApiQuery({ name: 'scope', enum: ['upcoming', 'past'], required: false })
  findMine(@CurrentUser() user: JwtPayload, @Query('scope') scope?: string) {
    return this.enrollments.findMine(
      user.sub,
      scope === 'past' ? 'past' : 'upcoming',
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary:
      'Отменить запись. Освободившееся место получает первый из листа ожидания',
  })
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.enrollments.cancel(user.sub, id);
  }

  @Get('workshop/:workshopId')
  @ApiOperation({
    summary: 'Моя запись на конкретный воркшоп (null, если не записан)',
  })
  findForWorkshop(
    @CurrentUser() user: JwtPayload,
    @Param('workshopId', ParseIntPipe) workshopId: number,
  ) {
    return this.enrollments.findForWorkshop(user.sub, workshopId);
  }
}
