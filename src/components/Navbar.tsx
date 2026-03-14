import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Zap,
  Timer,
  Smile,
  ListTodo,
  Target,
  Moon as MoonIcon,
  Droplets,
  BarChart3,
  Home,
  PenLine,
  BookOpen,
  Settings,
  Menu,
  X,
  MessageCircle,
  Trophy,
  GraduationCap,
  DollarSign,
  Activity,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarById } from '@/pages/ProfilePage';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const primaryTabs: NavItem[] = [
  { to: '/', label: 'Today', icon: Home },
  { to: '/plan', label: 'Plan', icon: ListTodo },
  { to: '/track', label: 'Track', icon: Target },
  { to: '/insights', label: 'Insights', icon: Activity },
  { to: '/you', label: 'You', icon: Settings },
];

const menuSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Today',
    items: [
      { to: '/', label: 'Today', icon: Home },
      { to: '/chat', label: 'Chat', icon: MessageCircle },
    ],
  },
  {
    title: 'Plan',
    items: [
      { to: '/tasks', label: 'Tasks', icon: ListTodo },
      { to: '/flow', label: 'Flow', icon: Timer },
      { to: '/study', label: 'Study', icon: GraduationCap },
    ],
  },
  {
    title: 'Track',
    items: [
      { to: '/habits', label: 'Habits', icon: Target },
      { to: '/mood', label: 'Mood', icon: Smile },
      { to: '/sleep', label: 'Sleep', icon: MoonIcon },
      { to: '/water', label: 'Water', icon: Droplets },
      { to: '/journal', label: 'Journal', icon: PenLine },
      { to: '/notes', label: 'Notes', icon: BookOpen },
    ],
  },
  {
    title: 'Insights',
    items: [
      { to: '/analytics', label: 'Analytics', icon: Activity },
      { to: '/stats', label: 'Stats', icon: BarChart3 },
      { to: '/achievements', label: 'Trophies', icon: Trophy },
    ],
  },
  {
    title: 'You',
    items: [
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/finance', label: 'Finance', icon: DollarSigninance', label: 'Finance', icon: DollarSign },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const avatar = getAvatarById(profile?.avatar_url ?? null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const sectionByPath = useMemo(() => {
    const p = location.pathname;
    if (p === '/' || p === '/chat') return '/';
    if (p.startsWith('/plan') || p.startsWith('/tasks') || p.startsWith('/flow') || p.startsWith('/study')) return '/plan';
    if (p.startsWith('/track') || p.startsWith('/habits') || p.startsWith('/mood') || p.startsWith('/sleep') || p.startsWith('/water') || p.startsWith('/journal') || p.startsWith('/notes')) return '/track';
    if (p.startsWith('/insights') || p.startsWith('/analytics') || p.startsWith('/stats') || p.startsWith('/achievements')) return '/insights';
    if (p.startsWith('/you') || p.startsWith('/profile') || p.startsWith('/settings') || p.startsWith('/finance')) return '/you';
    return null;
  }, [location.pathname]);

  return (
    <>
      {/* Top bar */}
      <nav className="sticky top-0 z-50 glass-nav-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.08 }}
                className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary/40 to-accent/30 border border-primary/30 flex items-center justify-center"
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
                <Zap className="w-4 h-4 text-primary relative z-10" />
              </motion.div>
              <span className="text-base font-bold tracking-tight text-foreground">Nexus Elite</span>
            </NavLink>

            {/* Primary tabs (desktop) */}
            <div className="hidden md:flex items-center gap-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-1">
              {primaryTabs.map(tab => {
                const active = sectionByPath === tab.to;
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-primary/15 text-primary shadow-[0_0_20px_rgba(99,102,241,0.12)]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                    }`}
                  >
                    {tab.label}
                  </NavLink>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <p className="text-[11px] text-muted-foreground hidden lg:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>

              <NavLink
                to="/chat"
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  location.pathname === '/chat'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
                aria-label="Open chat"
              >
                <MessageCircle className="w-5 h-5" />
              </NavLink>

              {/* Profile avatar */}
              <NavLink to="/profile" className="shrink-0" aria-label="Open profile">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatar.bg} border border-white/10 flex items-center justify-center text-sm`}
                >
                  {avatar.emoji}
                </motion.div>
              </NavLink>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(v => !v)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
                aria-label="Open menu"
              >
                <AnimatePresence mode="wait">
                  {open ? (
                    <motion.div
                      key="x"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tabs */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <div className="glass rounded-2xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.35)] px-2 py-1 flex items-center gap-1">
          {primaryTabs.map(tab => {
            const active = sectionByPath === tab.to;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={`w-[64px] py-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-14 left-0 right-0 z-40 max-h-[calc(100vh-3.5rem)] overflow-y-auto"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                <div className="glass rounded-3xl p-4 border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menuSections.map(section => (
                      <div key={section.title}>
                        <p className="text-[10px] tracking-wide uppercase text-muted-foreground mb-2">{section.title}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                          {section.items.map(item => {
                            const isActive = location.pathname === item.to;
                            return (
                              <NavLink
                                key={item.to}
                                to={item.to}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                                  isActive
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                                }`}
                              >
                                <item.icon className="w-4 h-4" />
                                <span className="text-xs font-medium">{item.label}</span>
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
