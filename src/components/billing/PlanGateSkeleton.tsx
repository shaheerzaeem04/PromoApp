/** Content-area skeleton used while billing/plan gate resolves. Sidebar stays mounted. */
export function PlanGateSkeleton({
  testId = 'billing-skeleton',
  onRetry,
}: {
  testId?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="space-y-6 animate-pulse" data-testid={testId} aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <div className="h-8 w-48 rounded-lg bg-zinc-800/80" />
        <div className="h-4 w-80 max-w-full rounded-lg bg-zinc-800/50" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-zinc-800/80 bg-zinc-900 p-5 space-y-4">
            <div className="h-4 w-24 rounded bg-zinc-800/80" />
            <div className="h-8 w-16 rounded bg-zinc-800/60" />
            <div className="h-2 w-full rounded-full bg-zinc-800/40" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900 p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-zinc-800/80" />
        <div className="h-3 w-full rounded bg-zinc-800/40" />
        <div className="h-3 w-5/6 rounded bg-zinc-800/40" />
        <div className="h-3 w-2/3 rounded bg-zinc-800/40" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-24 rounded-xl bg-zinc-800/30" />
          <div className="h-24 rounded-xl bg-zinc-800/30" />
        </div>
      </div>
      {onRetry && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="text-sm text-zinc-400 hover:text-zinc-200 underline underline-offset-4 transition-colors"
          >
            Still loading? Retry
          </button>
        </div>
      )}
    </div>
  );
}
