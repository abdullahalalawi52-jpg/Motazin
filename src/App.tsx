import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Calculator, CheckCircle2, XCircle, AlertCircle, ArrowRightLeft, Target, Edit2, Save, Undo2, Redo2, Globe, FileSpreadsheet, FileText, LogOut, Paperclip, Eye, FileImage, ImageIcon, Sun, Moon, Menu, Info, Mail, Phone, MapPin, Send, Heart, Shield, Zap, Clock, User as UserIcon, LayoutDashboard, Settings, FileSearch, ChevronRight } from 'lucide-react';
import { Coins } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Toaster, toast } from 'sonner';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { auth, db, googleProvider, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, query, orderBy, writeBatch, addDoc } from 'firebase/firestore';
import { useLanguage } from './i18n';
import { FileScanner as PdfScanner } from './PdfScanner';
import { DepreciationModal } from './DepreciationModal';
import { SnapshotsModal } from './SnapshotsModal';
import { calculateTotals } from './utils/accounting';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Category = 'asset' | 'liability' | 'equity';

interface Account {
  id: string;
  name: string;
  category: Category;
}

interface Impact {
  id?: string;
  accountId: string;
  amount: number;
  type?: 'debit' | 'credit';
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  impacts: Impact[];
  createdAt?: string;
  updatedAt?: string;
  isRecurring?: boolean;
  recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextRecurrenceDate?: string;
  attachmentUrl?: string;
}

// --- Constants ---
const ACCOUNTS: Account[] = [
  // Assets
  { id: 'bank', name: 'bank', category: 'asset' },
  { id: 'cash', name: 'cash', category: 'asset' },
  { id: 'current_assets', name: 'current_assets', category: 'asset' },
  { id: 'fixed_assets', name: 'fixed_assets', category: 'asset' },
  { id: 'ppe', name: 'ppe', category: 'asset' },
  { id: 'goodwill', name: 'goodwill', category: 'asset' },
  { id: 'inventory', name: 'inventory', category: 'asset' },
  { id: 'cars', name: 'cars', category: 'asset' },
  { id: 'furniture', name: 'furniture', category: 'asset' },
  { id: 'ar', name: 'ar', category: 'asset' },
  { id: 'land', name: 'land', category: 'asset' },
  { id: 'buildings', name: 'buildings', category: 'asset' },
  { id: 'equipment', name: 'equipment', category: 'asset' },
  { id: 'supplies', name: 'supplies', category: 'asset' },
  { id: 'prepaid_expenses', name: 'prepaid_expenses', category: 'asset' },
  { id: 'intangible_assets', name: 'intangible_assets', category: 'asset' },
  { id: 'investments', name: 'investments', category: 'asset' },
  // Liabilities
  { id: 'ap', name: 'ap', category: 'liability' },
  { id: 'short_term_loans', name: 'short_term_loans', category: 'liability' },
  { id: 'long_term_loans', name: 'long_term_loans', category: 'liability' },
  { id: 'borrowed_money', name: 'borrowed_money', category: 'liability' },
  { id: 'accrued_expenses', name: 'accrued_expenses', category: 'liability' },
  { id: 'unearned_revenues', name: 'unearned_revenues', category: 'liability' },
  { id: 'mortgages_payable', name: 'mortgages_payable', category: 'liability' },
  // Equity
  { id: 'capital', name: 'capital', category: 'equity' },
  { id: 'share_capital', name: 'share_capital', category: 'equity' },
  { id: 'revenue', name: 'revenue', category: 'equity' },
  { id: 'expenses', name: 'expenses', category: 'equity' },
  { id: 'drawings', name: 'drawings', category: 'equity' },
  { id: 'retained_earnings', name: 'retained_earnings', category: 'equity' },
];

const CATEGORY_LABELS: Record<Category, string> = {
  asset: 'asset',
  liability: 'liability',
  equity: 'equity',
};

const CURRENCIES = [
  { code: 'SAR', name: 'SAR', symbol: 'ر.س' },
  { code: 'OMR', name: 'OMR', symbol: 'ر.ع' },
  { code: 'USD', name: 'USD', symbol: '$' },
  { code: 'EUR', name: 'EUR', symbol: '€' },
  { code: 'GBP', name: 'GBP', symbol: '£' },
  { code: 'AED', name: 'AED', symbol: 'د.إ' },
  { code: 'KWD', name: 'KWD', symbol: 'د.ك' },
  { code: 'EGP', name: 'EGP', symbol: 'ج.م' },
];

// --- Initial Data (Prefilled with user's problem) ---
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    date: '1/2',
    description: 'بدأ محمد عمله برأس مال 100,000 ريال أودعها في البنك',
    impacts: [
      { id: 'i1_1', accountId: 'bank', amount: 100000 },
      { id: 'i1_2', accountId: 'capital', amount: 100000 },
    ],
  },
  {
    id: 't2',
    date: '2/2',
    description: 'اشترى سيارة بمبلغ 15,000 من محلات الأمل على الحساب',
    impacts: [
      { id: 'i2_1', accountId: 'cars', amount: 15000 },
      { id: 'i2_2', accountId: 'ap', amount: 15000 },
    ],
  },
  {
    id: 't3',
    date: '3/2',
    description: 'اشترى أثاث بمبلغ 10,000 ريال من محلات المطلق بشيك',
    impacts: [
      { id: 'i3_1', accountId: 'furniture', amount: 10000 },
      { id: 'i3_2', accountId: 'bank', amount: -10000 },
    ],
  },
  {
    id: 't4',
    date: '4/2',
    description: 'سدد المستحق لمحلات الأمل بشيك',
    impacts: [
      { id: 'i4_1', accountId: 'ap', amount: -15000 },
      { id: 'i4_2', accountId: 'bank', amount: -15000 },
    ],
  },
  {
    id: 't5',
    date: '5/2',
    description: 'باع أثاث بمبلغ 1000 ريال لمحلات السعادة على الحساب',
    impacts: [
      { id: 'i5_1', accountId: 'ar', amount: 1000 },
      { id: 'i5_2', accountId: 'furniture', amount: -1000 },
    ],
  },
  {
    id: 't6',
    date: '6/2',
    description: 'حصل من محلات السعادة المبلغ المستحق عليهم نقداً',
    impacts: [
      { id: 'i6_1', accountId: 'cash', amount: 1000 },
      { id: 'i6_2', accountId: 'ar', amount: -1000 },
    ],
  },
];

export default function App() {
  const { t, language, setLanguage, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('motazin_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing local transactions", e);
      }
    }
    return [];
  });

  // History State for Undo/Redo
  const [history, setHistory] = useState<Transaction[][]>(() => {
    const saved = localStorage.getItem('motazin_transactions');
    if (saved) {
      try {
        return [JSON.parse(saved)];
      } catch (e) { }
    }
    return [[]];
  });
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Currency State
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('motazin_currency') || 'OMR';
  });

  // Budget State
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('motazin_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return {
      cars: 20000,
      furniture: 12000,
      expenses: 5000
    };
  });
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);

  // PDF Scanner State
  const [isPdfScannerOpen, setIsPdfScannerOpen] = useState(false);
  const [isDepreciationModalOpen, setIsDepreciationModalOpen] = useState(false);
  const [isSnapshotsModalOpen, setIsSnapshotsModalOpen] = useState(false);

  // Gemini API State
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('motazin_gemini_api_key') || '';
  });

  // Custom Accounts State
  const [customAccounts, setCustomAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('motazin_custom_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [];
  });
  const [customAccountModalIdx, setCustomAccountModalIdx] = useState<number | null>(null);
  const [newCustomAccountName, setNewCustomAccountName] = useState('');
  const [newCustomAccountCategory, setNewCustomAccountCategory] = useState<Category>('asset');

  const allAccounts = useMemo(() => {
    return [...ACCOUNTS, ...customAccounts];
  }, [customAccounts]);

  // Document Archiving State
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDocPreviewOpen, setIsDocPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'equation' | 'income' | 'cashflow' | 'aiAdvisor' | 'imageGenerator' | 'about' | 'contact'>('equation');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track scroll position for header/nav animations
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Sync User Preferences
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.budgets) setBudgets(data.budgets);
        if (data.currency) setCurrency(data.currency);
        if (data.customAccounts) setCustomAccounts(data.customAccounts);
      } else {
        // Initialize user doc
        setDoc(userDocRef, {
          currency: 'OMR',
          budgets: { cars: 20000, furniture: 12000, expenses: 5000 },
          customAccounts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }).catch(error => {
          console.error("Error initializing user preferences:", error);
        });
      }
    }, (error) => {
      console.error("Error fetching user preferences:", error);
    });

    return unsubscribe;
  }, [user]);

  // Sync Transactions
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        txs.push({
          id: doc.id,
          date: data.date,
          description: data.description,
          impacts: data.impacts,
          createdAt: data.createdAt,
          isRecurring: data.isRecurring,
          recurrenceInterval: data.recurrenceInterval,
          nextRecurrenceDate: data.nextRecurrenceDate
        });
      });
      setTransactions(txs);

      // Initialize history on first load
      if (history.length === 1 && history[0].length === 0) {
        setHistory([txs]);
        setHistoryIndex(0);
      }
    }, (error) => {
      console.error("Error fetching transactions:", error);
    });

    return unsubscribe;
  }, [user]);

  // Helper to update transactions and history
  const updateTransactions = async (newTransactions: Transaction[], skipHistory = false) => {
    shouldCelebrateRef.current = true;
    if (!skipHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newTransactions);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }

    setTransactions(newTransactions);

    // Always save to local storage
    localStorage.setItem('motazin_transactions', JSON.stringify(newTransactions));

    if (!user) return;

    try {
      const txRef = collection(db, 'users', user.uid, 'transactions');
      const newIds = new Set(newTransactions.map(t => t.id));

      const allOps: { type: 'delete' | 'set'; ref: any; data?: any }[] = [
        ...transactions.filter(tx => !newIds.has(tx.id)).map(tx => ({
          type: 'delete' as const,
          ref: doc(txRef, tx.id)
        })),
        ...newTransactions.map(tx => ({
          type: 'set' as const,
          ref: doc(txRef, tx.id),
          data: {
            date: tx.date,
            description: tx.description,
            impacts: tx.impacts,
            attachmentUrl: tx.attachmentUrl || null,
            createdAt: tx.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isRecurring: tx.isRecurring || false,
            recurrenceInterval: tx.recurrenceInterval || null,
            nextRecurrenceDate: tx.nextRecurrenceDate || null
          }
        }))
      ];

      const CHUNK_SIZE = 500;
      for (let i = 0; i < allOps.length; i += CHUNK_SIZE) {
        const currentBatch = writeBatch(db);
        const chunk = allOps.slice(i, i + CHUNK_SIZE);
        chunk.forEach(op => {
          if (op.type === 'delete') {
            currentBatch.delete(op.ref);
          } else if (op.type === 'set' && op.data) {
            currentBatch.set(op.ref, op.data, { merge: true });
          }
        });
        await currentBatch.commit();
      }
    } catch (error) {
      console.error("Error updating transactions:", error);
      toast.error(t('errorSavingTransactions'));
    }
  };

  const addCustomAccount = async (name: string, category: Category) => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    // Check if account name already exists in default or custom accounts
    const nameExists = allAccounts.some(
      a => a.name.toLowerCase() === trimmedName.toLowerCase() ||
        t(a.name).toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      toast.error(language === 'ar' ? 'هذا الحساب موجود بالفعل!' : 'This account already exists!');
      return null;
    }

    const newId = 'custom_' + Math.random().toString(36).substr(2, 9);
    const newAccount: Account = {
      id: newId,
      name: trimmedName,
      category: category
    };

    const updated = [...customAccounts, newAccount];
    setCustomAccounts(updated);
    localStorage.setItem('motazin_custom_accounts', JSON.stringify(updated));

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          customAccounts: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Error saving custom accounts to Firebase:", error);
      }
    }

    toast.success(language === 'ar' ? 'تم إضافة الحساب الجديد بنجاح!' : 'New account added successfully!');
    return newAccount;
  };

  // Process Recurring Transactions
  useEffect(() => {
    if (!user || transactions.length === 0) return;

    let hasChanges = false;
    const newTransactions: Transaction[] = [];

    const updatedTransactions = transactions.map(tx => {
      if (tx.isRecurring && tx.nextRecurrenceDate) {
        let currentDate = new Date(tx.nextRecurrenceDate);
        const now = new Date();

        // Only process if the recurrence date is in the past or today
        if (currentDate <= now) {
          let currentTx = { ...tx };

          while (currentDate <= now) {
            hasChanges = true;

            // Generate new transaction instance
            const newTx: Transaction = {
              id: Math.random().toString(36).substr(2, 9),
              date: currentDate.toLocaleDateString('ar-SA'),
              description: currentTx.description,
              impacts: currentTx.impacts.map(i => ({ ...i, id: Math.random().toString(36).substr(2, 9) })),
              createdAt: new Date().toISOString()
            };
            newTransactions.push(newTx);

            // Calculate next date
            if (currentTx.recurrenceInterval === 'daily') currentDate.setDate(currentDate.getDate() + 1);
            else if (currentTx.recurrenceInterval === 'weekly') currentDate.setDate(currentDate.getDate() + 7);
            else if (currentTx.recurrenceInterval === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1);
            else if (currentTx.recurrenceInterval === 'yearly') currentDate.setFullYear(currentDate.getFullYear() + 1);
            else break; // Fallback to prevent infinite loop if recurrenceInterval is invalid

            currentTx.nextRecurrenceDate = currentDate.toISOString();
          }
          return currentTx;
        }
      }
      return tx;
    });

    if (hasChanges) {
      updateTransactions([...updatedTransactions, ...newTransactions]);
      toast.success(`${newTransactions.length} ${t('recurringCreated')}`);
    }
  }, [transactions, user]);

  // Form State
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTransactionFormOpen && modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  }, [isTransactionFormOpen]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [impacts, setImpacts] = useState<Omit<Impact, 'id'>[]>([
    { accountId: 'bank', amount: 0 },
    { accountId: 'capital', amount: 0 },
  ]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // --- Derived State ---
  // Determine which accounts are actually used to only show relevant columns
  const activeAccountIds = useMemo(() => {
    const ids = new Set<string>();
    transactions.forEach(t => t.impacts.forEach(i => ids.add(i.accountId)));
    return Array.from(ids);
  }, [transactions]);

  const activeAccounts = useMemo(() => {
    return allAccounts.filter(a => activeAccountIds.includes(a.id));
  }, [activeAccountIds, allAccounts]);

  const assets = activeAccounts.filter(a => a.category === 'asset');
  const liabilities = activeAccounts.filter(a => a.category === 'liability');
  const equities = activeAccounts.filter(a => a.category === 'equity');

  const totals = useMemo(() => {
    return calculateTotals(transactions as any, activeAccountIds, assets as any, liabilities as any, equities as any);
  }, [transactions, activeAccountIds, assets, liabilities, equities]);

  // --- Chart Data ---
  const assetChartData = useMemo(() => {
    return assets
      .map(a => ({ name: a.name, value: Math.max(0, totals.accounts[a.id] || 0) }))
      .filter(d => d.value > 0);
  }, [assets, totals.accounts]);

  const incomeExpenseData = useMemo(() => {
    return [
      { name: t('revenue'), amount: Math.abs(totals.accounts['revenue'] || 0) },
      { name: t('expenses'), amount: Math.abs(totals.accounts['expenses'] || 0) }
    ];
  }, [totals.accounts, t]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // --- Financial Insights & Trends ---
  const currentAssetIds = ['bank', 'cash', 'ar', 'inventory', 'supplies', 'prepaid_expenses'];
  const currentLiabilityIds = ['ap', 'short_term_loans', 'accrued_expenses', 'unearned_revenues'];

  const insights = useMemo(() => {
    const totalCurrentAssets = currentAssetIds.reduce((sum, id) => sum + (totals.accounts[id] || 0), 0);
    const totalCurrentLiabilities = currentLiabilityIds.reduce((sum, id) => sum + (totals.accounts[id] || 0), 0);

    const currentRatio = totalCurrentLiabilities !== 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
    const debtToEquity = totals.totalEquity !== 0 ? totals.totalLiabilities / totals.totalEquity : 0;
    const netProfit = (totals.accounts['revenue'] || 0) + (totals.accounts['expenses'] || 0); // Expenses are negative

    return {
      currentRatio,
      debtToEquity,
      netProfit,
    };
  }, [totals]);

  const profitTrendData = useMemo(() => {
    const monthlyData: Record<string, number> = {};

    // Sort transactions by date
    const sortedTxs = [...transactions].sort((a, b) => {
      const parseDate = (d: string) => {
        const parts = d.split(/[/\-.]/);
        if (parts.length < 2) return new Date();
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parts[2] ? (parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])) : new Date().getFullYear();
        return new Date(year, month, day || 1);
      };
      return parseDate(a.date).getTime() - parseDate(b.date).getTime();
    });

    sortedTxs.forEach(tx => {
      const parts = tx.date.split(/[/\-.]/);
      if (parts.length < 2) return;
      const month = parseInt(parts[1]);
      const year = parts[2] ? (parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])) : new Date().getFullYear();
      const key = `${year}-${month.toString().padStart(2, '0')}`;

      const impact = tx.impacts.reduce((sum, imp) => {
        if (imp.accountId === 'revenue' || imp.accountId === 'expenses') {
          return sum + imp.amount;
        }
        return sum;
      }, 0);

      monthlyData[key] = (monthlyData[key] || 0) + impact;
    });

    return Object.entries(monthlyData).map(([key, value]) => ({
      name: key,
      profit: value
    })).slice(-12); // Last 12 months
  }, [transactions]);

  // --- Confetti Celebration Effect ---
  const [showConfetti, setShowConfetti] = useState(false);
  const prevBalancedRef = useRef(totals.isBalanced);
  const shouldCelebrateRef = useRef(false);

  useEffect(() => {
    // Only celebrate if it transitions from unbalanced to balanced
    if (totals.isBalanced && !prevBalancedRef.current && transactions.length > 0 && shouldCelebrateRef.current) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      shouldCelebrateRef.current = false;
      return () => clearTimeout(timer);
    }
    prevBalancedRef.current = totals.isBalanced;
    shouldCelebrateRef.current = false;
  }, [totals.isBalanced, transactions.length]);

  // --- Budget Alerts Effect ---
  const isFirstRender = useRef(true);
  const prevTotalsRef = useRef(totals.accounts);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevTotalsRef.current = totals.accounts;
      return;
    }

    const prev = prevTotalsRef.current;
    const current = totals.accounts;

    Object.keys(current).forEach(accountId => {
      const budget = budgets[accountId];
      if (!budget || budget <= 0) return;

      const oldSpent = Math.abs(prev[accountId] || 0);
      const newSpent = Math.abs(current[accountId] || 0);
      const accountName = allAccounts.find(a => a.id === accountId)?.name || '';

      const oldPercentage = oldSpent / budget;
      const newPercentage = newSpent / budget;

      if (newPercentage > 1 && oldPercentage <= 1) {
        toast.error(`${t('budgetExceededAlert')} "${t(accountName)}"!`);
      } else if (newPercentage >= 0.85 && newPercentage <= 1 && oldPercentage < 0.85) {
        toast.warning(`${t('budgetWarningAlert')} "${t(accountName)}".`);
      }
    });

    prevTotalsRef.current = current;
  }, [totals.accounts, budgets]);

  // --- Unsaved Changes Warning ---
  useEffect(() => {
    const hasUnsavedTransaction = description.trim() !== '' || date.trim() !== '' || impacts.some(i => i.amount !== 0) || editingTransactionId !== null;
    const hasUnsavedChanges = hasUnsavedTransaction || isEditingBudgets;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [description, date, impacts, editingTransactionId, isEditingBudgets]);

  // --- Handlers ---
  const handleAddImpact = () => {
    setImpacts([...impacts, { accountId: 'cash', amount: 0 }]);
  };

  const handleRemoveImpact = (index: number) => {
    setImpacts(impacts.filter((_, i) => i !== index));
  };

  const handleImpactChange = (index: number, field: keyof Omit<Impact, 'id'>, value: string | number) => {
    const newImpacts = [...impacts];
    newImpacts[index] = { ...newImpacts[index], [field]: value };
    setImpacts(newImpacts);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return alert(t('enterDescription'));

    // Filter out zero impacts
    const validImpacts = impacts.filter(i => i.amount !== 0);
    if (validImpacts.length === 0) return alert(t('enterValidAmount'));

    const uploadFile = async (txId: string) => {
      if (!selectedFile || !user) return null;
      const fileRef = ref(storage, `users/${user.uid}/documents/${txId}/${selectedFile.name}`);
      const snapshot = await uploadBytes(fileRef, selectedFile);
      return await getDownloadURL(snapshot.ref);
    };

    const nextDate = isRecurring ? (() => {
      const d = new Date();
      if (recurrenceInterval === 'daily') d.setDate(d.getDate() + 1);
      if (recurrenceInterval === 'weekly') d.setDate(d.getDate() + 7);
      if (recurrenceInterval === 'monthly') d.setMonth(d.getMonth() + 1);
      if (recurrenceInterval === 'yearly') d.setFullYear(d.getFullYear() + 1);
      return d.toISOString();
    })() : undefined;

    if (editingTransactionId) {
      const txId = editingTransactionId;
      const attachmentUrl = await uploadFile(txId);
      const updatedTransactions = transactions.map(tx => {
        if (tx.id === editingTransactionId) {
          return {
            ...tx,
            date: date || new Date().toLocaleDateString('ar-SA'),
            description,
            impacts: validImpacts.map(i => ({ ...i, id: Math.random().toString(36).substr(2, 9) })),
            isRecurring,
            recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
            nextRecurrenceDate: isRecurring ? (tx.nextRecurrenceDate || nextDate) : undefined,
            attachmentUrl: attachmentUrl || tx.attachmentUrl
          };
        }
        return tx;
      });
      updateTransactions(updatedTransactions);
      setEditingTransactionId(null);
    } else {
      const txId = Math.random().toString(36).substr(2, 9);
      const attachmentUrl = await uploadFile(txId);
      const newTx: Transaction = {
        id: txId,
        date: date || new Date().toLocaleDateString('ar-SA'),
        description,
        impacts: validImpacts.map(i => ({ ...i, id: Math.random().toString(36).substr(2, 9) })),
        createdAt: new Date().toISOString(),
        isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
        nextRecurrenceDate: isRecurring ? nextDate : undefined,
        attachmentUrl: attachmentUrl || undefined
      };
      updateTransactions([...transactions, newTx]);
    }

    // Reset form
    setSelectedFile(null);
    setDate('');
    setDescription('');
    setImpacts([
      { accountId: 'bank', amount: 0 },
      { accountId: 'capital', amount: 0 },
    ]);
    setIsRecurring(false);
    setRecurrenceInterval('monthly');
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransactionId(tx.id);
    setDate(tx.date);
    setDescription(tx.description);
    setImpacts(tx.impacts.map(i => ({ accountId: i.accountId, amount: i.amount })));
    setIsRecurring(tx.isRecurring || false);
    setRecurrenceInterval(tx.recurrenceInterval || 'monthly');
    setIsTransactionFormOpen(true);
    if (window.innerWidth > 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingTransactionId(null);
    setDate('');
    setDescription('');
    setImpacts([
      { accountId: 'bank', amount: 0 },
      { accountId: 'capital', amount: 0 },
    ]);
    setIsRecurring(false);
    setRecurrenceInterval('monthly');
  };

  const handleDeleteTransaction = (id: string) => {
    updateTransactions(transactions.filter(t => t.id !== id));
    if (selectedTransactions.has(id)) {
      const newSelected = new Set(selectedTransactions);
      newSelected.delete(id);
      setSelectedTransactions(newSelected);
    }
  };

  const handleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTransactions.size === 0) return;
    if (confirm(t('confirmDeleteMultiple'))) {
      const remainingTransactions = transactions.filter(t => !selectedTransactions.has(t.id));
      updateTransactions(remainingTransactions);
      setSelectedTransactions(new Set());
    }
  };

  const handleClearAll = () => {
    if (confirm(t('confirmClearAll'))) {
      updateTransactions([]);
      setSelectedTransactions(new Set());
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      updateTransactions(history[newIndex], true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      updateTransactions(history[newIndex], true);
    }
  };

  const handleSaveBudgets = async () => {
    setIsEditingBudgets(false);
    localStorage.setItem('motazin_budgets', JSON.stringify(budgets));

    if (!user) {
      toast.success(t('budgetSavedSuccess'));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid), {
        budgets,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success(t('budgetSavedSuccess'));
    } catch (error) {
      console.error("Error saving budgets:", error);
      toast.error(t('budgetSaveError'));
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('motazin_currency', newCurrency);

    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        currency: newCurrency,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving currency:", error);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      t('date'),
      t('description'),
      ...assets.map(a => t(a.name)),
      ...liabilities.map(a => t(a.name)),
      ...equities.map(a => t(a.name))
    ];

    const rows = transactions.map(tx => {
      return [
        tx.date,
        `"${tx.description.replace(/"/g, '""')}"`, // Escape quotes
        ...assets.map(a => getImpactAmount(tx, a.id)),
        ...liabilities.map(a => getImpactAmount(tx, a.id)),
        ...equities.map(a => getImpactAmount(tx, a.id))
      ];
    });

    const totalsRow = [
      '',
      t('grandTotal'),
      ...assets.map(a => totals.accounts[a.id]),
      ...liabilities.map(a => totals.accounts[a.id]),
      ...equities.map(a => totals.accounts[a.id])
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      totalsRow.join(',')
    ].join('\n');

    // Add UTF-8 BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const tableElement = document.getElementById('transactions-table');
    if (!tableElement) return;

    try {
      // Temporarily remove max-height on original element to calculate correct dimensions
      const originalMaxHeight = tableElement.style.maxHeight;
      const originalOverflow = tableElement.style.overflow;
      tableElement.style.maxHeight = 'none';
      tableElement.style.overflow = 'visible';

      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(tableElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        logging: false,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const clonedTable = clonedDoc.getElementById('transactions-table');
          if (clonedTable) {
            clonedTable.style.maxHeight = 'none';
            clonedTable.style.overflow = 'visible';
            // Hide selection column and actions column in PDF
            const rows = clonedTable.querySelectorAll('tr');
            rows.forEach(row => {
              const lastCell = row.lastElementChild;
              if (lastCell) (lastCell as HTMLElement).style.display = 'none';
              const firstCell = row.firstElementChild;
              if (firstCell) (firstCell as HTMLElement).style.display = 'none';
            });
          }
        }
      });

      // Restore original styles
      tableElement.style.maxHeight = originalMaxHeight;
      tableElement.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'px', [canvas.width / 2, canvas.height / 2]);

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save('transactions.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(t('errorExportingPDF'));
    }
  };

  // --- Render Helpers ---
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    const curr = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
    return `${formatted} ${curr.symbol}`;
  };

  const getImpactAmount = (tx: Transaction, accountId: string) => {
    const impact = tx.impacts.find(i => i.accountId === accountId);
    if (!impact) return 0;
    if (impact.type) {
      const account = allAccounts.find(a => a.id === accountId);
      const isCredit = impact.type === 'credit';
      if (account) {
        if (account.category === 'asset') {
          return isCredit ? -impact.amount : impact.amount;
        } else {
          return isCredit ? impact.amount : -impact.amount;
        }
      }
      return impact.amount;
    }
    return impact.amount;
  };

  const renderAccountOptions = () => (
    <>
      <option value="NEW_CUSTOM_ACCOUNT" className="dark:text-indigo-400 text-indigo-600 font-extrabold text-sm">
        {language === 'ar' ? '+ إضافة حساب جديد...' : '+ Add Custom Account...'}
      </option>
      <optgroup label={t('assets')} className="dark:bg-slate-900 bg-slate-100 font-black text-[10px] uppercase text-indigo-400">
        {allAccounts.filter(a => a.category === 'asset').map(a => (
          <option key={a.id} value={a.id} className="dark:text-white text-slate-900 font-bold">{t(a.name)}</option>
        ))}
      </optgroup>
      <optgroup label={t('liabilities')} className="dark:bg-slate-900 bg-slate-100 font-black text-[10px] uppercase text-amber-400">
        {allAccounts.filter(a => a.category === 'liability').map(a => (
          <option key={a.id} value={a.id} className="dark:text-white text-slate-900 font-bold">{t(a.name)}</option>
        ))}
      </optgroup>
      <optgroup label={t('equity')} className="dark:bg-slate-900 bg-slate-100 font-black text-[10px] uppercase text-emerald-400">
        {allAccounts.filter(a => a.category === 'equity').map(a => (
          <option key={a.id} value={a.id} className="dark:text-white text-slate-900 font-bold">{t(a.name)}</option>
        ))}
      </optgroup>
    </>
  );

  if (!isAuthReady) {
    return (
      <div className="min-h-screen w-full flex flex-col p-4 md:p-8 space-y-6 select-none overflow-hidden">
        {/* Header Skeleton */}
        <div className="glass rounded-[2rem] p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
            <div className="space-y-2">
              <div className="w-32 h-6 bg-slate-300/40 dark:bg-slate-700/40 rounded-md animate-shimmer" />
              <div className="w-20 h-3 bg-slate-300/40 dark:bg-slate-700/40 rounded-md animate-shimmer" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block w-24 h-10 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
            <div className="w-10 h-10 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
            <div className="hidden md:block w-32 h-10 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
          </div>
        </div>

        {/* Navigation Tabs Skeleton */}
        <div className="hidden md:flex justify-center w-full">
          <div className="glass p-2 rounded-[2rem] flex items-center gap-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-28 h-10 bg-slate-300/40 dark:bg-slate-700/40 rounded-full animate-shimmer" />
            ))}
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 flex-grow">
          {/* Left Column Skeleton */}
          <div className="col-span-1 md:col-span-5 space-y-6">
            <div className="glass-card p-6 space-y-6 animate-pulse">
              <div className="w-1/2 h-6 bg-slate-300/40 dark:bg-slate-700/40 rounded-md animate-shimmer" />
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 h-12 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
                <div className="col-span-2 h-12 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
              </div>
              <div className="h-20 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
              <div className="h-12 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
              <div className="h-28 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
              <div className="h-14 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="col-span-1 md:col-span-7">
            <div className="glass-card p-6 h-full space-y-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-16 h-8 bg-slate-300/40 dark:bg-slate-700/40 rounded-xl animate-shimmer" />
                  <div className="w-24 h-8 bg-slate-300/40 dark:bg-slate-700/40 rounded-xl animate-shimmer" />
                </div>
                <div className="w-24 h-8 bg-slate-300/40 dark:bg-slate-700/40 rounded-xl animate-shimmer" />
              </div>
              <div className="space-y-4">
                <div className="h-12 bg-slate-300/40 dark:bg-slate-700/40 rounded-xl animate-shimmer" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-slate-300/40 dark:bg-slate-700/40 rounded-2xl animate-shimmer" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const navItems = [
    { id: 'equation', label: t('balanceSheet'), icon: Calculator, color: 'indigo' },
    { id: 'income', label: t('incomeStatement'), icon: FileText, color: 'indigo' },
    { id: 'cashflow', label: t('cashFlowStatement'), icon: ArrowRightLeft, color: 'indigo' },
    { id: 'aiAdvisor', label: t('aiAdvisor'), icon: UserIcon, color: 'indigo' },
    { id: 'imageGenerator', label: t('imageGenerator'), icon: ImageIcon, color: 'indigo' },
    { id: 'about', label: t('aboutUs'), icon: Info, color: 'emerald' },
    { id: 'contact', label: t('contactUs'), icon: Mail, color: 'emerald' },
  ];

  return (
    <>
      <div className="relative w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-10 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        <Toaster position="top-center" richColors theme={theme === 'system' ? 'system' : theme} dir={dir} />

        {/* Header */}
        {/* Header */}
        <header className={cn(
          "sticky top-2 md:top-4 z-40 transition-all duration-500 px-2 md:px-0",
          isScrolled ? "md:translate-y-0" : "md:translate-y-2"
        )}>
          <div className="glass w-full rounded-[2rem] md:rounded-[2.5rem] p-2.5 md:px-4 lg:px-6 md:py-3 shadow-xl md:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border dark:border-white/10 border-slate-200/50 flex items-center justify-between max-w-[1850px] mx-auto backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl border border-white/20 shadow-lg group transition-all hover:scale-105">
                <Calculator className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black dark:text-white text-black tracking-tight leading-tight">{t('appTitle')}</h1>
                <p className="text-[9px] sm:text-[13px] font-black dark:text-indigo-400 text-indigo-600 uppercase tracking-widest">{t('appSubtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2.5 dark:text-white text-black dark:hover:bg-white/10 hover:bg-slate-200/50 rounded-2xl transition-all"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <XCircle className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="hidden md:flex items-center gap-1.5 lg:gap-3">
                {/* Language Switcher */}
                <div className="relative" ref={langRef}>
                  <button
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="flex items-center gap-2 pl-3 lg:pl-9 pr-3 lg:pr-4 py-2.5 dark:bg-white/5 bg-slate-100/80 hover:bg-white/10 dark:border-white/10 border-slate-200 rounded-2xl text-[13px] font-black dark:text-white/90 text-black transition-all shadow-sm group"
                  >
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="hidden lg:inline-block">{language === 'ar' ? 'العربية' : language === 'en' ? 'English' : language === 'fr' ? 'Français' : language === 'es' ? 'Español' : language === 'tr' ? 'Türkçe' : language === 'ur' ? 'اردو' : language === 'ja' ? '日本語' : language === 'zh' ? '中文' : language === 'ru' ? 'Русский' : language === 'pt' ? 'Português' : 'English'}</span>
                  </button>

                  {isLangOpen && (
                    <div className="absolute top-full left-0 mt-2 w-40 glass dark:bg-slate-900/95 bg-white/95 rounded-2xl border dark:border-white/10 border-slate-200 shadow-2xl z-50 overflow-hidden animate-scale-in origin-top-left py-1">
                      {[
                        { id: 'ar', label: 'العربية' },
                        { id: 'en', label: 'English' },
                        { id: 'fr', label: 'Français' },
                        { id: 'es', label: 'Español' },
                        { id: 'tr', label: 'Türkçe' },
                        { id: 'ur', label: 'اردو' },
                        { id: 'ja', label: '日本語' },
                        { id: 'zh', label: '中文' },
                        { id: 'ru', label: 'Русский' },
                        { id: 'pt', label: 'Português' }
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => {
                            setLanguage(lang.id as any);
                            setIsLangOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 text-right text-[13px] font-black transition-colors hover:bg-indigo-500/10",
                            language === lang.id ? "text-indigo-500 bg-indigo-500/5" : "dark:text-white/80 text-slate-700"
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2.5 dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-200 rounded-2xl transition-all group"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                </button>

                {/* User Profile Area */}
                <div className="flex items-center gap-3 dark:bg-white/5 bg-slate-100 px-3 py-1.5 rounded-2xl border dark:border-white/5 border-slate-200">
                  <div className="relative">
                    {user ? (
                      <img src={user.photoURL || ''} alt="Profile" className="w-8 h-8 rounded-full ring-2 ring-indigo-500" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-indigo-400" />
                      </div>
                    )}
                  </div>
                  {user ? (
                    <button onClick={() => signOut(auth)} className="text-rose-400 hover:text-rose-500 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => signInWithPopup(auth, googleProvider)} className="text-[11px] font-black uppercase text-indigo-400">
                      {t('login')}
                    </button>
                  )}
                </div>

                {/* Currency Switcher */}
                <div className="relative" ref={currencyRef}>
                  <button
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    className="flex items-center gap-2 pl-3 lg:pl-9 pr-3 lg:pr-4 py-2.5 dark:bg-white/5 bg-slate-100/80 border dark:border-white/10 border-slate-200 rounded-2xl text-[13px] font-black dark:text-white/90 text-black"
                  >
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span className="hidden lg:inline-block">{CURRENCIES.find(c => c.code === currency)?.symbol}</span>
                  </button>
                  {isCurrencyOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 glass dark:bg-slate-900/95 bg-white/95 rounded-2xl border dark:border-white/10 border-slate-200 shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto animate-scale-in origin-top-right">
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => { handleCurrencyChange(c.code); setIsCurrencyOpen(false); }}
                          className={cn(
                            "w-full px-4 py-2.5 text-right text-[13px] font-black transition-colors hover:bg-emerald-500/10",
                            currency === c.code ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "dark:text-white/80 text-slate-700"
                          )}
                        >
                          {c.name} ({c.symbol})
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-8 w-px dark:bg-white/5 bg-slate-200 mx-1"></div>

                <div className="flex items-center gap-1 dark:bg-black/20 bg-slate-100 p-1 rounded-xl border dark:border-white/5 border-slate-200 text-black dark:text-white">
                  <button onClick={handleUndo} disabled={historyIndex === 0} className="p-2 disabled:opacity-20"><Undo2 className="w-4 h-4" /></button>
                  <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-2 disabled:opacity-20"><Redo2 className="w-4 h-4" /></button>
                </div>
                <button onClick={handleClearAll} className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <div className={cn(
          "fixed inset-0 z-[250] md:hidden transition-all duration-300",
          isMobileMenuOpen ? "visible" : "invisible"
        )}>
          {/* Backdrop */}
          <div
            className={cn(
              "absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-500",
              isMobileMenuOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className={cn(
            "fixed top-0 bottom-0 w-[85%] max-w-xs dark:bg-slate-900/95 bg-white/95 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[260] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col overflow-hidden",
            language === 'ar'
              ? (isMobileMenuOpen ? "right-0 rounded-l-[2.5rem]" : "-right-full rounded-l-none")
              : (isMobileMenuOpen ? "left-0 rounded-r-[2.5rem]" : "-left-full rounded-r-none")
          )} dir={dir} style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>
            {/* Header Area */}
            <div className="flex items-center justify-between p-6 border-b dark:border-white/10 border-slate-100 bg-slate-50/50 dark:bg-white/[0.02]">
              <h2 className="text-xl font-black dark:text-white text-slate-900 uppercase tracking-tight">{t('menu') || 'Menu'}</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 text-slate-400 hover:text-rose-500 transition-all bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border dark:border-white/10 border-slate-200 shadow-sm"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-12 space-y-8">
              {/* Profile in mobile menu */}
              <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-700/5 rounded-2xl border border-indigo-500/20 shadow-inner">
                <div className="relative">
                  {user ? (
                    <img src={user.photoURL || ''} alt="Profile" className="w-14 h-14 rounded-full border-2 border-indigo-500 shadow-lg" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center border-2 border-indigo-500 shadow-lg">
                      <UserIcon className="w-7 h-7 text-indigo-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 dark:border-slate-900 border-white rounded-full"></div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-base font-black dark:text-white text-slate-900 truncate">{user ? user.displayName : t('guestUser')}</p>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">{user ? 'PRO ACCOUNT' : 'OFFLINE MODE'}</p>
                </div>
              </div>

              {/* Navigation Menu Mobile */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('navigation') || 'Navigation'}</p>
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id as any);
                          setIsMobileMenuOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border",
                          isActive
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                            : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/80 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10"
                        )}
                      >
                        <div className={cn("p-2 rounded-xl", isActive ? "bg-white/20" : "bg-indigo-500/10")}>
                          <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-indigo-500")} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions Mobile */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('quickActions') || 'Quick Actions'}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { setIsPdfScannerOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/80 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <div className="p-2 rounded-xl bg-indigo-500/10">
                      <FileSearch className="w-5 h-5 text-indigo-500" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">{t('scanPDF')}</span>
                  </button>
                  <button
                    onClick={() => { setIsSnapshotsModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/80 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                      <Clock className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">{t('backups')}</span>
                  </button>
                </div>
              </div>

              {/* Theme Toggle Mobile */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('appearance') || 'Appearance'}</p>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 transition-all active:scale-95 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-amber-500/10 rounded-xl">
                      {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-amber-500" />}
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest dark:text-white/80 text-slate-700">{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
                  </div>
                  <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full relative">
                    <div className={cn(
                      "absolute top-1 w-3 h-3 rounded-full transition-all duration-300",
                      theme === 'dark' ? "right-1 bg-indigo-400" : "left-1 bg-white"
                    )}></div>
                  </div>
                </button>
              </div>

              {/* Language Selector Mobile */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('language') || 'Language'}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ar', label: 'عربي' },
                    { id: 'en', label: 'EN' },
                    { id: 'fr', label: 'FR' },
                    { id: 'es', label: 'ES' },
                    { id: 'tr', label: 'TR' },
                    { id: 'ur', label: 'UR' },
                    { id: 'ja', label: 'JA' },
                    { id: 'zh', label: 'ZH' },
                    { id: 'ru', label: 'RU' },
                    { id: 'pt', label: 'PT' }
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setLanguage(lang.id as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "px-2 py-2.5 rounded-xl text-[10px] font-black border transition-all",
                        language === lang.id
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/60 text-slate-600"
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Selector Mobile */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('currency') || 'Currency'}</p>
                <div className="grid grid-cols-3 gap-2">
                  {CURRENCIES.slice(0, 9).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        handleCurrencyChange(c.code);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "px-1 py-2.5 rounded-xl text-[10px] font-black border transition-all",
                        currency === c.code
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/60 text-slate-600"
                      )}
                    >
                      {c.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Area */}
            <div className="p-6 pb-12 sm:pb-6 border-t dark:border-white/10 border-slate-100 bg-slate-50/50 dark:bg-white/[0.02] pb-safe">
              {user ? (
                <button
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center justify-between p-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl font-black transition-all active:scale-95 group border border-rose-500/20"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm uppercase tracking-widest">{t('logout')}</span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", language === 'ar' ? "rotate-180" : "")} />
                </button>
              ) : (
                <button
                  onClick={() => signInWithPopup(auth, googleProvider)}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {t('login') || 'Sign in with Google'}
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Desktop Navigation Tabs */}
        <div className={cn(
          "sticky z-30 transition-all duration-500 ease-in-out px-4 hidden md:flex",
          isScrolled ? "top-[1.5rem]" : "top-[100px]",
          "justify-center w-full mb-8"
        )}>
          <div className={cn(
            "glass p-1.5 rounded-[2rem] border transition-all duration-500 shadow-2xl flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full",
            isScrolled
              ? "dark:bg-slate-900/90 bg-white/90 dark:border-white/20 border-slate-300 scale-95 shadow-indigo-500/10"
              : "dark:bg-slate-800/60 bg-white/60 dark:border-white/10 border-slate-200"
          )}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const activeColor = item.color === 'emerald' ? 'bg-emerald-600' : 'bg-indigo-600';
              const iconColor = item.color === 'emerald' ? 'text-emerald-400' : 'text-indigo-400';

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as any);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-[12px] font-bold transition-all uppercase tracking-widest flex items-center gap-2 whitespace-nowrap group/tab relative",
                    isActive
                      ? "text-white"
                      : "dark:text-slate-400 text-slate-500 hover:dark:text-white hover:text-slate-900"
                  )}
                >
                  {isActive && (
                    <div className={cn(
                      "absolute inset-0 rounded-full z-0 animate-in fade-in zoom-in duration-300",
                      activeColor,
                      item.color === 'emerald' ? "shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    )} />
                  )}
                  <Icon className={cn("w-4 h-4 relative z-10 transition-transform group-hover/tab:scale-110", isActive ? "text-white" : iconColor)} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Removed redundant Mobile Bottom Navigation from here */}

        {/* Sticky Mobile Summary Bar - Compact version */}
        <div className="md:hidden sticky top-[76px] z-30 px-4 py-3 animate-fade-in pointer-events-none">
          <div className="mx-auto max-w-sm pointer-events-auto dark:bg-slate-900/80 bg-white/80 backdrop-blur-xl border dark:border-white/20 border-slate-300/50 rounded-full flex justify-between items-center px-5 py-2.5 shadow-xl shadow-indigo-500/10">
            <div className="flex gap-5">
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black text-indigo-500 dark:text-indigo-400 tracking-widest mb-0.5">{t('assets')}</span>
                <span className="text-xs font-black dark:text-white text-slate-900 leading-none">{formatCurrency(totals.totalAssets)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black text-emerald-500 dark:text-emerald-400 tracking-widest mb-0.5">{t('equity')}</span>
                <span className="text-xs font-black dark:text-white text-slate-900 leading-none">{formatCurrency(totals.totalEquity)}</span>
              </div>
            </div>
            <div className={cn(
              "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
              totals.isBalanced ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-rose-500 text-white shadow-rose-500/30"
            )}>
              {totals.isBalanced ? t('equationBalanced') : t('equationUnbalanced')}
            </div>
          </div>
        </div>

        <main className="pb-32 md:pb-8 md:mb-0">
          {currentView === 'equation' ? (
            <div className="animate-scale-in space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">

                {/* Left Column: Form & Status Dashboard - Hidden on mobile to avoid redundancy */}
                <div className="hidden md:block xl:col-span-4 space-y-6 animate-fade-in [animation-delay:400ms]">
                  <div className="glass-card p-6 border-t-4 border-indigo-500 shadow-2xl">
                    <h2 className="text-xl font-bold text-theme-primary mb-6 flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-xl">
                        {editingTransactionId ? (
                          <Edit2 className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Plus className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                      {editingTransactionId ? t('editTransaction') : t('addNewTransaction')}
                    </h2>

                    <form onSubmit={handleAddTransaction} className="space-y-6">
                      {/* Date & Description Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="col-span-1">
                          <label htmlFor="dt-tx-date" className="block text-[11px] font-bold uppercase tracking-widest mb-2 ml-1 text-theme-muted">{t('date')}</label>
                          <input
                            id="dt-tx-date"
                            name="dt-date"
                            type="text"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            placeholder={t('exampleDate')}
                            className="w-full glass-input px-4 py-3 text-sm font-bold focus:border-indigo-500/50 transition-all outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label htmlFor="dt-tx-desc" className="block text-[11px] font-bold uppercase tracking-widest mb-2 ml-1 text-theme-muted">{t('description')}</label>
                          <input
                            id="dt-tx-desc"
                            name="dt-description"
                            type="text"
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={t('exampleDesc')}
                            className="w-full glass-input px-4 py-3 text-sm font-bold focus:border-indigo-500/50 transition-all outline-none"
                          />
                        </div>
                      </div>

                      {/* Document Attachment Section */}
                      <div className="space-y-2">
                        <label htmlFor="dt-tx-file" className="block text-[11px] font-bold dark:text-slate-400 text-black uppercase tracking-widest ml-1">{t('attachDocument')}</label>
                        <div className="flex items-center gap-3">
                          <label htmlFor="dt-tx-file" className="flex-1 flex items-center justify-center gap-3 px-4 py-4 bg-slate-900/40 border-2 border-white/5 border-dashed rounded-2xl hover:bg-slate-800/60 hover:border-indigo-500/30 cursor-pointer transition-all group overflow-hidden relative">
                            <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            <Paperclip className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                            <span className="text-xs text-slate-300 font-bold truncate max-w-[180px] relative z-10">
                              {selectedFile ? selectedFile.name : t('attachDocument')}
                            </span>
                            <input id="dt-tx-file" name="dt-attachment" type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                          </label>
                          {selectedFile && (
                            <button type="button" onClick={() => setSelectedFile(null)} className="p-4 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl transition-all border border-rose-500/20 group">
                              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Recurring Transaction Logic */}
                      <div className="flex flex-wrap items-center gap-4 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                        <label htmlFor="dt-tx-recurring" className="flex items-center gap-3 cursor-pointer group">
                          <input
                            id="dt-tx-recurring"
                            name="dt-isRecurring"
                            type="checkbox"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                          />
                          <span className="text-sm font-bold dark:text-white text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{t('recurringTransaction')}</span>
                        </label>

                        {isRecurring && (
                          <div className="flex items-center gap-3 animate-fade-in pl-2 border-l border-white/10">
                            <label htmlFor="dt-tx-recurrence-interval" className="text-[10px] font-bold dark:text-slate-400 text-black uppercase tracking-widest">{t('repeatsEveryLabel')}</label>
                            <select
                              id="dt-tx-recurrence-interval"
                              name="dt-recurrenceInterval"
                              value={recurrenceInterval}
                              onChange={(e) => setRecurrenceInterval(e.target.value as any)}
                              className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-white text-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <option value="daily">{t('day')}</option>
                              <option value="weekly">{t('week')}</option>
                              <option value="monthly">{t('month')}</option>
                              <option value="yearly">{t('year')}</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Account Impacts Section */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-widest ml-1 text-theme-muted">{t('impactOnAccounts')}</span>
                          <button
                            type="button"
                            onClick={handleAddImpact}
                            className="touch-target text-[10px] font-bold text-indigo-400 hover:text-white flex items-center gap-2 transition-all bg-indigo-500/10 hover:bg-indigo-500 px-4 py-2.5 rounded-xl border border-indigo-500/20 uppercase tracking-tighter"
                          >
                            <Plus className="w-4 h-4" /> {t('addAccount')}
                          </button>
                        </div>

                        <div className="space-y-4">
                          {impacts.map((impact, idx) => (
                            <div key={idx} className="glass-card p-4 sm:p-5 relative border-l-4 border-indigo-500 group transition-all hover:scale-[1.01] hover:shadow-indigo-500/10 overflow-hidden">
                              {/* Delete Impact Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveImpact(idx)}
                                disabled={impacts.length <= 2}
                                className={cn(
                                  "absolute top-2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10",
                                  dir === 'rtl' ? 'left-4' : 'right-4'
                                )}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>

                              <div className="flex flex-col gap-4">
                                {/* Account Picker */}
                                <div className="space-y-2">
                                  <label htmlFor={`dt-account-id-${idx}`} className="text-[9px] uppercase font-bold tracking-widest block ml-1 text-theme-muted">{t('accountName')}</label>
                                  <select
                                    id={`dt-account-id-${idx}`}
                                    name={`dt-accountId-${idx}`}
                                    value={impact.accountId}
                                    onChange={e => {
                                      if (e.target.value === 'NEW_CUSTOM_ACCOUNT') {
                                        setCustomAccountModalIdx(idx);
                                        setNewCustomAccountName('');
                                        setNewCustomAccountCategory('asset');
                                      } else {
                                        handleImpactChange(idx, 'accountId', e.target.value);
                                      }
                                    }}
                                    className="w-full px-4 py-3 border dark:border-white/5 border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-950/60 bg-white dark:text-white text-slate-900 font-bold cursor-pointer transition-colors"
                                  >
                                    {renderAccountOptions()}
                                  </select>
                                </div>

                                {/* Value Input Area */}
                                <div className="space-y-2">
                                  <label htmlFor={`dt-amount-input-${idx}`} className="text-[9px] uppercase font-bold tracking-widest block ml-1 text-theme-muted">{t('impactValue')}</label>
                                  {(() => {
                                    const amount = typeof impact.amount === 'number' ? impact.amount : 0;
                                    const account = allAccounts.find(a => a.id === impact.accountId);
                                    const isNeg = amount < 0 || Object.is(amount, -0);
                                    const isCredit = impact.type
                                      ? impact.type === 'credit'
                                      : (account
                                        ? (account.category === 'asset' ? isNeg : !isNeg)
                                        : isNeg);
                                    return (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Segmented Debit/Credit Control */}
                                        <div className="flex dark:bg-slate-950 bg-slate-100 p-1 rounded-2xl border dark:border-white/5 border-slate-200 w-full shadow-inner">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleImpactChange(idx, 'type', 'debit');
                                            }}
                                            className={cn(
                                              "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest",
                                              !isCredit ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]" : "dark:text-slate-500 text-slate-400 dark:hover:text-white hover:text-indigo-600"
                                            )}
                                          >
                                            {t('debit')}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleImpactChange(idx, 'type', 'credit');
                                            }}
                                            className={cn(
                                              "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest",
                                              isCredit ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-[1.02]" : "dark:text-slate-500 text-slate-400 dark:hover:text-white hover:text-indigo-600"
                                            )}
                                          >
                                            {t('credit')}
                                          </button>
                                        </div>

                                        <div className="relative group/input">
                                          <input
                                            id={`dt-amount-input-${idx}`}
                                            name={`dt-amount-${idx}`}
                                            type="number"
                                            step="any"
                                            value={amount !== 0 ? amount : ''}
                                            onChange={e => {
                                              const val = parseFloat(e.target.value) || 0;
                                              handleImpactChange(idx, 'amount', val);
                                            }}
                                            placeholder="0.00"
                                            className={cn(
                                              "w-full pl-4 pr-12 py-3 border dark:border-white/5 border-slate-200 rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right font-mono transition-all dark:bg-slate-950/80 bg-white shadow-lg",
                                              isCredit ? "dark:text-rose-400 text-rose-600 focus:border-rose-500/50" : "dark:text-emerald-400 text-emerald-600 focus:border-emerald-500/50"
                                            )}
                                            dir="ltr"
                                          />
                                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold pointer-events-none dark:opacity-50 opacity-40">
                                            {currency}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          disabled={isUploading}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group"
                        >
                          {isUploading ? (
                            <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> {t('uploading')}</>
                          ) : (
                            <>
                              {editingTransactionId ? <Save className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                              <span className="uppercase tracking-widest">{editingTransactionId ? t('saveChanges') : t('addTransaction')}</span>
                            </>
                          )}
                        </button>
                        {editingTransactionId && (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-8 bg-slate-200 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700 dark:text-white text-slate-700 font-bold py-4 rounded-2xl transition-all border border-slate-300 dark:border-white/10 uppercase tracking-widest text-xs"
                          >
                            {t('cancel')}
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Balance Equation Status Visualization */}
                  <div className={cn(
                    "rounded-[2.5rem] shadow-2xl border-2 p-8 transition-all duration-700 backdrop-blur-3xl overflow-hidden relative group/card",
                    totals.isBalanced
                      ? "dark:bg-emerald-950/20 bg-emerald-50 border-emerald-500/30 dark:shadow-[0_0_30px_rgba(16,185,129,0.12)] shadow-[0_0_20px_rgba(16,185,129,0.06)]"
                      : "dark:bg-rose-950/20 bg-rose-50 border-rose-500/30 dark:shadow-[0_0_30px_rgba(244,63,94,0.12)] shadow-[0_0_20px_rgba(244,63,94,0.06)]"
                  )}>
                    {/* Background Glow */}
                    <div className={cn(
                      "absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 rounded-full transition-all duration-1000 group-hover/card:scale-125",
                      totals.isBalanced ? "bg-emerald-500" : "bg-rose-500"
                    )}></div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                      <div className={cn(
                        "p-5 rounded-[2rem] shadow-2xl transition-all duration-500",
                        totals.isBalanced ? "bg-emerald-500/20 text-emerald-400 group-hover/card:scale-105" : "bg-rose-500/20 text-rose-400 animate-pulse-slow"
                      )}>
                        {totals.isBalanced ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                      </div>

                      <div className="flex-1 text-center md:text-left">
                        <h3 className={cn(
                          "text-2xl font-bold mb-2 tracking-tight",
                          totals.isBalanced ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {totals.isBalanced ? t('equationBalanced') : t('equationUnbalanced')}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                          <div className="dark:bg-slate-950/40 bg-white p-5 rounded-3xl border dark:border-white/5 border-slate-200 group hover:border-indigo-500/30 transition-all shadow-sm">
                            <span className="text-[10px] uppercase font-bold block mb-2 tracking-widest text-theme-muted">{t('totalAssets')}</span>
                            <span className="text-xl font-bold dark:text-white text-slate-900" dir="ltr">{formatCurrency(totals.totalAssets)}</span>
                          </div>
                          <div className="dark:bg-slate-950/40 bg-white p-5 rounded-3xl border dark:border-white/5 border-slate-200 group hover:border-indigo-500/30 transition-all shadow-sm">
                            <span className="text-[10px] uppercase font-bold block mb-2 tracking-widest text-theme-muted">{t('totalLiabilitiesEquity')}</span>
                            <span className="text-xl font-bold dark:text-white text-slate-900" dir="ltr">{formatCurrency(totals.totalLiabilities + totals.totalEquity)}</span>
                          </div>
                        </div>

                        {!totals.isBalanced && (
                          <div className="mt-6 p-5 dark:bg-rose-500/10 bg-white rounded-3xl border dark:border-rose-500/20 border-rose-200 flex flex-col sm:flex-row justify-between items-center gap-2 group hover:dark:bg-rose-500/20 hover:bg-rose-50 transition-all shadow-sm">
                            <span className="text-xs font-bold dark:text-rose-300 text-rose-500 uppercase tracking-widest">{t('difference')}</span>
                            <span className="text-2xl font-bold text-rose-400 drop-shadow-lg" dir="ltr">{formatCurrency(Math.abs(totals.totalAssets - (totals.totalLiabilities + totals.totalEquity)))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Budget Status Card */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        {t('budgetAlerts')}
                      </h2>
                      <button
                        onClick={() => isEditingBudgets ? handleSaveBudgets() : setIsEditingBudgets(true)}
                        className="dark:text-white text-slate-500 hover:text-indigo-600 transition-colors p-1"
                        title={isEditingBudgets ? t('save') : t('editBudgets')}
                      >
                        {isEditingBudgets ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="space-y-6">
                      {(['asset', 'liability', 'equity'] as Category[]).map(category => {
                        const categoryAccounts = activeAccounts.filter(a => a.category === category);
                        if (categoryAccounts.length === 0) return null;

                        const catAllocated = categoryAccounts.reduce((sum, a) => sum + (budgets[a.id] || 0), 0);
                        const catSpent = category === 'asset' ? totals.totalAssets : category === 'liability' ? totals.totalLiabilities : totals.totalEquity;
                        const absCatSpent = Math.abs(catSpent);
                        const catPercentage = catAllocated > 0 ? (absCatSpent / catAllocated) * 100 : 0;
                        const catIsOverBudget = catAllocated > 0 && absCatSpent > catAllocated;
                        const catIsApproachingBudget = catAllocated > 0 && catPercentage >= 85 && !catIsOverBudget;

                        return (
                          <div key={category} className={cn(
                            "p-5 rounded-3xl border transition-colors duration-300",
                            catIsOverBudget ? "bg-rose-50 border-rose-200" : catIsApproachingBudget ? "bg-amber-50 border-amber-200" : "bg-slate-800/20 border-white/5"
                          )}>
                            <div className="flex justify-between items-center mb-2">
                              <h3 className={cn(
                                "text-[15px] font-bold flex items-center gap-1.5",
                                catIsOverBudget ? "text-rose-800" : catIsApproachingBudget ? "text-amber-800" : "dark:text-white text-slate-900"
                              )}>
                                {t(category)}
                                {catIsOverBudget && <AlertCircle className="w-4 h-4 text-rose-500" />}
                                {catIsApproachingBudget && <AlertCircle className="w-4 h-4 text-amber-500" />}
                              </h3>
                              <span className={cn(
                                "text-sm font-medium font-bold",
                                catIsOverBudget ? "text-rose-700" : catIsApproachingBudget ? "text-amber-700" : "dark:text-white text-slate-900"
                              )} dir="ltr">
                                {formatCurrency(absCatSpent)} {catAllocated > 0 && `/ ${formatCurrency(catAllocated)}`}
                              </span>
                            </div>

                            {/* Category Progress Bar */}
                            {catAllocated > 0 && !isEditingBudgets && (
                              <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden flex mb-4">
                                <div
                                  className={cn(
                                    "h-full transition-all duration-500",
                                    catIsOverBudget ? "bg-rose-500 animate-pulse" : catIsApproachingBudget ? "bg-amber-500" : "bg-indigo-500"
                                  )}
                                  style={{ width: `${Math.min(catPercentage, 100)}%` }}
                                />
                              </div>
                            )}

                            {/* Individual Accounts */}
                            <div className={cn(
                              "space-y-3 mt-3 pt-3 border-t",
                              catIsOverBudget ? "border-rose-200/60" : catIsApproachingBudget ? "border-amber-200/60" : "border-white/10/60"
                            )}>
                              {categoryAccounts.map(account => {
                                const allocated = budgets[account.id] || 0;
                                const spent = Math.abs(totals.accounts[account.id] || 0);
                                const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
                                const isOverBudget = allocated > 0 && spent > allocated;
                                const isApproachingBudget = allocated > 0 && percentage >= 85 && !isOverBudget;

                                return (
                                  <div key={account.id} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[15px]">
                                      <span className={cn(
                                        "font-medium text-sm font-medium flex items-center gap-1",
                                        isOverBudget ? "text-rose-700" : isApproachingBudget ? "text-amber-700" : "dark:text-white text-slate-900"
                                      )}>
                                        {t(account.name)}
                                        {isOverBudget && <AlertCircle className="w-3 h-3 text-rose-500" />}
                                        {isApproachingBudget && <AlertCircle className="w-3 h-3 text-amber-500" />}
                                      </span>
                                      {isEditingBudgets ? (
                                        <input
                                          id={`budget-${account.id}`}
                                          name={`budget-${account.id}`}
                                          type="number"
                                          value={allocated || ''}
                                          onChange={(e) => setBudgets({ ...budgets, [account.id]: parseFloat(e.target.value) || 0 })}
                                          className="w-24 px-2 py-1 border border-white/20 rounded text-left text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                                          dir="ltr"
                                          placeholder="0"
                                          aria-label={`${t('budgetAlerts')} - ${t(account.name)}`}
                                        />
                                      ) : (
                                        <span className="dark:text-white text-slate-900 text-[11px]" dir="ltr">
                                          <span className={cn("font-bold", isOverBudget ? 'text-rose-600' : isApproachingBudget ? 'text-amber-600' : 'dark:text-white text-slate-900')}>
                                            {formatCurrency(spent)}
                                          </span>
                                          {allocated > 0 && ` / ${formatCurrency(allocated)}`}
                                        </span>
                                      )}
                                    </div>
                                    {!isEditingBudgets && allocated > 0 && (
                                      <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden flex">
                                        <div
                                          className={cn(
                                            "h-full transition-all duration-500",
                                            isOverBudget ? "bg-rose-500 animate-pulse" : isApproachingBudget ? "bg-amber-500" : "bg-emerald-400"
                                          )}
                                          style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Transactions List */}
                <div className="xl:col-span-8">
                  <div className="glass-card overflow-hidden flex flex-col h-full" style={{ borderRadius: '1.5rem' }}>
                    <div className="p-4 border-b dark:border-white/10 border-slate-200 dark:bg-slate-800/20 bg-slate-100/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1 dark:bg-white/5 bg-slate-100 p-1 rounded-xl border dark:border-white/10 border-slate-200">
                          <button
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            className="p-2 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 disabled:opacity-20 transition-all active:scale-90"
                            title={language === 'ar' ? "تراجع" : "Undo"}
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-2 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 disabled:opacity-20 transition-all active:scale-90"
                            title={language === 'ar' ? "إعادة التعديل المتراجع عنه" : "Redo"}
                          >
                            <Redo2 className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => setIsPdfScannerOpen(true)}
                          className="flex items-center gap-2 px-3 py-2 text-[10px] sm:text-xs font-black dark:bg-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
                          title={t('importFiles')}
                        >
                          <FileSearch className="w-4 h-4" />
                          <span>{t('scanPDF') || 'Scan PDF'}</span>
                        </button>

                        <button
                          onClick={() => setIsDepreciationModalOpen(true)}
                          className="flex items-center gap-2 px-3 py-2 text-[10px] sm:text-xs font-black dark:bg-amber-500 bg-amber-500 text-white hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20 uppercase tracking-widest"
                          title={t('depreciationCalc')}
                        >
                          <Calculator className="w-4 h-4" />
                          <span>{t('depreciationCalc')}</span>
                        </button>
                      </div>
                      {transactions.length > 0 && (
                        <div className="flex flex-wrap justify-center items-center gap-2">
                          {selectedTransactions.size > 0 && (
                            <button
                              onClick={handleBulkDelete}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-medium text-white bg-rose-600 border border-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                              title={t('deleteSelected')}
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('deleteSelected')} ({selectedTransactions.size})
                            </button>
                          )}
                          <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2.5 dark:bg-slate-800/40 bg-white dark:hover:bg-indigo-600/50 hover:bg-indigo-50 dark:text-white text-slate-900 font-bold rounded-xl border dark:border-white/10 border-slate-300 transition-all shadow-sm group"
                            title={t('exportCSV')}
                          >
                            <FileSpreadsheet className="w-5 h-5 dark:text-white text-slate-900 group-hover:text-indigo-600" />
                            <span className="sr-only sm:not-sr-only">{t('exportCSV')}</span>
                          </button>
                          <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2.5 dark:bg-slate-800/40 bg-white dark:hover:bg-rose-600/50 hover:bg-rose-50 dark:text-white text-slate-900 font-bold rounded-xl border dark:border-white/10 border-slate-300 transition-all shadow-sm group"
                            title={t('exportPDF')}
                          >
                            <FileText className="w-5 h-5 dark:text-white text-slate-900 group-hover:text-rose-600" />
                            <span className="sr-only sm:not-sr-only">PDF</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {transactions.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-transparent">
                        <div className="p-6 bg-slate-200/50 dark:bg-white/5 rounded-full mb-6 border border-slate-300 dark:border-white/10">
                          <Calculator className="w-12 h-12 text-slate-400 dark:text-white/20" />
                        </div>
                        <p className="text-lg font-black text-slate-800 dark:text-white mb-2">{t('noTransactions')}</p>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 max-w-xs">{t('addTransactionPrompt')}</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div id="transactions-table" className="hidden md:block overflow-auto flex-1 relative dark:bg-slate-800/40 bg-white">
                          <table className="w-full text-[15px] text-right border-collapse">
                            <thead className="sticky top-0 z-20 dark:text-white text-slate-800 shadow-sm ring-1 dark:ring-white/10 ring-slate-200/50">
                              {/* Category Headers */}
                              <tr className="border-b dark:border-white/10 border-slate-200 ring-1 dark:ring-white/5 ring-slate-100/50">
                                <th className="p-4 border-l dark:border-white/5 border-slate-200/50 w-10 dark:bg-slate-900/40 bg-slate-100/80 text-center">
                                  <input
                                    id="select-all-transactions"
                                    name="selectAll"
                                    type="checkbox"
                                    checked={transactions.length > 0 && selectedTransactions.size === transactions.length}
                                    onChange={handleSelectAll}
                                    className="rounded border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    aria-label={t('selectAll') || 'Select All'}
                                  />
                                </th>
                                <th className="p-4 border-l dark:border-white/5 border-slate-200/50 font-bold text-[11px] uppercase tracking-widest w-24 dark:bg-slate-900/40 bg-slate-100/80 text-center">{t('date')}</th>
                                <th className="p-4 border-l dark:border-white/5 border-slate-200/50 font-bold text-[11px] uppercase tracking-widest min-w-[200px] dark:bg-slate-900/40 bg-slate-100/80">{t('description')}</th>

                                {assets.length > 0 && (
                                  <th colSpan={assets.length} className="p-2 border-l dark:border-white/5 border-slate-200/50 font-black text-[10px] uppercase tracking-tighter text-center bg-indigo-500/10 dark:text-indigo-300 text-indigo-950">
                                    {t('assets')}
                                  </th>
                                )}

                                {liabilities.length > 0 && (
                                  <th colSpan={liabilities.length} className="p-2 border-l dark:border-white/5 border-slate-200/50 font-black text-[10px] uppercase tracking-tighter text-center bg-amber-500/10 dark:text-amber-300 text-amber-950">
                                    {t('liabilities')}
                                  </th>
                                )}

                                {equities.length > 0 && (
                                  <th colSpan={equities.length} className="p-2 border-l dark:border-white/5 border-slate-200/50 font-black text-[10px] uppercase tracking-tighter text-center bg-emerald-500/10 dark:text-emerald-300 text-emerald-950">
                                    {t('equity')}
                                  </th>
                                )}
                                <th className="p-3 w-10 dark:bg-slate-900/40 bg-slate-100/80"></th>
                              </tr>
                              {/* Account Headers */}
                              <tr className="border-b dark:border-white/5 border-slate-200/30">
                                <th className="p-2 border-l dark:border-white/5 border-slate-200/30 dark:bg-slate-900/20 bg-slate-50/50"></th>
                                <th className="p-2 border-l dark:border-white/5 border-slate-200/30 dark:bg-slate-900/20 bg-slate-50/50"></th>
                                <th className="p-2 border-l dark:border-white/5 border-slate-200/30 dark:bg-slate-900/20 bg-slate-50/50"></th>

                                {assets.map(a => (
                                  <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-indigo-400 text-indigo-900 bg-indigo-500/5">{t(a.name)}</th>
                                ))}

                                {liabilities.map(a => (
                                  <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-amber-400 text-amber-900 bg-amber-500/5">{t(a.name)}</th>
                                ))}

                                {equities.map(a => (
                                  <th key={a.id} className="p-2 border-l dark:border-white/5 border-slate-200/30 font-black text-[10px] uppercase text-center dark:text-emerald-400 text-emerald-900 bg-emerald-500/5">{t(a.name)}</th>
                                ))}
                                <th className="dark:bg-slate-900/20 bg-slate-50/50"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-white/5 divide-slate-200/60">
                              {transactions.map((tx) => (
                                <tr key={tx.id} className="dark:even:bg-white/5 even:bg-slate-100/20 dark:hover:bg-slate-700/50 hover:bg-slate-100/80 transition-colors group">
                                  <td className="p-3 border-l dark:border-white/5 border-slate-200/30 text-center">
                                    <input
                                      id={`select-tx-${tx.id}`}
                                      name={`selectTx-${tx.id}`}
                                      type="checkbox"
                                      checked={selectedTransactions.has(tx.id)}
                                      onChange={() => handleSelectTransaction(tx.id)}
                                      className="rounded border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                      aria-label={`${t('select')} ${tx.description}`}
                                    />
                                  </td>
                                  <td className="p-3 border-l dark:border-white/5 border-slate-200/30 whitespace-nowrap dark:text-white text-slate-800 text-center"><span dir="ltr" className="inline-block transform -translate-y-[3px]">{tx.date}</span></td>
                                  <td className="p-3 border-l dark:border-white/5 border-slate-200/30 dark:text-white text-slate-850">
                                    <div className="flex items-center gap-2">
                                      {tx.description}
                                      {tx.isRecurring && (
                                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700" title={`${t('repeatsEveryLabel')} ${t(tx.recurrenceInterval || 'monthly')}`}>
                                          {t('recurring')}
                                        </span>
                                      )}
                                      {tx.attachmentUrl && (
                                        <button
                                          onClick={() => {
                                            setPreviewUrl(tx.attachmentUrl || null);
                                            setIsDocPreviewOpen(true);
                                          }}
                                          className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                          title={t('viewDocument')}
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {assets.map(a => {
                                    const amt = getImpactAmount(tx, a.id);
                                    return (
                                      <td key={a.id} className="p-3 border-l dark:border-white/5 border-slate-200/30 text-center font-mono group-hover:bg-indigo-500/5 transition-colors" dir="ltr">
                                        {amt !== 0 ? (
                                          <span className={cn(
                                            "px-2 py-0.5 rounded-full font-bold text-[12px] tracking-tighter whitespace-nowrap",
                                            amt > 0 ? "bg-emerald-500/10 dark:text-emerald-400 text-emerald-700 border border-emerald-500/20" : "bg-rose-500/10 dark:text-rose-400 text-rose-700 border border-rose-500/20"
                                          )}>
                                            {formatCurrency(amt)}
                                          </span>
                                        ) : (
                                          <span className="dark:text-white text-slate-300 dark:opacity-[0.05] opacity-20">-</span>
                                        )}
                                      </td>
                                    );
                                  })}

                                  {liabilities.map(a => {
                                    const amt = getImpactAmount(tx, a.id);
                                    return (
                                      <td key={a.id} className="p-3 border-l dark:border-white/5 border-slate-200/30 text-center font-mono group-hover:bg-amber-500/5 transition-colors" dir="ltr">
                                        {amt !== 0 ? (
                                          <span className={cn(
                                            "px-2 py-0.5 rounded-full font-bold text-[12px] tracking-tighter whitespace-nowrap",
                                            amt > 0 ? "bg-emerald-500/10 dark:text-emerald-400 text-emerald-700 border border-emerald-500/20" : "bg-rose-500/10 dark:text-rose-400 text-rose-700 border border-rose-500/20"
                                          )}>
                                            {formatCurrency(amt)}
                                          </span>
                                        ) : (
                                          <span className="dark:text-white text-slate-300 dark:opacity-[0.05] opacity-20">-</span>
                                        )}
                                      </td>
                                    );
                                  })}

                                  {equities.map(a => {
                                    const amt = getImpactAmount(tx, a.id);
                                    return (
                                      <td key={a.id} className="p-3 border-l dark:border-white/5 border-slate-200/30 text-center font-mono group-hover:bg-emerald-500/5 transition-colors" dir="ltr">
                                        {amt !== 0 ? (
                                          <span className={cn(
                                            "px-2 py-0.5 rounded-full font-bold text-[12px] tracking-tighter whitespace-nowrap",
                                            amt > 0 ? "bg-emerald-500/10 dark:text-emerald-400 text-emerald-700 border border-emerald-500/20" : "bg-rose-500/10 dark:text-rose-400 text-rose-700 border border-rose-500/20"
                                          )}>
                                            {formatCurrency(amt)}
                                          </span>
                                        ) : (
                                          <span className="dark:text-white text-slate-300 dark:opacity-[0.05] opacity-20">-</span>
                                        )}
                                      </td>
                                    );
                                  })}

                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                      <button
                                        onClick={() => handleEditTransaction(tx)}
                                        className="p-1.5 dark:text-white text-slate-600 hover:text-indigo-600 dark:hover:bg-slate-800 hover:bg-slate-200/55 rounded transition-colors"
                                        title={t('editTransaction')}
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTransaction(tx.id)}
                                        className="p-1.5 dark:text-white text-slate-600 hover:text-rose-500 dark:hover:bg-slate-800 hover:bg-slate-200/55 rounded transition-colors"
                                        title={t('deleteTransaction')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            {/* Totals Row */}
                            <tfoot className="sticky bottom-0 z-20 bg-slate-900 border-t-2 dark:border-white/10 border-slate-800 font-bold shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
                              <tr>
                                <td colSpan={3} className="p-4 border-l dark:border-white/5 border-slate-800 text-left text-white/90 bg-slate-900/60 uppercase tracking-widest text-[11px]">
                                  {t('grandTotal')}
                                </td>

                                {assets.map(a => (
                                  <td key={a.id} className="p-4 border-l dark:border-white/5 border-slate-800 text-center dark:text-indigo-400 text-white font-mono bg-indigo-500/5" dir="ltr">
                                    {formatCurrency(totals.accounts[a.id])}
                                  </td>
                                ))}

                                {liabilities.map(a => (
                                  <td key={a.id} className="p-4 border-l dark:border-white/5 border-slate-800 text-center dark:text-amber-400 text-white font-mono bg-amber-500/5" dir="ltr">
                                    {formatCurrency(totals.accounts[a.id])}
                                  </td>
                                ))}

                                {equities.map(a => (
                                  <td key={a.id} className="p-4 border-l dark:border-white/5 border-slate-800 text-center dark:text-emerald-400 text-white font-mono bg-emerald-500/5" dir="ltr">
                                    {formatCurrency(totals.accounts[a.id])}
                                  </td>
                                ))}
                                <td className="bg-slate-900/60"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Mobile Card View - Enhanced Design */}
                        <div className="md:hidden flex flex-col gap-5 responsive-px py-6 bg-slate-50/50 dark:bg-slate-950/20">
                          {transactions.map((tx) => (
                            <div key={tx.id} className="mobile-card !mb-0 group overflow-hidden border dark:border-white/10 border-slate-200 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/60 dark:shadow-none p-5 rounded-[2rem]">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-start gap-4">
                                  <div className="relative mt-1">
                                    <input
                                      id={`mob-select-tx-${tx.id}`}
                                      name={`mob-selectTx-${tx.id}`}
                                      type="checkbox"
                                      checked={selectedTransactions.has(tx.id)}
                                      onChange={() => handleSelectTransaction(tx.id)}
                                      className="rounded-lg border-slate-300 dark:border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-6 h-6 transition-all"
                                      aria-label={`${t('select')} ${tx.description}`}
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.15em] mb-1.5" dir="ltr">{tx.date}</span>
                                    <p className="text-[16px] font-black dark:text-white text-slate-900 leading-snug">{tx.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleEditTransaction(tx)}
                                    className="p-3 dark:text-indigo-400 text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all active:scale-90"
                                    title={t('editTransaction')}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 py-4 border-t dark:border-white/10 border-slate-100">
                                {tx.impacts.map((imp, i) => (
                                  <div key={i} className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm",
                                    imp.amount > 0
                                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                                      : "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20"
                                  )}>
                                    <span className={cn(
                                      "text-[11px] font-bold",
                                      imp.amount > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                                    )}>
                                      {t(ACCOUNTS.find(a => a.id === imp.accountId)?.name || '')}
                                    </span>
                                    <div className={cn("w-1 h-1 rounded-full", imp.amount > 0 ? "bg-emerald-400" : "bg-rose-400")}></div>
                                    <span className={cn(
                                      "font-black font-mono text-[12px]",
                                      imp.amount > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                                    )} dir="ltr">
                                      {formatCurrency(imp.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center gap-2 mt-1">
                                {tx.attachmentUrl && (
                                  <button
                                    onClick={() => {
                                      setPreviewUrl(tx.attachmentUrl || null);
                                      setIsDocPreviewOpen(true);
                                    }}
                                    className="flex-1 py-3 flex items-center justify-center gap-2 rounded-2xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 border-slate-200 text-[10px] font-black uppercase tracking-widest dark:text-indigo-400 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-sm"
                                  >
                                    <Eye className="w-4 h-4" />
                                    {t('viewAttachment') || 'View Attachment'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  className="p-3 dark:text-rose-400 text-rose-600 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-2xl transition-all active:scale-90 border border-rose-500/20 shadow-sm"
                                  title={t('deleteTransaction')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Final Equation Summary */}
                    {transactions.length > 0 && (
                      <div className="dark:bg-slate-900/60 bg-slate-50/90 backdrop-blur-md border-t dark:border-white/10 border-slate-200 dark:text-white text-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 font-mono text-lg animate-fade-in">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium dark:text-white text-slate-600 font-sans mb-1">{t('assets')}</span>
                          <span className="dark:text-indigo-300 text-indigo-600 font-bold">{formatCurrency(totals.totalAssets)}</span>
                        </div>
                        <span className="dark:text-white text-slate-400">=</span>
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium dark:text-white text-slate-600 font-sans mb-1">{t('liabilities')}</span>
                          <span className="dark:text-amber-300 text-amber-600 font-bold">{formatCurrency(totals.totalLiabilities)}</span>
                        </div>
                        <span className="dark:text-white text-slate-400">+</span>
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium dark:text-white text-slate-600 font-sans mb-1">{t('equity')}</span>
                          <span className="dark:text-emerald-300 text-emerald-600 font-bold">{formatCurrency(totals.totalEquity)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              {mounted && transactions.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in" style={{ minWidth: 0 }}>
                  {/* Asset Distribution Pie Chart */}
                  <div className="glass-card p-6" style={{ minWidth: 0 }}>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-theme-primary">
                      <Target className="w-5 h-5 text-indigo-600" />
                      {t('assetDistribution')}
                    </h2>
                    <div className="h-[300px] md:h-[350px] w-full relative" style={{ minWidth: 0, minHeight: 0 }}>
                      {assetChartData.length > 0 ? (
                        <ResponsiveContainer id="asset-distribution-chart" width="100%" height={window.innerWidth < 768 ? 300 : 350}>
                          <PieChart>
                            <Pie
                              data={assetChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {assetChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency }).format(value)}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center dark:text-white text-black font-bold italic">
                          {t('noAssets')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Income vs Expenses Bar Chart */}
                  <div className="glass-card p-6" style={{ minWidth: 0 }}>
                    <h2 className="text-lg font-semibold dark:text-white text-slate-800 mb-6 flex items-center gap-2">
                      <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                      {t('incomeExpenses')}
                    </h2>
                    <div className="h-[300px] md:h-[350px] w-full relative" style={{ minWidth: 0, minHeight: 0 }}>
                      {incomeExpenseData.some(d => d.amount > 0) ? (
                        <ResponsiveContainer id="income-expense-chart" width="100%" height={window.innerWidth < 768 ? 300 : 350}>
                          <BarChart data={incomeExpenseData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#000000', fontSize: 13, fontWeight: 900, dy: -5 }} />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: theme === 'dark' ? '#94a3b8' : '#000000', fontSize: 13, fontWeight: 900 }}
                              tickFormatter={(value) => new Intl.NumberFormat('ar-SA', { notation: "compact", compactDisplay: "short" }).format(value)}
                            />
                            <Tooltip
                              formatter={(value: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency }).format(value)}
                              cursor={{ fill: '#f1f5f9' }}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={60}>
                              {incomeExpenseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === t('revenue') ? '#10b981' : '#ef4444'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center dark:text-white text-black font-bold italic">
                          {t('noIncomeExpenses')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Insights Section */}
              {transactions.length > 0 && (
                <div className="space-y-6 animate-fade-in [animation-delay:200ms]">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600/20 rounded-lg">
                      <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white text-slate-800">{t('financialInsights')}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Current Ratio Card */}
                    <div className="glass-card p-6 border-l-4 border-indigo-400">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-600 dark:text-slate-400 text-sm font-bold">{t('currentRatio')}</span>
                        <div className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase",
                          insights.currentRatio >= 1.5 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                        )}>
                          {insights.currentRatio >= 1.5 ? t('healthyLiquidity') : t('lowLiquidity')}
                        </div>
                      </div>
                      <div className="text-3xl font-bold dark:text-white text-slate-900 mb-1">{insights.currentRatio.toFixed(2)}</div>
                      <p className="text-xs text-slate-500">{t('currentRatioDesc')}</p>
                    </div>

                    {/* Debt-to-Equity Card */}
                    <div className="glass-card p-6 border-l-4 border-amber-400">
                      <span className="text-slate-600 dark:text-slate-400 text-sm font-bold block mb-2">{t('debtToEquity')}</span>
                      <div className="text-3xl font-bold dark:text-white text-slate-900 mb-1">{insights.debtToEquity.toFixed(2)}</div>
                      <p className="text-xs text-slate-500">{t('debtToEquityDesc')}</p>
                    </div>

                    {/* Net Profit Card */}
                    <div className="glass-card p-6 border-l-4 border-emerald-400">
                      <span className="text-slate-600 dark:text-slate-400 text-sm font-bold block mb-2">{t('netProfit')}</span>
                      <div className={cn(
                        "text-3xl font-bold mb-1",
                        insights.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {formatCurrency(insights.netProfit)}
                      </div>
                      <p className="text-xs text-slate-500">Total revenue minus expenses</p>
                    </div>
                  </div>

                  {/* Profit Trend Chart */}
                  <div className="glass-card p-6" style={{ minWidth: 0 }}>
                    <h3 className="text-lg font-semibold dark:text-white text-slate-800 mb-6">{t('monthlyProfitTrend')}</h3>
                    <div className="h-[300px] w-full relative" style={{ minWidth: 0, minHeight: 0 }}>
                      {profitTrendData.length > 0 ? (
                        <ResponsiveContainer id="profit-trend-line-chart" width="100%" height={window.innerWidth < 768 ? 300 : 350}>
                          <LineChart data={profitTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#000000', fontSize: 13, fontWeight: 900, dy: -5 }} />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: theme === 'dark' ? '#94a3b8' : '#000000', fontSize: 13, fontWeight: 900 }}
                              tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(value)}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                borderRadius: '12px',
                                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                                color: theme === 'dark' ? '#fff' : '#1e293b'
                              }}
                              itemStyle={{ color: '#818cf8' }}
                              formatter={(value: number) => formatCurrency(value)}
                            />
                            <Line
                              type="monotone"
                              dataKey="profit"
                              stroke="#818cf8"
                              strokeWidth={3}
                              dot={{ fill: '#818cf8', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">{t('noIncomeExpenses')}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : currentView === 'income' ? (
            <IncomeStatementView
              formatCurrency={formatCurrency}
              transactions={transactions}
            />
          ) : currentView === 'cashflow' ? (
            <CashFlowView
              formatCurrency={formatCurrency}
              transactions={transactions}
            />
          ) : currentView === 'aiAdvisor' ? (
            <AIAdvisorView
              geminiApiKey={geminiApiKey}
              transactions={transactions}
              totals={totals}
              currency={currency}
              formatCurrency={formatCurrency}
            />
          ) : currentView === 'imageGenerator' ? (
            <ImageGeneratorView
              geminiApiKey={geminiApiKey}
            />
          ) : currentView === 'about' ? (
            <AboutUsView />
          ) : (
            <ContactUsView />
          )}
        </main>
      </div>

      <SnapshotsModal
        isOpen={isSnapshotsModalOpen}
        onClose={() => setIsSnapshotsModalOpen(false)}
        currentTransactions={transactions}
        currentBudgets={budgets}
        onLoadSnapshot={(loadedTransactions, loadedBudgets) => {
          updateTransactions(loadedTransactions);
          setBudgets(loadedBudgets);
          localStorage.setItem('motazin_budgets', JSON.stringify(loadedBudgets));
          toast.success(language === 'ar' ? 'تم استعادة النسخة بنجاح!' : 'Backup loaded successfully!');
        }}
      />

      {isPdfScannerOpen && (
        <PdfScanner
          geminiApiKey={geminiApiKey}
          onClose={() => setIsPdfScannerOpen(false)}
          onImport={(rows) => {
            const newTransactions = rows.map(r => {
              const accountId = r.accountId || 'bank';
              const account = allAccounts.find(a => a.id === accountId);
              const category = account?.category || 'asset';

              let impacts: Omit<Impact, 'id'>[] = [];
              if (category === 'asset') {
                impacts = [
                  { accountId: accountId, amount: r.amount },
                  { accountId: 'capital', amount: r.amount }
                ];
              } else if (category === 'liability') {
                impacts = [
                  { accountId: accountId, amount: r.amount },
                  { accountId: 'capital', amount: -r.amount }
                ];
              } else {
                impacts = [
                  { accountId: accountId, amount: r.amount },
                  { accountId: 'bank', amount: -r.amount }
                ];
              }

              return {
                id: r.id,
                date: r.date,
                description: r.description,
                impacts: impacts.map(i => ({ ...i, id: Math.random().toString(36).substr(2, 9) })),
                createdAt: new Date().toISOString()
              };
            });
            updateTransactions([...transactions, ...newTransactions]);
            setIsPdfScannerOpen(false);
            toast.success(language === 'ar' ? 'تم استيراد البيانات بنجاح!' : 'Data imported successfully!');
          }}
        />
      )}

      <DepreciationModal
        isOpen={isDepreciationModalOpen}
        onClose={() => setIsDepreciationModalOpen(false)}
        assets={allAccounts.filter(a => a.category === 'asset' && !['cash', 'bank', 'ar', 'inventory', 'supplies', 'prepaid_expenses'].includes(a.id))}
        onApply={(accountId, amount, description) => {
          const txId = Math.random().toString(36).substr(2, 9);
          const newTx: Transaction = {
            id: txId,
            date: new Date().toLocaleDateString('en-GB'),
            description: description,
            impacts: [
              { id: Math.random().toString(36).substr(2, 9), accountId: 'expenses', amount: amount },
              { id: Math.random().toString(36).substr(2, 9), accountId: accountId, amount: -amount }
            ],
            createdAt: new Date().toISOString()
          };
          updateTransactions([...transactions, newTx]);
          setIsDepreciationModalOpen(false);
          toast.success(language === 'ar' ? 'تم إضافة قيد الإهلاك بنجاح!' : 'Depreciation entry added successfully!');
        }}
      />

      <DocPreviewModal
        isOpen={isDocPreviewOpen}
        url={previewUrl}
        onClose={() => setIsDocPreviewOpen(false)}
      />

      {customAccountModalIdx !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div
            className="absolute inset-0"
            onClick={() => setCustomAccountModalIdx(null)}
          />
          <div
            className={cn(
              "relative w-full max-w-md bg-white dark:bg-slate-900 border dark:border-white/10 border-slate-200 shadow-2xl flex flex-col p-6 transition-all rounded-[2rem]",
              "animate-in zoom-in-95 duration-200"
            )}
            dir={dir}
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {language === 'ar' ? 'إضافة حساب جديد' : 'Add New Account'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest block mb-2 text-theme-muted">
                  {language === 'ar' ? 'اسم الحساب' : 'Account Name'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newCustomAccountName}
                  onChange={e => setNewCustomAccountName(e.target.value)}
                  className="w-full px-4 py-3 border dark:border-white/5 border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-950/60 bg-white dark:text-white text-slate-900 font-bold transition-colors"
                  placeholder={language === 'ar' ? 'مثال: أراضي زراعية، قرض بنكي...' : 'e.g. Land, Bank Loan...'}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest block mb-2 text-theme-muted">
                  {language === 'ar' ? 'نوع الحساب' : 'Account Type'}
                </label>
                <div className="flex dark:bg-slate-950 bg-slate-100 p-1 rounded-2xl border dark:border-white/5 border-slate-200 w-full shadow-inner">
                  {(['asset', 'liability', 'equity'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCustomAccountCategory(cat)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest",
                        newCustomAccountCategory === cat
                          ? cat === 'asset'
                            ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 scale-[1.02]"
                            : cat === 'liability'
                              ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-[1.02]"
                              : "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]"
                          : "dark:text-slate-500 text-slate-400 dark:hover:text-white hover:text-indigo-600"
                      )}
                    >
                      {t(cat)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCustomAccountModalIdx(null)}
                className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-bold transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const newAcc = await addCustomAccount(newCustomAccountName, newCustomAccountCategory);
                  if (newAcc) {
                    handleImpactChange(customAccountModalIdx, 'accountId', newAcc.id);
                    setCustomAccountModalIdx(null);
                  }
                }}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
              >
                {language === 'ar' ? 'إضافة الحساب' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation moved outside animated wrapper - see below */}

      {/* Transaction Form Modal / Bottom Sheet */}
      {isTransactionFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="absolute inset-0"
            onClick={() => {
              setIsTransactionFormOpen(false);
              handleCancelEdit();
            }}
          />
          <form
            onSubmit={(e) => {
              handleAddTransaction(e);
              setIsTransactionFormOpen(false);
            }}
            className={cn(
              "relative w-full max-w-2xl bg-white dark:bg-slate-900 border dark:border-white/10 border-slate-200 shadow-2xl flex flex-col transition-all",
              "rounded-t-[2.5rem] md:rounded-[2rem] h-fit max-h-[92vh] md:max-h-[85vh] overflow-hidden",
              "animate-in slide-in-from-bottom duration-500 md:zoom-in-95"
            )}
          >
            {/* Handle for bottom sheet */}
            <div className="md:hidden w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-none" />

            <div className="flex items-center justify-between p-6 border-b dark:border-white/10 border-slate-200 flex-none bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <Plus className="w-5 h-5 text-indigo-400" />
                  </div>
                  {editingTransactionId ? t('editTransaction') : t('addNewTransaction')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTransactionFormOpen(false);
                  handleCancelEdit();
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div
              ref={modalScrollRef}
              className="p-6 overflow-y-auto custom-scrollbar no-scrollbar flex-1 max-h-[calc(92vh-180px)] md:max-h-[calc(85vh-180px)] space-y-6 pb-6 bg-slate-50/50 dark:bg-slate-950/20"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label htmlFor="mob-tx-date" className="block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 dark:text-slate-400 text-slate-500">{t('date')}</label>
                  <input
                    id="mob-tx-date"
                    name="mob-date"
                    type="text"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    placeholder={t('exampleDate')}
                    className="w-full glass-input px-4 py-3.5 text-sm font-bold focus:border-indigo-500/50 transition-all outline-none rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="mob-tx-description" className="block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 dark:text-slate-400 text-slate-500">{t('description')}</label>
                  <input
                    id="mob-tx-description"
                    name="mob-description"
                    type="text"
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t('exampleDesc')}
                    className="w-full glass-input px-4 py-3.5 text-sm font-bold focus:border-indigo-500/50 transition-all outline-none rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
                  />
                </div>
              </div>

              {/* Recurring Transaction Logic Mobile */}
              <div className="flex flex-col gap-4 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                <label htmlFor="mob-tx-recurring" className="flex items-center gap-3 cursor-pointer group">
                  <input
                    id="mob-tx-recurring"
                    name="mob-isRecurring"
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-6 h-6 rounded-lg border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                  />
                  <span className="text-sm font-black dark:text-white text-slate-700 uppercase tracking-tight">{t('recurringTransaction')}</span>
                </label>

                {isRecurring && (
                  <div className="flex items-center gap-3 animate-fade-in pt-3 border-t border-indigo-500/10">
                    <label htmlFor="mob-tx-recurrence-interval" className="text-[10px] font-black dark:text-slate-400 text-slate-500 uppercase tracking-widest">{t('repeatsEveryLabel')}</label>
                    <select
                      id="mob-tx-recurrence-interval"
                      name="mob-recurrenceInterval"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value as any)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-white text-slate-800"
                    >
                      <option value="daily">{t('day')}</option>
                      <option value="weekly">{t('week')}</option>
                      <option value="monthly">{t('month')}</option>
                      <option value="yearly">{t('year')}</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest ml-1 dark:text-slate-400 text-slate-500">{t('impactOnAccounts')}</span>
                  <button
                    type="button"
                    onClick={handleAddImpact}
                    className="text-[10px] font-black text-white flex items-center gap-2 transition-all bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('addAccount')}
                  </button>
                </div>

                <div className="space-y-4">
                  {impacts.map((impact, idx) => (
                    <div key={idx} className="glass-card p-4 relative border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                      <button
                        type="button"
                        onClick={() => handleRemoveImpact(idx)}
                        disabled={impacts.length <= 2}
                        className="absolute top-2 left-2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none z-10"
                        title={t('delete') || 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end pl-8 sm:pl-0">
                        <div className="col-span-1 sm:col-span-5 space-y-1.5">
                          <label htmlFor={`mob-tx-account-${idx}`} className="text-[9px] font-black uppercase tracking-widest block ml-1 dark:text-slate-400 text-slate-500">{t('accountName')}</label>
                          <select
                            id={`mob-tx-account-${idx}`}
                            name={`mob-accountId-${idx}`}
                            value={impact.accountId}
                            onChange={e => {
                              if (e.target.value === 'NEW_CUSTOM_ACCOUNT') {
                                setCustomAccountModalIdx(idx);
                                setNewCustomAccountName('');
                                setNewCustomAccountCategory('asset');
                              } else {
                                handleImpactChange(idx, 'accountId', e.target.value);
                              }
                            }}
                            className="w-full px-4 py-2.5 dark:bg-slate-950 bg-white border dark:border-white/10 border-slate-200 rounded-xl text-xs font-bold shadow-inner appearance-none outline-none focus:border-indigo-500/50"
                          >
                            {renderAccountOptions()}
                          </select>
                        </div>
                        <div className="col-span-1 sm:col-span-4 space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest block ml-1 dark:text-slate-400 text-slate-500">{t('impactValue')}</label>
                          {(() => {
                            const amount = typeof impact.amount === 'number' ? impact.amount : 0;
                            const account = allAccounts.find(a => a.id === impact.accountId);
                            const isNeg = amount < 0 || Object.is(amount, -0);
                            const isCredit = impact.type
                              ? impact.type === 'credit'
                              : (account
                                ? (account.category === 'asset' ? isNeg : !isNeg)
                                : isNeg);
                            return (
                              <div className="flex dark:bg-slate-950 bg-slate-100 p-0.5 rounded-xl border dark:border-white/10 border-slate-200 shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleImpactChange(idx, 'type', 'debit');
                                  }}
                                  className={cn(
                                    "flex-1 py-2 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest",
                                    !isCredit ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                  )}
                                >
                                  {t('debit')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleImpactChange(idx, 'type', 'credit');
                                  }}
                                  className={cn(
                                    "flex-1 py-2 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest",
                                    isCredit ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                  )}
                                >
                                  {t('credit')}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="col-span-1 sm:col-span-3 space-y-1.5">
                          {(() => {
                            const amount = typeof impact.amount === 'number' ? impact.amount : 0;
                            const account = allAccounts.find(a => a.id === impact.accountId);
                            const isNeg = amount < 0 || Object.is(amount, -0);
                            const isCredit = impact.type
                              ? impact.type === 'credit'
                              : (account
                                ? (account.category === 'asset' ? isNeg : !isNeg)
                                : isNeg);
                            return (
                              <div className="relative">
                                <input
                                  id={`mob-tx-amount-${idx}`}
                                  name={`mob-amount-${idx}`}
                                  type="number"
                                  step="any"
                                  value={amount !== 0 ? amount : ''}
                                  onChange={e => {
                                    const val = parseFloat(e.target.value) || 0;
                                    handleImpactChange(idx, 'amount', val);
                                  }}
                                  className={cn(
                                    "w-full pl-12 pr-4 py-2.5 dark:bg-slate-950 bg-white border dark:border-white/10 border-slate-200 rounded-xl text-sm font-mono text-right font-bold transition-all outline-none focus:border-indigo-500/50",
                                    isCredit ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"
                                  )}
                                  placeholder="0.00"
                                  dir="ltr"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black dark:text-white/30 text-slate-400 pointer-events-none uppercase tracking-widest">
                                  {currency}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border-t dark:border-white/10 border-slate-200 flex gap-4 flex-none z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 uppercase tracking-widest text-xs"
              >
                {editingTransactionId ? t('saveChanges') : t('addTransaction')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTransactionFormOpen(false);
                  handleCancelEdit();
                }}
                className="px-8 bg-slate-100 dark:bg-slate-800 active:scale-95 text-slate-600 dark:text-white font-black py-4 rounded-2xl transition-all border dark:border-white/10 border-slate-200 uppercase tracking-widest text-[10px]"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Bottom Navigation - OUTSIDE animated wrapper to ensure true fixed positioning */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[90] glass-card !rounded-[2.5rem] !p-1 border dark:border-white/20 border-slate-300 dark:bg-slate-900/90 bg-white/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] pb-safe">
        <div className="flex justify-around items-center h-14 relative">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentView(item.id as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all relative", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}
              >
                <Icon className={cn("w-5 h-5", isActive ? "scale-110" : "scale-100")} />
                <span className="text-[7px] font-black uppercase mt-1">
                  {item.id === 'equation' ? t('dashboard') :
                    item.id === 'income' ? (language === 'ar' ? 'الدخل' : 'Income') :
                      item.id === 'cashflow' ? (language === 'ar' ? 'التدفقات' : 'Cash') :
                        item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}

          {/* Integrated Center Action Button */}
          <div className="relative -top-8 animate-float">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-40 animate-pulse-slow -z-10 scale-105" />
            <button
              onClick={() => {
                setEditingTransactionId(null);
                handleCancelEdit();
                setIsTransactionFormOpen(true);
              }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-full shadow-[0_15px_30px_-5px_rgba(99,102,241,0.35)] flex items-center justify-center border-4 dark:border-slate-900 border-white active:scale-90 transition-all group relative z-10"
              aria-label={t('addTransaction')}
            >
              <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {navItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setCurrentView(item.id as any); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all relative", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}
              >
                <Icon className={cn("w-5 h-5", isActive ? "scale-110" : "scale-100")} />
                <span className="text-[7px] font-black uppercase mt-1">
                  {item.id === 'about' ? (language === 'ar' ? 'عنا' : 'About') :
                    item.id === 'contact' ? (language === 'ar' ? 'تواصل' : 'Contact') :
                      item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      {showConfetti && <Confetti />}
    </>
  );
}

// --- Component: AboutUsView ---

function AboutUsView() {
  const { t, dir } = useLanguage();
  return (
    <div className="animate-fade-in space-y-10" dir={dir}>
      {/* Hero Banner */}
      <div className="relative overflow-hidden glass-card p-10 md:p-16 text-center border-t-4 border-emerald-500">
        <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-20"
          style={{ background: 'radial-gradient(circle at 50% 0%, #10b981 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-3xl border border-emerald-500/30 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Heart className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold dark:text-white text-slate-900 mb-4">
            {t('aboutTitle')}
          </h1>
          <p className="text-lg dark:text-slate-300 text-slate-600 max-w-2xl mx-auto">
            {t('aboutSubtitle')}
          </p>
        </div>
      </div>

      {/* Our Story */}
      <div className="glass-card p-8 md:p-12">
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-5 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          {t('ourStory')}
        </h2>
        <p className="dark:text-slate-300 text-slate-700 leading-relaxed text-base md:text-lg">
          {t('storyText')}
        </p>
      </div>

      {/* Core Values */}
      <div>
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-6 text-center">
          {t('coreValues')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Value 1 */}
          <div className="glass-card p-8 text-center border-t-4 border-emerald-500 hover:scale-[1.02] transition-transform">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 mb-5 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Zap className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-3">
              {t('value1Title')}
            </h3>
            <p className="dark:text-slate-300 text-slate-600">
              {t('value1Desc')}
            </p>
          </div>
          {/* Value 2 */}
          <div className="glass-card p-8 text-center border-t-4 border-indigo-500 hover:scale-[1.02] transition-transform">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 mb-5 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Shield className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-3">
              {t('value2Title')}
            </h3>
            <p className="dark:text-slate-300 text-slate-600">
              {t('value2Desc')}
            </p>
          </div>
          {/* Value 3 */}
          <div className="glass-card p-8 text-center border-t-4 border-amber-500 hover:scale-[1.02] transition-transform">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/20 rounded-2xl border border-amber-500/30 mb-5 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Target className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-3">
              {t('value3Title')}
            </h3>
            <p className="dark:text-slate-300 text-slate-600">
              {t('value3Desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Component: ContactUsView ---

function ContactUsView() {
  const { t, dir, language } = useLanguage();
  const [formName, setFormName] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');
  const [formMessage, setFormMessage] = React.useState('');
  const [isSent, setIsSent] = React.useState(false);

  const [isSending, setIsSending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      // Save to Firebase
      await addDoc(collection(db, 'messages'), {
        name: formName,
        email: formEmail,
        message: formMessage,
        createdAt: new Date().toISOString()
      });

      setIsSent(true);
      setFormName('');
      setFormEmail('');
      setFormMessage('');
      setTimeout(() => setIsSent(false), 4000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t('errorSendingMessage') || 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8" dir={dir}>
      {/* Hero */}
      <div className="relative overflow-hidden glass-card p-10 text-center border-t-4 border-indigo-500">
        <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-20"
          style={{ background: 'radial-gradient(circle at 50% 0%, #6366f1 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/20 rounded-3xl border border-indigo-500/30 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Mail className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold dark:text-white text-slate-900 mb-4">
            {t('contactTitle')}
          </h1>
          <p className="text-lg dark:text-slate-300 text-slate-600 max-w-2xl mx-auto">
            {t('contactSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-3 glass-card p-8">
          <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Send className="w-5 h-5 text-indigo-400" />
            </div>
            {t('sendMessage')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="contact-name" className="block text-[11px] font-bold uppercase tracking-widest mb-2 dark:text-slate-400 text-slate-600">
                {t('fullName')}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="w-full px-4 py-3 rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-slate-950/50 bg-slate-50 dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-[11px] font-bold uppercase tracking-widest mb-2 dark:text-slate-400 text-slate-600">
                {t('emailAddress')}
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full px-4 py-3 rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-slate-950/50 bg-slate-50 dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                dir="ltr"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-[11px] font-bold uppercase tracking-widest mb-2 dark:text-slate-400 text-slate-600">
                {t('yourMessage')}
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                value={formMessage}
                onChange={e => setFormMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                className="w-full px-4 py-3 rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-slate-950/50 bg-slate-50 dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isSent ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {isSending ? t('sending') : isSent ? `✓ ${t('successSent')}` : t('sendButton')}
            </button>
          </form>
        </div>

        {/* Contact Info + Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="glass-card p-8">
            <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <Info className="w-5 h-5 text-emerald-400" />
              </div>
              {t('contactInfo')}
            </h2>
            <div className="space-y-5">
              <a
                href="mailto:abdullahalalawi52@gmail.com"
                className="flex items-center gap-4 p-4 rounded-2xl dark:bg-white/5 bg-slate-100 hover:bg-indigo-100 dark:hover:bg-indigo-500/10 transition-colors group"
              >
                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 flex-shrink-0">
                  <Mail className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest dark:text-slate-400 text-slate-500 mb-0.5">{t('emailLabel')}</p>
                  <p className="dark:text-white text-slate-900 font-bold text-sm group-hover:text-indigo-600 transition-colors" dir="ltr">
                    abdullahalalawi52@gmail.com
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-4 p-4 rounded-2xl dark:bg-white/5 bg-slate-100">
                <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30 flex-shrink-0">
                  <MapPin className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest dark:text-slate-400 text-slate-500 mb-0.5">{t('addressLabel')}</p>
                  <p className="dark:text-white text-slate-900 font-bold text-sm">{t('addressValue')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Embed */}
          <div className="glass-card overflow-hidden rounded-3xl">
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-bold dark:text-white text-slate-900">{t('addressValue')}</span>
            </div>
            <iframe
              title="location-map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(t('addressValue'))}&hl=${language}&output=embed`}
              width="100%"
              height="220"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale dark:opacity-80 hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Component: IncomeStatementView ---

function CashFlowView({ transactions, formatCurrency }: { transactions: Transaction[], formatCurrency: (val: number) => string }) {
  const { t, dir, language } = useLanguage();

  const cashAccountIds = ['cash', 'bank'];

  // Categorization lists
  const investingAccounts = ['fixed_assets', 'land', 'buildings', 'equipment', 'cars', 'furniture', 'intangible_assets', 'investments'];
  const financingAccounts = ['capital', 'drawings', 'short_term_loans', 'long_term_loans', 'mortgages_payable'];

  let operatingTotal = 0;
  let investingTotal = 0;
  let financingTotal = 0;

  transactions.forEach(tx => {
    const cashImpact = tx.impacts
      .filter(i => cashAccountIds.includes(i.accountId))
      .reduce((sum, i) => sum + i.amount, 0);

    if (cashImpact === 0) return;

    const otherImpacts = tx.impacts.filter(i => !cashAccountIds.includes(i.accountId));

    let category: 'operating' | 'investing' | 'financing' = 'operating';

    if (otherImpacts.some(i => investingAccounts.includes(i.accountId))) {
      category = 'investing';
    } else if (otherImpacts.some(i => financingAccounts.includes(i.accountId))) {
      category = 'financing';
    }

    if (category === 'operating') operatingTotal += cashImpact;
    else if (category === 'investing') investingTotal += cashImpact;
    else if (category === 'financing') financingTotal += cashImpact;
  });

  const netCashFlow = operatingTotal + investingTotal + financingTotal;

  return (
    <div id="cash-flow-report" className="glass-card responsive-p animate-fade-in space-y-6 sm:space-y-8 dark:bg-slate-900/40 bg-white/40 border dark:border-white/10 border-slate-200" dir={dir}>
      <div className="text-center space-y-2 border-b dark:border-white/10 border-slate-200 pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold dark:text-white text-slate-900">{t('cashFlowStatement')}</h2>
        <p className="text-sm dark:text-slate-400 text-slate-600">{t('periodEnding')}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB')}</p>
      </div>

      <div className="space-y-6">
        {/* Operating Activities */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex justify-between">
            <span>{t('operatingActivities')}</span>
            <span dir="ltr" className={operatingTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {formatCurrency(operatingTotal)}
            </span>
          </h3>
        </div>

        {/* Investing Activities */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex justify-between">
            <span>{t('investingActivities')}</span>
            <span dir="ltr" className={investingTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {formatCurrency(investingTotal)}
            </span>
          </h3>
        </div>

        {/* Financing Activities */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex justify-between">
            <span>{t('financingActivities')}</span>
            <span dir="ltr" className={financingTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {formatCurrency(financingTotal)}
            </span>
          </h3>
        </div>

        {/* Total Net Cash Flow */}
        <div className="pt-6 border-t dark:border-white/20 border-slate-200">
          <div className={cn(
            "p-6 rounded-3xl flex justify-between items-center",
            netCashFlow >= 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
          )}>
            <span className={cn(
              "text-2xl font-bold uppercase tracking-tighter",
              netCashFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {t('netCashFlow')}
            </span>
            <div className="text-right">
              <div className={cn(
                "text-3xl font-bold font-mono",
                netCashFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )} dir="ltr">
                {formatCurrency(netCashFlow)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {netCashFlow >= 0 ? t('increaseInCash') : t('decreaseInCash')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={async () => {
            const element = document.getElementById('cash-flow-report');
            if (!element) return;
            try {
              toast.info(t('exportingPDF') || "Generating PDF...");
              const html2canvas = (await import('html2canvas')).default;
              const jsPDF = (await import('jspdf')).default;
              const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                logging: false,
                scrollX: 0,
                scrollY: 0,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
              });
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF('p', 'mm', 'a4');
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
              pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
              pdf.save(`${t('cashFlowStatement')}.pdf`);
              toast.success(t('exportSuccess') || "PDF generated successfully");
            } catch (error) {
              console.error('Error exporting PDF:', error);
              toast.error(t('errorExportingPDF'));
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
        >
          <ArrowRightLeft className="w-5 h-5" />
          {t('exportPDF')}
        </button>
      </div>
    </div>
  );
}

function IncomeStatementView({ transactions, formatCurrency }: { transactions: Transaction[], formatCurrency: (val: number) => string }) {
  const { t, dir, language } = useLanguage();

  const totalRevenue = transactions.reduce((sum, tx) => {
    return sum + tx.impacts
      .filter(i => i.accountId === 'revenue')
      .reduce((s, i) => s + i.amount, 0);
  }, 0);

  const totalExpenses = transactions.reduce((sum, tx) => {
    return sum + tx.impacts
      .filter(i => i.accountId === 'expenses')
      .reduce((s, i) => s + Math.abs(i.amount), 0);
  }, 0);

  const netIncome = totalRevenue - totalExpenses;

  return (
    <div id="income-statement-report" className="glass-card responsive-p animate-fade-in space-y-6 sm:space-y-8 dark:bg-slate-900/40 bg-white/40 border dark:border-white/10 border-slate-200" dir={dir}>
      <div className="text-center space-y-2 border-b dark:border-white/10 border-slate-200 pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold dark:text-white text-slate-900">{t('incomeStatement')}</h2>
        <p className="text-sm dark:text-slate-400 text-slate-600">{t('periodEnding')}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB')}</p>
      </div>

      <div className="space-y-6">
        {/* Revenue Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex justify-between">
            <span>{t('revenue')}</span>
            <span dir="ltr">{formatCurrency(totalRevenue)}</span>
          </h3>
          <div className="dark:bg-slate-900/40 bg-slate-100 rounded-2xl overflow-hidden border dark:border-white/5 border-slate-200">
            <div className="flex justify-between p-4 dark:hover:bg-white/5 hover:bg-slate-200/50 transition-colors">
              <span className="dark:text-white text-slate-900 font-medium">{t('totalRevenue')}</span>
              <span className="dark:text-white text-slate-900 font-mono font-bold" dir="ltr">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest flex justify-between">
            <span>{t('operatingExpenses')}</span>
            <span dir="ltr">{formatCurrency(totalExpenses)}</span>
          </h3>
          <div className="dark:bg-slate-900/40 bg-slate-100 rounded-2xl overflow-hidden border dark:border-white/5 border-slate-200">
            <div className="flex justify-between p-4 dark:hover:bg-white/5 hover:bg-slate-200/50 transition-colors">
              <span className="dark:text-white text-slate-900 font-medium">{t('totalOperatingExpenses')}</span>
              <span className="dark:text-white text-slate-900 font-mono font-bold" dir="ltr">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Net Income Section */}
        <div className="pt-6 border-t dark:border-white/20 border-slate-200">
          <div className={cn(
            "p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-right",
            netIncome >= 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
          )}>
            <span className={cn(
              "text-xl sm:text-2xl font-bold uppercase tracking-tighter",
              netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {t('netIncome')}
            </span>
            <span className={cn(
              "text-2xl sm:text-3xl font-bold font-mono",
              netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )} dir="ltr">
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={async () => {
            const element = document.getElementById('income-statement-report');
            if (!element) return;
            try {
              toast.info(t('exportingPDF') || "Generating PDF...");
              const html2canvas = (await import('html2canvas')).default;
              const jsPDF = (await import('jspdf')).default;
              const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                logging: false,
                scrollX: 0,
                scrollY: 0,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
              });
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF('p', 'mm', 'a4');
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
              pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
              pdf.save(`${t('incomeStatement')}.pdf`);
              toast.success(t('exportSuccess') || "PDF generated successfully");
            } catch (error) {
              console.error('Error exporting PDF:', error);
              toast.error(t('errorExportingPDF'));
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          {t('exportPDF')}
        </button>
      </div>
    </div>
  );
}

const DocPreviewModal: React.FC<{ isOpen: boolean, url: string | null, onClose: () => void }> = ({ isOpen, url, onClose }) => {
  const { t, dir } = useLanguage();
  if (!isOpen || !url) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" dir={dir}>
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-2xl border border-white/10 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/40">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileImage className="w-5 h-5 text-indigo-400" />
            {t('documentPreview')}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
          <img
            src={url}
            alt="Document"
            className="max-w-full h-auto rounded-lg shadow-lg border border-white/5"
            onLoad={(e) => (e.currentTarget.style.opacity = '1')}
          />
        </div>
      </div>
    </div>
  );
}

const Confetti: React.FC = () => {
  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-sky-500'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      {Array.from({ length: 45 }).map((_, i) => {
        const size = Math.random() * 8 + 6;
        const left = Math.random() * 100;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const delay = Math.random() * 3;
        const duration = Math.random() * 2 + 3;
        const rotationSpeed = Math.random() * 720 - 360;
        return (
          <div
            key={i}
            className={cn("absolute rounded-sm opacity-90 animate-confetti-fall", color)}
            style={{
              width: `${size}px`,
              height: `${size * 1.5}px`,
              left: `${left}%`,
              top: `-20px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
              '--rotation-deg': `${rotationSpeed}deg`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

// --- Component: AIAdvisorView ---

interface AIAdvisorViewProps {
  geminiApiKey: string;
  transactions: any[];
  totals: any;
  currency: string;
  formatCurrency: (amount: number) => string;
}

function AIAdvisorView({ geminiApiKey, transactions, totals, currency, formatCurrency }: AIAdvisorViewProps) {
  const { t, dir, language } = useLanguage();
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>(() => {
    const saved = localStorage.getItem('motazin_chat_messages');
    return saved ? JSON.parse(saved) : [
      { sender: 'ai', text: t('aiAdvisorWelcome') }
    ];
  });
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachContext, setAttachContext] = useState(true);

  useEffect(() => {
    localStorage.setItem('motazin_chat_messages', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!geminiApiKey) {
      toast.error(t('apiKeyRequired'));
      return;
    }

    const userText = input.trim();
    setInput('');

    // Add user message to state
    const newMessages = [...messages, { sender: 'user' as const, text: userText }];
    setMessages(newMessages);
    setIsSending(true);

    try {
      const contents: any[] = [];

      let systemInstruction;
      if (attachContext) {
        let contextText = `أنت مستشار مالي ذكي. استخدم هذا السياق المالي للإجابة عن أسئلة المستخدم بدقة ومهنية ومودة باللغة العربية أو الإنجليزية حسب لغة المستخدم.\n\n`;
        contextText += `[سياق مالي / Financial Context]:\n`;
        contextText += `Currency: ${currency}\n`;
        contextText += `Total Assets: ${formatCurrency(totals.totalAssets)}\n`;
        contextText += `Total Liabilities: ${formatCurrency(totals.totalLiabilities)}\n`;
        contextText += `Total Equity: ${formatCurrency(totals.totalEquity)}\n`;
        contextText += `Equation is Balanced: ${totals.isBalanced ? "Yes" : "No"}\n`;
        contextText += `Transactions Log:\n`;
        transactions.forEach((tx, idx) => {
          contextText += `- ${idx + 1}. Date: ${tx.date}, Desc: ${tx.description}, Impacts: ${JSON.stringify(tx.impacts)}\n`;
        });
        systemInstruction = { parts: [{ text: contextText }] };
      } else {
        systemInstruction = { parts: [{ text: `أنت مستشار مالي ذكي ومساعد خبير. أجب بدقة ومهنية ومودة.` }] };
      }

      // Map previous messages (skipping the welcome message)
      const chatHistory = newMessages.slice(1);

      chatHistory.forEach((msg) => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents, systemInstruction })
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || t('errorOccurred');

      setMessages(prev => [...prev, { sender: 'ai' as const, text: aiText }]);
    } catch (error) {
      console.error('Gemini API Error:', error);
      setMessages(prev => [...prev, { sender: 'ai' as const, text: t('errorOccurred') }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{ sender: 'ai', text: t('aiAdvisorWelcome') }]);
  };

  return (
    <div className="animate-fade-in flex flex-col h-[70vh] glass-card overflow-hidden border-t-4 border-indigo-500 shadow-2xl relative" dir={dir}>
      <div className="p-6 border-b dark:border-white/10 border-slate-200 flex justify-between items-center bg-slate-900/10 backdrop-blur-sm flex-none">
        <div>
          <h2 className="text-xl font-bold dark:text-white text-slate-900">{t('aiAdvisorTitle')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('aiAdvisorSubtitle')}</p>
        </div>
        <button
          onClick={handleClearChat}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all"
        >
          {t('newChat')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar flex flex-col">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex flex-col max-w-[80%] rounded-[2rem] p-5 shadow-sm animate-in slide-in-from-bottom-2 mb-2",
              msg.sender === 'user'
                ? "bg-indigo-600 text-white rounded-br-none self-end ml-auto"
                : "bg-slate-100 dark:bg-slate-800 dark:text-slate-100 text-slate-800 rounded-bl-none self-start mr-auto border dark:border-white/5 border-slate-200"
            )}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
        {isSending && (
          <div className="flex items-center gap-1.5 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-none self-start w-24 justify-center shadow-sm">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t dark:border-white/10 border-slate-200 bg-slate-900/10 backdrop-blur-sm space-y-3 flex-none">
        {transactions.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer select-none py-1.5 px-3 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl border border-indigo-500/10 w-fit text-xs font-bold text-indigo-500 dark:text-indigo-400 transition-colors">
            <input
              type="checkbox"
              checked={attachContext}
              onChange={e => setAttachContext(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-white/10"
            />
            {t('attachReports')}
          </label>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isSending}
            placeholder={t('chatInputPlaceholder')}
            className="flex-1 px-5 py-4 border dark:border-white/10 border-slate-200 dark:bg-slate-950 bg-white dark:text-white text-slate-900 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center font-bold text-sm uppercase tracking-widest disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Component: ImageGeneratorView ---

interface ImageGeneratorViewProps {
  geminiApiKey: string;
}

function ImageGeneratorView({ geminiApiKey }: ImageGeneratorViewProps) {
  const { t, dir } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!geminiApiKey) {
      toast.error(t('apiKeyRequired'));
      return;
    }

    setIsGenerating(true);
    setGeneratedImgUrl(null);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          numberOfImages: 1,
          aspectRatio: aspectRatio,
          outputMimeType: 'image/jpeg'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const imageBytes = data.generatedImages?.[0]?.image?.imageBytes;

      if (!imageBytes) {
        throw new Error('No image bytes returned');
      }

      setGeneratedImgUrl(`data:image/jpeg;base64,${imageBytes}`);
    } catch (error) {
      console.error('Image Generation Error:', error);
      toast.error(t('errorGenerate'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-12 gap-8" dir={dir}>
      <form onSubmit={handleGenerate} className="col-span-1 md:col-span-5 glass-card p-6 border-t-4 border-indigo-500 shadow-2xl space-y-6">
        <h2 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
          </div>
          {t('imageGeneratorTitle')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('imageGeneratorSubtitle')}</p>

        <div className="space-y-2">
          <label htmlFor="img-prompt" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('prompt')}</label>
          <textarea
            id="img-prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder={t('promptPlaceholder')}
            rows={4}
            className="w-full px-4 py-3 border dark:border-white/10 border-slate-200 dark:bg-slate-950 bg-white dark:text-white text-slate-900 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors custom-scrollbar"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="img-aspect" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('aspectRatio')}</label>
          <select
            id="img-aspect"
            value={aspectRatio}
            onChange={e => setAspectRatio(e.target.value)}
            disabled={isGenerating}
            className="w-full px-4 py-3.5 dark:bg-slate-950 bg-white border dark:border-white/10 border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="1:1">1:1 (Square)</option>
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="4:3">4:3 (Classic)</option>
            <option value="3:4">3:4 (Tall)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 active:scale-95 uppercase tracking-widest text-xs disabled:opacity-40 disabled:pointer-events-none"
        >
          {isGenerating ? t('generating') : t('generateImage')}
        </button>
      </form>

      <div className="col-span-1 md:col-span-7 glass-card p-6 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[450px] relative overflow-hidden">
        {isGenerating ? (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(99,102,241,0.3)]"></div>
            <p className="font-black text-sm uppercase tracking-widest text-indigo-400 animate-pulse">{t('generating')}</p>
          </div>
        ) : generatedImgUrl ? (
          <div className="w-full h-full flex flex-col items-center gap-6 animate-scale-in">
            <div className="relative rounded-2xl overflow-hidden border dark:border-white/10 border-slate-200 shadow-xl max-w-full max-h-[400px]">
              <img src={generatedImgUrl} alt="AI Generated" className="object-contain max-h-[380px] rounded-2xl" />
            </div>
            <a
              href={generatedImgUrl}
              download="financial-ai-image.jpg"
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all uppercase tracking-widest"
            >
              <Send className="w-4 h-4 rotate-90" /> {t('download')}
            </a>
          </div>
        ) : (
          <div className="text-center p-8 text-slate-500 space-y-4">
            <ImageIcon className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-semibold max-w-sm mx-auto">{t('noImage')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

