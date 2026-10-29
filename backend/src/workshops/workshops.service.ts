import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { EnrollmentStatus, WorkshopStatus } from '../generated/prisma/enums';
import {
  PriceFilter,
  WorkshopQueryDto,
  WorkshopSort,
} from './dto/workshop-query.dto';

const listSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  coverUrl: true,
  format: true,
  location: true,
  level: true,
  status: true,
  startsAt: true,
  durationMinutes: true,
  capacity: true,
  price: true,
  ratingAvg: true,
  reviewsCount: true,
  mentor: {
    select: {
      id: true,
      headline: true,
      ratingAvg: true,
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  },
  skills: {
    orderBy: { isPrimary: 'desc' },
    select: {
      isPrimary: true,
      skill: {
        select: {
          name: true,
          slug: true,
          category: { select: { name: true, slug: true, icon: true } },
        },
      },
    },
  },
  _count: {
    select: { enrollments: { where: { status: EnrollmentStatus.CONFIRMED } } },
  },
} satisfies Prisma.WorkshopSelect;

type WorkshopListRow = Prisma.WorkshopGetPayload<{ select: typeof listSelect }>;

const ORDER_BY: Record<
  WorkshopSort,
  Prisma.WorkshopOrderByWithRelationInput[]
> = {
  [WorkshopSort.DATE]: [{ startsAt: 'asc' }],
  [WorkshopSort.RATING]: [{ ratingAvg: 'desc' }, { startsAt: 'asc' }],
  [WorkshopSort.PRICE_ASC]: [{ price: 'asc' }, { startsAt: 'asc' }],
  [WorkshopSort.PRICE_DESC]: [{ price: 'desc' }, { startsAt: 'asc' }],
  [WorkshopSort.POPULAR]: [
    { enrollments: { _count: 'desc' } },
    { startsAt: 'asc' },
  ],
};

const PUBLIC_STATUSES: WorkshopStatus[] = [
  WorkshopStatus.PUBLISHED,
  WorkshopStatus.COMPLETED,
  WorkshopStatus.CANCELLED,
];

@Injectable()
export class WorkshopsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: WorkshopQueryDto) {
    const where = await this.buildWhere(query);
    const { page, limit } = query;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.workshop.findMany({
        where,
        orderBy: ORDER_BY[query.sort],
        skip: (page - 1) * limit,
        take: limit,
        select: listSelect,
      }),
      this.prisma.workshop.count({ where }),
    ]);

    return {
      items: rows.map(toListItem),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { slug },
      select: {
        ...listSelect,
        description: true,
        requirements: true,
        mentor: {
          select: {
            ...listSelect.mentor.select,
            experience: true,
            yearsOfExperience: true,
            reviewsCount: true,
            telegram: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
        programItems: {
          orderBy: { position: 'asc' },
          select: {
            position: true,
            title: true,
            description: true,
            durationMinutes: true,
          },
        },
      },
    });

    if (!workshop || !PUBLIC_STATUSES.includes(workshop.status)) {
      throw new NotFoundException('Воркшоп не найден');
    }

    const [reviews, similar] = await Promise.all([
      this.findReviews(workshop.id),
      this.findSimilar(
        workshop.id,
        workshop.skills.map(({ skill }) => ({
          slug: skill.slug,
          categorySlug: skill.category.slug,
        })),
      ),
    ]);

    const listItem = toListItem(workshop);
    return {
      ...listItem,
      description: workshop.description,
      requirements: workshop.requirements,
      programItems: workshop.programItems,
      mentor: {
        ...listItem.mentor,
        experience: workshop.mentor.experience,
        yearsOfExperience: workshop.mentor.yearsOfExperience,
        reviewsCount: workshop.mentor.reviewsCount,
        telegram: workshop.mentor.telegram,
        bio: workshop.mentor.user.bio,
      },
      reviews,
      similar,
    };
  }

  private async buildWhere(
    query: WorkshopQueryDto,
  ): Promise<Prisma.WorkshopWhereInput> {
    const now = new Date();
    const from = query.dateFrom && query.dateFrom > now ? query.dateFrom : now;
    const and: Prisma.WorkshopWhereInput[] = [];

    if (query.search) {
      const contains = { contains: query.search, mode: 'insensitive' as const };
      and.push({
        OR: [
          { title: contains },
          { shortDescription: contains },
          { description: contains },
          { skills: { some: { skill: { name: contains } } } },
          {
            mentor: {
              user: { OR: [{ firstName: contains }, { lastName: contains }] },
            },
          },
        ],
      });
    }
    if (query.skills?.length) {
      and.push({ skills: { some: { skill: { slug: { in: query.skills } } } } });
    }
    if (query.category) {
      and.push({
        skills: { some: { skill: { category: { slug: query.category } } } },
      });
    }
    if (query.hasSeats) {
      and.push({ id: { in: await this.findIdsWithFreeSeats() } });
    }

    return {
      status: WorkshopStatus.PUBLISHED,
      startsAt: {
        gte: from,
        ...(query.dateTo && {
          lt: new Date(query.dateTo.getTime() + 24 * 60 * 60 * 1000),
        }),
      },
      format: query.format,
      level: query.level,
      price:
        query.price === PriceFilter.FREE
          ? 0
          : query.price === PriceFilter.PAID
            ? { gt: 0 }
            : undefined,
      ratingAvg: query.minRating ? { gte: query.minRating } : undefined,
      AND: and,
    };
  }

  private async findIdsWithFreeSeats() {
    const rows = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT w.id
      FROM "Workshop" w
      WHERE w.capacity > (
        SELECT COUNT(*) FROM "Enrollment" e
        WHERE e."workshopId" = w.id AND e.status = 'CONFIRMED'
      )
    `;
    return rows.map((row) => row.id);
  }
  private async findReviews(workshopId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { enrollment: { workshopId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        workshopRating: true,
        mentorRating: true,
        comment: true,
        mentorReply: true,
        createdAt: true,
        enrollment: {
          select: {
            user: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return reviews.map(({ enrollment, ...review }) => ({
      ...review,
      author: {
        name: `${enrollment.user.firstName} ${enrollment.user.lastName.charAt(0)}.`,
        avatarUrl: enrollment.user.avatarUrl,
      },
    }));
  }

 
  private async findSimilar(
    workshopId: number,
    skills: { slug: string; categorySlug: string }[],
    limit = 4,
  ) {
    const skillSlugs = skills.map((item) => item.slug);
    const categorySlugs = [...new Set(skills.map((item) => item.categorySlug))];

    const candidates = await this.prisma.workshop.findMany({
      where: {
        id: { not: workshopId },
        status: WorkshopStatus.PUBLISHED,
        startsAt: { gte: new Date() },
        skills: {
          some: {
            skill: {
              OR: [
                { slug: { in: skillSlugs } },
                { category: { slug: { in: categorySlugs } } },
              ],
            },
          },
        },
      },
      select: listSelect,
      take: 30,
    });

    const score = (row: WorkshopListRow) =>
      row.skills.filter((item) => skillSlugs.includes(item.skill.slug)).length *
        10 +
      (row.skills.some((item) =>
        categorySlugs.includes(item.skill.category.slug),
      )
        ? 1
        : 0);

    return candidates
      .sort((a, b) => score(b) - score(a) || b.ratingAvg - a.ratingAvg)
      .slice(0, limit)
      .map(toListItem);
  }
}

function toListItem(row: WorkshopListRow) {
  const { _count, mentor, skills, ...workshop } = row;
  const seatsTaken = _count.enrollments;
  return {
    ...workshop,
    seatsTaken,
    seatsLeft: Math.max(workshop.capacity - seatsTaken, 0),
    mentor: {
      id: mentor.id,
      headline: mentor.headline,
      ratingAvg: mentor.ratingAvg,
      firstName: mentor.user.firstName,
      lastName: mentor.user.lastName,
      avatarUrl: mentor.user.avatarUrl,
    },
    skills: skills.map(({ isPrimary, skill }) => ({
      name: skill.name,
      slug: skill.slug,
      isPrimary,
      category: skill.category,
    })),
  };
}
