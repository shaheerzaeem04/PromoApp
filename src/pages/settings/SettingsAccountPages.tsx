import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Lock, Key, Save, Shield, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Checkbox, Form, TextField, Modal } from '../../components/ui';
import { UserAvatar } from '../../components/account/UserAvatar';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useTheme } from '../../theme/ThemeProvider';
import type { ThemePreference } from '../../theme/theme';

interface ProfileForm {
  name: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface EmailChangeForm {
  newEmail: string;
  currentPassword: string;
}

const NAME_MAX = 100;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function apiError(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { error?: { message?: string } } } };
  return err?.response?.data?.error?.message || fallback;
}

export function SettingsProfilePage() {
  const { user, updateUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { control, handleSubmit, watch, reset } = useForm<ProfileForm>({
    defaultValues: { name: user?.name || '' },
  });

  useEffect(() => {
    authApi
      .getProfile()
      .then((response) => {
        updateUser(response.data.data);
        reset({ name: response.data.data.name || '' });
      })
      .catch(() => undefined);
  }, [reset, updateUser]);

  useEffect(() => {
    if (user?.name) reset({ name: user.name });
  }, [user?.name, reset]);

  const nameValue = watch('name') || '';
  const dirty = nameValue.trim() !== (user?.name || '').trim();

  const saveName = useMutation({
    mutationFn: (data: { name: string }) => authApi.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data.data);
      toast.success('Profile updated');
    },
    onError: (error) => toast.error(apiError(error, 'Failed to update profile')),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (response) => {
      updateUser(response.data.data);
      toast.success('Profile picture updated');
    },
    onError: (error) => toast.error(apiError(error, 'Could not upload picture')),
  });

  const removeAvatar = useMutation({
    mutationFn: () => authApi.removeAvatar(),
    onSuccess: (response) => {
      setPreview(null);
      updateUser(response.data.data);
      toast.success('Profile picture removed');
    },
    onError: (error) => toast.error(apiError(error, 'Could not remove picture')),
  });

  const onFile = (file?: File | null) => {
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error('Upload a JPEG, PNG, GIF, or WebP image');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('Profile picture must be 2MB or smaller');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
    uploadAvatar.mutate(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Profile Settings</h2>
        <p className="text-sm text-zinc-500 mt-1">Manage your personal information.</p>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-base font-semibold">Full name</h3>
        <Form
          onSubmit={handleSubmit((data) => saveName.mutate({ name: data.name.trim() }))}
          validationBehavior="aria"
        >
          <Controller
            control={control}
            name="name"
            rules={{
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: NAME_MAX, message: `Name must be ${NAME_MAX} characters or fewer` },
            }}
            render={({ field, fieldState }) => (
              <TextField
                label="Full name"
                name={field.name}
                icon={<User className="w-5 h-5" />}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                maxLength={NAME_MAX}
                isRequired
                validationBehavior="aria"
                isInvalid={fieldState.invalid}
                errorMessage={fieldState.error?.message}
                description={`${nameValue.length}/${NAME_MAX}`}
                data-testid="profile-name"
              />
            )}
          />
          <Button
            type="submit"
            loading={saveName.isPending}
            isDisabled={!dirty || saveName.isPending}
            data-testid="save-profile"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </Button>
        </Form>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-base font-semibold">Email address</h3>
        <TextField
          label="Email"
          name="accountEmail"
          type="email"
          icon={<Mail className="w-5 h-5" />}
          value={user?.email || ''}
          onChange={() => undefined}
          isReadOnly
          validationBehavior="aria"
          data-testid="profile-email"
        />
        {user?.pendingEmail ? (
          <p className="text-sm text-amber-300">
            A change to {user.pendingEmail} is pending. Check that inbox to confirm.
          </p>
        ) : (
          <p className="text-sm text-zinc-500">
            Changing your email requires your current password and a confirmation link sent to the new address.
          </p>
        )}
        <Button type="button" variant="secondary" onClick={() => setEmailOpen(true)} data-testid="change-email">
          Change Email
        </Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-base font-semibold">Profile picture</h3>
        <p className="text-sm text-zinc-500">Recommended ~200×200. Max 2MB. JPEG, PNG, GIF, or WebP.</p>
        <div className="flex items-center gap-4">
          {preview ? (
            <img src={preview} alt="Profile picture preview" className="w-20 h-20 rounded-full object-cover border border-zinc-800" />
          ) : (
            <UserAvatar
              name={user?.name}
              avatar={user?.avatar}
              className="w-20 h-20"
              textClassName="text-lg"
              alt="Current profile picture"
            />
          )}
          <div className="text-sm text-zinc-500">Current picture</div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          data-testid="profile-photo-input"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploadAvatar.isPending}>
            <Upload className="w-4 h-4" />
            Browse
          </Button>
          {user?.avatar && (
            <Button type="button" variant="ghost" onClick={() => removeAvatar.mutate()} loading={removeAvatar.isPending}>
              Remove picture
            </Button>
          )}
        </div>
        <div
          className={`border border-dashed rounded-xl p-6 text-center text-sm transition-colors ${
            dragOver ? 'border-primary-500 bg-primary-500/5 text-zinc-200' : 'border-zinc-700 text-zinc-500'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onFile(e.dataTransfer.files?.[0]);
          }}
        >
          Drag and drop an image here, or browse.
        </div>
      </Card>

      <ChangeEmailModal
        isOpen={emailOpen}
        onClose={() => setEmailOpen(false)}
        onPending={(pendingEmail) => updateUser({ pendingEmail })}
      />
    </div>
  );
}

function ChangeEmailModal({
  isOpen,
  onClose,
  onPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPending: (email: string) => void;
}) {
  const { control, handleSubmit, reset } = useForm<EmailChangeForm>({
    defaultValues: { newEmail: '', currentPassword: '' },
  });

  useEffect(() => {
    if (!isOpen) reset({ newEmail: '', currentPassword: '' });
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (data: EmailChangeForm) => authApi.requestEmailChange(data),
    onSuccess: (_, variables) => {
      onPending(variables.newEmail.trim().toLowerCase());
      toast.success('Check the new address to confirm this change');
      onClose();
    },
    onError: (error) => toast.error(apiError(error, 'Could not start email change')),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change email"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            loading={mutation.isPending}
            onClick={() => {
              void handleSubmit((data) => mutation.mutate(data))();
            }}
          >
            Send confirmation
          </Button>
        </>
      }
    >
      <Form
        id="change-email-form"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        validationBehavior="aria"
        className="space-y-4"
      >
        <p className="text-sm text-zinc-400">
          We will send a confirmation link to the new address. Your login email does not change until you verify it.
        </p>
        <Controller
          control={control}
          name="newEmail"
          rules={{
            required: 'New email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
          }}
          render={({ field, fieldState }) => (
            <TextField
              label="New email"
              name={field.name}
              type="email"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              isRequired
              isInvalid={fieldState.invalid}
              errorMessage={fieldState.error?.message}
              data-testid="new-email"
            />
          )}
        />
        <Controller
          control={control}
          name="currentPassword"
          rules={{ required: 'Current password is required' }}
          render={({ field, fieldState }) => (
            <TextField
              label="Current password"
              name={field.name}
              type="password"
              autoComplete="current-password"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              isRequired
              isInvalid={fieldState.invalid}
              errorMessage={fieldState.error?.message}
              data-testid="email-change-password"
            />
          )}
        />
      </Form>
    </Modal>
  );
}

export function SettingsSecurityPage() {
  const { user, setAuth } = useAuthStore();
  const { control, handleSubmit, watch, reset } = useForm<PasswordForm>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const newPassword = watch('newPassword');

  const mutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => authApi.changePassword(data),
    onSuccess: (response) => {
      const tokens = response.data.data?.tokens;
      if (tokens && user) {
        setAuth(user, tokens.accessToken, tokens.refreshToken);
      }
      toast.success('Password changed successfully');
      reset();
    },
    onError: (error) => toast.error(apiError(error, 'Failed to change password')),
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1">Change Password</h2>
        <p className="text-sm text-zinc-500 mb-6">Update your password to keep your account secure.</p>
        <ul className="mb-6 text-sm text-zinc-400 space-y-1 list-disc pl-5">
          <li>At least {PASSWORD_MIN} characters</li>
          <li>Must be different from your current password</li>
          <li>Other sessions will be signed out after a successful change</li>
        </ul>
        <Form
          onSubmit={handleSubmit((data) =>
            mutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword })
          )}
          validationBehavior="aria"
        >
          <Controller
            control={control}
            name="currentPassword"
            rules={{ required: 'Current password is required' }}
            render={({ field, fieldState }) => (
              <TextField
                label="Current Password"
                name={field.name}
                type="password"
                autoComplete="current-password"
                icon={<Lock className="w-5 h-5" />}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                isRequired
                validationBehavior="aria"
                isInvalid={fieldState.invalid}
                errorMessage={fieldState.error?.message}
                data-testid="current-password"
              />
            )}
          />
          <Controller
            control={control}
            name="newPassword"
            rules={{
              required: 'New password is required',
              minLength: { value: PASSWORD_MIN, message: `Password must be at least ${PASSWORD_MIN} characters` },
              maxLength: { value: PASSWORD_MAX, message: `Password must be ${PASSWORD_MAX} characters or fewer` },
              validate: (value, values) =>
                value !== values.currentPassword || 'New password must be different from your current password',
            }}
            render={({ field, fieldState }) => (
              <TextField
                label="New Password"
                name={field.name}
                type="password"
                autoComplete="new-password"
                icon={<Key className="w-5 h-5" />}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                maxLength={PASSWORD_MAX}
                isRequired
                validationBehavior="aria"
                isInvalid={fieldState.invalid}
                errorMessage={fieldState.error?.message}
                data-testid="new-password"
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Please confirm your password',
              validate: (value) => value === newPassword || 'Passwords do not match',
            }}
            render={({ field, fieldState }) => (
              <TextField
                label="Confirm New Password"
                name={field.name}
                type="password"
                autoComplete="new-password"
                icon={<Key className="w-5 h-5" />}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                isRequired
                validationBehavior="aria"
                isInvalid={fieldState.invalid}
                errorMessage={fieldState.error?.message}
                data-testid="confirm-password"
              />
            )}
          />
          <Button type="submit" loading={mutation.isPending} data-testid="change-password">
            <Lock className="w-5 h-5" />
            Change Password
          </Button>
        </Form>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
        <p className="text-zinc-400 mb-4">Add an extra layer of security to your account by enabling two-factor authentication.</p>
        <Button variant="secondary" disabled>
          <Shield className="w-5 h-5" />
          Enable 2FA (Coming Soon)
        </Button>
      </Card>
    </div>
  );
}

export function SettingsNotificationsPage() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
      <div className="space-y-4">
        {[
          { id: 'email_entries', label: 'New entries', description: 'Get notified when someone enters your campaign' },
          { id: 'email_milestones', label: 'Milestones', description: 'Celebrate when you hit entry milestones' },
          { id: 'email_campaign_end', label: 'Campaign ending', description: 'Reminder when your campaign is about to end' },
          { id: 'email_winner', label: 'Winner selection', description: 'Get notified when winners are selected' },
        ].map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-zinc-400">{item.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">Coming Soon</span>
              <Checkbox isDisabled aria-label={item.label} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SettingsAppearancePage() {
  const { preference, setPreference, resolved } = useTheme();
  const options: { id: ThemePreference; label: string; preview: string }[] = [
    { id: 'dark', label: 'Dark', preview: 'bg-zinc-900' },
    { id: 'light', label: 'Light', preview: 'bg-white' },
    { id: 'system', label: 'System', preview: 'bg-gradient-to-r from-zinc-900 to-white' },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-2">Appearance</h2>
      <p className="text-sm text-zinc-500 mb-6">
        Currently {resolved} mode. This follows your PromoApp theme preference on this device.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => setPreference(theme.id)}
            aria-pressed={preference === theme.id}
            data-testid={`theme-${theme.id}`}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              preference === theme.id
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
            }`}
          >
            <div className={`h-16 rounded-lg ${theme.preview} mb-2 border border-zinc-700`} />
            <span className="text-sm font-medium">{theme.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

export function SettingsDeleteAccountPage() {
  const user = useAuthStore((s) => s.user);
  const [acked, setAcked] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownedWorkspaces, setOwnedWorkspaces] = useState<{ id: string; name: string }[]>([]);

  const mutation = useMutation({
    mutationFn: () => authApi.deleteAccount(email, password),
    onSuccess: () => {
      useAuthStore.getState().logout();
      useWorkspaceStore.getState().clearWorkspace();
      window.location.href = '/';
    },
    onError: (error: any) => {
      const payload = error?.response?.data?.error;
      if (payload?.code === 'OWNS_WORKSPACES') {
        setOwnedWorkspaces(payload.details?.workspaces || []);
      }
      toast.error(payload?.message || 'Could not delete account');
    },
  });

  return (
    <Card className="p-6 space-y-4 border-red-500/30" data-testid="danger-zone">
      <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
      <p className="text-sm text-zinc-400">
        Destructive actions can result in unrecoverable data loss.
      </p>
      <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4 space-y-3">
        <h3 className="font-semibold text-red-300">Delete Account</h3>
        <p className="text-sm text-zinc-400">
          This deletes your personal account only. Workspaces you do not own are left intact.
          If you are the only owner of a workspace, transfer ownership or delete that workspace first.
          Campaigns, billing, and teammates in those workspaces are not cascade-deleted.
        </p>
        <Checkbox
          isSelected={acked}
          onChange={setAcked}
          data-testid="delete-account-ack"
        >
          I understand that this action is irreversible
        </Checkbox>
        <Button
          type="button"
          variant="danger"
          isDisabled={!acked}
          data-testid="delete-account"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </Button>
      </div>

      {ownedWorkspaces.length > 0 && (
        <div className="text-sm text-amber-300 space-y-2">
          <p>Resolve ownership of these workspaces before deleting your account:</p>
          <ul className="list-disc pl-5">
            {ownedWorkspaces.map((ws) => (
              <li key={ws.id}>{ws.name}</li>
            ))}
          </ul>
          <a href="/settings/general" className="text-primary-400 underline">Open Workspace Settings</a>
        </div>
      )}

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm account deletion"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={mutation.isPending}
              isDisabled={email.trim().toLowerCase() !== user?.email?.toLowerCase() || !password}
              onClick={() => mutation.mutate()}
              data-testid="confirm-delete-account"
            >
              Delete my account
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Type your account email and current password to confirm. This cannot be undone.
          </p>
          <TextField
            label="Account email"
            name="confirmEmail"
            type="email"
            value={email}
            onChange={setEmail}
            isRequired
            data-testid="delete-confirm-email"
          />
          <TextField
            label="Current password"
            name="confirmPassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            isRequired
            data-testid="delete-confirm-password"
          />
        </div>
      </Modal>
    </Card>
  );
}
