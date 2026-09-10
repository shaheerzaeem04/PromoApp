export function SystemState({
  kind,
  title,
  body,
  action,
}: {
  kind: 'loading' | 'empty' | 'error' | 'success' | 'permission' | 'limit' | 'billing' | 'offline';
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  const color = {
    loading: 'text-zinc-400',
    empty: 'text-zinc-400',
    error: 'text-red-400',
    success: 'text-emerald-400',
    permission: 'text-amber-400',
    limit: 'text-amber-400',
    billing: 'text-amber-400',
    offline: 'text-zinc-400',
  }[kind];
  return (
    <div className="card p-6" role={kind === 'error' ? 'alert' : 'status'}>
      <h2 className={`font-semibold ${color}`}>{title}</h2>
      {body && <p className="text-sm text-zinc-400 mt-2">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
