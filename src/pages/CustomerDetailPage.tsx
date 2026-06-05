import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartHandshake,
  StickyNote,
  PenLine,
  Share2,
  UserX,
  Calendar,
  Ruler,
  MapPin,
  Briefcase,
  GraduationCap,
  Building2,
  IndianRupee,
  Heart,
  Users as UsersIcon,
  Utensils,
  Cigarette,
  Wine,
  Baby,
  PawPrint,
  Globe,
  Sparkles,
  ChevronLeft,
  Send,
  Info,
} from 'lucide-react';
import type { Note } from '@types';
import { useCustomer, useIsDesktop } from '@hooks/index';
import { useAuth } from '@hooks/useAuth';
import { useAppStore } from '@store/useAppStore';
import { AppShell } from '@components/layout/AppShell';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { BioField } from '@components/ui/BioField';
import { ChipList } from '@components/ui/ChipList';
import { StatusBadge } from '@components/ui/StatusBadge';
import { EmptyState } from '@components/ui/EmptyState';
import { Spinner } from '@components/ui/Spinner';
import { MatchCard } from '@components/features/MatchCard';
import { NoteCard } from '@components/features/NoteCard';
import { getAge, formatDate, nowIso } from '@utils/date';
import { formatHeight, formatIndianIncome, humanize } from '@utils/format';
import { cn } from '@utils/cn';

/* ──────────────────────────────────────────────────────────────────── */
/*  Tab definitions                                                    */
/* ──────────────────────────────────────────────────────────────────── */

type TabKey = 'basic' | 'career' | 'family' | 'lifestyle' | 'about' | 'matches';

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: TabDef[] = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'career', label: 'Career & Education' },
  { key: 'family', label: 'Family & Background' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'about', label: 'About' },
  { key: 'matches', label: 'Matches' },
];

/* ──────────────────────────────────────────────────────────────────── */
/*  Manglik Tooltip                                                    */
/* ──────────────────────────────────────────────────────────────────── */

function ManglikTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
        aria-label="What is Manglik?"
      >
        <Info className="h-2.5 w-2.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className={cn(
              'absolute left-6 top-0 z-30 w-56 rounded-lg border border-surface-divider',
              'bg-surface-card p-2xs text-caption text-text-secondary shadow-float',
            )}
          >
            Manglik (Mangal Dosha) is an astrological status in Vedic astrology.
            It is considered in traditional Hindu matchmaking as it is believed
            to influence marital compatibility.
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Add Note Form                                                      */
/* ──────────────────────────────────────────────────────────────────── */

function AddNoteForm({ onAdd }: { onAdd: (content: string) => void }) {
  const [content, setContent] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setContent('');
    setFocused(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2xs">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder="Add a note about this client…"
        rows={focused ? 3 : 1}
        className={cn(
          'input-field resize-none transition-all duration-200',
          focused ? 'h-auto' : 'h-11',
        )}
      />
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-end gap-2xs overflow-hidden"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setContent('');
                setFocused(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim()}
              leftIcon={<Send className="h-3.5 w-3.5" />}
            >
              Add Note
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Customer Detail Page                                               */
/* ──────────────────────────────────────────────────────────────────── */

/**
 * Full Customer Detail View with Hero section, 6 tabs, and sticky header.
 *
 * Uses `useCustomer(id)` (flat `CustomerProfile`) for all biodata fields.
 * Uses `useAppStore.computeMatches` for the Matches tab preview.
 */
export function CustomerDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { customer, loading } = useCustomer(id);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const tabsRef = useRef<HTMLDivElement>(null);

  // ── Sticky header (mobile collapse) ──
  const heroRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [customer]);

  // ── Notes (local state) ──
  const [notes, setNotes] = useState<Note[]>([]);

  const addNote = useCallback(
    (content: string) => {
      const note: Note = {
        id: `note_${Date.now()}`,
        customerId: id,
        matchmakerId: user?.id ?? 'unknown',
        content,
        createdAt: nowIso(),
      };
      setNotes((prev) => [note, ...prev]);
    },
    [id, user?.id],
  );

  const deleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  // ── Matches (from store — now ScoredMatch[] with profiles included) ──
  const { matches, loadingMatches, computeMatches } = useAppStore();
  const matchesFetched = useRef(false);

  useEffect(() => {
    if (activeTab === 'matches' && !matchesFetched.current && id) {
      matchesFetched.current = true;
      void computeMatches(id);
    }
  }, [activeTab, id, computeMatches]);

  const topMatches = useMemo(() => matches.slice(0, 5), [matches]);

  // ── Share handler ──
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `TDC - ${customer?.firstName}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        // Could use toast here but keeping simple
      }
    } catch {
      /* user cancelled share */
    }
  }, [customer?.firstName]);

  // ── Scroll active tab into view ──
  useEffect(() => {
    const container = tabsRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    activeBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  // ── Loading state ──
  if (loading) {
    return (
      <AppShell title="Client" showBack backTo="/dashboard">
        <div className="flex justify-center py-lg">
          <Spinner size="lg" label="Loading profile…" />
        </div>
      </AppShell>
    );
  }

  // ── Not found ──
  if (!customer) {
    return (
      <AppShell title="Client" showBack backTo="/dashboard">
        <EmptyState
          icon={UserX}
          title="Client not found"
          description="This profile may have been removed or you don't have access."
          action={<Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>}
        />
      </AppShell>
    );
  }

  const fullName = `${customer.firstName} ${customer.lastName}`;
  const age = getAge(customer.dateOfBirth);

  return (
    <AppShell title={fullName} showBack backTo="/dashboard">
      {/* ── Collapsed sticky header (mobile, on scroll) ── */}
      <AnimatePresence>
        {isScrolled && !isDesktop && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed inset-x-0 top-0 z-40 flex items-center gap-3xs',
              'border-b border-surface-divider bg-surface-card/95 backdrop-blur-sm',
              'px-xs py-2xs',
              'lg:hidden',
            )}
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-sidebar"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5 text-text-primary" />
            </button>
            <Avatar name={fullName} src={customer.profilePhoto} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-semibold text-text-primary">{fullName}</p>
            </div>
            <StatusBadge status={customer.status} size="sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Section ── */}
      <motion.div
        ref={heroRef}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="mb-xs">
          <div className="flex flex-col items-center gap-xs text-center sm:flex-row sm:text-left">
            {/* Avatar */}
            <Avatar
              name={fullName}
              src={customer.profilePhoto}
              size={isDesktop ? 'xl' : 'lg'}
              className={isDesktop ? '!h-40 !w-40' : '!h-[120px] !w-[120px]'}
            />

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col items-center gap-2xs sm:flex-row sm:items-center">
                <h1 className="font-display text-h2 font-semibold text-text-primary">
                  {fullName}
                </h1>
                <StatusBadge status={customer.status} size="md" />
              </div>
              <p className="mt-1 text-body text-text-secondary">
                {age} years old · {customer.city}
              </p>
              <p className="text-body-sm text-text-secondary">
                {customer.designation} at {customer.currentCompany}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-xs flex flex-wrap gap-2xs border-t border-surface-divider pt-xs">
            <Button
              size="sm"
              leftIcon={<HeartHandshake className="h-4 w-4" />}
              onClick={() => navigate(`/customer/${customer.id}/matches`)}
            >
              View Matches
            </Button>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<StickyNote className="h-4 w-4" />}
              onClick={() => setActiveTab('about')}
            >
              Add Note
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<PenLine className="h-4 w-4" />}
            >
              Edit Status
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Share2 className="h-4 w-4" />}
              onClick={handleShare}
            >
              Share
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ── Tab Bar ── */}
      <div
        ref={tabsRef}
        className={cn(
          'mb-xs flex gap-1 overflow-x-auto scrollbar-hide',
          'border-b border-surface-divider pb-0.5',
          !isDesktop && 'sticky top-0 z-20 -mx-xs bg-surface-bg px-xs pt-1',
        )}
        role="tablist"
        aria-label="Profile sections"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative shrink-0 whitespace-nowrap px-3xs py-2xs text-body-sm font-medium',
                'transition-colors duration-fast',
                active
                  ? 'text-brand-600'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {tab.label}
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-brand-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* ─── Basic Info ─── */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 gap-xs lg:grid-cols-2">
              <Card className="space-y-2xs">
                <h2 className="font-display text-h4 font-semibold text-text-primary">
                  Personal Details
                </h2>
                <dl className="space-y-2xs">
                  <BioField
                    icon={<Calendar className="h-4 w-4" />}
                    label="Date of Birth"
                    value={`${formatDate(customer.dateOfBirth)} (${age} yrs)`}
                  />
                  <BioField
                    icon={<Ruler className="h-4 w-4" />}
                    label="Height"
                    value={formatHeight(customer.height)}
                  />
                  <BioField label="Complexion" value={humanize(customer.complexion)} />
                  <BioField label="Body Type" value={humanize(customer.bodyType)} />
                  <BioField label="Physical Status" value={humanize(customer.physicalStatus)} />
                  <BioField label="Marital Status" value={humanize(customer.maritalStatus)} />
                </dl>
              </Card>
              <Card className="space-y-2xs">
                <h2 className="font-display text-h4 font-semibold text-text-primary">
                  Location & Contact
                </h2>
                <dl className="space-y-2xs">
                  <BioField
                    icon={<MapPin className="h-4 w-4" />}
                    label="City"
                    value={customer.city}
                  />
                  <BioField label="Country" value={customer.country} />
                  <BioField
                    icon={<Globe className="h-4 w-4" />}
                    label="Open to Relocate"
                    value={humanize(customer.openToRelocate)}
                  />
                  <BioField
                    label="Email"
                    value={customer.email}
                    masked
                    copyable
                  />
                  <BioField
                    label="Phone"
                    value={customer.phone}
                    masked
                    copyable
                  />
                </dl>
              </Card>
            </div>
          )}

          {/* ─── Career & Education ─── */}
          {activeTab === 'career' && (
            <Card className="space-y-2xs">
              <h2 className="font-display text-h4 font-semibold text-text-primary">
                Career & Education
              </h2>
              <dl className="space-y-2xs">
                <BioField
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Degree"
                  value={customer.degree}
                />
                <BioField
                  icon={<Building2 className="h-4 w-4" />}
                  label="College"
                  value={customer.undergraduateCollege}
                />
                <BioField
                  icon={<Briefcase className="h-4 w-4" />}
                  label="Designation"
                  value={customer.designation}
                />
                <BioField label="Company" value={customer.currentCompany} />
                <BioField
                  icon={<IndianRupee className="h-4 w-4" />}
                  label="Annual Income"
                  value={formatIndianIncome(customer.incomeAnnual)}
                />
              </dl>
            </Card>
          )}

          {/* ─── Family & Background ─── */}
          {activeTab === 'family' && (
            <div className="grid grid-cols-1 gap-xs lg:grid-cols-2">
              <Card className="space-y-2xs">
                <h2 className="font-display text-h4 font-semibold text-text-primary">
                  Community
                </h2>
                <dl className="space-y-2xs">
                  <BioField
                    icon={<Heart className="h-4 w-4" />}
                    label="Religion"
                    value={customer.religion}
                  />
                  <BioField label="Caste" value={customer.caste} />
                  <BioField label="Sub-Caste" value={customer.subCaste} />
                  <BioField label="Gotra" value={customer.gotra} />
                  <BioField
                    label={
                      <span className="inline-flex items-center">
                        Manglik
                        <ManglikTooltip />
                      </span>
                    }
                    value={customer.manglik ? 'Yes' : 'No'}
                  />
                </dl>
              </Card>
              <Card className="space-y-2xs">
                <h2 className="font-display text-h4 font-semibold text-text-primary">
                  Family
                </h2>
                <dl className="space-y-2xs">
                  <BioField
                    icon={<UsersIcon className="h-4 w-4" />}
                    label="Family Type"
                    value={humanize(customer.familyType)}
                  />
                  <BioField label="Family Values" value={humanize(customer.familyValues)} />
                  <BioField label="Father's Occupation" value={customer.fatherOccupation} />
                  <BioField label="Mother's Occupation" value={customer.motherOccupation} />
                  <BioField label="Siblings" value={String(customer.siblings)} />
                </dl>
              </Card>
            </div>
          )}

          {/* ─── Lifestyle ─── */}
          {activeTab === 'lifestyle' && (
            <div className="grid grid-cols-1 gap-xs lg:grid-cols-2">
              <Card className="space-y-2xs">
                <h2 className="font-display text-h4 font-semibold text-text-primary">
                  Habits & Preferences
                </h2>
                <dl className="space-y-2xs">
                  <BioField
                    icon={<Utensils className="h-4 w-4" />}
                    label="Diet"
                    value={humanize(customer.diet)}
                  />
                  <BioField
                    icon={<Cigarette className="h-4 w-4" />}
                    label="Smoking"
                    value={humanize(customer.smoke)}
                  />
                  <BioField
                    icon={<Wine className="h-4 w-4" />}
                    label="Drinking"
                    value={humanize(customer.drink)}
                  />
                  <BioField
                    icon={<Baby className="h-4 w-4" />}
                    label="Want Kids"
                    value={humanize(customer.wantKids)}
                  />
                  <BioField
                    icon={<PawPrint className="h-4 w-4" />}
                    label="Open to Pets"
                    value={humanize(customer.openToPets)}
                  />
                </dl>
              </Card>
              <Card className="space-y-xs">
                <div>
                  <h2 className="mb-2xs font-display text-h4 font-semibold text-text-primary">
                    Languages
                  </h2>
                  <ChipList items={customer.languagesKnown} />
                </div>
                <div>
                  <h2 className="mb-2xs font-display text-h4 font-semibold text-text-primary">
                    Hobbies
                  </h2>
                  <ChipList items={customer.hobbies} />
                </div>
              </Card>
            </div>
          )}

          {/* ─── About ─── */}
          {activeTab === 'about' && (
            <div className="space-y-xs">
              {/* About Me */}
              <Card className="space-y-2xs">
                <h2 className="font-display text-h4 font-semibold text-text-primary">
                  <Sparkles className="mr-1.5 inline h-5 w-5 text-accent" aria-hidden />
                  About Me
                </h2>
                <p className="text-body leading-relaxed text-text-secondary whitespace-pre-wrap">
                  {customer.aboutMe || 'No bio available.'}
                </p>
              </Card>

              {/* Matchmaker Notes */}
              <Card className="space-y-xs">
                <h2 className="font-display text-h4 font-semibold text-text-primary">
                  <StickyNote className="mr-1.5 inline h-5 w-5 text-accent" aria-hidden />
                  Matchmaker Notes
                </h2>

                <AddNoteForm onAdd={addNote} />

                {notes.length === 0 ? (
                  <p className="py-xs text-center text-body-sm text-text-disabled">
                    No notes yet. Add one above.
                  </p>
                ) : (
                  <div className="space-y-2xs">
                    {notes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        authorName={user?.fullName}
                        onDelete={deleteNote}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ─── Matches ─── */}
          {activeTab === 'matches' && (
            <div className="space-y-xs">
              {loadingMatches ? (
                <div className="flex justify-center py-lg">
                  <Spinner size="lg" label="Computing matches…" />
                </div>
              ) : topMatches.length === 0 ? (
                <EmptyState
                  icon={HeartHandshake}
                  title="No matches yet"
                  description="Click the button below to compute matches for this client."
                  action={
                    <Button
                      leftIcon={<HeartHandshake className="h-4 w-4" />}
                      onClick={() => navigate(`/customer/${customer.id}/matches`)}
                    >
                      Find Matches
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-xs">
                    {topMatches.map((match, i) => (
                      <MatchCard
                        key={match.profile.id}
                        match={match}
                        customer={customer}
                        index={i}
                      />
                    ))}
                  </div>

                  {matches.length > 5 && (
                    <div className="flex justify-center pt-xs">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/customer/${customer.id}/matches`)}
                      >
                        View All {matches.length} Matches
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
