import { useState } from 'react';
import toast from 'react-hot-toast';
import { publicApi } from '../../services/api';
import { apiErrorMessage } from '../../pages/campaigns/detail/constants';

interface SecretCodeFormProps {
  slug: string;
  participantId: string;
  token: string;
  onRedeemed: (points: number, actionId?: string) => void;
  compact?: boolean;
}

export function SecretCodeForm({ slug, participantId, token, onRedeemed, compact = false }: SecretCodeFormProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    try {
      const response = await publicApi.validateSecretCode(slug, participantId, code.trim(), token);
      const points = response.data.data.points || 0;
      onRedeemed(points, response.data.data.actionId);
      setCode('');
      toast.success(`Code accepted! +${points} points`);
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Invalid or expired code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className={compact ? 'space-y-2' : 'p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3'}>
      {!compact && <p className="font-medium">Have a secret code?</p>}
      <div className={compact ? 'flex gap-2' : 'flex gap-2'}>
        <input
          data-testid="secret-code-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        />
        <button
          type="submit"
          data-testid="secret-code-redeem"
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Redeem'}
        </button>
      </div>
    </form>
  );
}
