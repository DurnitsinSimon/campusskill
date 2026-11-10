import type { WorkshopStatus } from '../../api/types';
import { Badge, type BadgeTone } from '../ui/Badge';

const statusConfig: Record<WorkshopStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Черновик', tone: 'neutral' },
  PENDING_REVIEW: { label: 'На модерации', tone: 'warning' },
  PUBLISHED: { label: 'Опубликован', tone: 'success' },
  REJECTED: { label: 'Отклонён', tone: 'danger' },
  COMPLETED: { label: 'Завершён', tone: 'brand' },
  CANCELLED: { label: 'Отменён', tone: 'neutral' },
};

export function WorkshopStatusBadge({ status }: { status: WorkshopStatus }) {
  const { label, tone } = statusConfig[status];
  return <Badge tone={tone}>{label}</Badge>;
}