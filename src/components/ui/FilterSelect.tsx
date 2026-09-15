import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export type FilterSelectOption = {
  value: string;
  label: string;
  hint?: string;
  /** Tailwind classes for the status/color dot */
  dotClassName?: string;
};

const DEFAULT_DOT = 'bg-primary-400 shadow-[0_0_8px_rgba(45,212,191,0.45)]';

type FilterSelectProps = {
  options: FilterSelectOption[];
  value: string;
  onChange: (next: string) => void;
  className?: string;
  listClassName?: string;
  'data-testid'?: string;
  'aria-label'?: string;
};

export function FilterSelect({
  options,
  value,
  onChange,
  className,
  listClassName,
  'data-testid': testId,
  'aria-label': ariaLabel = 'Filter',
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!selected) return null;

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        data-testid={testId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-full h-11 px-3.5 rounded-xl text-sm text-left flex items-center gap-2.5',
          'bg-zinc-900/50 border transition-[border-color,background-color,box-shadow,color] duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/40',
          open
            ? 'border-primary-500/70 ring-2 ring-primary-500/25 text-zinc-50 shadow-[0_0_0_1px_rgba(20,184,166,0.18)]'
            : 'border-primary-500/25 text-zinc-200 hover:border-primary-500/50 hover:bg-zinc-900/70'
        )}
      >
        <span className={cn('w-2 h-2 rounded-full shrink-0', selected.dotClassName || DEFAULT_DOT)} />
        <span className="flex-1 truncate font-medium">{selected.label}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-primary-300/80 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label={ariaLabel}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute z-50 mt-2 w-full overflow-hidden origin-top',
              'rounded-xl border border-primary-500/35',
              'bg-zinc-900',
              'shadow-xl shadow-black/40 ring-1 ring-primary-500/15',
              listClassName
            )}
          >
            <div className="p-1.5 space-y-0.5 max-h-72 overflow-y-auto">
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value || option.label}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150',
                      active
                        ? 'bg-primary-500/15 text-zinc-50'
                        : 'text-zinc-300 hover:bg-primary-500/10 hover:text-zinc-50'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        option.dotClassName || DEFAULT_DOT
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight">{option.label}</span>
                      {option.hint && (
                        <span className="block text-[11px] text-zinc-500 mt-0.5 leading-tight">
                          {option.hint}
                        </span>
                      )}
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-primary-400 mt-1 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
