import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock, GraduationCap, MapPin, MessageSquareText, MonitorPlay, Send, Star } from 'lucide-react';
import { workshopsApi } from '../../api/workshops';
import { getErrorMessage } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { Rating } from '../../components/ui/Rating';
import { EmptyState } from '../../components/ui/EmptyState';
import { WorkshopCover } from '../../components/workshops/WorkshopCover';
import { WorkshopCard } from '../../components/workshops/WorkshopCard';
import { ReviewCard } from '../../components/workshops/ReviewCard';
import { formatDateTime, formatDuration, levelLabels, pluralize } from '../../lib/format';
import { EnrollPanel } from './EnrollPanel';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function WorkshopPage() {
  const { slug = '' } = useParams();
  const { data: workshop, isPending, isError, error } = useQuery({
    queryKey: ['workshop', slug],
    queryFn: () => workshopsApi.bySlug(slug),
  });

  if (isPending) return <Spinner />;
  if (isError) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Воркшоп не найден"
        description={getErrorMessage(error)}
        action={<ButtonLink to="/">Вернуться в каталог</ButtonLink>}
      />
    );
  }

  const { mentor } = workshop;

  return (
    <div className="flex flex-col gap-8">
      <ButtonLink to="/" variant="ghost" size="sm" className="-ml-3 self-start">
        <ArrowLeft className="size-4" /> Каталог
      </ButtonLink>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <header className="flex flex-col gap-5">
          <WorkshopCover id={workshop.id} coverUrl={workshop.coverUrl} skills={workshop.skills} className="h-48 rounded-3xl sm:h-60" />
          <div className="flex flex-wrap gap-2">
            {workshop.skills.map((skill) => (
              <Badge key={skill.slug} tone={skill.isPrimary ? 'brand' : 'neutral'}>
                {skill.name}
              </Badge>
            ))}
            <Badge>{levelLabels[workshop.level]}</Badge>
          </div>
          <h1 className="text-2xl leading-tight font-extrabold sm:text-3xl">{workshop.title}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-brand-600" /> {formatDateTime(workshop.startsAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-brand-600" /> {formatDuration(workshop.durationMinutes)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {workshop.format === 'ONLINE' ? <MonitorPlay className="size-4 text-brand-600" /> : <MapPin className="size-4 text-brand-600" />}
              {workshop.format === 'ONLINE' ? 'Онлайн' : 'Офлайн'}
            </span>
            <Rating value={workshop.ratingAvg} count={workshop.reviewsCount} />
          </div>
        </header>

        <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <EnrollPanel workshop={workshop} />
        </aside>

        <div className="flex flex-col gap-10">
          <Section title="О воркшопе">
            <p className="leading-relaxed whitespace-pre-line text-ink-900">{workshop.description}</p>
            {workshop.requirements && (
              <div className="rounded-2xl bg-amber-50 px-5 py-4 text-sm">
                <p className="font-bold text-amber-800">Что понадобится</p>
                <p className="mt-1 text-amber-900">{workshop.requirements}</p>
              </div>
            )}
          </Section>

          <Section title="Программа">
            <ol className="flex flex-col">
              {workshop.programItems.map((item, index) => (
                <li key={item.position} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                      {item.position}
                    </span>
                    {index < workshop.programItems.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold">{item.title}</p>
                      {item.durationMinutes && (
                        <span className="shrink-0 text-xs font-semibold text-ink-400">{item.durationMinutes} мин</span>
                      )}
                    </div>
                    {item.description && <p className="mt-1 text-sm text-ink-600">{item.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Ментор">
            <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
              <div className="flex items-center gap-4">
                <Avatar firstName={mentor.firstName} lastName={mentor.lastName} src={mentor.avatarUrl} size="lg" />
                <div className="min-w-0">
                  <p className="text-lg font-bold">
                    {mentor.firstName} {mentor.lastName}
                  </p>
                  <p className="text-sm text-ink-600">{mentor.headline}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-ink-400">
                    {mentor.reviewsCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-ink-900">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {mentor.ratingAvg.toFixed(1)} · {mentor.reviewsCount}{' '}
                        {pluralize(mentor.reviewsCount, ['отзыв', 'отзыва', 'отзывов'])}
                      </span>
                    )}
                    <span>
                      Опыт: {mentor.yearsOfExperience} {pluralize(mentor.yearsOfExperience, ['год', 'года', 'лет'])}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-ink-600">{mentor.experience}</p>
              {mentor.telegram && (
                <a
                  href={`https://t.me/${mentor.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Send className="size-4" /> {mentor.telegram}
                </a>
              )}
            </div>
          </Section>

          <Section title={`Отзывы${workshop.reviewsCount ? ` · ${workshop.reviewsCount}` : ''}`}>
            {workshop.reviews.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm text-ink-600 ring-1 ring-slate-200">
                <MessageSquareText className="size-5 text-ink-400" />
                Отзывов пока нет — их оставляют участники после воркшопа.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {workshop.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} mentorName={mentor.firstName} />
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {workshop.similar.length > 0 && (
        <Section title="Похожие воркшопы">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {workshop.similar.slice(0, 3).map((item) => (
              <WorkshopCard key={item.id} workshop={item} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}