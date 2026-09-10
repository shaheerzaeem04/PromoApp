import { Moon, Sun } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../theme/ThemeProvider';

export function ThemeToggle({
  className,
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md';
}) {
  const { resolved, toggleLightDark } = useTheme();
  const isDark = resolved === 'dark';

  return (
    <button
      type="button"
      onClick={toggleLightDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'inline-flex items-center justify-center rounded-control border border-border bg-surface text-muted-foreground',
        'hover:text-foreground hover:bg-surface-muted transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
        className
      )}
    >
      {isDark ? <Sun className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} /> : <Moon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
    </button>
  );
}
