import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Zap, Timer, Smile, ListTodo, Target, Moon as MoonIcon,
  Droplets, BarChart3, Home, PenLine, BookOpen, Settings,
  Menu, X, MessageCircle, Trophy, GraduationCap, DollarSign, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarById } from '@/pages/ProfilePage';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/study', label: 'Study', icon: GraduationCap },
  { to: '/flow', label: 'Flow', icon: Timer },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/habits', label: 'Habits', icon: Target },
  { to: '/journal', label: 'Journal', icon: PenLine },
  { to: '/mood', label: 'Mood', icon: Smile },
  { to: '/sleep', label: 'Sleep', icon: MoonIcon },
  { to: '/notes', label: 'Notes', icon: BookOpen },
  { to: '/water', label: 'Water', icon: Droplets },
  { to: '/analytics', label: 'Analytics', icon: Activity },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/finance', label: 'Finance', icon: DollarSign },
  { to: '/achievements', label: 'Trophies', icon: Trophy },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const avatar = getAvatarById(profile?.avatar_url ?? null);

  useEffect(() => { setOpen(false); }, [location.pathname]);

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
              <span className="text-base font-bold tracking-tight text-foreground">
                Nexus Elite
              </span>
            </NavLink>

            <div className="flex items-center gap-3">
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>

              {/* Profile avatar */}
              <NavLink to="/profile" className="shrink-0">
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
              >
                <AnimatePresence mode="wait">
                  {open ? (
                    <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Full cascading menu */}
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
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                <div className="glass rounded-3xl p-3 border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1">
                    {navItems.map((item, i) => {
                      const isActive = location.pathname === item.to;
                      return (
                        <motion.div
                          key={item.to}
                          initial={{ opacity: 0, y: -15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                        >
                          <NavLink
                            to={item.to}
                            className={`flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all ${
                              isActive
                                ? 'bg-primary/15 text-primary shadow-[0_0_20px_rgba(99,102,241,0.12)]'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                            }`}
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="text-[11px] font-medium">{item.label}</span>
                          </NavLink>
                        </motion.div>
                      );
                    })}
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
