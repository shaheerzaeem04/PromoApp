import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Form, TextField } from '../../components/ui';
import { authApi } from '../../services/api';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch } = useForm<ResetPasswordForm>({
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('This reset link is invalid or incomplete');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: data.password });
      toast.success('Password updated. You can sign in now.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'This reset link is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-display font-bold">Invalid reset link</h1>
        <p className="text-zinc-400 mt-2">This password reset link is missing or incomplete.</p>
        <Link to="/forgot-password" className="inline-block mt-6 text-primary-400 hover:text-primary-300 font-medium">
          Request a new link
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold">Set a new password</h1>
        <p className="text-zinc-400 mt-2">Choose a strong password with at least 8 characters.</p>
      </div>

      <Form onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          }}
          render={({ field, fieldState }) => (
            <TextField
              label="New password"
              name={field.name}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              icon={<Lock className="w-5 h-5" />}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              isRequired
              validationBehavior="aria"
              isInvalid={fieldState.invalid}
              errorMessage={fieldState.error?.message}
              suffix={
                <Button
                  variant="icon"
                  size="sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword((open) => !open)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              }
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          }}
          render={({ field, fieldState }) => (
            <TextField
              label="Confirm password"
              name={field.name}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              icon={<Lock className="w-5 h-5" />}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              isRequired
              validationBehavior="aria"
              isInvalid={fieldState.invalid}
              errorMessage={fieldState.error?.message}
            />
          )}
        />

        <Button type="submit" className="w-full" loading={loading}>
          Update password
        </Button>
      </Form>

      <p className="text-center text-zinc-400 mt-8">
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
          Back to sign in
        </Link>
      </p>
    </motion.div>
  );
}
