import React from 'react';
import { MessageCircle, X, Settings, MessageSquarePlus, Key, Brain, Bot, Sparkles, Send, BarChart3 } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { cn } from '../../utils/cn';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ConfirmationModal } from '../ConfirmationModal';
import { FinancialContext } from '../../types/accounting';

interface ChatWindowProps {
  financialContext?: FinancialContext;
  geminiApiKey?: string;
  onApiKeyChange?: (key: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  financialContext,
  geminiApiKey,
  onApiKeyChange,
}) => {
  const { t, language } = useLanguage();
  const chat = useChat(financialContext, geminiApiKey, onApiKeyChange, language, t);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      chat.handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => chat.setIsOpen(!chat.isOpen)}
        className="fixed bottom-6 left-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group border border-indigo-500/30"
        aria-label="المستشار الذكي"
      >
        {chat.isOpen ? (
          <X className="w-6 h-6 rotate-90 transition-transform duration-300" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 group-hover:rotate-6 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* Chat Aside Drawer */}
      <aside
        aria-label={language === 'ar' ? 'الدردشة الآلية' : 'AI Chatbot'}
        className={cn(
          "fixed bottom-24 left-6 w-[95vw] sm:w-[420px] h-[650px] max-h-[75vh] glass dark:bg-slate-950/95 bg-white/95 border dark:border-white/10 border-slate-200 rounded-[2.5rem] shadow-2xl z-50 overflow-hidden flex flex-col transition-all duration-500 transform origin-bottom-left",
          chat.isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b dark:border-white/10 border-slate-200 flex items-center justify-between bg-indigo-600/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 relative">
              <Brain className="w-5 h-5 text-white" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950"></span>
            </div>
            <div>
              <h2 className="text-sm font-black dark:text-white text-slate-900 leading-tight">
                {language === 'ar' ? 'المساعد الافتراضي' : 'Virtual Assistant'}
              </h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                {chat.isAiAvailable
                  ? (language === 'ar' ? 'ذكي (AI)' : 'AI Powered')
                  : (language === 'ar' ? 'متصل' : 'Online')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => chat.setShowSettings(!chat.showSettings)}
              className={cn(
                "p-2 rounded-xl transition-all",
                chat.showSettings
                  ? "bg-indigo-500/20 text-indigo-500"
                  : "dark:text-slate-400 text-slate-500 hover:bg-indigo-500/20 hover:text-indigo-500"
              )}
              title={language === 'ar' ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => chat.setConfirmOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold dark:text-slate-300 text-slate-600 hover:bg-indigo-500/20 hover:text-indigo-500 rounded-xl transition-all"
              title={language === 'ar' ? 'محادثة جديدة' : 'New Chat'}
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'محادثة جديدة' : 'New Chat'}</span>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {chat.showSettings && (
          <div className="p-4 border-b dark:border-white/10 border-slate-200 bg-indigo-500/5 flex-shrink-0 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold dark:text-white text-slate-900">
                {language === 'ar' ? 'مفتاح Gemini API' : 'Gemini API Key'}
              </span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline ml-auto"
              >
                {language === 'ar' ? 'الحصول على مفتاح' : 'Get API Key'}
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={chat.localApiKey}
                onChange={(e) => chat.setLocalApiKey(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل المفتاح هنا...' : 'Enter your API key...'}
                className="flex-1 px-3 py-2 rounded-xl border dark:border-white/10 border-slate-200 dark:bg-slate-800/50 bg-slate-100 dark:text-white text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={chat.saveApiKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
            <p className="text-[9px] dark:text-slate-500 text-slate-400 mt-2">
              {language === 'ar'
                ? 'المفتاح يُحفظ محلياً فقط ولا يُرسل إلى أي خادم آخر.'
                : 'The key is stored locally only and never sent anywhere else.'}
            </p>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {chat.messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              msg={msg}
              language={language}
              formatTime={formatTime}
            />
          ))}

          {chat.isTyping && (
            <div className="flex gap-2 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                {chat.isAiAvailable ? (
                  <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
                ) : (
                  <Bot className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <div className="dark:bg-slate-800 bg-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 dark:bg-white/40 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 dark:bg-white/40 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 dark:bg-white/40 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chat.messagesEndRef} />
        </div>

        {/* Status Bar */}
        {financialContext && financialContext.transactionCount > 0 && (
          <div className="px-4 py-1.5 border-t dark:border-white/5 border-slate-100 dark:bg-slate-900/50 bg-slate-50/80 flex-shrink-0">
            <div className="flex items-center gap-2 justify-center">
              <BarChart3 className="w-3 h-3 text-indigo-400" />
              <span className="text-[9px] dark:text-slate-400 text-slate-500">
                {language === 'ar'
                  ? `${financialContext.transactionCount} معاملة | ${chat.isAiAvailable ? 'AI نشط 🧠' : 'الردود التلقائية'}`
                  : `${financialContext.transactionCount} transactions | ${chat.isAiAvailable ? 'AI Active 🧠' : 'Auto-replies'}`}
              </span>
            </div>
          </div>
        )}

        {/* Footer Input Area */}
        <div className="p-4 border-t dark:border-white/10 border-slate-200 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={chat.inputRef}
              type="text"
              value={chat.input}
              onChange={(e) => chat.setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
              className="flex-1 px-4 py-3 rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-slate-800/50 bg-slate-100 dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
            <button
              onClick={chat.handleSend}
              disabled={!chat.input.trim()}
              aria-label={language === 'ar' ? 'إرسال' : 'Send'}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition-all active:scale-95 relative"
            >
              {chat.isAiAvailable ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-[10px] dark:text-slate-500 text-slate-400 mt-2 text-center">
            {chat.isAiAvailable
              ? (language === 'ar' ? '🧠 يستخدم الذكاء الاصطناعي للإجابة على أسئلتك' : '🧠 AI-powered responses to your questions')
              : (language === 'ar' ? 'المساعد يرد تلقائياً - فعّل AI للحصول على إجابات أكثر ذكاءً' : 'Auto-replies active - enable AI for smarter answers')}
          </p>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={chat.confirmOpen}
        title={language === 'ar' ? 'مسح المحادثة' : 'Clear Chat'}
        message={language === 'ar' ? 'هل تريد مسح المحادثة وبدء محادثة جديدة؟' : 'Are you sure you want to start a new chat?'}
        confirmText={language === 'ar' ? 'مسح' : 'Clear'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
        onConfirm={chat.handleClearChat}
        onCancel={() => chat.setConfirmOpen(false)}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
    </>
  );
};
