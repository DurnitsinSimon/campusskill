import type { EnrollmentStatus } from '../../api/types';
import { Badge, type BadgeTone } from '../ui/Badge';

const statusConfig: Record<EnrollmentStatus, { label: string; tone: BadgeTone }> = {
  CONFIRMED: { label: 'Запись подтверждена', tone: 'success' },
  WAITLISTED: { label: 'Лист ожидания', tone: 'warning' },
  CANCELLED: { label: 'Отменена', tone: 'neutral' },
  REJECTED: { label: 'Отклонена ментором', tone: 'danger' },
  ATTENDED: { label: 'Посещено', tone: 'brand' },
  NO_SHOW: { label: 'Не пришёл', tone: 'neutral' },
};

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  const { label, tone } = statusConfig[status];
  return <Badge tone={tone}>{label}</Badge>;
}