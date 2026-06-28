import React from 'react';
import { User, Bot, Brain, Sparkles, Clock, Check } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../types/accounting';
import { cn } from '../../utils/cn';

interface ChatMessageProps {
  msg: ChatMessageType;
  language: string;
  formatTime: (ts: number) => string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ msg, language, formatTime }) => {
  return (
    <div
      className={cn(
        "flex gap-2 animate-fade-in",
        msg.role === 'user' ? "justify-end" : "justify-start"
      )}
    >
      {msg.role === 'bot' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center relative">
          {msg.isAi ? (
            <>
              <Brain className="w-4 h-4 text-indigo-400" />
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-1.5 h-1.5 text-white" />
              </span>
            </>
          ) : (
            <Bot className="w-4 h-4 text-indigo-400" />
          )}
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
          msg.role === 'user'
            ? "bg-indigo-600 text-white rounded-br-md shadow-sm"
            : "dark:bg-slate-800 bg-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm dark:text-white text-slate-900 rounded-bl-md"
        )}
      >
        <div className="whitespace-pre-line">
          {msg.text.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={i} className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-[13px] font-mono">{part.slice(1, -1)}</code>;
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
        <div className={cn(
          "flex items-center gap-1 mt-1",
          msg.role === 'user' ? "justify-end" : "justify-start"
        )}>
          <Clock className="w-3 h-3 opacity-60" />
          <span className="text-[9px] opacity-60">{formatTime(msg.timestamp)}</span>
          {msg.role === 'user' && (
            <Check className="w-3 h-3 text-emerald-400" />
          )}
          {msg.role === 'bot' && msg.isAi && (
            <Sparkles className="w-2.5 h-2.5 text-indigo-400 opacity-60" />
          )}
        </div>
      </div>
      {msg.role === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};
