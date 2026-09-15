import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Form, TextField } from '../../components/ui';
import { authApi } from '../../services/api';

interface ForgotPasswordForm {
  email: string;
}

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Unable to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold">Forgot password</h1>
        <p className="text-zinc-400 mt-2">
          Enter your email and we&apos;ll send a reset link if an account exists.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-6">
          <p className="text-sm text-zinc-300 text-center">
            If an account exists for that email, a password reset link has been sent.
            Check your inbox and spam folder.
          </p>
          <Link to="/login" className="block text-center text-primary-400 hover:text-primary-300 font-medium">
            Back to sign in
          </Link>
        </div>
      ) : (
        <Form onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            }}
            render={({ field, fieldState }) => (
              <TextField
                label="Email"
                name={field.name}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                icon={<Mail className="w-5 h-5" />}
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
            Send reset link
          </Button>

          <p className="text-center text-zinc-400">
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Back to sign in
            </Link>
          </p>
        </Form>
      )}
    </motion.div>
  );
}
