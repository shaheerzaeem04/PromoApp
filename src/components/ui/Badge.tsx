import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string; 
  'data-testid'?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className, ...rest }: BadgeProps) {
  const variants = {
    default: 'bg-zinc-800/80 text-zinc-400',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-red-500/10 text-red-400',
    info: 'bg-sky-500/10 text-sky-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2 py-0.5 text-xs',
  };

  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center font-medium rounded-md tracking-wide',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
