import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Input, Modal, Badge, Checkbox } from '../../components/ui';
import { SettingsSection } from './SettingsSection';
import { planLimitMessage, workspaceApi } from '../../services/api';

const FRONTEND_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

export function SettingsGeneralPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['workspace-current'],
    queryFn: () => workspaceApi.getCurrent().then((r) => r.data.data),
  });
  const domains = useQuery({
    queryKey: ['workspace-domains'],
    queryFn: () => workspaceApi.listDomains().then((r) => r.data.data),
  });

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ackDelete, setAckDelete] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data?.name) setName(data.name);
    if (data?.slug) setSlug(data.slug);
    if (data?.logoUrl) setLogoPreview(`/api/workspaces/current/logo?t=${Date.now()}`);
    else setLogoPreview(null);
  }, [data?.name, data?.slug, data?.logoUrl]);

  const dirty =
    Boolean(data) && (name.trim() !== data.name || slug.trim() !== data.slug);

  const save = useMutation({
    mutationFn: () => workspaceApi.update({ name: name.trim(), slug: slug.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-current'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace updated');
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Could not update workspace'),
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) => workspaceApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-current'] });
      toast.success('Logo updated');
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Could not upload logo'),
  });

  const removeLogo = useMutation({
    mutationFn: () => workspaceApi.removeLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-current'] });
      setLogoPreview(null);
      toast.success('Logo removed');
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Could not remove logo'),
  });

  const deleteWorkspace = useMutation({
    mutationFn: () => workspaceApi.deleteWorkspace(confirmName),
    onSuccess: (response) => {
      toast.success(
        `Workspace scheduled for deletion on ${new Date(response.data.data.deletionScheduledAt).toLocaleDateString()}`
      );
      setShowDeleteModal(false);
    },
    onError: (error: any) => toast.error(error?.response?.data?.error?.message || 'Could not delete workspace'),
  });

  const onFile = (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) {
      toast.error('Upload a JPEG, PNG, GIF, or WebP image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be 2MB or smaller');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
    uploadLogo.mutate(file);
  };

  if (isLoading || !data) {
    return <p className="text-sm text-zinc-400">Loading workspace…</p>;
  }

  const canUpdate = Boolean(data.permissions?.update);
  const isOwner = data.role === 'OWNER';

  return (
    <div>
      <SettingsSection
        title="Brand / workspace name"
        description="This is the public name of your workspace. It appears in invitations and billing emails."
      >
        <Input
          label="Name"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          disabled={!canUpdate}
          error={name.length > 80 ? 'Max 80 characters' : undefined}
        />
        {canUpdate && (
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!dirty || !name.trim()}>
            Save Changes
          </Button>
        )}
      </SettingsSection>

      <SettingsSection
        title="Workspace slug"
        description={
          <>
            Lowercase letters, numbers, and hyphens only. Used in workspace URLs such as{' '}
            <span className="font-mono text-zinc-300">
              {FRONTEND_ORIGIN}/brand/{slug || 'your-slug'}
            </span>
            . Campaign public links continue to use campaign slugs.
          </>
        }
      >
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          disabled={!canUpdate}
        />
        {canUpdate && (
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!dirty || !slug.trim()}>
            Save slug
          </Button>
        )}
      </SettingsSection>

      <SettingsSection title="Logo" description="Recommended ~200×200. Max 2MB. JPEG, PNG, GIF, or WebP.">
        {logoPreview && (
          <img src={logoPreview} alt="Workspace logo" className="w-24 h-24 rounded-xl object-cover border border-zinc-800" />
        )}
        {canUpdate && (
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploadLogo.isPending}>
              Browse
            </Button>
            {data.logoUrl && (
              <Button type="button" variant="ghost" onClick={() => removeLogo.mutate()} loading={removeLogo.isPending}>
                Remove logo
              </Button>
            )}
          </div>
        )}
        <div
          className="settings-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!canUpdate) return;
            onFile(e.dataTransfer.files?.[0]);
          }}
        >
          Drag and drop an image here
        </div>
      </SettingsSection>

      <SettingsSection
        title="Custom domains"
        description="Domains are verified per campaign. Status below is read from live CustomDomain records — never faked."
      >
        {(domains.data || []).length === 0 ? (
          <p className="text-sm text-zinc-500">No custom domains yet. Add one from a campaign’s Embed tab.</p>
        ) : (
          <ul>
            {(domains.data || []).map((row: any) => (
              <li key={row.id} className="settings-row">
                <div>
                  <p className="font-medium">{row.hostname}</p>
                  <p className="text-sm text-zinc-500">{row.campaignTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={row.status === 'VERIFIED' ? 'success' : row.status === 'FAILED' ? 'danger' : 'warning'}>
                    {row.status}
                  </Badge>
                  <Link to={row.managePath} className="text-primary-400 text-sm">
                    Manage
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>

      <div id="danger">
        <SettingsSection
          title="Delete workspace"
          danger
          description={
            isOwner
              ? 'Permanent soft-delete after confirmation. Campaigns, participants, API keys, domains, and integrations are disabled immediately and purged after the retention window. Active Stripe subscriptions cancel at period end.'
              : 'Only the owner can delete this workspace.'
          }
        >
          {isOwner ? (
            <>
              <Checkbox isSelected={ackDelete} onChange={setAckDelete}>
                I understand that this action is irreversible
              </Checkbox>
              <Button variant="danger" disabled={!ackDelete} onClick={() => setShowDeleteModal(true)}>
                Delete workspace
              </Button>
            </>
          ) : null}
        </SettingsSection>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm workspace deletion"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteWorkspace.isPending}
              disabled={confirmName !== data.name}
              onClick={() => deleteWorkspace.mutate()}
            >
              Schedule deletion
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Type the workspace name <strong className="text-zinc-200 font-medium">{data.name}</strong> to confirm.
          </p>
          <Input label="Workspace name" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}

export function SettingsTeamPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['workspace-members'], queryFn: () => workspaceApi.members().then((r) => r.data.data) });
  const current = useQuery({ queryKey: ['workspace-current'], queryFn: () => workspaceApi.getCurrent().then((r) => r.data.data) });
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');

  const invite = useMutation({
    mutationFn: () => workspaceApi.invite(email, role),
    onSuccess: async (response) => {
      toast.success('Invitation sent');
      const url = response.data?.data?.inviteUrl;
      if (url) {
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Invite link copied');
        } catch {
          /* ignore */
        }
      }
      setEmail('');
      setShowInvite(false);
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
    },
    onError: (error: any) => toast.error(planLimitMessage(error) || 'Could not send invite'),
  });

  const canInvite = current.data?.permissions?.invite;
  const canManage = current.data?.permissions?.manageMembers;

  const rows = useMemo(() => {
    if (!data) return [];
    const members = (data.members || []).map((m: any) => ({
      key: `m-${m.id}`,
      kind: 'member' as const,
      name: m.name,
      email: m.email,
      role: m.role,
      status: 'Active',
      expires: null as string | null,
      invitationId: null as string | null,
      memberId: m.id as string,
    }));
    const invites = (data.invitations || []).map((inv: any) => {
      const expired = new Date(inv.expiresAt) < new Date();
      return {
        key: `i-${inv.id}`,
        kind: 'invite' as const,
        name: '—',
        email: inv.email,
        role: inv.role,
        status: expired ? 'Expired' : inv.status === 'REVOKED' ? 'Revoked' : 'Invited',
        expires: inv.expiresAt as string,
        invitationId: inv.id as string,
        memberId: null as string | null,
      };
    });
    return [...members, ...invites];  
  }, [data]);

  if (!data) return <p className="text-sm text-zinc-400">Loading team…</p>;

  return (
    <div>
      <SettingsSection
        title="Team Members"
        description={`${data.seats.used} / ${data.seats.limit ?? '∞'} seats used (members + pending invites)`}
        actions={
          canInvite ? (
            <Button onClick={() => setShowInvite(true)} data-testid="invite-member">
              Invite Member
            </Button>
          ) : undefined
        }
      >
        {data.seats.limit && data.seats.used >= data.seats.limit && (
          <p className="text-amber-400 text-sm">Seat limit reached. Upgrade or purchase seats to invite more people.</p>
        )}
        <div className="overflow-x-auto">
          <table className="ui-table ui-table--page table-auto w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Share Link</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>
                    {canManage && row.kind === 'member' && row.role !== 'OWNER' ? (
                      <select
                        value={row.role}
                        onChange={async (e) => {
                          try {
                            await workspaceApi.updateMember(row.memberId!, e.target.value as 'ADMIN' | 'MEMBER');
                            queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
                          } catch (error: any) {
                            toast.error(planLimitMessage(error) || 'Could not change role');
                          }
                        }}
                        className="input h-9 py-1 w-auto min-w-[7.5rem]"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <span className="uppercase text-xs tracking-wide text-zinc-400">{row.role}</span>
                    )}
                  </td>
                  <td>
                    <Badge variant={row.status === 'Active' ? 'success' : row.status === 'Invited' ? 'warning' : 'danger'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="text-zinc-500">
                    {row.expires ? new Date(row.expires).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    {row.kind === 'invite' && row.status === 'Invited' && canInvite ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            const response = await workspaceApi.shareInviteLink(row.invitationId!);
                            await navigator.clipboard.writeText(response.data.data.inviteUrl);
                            toast.success('Invite link copied');
                          } catch (error: any) {
                            toast.error(planLimitMessage(error) || 'Could not create share link');
                          }
                        }}
                      >
                        Copy link
                      </Button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {row.kind === 'member' && canManage && row.role !== 'OWNER' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={async () => {
                          if (!window.confirm(`Remove ${row.email} from this workspace?`)) return;
                          try {
                            await workspaceApi.removeMember(row.memberId!);
                            queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
                          } catch (error: any) {
                            toast.error(planLimitMessage(error) || 'Could not remove member');
                          }
                        }}
                      >
                        Remove
                      </Button>
                    )}
                    {row.kind === 'invite' && canInvite && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={async () => {
                          await workspaceApi.revokeInvite(row.invitationId!);
                          queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsSection>

      <Modal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite Member"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={() => invite.mutate()} loading={invite.isPending} data-testid="invite-submit">
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <p className="text-sm text-zinc-400 leading-relaxed">
            They’ll receive an email with a join link. Pending invites count toward your seat limit.
          </p>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="invite-email" />
          <div>
            <label className="label">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'MEMBER' | 'ADMIN')}
              className="input w-full"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Re-export billing / API panes from workspace module to avoid duplication during migration
export { BillingPane as SettingsBillingPage, ApiPane as SettingsApiKeysPanel } from './workspacePanes';
