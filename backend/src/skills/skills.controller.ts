import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { WorkshopStatus } from '../generated/prisma/enums';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Категории с навыками — для фильтров каталога' })
  async categories() {
    const categories = await this.prisma.skillCategory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        skills: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                workshops: {
                  where: { workshop: { status: WorkshopStatus.PUBLISHED, startsAt: { gte: new Date() } } },
                },
              },
            },
          },
        },
      },
    });

    return categories.map((category) => ({
      ...category,
      skills: category.skills.map(({ _count, ...skill }) => ({
        ...skill,
        workshopsCount: _count.workshops,
      })),
    }));
  }
}