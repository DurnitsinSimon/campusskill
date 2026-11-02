import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarX, History } from 'lucide-react';
import { enrollmentsApi } from '../../api/enrollments';
import { getErrorMessage } from '../../api/client';
import type { Enrollment } from '../../api/types';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { ButtonLink } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { EnrollmentItem } from './EnrollmentItem';
import { ReviewModal } from './ReviewModal';

export function EnrollmentsTab() {
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const [reviewing, setReviewing] = useState<Enrollment | null>(null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['my-enrollments', scope],
    queryFn: () => enrollmentsApi.mine(scope),
  });

  const toReview = data?.filter((item) => item.canReview).length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <Chip isActive={scope === 'upcoming'} onClick={() => setScope('upcoming')}>
          Предстоящие
        </Chip>
        <Chip isActive={scope === 'past'} onClick={() => setScope('past')}>
          История
        </Chip>
      </div>

      {scope === 'past' && toReview > 0 && (
        <Alert tone="success">Вы посетили воркшоп, но ещё не оставили отзыв — ментору важно ваше мнение.</Alert>
      )}

      {isPending ? (
        <Spinner />
      ) : isError ? (
        <Alert>{getErrorMessage(error)}</Alert>
      ) : data.length === 0 ? (
        scope === 'upcoming' ? (
          <EmptyState
            icon={CalendarX}
            title="Нет предстоящих воркшопов"
            description="Найдите что-нибудь интересное в каталоге — от Figma до рамена."
            action={<ButtonLink to="/">Перейти в каталог</ButtonLink>}
          />
        ) : (
          <EmptyState icon={History} title="История пуста" description="Здесь появятся прошедшие и отменённые записи." />
        )
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((enrollment) => (
            <EnrollmentItem key={enrollment.id} enrollment={enrollment} onReview={setReviewing} />
          ))}
        </div>
      )}

      <ReviewModal enrollment={reviewing} onClose={() => setReviewing(null)} />
    </div>
  );
}