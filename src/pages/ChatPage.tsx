import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import PageLayout, { staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import ChatMessage from '@/components/ChatMessage';
import { chatService, type ChatMessage as ChatMessageType } from '@/services/chatService';
import { haptic } from '@/lib/haptics';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const history = await chatService.getChatHistory();
      setMessages(history);
    })();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    await chatService.saveMessage(userMessage);
    setInput('');
    setLoading(true);
    setError(null);
    haptic('light');

    try {
      const response = await chatService.sendMessage(text, {
        timeOfDay: getTimeOfDay(),
      });

      setMessages(prev => [...prev, response]);
      await chatService.saveMessage(response);
      haptic('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get response';
      setError(msg);
      haptic('error');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    if (!confirm('Clear all messages?')) return;
    await chatService.clearHistory();
    setMessages([]);
    haptic('light');
  };

  return (
    <PageLayout>
      <motion.div variants={staggerItem} initial="hidden" animate="show" className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/40 to-accent/30 border border-white/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nexus AI</h1>
            <p className="text-xs text-muted-foreground">A calm companion — practical, not preachy.</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={clear}
          className="px-3 py-2 rounded-xl glass text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-xs font-medium">Clear</span>
        </motion.button>
      </motion.div>

      <GlassCard className="p-0 overflow-hidden" tilt={false}>
        <div className="h-[60vh] sm:h-[65vh] overflow-y-auto p-4 sm:p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center py-10"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                  <MessageCircle className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Start anywhere</h2>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Try: “Help me start studying”, “I\'m overwhelmed”, or “Make me a 30‑minute plan for today”.
                </p>
              </motion.div>
            ) : (
              messages.map(m => (
                <ChatMessage key={m.id} message={m} />
              ))
            )}

            {loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/40 to-accent/30 border border-white/10 flex items-center justify-center shrink-0" />
                <div className="glass rounded-2xl px-4 py-3 border border-white/[0.08]">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary/80"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/[0.06] p-3 sm:p-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mb-3 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-center">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') send();
              }}
              placeholder="Ask me anything…"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
              disabled={loading}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Tip: enable App Lock in Settings to encrypt chat history on this device (XChaCha20-Poly1305). AI runs in demo mode unless you set a provider key in backend/.env.
          </p>
        </div>
      </GlassCard>
    </PageLayout>
  );
};

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export default ChatPage;
