import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Записаться на воркшоп (или встать в лист ожидания, если мест нет)' })
  enroll(@CurrentUser() user: JwtPayload, @Body() dto: CreateEnrollmentDto) {
    return this.enrollments.enroll(user.sub, dto);
  }

  @Get('workshop/:workshopId')
  @ApiOperation({ summary: 'Моя запись на конкретный воркшоп (null, если не записан)' })
  findForWorkshop(
    @CurrentUser() user: JwtPayload,
    @Param('workshopId', ParseIntPipe) workshopId: number,
  ) {
    return this.enrollments.findForWorkshop(user.sub, workshopId);
  }
}