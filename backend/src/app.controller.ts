import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class AppController {
  @Get()
  @ApiOkResponse({ description: 'Сервис работает' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}