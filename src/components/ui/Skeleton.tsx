import { cn } from '../../utils/cn';

type SkeletonProps = {
  className?: string;
  /** Optional fixed width (e.g. "40%", 120). Prefer Tailwind width classes when possible. */
  width?: string | number;
  /** Optional fixed height (e.g. 16, "1rem"). Prefer Tailwind height classes when possible. */
  height?: string | number;
};

/** Single animated placeholder bar. Size via className or width/height. */
export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-zinc-800/80', className)}
      style={{
        width: width === undefined ? undefined : typeof width === 'number' ? `${width}px` : width,
        height: height === undefined ? undefined : typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

type SkeletonLinesProps = {
  lines?: number;
  /** Per-line width overrides; cycles if shorter than lines. */
  widths?: Array<string | number>;
  className?: string;
  lineClassName?: string;
};

/** Dynamically render N text-line placeholders. */
export function SkeletonLines({
  lines = 3,
  widths = ['100%', '75%', '55%'],
  className,
  lineClassName,
}: SkeletonLinesProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4', lineClassName)}
          width={widths[index % widths.length]}
        />
      ))}
    </div>
  );
}
