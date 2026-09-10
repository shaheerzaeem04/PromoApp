import { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { Button } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

const inflight = new Map<string, Promise<string>>();

function cleanToken(raw: string) {
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // already decoded
  }
  return raw.replace(/[\s\u200b-\u200d\ufeff]/g, '');
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const route = useParams();
  const token = cleanToken(params.get('token') || route.token || '');
  const [state, setState] = useState<'idle' | 'working' | 'ok' | 'err' | 'offline'>('idle');
  const [redirect, setRedirect] = useState('/choose-plan');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) {
      setState('err');
      return;
    }
    setState('working');
    inflight.delete(token);
    const promise = authApi.verifyEmail(token).then((response) => response.data.data.redirect || '/choose-plan');
    inflight.set(token, promise);
    let cancelled = false;
    promise.then((next) => {
      if (cancelled) return;
      useAuthStore.getState().updateUser({ emailVerified: true });
      setRedirect(typeof next === 'string' && next.includes('/dashboard') ? '/choose-plan' : next);
      setState('ok');
    }).catch((error) => {
      if (cancelled) return;
      if (useAuthStore.getState().user?.emailVerified) {
        setState('ok');
        return;
      }
      const status = error?.response?.status;
      if (!status || status >= 500) {
        setState('offline');
        return;
      }
      setState('err');
    });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-display font-bold">Email verification</h1>
        {state === 'working' && <p className="text-zinc-400">Checking your link…</p>}
        {state === 'ok' && (
          <>
            <p className="text-emerald-400">Your email is verified. Next, choose a plan to start a 7-day trial.</p>
            <Link to={redirect.startsWith('http') ? '/choose-plan' : redirect} className="btn-primary inline-flex">Continue</Link>
          </>
        )}
        {state === 'offline' && (
          <>
            <p className="text-amber-300">Could not reach the server. Wait a second and try again.</p>
            <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
          </>
        )}
        {state === 'err' && (
          <>
            <p className="text-red-400">This verification link is invalid or expired.</p>
            <p className="text-zinc-500 text-sm">Use the newest email. Older verify links stop working after a new one is sent.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
              <Link to="/check-email" className="btn-secondary inline-flex">Resend email</Link>
            </div>
          </>
        )}
        {state === 'idle' && <Button disabled>Waiting</Button>}
      </div>
    </div>
  );
}
