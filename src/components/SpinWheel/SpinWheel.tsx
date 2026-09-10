import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../../utils/cn';

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

export function SpinWheel({
  segments,
  onSpin,
  spinsRemaining,
  disabled = false,
  size = 320,
  hideControls = false,
}: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    segment: WheelSegment;
    message: string;
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const segmentAngle = segments.length > 0 ? 360 / segments.length : 0;

  // Draw the wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    segments.forEach((segment, index) => {
      const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
      const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Gradient fill
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, adjustColor(segment.color, 30));
      gradient.addColorStop(1, segment.color);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Segment border
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((startAngle + endAngle) / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(12, size / 25)}px Inter, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(segment.label, radius - 20, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
    centerGradient.addColorStop(0, '#8b5cf6');
    centerGradient.addColorStop(1, '#6366f1');
    ctx.fillStyle = centerGradient;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [segments, size, segmentAngle]);

  if (!segments.length) {
    return null;
  }

  const handleSpin = async () => {
    if (isSpinning || disabled || spinsRemaining <= 0) return;

    setIsSpinning(true);
    setShowResult(false);

    try {
      const result = await onSpin();

      // Find the segment index
      const segmentIndex = segments.findIndex(s => s.id === result.segment.id);
      
      // Calculate target rotation
      // We need to land on the segment, accounting for the pointer at top
      const targetSegmentCenter = segmentIndex * segmentAngle + segmentAngle / 2;
      const spins = 5 + Math.random() * 3; // 5-8 full spins
      const targetRotation = rotation + (360 * spins) + (360 - targetSegmentCenter);

      setRotation(targetRotation);

      // Wait for animation to complete
      setTimeout(() => {
        setIsSpinning(false);
        setResult({
          success: result.success,
          segment: result.segment,
          message: result.message,
        });
        setShowResult(true);

        // Confetti for wins!
        if (result.success) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#8b5cf6', '#a855f7', '#22c55e', '#f59e0b'],
          });
        }
      }, 5000);
    } catch (error) {
      setIsSpinning(false);
      // Error handling done by parent
    }
  };

  return (
    <div className="flex flex-col items-center" data-testid="live-spin-wheel">
      {/* Wheel Container */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <div 
            className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-white"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          />
        </div>

        {/* Rotating Wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{
            duration: 5,
            ease: [0.2, 0.8, 0.3, 0.99], // Custom easing for realistic spin
          }}
          className="relative"
          style={{ width: size, height: size }}
        >
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="rounded-full"
            style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}
          />
        </motion.div>

        {/* Decorative lights around wheel */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'absolute w-3 h-3 rounded-full',
                isSpinning ? 'animate-pulse' : ''
              )}
              style={{
                backgroundColor: i % 2 === 0 ? '#fbbf24' : '#ffffff',
                left: `${50 + 48 * Math.cos((i * 22.5 - 90) * Math.PI / 180)}%`,
                top: `${50 + 48 * Math.sin((i * 22.5 - 90) * Math.PI / 180)}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 10px ${i % 2 === 0 ? '#fbbf24' : '#ffffff'}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Spin Button */}
      {!hideControls && (
        <>
      <button
        onClick={handleSpin}
        disabled={isSpinning || disabled || spinsRemaining <= 0}
        data-testid="spin-button"
        className={cn(
          'mt-5 px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors',
          'flex items-center gap-2',
          isSpinning || disabled || spinsRemaining <= 0
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-primary-500 text-zinc-950 hover:bg-primary-400'
        )}
      >
        <Sparkles className={cn('w-4 h-4', isSpinning && 'animate-spin')} />
        {isSpinning ? 'Spinning…' : spinsRemaining > 0 ? 'Spin now' : 'No spins left today'}
      </button>

      {/* Spins remaining */}
      <p className="mt-3 text-sm text-zinc-400">
        {spinsRemaining} spin{spinsRemaining !== 1 ? 's' : ''} remaining today
      </p>
        </>
      )}

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="spin-result"
              className={cn(
                'relative max-w-sm w-full p-8 rounded-2xl text-center',
                result.success
                  ? 'bg-gradient-to-br from-emerald-900/90 to-emerald-950/90 border border-emerald-500/30'
                  : 'bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 border border-zinc-700'
              )}
            >
              <button
                onClick={() => setShowResult(false)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div
                className={cn(
                  'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
                  result.success ? 'bg-emerald-500/20' : 'bg-zinc-700'
                )}
              >
                <Gift className={cn(
                  'w-10 h-10',
                  result.success ? 'text-emerald-400' : 'text-zinc-400'
                )} />
              </div>

              <h3 className={cn(
                'text-2xl font-bold mb-2',
                result.success ? 'text-emerald-400' : 'text-zinc-300'
              )}>
                {result.success ? 'Congratulations!' : 'Better luck next time!'}
              </h3>

              <p className="text-lg text-zinc-300 mb-2">{result.message}</p>

              <div
                className="mt-4 px-4 py-2 rounded-lg inline-block"
                style={{ backgroundColor: result.segment.color + '30' }}
              >
                <span style={{ color: result.segment.color }} className="font-semibold">
                  {result.segment.label}
                </span>
              </div>

              <button
                onClick={() => setShowResult(false)}
                className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

