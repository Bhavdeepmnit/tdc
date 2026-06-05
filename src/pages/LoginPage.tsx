import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate, type Location } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  HeartHandshake,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@hooks/useAuth';
import { USE_MOCK_DATA } from '@lib/firebase';
import { cn } from '@utils/cn';

/**
 * Login form schema — the single source of truth for validation AND the form's
 * TypeScript type (`LoginForm = z.infer<...>`).
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

/**
 * Translate Firebase Auth error codes into friendly, non-leaky messages.
 * (We avoid revealing whether an email exists — good auth UX + security.)
 */
function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your admin.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return err instanceof Error && err.message ? err.message : 'Login failed. Please try again.';
  }
}

/**
 * Matchmaker login screen (Feature 1).
 *
 * Layout:
 *  - Mobile: full-screen brand gradient with a centered glass card.
 *  - Desktop (lg+): split — left brand panel, right form panel.
 *
 * Behaviour: real-time Zod validation, show/hide password, remember-me
 * (drives auth persistence), forgot-password toast, and an inline error banner.
 * Already-authenticated users are redirected straight to /dashboard.
 */
export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: { from?: Location } };
  const from = location.state?.from?.pathname ?? '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    // Validate on blur, then keep validating on every change → real-time feedback.
    mode: 'onTouched',
    defaultValues: {
      email: USE_MOCK_DATA ? 'matchmaker1@tdc.com' : '',
      password: USE_MOCK_DATA ? 'TDC@2024' : '',
      rememberMe: true,
    },
  });

  // Auto-redirect if the session is already active (e.g. persisted login).
  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    try {
      await login(values.email, values.password, values.rememberMe);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(friendlyAuthError(err));
    }
  };

  const handleForgotPassword = () => {
    toast('Please contact your admin to reset your password.', { icon: '🔑' });
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-brand-900 via-brand-600 to-brand-500 lg:grid lg:grid-cols-2 lg:bg-none lg:bg-surface-bg">
      {/* ── Desktop brand panel (left) ─────────────────────────────────── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-600 to-brand-500 p-xl text-text-inverse lg:flex">
        {/* Decorative gold glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl" />

        <div className="relative flex items-center gap-2xs">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <HeartHandshake className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="font-display text-h3 font-semibold">The Date Crew</span>
        </div>

        <div className="relative max-w-md">
          <Sparkles className="mb-xs h-8 w-8 text-accent" aria-hidden="true" />
          <h1 className="font-display text-display font-semibold leading-tight">
            Curate meaningful matches.
          </h1>
          <p className="mt-xs text-body-lg text-white/80">
            The matchmaker portal for managing clients, scoring compatibility, and
            crafting introductions that feel personal.
          </p>
        </div>

        <p className="relative text-body-sm text-white/60">
          © {new Date().getFullYear()} The Date Crew · Internal tool
        </p>
      </aside>

      {/* ── Form panel (right on desktop / centered card on mobile) ─────── */}
      <main className="flex min-h-screen items-center justify-center px-xs py-md lg:bg-surface-bg">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md rounded-sheet border border-white/20 bg-surface-card/95 p-sm shadow-float backdrop-blur lg:border-surface-divider lg:shadow-card"
        >
          {/* Compact brand header (mobile only; desktop uses the left panel) */}
          <div className="mb-sm flex flex-col items-center text-center lg:hidden">
            <span className="mb-2xs flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-text-inverse shadow-card">
              <HeartHandshake className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="font-display text-h2 font-semibold text-text-primary">The Date Crew</h1>
            <p className="mt-0.5 text-body-sm font-medium text-brand-600">Matchmaker Portal</p>
          </div>

          {/* Heading (desktop) */}
          <div className="mb-sm hidden lg:block">
            <h2 className="font-display text-h2 font-semibold text-text-primary">Welcome back</h2>
            <p className="mt-1 text-body-sm text-text-secondary">
              Sign in to your matchmaker portal.
            </p>
          </div>

          {/* ── Error banner ── */}
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mb-xs flex items-start gap-2xs rounded-lg border border-status-error-base/30 bg-status-error-bg px-2xs py-2xs text-body-sm text-status-error-text"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* ── Email ── */}
            <div className="mb-xs">
              <label htmlFor="email" className="mb-1 block text-body-sm font-medium text-text-secondary">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={cn('input-field pl-9', errors.email && 'border-status-error-base')}
                  placeholder="you@tdc.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1 text-caption text-status-error-base">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* ── Password (with show/hide) ── */}
            <div className="mb-xs">
              <label
                htmlFor="password"
                className="mb-1 block text-body-sm font-medium text-text-secondary"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={cn(
                    'input-field pl-9 pr-11',
                    errors.password && 'border-status-error-base',
                  )}
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-lg text-text-disabled transition-colors duration-fast hover:text-text-secondary focus:outline-none focus-visible:text-brand-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-caption text-status-error-base">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* ── Remember me + forgot ── */}
            <div className="mb-sm flex items-center justify-between">
              <label className="flex cursor-pointer select-none items-center gap-2xs py-2xs text-body-sm text-text-secondary">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-surface-divider text-brand-600 accent-brand-600 focus:ring-brand-100"
                  {...register('rememberMe')}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="py-2xs text-body-sm font-medium text-brand-600 transition-colors duration-fast hover:text-brand-500"
              >
                Forgot password?
              </button>
            </div>

            {/* ── Submit (with haptic-style press scale) ── */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-body-lg font-medium text-text-inverse shadow-sm',
                'transition-colors duration-fast ease-app hover:bg-brand-500',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </motion.button>
          </form>

          {/* Demo credential hint */}
          <div className="mt-sm rounded-lg bg-surface-sidebar px-2xs py-2xs text-center text-caption text-text-secondary">
            <p className="font-medium text-text-primary">Demo accounts</p>
            <p className="mt-0.5">matchmaker1@tdc.com · matchmaker2@tdc.com — TDC@2024</p>
            <p>admin@tdc.com — TDCAdmin@2024</p>
            {USE_MOCK_DATA && <p className="mt-1 text-text-disabled">(Demo mode — any credentials work.)</p>}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
