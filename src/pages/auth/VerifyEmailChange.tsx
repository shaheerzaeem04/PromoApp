import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authApi } from '../../services/api';
import { Button } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

function cleanToken(raw: string) {
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // already decoded
  }
  return raw.replace(/[\s\u200b-\u200d\ufeff]/g, '');
}

export function VerifyEmailChangePage() {
  const route = useParams();
  const token = cleanToken(route.token || '');
  const [state, setState] = useState<'idle' | 'working' | 'ok' | 'err'>('idle');
  const [email, setEmail] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) {
      setState('err');
      return;
    }
    setState('working');
    let cancelled = false;
    authApi
      .verifyEmailChange(token)
      .then((response) => {
        if (cancelled) return;
        setEmail(response.data.data?.email || '');
        useAuthStore.getState().logout();
        useWorkspaceStore.getState().clearWorkspace();
        setState('ok');
      })
      .catch(() => {
        if (!cancelled) setState('err');
      });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-display font-bold">Confirm new email</h1>
        {state === 'working' && <p className="text-zinc-400">Checking your link…</p>}
        {state === 'ok' && (
          <>
            <p className="text-emerald-400">
              Your login email is now {email || 'updated'}. Sign in with the new address.
            </p>
            <Link to="/login" className="btn-primary inline-flex">Sign in</Link>
          </>
        )}
        {state === 'err' && (
          <>
            <p className="text-red-400">This confirmation link is invalid or expired.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
              <Link to="/settings/profile" className="btn-secondary inline-flex">Account settings</Link>
            </div>
          </>
        )}
        {state === 'idle' && <Button disabled>Waiting</Button>}
      </div>
    </div>
  );
}
