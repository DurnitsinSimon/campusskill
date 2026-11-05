import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MentorService } from './mentor.service';
import { CreateWorkshopDto, UpdateWorkshopDto } from './dto/workshop-form.dto';
import { ParticipantActionDto } from './dto/participant-action.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../generated/prisma/enums';

@ApiTags('Mentor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MENTOR)
@Controller('mentor')
export class MentorController {
  constructor(private readonly mentor: MentorService) {}

  @Get('workshops')
  @ApiOperation({ summary: 'Мои воркшопы во всех статусах со счётчиками записей' })
  findMine(@CurrentUser() user: JwtPayload) {
    return this.mentor.findMine(user.sub);
  }

  @Get('workshops/:id')
  @ApiOperation({ summary: 'Воркшоп целиком — для формы редактирования' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.mentor.findOne(user.sub, id);
  }

  @Post('workshops')
  @ApiOperation({ summary: 'Создать черновик воркшопа' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateWorkshopDto) {
    return this.mentor.create(user.sub, dto);
  }

  @Patch('workshops/:id')
  @ApiOperation({ summary: 'Изменить черновик или отклонённый воркшоп' })
  update(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkshopDto) {
    return this.mentor.update(user.sub, id, dto);
  }

  @Post('workshops/:id/submit')
  @ApiOperation({ summary: 'Отправить на модерацию' })
  submit(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.mentor.submit(user.sub, id);
  }

  @Post('workshops/:id/cancel')
  @ApiOperation({ summary: 'Отменить опубликованный воркшоп' })
  cancel(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.mentor.cancel(user.sub, id);
  }

  @Get('workshops/:id/participants')
  @ApiOperation({ summary: 'Участники воркшопа и лист ожидания' })
  participants(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.mentor.participants(user.sub, id);
  }

  @Patch('workshops/:id/participants/:enrollmentId')
  @ApiOperation({ summary: 'Отметить посещение, неявку или отклонить заявку' })
  updateParticipant(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
    @Body() dto: ParticipantActionDto,
  ) {
    return this.mentor.updateParticipant(user.sub, id, enrollmentId, dto);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Отзывы на мои воркшопы' })
  reviews(@CurrentUser() user: JwtPayload) {
    return this.mentor.findReviews(user.sub);
  }

  @Patch('reviews/:id/reply')
  @ApiOperation({ summary: 'Ответить на отзыв' })
  reply(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number, @Body() dto: ReplyReviewDto) {
    return this.mentor.replyToReview(user.sub, id, dto.reply);
  }
}