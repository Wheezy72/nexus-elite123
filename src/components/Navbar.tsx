import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Zap, Timer, Smile, ListTodo, Target, Moon as MoonIcon,
  Droplets, BarChart3, Home, PenLine, BookOpen, Settings,
  MoreHorizontal, X
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

// First 4 always visible on mobile + "More" button
const mobileMain = navItems.slice(0, 4);
const mobileMore = navItems.slice(4);

const Navbar: React.FC = () => {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Check if current route is in the "more" section
  const isMoreActive = mobileMore.some(item => location.pathname === item.to);

  return (
    <>
      {/* Desktop top nav */}
      <nav className="sticky top-0 z-50 hidden md:block glass-nav-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
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

            <div className="flex items-center gap-0 relative">
              {navItems.map(item => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className="relative flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all group/nav"
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
                    <span className={`relative z-10 transition-colors hidden xl:inline ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover/nav:text-foreground'
                    }`}>
                      {item.label}
                    </span>
                    {!isActive && (
                      <div className="absolute inset-0 rounded-lg opacity-0 group-hover/nav:opacity-100 bg-white/[0.03] transition-opacity" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar - 4 tabs + More */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav-premium safe-bottom border-t border-white/[0.06]">
        <div className="grid grid-cols-5 h-14">
          {mobileMain.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className="relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-tab"
                    className="absolute top-0 w-8 h-[2px] rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]"
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

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium"
          >
            {(isMoreActive && !moreOpen) && (
              <motion.div
                layoutId="mobile-tab"
                className="absolute top-0 w-8 h-[2px] rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <MoreHorizontal className={`w-[18px] h-[18px] transition-colors ${
              moreOpen || isMoreActive ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <span className={moreOpen || isMoreActive ? 'text-primary' : 'text-muted-foreground'}>
              More
            </span>
          </button>
        </div>
      </div>

      {/* More menu overlay */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="md:hidden fixed bottom-14 left-0 right-0 z-40 safe-bottom"
            >
              <div className="mx-3 mb-2 glass rounded-2xl p-3 border border-white/[0.08] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <div className="grid grid-cols-4 gap-1">
                  {mobileMore.map(item => {
                    const isActive = location.pathname === item.to;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreOpen(false)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
