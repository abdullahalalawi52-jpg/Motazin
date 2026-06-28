import { useState, useRef, useEffect } from 'react';
import { ChatMessage, FinancialContext } from '../types/accounting';
import { normalizeText, KEYWORDS, AUTO_REPLIES, getFinancialAnalysis, buildSystemPrompt } from '../utils/chatUtils';

const STORAGE_KEY = 'motazin_chat_messages';
const API_KEY_STORAGE_KEY = 'motazin_gemini_chat_key';

export function useChat(
  financialContext: FinancialContext | undefined,
  geminiApiKey: string | undefined,
  onApiKeyChange: ((key: string) => void) | undefined,
  language: string,
  t: (key: string) => string
) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lang = language === 'ar' ? 'ar' : 'en';
  const replies = AUTO_REPLIES[lang];
  const keywords = KEYWORDS[lang];

  const effectiveApiKey = geminiApiKey || localApiKey;
  const isAiAvailable = true; // AI via secure backend or client override key

  // Send welcome message on first open
  const hasSentWelcome = useRef(false);
  useEffect(() => {
    if (isOpen && messages.length === 0 && !hasSentWelcome.current) {
      hasSentWelcome.current = true;
      let welcomeText = replies.welcome;

      if (financialContext && financialContext.transactionCount > 0) {
        welcomeText += `\n\n📊 ${language === 'ar' ? 'لديّ **بياناتك المالية** وأستطيع مساعدتك في تحليلها!' : 'I have your **financial data** and can help analyze it!'}`;
      }

      if (isAiAvailable) {
        welcomeText += `\n🤖 ${language === 'ar' ? 'الذكاء الاصطناعي مفعل! اسألني أي سؤال وسأحاول الإجابة بدقة!' : 'AI is active! Ask me anything and I\'ll try to answer accurately!'}`;
      } else {
        welcomeText += `\n⚙️ ${language === 'ar' ? 'لتفعيل الذكاء الاصطناعي، أدخل مفتاح Gemini API في الإعدادات (الترس ⚙️)' : 'To enable AI, enter your Gemini API key in settings (gear icon ⚙️)'}`;
      }

      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'bot',
        text: welcomeText,
        timestamp: Date.now(),
        isAi: false
      };
      const newMessages = [welcomeMsg];
      setMessages(newMessages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    }
  }, [isOpen, messages.length, financialContext, language, replies.welcome]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const saveApiKey = () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, localApiKey);
    if (onApiKeyChange) {
      onApiKeyChange(localApiKey);
    }
    setShowSettings(false);
    setHasError(false);

    if (localApiKey.trim()) {
      const activationMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'bot',
        text: language === 'ar' 
          ? '✅ تم حفظ المفتاح! الذكاء الاصطناعي نشط الآن. اسألني أي سؤال.' 
          : '✅ Key saved! AI is now active. Ask me anything.',
        timestamp: Date.now(),
        isAi: false
      };
      const newMessages = [...messages, activationMsg];
      setMessages(newMessages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    }
  };

  const findReply = (text: string): string => {
    const normalizedInput = normalizeText(text);

    if (financialContext && financialContext.transactionCount > 0) {
      const balanceKeywords = language === 'ar'
        ? ['رصيد', 'مبلغ', 'مجموع', 'اجمالي', 'كم', 'قيمه', 'ميزاني', 'اصول', 'خصوم', 'حقوق', 'ربح', 'خساره']
        : ['balance', 'total', 'amount', 'how much', 'assets', 'liabilities', 'equity', 'profit', 'loss', 'net income', 'ratio'];

      const isFinancialQuery = balanceKeywords.some(k => normalizedInput.includes(normalizeText(k)));

      if (isFinancialQuery) {
        const accountMap: Record<string, string> = language === 'ar'
          ? { 'بنك': 'bank', 'نقد': 'cash', 'سياره': 'cars', 'اثاث': 'furniture', 'مخزون': 'inventory', 'معدات': 'equipment', 'مباني': 'buildings', 'اراضي': 'land' }
          : { 'bank': 'bank', 'cash': 'cash', 'car': 'cars', 'furniture': 'furniture', 'inventory': 'inventory', 'equipment': 'equipment', 'building': 'buildings', 'land': 'land' };

        for (const [key, accountId] of Object.entries(accountMap)) {
          if (normalizedInput.includes(normalizeText(key))) {
            const amount = financialContext.accounts[accountId] || 0;
            if (amount !== 0) {
              const accountName = language === 'ar'
                ? (t(accountId) || accountId)
                : (accountId === 'cars' ? 'Cars' : t(accountId) || accountId);
              return language === 'ar'
                ? `💰 **رصيد ${accountName}:** ${amount.toLocaleString()}\n\n(بيانات من سجلاتك المالية)`
                : `💰 **${accountName} Balance:** ${amount.toLocaleString()}\n\n(From your financial records)`;
            } else {
              return language === 'ar'
                ? `ℹ️ لا يوجد رصيد مسجل لهذا الحساب. أضف معاملة جديدة لتسجيله.`
                : `ℹ️ No balance recorded for this account. Add a transaction to record it.`;
            }
          }
        }

        const analysis = getFinancialAnalysis(financialContext, language);
        if (analysis) return analysis;
      }
    }

    let bestKey = 'default';
    let maxWeight = 0;

    for (const kwRule of keywords) {
      let matchCount = 0;
      for (const kw of kwRule.keywords) {
        if (normalizedInput.includes(normalizeText(kw))) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        const weight = (kwRule.weight || 1) * matchCount;
        if (weight > maxWeight) {
          maxWeight = weight;
          bestKey = kwRule.replyKey;
        }
      }
    }

    return replies[bestKey] || replies.default;
  };

  const callGeminiApi = async (newText: string, currentHistory: ChatMessage[]): Promise<string | null> => {
    try {
      const apiKey = effectiveApiKey;
      const systemPrompt = buildSystemPrompt(financialContext, language);

      const contents = currentHistory.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += '\n\n' + newText;
      } else {
        contents.push({ role: 'user', parts: [{ text: newText }] });
      }

      let response;
      if (apiKey) {
        const clientModels = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.5-flash'];
        let success = false;
        for (const model of clientModels) {
          try {
            response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  system_instruction: {
                    parts: [{ text: systemPrompt }]
                  },
                  contents: contents,
                  generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                  }
                }),
                signal: AbortSignal.timeout(5000)
              }
            );
            if (response.ok) {
              success = true;
              break;
            }
          } catch (e) {
            console.error(`Client-side model ${model} fetch failed:`, e);
          }
        }

        if (!success) {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemPrompt }]
                },
                contents: contents
              })
            }
          );
        }
      } else {
        const isGitHubPages = window.location.hostname.includes('github.io');
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiEndpoint = (isGitHubPages || isLocalhost)
          ? 'https://motazin.vercel.app/api/chat'
          : '/api/chat';

        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: contents
          })
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Gemini API error:', response.status, errData);
        if (response.status === 429) {
          return 'RATE_LIMIT_EXCEEDED';
        }
        return null;
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return reply || null;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return null;
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));

    setIsTyping(true);

    try {
      const apiReply = await callGeminiApi(text, messages);

      if (apiReply === 'RATE_LIMIT_EXCEEDED') {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: language === 'ar'
            ? '⚠️ عذراً، لقد تجاوزت الحد المسموح به للطلبات (Rate Limit 429). يرجى المحاولة لاحقاً أو إدخال مفتاح API الخاص بك في الإعدادات.'
            : '⚠️ Sorry, AI request limit exceeded (429 Rate Limit). Please try again later or add your personal API key in settings.',
          timestamp: Date.now(),
          isAi: false
        };
        const updated = [...newMessages, errorMsg];
        setMessages(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } else if (apiReply) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: apiReply,
          timestamp: Date.now(),
          isAi: true
        };
        const updated = [...newMessages, botMsg];
        setMessages(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } else {
        const localReply = findReply(text);
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: localReply,
          timestamp: Date.now(),
          isAi: false
        };
        const updated = [...newMessages, botMsg];
        setMessages(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
      const localReply = findReply(text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: localReply,
        timestamp: Date.now(),
        isAi: false
      };
      const updated = [...newMessages, botMsg];
      setMessages(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setConfirmOpen(false);
    hasSentWelcome.current = false;
  };

  const handleDeleteMessage = (id: string) => {
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    input,
    setInput,
    isTyping,
    showSettings,
    setShowSettings,
    confirmOpen,
    setConfirmOpen,
    localApiKey,
    setLocalApiKey,
    isAiAvailable,
    effectiveApiKey,
    messagesEndRef,
    inputRef,
    handleSend,
    handleClearChat,
    handleDeleteMessage,
    saveApiKey,
  };
}
