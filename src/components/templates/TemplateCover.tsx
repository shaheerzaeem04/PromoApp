import { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { templateIcon, type CatalogTemplate } from './templateMeta';
import {
  coverPalette,
  resolveTemplateCoverSrc,
  withCoverCache,
} from './templateCovers';

interface TemplateCoverProps {
  template: CatalogTemplate;
  className?: string;
  compact?: boolean;
}

export function TemplateCover({ template, className, compact = false }: TemplateCoverProps) {
  const [reloadToken, setReloadToken] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const autoRetried = useRef(false);
  const src = withCoverCache(resolveTemplateCoverSrc(template), reloadToken);
  const palette = coverPalette(template);
  const Icon = templateIcon(template);

  const reload = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    autoRetried.current = false;
    setStatus('loading');
    setReloadToken((token) => token + 1);
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
    >
      {status !== 'ready' && (
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      )}

      {status === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span
            className={cn(
              'flex items-center justify-center rounded-2xl bg-black/20 ring-1 ring-white/15',
              compact ? 'h-10 w-10' : 'h-14 w-14'
            )}
          >
            <Icon className={cn('text-white/90', compact ? 'h-5 w-5' : 'h-7 w-7')} />
          </span>
          {!compact && (
            <span
              role="button"
              tabIndex={0}
              onClick={reload}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') reload(event);
              }}
              className="relative z-[3] inline-flex items-center gap-1 rounded-md bg-black/35 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 ring-1 ring-white/15 hover:bg-black/50"
            >
              <RefreshCw className="h-3 w-3" />
              Reload
            </span>
          )}
        </div>
      ) : (
        <img
          key={src}
          src={src}
          alt=""
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
          sizes={compact ? '(min-width:640px) 50vw, 100vw' : '(min-width:1280px) 25vw, (min-width:640px) 50vw, 100vw'}
          onLoad={() => setStatus('ready')}
          onError={() => {
            if (!autoRetried.current) {
              autoRetried.current = true;
              setReloadToken((token) => token + 1);
              return;
            }
            setStatus('error');
          }}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition duration-500 ease-out',
            'group-hover:scale-[1.05]',
            status === 'ready' ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-white/5" />
    </div>
  );
}
