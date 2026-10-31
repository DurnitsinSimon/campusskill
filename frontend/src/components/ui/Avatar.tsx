import { cn } from '../../lib/cn';

const palette = [
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
];

function colorFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-xl' };

interface AvatarProps {
  firstName: string;
  lastName?: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

export function Avatar({ firstName, lastName = '', src, size = 'md', className }: AvatarProps) {
  const fullName = `${firstName} ${lastName}`.trim();
  if (src) {
    return <img src={src} alt={fullName} className={cn('rounded-full object-cover', sizes[size], className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        sizes[size],
        colorFor(fullName),
        className,
      )}
    >
      {firstName.charAt(0)}
      {lastName.charAt(0)}
    </span>
  );
}