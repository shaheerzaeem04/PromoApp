import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Spinner, Tag } from '../ui';
import { GiveawayExperience, PreviewEntryForm, PreviewReturningState } from '../../campaign/GiveawayExperience';
import { templateApi } from '../../services/api';
import { apiErrorMessage } from '../../pages/campaigns/detail/constants';
import { cn } from '../../utils/cn';
import { templateGradient, templateIcon, type CatalogTemplate } from './templateMeta';

interface TemplatePreviewModalProps {
  template: CatalogTemplate;
  onClose: () => void;
}

type DeviceKey = 'desktop' | 'tablet' | 'mobile';
type ScreenKey = 'page' | 'popup' | 'success' | 'returning';

const DEVICES: Record<DeviceKey, { width: number; height: number; label: string; icon: typeof Monitor }> = {
  desktop: { width: 1280, height: 800, label: 'Desktop', icon: Monitor },
  tablet: { width: 768, height: 1024, label: 'Tablet', icon: Tablet },
  mobile: { width: 390, height: 844, label: 'Mobile', icon: Smartphone },
};

const SCREENS: { key: ScreenKey; label: string }[] = [
  { key: 'page', label: 'Giveaway' },
  { key: 'popup', label: 'Popup' },
  { key: 'success', label: 'Entered' },
  { key: 'returning', label: 'Returning' },
];

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.5;
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function SegmentedGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-xl border border-primary-500/25 bg-zinc-900 p-1"
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  );
}

function SegmentedButton({
  active,
  onClick,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
        active
          ? 'border border-primary-500/35 bg-primary-500/20 text-primary-200'
          : 'border border-transparent text-zinc-400 hover:text-zinc-100'
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function TemplatePreviewModal({ template, onClose }: TemplatePreviewModalProps) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 640;
  const [device, setDevice] = useState<DeviceKey>(isNarrow ? 'mobile' : 'desktop');
  const [screen, setScreen] = useState<ScreenKey>('page');
  const [manualScale, setManualScale] = useState<number | null>(null);
  const [fitScale, setFitScale] = useState(1);

  const key = template.slug || template.id;
  const Icon = templateIcon(template);
  const renderable = !template.isBlank && !template.comingSoon;
  const frame = DEVICES[device];
  const scale = manualScale ?? fitScale;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['template-preview', key],
    queryFn: async () => {
      const res = await templateApi.preview(key);
      return res.data.data;
    },
    enabled: renderable,
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const res = await templateApi.use(key, { timezone });
      return res.data.data;
    },
    onSuccess: (campaign) => {
      toast.success('Campaign created from template');
      onClose();
      navigate(`/campaigns/${campaign.id}/edit`);
    },
    onError: (error: any) => {
      toast.error(apiErrorMessage(error, 'Could not use template'));
    },
  });

  /** Fit the device frame to the available stage so the preview never opens with dead space. */
  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const pad = window.innerWidth >= 640 ? 48 : 24;
    const availableWidth = Math.max(160, viewport.clientWidth - pad);
    const availableHeight = Math.max(160, viewport.clientHeight - pad);
    const next = Math.min(1, availableWidth / frame.width, availableHeight / frame.height);
    setFitScale(Number(next.toFixed(3)));
  }, [frame.height, frame.width]);

  useLayoutEffect(() => {
    measure();
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    setManualScale(null);
  }, [device]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const stepZoom = (delta: number) => {
    setManualScale((current) => {
      const base = current ?? fitScale;
      return Number(Math.min(MAX_SCALE, Math.max(MIN_SCALE, base + delta)).toFixed(2));
    });
  };

  const handleUse = () => {
    if (template.isBlank) {
      onClose();
      navigate('/campaigns/new');
      return;
    }
    if (template.comingSoon) {
      toast('AI giveaway generation is coming soon');
      return;
    }
    createCampaign.mutate();
  };

  const overlayMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : {
        initial: { opacity: 0, scale: 0.995 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.995 },
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
      };

  // 'success' is rendered by GiveawayExperience itself from previewState.
  const previewMain = (campaign: any) =>
    screen === 'returning' ? <PreviewReturningState campaign={campaign} /> : <PreviewEntryForm campaign={campaign} />;

  const modal = (
    <motion.div
      className="fixed inset-0 z-[80] flex h-[100dvh] max-h-[100dvh] w-full flex-col overscroll-none"
      {...overlayMotion}
      data-testid="template-preview-modal"
    >
      <button
        type="button"
        aria-label="Close preview"
        tabIndex={-1}
        onClick={onClose}
        className="preview-glass-overlay"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${template.name} template preview`}
        className="preview-glass-panel relative z-[1] flex h-full min-h-0 w-full flex-col overflow-hidden"
        {...panelMotion}
      >
        <header className="preview-glass-chrome flex shrink-0 items-center gap-3 border-b border-zinc-800/60 px-3 py-2.5 sm:px-4">
          <Button ref={closeRef} variant="ghost" size="sm" onClick={onClose} data-testid="template-preview-close">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Close</span>
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              className={cn(
                'hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br sm:flex',
                templateGradient(template)
              )}
              aria-hidden
            >
              <Icon className="h-4 w-4 text-white/90" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-zinc-50">{template.name}</h2>
                {template.badge && (
                  <Tag size="sm" className="hidden shrink-0 md:inline-flex" decorative>
                    {template.badge}
                  </Tag>
                )}
              </span>
              <p className="truncate text-xs text-zinc-500">Preview only — nothing is saved yet</p>
            </span>
          </div>

          <Button
            size="sm"
            onClick={handleUse}
            loading={createCampaign.isPending}
            disabled={template.comingSoon}
            data-testid="template-preview-use"
          >
            <span className="sm:hidden">Use</span>
            <span className="hidden sm:inline">Use this template</span>
          </Button>
        </header>

        {renderable && (
          <div className="preview-glass-chrome flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-zinc-800/60 px-3 py-2">
            <SegmentedGroup label="Preview screen">
              {SCREENS.map((item) => (
                <SegmentedButton
                  key={item.key}
                  active={screen === item.key}
                  onClick={() => setScreen(item.key)}
                  data-testid={`template-preview-screen-${item.key}`}
                >
                  {item.label}
                </SegmentedButton>
              ))}
            </SegmentedGroup>

            <SegmentedGroup label="Preview device">
              {(Object.keys(DEVICES) as DeviceKey[]).map((item) => {
                const DeviceIcon = DEVICES[item].icon;
                return (
                  <SegmentedButton
                    key={item}
                    active={device === item}
                    onClick={() => setDevice(item)}
                    aria-label={DEVICES[item].label}
                    data-testid={`template-preview-device-${item}`}
                  >
                    <DeviceIcon className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{DEVICES[item].label}</span>
                  </SegmentedButton>
                );
              })}
            </SegmentedGroup>

            <SegmentedGroup label="Zoom">
              <SegmentedButton
                active={false}
                onClick={() => stepZoom(-0.1)}
                aria-label="Zoom out"
                data-testid="template-preview-zoom-out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </SegmentedButton>
              <span className="w-11 text-center text-xs tabular-nums text-zinc-400">
                {Math.round(scale * 100)}%
              </span>
              <SegmentedButton
                active={false}
                onClick={() => stepZoom(0.1)}
                aria-label="Zoom in"
                data-testid="template-preview-zoom-in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </SegmentedButton>
              <SegmentedButton
                active={manualScale === null}
                onClick={() => setManualScale(null)}
                aria-label="Fit to view"
                data-testid="template-preview-fit"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fit</span>
              </SegmentedButton>
            </SegmentedGroup>
          </div>
        )}

        <div
          ref={viewportRef}
          className="flex min-h-0 flex-1 justify-center overflow-auto p-3 sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          {template.comingSoon ? (
            <div className="m-auto max-w-md rounded-2xl border border-violet-500/25 bg-zinc-900/70 p-8 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20">
                <Sparkles className="h-6 w-6" />
              </span>
              <p className="text-lg font-semibold text-zinc-50">Coming soon</p>
              <p className="mt-2 text-sm text-zinc-400">
                {template.longDescription ||
                  'AI giveaway generation is not available yet. Start from scratch or pick another template.'}
              </p>
            </div>
          ) : isLoading ? (
            <div className="m-auto flex flex-col items-center gap-3 text-sm text-zinc-500">
              <Spinner />
              Loading preview
            </div>
          ) : isError || !data ? (
            <div className="m-auto max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
                <AlertCircle className="h-6 w-6" />
              </span>
              <p className="font-medium text-zinc-100">Could not load preview</p>
              <p className="mt-1 text-sm text-zinc-500">The template preview failed to load.</p>
              <Button className="mt-5" size="sm" variant="secondary" onClick={() => refetch()} loading={isFetching}>
                Try again
              </Button>
            </div>
          ) : (
            <div
              className="relative shrink-0"
              style={{ width: frame.width * scale, height: frame.height * scale }}
            >
              <div
                className="absolute left-0 top-0 flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50"
                style={{
                  width: frame.width,
                  height: frame.height,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
                data-testid="template-preview-frame"
                data-preview-device={device}
                data-preview-screen={screen}
              >
                <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
                  <span className="flex gap-1.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  </span>
                  <span className="flex-1 truncate rounded-md bg-zinc-900 px-2.5 py-1 text-center text-[11px] text-zinc-500">
                    Demo User · Preview Participant
                  </span>
                  <span className="shrink-0 text-[11px] font-medium tabular-nums text-primary-300">
                    {data.previewParticipant?.points ?? 0} pts
                  </span>
                </div>

                <div className="preview-stage min-h-0 flex-1 overflow-auto">
                  <GiveawayExperience
                    campaign={data}
                    mode="preview"
                    previewState={screen}
                    displayModeOverride={screen === 'popup' ? 'POPUP' : data.displayMode}
                    main={previewMain(data)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {createCampaign.isPending && (
          <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-zinc-950/30 backdrop-blur-sm">
            <span className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-sm text-zinc-200">
              <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
              Creating your campaign
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  return createPortal(modal, document.body);
}
