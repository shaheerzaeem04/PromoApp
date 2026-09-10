import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseLocal(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDisplay(value: string) {
  const date = parseLocal(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface DateTimePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  error,
  id,
  required,
  disabled,
}: DateTimePickerProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = parseLocal(value);
  const [cursor, setCursor] = useState(() => startOfMonth(selected || new Date()));
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 320 });

  useEffect(() => {
    if (selected) setCursor(startOfMonth(selected));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(340, Math.max(300, window.innerWidth - 24));
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      const below = rect.bottom + 8;
      const height = 420;
      const top = below + height > window.innerHeight - 12
        ? Math.max(12, rect.top - height - 8)
        : below;
      setCoords({ top, left, width });
    };
    place();
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const blanks = first.getDay();
    const total = daysInMonth(cursor);
    return Array.from({ length: blanks + total }, (_, index) => {
      if (index < blanks) return null;
      return new Date(cursor.getFullYear(), cursor.getMonth(), index - blanks + 1);
    });
  }, [cursor]);

  const draft = selected || new Date();
  const hour12 = ((draft.getHours() + 11) % 12) + 1;
  const minute = draft.getMinutes();
  const isPm = draft.getHours() >= 12;

  const commit = (next: Date) => onChange(toLocalValue(next));

  const setDay = (day: Date) => {
    const next = new Date(day);
    next.setHours(draft.getHours(), draft.getMinutes(), 0, 0);
    commit(next);
  };

  const setTime = (nextHour12: number, nextMinute: number, nextPm: boolean) => {
    const hours = (nextHour12 % 12) + (nextPm ? 12 : 0);
    const next = new Date(draft);
    next.setHours(hours, nextMinute, 0, 0);
    commit(next);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="label" htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        type="datetime-local"
        value={value}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${inputId}-popover` : undefined}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          'input w-full flex items-center gap-2.5 text-left',
          !value && 'text-zinc-500',
          error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
        <span className="flex-1 truncate">{value ? formatDisplay(value) : 'Select date and time'}</span>
        <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
      </button>
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

      {open && createPortal(
        <div
          ref={popoverRef}
          id={`${inputId}-popover`}
          role="dialog"
          aria-label={label || 'Choose date and time'}
          className="fixed z-[120] rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 p-3"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-medium">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </p>
            <button
              type="button"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-[10px] uppercase tracking-wide text-zinc-500 text-center py-1">{day}</div>
            ))}
            {cells.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;
              const active = selected ? sameDay(day, selected) : false;
              const today = sameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setDay(day)}
                  className={cn(
                    'h-8 rounded-lg text-sm transition-colors',
                    active && 'bg-primary-500 text-zinc-950 font-medium',
                    !active && today && 'text-primary-300',
                    !active && !today && 'text-zinc-200 hover:bg-zinc-800'
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
            <select
              aria-label="Hour"
              className="input h-9 px-2 text-sm"
              value={hour12}
              onChange={(event) => setTime(Number(event.target.value), minute, isPm)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                <option key={hour} value={hour}>{pad(hour)}</option>
              ))}
            </select>
            <span className="text-zinc-500">:</span>
            <select
              aria-label="Minute"
              className="input h-9 px-2 text-sm"
              value={minute}
              onChange={(event) => setTime(hour12, Number(event.target.value), isPm)}
            >
              {Array.from({ length: 60 }, (_, i) => i).map((item) => (
                <option key={item} value={item}>{pad(item)}</option>
              ))}
            </select>
            <select
              aria-label="AM or PM"
              className="input h-9 px-2 text-sm"
              value={isPm ? 'pm' : 'am'}
              onChange={(event) => setTime(hour12, minute, event.target.value === 'pm')}
            >
              <option value="am">AM</option>
              <option value="pm">PM</option>
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="text-xs text-zinc-400 hover:text-zinc-100"
              onClick={() => { onChange(''); setOpen(false); }}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-xs text-primary-400 hover:text-primary-300"
              onClick={() => { commit(new Date()); setOpen(false); }}
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
