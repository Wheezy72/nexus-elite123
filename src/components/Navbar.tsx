import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Zap, Timer, Smile, ListTodo, Target, Moon as MoonIcon,
  Droplets, BarChart3, Home, PenLine, BookOpen, Settings
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
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <>
      {/* Desktop top nav */}
      <nav className="sticky top-0 z-50 hidden md:block glass-nav-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary/40 to-accent/30 border border-primary/30 flex items-center justify-center"
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
                <Zap className="w-4 h-4 text-primary relative z-10" />
              </motion.div>
              <span className="text-base font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Nexus Elite
              </span>
            </NavLink>

            <div className="flex items-center gap-0.5 relative">
              {navItems.map(item => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group/nav"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg bg-primary/15 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <item.icon className={`w-3.5 h-3.5 relative z-10 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover/nav:text-foreground'
                    }`} />
                    <span className={`relative z-10 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover/nav:text-foreground'
                    }`}>
                      {item.label}
                    </span>
                    {/* Hover glow */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-lg opacity-0 group-hover/nav:opacity-100 bg-white/[0.03] transition-opacity" />
                    )}
                  </NavLink>
                );
              })}
            </div>

            <p className="text-[11px] text-muted-foreground hidden lg:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar - scrollable single row */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav-premium safe-bottom border-t border-white/[0.06]">
        <div className="flex overflow-x-auto scrollbar-hide gap-0 px-1 py-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-[56px] text-[10px] font-medium transition-colors shrink-0"
              >
                {/* Active glow dot */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-dot"
                    className="absolute -top-0.5 w-4 h-0.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={`w-[18px] h-[18px] transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Mobile top header */}
      <div className="md:hidden sticky top-0 z-50 glass-nav-premium">
        <div className="flex items-center justify-between px-4 h-12">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="relative w-6 h-6 rounded-md bg-gradient-to-br from-primary/40 to-accent/30 border border-primary/30 flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground">Nexus Elite</span>
          </NavLink>
          <p className="text-[10px] text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </>
  );
};

export default Navbar;
