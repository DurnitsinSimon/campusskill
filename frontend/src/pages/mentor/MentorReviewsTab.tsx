import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, Reply } from 'lucide-react';
import { mentorApi } from '../../api/mentor';
import { getErrorMessage } from '../../api/client';
import type { MentorReview } from '../../api/types';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Stars } from '../../components/workshops/ReviewCard';
import { formatDate } from '../../lib/format';

function MentorReviewItem({ review }: { review: MentorReview }) {
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [text, setText] = useState(review.mentorReply ?? '');
  const { user, workshop } = review.enrollment;

  const reply = useMutation({
    mutationFn: () => mentorApi.reply(review.id, text.trim()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mentor-reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['workshop', workshop.slug] }),
      ]);
      setIsReplying(false);
    },
  });

  return (
    <article className="flex flex-col gap-3 rounded-3xl bg-white p-5 ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {user.firstName} {user.lastName}
          </p>
          <Link
            to={`/workshops/${workshop.slug}`}
            className="block truncate text-xs text-brand-600 hover:text-brand-700"
          >
            {workshop.title}
          </Link>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <Stars value={review.workshopRating} />
          <span className="text-xs text-ink-400">{formatDate(review.createdAt)}</span>
        </div>
      </div>

      {review.comment && <p className="text-sm">{review.comment}</p>}
      <p className="text-xs text-ink-400">Оценка вам как ментору: {review.mentorRating} из 5</p>

      {isReplying ? (
        <div className="flex flex-col gap-2">
          <Textarea label="Ваш ответ" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} />
          {reply.isError && <Alert>{getErrorMessage(reply.error)}</Alert>}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={text.trim().length < 2}
              isLoading={reply.isPending}
              onClick={() => reply.mutate()}
            >
              Опубликовать ответ
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsReplying(false)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : review.mentorReply ? (
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-brand-700">Ваш ответ</p>
            <button
              type="button"
              onClick={() => setIsReplying(true)}
              className="text-xs font-semibold text-ink-400 hover:text-ink-900"
            >
              Изменить
            </button>
          </div>
          <p className="mt-1 text-ink-600">{review.mentorReply}</p>
        </div>
      ) : (
        <Button size="sm" variant="secondary" className="self-start" onClick={() => setIsReplying(true)}>
          <Reply className="size-4" /> Ответить
        </Button>
      )}
    </article>
  );
}

export function MentorReviewsTab() {
  const { data, isPending, isError, error } = useQuery({ queryKey: ['mentor-reviews'], queryFn: mentorApi.reviews });

  if (isPending) return <Spinner />;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;
  if (data.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareText}
        title="Отзывов пока нет"
        description="Участники оставляют отзывы после воркшопа."
      />
    );
  }

  const withoutReply = data.filter((review) => !review.mentorReply).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-ink-600">
        Всего отзывов: {data.length}
        {withoutReply > 0 && ` · без ответа: ${withoutReply}`}
      </p>
      {data.map((review) => (
        <MentorReviewItem key={review.id} review={review} />
      ))}
    </div>
  );
}