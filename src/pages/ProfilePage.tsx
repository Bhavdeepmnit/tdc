import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  LogOut,
  Download,
  Smartphone,
  CheckCircle2,
  Mail,
  Shield,
  CalendarDays,
  Users,
  Send,
} from 'lucide-react';
import { MatchmakerRole } from '@types';
import { useAuth } from '@hooks/useAuth';
import { useCustomers, useInstallPrompt } from '@hooks/index';
import { useAppStore } from '@store/useAppStore';
import { AppShell } from '@components/layout/AppShell';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { formatDate } from '@utils/date';
import { cn } from '@utils/cn';

/**
 * Profile / account page: the signed-in matchmaker's details, quick stats, a
 * "Download app" (PWA install) action, and sign-out. Mobile-first single column.
 */
export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { customers } = useCustomers();
  const sentCount = useAppStore((s) => Object.keys(s.sentMatches).length);
  const { canInstall, installed, promptInstall } = useInstallPrompt();

  const isAdmin = user?.role === MatchmakerRole.ADMIN;
  const roleLabel = isAdmin ? 'Administrator' : 'Matchmaker';

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  const handleInstall = async () => {
    if (installed) return;
    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) toast.success('Installing TDC…');
      return;
    }
    // iOS Safari / unsupported: no programmatic prompt — guide the user.
    toast(
      'On iPhone: tap the Share button, then "Add to Home Screen". On desktop: use the install icon in the address bar.',
      { icon: '📲', duration: 6000 },
    );
  };

  return (
    <AppShell title="Profile">
      <div className="mx-auto w-full max-w-md space-y-xs">
        {/* ── Identity card ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="flex flex-col items-center gap-2xs py-md text-center">
            <Avatar name={user?.fullName ?? 'User'} src={user?.avatarUrl} size="xl" />
            <div>
              <h2 className="font-display text-h3 font-semibold text-text-primary">
                {user?.fullName ?? 'Matchmaker'}
              </h2>
              <span
                className={cn(
                  'mt-1 inline-flex items-center gap-1 rounded-full px-2xs py-0.5 text-caption font-semibold',
                  isAdmin ? 'bg-brand-50 text-brand-600' : 'bg-status-info-bg text-status-info-text',
                )}
              >
                <Shield className="h-3 w-3" aria-hidden />
                {roleLabel}
              </span>
            </div>
          </Card>
        </motion.div>

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-2 gap-xs">
          <StatTile icon={Users} value={customers.length} label="Clients" />
          <StatTile icon={Send} value={sentCount} label="Matches sent" />
        </div>

        {/* ── Account details ── */}
        <Card className="divide-y divide-surface-divider p-0">
          <DetailRow icon={Mail} label="Email" value={user?.email ?? '—'} />
          <DetailRow icon={Shield} label="Role" value={roleLabel} />
          <DetailRow
            icon={CalendarDays}
            label="Member since"
            value={user?.createdAt ? formatDate(user.createdAt) : '—'}
          />
        </Card>

        {/* ── Install PWA ── */}
        <Card className="flex items-center gap-2xs">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Smartphone className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body-sm font-medium text-text-primary">Install TDC app</p>
            <p className="text-caption text-text-secondary">
              {installed ? 'Already installed on this device.' : 'Add to your home screen for quick, offline access.'}
            </p>
          </div>
          {installed ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-caption font-medium text-status-success-text">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Installed
            </span>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleInstall}
              className="shrink-0"
            >
              Install
            </Button>
          )}
        </Card>

        {/* ── Sign out ── */}
        <Button
          variant="danger"
          fullWidth
          leftIcon={<LogOut className="h-4 w-4" />}
          onClick={handleLogout}
        >
          Sign out
        </Button>
      </div>
    </AppShell>
  );
}

function StatTile({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  return (
    <Card className="flex items-center gap-2xs">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-sidebar text-brand-600">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="font-display text-h4 font-semibold text-text-primary">{value}</p>
        <p className="text-caption text-text-secondary">{label}</p>
      </div>
    </Card>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2xs px-xs py-2xs">
      <Icon className="h-4 w-4 shrink-0 text-text-disabled" aria-hidden />
      <span className="w-28 shrink-0 text-body-sm text-text-secondary">{label}</span>
      <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}
