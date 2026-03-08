import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  Zap, Timer, Smile, ListTodo, Target, Moon as MoonIcon,
  Droplets, BarChart3, Menu, X, Home, PenLine, BookOpen
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

  return (
    <>
      {/* Desktop top nav */}
      <nav className="sticky top-0 z-50 glass-nav hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center"
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <span className="text-base font-bold tracking-tight text-foreground">Nexus Elite</span>
            </NavLink>

            <div className="flex items-center gap-0.5">
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

            <p className="text-[11px] text-muted-foreground hidden lg:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav safe-bottom border-t border-white/[0.06]">
        <div className="grid grid-cols-5 gap-0">
          {navItems.slice(0, 5).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-0 border-t border-white/[0.04]">
          {navItems.slice(5).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Mobile top header */}
      <div className="md:hidden sticky top-0 z-50 glass-nav">
        <div className="flex items-center justify-between px-4 h-12">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center">
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
