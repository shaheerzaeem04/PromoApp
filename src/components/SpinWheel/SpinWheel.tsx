import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Gift, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../../utils/cn';
import { Button } from '../ui';

export interface WheelSegment {
  id: string;
  label: string;
  color: string;
  rewardType: string;
}

interface SpinWheelProps {
  segments: WheelSegment[];
  onSpin: () => Promise<{
    success: boolean;
    segment: WheelSegment;
    message: string;
    spinsRemaining: number;
  }>;
  spinsRemaining: number;
  disabled?: boolean;
  size?: number;
  hideControls?: boolean;
}

const THEME_CONFETTI = ['#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#f0fdfa'];

export function SpinWheel({
  segments,
  onSpin,
  spinsRemaining,
  disabled = false,
  size = 320,
  hideControls = false,
}: SpinWheelProps) {
  const reduceMotion = useReducedMotion();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    segment: WheelSegment;
    message: string;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settleTimerRef = useRef<number | undefined>(undefined);

  const segmentAngle = segments.length > 0 ? 360 / segments.length : 0;
  const spinDuration = reduceMotion ? 1.2 : 5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 14;

    ctx.clearRect(0, 0, size, size);

    // Outer bezel glow
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    const rimGlow = ctx.createRadialGradient(centerX, centerY, radius - 4, centerX, centerY, radius + 10);
    rimGlow.addColorStop(0, 'rgba(20, 184, 166, 0)');
    rimGlow.addColorStop(1, 'rgba(20, 184, 166, 0.28)');
    ctx.fillStyle = rimGlow;
    ctx.fill();

    segments.forEach((segment, index) => {
      const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
      const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.12, centerX, centerY, radius);
      gradient.addColorStop(0, adjustColor(segment.color, 36));
      gradient.addColorStop(0.72, segment.color);
      gradient.addColorStop(1, adjustColor(segment.color, -18));
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = 'rgba(9, 9, 11, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((startAngle + endAngle) / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = contrastText(segment.color);
      ctx.font = `600 ${Math.max(11, size / 24)}px Figtree, system-ui, sans-serif`;
      ctx.shadowColor = 'rgba(9, 9, 11, 0.45)';
      ctx.shadowBlur = 3;
      ctx.fillText(truncateLabel(segment.label, size), radius - 22, 4);
      ctx.restore();
    });

    // Inner teal ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Hub
    const hubRadius = Math.max(22, size * 0.09);
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, Math.PI * 2);
    const hub = ctx.createRadialGradient(centerX - 4, centerY - 4, 2, centerX, centerY, hubRadius);
    hub.addColorStop(0, '#5eead4');
    hub.addColorStop(0.45, '#14b8a6');
    hub.addColorStop(1, '#0d9488');
    ctx.fillStyle = hub;
    ctx.fill();
    ctx.strokeStyle = 'rgba(240, 253, 250, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = '#042f2e';
    ctx.fill();
  }, [segments, size, segmentAngle]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  if (!segments.length) {
    return null;
  }

  const handleSpin = async () => {
    if (isSpinning || disabled || spinsRemaining <= 0) return;

    setIsSpinning(true);
    setShowResult(false);

    try {
      const spinResult = await onSpin();
      const segmentIndex = segments.findIndex((s) => s.id === spinResult.segment.id);
      const targetSegmentCenter = segmentIndex * segmentAngle + segmentAngle / 2;
      const spins = reduceMotion ? 2 : 5 + Math.random() * 3;
      const targetRotation = rotation + 360 * spins + (360 - targetSegmentCenter);

      setRotation(targetRotation);

      settleTimerRef.current = window.setTimeout(() => {
        setIsSpinning(false);
        setResult({
          success: spinResult.success,
          segment: spinResult.segment,
          message: spinResult.message,
        });
        setShowResult(true);

        if (spinResult.success && !reduceMotion) {
          confetti({
            particleCount: 90,
            spread: 68,
            origin: { y: 0.62 },
            colors: THEME_CONFETTI,
          });
        }
      }, spinDuration * 1000);
    } catch {
      setIsSpinning(false);
    }
  };

  const canSpin = !isSpinning && !disabled && spinsRemaining > 0;

  return (
    <div className="flex flex-col items-center" data-testid="live-spin-wheel">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow:
              '0 0 0 1px rgba(20, 184, 166, 0.28), 0 0 36px rgba(20, 184, 166, 0.16), inset 0 1px 0 rgba(45, 212, 191, 0.14)',
            background:
              'radial-gradient(120% 80% at 50% -10%, rgba(20, 184, 166, 0.16), transparent 46%)',
          }}
        />

        <motion.div
          className="absolute top-0 left-1/2 z-20"
          style={{ x: '-50%' }}
          animate={
            reduceMotion
              ? { x: '-50%' }
              : isSpinning
                ? { x: '-50%', y: [0, -2, 0] }
                : showResult
                  ? { x: '-50%', y: [0, 3, 0] }
                  : { x: '-50%', y: 0 }
          }
          transition={isSpinning ? { repeat: Infinity, duration: 0.35 } : { duration: 0.35 }}
        >
          <svg
            width="22"
            height="28"
            viewBox="0 0 22 28"
            aria-hidden="true"
            className="block drop-shadow-[0_0_10px_rgba(20,184,166,0.55)]"
          >
            <path d="M11 28L0 0h22L11 28z" fill="#2dd4bf" />
            <path d="M11 22L5 4h12L11 22z" fill="#042f2e" opacity="0.22" />
          </svg>
        </motion.div>

        <motion.div
          animate={{ rotate: rotation }}
          transition={{
            duration: spinDuration,
            ease: reduceMotion ? 'easeOut' : [0.2, 0.8, 0.3, 0.99],
          }}
          className="relative"
          style={{ width: size, height: size }}
        >
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="rounded-full"
            style={{ filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.42))' }}
          />
        </motion.div>

        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'absolute w-2 h-2 rounded-full',
                isSpinning && !reduceMotion && 'animate-pulse-soft'
              )}
              style={{
                backgroundColor: i % 2 === 0 ? '#2dd4bf' : '#99f6e4',
                left: `${50 + 48.2 * Math.cos(((i * 22.5 - 90) * Math.PI) / 180)}%`,
                top: `${50 + 48.2 * Math.sin(((i * 22.5 - 90) * Math.PI) / 180)}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 10px ${i % 2 === 0 ? 'rgba(20,184,166,0.7)' : 'rgba(153,246,228,0.45)'}`,
              }}
            />
          ))}
        </div>
      </div>

      {!hideControls && (
        <div className="mt-6 flex flex-col items-center gap-2.5">
          <Button
            type="button"
            onClick={handleSpin}
            disabled={!canSpin}
            data-testid="spin-button"
          >
            <Sparkles className={cn('w-4 h-4', isSpinning && 'animate-spin')} />
            {isSpinning ? 'Spinning…' : spinsRemaining > 0 ? 'Spin now' : 'No spins left today'}
          </Button>
          <p className="text-sm text-zinc-400">
            <span className="text-primary-300 font-medium">{spinsRemaining}</span>
            {' '}spin{spinsRemaining !== 1 ? 's' : ''} remaining today
          </p>
        </div>
      )}

      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="spin-result"
              className={cn(
                'relative w-full max-w-sm rounded-xl border p-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.55)]',
                'bg-zinc-950',
                result.success
                  ? 'border-primary-500/45'
                  : 'border-zinc-700/80'
              )}
            >
              <button
                type="button"
                onClick={() => setShowResult(false)}
                aria-label="Close result"
                className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-primary-500/10 hover:border-primary-500/25 border border-transparent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div
                className={cn(
                  'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border',
                  result.success
                    ? 'bg-primary-500/15 border-primary-500/30 text-primary-300 shadow-[0_0_22px_rgba(20,184,166,0.22)]'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                )}
              >
                <Gift className="w-8 h-8" />
              </div>

              <h3 className={cn('text-xl font-semibold mb-2', result.success ? 'text-primary-200' : 'text-zinc-200')}>
                {result.success ? 'Congratulations!' : 'Better luck next time'}
              </h3>
              <p className="text-sm text-zinc-400 mb-4">{result.message}</p>

              <div
                className="inline-flex items-center rounded-xl border px-3.5 py-1.5 text-sm font-medium"
                style={{
                  backgroundColor: `${result.segment.color}22`,
                  borderColor: `${result.segment.color}55`,
                  color: result.segment.color,
                }}
              >
                {result.segment.label}
              </div>

              <Button type="button" className="mt-6 w-full" onClick={() => setShowResult(false)}>
                Continue
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  if (hex.length < 6) return color;
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(4, 6), 16) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function contrastText(color: string): string {
  const hex = color.replace('#', '');
  if (hex.length < 6) return '#f0fdfa';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.62 ? '#042f2e' : '#f0fdfa';
}

function truncateLabel(label: string, size: number): string {
  const max = size < 220 ? 10 : 16;
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}
