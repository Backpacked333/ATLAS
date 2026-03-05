import { clsx } from 'clsx';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  name?: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  riskTier?: string;
}

const ringColors: Record<string, string> = {
  ON_TRACK: 'ring-atlas-emerald-400',
  NEEDS_SUPPORT: 'ring-atlas-amber-400',
  URGENT: 'ring-atlas-rose-400',
};

const bgColors = [
  'bg-atlas-indigo-500',
  'bg-atlas-violet-500',
  'bg-atlas-sky-500',
  'bg-atlas-emerald-600',
  'bg-atlas-amber-600',
  'bg-atlas-rose-500',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function Avatar({ firstName, lastName, name, photoUrl, size = 'md', riskTier }: AvatarProps) {
  const resolvedFirst = firstName || (name ? name.split(' ')[0] : '?');
  const resolvedLast = lastName || (name ? name.split(' ').slice(1).join(' ') || '?' : '?');

  const sizeClass = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl',
  }[size];

  const bg = bgColors[hashName(resolvedFirst + resolvedLast) % bgColors.length];
  const ring = riskTier ? ringColors[riskTier] : undefined;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${resolvedFirst} ${resolvedLast}`}
        className={clsx(
          'rounded-full object-cover',
          sizeClass,
          ring && `ring-2 ${ring} ring-offset-1`
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        sizeClass,
        bg,
        ring && `ring-2 ${ring} ring-offset-1`
      )}
    >
      {resolvedFirst[0]}{resolvedLast[0]}
    </div>
  );
}
