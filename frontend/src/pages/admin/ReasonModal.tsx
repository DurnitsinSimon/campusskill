import { useState, type FormEvent } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  isPending: boolean;
  error?: string;
  onSubmit: (reason: string) => void;
}

const MIN_LENGTH = 10;

export function ReasonModal({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel,
  isPending,
  error,
  onSubmit,
}: ReasonModalProps) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(trimmed);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-ink-600">{description}</p>
        <Textarea
          label="Причина"
          rows={4}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          hint={`${trimmed.length} / 500, минимум ${MIN_LENGTH} символов`}
          autoFocus
        />
        {error && <Alert>{error}</Alert>}
        <div className="flex gap-2">
          <Button type="submit" variant="danger" isLoading={isPending} disabled={trimmed.length < MIN_LENGTH}>
            {confirmLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </form>
    </Modal>
  );
}