import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) {
      toast.error('Invalid reset link');
      navigate('/auth');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-3xl border border-white/[0.08] p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-accent/30 border border-primary/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">Nexus Elite</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground text-center mb-6">Set new password</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Update Password</span><ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
