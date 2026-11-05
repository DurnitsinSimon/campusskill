import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "../../api/reviews";
import { getErrorMessage } from "../../api/client";
import type { Enrollment } from "../../api/types";
import { Modal } from "../../components/ui/Modal";
import { StarInput } from "../../components/ui/StarInput";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

interface ReviewModalProps {
  enrollment: Enrollment | null;
  onClose: () => void;
}

export function ReviewModal({ enrollment, onClose }: ReviewModalProps) {
  const queryClient = useQueryClient();
  const [workshopRating, setWorkshopRating] = useState(0);
  const [mentorRating, setMentorRating] = useState(0);
  const [comment, setComment] = useState("");

  const close = () => {
    setWorkshopRating(0);
    setMentorRating(0);
    setComment("");
    create.reset();
    onClose();
  };

  const create = useMutation({
    mutationFn: reviewsApi.create,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-enrollments"] }),
        queryClient.invalidateQueries({
          queryKey: ["workshop", enrollment?.workshop.slug],
        }),
        queryClient.invalidateQueries({ queryKey: ["workshops"] }),
        queryClient.invalidateQueries({ queryKey: ["progress"] }),
      ]);
      close();
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!enrollment) return;
    create.mutate({
      enrollmentId: enrollment.id,
      workshopRating,
      mentorRating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={!!enrollment} onClose={close} title="Отзыв о воркшопе">
      {enrollment && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <p className="-mt-2 text-sm text-ink-600">
            «{enrollment.workshop.title}» · {enrollment.workshop.mentorName}
          </p>
          <StarInput
            label="Как вам воркшоп?"
            value={workshopRating}
            onChange={setWorkshopRating}
          />
          <StarInput
            label="Как объяснял ментор?"
            value={mentorRating}
            onChange={setMentorRating}
          />
          <Textarea
            label="Комментарий"
            placeholder="Что понравилось, что можно улучшить"
            hint="Необязательно, но очень поможет ментору"
            maxLength={1000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          {create.isError && <Alert>{getErrorMessage(create.error)}</Alert>}
          <Button
            type="submit"
            size="lg"
            disabled={!workshopRating || !mentorRating}
            isLoading={create.isPending}
          >
            Отправить отзыв
          </Button>
        </form>
      )}
    </Modal>
  );
}
