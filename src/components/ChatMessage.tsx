import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/services/chatService';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/40 to-accent/30 border border-white/10 flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-primary" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border shadow-[0_10px_35px_rgba(0,0,0,0.25)] ${
          isUser
            ? 'bg-primary/15 border-primary/20 text-foreground'
            : 'glass border-white/[0.08] text-foreground'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </motion.div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
