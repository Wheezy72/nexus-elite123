import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import {
  Zap, Timer, Smile, ListTodo, Target, BookOpen, Brain, Moon as MoonIcon,
  Waves, TrendingUp, PenLine, Droplets, BarChart3, Menu, X, Home
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/flow', label: 'Flow', icon: Timer },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/habits', label: 'Habits', icon: Target },
  { to: '/journal', label: 'Journal', icon: PenLine },
  { to: '/mood', label: 'Mood', icon: Smile },
  { to: '/sleep', label: 'Sleep', icon: MoonIcon },
  { to: '/notes', label: 'Notes', icon: BookOpen },
  { to: '/water', label: 'Water', icon: Droplets },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
];

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center"
            >
              <Zap className="w-3.5 h-3.5 text-primary" />
            </motion.div>
            <span className="text-base font-bold tracking-tight text-foreground">Nexus Elite</span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary/15 text-primary shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Date + mobile toggle */}
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-muted-foreground hidden xl:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden border-t border-white/[0.06]"
          >
            <div className="px-4 py-3 grid grid-cols-5 gap-2">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] transition-colors ${
                      isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
