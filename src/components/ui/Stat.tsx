import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  'data-testid'?: string;
}

export function Stat({ label, value, hint, className, ...rest }: StatProps) {
  return (
    <div className={cn('min-w-0', className)} {...rest}>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1 text-zinc-50">{value}</p>
      {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </div>
  );
}
