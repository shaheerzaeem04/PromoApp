import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Bell,
  Palette,
  Shield,
  Key,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, PageHeader } from '../../components/ui';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface ProfileForm {
  name: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>();

  const profileMutation = useMutation({
    mutationFn: (data: { name: string }) => authApi.updateProfile(data),
    onSuccess: (_, variables) => {
      updateUser({ name: variables.name });
      toast.success('Profile updated successfully');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      resetPassword();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to change password');
    },
  });

  const onProfileSubmit = (data: ProfileForm) => {
    profileMutation.mutate({ name: data.name });
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    passwordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'danger', label: 'Delete', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Settings" description="Manage your account and preferences" />

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-48 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                  <Input
                    label="Name"
                    icon={<User className="w-5 h-5" />}
                    error={profileErrors.name?.message}
                    {...registerProfile('name', { required: 'Name is required' })}
                  />
                  <Input
                    label="Email"
                    icon={<Mail className="w-5 h-5" />}
                    disabled
                    {...registerProfile('email')}
                  />
                  <p className="text-sm text-zinc-500">
                    Email cannot be changed. Contact support if you need to update it.
                  </p>
                  <div className="pt-4">
                    <Button type="submit" loading={profileMutation.isPending}>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    icon={<Lock className="w-5 h-5" />}
                    error={passwordErrors.currentPassword?.message}
                    {...registerPassword('currentPassword', { required: 'Current password is required' })}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    icon={<Key className="w-5 h-5" />}
                    error={passwordErrors.newPassword?.message}
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    icon={<Key className="w-5 h-5" />}
                    error={passwordErrors.confirmPassword?.message}
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === watchPassword('newPassword') || 'Passwords do not match',
                    })}
                  />
                  <div className="pt-4">
                    <Button type="submit" loading={passwordMutation.isPending}>
                      <Lock className="w-5 h-5" />
                      Change Password
                    </Button>
                  </div>
                </form>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
                <p className="text-zinc-400 mb-4">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <Button variant="secondary" disabled>
                  <Shield className="w-5 h-5" />
                  Enable 2FA (Coming Soon)
                </Button>
              </Card>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { id: 'email_entries', label: 'New entries', description: 'Get notified when someone enters your campaign' },
                    { id: 'email_milestones', label: 'Milestones', description: 'Celebrate when you hit entry milestones' },
                    { id: 'email_campaign_end', label: 'Campaign ending', description: 'Reminder when your campaign is about to end' },
                    { id: 'email_winner', label: 'Winner selection', description: 'Get notified when winners are selected' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700"
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-zinc-400">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500">Coming Soon</span>
                        <input
                          type="checkbox"
                          disabled
                          aria-disabled="true"
                          className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-primary-500 opacity-50 cursor-not-allowed"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Appearance</h2>
                <div className="space-y-6">
                  <div>
                    <label className="label">Theme</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'dark', label: 'Dark', preview: 'bg-zinc-900' },
                        { id: 'light', label: 'Light', preview: 'bg-white', disabled: true },
                        { id: 'system', label: 'System', preview: 'bg-gradient-to-r from-zinc-900 to-white', disabled: true },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          disabled={theme.disabled}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            theme.id === 'dark'
                              ? 'border-primary-500 bg-zinc-800'
                              : 'border-zinc-700 bg-zinc-800/50 opacity-50'
                          }`}
                        >
                          <div className={`h-16 rounded-lg ${theme.preview} mb-2 border border-zinc-700`} />
                          <span className="text-sm font-medium">{theme.label}</span>
                          {theme.disabled && <span className="text-xs text-zinc-500 block">Coming soon</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'danger' && (
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-red-400">Delete account</h2>
              <p className="text-sm text-zinc-400">
                If you own any workspace as OWNER, transfer it or schedule workspace deletion first. Shared team workspaces are not cascade-deleted.
              </p>
              <DeleteAccountForm />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteAccountForm() {
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const mutation = useMutation({
    mutationFn: () => authApi.deleteAccount(email),
    onSuccess: () => {
      useAuthStore.getState().logout();
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Could not delete account');
    },
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <Input label="Type your email to confirm" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" variant="danger" loading={mutation.isPending} disabled={email !== user?.email}>
        Delete my account
      </Button>
    </form>
  );
}


