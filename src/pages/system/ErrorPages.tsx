import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-sm text-zinc-500">404</p>
        <h1 className="text-3xl font-display font-bold mt-2">Page not found</h1>
        <p className="text-zinc-400 mt-3">That route does not exist.</p>
        <Link to="/" className="btn-primary inline-flex mt-6">Back home</Link>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-sm text-zinc-500">403</p>
        <h1 className="text-3xl font-display font-bold mt-2">You don’t have access</h1>
        <p className="text-zinc-400 mt-3">This page is limited to a different workspace role.</p>
        <Link to="/dashboard" className="btn-primary inline-flex mt-6">Dashboard</Link>
      </div>
    </div>
  );
}

export function UnexpectedErrorPage({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-sm text-zinc-500">500</p>
        <h1 className="text-3xl font-display font-bold mt-2">Something went wrong</h1>
        <p className="text-zinc-400 mt-3">The page hit an unexpected error. Retry, or return to the dashboard.</p>
        <div className="flex justify-center gap-3 mt-6">
          {onRetry && <button type="button" className="btn-secondary" onClick={onRetry}>Retry</button>}
          <Link to="/dashboard" className="btn-primary">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
