import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';
import {
  EnrollmentStatus,
  NotificationType,
  Role,
  SkillLevel,
  WorkshopStatus,
} from '../src/generated/prisma/enums';
import {
  admin,
  categories,
  demoParticipant,
  DEMO_PASSWORD,
  EMAIL_DOMAIN,
  mentors,
  participants,
  PersonSeed,
  ReviewSeed,
  workshops,
  WorkshopSeed,
} from './seed-data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// ───────────── утилиты ─────────────

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = new Date();

/** Детерминированный генератор случайных чисел: при каждом запуске seed данные одинаковые */
function createRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = createRandom(20261109);

const shift = (date: Date, ms: number) => new Date(date.getTime() + ms);
const minDate = (a: Date, b: Date) => (a < b ? a : b);

function dayAt(day: number, [hours, minutes]: [number, number]) {
  const date = new Date(now);
  date.setDate(date.getDate() + day);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .split('')
    .map((char) => TRANSLIT[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

const email = (person: PersonSeed) => `${person.emailName}@${EMAIL_DOMAIN}`;

// ───────────── этапы ─────────────

async function clearDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE "Notification", "Reminder", "Review", "Enrollment", "UserSkillProgress",
             "WorkshopSkill", "WorkshopProgramItem", "Workshop", "MentorSkill",
             "MentorProfile", "User", "Skill", "SkillCategory"
    RESTART IDENTITY CASCADE
  `);
}

async function seedSkills() {
  const skillIds = new Map<string, number>();
  for (const category of categories) {
    const created = await prisma.skillCategory.create({
      data: {
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        skills: {
          create: category.skills.map(([name, slug]) => ({ name, slug })),
        },
      },
      include: { skills: true },
    });
    created.skills.forEach((skill) => skillIds.set(skill.slug, skill.id));
  }
  return skillIds;
}

async function seedUsers(skillIds: Map<string, number>) {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const registeredAt = () => shift(now, -(60 + Math.floor(random() * 150)) * DAY);

  const baseUser = (person: PersonSeed, role: Role): Prisma.UserCreateInput => ({
    email: email(person),
    passwordHash,
    firstName: person.firstName,
    lastName: person.lastName,
    bio: person.bio,
    university: person.university,
    course: person.course || null,
    role,
    createdAt: registeredAt(),
  });

  await prisma.user.create({ data: baseUser(admin, Role.ADMIN) });

  const mentorProfileIds = new Map<string, number>();
  const mentorUserIds = new Map<string, number>();
  for (const mentor of mentors) {
    const user = await prisma.user.create({
      data: {
        ...baseUser(mentor, Role.MENTOR),
        mentorProfile: {
          create: {
            headline: mentor.headline,
            experience: mentor.experience,
            yearsOfExperience: mentor.yearsOfExperience,
            formats: mentor.formats,
            telegram: mentor.telegram,
            skills: {
              create: mentor.skills.map(([slug, level]) => ({
                skillId: skillIds.get(slug)!,
                level,
              })),
            },
          },
        },
      },
      include: { mentorProfile: true },
    });
    mentorProfileIds.set(mentor.key, user.mentorProfile!.id);
    mentorUserIds.set(mentor.key, user.id);
  }

  const demo = await prisma.user.create({ data: baseUser(demoParticipant, Role.PARTICIPANT) });

  const participantIds: number[] = [];
  const participantNames = new Map<number, string>([[demo.id, `${demo.firstName} ${demo.lastName}`]]);
  for (const person of participants) {
    const user = await prisma.user.create({ data: baseUser(person, Role.PARTICIPANT) });
    participantIds.push(user.id);
    participantNames.set(user.id, `${user.firstName} ${user.lastName}`);
  }

  return { mentorProfileIds, mentorUserIds, demoId: demo.id, participantIds, participantNames };
}

interface PlannedEnrollment {
  userId: number;
  status: EnrollmentStatus;
  waitlistPosition?: number;
  review?: ReviewSeed;
}

/** Распределяет участников по воркшопу согласно счётчикам из seed-data */
function planEnrollments(
  workshop: WorkshopSeed,
  index: number,
  pool: number[],
  demoId: number,
): PlannedEnrollment[] {
  const offset = (index * 5) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  let cursor = 0;
  const take = (count = 0) => rotated.slice(cursor, (cursor += count));

  const planned: PlannedEnrollment[] = [];
  const reviews = [...(workshop.reviews ?? [])];

  take(workshop.attended).forEach((userId) =>
    planned.push({ userId, status: EnrollmentStatus.ATTENDED, review: reviews.shift() }),
  );
  take(workshop.noShow).forEach((userId) => planned.push({ userId, status: EnrollmentStatus.NO_SHOW }));
  take(workshop.confirmed).forEach((userId) => planned.push({ userId, status: EnrollmentStatus.CONFIRMED }));
  take(workshop.cancelled).forEach((userId) => planned.push({ userId, status: EnrollmentStatus.CANCELLED }));

  const waitlist = take(workshop.waitlisted);
  if (workshop.demo?.status === 'WAITLISTED') {
    waitlist.splice(workshop.demo.position - 1, 0, demoId);
  }
  waitlist.forEach((userId, i) =>
    planned.push({ userId, status: EnrollmentStatus.WAITLISTED, waitlistPosition: i + 1 }),
  );

  const demo = workshop.demo;
  if (demo && demo.status !== 'WAITLISTED') {
    planned.unshift({
      userId: demoId,
      status: EnrollmentStatus[demo.status],
      review: demo.status === 'ATTENDED' ? demo.review : undefined,
    });
  }

  // если воркшоп отменил ментор — все записи аннулируются
  if (workshop.status === WorkshopStatus.CANCELLED) {
    planned.forEach((item) => (item.status = EnrollmentStatus.CANCELLED));
  }
  return planned;
}

async function seedWorkshops(
  skillIds: Map<string, number>,
  users: Awaited<ReturnType<typeof seedUsers>>,
) {
  const notifications: Prisma.NotificationCreateManyInput[] = [];
  const progress = new Map<string, { userId: number; skillId: number; count: number; minutes: number }>();
  const pool = users.participantIds;

  const notify = (
    userId: number,
    workshopId: number,
    type: NotificationType,
    title: string,
    body: string,
    createdAt: Date,
  ) =>
    notifications.push({
      userId,
      workshopId,
      type,
      title,
      body,
      createdAt,
      isRead: createdAt < shift(now, -2 * DAY),
    });

  for (const [index, seed] of workshops.entries()) {
    const startsAt = dayAt(seed.day, seed.time);
    const endsAt = shift(startsAt, seed.durationMinutes * 60 * 1000);
    const isListed = [WorkshopStatus.PUBLISHED, WorkshopStatus.COMPLETED, WorkshopStatus.CANCELLED].some(
      (status) => status === seed.status,
    );
    const publishedAt = isListed ? minDate(shift(startsAt, -14 * DAY), shift(now, -3 * DAY)) : null;
    const createdAt = publishedAt ? shift(publishedAt, -2 * DAY) : shift(now, -2 * DAY);

    const workshop = await prisma.workshop.create({
      data: {
        mentorId: users.mentorProfileIds.get(seed.mentor)!,
        title: seed.title,
        slug: slugify(seed.title),
        shortDescription: seed.shortDescription,
        description: seed.description,
        requirements: seed.requirements,
        format: seed.format,
        location: seed.location,
        meetingUrl: seed.meetingUrl,
        level: seed.level,
        startsAt,
        durationMinutes: seed.durationMinutes,
        capacity: seed.capacity,
        price: seed.price,
        status: seed.status,
        rejectionReason: seed.rejectionReason,
        publishedAt,
        createdAt,
        programItems: {
          create: seed.program.map(([title, durationMinutes, description], i) => ({
            position: i + 1,
            title,
            durationMinutes,
            description,
          })),
        },
        skills: {
          create: seed.skills.map((slug, i) => ({ skillId: skillIds.get(slug)!, isPrimary: i === 0 })),
        },
      },
    });

    const mentorUserId = users.mentorUserIds.get(seed.mentor)!;
    const quoted = `«${workshop.title}»`;

    if (publishedAt) {
      notify(mentorUserId, workshop.id, NotificationType.WORKSHOP_APPROVED, 'Воркшоп опубликован',
        `${quoted} прошёл модерацию и появился в каталоге.`, shift(publishedAt, HOUR));
    }
    if (seed.status === WorkshopStatus.REJECTED) {
      notify(mentorUserId, workshop.id, NotificationType.WORKSHOP_REJECTED, 'Воркшоп отклонён',
        `${quoted}: ${seed.rejectionReason}`, shift(now, -2 * DAY));
    }
    if (!publishedAt) continue;

    const isPast = startsAt < now;
    for (const plan of planEnrollments(seed, index, pool, users.demoId)) {
      const enrolledAt = shift(
        publishedAt,
        random() * 0.9 * (minDate(startsAt, now).getTime() - publishedAt.getTime()),
      );
      const wasConfirmed = ([EnrollmentStatus.CONFIRMED, EnrollmentStatus.ATTENDED, EnrollmentStatus.NO_SHOW] as EnrollmentStatus[])
        .includes(plan.status);
      const cancelledAt =
        plan.status === EnrollmentStatus.CANCELLED
          ? seed.status === WorkshopStatus.CANCELLED
            ? shift(now, -DAY)
            : shift(enrolledAt, DAY)
          : null;

      const enrollment = await prisma.enrollment.create({
        data: {
          workshopId: workshop.id,
          userId: plan.userId,
          status: plan.status,
          waitlistPosition: plan.waitlistPosition,
          createdAt: enrolledAt,
          confirmedAt: wasConfirmed ? enrolledAt : null,
          attendedAt: plan.status === EnrollmentStatus.ATTENDED ? endsAt : null,
          cancelledAt,
        },
      });

      // уведомления участнику
      if (wasConfirmed || seed.status === WorkshopStatus.CANCELLED) {
        notify(plan.userId, workshop.id, NotificationType.ENROLLMENT_CONFIRMED, 'Запись подтверждена',
          `Вы записаны на ${quoted}, ${formatDate(startsAt)}.`, enrolledAt);
      }
      if (plan.status === EnrollmentStatus.WAITLISTED) {
        notify(plan.userId, workshop.id, NotificationType.ENROLLMENT_WAITLISTED, 'Вы в листе ожидания',
          `Все места на ${quoted} заняты. Ваша позиция в очереди: ${plan.waitlistPosition}. Сообщим, если место освободится.`,
          enrolledAt);
      }
      if (seed.status === WorkshopStatus.CANCELLED) {
        notify(plan.userId, workshop.id, NotificationType.WORKSHOP_CANCELLED, 'Воркшоп отменён',
          `Ментор отменил ${quoted}. Ваша запись аннулирована.`, cancelledAt!);
      }

      // уведомление ментору о новых записях на предстоящие воркшопы
      if (!isPast && plan.status !== EnrollmentStatus.CANCELLED) {
        notify(mentorUserId, workshop.id, NotificationType.NEW_ENROLLMENT, 'Новый участник',
          `${users.participantNames.get(plan.userId)} записался(-ась) на ${quoted}.`, enrolledAt);
      }

      // напоминание за сутки до начала
      if (plan.status === EnrollmentStatus.CONFIRMED && !isPast) {
        const remindAt = shift(startsAt, -24 * HOUR);
        const sent = remindAt <= now;
        await prisma.reminder.create({
          data: { enrollmentId: enrollment.id, remindAt, sentAt: sent ? remindAt : null },
        });
        if (sent) {
          notify(plan.userId, workshop.id, NotificationType.WORKSHOP_REMINDER, 'Скоро воркшоп',
            `${quoted} начнётся ${formatDate(startsAt)}.`, remindAt);
        }
      }

      if (plan.status !== EnrollmentStatus.ATTENDED) continue;

      // прогресс по навыкам
      for (const slug of seed.skills) {
        const skillId = skillIds.get(slug)!;
        const key = `${plan.userId}:${skillId}`;
        const item = progress.get(key) ?? { userId: plan.userId, skillId, count: 0, minutes: 0 };
        item.count += 1;
        item.minutes += seed.durationMinutes;
        progress.set(key, item);
      }

      // отзыв или просьба его оставить
      if (plan.review) {
        const reviewedAt = shift(endsAt, (2 + random() * 40) * HOUR);
        await prisma.review.create({
          data: {
            enrollmentId: enrollment.id,
            workshopRating: plan.review.workshop,
            mentorRating: plan.review.mentor,
            comment: plan.review.comment,
            mentorReply: plan.review.reply,
            repliedAt: plan.review.reply ? shift(reviewedAt, 20 * HOUR) : null,
            createdAt: reviewedAt,
          },
        });
        notify(mentorUserId, workshop.id, NotificationType.NEW_REVIEW, 'Новый отзыв',
          `${users.participantNames.get(plan.userId)} оценил(а) ${quoted} на ${plan.review.workshop} из 5.`, reviewedAt);
      } else {
        notify(plan.userId, workshop.id, NotificationType.REVIEW_REQUEST, 'Оцените воркшоп',
          `Как прошёл ${quoted}? Ваш отзыв поможет ментору и другим студентам.`, shift(endsAt, 2 * HOUR));
      }
    }
  }

  await prisma.notification.createMany({ data: notifications });

  const levelFor = (count: number) =>
    count >= 3 ? SkillLevel.ADVANCED : count === 2 ? SkillLevel.INTERMEDIATE : SkillLevel.BEGINNER;
  await prisma.userSkillProgress.createMany({
    data: [...progress.values()].map(({ userId, skillId, count, minutes }) => ({
      userId,
      skillId,
      workshopsCompleted: count,
      minutesTotal: minutes,
      level: levelFor(count),
    })),
  });

  return notifications.length;
}

/** Пересчитывает денормализованные рейтинги — так же, как это будет делать сервис отзывов */
async function recalculateRatings() {
  const workshopsWithReviews = await prisma.workshop.findMany({
    where: { enrollments: { some: { review: { isNot: null } } } },
    select: { id: true },
  });
  for (const { id } of workshopsWithReviews) {
    const stats = await prisma.review.aggregate({
      where: { enrollment: { workshopId: id } },
      _avg: { workshopRating: true },
      _count: true,
    });
    await prisma.workshop.update({
      where: { id },
      data: { ratingAvg: Number(stats._avg.workshopRating?.toFixed(2) ?? 0), reviewsCount: stats._count },
    });
  }

  const mentorProfiles = await prisma.mentorProfile.findMany({ select: { id: true } });
  for (const { id } of mentorProfiles) {
    const stats = await prisma.review.aggregate({
      where: { enrollment: { workshop: { mentorId: id } } },
      _avg: { mentorRating: true },
      _count: true,
    });
    await prisma.mentorProfile.update({
      where: { id },
      data: { ratingAvg: Number(stats._avg.mentorRating?.toFixed(2) ?? 0), reviewsCount: stats._count },
    });
  }
}

async function main() {
  console.log('Очищаю базу...');
  await clearDatabase();

  const skillIds = await seedSkills();
  const users = await seedUsers(skillIds);
  const notificationsCount = await seedWorkshops(skillIds, users);
  await recalculateRatings();

  const [usersCount, workshopsCount, enrollmentsCount, reviewsCount] = await Promise.all([
    prisma.user.count(),
    prisma.workshop.count(),
    prisma.enrollment.count(),
    prisma.review.count(),
  ]);

  console.log(`
Готово:
  пользователей: ${usersCount}
  воркшопов:     ${workshopsCount}
  записей:       ${enrollmentsCount}
  отзывов:       ${reviewsCount}
  уведомлений:   ${notificationsCount}

Демо-аккаунты (пароль у всех: ${DEMO_PASSWORD}):
  участник:      ${email(demoParticipant)}
  ментор:        ${email(mentors[0])}
  администратор: ${email(admin)}
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
