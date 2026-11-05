import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentStatus } from '../generated/prisma/enums';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      omit: { passwordHash: true },
      include: { mentorProfile: true },
    });
  }

  async getProgress(userId: number) {
    const [skills, attended, reviewsCount] = await Promise.all([
      this.prisma.userSkillProgress.findMany({
        where: { userId },
        orderBy: [{ workshopsCompleted: 'desc' }, { minutesTotal: 'desc' }],
        select: {
          workshopsCompleted: true,
          minutesTotal: true,
          level: true,
          updatedAt: true,
          skill: {
            select: { name: true, slug: true, category: { select: { name: true, slug: true, icon: true } } },
          },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { userId, status: EnrollmentStatus.ATTENDED },
        select: { workshop: { select: { durationMinutes: true } } },
      }),
      this.prisma.review.count({ where: { enrollment: { userId } } }),
    ]);

    return {
      summary: {
        workshopsAttended: attended.length,
        minutesTotal: attended.reduce((sum, item) => sum + item.workshop.durationMinutes, 0),
        skillsCount: skills.length,
        reviewsCount,
      },
      skills,
    };
  }
}