import { cn } from '../../utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-border-strong border-t-primary-500',
        sizes[size],
        className
      )}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
    </div>
  );
}

/** Full-viewport loader — use on layout remounts (e.g. Help → browser Back → dashboard). */
export function RouteSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-[200] bg-zinc-950 flex items-center justify-center"
      data-testid="route-loading"
      aria-busy="true"
      aria-label={label}
    >
      <Spinner size="lg" />
    </div>
  );
}


