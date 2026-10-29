import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkshopsService } from './workshops.service';
import { WorkshopQueryDto } from './dto/workshop-query.dto';

@ApiTags('Workshops')
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshops: WorkshopsService) {}

  @Get()
  @ApiOperation({ summary: 'Каталог опубликованных воркшопов с поиском, фильтрами и пагинацией' })
  findAll(@Query() query: WorkshopQueryDto) {
    return this.workshops.findAll(query);
  }
}