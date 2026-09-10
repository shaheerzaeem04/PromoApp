import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card } from '../../components/ui';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export function CheckEmailPage() {
  const user = useAuthStore((s) => s.user);
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (!user?.email) return;
    setSending(true);
    try {
      await authApi.resendVerification(user.email);
      toast.success('If verification is still needed, we sent a new email');
    } catch {
      toast.error('Could not resend verification');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-8 max-w-lg mx-auto text-center space-y-4" data-testid="check-email">
      <h1 className="text-2xl font-display font-bold">Check your email</h1>
      <p className="text-zinc-400">
        Verify {user?.email || 'your email'} to continue. After verification you will choose a plan and start a 7-day trial.
      </p>
      <Button onClick={resend} loading={sending}>Resend verification</Button>
      <p className="text-sm text-zinc-500">
        <Link to="/settings" className="text-primary-400">Account settings</Link>
      </p>
    </Card>
  );
}
