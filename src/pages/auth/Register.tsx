import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Checkbox, Form, TextField } from '../../components/ui';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { storePendingPlan } from '../../utils/pendingPlan';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const { control, handleSubmit, watch } = useForm<RegisterForm>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    if (!acceptedTerms) {
      setTermsError(true);
      toast.error('Please accept the Terms of Service and Privacy Policy');
      return;
    }
    setTermsError(false);

    setLoading(true);
    try {
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      const { user, tokens } = response.data.data;
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      storePendingPlan(searchParams.get('plan'), searchParams.get('interval'));
      toast.success('Account created. Verify your email to continue.');
      navigate('/check-email');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Registration failed');
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
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-zinc-400 mt-2">Start creating viral giveaways today</p>
      </div>

      <Form onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
        <Controller
          control={control}
          name="name"
          rules={{
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
          }}
          render={({ field, fieldState }) => (
            <TextField
              label="Name"
              name={field.name}
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              icon={<User className="w-5 h-5" />}
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

        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          }}
          render={({ field, fieldState }) => (
            <TextField
              label="Password"
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
              label="Confirm Password"
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

        <Checkbox
          isRequired
          id="terms"
          isSelected={acceptedTerms}
          onChange={(next) => {
            setAcceptedTerms(next);
            if (next) setTermsError(false);
          }}
          isInvalid={termsError}
        >
          I agree to the{' '}
          <Link to="/terms" className="text-primary-400 hover:text-primary-300" onClick={(event) => event.stopPropagation()}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary-400 hover:text-primary-300" onClick={(event) => event.stopPropagation()}>
            Privacy Policy
          </Link>
        </Checkbox>

        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </Form>

      <p className="text-center text-zinc-400 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
