import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card, Button, PageSpinner } from '../../components/ui';
import { workspaceApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

export function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [error] = useState<string | null>(null);

  const preview = useQuery({
    queryKey: ['invite', token],
    queryFn: () => workspaceApi.previewInvite(token!).then((r) => r.data.data),
    enabled: Boolean(token),
    retry: false,
  });

  const accept = useMutation({
    mutationFn: () => workspaceApi.acceptInvite(token!),
    onSuccess: (response) => {
      toast.success('You joined the workspace');
      const workspaceId = response.data.data.workspaceId;
      if (workspaceId) {
        useWorkspaceStore.getState().setActiveWorkspaceId(workspaceId);
      }
      navigate('/dashboard');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Invitation is invalid or expired');
    },
  });

  if (preview.isLoading) return <PageSpinner />;

  if (preview.isError || !preview.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="p-8 max-w-md text-center space-y-3">
          <h1 className="text-2xl font-display font-bold">Invitation unavailable</h1>
          <p className="text-zinc-400">This invite is invalid or has expired.</p>
          <Link to="/login" className="text-primary-400">Go to login</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="p-8 max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-display font-bold">Join {preview.data.workspaceName}</h1>
        <p className="text-zinc-400">You were invited as {String(preview.data.role).toLowerCase()}.</p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {isAuthenticated ? (
          <Button onClick={() => accept.mutate()} loading={accept.isPending} data-testid="accept-invite">Accept invitation</Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">Log in or create an account with the invited email to continue.</p>
            <div className="flex justify-center gap-3">
              <Link to={`/login?next=/invite/${token}`} className="text-primary-400">Log in</Link>
              <Link to={`/register?next=/invite/${token}`} className="text-primary-400">Register</Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
