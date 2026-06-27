import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Download, Eye, Settings, Menu, Sun, Moon, Globe, Coins, Undo2, Redo2, LogOut, Info, Mail, Calculator, FileText, ArrowRightLeft, User as UserIcon, XCircle } from 'lucide-react';

import { useTheme } from './ThemeContext';
import { useLanguage } from './i18n';
import { Toaster, toast } from 'sonner';

import { auth, db, googleProvider, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, signOut, onAuthStateChanged, getRedirectResult, type User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, query, orderBy, writeBatch, addDoc } from 'firebase/firestore';

import { calculateTotals } from './utils/accounting';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { cn } from './utils/cn';

import { Category, Account, Impact, Transaction, ParsedRow } from './types/accounting';
import { ACCOUNTS, CURRENCIES } from './constants/accounting';

// Component imports
import { MotazinLogo } from './components/MotazinLogo';
import { Confetti } from './components/Confetti';
import { DocPreviewModal } from './components/DocPreviewModal';
import { AboutUsView } from './components/AboutUsView';
import { ContactUsView } from './components/ContactUsView';
import { IncomeStatementView } from './components/IncomeStatementView';
import { CashFlowView } from './components/CashFlowView';
import { TransactionForm } from './components/TransactionForm';
import { EquationDashboard } from './components/EquationDashboard';
import { TransactionTable } from './components/TransactionTable';
import { FinancialCharts } from './components/FinancialCharts';
import { FinancialInsights } from './components/FinancialInsights';
import { ConfirmationModal } from './components/ConfirmationModal';

// Lazy loaded modals
const PdfScanner = lazy(() => import('./PdfScanner').then(module => ({ default: module.FileScanner })));
const DepreciationModal = lazy(() => import('./DepreciationModal').then(module => ({ default: module.DepreciationModal })));
const SnapshotsModal = lazy(() => import('./SnapshotsModal').then(module => ({ default: module.SnapshotsModal })));
const ChatWidget = lazy(() => import('./Chat').then(module => ({ default: module.ChatWidget })));

export default function App() {
  const { t, language, setLanguage, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {}
  });

  const triggerConfirmation = (config: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  }) => {
    setConfirmModalConfig(config);
    setConfirmModalOpen(true);
  };

  // PWA Install Prompt State
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

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

  // Modals Open State
  const [isPdfScannerOpen, setIsPdfScannerOpen] = useState(false);
  const [isDepreciationModalOpen, setIsDepreciationModalOpen] = useState(false);
  const [isSnapshotsModalOpen, setIsSnapshotsModalOpen] = useState(false);

  // Gemini API State
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('motazin_gemini_api_key') || '';
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
  const navigate = useNavigate();
  const location = useLocation();

  const currentView = useMemo(() => {
    const path = location.pathname;
    if (path === '/income') return 'income';
    if (path === '/cashflow') return 'cashflow';
    if (path === '/about') return 'about';
    if (path === '/contact') return 'contact';
    return 'equation';
  }, [location.pathname]);


  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error((t('errorOccurred') || 'Error') + '\n' + (error.message || ''));
    }
  };

  // Auth Effect
  useEffect(() => {
    getRedirectResult(auth).catch((error: any) => {
      console.error("Redirect login error:", error);
      toast.error((t('errorOccurred') || 'Error') + '\n' + (error.message || ''));
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, [t]);

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
          nextRecurrenceDate: data.nextRecurrenceDate,
          attachmentUrl: data.attachmentUrl
        });
      });
      setTransactions(txs);

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

    const nameExists = allAccounts.some(
      a => a.name.toLowerCase() === trimmedName.toLowerCase() ||
        t(a.name).toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      toast.error(t('accountExists'));
      return null;
    }

    const newId = 'custom_' + crypto.randomUUID().substring(0, 9);
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

    toast.success(t('accountAdded'));
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

        if (currentDate <= now) {
          let currentTx = { ...tx };
          let safetyLimit = 0;

          while (currentDate <= now && safetyLimit < 100) {
            safetyLimit++;
            hasChanges = true;

            const newTx: Transaction = {
              id: crypto.randomUUID().substring(0, 9),
              date: currentDate.toLocaleDateString('ar-SA'),
              description: currentTx.description,
              impacts: currentTx.impacts.map(i => ({ ...i, id: crypto.randomUUID().substring(0, 9) })),
              createdAt: new Date().toISOString()
            };
            newTransactions.push(newTx);

            const prevTime = currentDate.getTime();
            if (currentTx.recurrenceInterval === 'daily') currentDate.setDate(currentDate.getDate() + 1);
            else if (currentTx.recurrenceInterval === 'weekly') currentDate.setDate(currentDate.getDate() + 7);
            else if (currentTx.recurrenceInterval === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1);
            else if (currentTx.recurrenceInterval === 'yearly') currentDate.setFullYear(currentDate.getFullYear() + 1);
            else break;

            // If date didn't change (invalid date calculation), break to avoid infinite loop
            if (currentDate.getTime() === prevTime) break;

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
      .map(a => ({ name: t(a.name), value: Math.max(0, totals.accounts[a.id] || 0) }))
      .filter(d => d.value > 0);
  }, [assets, totals.accounts, t]);

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
    const netProfit = (totals.accounts['revenue'] || 0) + (totals.accounts['expenses'] || 0);

    return {
      currentRatio,
      debtToEquity,
      netProfit,
    };
  }, [totals]);

  const profitTrendData = useMemo(() => {
    const monthlyData: Record<string, number> = {};

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
    })).slice(-12);
  }, [transactions]);

  // --- Confetti Celebration Effect ---
  const [showConfetti, setShowConfetti] = useState(false);
  const prevBalancedRef = useRef(totals.isBalanced);
  const shouldCelebrateRef = useRef(false);

  useEffect(() => {
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
    if (!description.trim()) return toast.error(t('enterDescription'));

    const validImpacts = impacts.filter(i => i.amount !== 0);
    if (validImpacts.length === 0) return toast.error(t('enterValidAmount'));

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
            impacts: validImpacts.map(i => ({ ...i, id: crypto.randomUUID().substring(0, 9) })),
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
      const txId = crypto.randomUUID().substring(0, 9);
      const attachmentUrl = await uploadFile(txId);
      const newTx: Transaction = {
        id: txId,
        date: date || new Date().toLocaleDateString('ar-SA'),
        description,
        impacts: validImpacts.map(i => ({ ...i, id: crypto.randomUUID().substring(0, 9) })),
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
    triggerConfirmation({
      title: language === 'ar' ? 'حذف عمليات متعددة' : 'Delete Multiple Transactions',
      message: t('confirmDeleteMultiple'),
      confirmText: language === 'ar' ? 'حذف' : 'Delete',
      cancelText: language === 'ar' ? 'إلغاء' : 'Cancel',
      onConfirm: () => {
        const remainingTransactions = transactions.filter(t => !selectedTransactions.has(t.id));
        updateTransactions(remainingTransactions);
        setSelectedTransactions(new Set());
        setConfirmModalOpen(false);
      }
    });
  };

  const handleClearAll = () => {
    triggerConfirmation({
      title: language === 'ar' ? 'مسح كافة البيانات' : 'Clear All Data',
      message: t('confirmClearAll'),
      confirmText: language === 'ar' ? 'مسح الكل' : 'Clear All',
      cancelText: language === 'ar' ? 'إلغاء' : 'Cancel',
      onConfirm: () => {
        updateTransactions([]);
        setSelectedTransactions(new Set());
        setConfirmModalOpen(false);
      }
    });
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
        `"${tx.description.replace(/"/g, '""')}"`,
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
      const originalMaxHeight = tableElement.style.maxHeight;
      const originalOverflow = tableElement.style.overflow;
      const wasHidden = tableElement.classList.contains('hidden');

      tableElement.style.maxHeight = 'none';
      tableElement.style.overflow = 'visible';
      if (wasHidden) {
        tableElement.classList.remove('hidden');
        tableElement.classList.remove('md:block');
      }

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(tableElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedTable = clonedDoc.getElementById('transactions-table');
          if (clonedTable) {
            clonedTable.style.maxHeight = 'none';
            clonedTable.style.overflow = 'visible';
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

      tableElement.style.maxHeight = originalMaxHeight;
      tableElement.style.overflow = originalOverflow;
      if (wasHidden) {
        tableElement.classList.add('hidden');
        tableElement.classList.add('md:block');
      }

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Table is empty or not visible.");
      }

      const imgData = canvas.toDataURL('image/png');
      if (imgData === 'data:,') {
        throw new Error("Failed to generate image data from table.");
      }

      const pdfWidth = Math.max(canvas.width / 2, 1);
      const pdfHeight = Math.max(canvas.height / 2, 1);

      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'l' : 'p',
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('transactions.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(t('errorExportingPDF') + '\n' + (error as Error).message);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    const curr = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
    return `${formatted} ${curr.symbol}`;
  };

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

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 flex-grow">
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
    { id: 'about', label: t('aboutUs'), icon: Info, color: 'emerald' },
    { id: 'contact', label: t('contactUs'), icon: Mail, color: 'emerald' },
  ];

  return (
    <>
      <div className="relative w-full max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-10 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        <Toaster position="top-center" richColors theme={theme === 'system' ? 'system' : theme} dir={dir} />
        <SpeedInsights />

        {/* Header */}
        <header className={cn(
          "sticky top-2 md:top-4 z-40 transition-all duration-500 px-2 md:px-0",
          isScrolled ? "md:translate-y-0" : "md:translate-y-2"
        )}>
          <div className="glass w-full rounded-[2rem] md:rounded-[2.5rem] p-2.5 md:px-4 lg:px-6 md:py-3 shadow-xl md:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border dark:border-white/10 border-slate-200/50 flex items-center justify-between max-w-[1850px] mx-auto backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden group transition-all duration-500 hover:scale-105 transform-gpu flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30 border border-cyan-500/20 bg-gradient-to-br from-slate-100 to-white dark:from-slate-900 dark:to-indigo-950">
                <MotazinLogo className="w-10 h-10 md:w-11 md:h-11 group-hover:scale-110 transition-transform duration-500 transform-gpu relative z-0 drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight bg-gradient-to-l from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">{t('appTitle')}</h1>
                <p className="text-[10px] sm:text-[13px] font-black dark:text-cyan-400/80 text-indigo-600 uppercase tracking-widest mt-0.5">{t('appSubtitle')}</p>
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
                {deferredPrompt && (
                  <button
                    onClick={handleInstallClick}
                    className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[13px] font-black transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('installApp') || 'تثبيت التطبيق'}</span>
                  </button>
                )}
                
                {/* Language Switcher */}
                <div className="relative" ref={langRef}>
                  <button
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="flex items-center gap-2 pl-3 lg:pl-9 pr-3 lg:pr-4 py-2.5 dark:bg-white/5 bg-slate-100/80 hover:bg-white/10 dark:border-white/10 border-slate-200 rounded-2xl text-[13px] font-black dark:text-white/90 text-black transition-all shadow-sm group"
                  >
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="hidden lg:inline-block">
                      {language === 'ar' ? 'العربية' : language === 'en' ? 'English' : language === 'fr' ? 'Français' : language === 'es' ? 'Español' : language === 'tr' ? 'Türkçe' : language === 'ur' ? 'اردو' : language === 'ja' ? '日本語' : language === 'zh' ? '中文' : language === 'ru' ? 'Русский' : language === 'pt' ? 'Português' : 'English'}
                    </span>
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
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                </button>

                {/* User Profile */}
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
                    <button onClick={handleGoogleLogin} className="text-[11px] font-black uppercase text-indigo-400">
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
                  <button onClick={handleUndo} disabled={historyIndex === 0} className="p-2 disabled:opacity-20" aria-label="Undo"><Undo2 className="w-4 h-4" /></button>
                  <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-2 disabled:opacity-20" aria-label="Redo"><Redo2 className="w-4 h-4" /></button>
                </div>
                <button onClick={handleClearAll} className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Drawer Overlay */}
        <div className={cn(
          "fixed inset-0 z-[250] md:hidden transition-all duration-300",
          isMobileMenuOpen ? "visible" : "invisible"
        )}>
          <div
            className={cn(
              "absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-500",
              isMobileMenuOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          <div className={cn(
            "fixed top-0 bottom-0 w-[85%] max-w-xs dark:bg-slate-900/95 bg-white/95 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[260] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col overflow-hidden",
            language === 'ar'
              ? (isMobileMenuOpen ? "right-0 rounded-l-[2.5rem]" : "-right-full rounded-l-none")
              : (isMobileMenuOpen ? "left-0 rounded-r-[2.5rem]" : "-left-full rounded-r-none")
          )} dir={dir}>
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

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('navigation') || 'Navigation'}</p>
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <Link
                        key={item.id}
                        to={item.id === 'equation' ? '/equation' : `/${item.id}`}
                        onClick={() => {
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
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{t('quickActions') || 'Quick Actions'}</p>
                <div className="space-y-2">
                  {deferredPrompt && (
                    <button
                      onClick={handleInstallClick}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-700/20"
                    >
                      <div className="p-2 rounded-xl bg-white/20">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-widest">{t('installApp') || 'تثبيت التطبيق'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setIsPdfScannerOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/80 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <div className="p-2 rounded-xl bg-indigo-500/10">
                      <Plus className="w-5 h-5 text-indigo-500" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">{t('scanPDF')}</span>
                  </button>
                  <button
                    onClick={() => { setIsSnapshotsModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/80 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                      <Plus className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">{t('backups')}</span>
                  </button>
                </div>
              </div>

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
                        "py-3 rounded-xl border text-[11px] font-black transition-all active:scale-95 shadow-sm",
                        language === lang.id
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 dark:text-white/80 text-slate-600"
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Desktop */}
        <div className="hidden md:flex justify-center w-full">
          <div className="glass p-2 rounded-[2rem] flex items-center gap-2 shadow-lg dark:border-white/10 border-slate-200/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.id === 'equation' ? '/equation' : `/${item.id}`}
                  onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-black uppercase tracking-wider transition-all duration-300 relative group active:scale-95",
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "dark:text-white/80 text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Balanced Status Banner */}
        <div className="flex justify-center md:hidden">
          <div className={cn(
            "px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border animate-pulse-slow",
            totals.isBalanced ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          )}>
            <div className={cn("w-2 h-2 rounded-full", totals.isBalanced ? "bg-emerald-400" : "bg-rose-400")} />
            {totals.isBalanced ? t('equationBalanced') : t('equationUnbalanced')}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="pb-32 md:pb-8 md:mb-0">
          <Routes>
            <Route path="/" element={<Navigate to="/equation" replace />} />
            <Route path="/equation" element={
              <div className="animate-scale-in space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
                  {/* Desktop sidebar form */}
                  <div className="hidden md:block xl:col-span-4 space-y-6 animate-fade-in [animation-delay:400ms]">
                    <TransactionForm
                      editingTransactionId={editingTransactionId}
                      date={date}
                      setDate={setDate}
                      description={description}
                      setDescription={setDescription}
                      selectedFile={selectedFile}
                      setSelectedFile={setSelectedFile}
                      isRecurring={isRecurring}
                      setIsRecurring={setIsRecurring}
                      recurrenceInterval={recurrenceInterval}
                      setRecurrenceInterval={setRecurrenceInterval}
                      impacts={impacts}
                      handleAddImpact={handleAddImpact}
                      handleRemoveImpact={handleRemoveImpact}
                      handleImpactChange={handleImpactChange}
                      handleSubmit={handleAddTransaction}
                      handleCancelEdit={handleCancelEdit}
                      isUploading={isUploading}
                      allAccounts={allAccounts}
                      currency={currency}
                      setCustomAccountModalIdx={setCustomAccountModalIdx}
                      setNewCustomAccountName={setNewCustomAccountName}
                      setNewCustomAccountCategory={setNewCustomAccountCategory}
                    />

                    {/* Dashboard Equation Status & Budget Warnings */}
                    <EquationDashboard
                      totals={totals}
                      budgets={budgets}
                      setBudgets={setBudgets}
                      isEditingBudgets={isEditingBudgets}
                      setIsEditingBudgets={setIsEditingBudgets}
                      handleSaveBudgets={handleSaveBudgets}
                      activeAccounts={activeAccounts}
                      formatCurrency={formatCurrency}
                    />
                  </div>

                  {/* Right Column: Transactions Table */}
                  <TransactionTable
                    transactions={transactions}
                    selectedTransactions={selectedTransactions}
                    historyIndex={historyIndex}
                    historyLength={history.length}
                    handleUndo={handleUndo}
                    handleRedo={handleRedo}
                    setIsPdfScannerOpen={setIsPdfScannerOpen}
                    setIsDepreciationModalOpen={setIsDepreciationModalOpen}
                    handleBulkDelete={handleBulkDelete}
                    handleExportCSV={handleExportCSV}
                    handleExportPDF={handleExportPDF}
                    assets={assets}
                    liabilities={liabilities}
                    equities={equities}
                    totals={totals}
                    formatCurrency={formatCurrency}
                    allAccounts={allAccounts}
                    handleEditTransaction={handleEditTransaction}
                    handleDeleteTransaction={handleDeleteTransaction}
                    handleSelectTransaction={handleSelectTransaction}
                    handleSelectAll={handleSelectAll}
                    setPreviewUrl={setPreviewUrl}
                    setIsDocPreviewOpen={setIsDocPreviewOpen}
                    currency={currency}
                  />
                </div>

                {/* Financial Charts */}
                <FinancialCharts
                  mounted={mounted}
                  transactions={transactions}
                  assetChartData={assetChartData}
                  incomeExpenseData={incomeExpenseData}
                  theme={theme}
                  currency={currency}
                  colors={COLORS}
                />

                {/* Financial Insights */}
                <FinancialInsights
                  transactions={transactions}
                  totals={totals}
                  insights={insights}
                  profitTrendData={profitTrendData}
                  theme={theme}
                  currency={currency}
                  formatCurrency={formatCurrency}
                />
              </div>
            } />
            <Route path="/income" element={
              <IncomeStatementView
                formatCurrency={formatCurrency}
                transactions={transactions}
              />
            } />
            <Route path="/cashflow" element={
              <CashFlowView
                formatCurrency={formatCurrency}
                transactions={transactions}
              />
            } />
            <Route path="/about" element={<AboutUsView />} />
            <Route path="/contact" element={<ContactUsView />} />
            <Route path="*" element={<Navigate to="/equation" replace />} />
          </Routes>
        </main>
      </div>

      {/* Snapshots & Backups Modal */}
      <Suspense fallback={null}>
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
      </Suspense>

      {/* OCR/PDF Scanner Modal */}
      {isPdfScannerOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <PdfScanner
            geminiApiKey={geminiApiKey}
            onClose={() => setIsPdfScannerOpen(false)}
            onImport={(rows: ParsedRow[]) => {
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
                  id: r.id || crypto.randomUUID().substring(0, 9),
                  date: r.date,
                  description: r.description,
                  impacts: impacts.map(i => ({ ...i, id: crypto.randomUUID().substring(0, 9) })),
                  createdAt: new Date().toISOString()
                };
              });
              updateTransactions([...transactions, ...newTransactions]);
              setIsPdfScannerOpen(false);
              toast.success(language === 'ar' ? 'تم استيراد البيانات بنجاح!' : 'Data imported successfully!');
            }}
          />
        </Suspense>
      )}

      {/* Depreciation Modal */}
      <Suspense fallback={null}>
        <DepreciationModal
          isOpen={isDepreciationModalOpen}
          onClose={() => setIsDepreciationModalOpen(false)}
          assets={allAccounts.filter(a => a.category === 'asset' && !['cash', 'bank', 'ar', 'inventory', 'supplies', 'prepaid_expenses'].includes(a.id))}
          onApply={(accountId, amount, description) => {
            const txId = crypto.randomUUID().substring(0, 9);
            const newTx: Transaction = {
              id: txId,
              date: new Date().toLocaleDateString('en-GB'),
              description: description,
              impacts: [
                { id: crypto.randomUUID().substring(0, 9), accountId: 'expenses', amount: amount },
                { id: crypto.randomUUID().substring(0, 9), accountId: accountId, amount: -amount }
              ],
              createdAt: new Date().toISOString()
            };
            updateTransactions([...transactions, newTx]);
            setIsDepreciationModalOpen(false);
            toast.success(language === 'ar' ? 'تم إضافة قيد الإهلاك بنجاح!' : 'Depreciation entry added successfully!');
          }}
        />
      </Suspense>

      {/* Document Attachment Preview Modal */}
      <DocPreviewModal
        isOpen={isDocPreviewOpen}
        url={previewUrl}
        onClose={() => setIsDocPreviewOpen(false)}
      />

      {/* Custom Account Creator Modal */}
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
                <label htmlFor="new-custom-account-name" className="text-[10px] uppercase font-bold tracking-widest block mb-2 text-theme-muted">
                  {language === 'ar' ? 'اسم الحساب' : 'Account Name'}
                </label>
                <input
                  id="new-custom-account-name"
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

      {/* Mobile Modal Form Wrapper */}
      {isTransactionFormOpen && (
        <TransactionForm
          editingTransactionId={editingTransactionId}
          date={date}
          setDate={setDate}
          description={description}
          setDescription={setDescription}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          isRecurring={isRecurring}
          setIsRecurring={setIsRecurring}
          recurrenceInterval={recurrenceInterval}
          setRecurrenceInterval={setRecurrenceInterval}
          impacts={impacts}
          handleAddImpact={handleAddImpact}
          handleRemoveImpact={handleRemoveImpact}
          handleImpactChange={handleImpactChange}
          handleSubmit={(e) => {
            handleAddTransaction(e);
            setIsTransactionFormOpen(false);
          }}
          handleCancelEdit={handleCancelEdit}
          isUploading={isUploading}
          allAccounts={allAccounts}
          currency={currency}
          setCustomAccountModalIdx={setCustomAccountModalIdx}
          setNewCustomAccountName={setNewCustomAccountName}
          setNewCustomAccountCategory={setNewCustomAccountCategory}
          isModal={true}
          onCloseModal={() => {
            setIsTransactionFormOpen(false);
            handleCancelEdit();
          }}
          modalScrollRef={modalScrollRef}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[90] glass-card !rounded-[2.5rem] !p-1 border dark:border-white/20 border-slate-300 dark:bg-slate-900/90 bg-white/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] pb-safe">
        <div className="flex justify-around items-center h-14 relative">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <Link
                key={item.id}
                to={item.id === 'equation' ? '/equation' : `/${item.id}`}
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all relative", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}
              >
                <Icon className={cn("w-5 h-5", isActive ? "scale-110" : "scale-100")} />
                <span className="text-[7px] font-black uppercase mt-1">
                  {item.id === 'equation' ? t('dashboard') : (language === 'ar' ? 'الدخل' : 'Income')}
                </span>
              </Link>
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
              <Link
                key={item.id}
                to={item.id === 'equation' ? '/equation' : `/${item.id}`}
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all relative", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")}
              >
                <Icon className={cn("w-5 h-5", isActive ? "scale-110" : "scale-100")} />
                <span className="text-[7px] font-black uppercase mt-1">
                  {item.id === 'about' ? (language === 'ar' ? 'عنا' : 'About') : (language === 'ar' ? 'تواصل' : 'Contact')}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {showConfetti && <Confetti />}

      <Suspense fallback={null}>
        <ChatWidget
          financialContext={{
            accounts: totals.accounts,
            totalAssets: totals.totalAssets,
            totalLiabilities: totals.totalLiabilities,
            totalEquity: totals.totalEquity,
            isBalanced: totals.isBalanced,
            transactionCount: transactions.length,
            netProfit: insights.netProfit,
            currentRatio: insights.currentRatio,
            debtToEquity: insights.debtToEquity,
          }}
          geminiApiKey={geminiApiKey}
          onApiKeyChange={(key) => {
            setGeminiApiKey(key);
            localStorage.setItem('motazin_gemini_api_key', key);
          }}
        />
      </Suspense>

      <ConfirmationModal
        isOpen={confirmModalOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalOpen(false)}
        dir={dir}
      />
    </>
  );
}
