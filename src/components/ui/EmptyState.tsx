import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function EmptyState({ icon, title, description, action, className, ...rest }: EmptyStateProps) {
  return (
    <div className={cn('py-12 px-6 text-center', className)} {...rest}>
      {icon && (
        <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-800/80 flex items-center justify-center mb-4 text-zinc-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="text-sm text-zinc-400 mt-1.5 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
