import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { authApi } from '../../services/api';

function initials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function UserAvatar({
  name,
  avatar,
  className,
  textClassName,
  alt,
}: {
  name?: string;
  avatar?: string | null;
  className?: string;
  textClassName?: string;
  alt?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!avatar) {
      setSrc(null);
      return;
    }
    if (/^https?:\/\//i.test(avatar)) {
      setSrc(avatar);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    authApi
      .getAvatarBlob()
      .then((response) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatar]);

  if (src) {
    return (
      <img
        src={src}
        alt={alt || ''}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-zinc-800 flex items-center justify-center text-zinc-200 font-semibold',
        className
      )}
      aria-hidden
    >
      <span className={textClassName}>{initials(name)}</span>
    </div>
  );
}
