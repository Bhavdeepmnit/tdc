import { Bell, LayoutDashboard, Search, User, type LucideIcon } from 'lucide-react';

/** A single navigation destination, shared by the sidebar and bottom nav. */
export interface NavItem {
  label: string;
  /** Router path. */
  to: string;
  icon: LucideIcon;
}

/** Primary navigation items (Dashboard, Search, Notifications, Profile). */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Search', to: '/search', icon: Search },
  { label: 'Notifications', to: '/notifications', icon: Bell },
  { label: 'Profile', to: '/profile', icon: User },
];
