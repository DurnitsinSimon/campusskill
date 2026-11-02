const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

export const formatPrice = (price: number) =>
  price === 0 ? 'Бесплатно' : `${price.toLocaleString('ru-RU')} ₽`;

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours && `${hours} ч`, rest && `${rest} мин`].filter(Boolean).join(' ');
}

export function pluralize(count: number, [one, few, many]: [string, string, string]) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const levelLabels = {
  BEGINNER: 'Для начинающих',
  INTERMEDIATE: 'Средний уровень',
  ADVANCED: 'Продвинутый',
} as const;

export const formatLabels = { ONLINE: 'Онлайн', OFFLINE: 'Офлайн' } as const;