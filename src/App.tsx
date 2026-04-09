import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Calculator, CheckCircle2, XCircle, AlertCircle, ArrowRightLeft, Target, Edit2, Save, Undo2, Redo2, Globe, FileSpreadsheet, FileText, LogOut, Paperclip, Eye, FileImage, ImageIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Toaster, toast } from 'sonner';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { auth, db, googleProvider, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { useLanguage } from './i18n';
import { FileScanner as PdfScanner } from './PdfScanner';
import { DepreciationModal } from './DepreciationModal';

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
  id: string;
  accountId: string;
  amount: number;
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
  { id: 'accrued_expenses', name: 'accrued_expenses', category: 'liability' },
  { id: 'unearned_revenues', name: 'unearned_revenues', category: 'liability' },
  { id: 'mortgages_payable', name: 'mortgages_payable', category: 'liability' },
  // Equity
  { id: 'capital', name: 'capital', category: 'equity' },
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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // History State for Undo/Redo
  const [history, setHistory] = useState<Transaction[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Currency State
  const [currency, setCurrency] = useState('SAR');

  // Budget State
  const [budgets, setBudgets] = useState<Record<string, number>>({
    cars: 20000,
    furniture: 12000,
    expenses: 5000
  });
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);
  
  // PDF Scanner State
  const [isPdfScannerOpen, setIsPdfScannerOpen] = useState(false);
  const [isDepreciationModalOpen, setIsDepreciationModalOpen] = useState(false);

  // Document Archiving State
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDocPreviewOpen, setIsDocPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'equation' | 'income' | 'cashflow'>('equation');

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return unsubscribe;
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
      } else {
        // Initialize user doc
        setDoc(userDocRef, {
          currency: 'SAR',
          budgets: { cars: 20000, furniture: 12000, expenses: 5000 },
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
    if (!user) return;

    if (!skipHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newTransactions);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    
    setTransactions(newTransactions);

    try {
      const batch = writeBatch(db);
      const txRef = collection(db, 'users', user.uid, 'transactions');
      
      const newIds = new Set(newTransactions.map(t => t.id));
      
      // Delete removed
      transactions.forEach(tx => {
        if (!newIds.has(tx.id)) {
          batch.delete(doc(txRef, tx.id));
        }
      });
      
      // Set added/updated
      newTransactions.forEach(tx => {
        batch.set(doc(txRef, tx.id), {
          date: tx.date,
          description: tx.description,
          impacts: tx.impacts,
          createdAt: tx.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isRecurring: tx.isRecurring || false,
          recurrenceInterval: tx.recurrenceInterval || null,
          nextRecurrenceDate: tx.nextRecurrenceDate || null
        }, { merge: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error updating transactions:", error);
      toast.error(t('errorSavingTransactions'));
    }
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
    return ACCOUNTS.filter(a => activeAccountIds.includes(a.id));
  }, [activeAccountIds]);

  const assets = activeAccounts.filter(a => a.category === 'asset');
  const liabilities = activeAccounts.filter(a => a.category === 'liability');
  const equities = activeAccounts.filter(a => a.category === 'equity');

  // Calculate totals
  const totals = useMemo(() => {
    const accTotals: Record<string, number> = {};
    activeAccountIds.forEach(id => accTotals[id] = 0);

    transactions.forEach(t => {
      t.impacts.forEach(i => {
        if (accTotals[i.accountId] !== undefined) {
          accTotals[i.accountId] += i.amount;
        }
      });
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    assets.forEach(a => totalAssets += accTotals[a.id]);
    liabilities.forEach(a => totalLiabilities += accTotals[a.id]);
    equities.forEach(a => totalEquity += accTotals[a.id]);

    return {
      accounts: accTotals,
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced: totalAssets === (totalLiabilities + totalEquity)
    };
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
      const accountName = ACCOUNTS.find(a => a.id === accountId)?.name || '';

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

  const handleAddTransaction = (e: React.FormEvent) => {
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
      const updatedTransactions = transactions.map(tx => {
        if (tx.id === editingTransactionId) {
          return {
            ...tx,
            date: date || new Date().toLocaleDateString('ar-SA'),
            description,
            impacts: validImpacts.map(i => ({ ...i, id: Math.random().toString(36).substr(2, 9) })),
            isRecurring,
            recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
            nextRecurrenceDate: isRecurring ? (tx.nextRecurrenceDate || nextDate) : undefined
          };
        }
        return tx;
      });
      updateTransactions(updatedTransactions);
      setEditingTransactionId(null);
    } else {
      const newTx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        date: date || new Date().toLocaleDateString('ar-SA'),
        description,
        impacts: validImpacts.map(i => ({ ...i, id: Math.random().toString(36).substr(2, 9) })),
        createdAt: new Date().toISOString(),
        isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
        nextRecurrenceDate: isRecurring ? nextDate : undefined
      };
      updateTransactions([...transactions, newTx]);
    }
    
    // Reset form
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (!user) return;
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
      // Temporarily remove max-height to capture full table
      const originalMaxHeight = tableElement.style.maxHeight;
      const originalOverflow = tableElement.style.overflow;
      tableElement.style.maxHeight = 'none';
      tableElement.style.overflow = 'visible';

      const canvas = await html2canvas(tableElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      // Restore original styles
      tableElement.style.maxHeight = originalMaxHeight;
      tableElement.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for wide tables
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add a title
      pdf.addFont('Arial', 'Arial', 'normal');
      pdf.setFont('Arial');
      
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
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
    return impact ? impact.amount : 0;
  };

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-800/20 text-white">{t('loading')}</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10" dir={dir}>
        <div className="glass-card p-10 max-w-md w-full text-center animate-fade-in">
          <Calculator className="w-16 h-16 text-indigo-400 mx-auto mb-6 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
          <h1 className="text-2xl font-bold text-white mb-2">{t('appTitle')}</h1>
          <p className="text-white mb-8">{t('loginPrompt')}</p>
          <button 
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {t('loginGoogle')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8 z-10 animate-fade-in">
      <Toaster position="top-center" richColors theme="dark" dir="rtl" />
      
      {isPdfScannerOpen && (
        <PdfScanner 
          onClose={() => setIsPdfScannerOpen(false)}
          onImport={(rows) => {
            const newTransactions = rows.map(r => {
              const accountId = r.accountId || 'bank'; // Use account selected by user in scanner
              const account = ACCOUNTS.find(a => a.id === accountId);
              const category = account?.category || 'asset';

              let impacts: Omit<Impact, 'id'>[] = [];
              if (category === 'asset') {
                impacts = [
                  { accountId: accountId, amount: r.amount },
                  { accountId: 'capital', amount: r.amount } // Balancer
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
            const updated = [...transactions, ...newTransactions];
            setTransactions(updated);
            updateTransactions(updated);
            toast.success(t('added') || 'Import completed successfully');
          }}
        />
      )}

      {isDepreciationModalOpen && (
        <DepreciationModal
          isOpen={isDepreciationModalOpen}
          onClose={() => setIsDepreciationModalOpen(false)}
          assets={assets.map(a => ({ id: a.id, name: a.name }))}
          onApply={(accountId, amount, description) => {
            const newTx: Transaction = {
              id: Math.random().toString(36).substr(2, 9),
              date: new Date().toLocaleDateString('ar-SA'),
              description,
              impacts: [
                { id: Math.random().toString(36).substr(2, 9), accountId, amount },
                { id: Math.random().toString(36).substr(2, 9), accountId: 'expenses', amount }
              ],
              createdAt: new Date().toISOString()
            };
            updateTransactions([...transactions, newTx]);
            toast.success(t('added'));
          }}
        />
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-6 gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/50 backdrop-blur-md rounded-xl border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.5)]">
            <Calculator className="w-6 h-6 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('appTitle')}</h1>
            <p className="text-[15px] text-white mt-1">{t('appSubtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 border border-white/20 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <Globe className="w-4 h-4 text-white" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-white text-[15px] font-medium border-none outline-none cursor-pointer focus:ring-0 appearance-none pr-4"
              dir="ltr"
            >
              <option value="ar" className="bg-slate-900 border-none">العربية</option>
              <option value="en" className="bg-slate-900 border-none">English</option>
              <option value="fr" className="bg-slate-900 border-none">Français</option>
              <option value="es" className="bg-slate-900 border-none">Español</option>
              <option value="tr" className="bg-slate-900 border-none">Türkçe</option>
              <option value="ur" className="bg-slate-900 border-none">اردو</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mr-4 bg-slate-800/20 px-3 py-1.5 rounded-lg border border-white/10">
            <img src={user.photoURL || ''} alt="Profile" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
            <span className="text-[15px] font-medium text-white">{user.displayName}</span>
            <button 
              onClick={() => signOut(auth)}
              className="text-white hover:text-rose-600 transition-colors mr-2"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/30 px-2 py-1.5 rounded-md border border-white/10 ml-2">
            <Globe className="w-4 h-4 text-white" />
            <select 
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="bg-transparent text-[15px] font-medium text-white outline-none cursor-pointer"
              dir="rtl"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code} className="bg-slate-800 text-white">{t(c.name)} ({c.symbol})</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-2 text-white hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-70 disabled:hover:bg-transparent disabled:hover:text-white"
            title={t('undo')}
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button 
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            className="p-2 text-white hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-70 disabled:hover:bg-transparent disabled:hover:text-white"
            title={t('redo')}
          >
            <Redo2 className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button 
            onClick={handleClearAll}
            className="text-[15px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-md transition-colors"
          >
            {t('clearAll')}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/20 p-1.5 rounded-2xl border border-white/10 w-fit mx-auto md:mx-0">
        <button
          onClick={() => setCurrentView('equation')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-widest flex items-center gap-2",
            currentView === 'equation' 
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Calculator className="w-4 h-4" />
          {t('balanceSheet')}
        </button>
        <button
          onClick={() => setCurrentView('income')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-widest flex items-center gap-2",
            currentView === 'income' 
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <FileText className="w-4 h-4" />
          {t('incomeStatement')}
        </button>
        <button
          onClick={() => setCurrentView('cashflow')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-widest flex items-center gap-2",
            currentView === 'cashflow' 
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <ArrowRightLeft className="w-4 h-4" />
          {t('cashFlowStatement')}
        </button>
      </div>

      {currentView === 'equation' ? (
        <>
          {/* Charts Section */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Asset Distribution Pie Chart */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              {t('assetDistribution')}
            </h2>
            <div className="h-[300px] w-full">
              {assetChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
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
                <div className="h-full flex items-center justify-center text-white">
                  {t('noAssets')}
                </div>
              )}
            </div>
          </div>

          {/* Income vs Expenses Bar Chart */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
              {t('incomeExpenses')}
            </h2>
            <div className="h-[300px] w-full">
              {incomeExpenseData.some(d => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeExpenseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b' }}
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
                <div className="h-full flex items-center justify-center text-white">
                  {t('noIncomeExpenses')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Financial Insights Section */}
      {transactions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/20 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('financialInsights')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Ratio Card */}
            <div className="glass-card p-6 border-l-4 border-indigo-400">
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 text-sm font-medium">{t('currentRatio')}</span>
                <div className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase",
                  insights.currentRatio >= 1.5 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                )}>
                  {insights.currentRatio >= 1.5 ? t('healthyLiquidity') : t('lowLiquidity')}
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{insights.currentRatio.toFixed(2)}</div>
              <p className="text-xs text-slate-500">{t('currentRatioDesc')}</p>
            </div>

            {/* Debt-to-Equity Card */}
            <div className="glass-card p-6 border-l-4 border-amber-400">
              <span className="text-slate-400 text-sm font-medium block mb-2">{t('debtToEquity')}</span>
              <div className="text-3xl font-bold text-white mb-1">{insights.debtToEquity.toFixed(2)}</div>
              <p className="text-xs text-slate-500">{t('debtToEquityDesc')}</p>
            </div>

            {/* Net Profit Card */}
            <div className="glass-card p-6 border-l-4 border-emerald-400">
              <span className="text-slate-400 text-sm font-medium block mb-2">{t('netProfit')}</span>
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
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-6">{t('monthlyProfitTrend')}</h3>
            <div className="h-[300px] w-full">
              {profitTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(value)}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form & Status Dashboard */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 border-t-4 border-indigo-500 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
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
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('date')}</label>
                  <input 
                    type="text" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    placeholder={t('exampleDate')}
                    className="w-full glass-input px-4 py-3 text-sm font-bold focus:border-indigo-500/50 transition-all outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{t('description')}</label>
                  <input 
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
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('attachDocument')}</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-3 px-4 py-4 bg-slate-900/40 border-2 border-white/5 border-dashed rounded-2xl hover:bg-slate-800/60 hover:border-indigo-500/30 cursor-pointer transition-all group overflow-hidden relative">
                    <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <Paperclip className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs text-slate-300 font-bold truncate max-w-[180px] relative z-10">
                      {selectedFile ? selectedFile.name : t('attachDocument')}
                    </span>
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
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
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                  />
                  <span className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{t('recurringTransaction')}</span>
                </label>
                
                {isRecurring && (
                  <div className="flex items-center gap-3 animate-fade-in pl-2 border-l border-white/10">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('repeatsEveryLabel')}</span>
                    <select
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value as any)}
                      className="px-4 py-2 border border-white/10 rounded-xl text-xs font-black focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-900 text-white cursor-pointer hover:bg-slate-800 transition-colors"
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
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('impactOnAccounts')}</label>
                  <button 
                    type="button" 
                    onClick={handleAddImpact}
                    className="text-[10px] font-black text-indigo-400 hover:text-white flex items-center gap-2 transition-all bg-indigo-500/10 hover:bg-indigo-500 px-4 py-2.5 rounded-xl border border-indigo-500/20 uppercase tracking-tighter"
                  >
                    <Plus className="w-4 h-4" /> {t('addAccount')}
                  </button>
                </div>
                
                <div className="space-y-4">
                  {impacts.map((impact, idx) => (
                    <div key={idx} className="glass-card p-5 relative border-l-4 border-indigo-500 group transition-all hover:scale-[1.01] hover:shadow-indigo-500/10 overflow-hidden">
                      {/* Delete Impact Button */}
                      <button 
                        type="button"
                        onClick={() => handleRemoveImpact(idx)}
                        disabled={impacts.length <= 2}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-rose-400 disabled:opacity-0 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 z-10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        {/* Account Picker */}
                        <div className="md:col-span-12 lg:col-span-7 space-y-2">
                          <label className="text-[9px] uppercase font-black text-indigo-400/60 tracking-widest block ml-1">{t('accountName')}</label>
                          <select 
                            value={impact.accountId}
                            onChange={e => handleImpactChange(idx, 'accountId', e.target.value)}
                            className="w-full px-4 py-3 border border-white/5 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950/60 text-white font-bold cursor-pointer transition-colors"
                          >
                            <optgroup label={t('assets')} className="bg-slate-900 text-indigo-400 font-bold uppercase text-[10px]">
                              {ACCOUNTS.filter(a => a.category === 'asset').map(a => (
                                <option key={a.id} value={a.id} className="bg-slate-900 text-white font-bold text-sm">{t(a.name)}</option>
                              ))}
                            </optgroup>
                            <optgroup label={t('liabilities')} className="bg-slate-900 text-rose-400 font-bold uppercase text-[10px]">
                              {ACCOUNTS.filter(a => a.category === 'liability').map(a => (
                                <option key={a.id} value={a.id} className="bg-slate-900 text-white font-bold text-sm">{t(a.name)}</option>
                              ))}
                            </optgroup>
                            <optgroup label={t('equity')} className="bg-slate-900 text-emerald-400 font-bold uppercase text-[10px]">
                              {ACCOUNTS.filter(a => a.category === 'equity').map(a => (
                                <option key={a.id} value={a.id} className="bg-slate-900 text-white font-bold text-sm">{t(a.name)}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                        
                        {/* Value Input Area */}
                        <div className="md:col-span-12 lg:col-span-5 space-y-2">
                          <label className="text-[9px] uppercase font-black text-indigo-400/60 tracking-widest block ml-1">{t('impactValue')}</label>
                          {(() => {
                            const amount = impact.amount || 0;
                            const isNeg = amount < 0 || Object.is(amount, -0);
                            return (
                              <div className="flex flex-col gap-3">
                                {/* Segmented Debit/Credit Control */}
                                <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 w-full shadow-inner">
                                  <button
                                    type="button"
                                    onClick={() => handleImpactChange(idx, 'amount', Math.abs(amount))}
                                    className={cn(
                                      "flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                                      !isNeg ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]" : "text-slate-500 hover:text-white"
                                    )}
                                  >
                                    {t('debit')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleImpactChange(idx, 'amount', Math.abs(amount) === 0 ? -0 : -Math.abs(amount))}
                                    className={cn(
                                      "flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                                      isNeg ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-[1.02]" : "text-slate-500 hover:text-white"
                                    )}
                                  >
                                    {t('credit')}
                                  </button>
                                </div>

                                <div className="relative group/input">
                                  <input 
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={amount !== 0 ? Math.abs(amount) : ''}
                                    onChange={e => {
                                      const val = Math.abs(parseFloat(e.target.value) || 0);
                                      handleImpactChange(idx, 'amount', isNeg ? (val === 0 ? -0 : -val) : val);
                                    }}
                                    placeholder="0.00"
                                    className={cn(
                                      "w-full pl-4 pr-14 py-3.5 border border-white/5 rounded-2xl text-xl focus:ring-2 focus:ring-indigo-500 outline-none text-right font-mono transition-all bg-slate-950/80 shadow-2xl",
                                      isNeg ? "text-rose-400 focus:border-rose-500/50" : "text-emerald-400 focus:border-emerald-500/50"
                                    )}
                                    dir="ltr"
                                  />
                                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 pointer-events-none group-focus-within/input:text-white transition-colors uppercase">
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
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group"
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
                    className="px-8 bg-slate-800/60 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-xs"
                  >
                    {t('cancel')}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Balance Equation Status Visualization */}
          <div className={cn(
            "rounded-[2.5rem] shadow-2xl border-2 p-8 transition-all duration-700 backdrop-blur-3xl overflow-hidden relative",
            totals.isBalanced ? "bg-emerald-950/20 border-emerald-500/10" : "bg-rose-950/20 border-rose-500/10"
          )}>
            {/* Background Glow */}
            <div className={cn(
              "absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 rounded-full",
              totals.isBalanced ? "bg-emerald-500" : "bg-rose-500"
            )}></div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
              <div className={cn(
                "p-5 rounded-[2rem] shadow-2xl",
                totals.isBalanced ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              )}>
                {totals.isBalanced ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className={cn(
                  "text-2xl font-black mb-2 tracking-tight",
                  totals.isBalanced ? "text-emerald-400" : "text-rose-400"
                )}>
                  {totals.isBalanced ? t('equationBalanced') : t('equationUnbalanced')}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                    <span className="text-[10px] uppercase font-black text-slate-500 block mb-2 tracking-widest">{t('totalAssets')}</span>
                    <span className="text-xl font-black text-white" dir="ltr">{formatCurrency(totals.totalAssets)}</span>
                  </div>
                  <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                    <span className="text-[10px] uppercase font-black text-slate-500 block mb-2 tracking-widest">{t('totalLiabilitiesEquity')}</span>
                    <span className="text-xl font-black text-white" dir="ltr">{formatCurrency(totals.totalLiabilities + totals.totalEquity)}</span>
                  </div>
                </div>
                
                {!totals.isBalanced && (
                  <div className="mt-6 p-5 bg-rose-500/10 rounded-3xl border border-rose-500/20 flex flex-col sm:flex-row justify-between items-center gap-2 group hover:bg-rose-500/20 transition-all">
                    <span className="text-xs font-black text-rose-300 uppercase tracking-widest">{t('difference')}</span>
                    <span className="text-2xl font-black text-rose-400 drop-shadow-lg" dir="ltr">{formatCurrency(Math.abs(totals.totalAssets - (totals.totalLiabilities + totals.totalEquity)))}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Budget Status Card */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                {t('budgetAlerts')}
              </h2>
              <button
                onClick={() => isEditingBudgets ? handleSaveBudgets() : setIsEditingBudgets(true)}
                className="text-white hover:text-indigo-600 transition-colors p-1"
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
                    "p-4 rounded-xl border transition-colors duration-300",
                    catIsOverBudget ? "bg-rose-50 border-rose-200" : catIsApproachingBudget ? "bg-amber-50 border-amber-200" : "bg-slate-800/20 border-white/5"
                  )}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className={cn(
                        "text-[15px] font-bold flex items-center gap-1.5",
                        catIsOverBudget ? "text-rose-800" : catIsApproachingBudget ? "text-amber-800" : "text-white"
                      )}>
                        {t(category)}
                        {catIsOverBudget && <AlertCircle className="w-4 h-4 text-rose-500" />}
                        {catIsApproachingBudget && <AlertCircle className="w-4 h-4 text-amber-500" />}
                      </h3>
                      <span className={cn(
                        "text-sm font-medium font-bold",
                        catIsOverBudget ? "text-rose-700" : catIsApproachingBudget ? "text-amber-700" : "text-white"
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
                                isOverBudget ? "text-rose-700" : isApproachingBudget ? "text-amber-700" : "text-white"
                              )}>
                                {t(account.name)}
                                {isOverBudget && <AlertCircle className="w-3 h-3 text-rose-500" />}
                                {isApproachingBudget && <AlertCircle className="w-3 h-3 text-amber-500" />}
                              </span>
                              {isEditingBudgets ? (
                                <input
                                  type="number"
                                  value={allocated || ''}
                                  onChange={(e) => setBudgets({ ...budgets, [account.id]: parseFloat(e.target.value) || 0 })}
                                  className="w-24 px-2 py-1 border border-white/20 rounded text-left text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                                  dir="ltr"
                                  placeholder="0"
                                />
                              ) : (
                                <span className="text-white text-[11px]" dir="ltr">
                                  <span className={cn("font-bold", isOverBudget ? 'text-rose-600' : isApproachingBudget ? 'text-amber-600' : 'text-white')}>
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

        {/* Right Column: Table */}
        <div className="lg:col-span-7">
          <div className="glass-card overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-white/10 bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-white" />
                  {t('transactionHistory')}
                </h2>
                <button 
                  onClick={() => setIsPdfScannerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-lg transition-colors border border-indigo-500/30 shadow-sm"
                  title={t('importFiles') || 'Import Files/Images'}
                >
                  <FileText className="w-4 h-4" />
                  {t('importFiles') || 'استيراد ملفات/صور'}
                </button>
                <button 
                  onClick={() => setIsDepreciationModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 rounded-lg transition-colors border border-amber-500/30 shadow-sm"
                  title={t('depreciationCalc')}
                >
                  <Calculator className="w-4 h-4" />
                  {t('depreciationCalc')}
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-medium text-white bg-slate-800/40 border border-white/10 rounded-lg hover:bg-slate-800/20 hover:text-indigo-600 transition-colors shadow-sm"
                    title={t('exportCSV')}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-medium text-white bg-slate-800/40 border border-white/10 rounded-lg hover:bg-slate-800/20 hover:text-rose-600 transition-colors shadow-sm"
                    title={t('exportPDF')}
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              )}
            </div>
            
            {transactions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-white">
                <Calculator className="w-16 h-16 mb-4 opacity-20" />
                <p>{t('noTransactions')}</p>
                <p className="text-[15px] mt-1">{t('addTransactionPrompt')}</p>
              </div>
            ) : (
              <div id="transactions-table" className="overflow-auto flex-1 relative max-h-[600px] bg-slate-800/40">
                <table className="w-full text-[15px] text-right border-collapse">
                  <thead className="sticky top-0 z-20 text-white shadow-sm ring-1 ring-slate-200">
                    {/* Category Headers */}
                    <tr>
                      <th className="p-3 border-l border-white/10 w-10 bg-slate-800/30 text-center">
                        <input 
                          type="checkbox" 
                          checked={transactions.length > 0 && selectedTransactions.size === transactions.length}
                          onChange={handleSelectAll}
                          className="rounded border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3 border-l border-white/10 font-semibold w-20 bg-slate-800/30">{t('date')}</th>
                      <th className="p-3 border-l border-white/10 font-semibold min-w-[200px] bg-slate-800/30">{t('description')}</th>
                      
                      {assets.length > 0 && (
                        <th colSpan={assets.length} className="p-3 border-l border-white/10 font-bold text-center bg-indigo-100 text-indigo-900">
                          {t('assets')}
                        </th>
                      )}
                      
                      {liabilities.length > 0 && (
                        <th colSpan={liabilities.length} className="p-3 border-l border-white/10 font-bold text-center bg-amber-100 text-amber-900">
                          {t('liabilities')}
                        </th>
                      )}
                      
                      {equities.length > 0 && (
                        <th colSpan={equities.length} className="p-3 border-l border-white/10 font-bold text-center bg-emerald-100 text-emerald-900">
                          {t('equity')}
                        </th>
                      )}
                      <th className="p-3 w-10 bg-slate-800/30"></th>
                    </tr>
                    {/* Account Headers */}
                    <tr className="border-b border-white/10">
                      <th className="p-2 border-l border-white/10 bg-slate-800/20"></th>
                      <th className="p-2 border-l border-white/10 bg-slate-800/20"></th>
                      <th className="p-2 border-l border-white/10 bg-slate-800/20"></th>
                      
                      {assets.map(a => (
                        <th key={a.id} className="p-2 border-l border-white/10 font-medium text-center text-indigo-800 bg-indigo-50">{t(a.name)}</th>
                      ))}
                      
                      {liabilities.map(a => (
                        <th key={a.id} className="p-2 border-l border-white/10 font-medium text-center text-amber-800 bg-amber-50">{t(a.name)}</th>
                      ))}
                      
                      {equities.map(a => (
                        <th key={a.id} className="p-2 border-l border-white/10 font-medium text-center text-emerald-800 bg-emerald-50">{t(a.name)}</th>
                      ))}
                      <th className="bg-slate-800/20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="even:bg-slate-800/20/80 hover:bg-slate-800/30/80 transition-colors group">
                        <td className="p-3 border-l border-white/5 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedTransactions.has(tx.id)}
                            onChange={() => handleSelectTransaction(tx.id)}
                            className="rounded border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 border-l border-white/5 whitespace-nowrap text-white">{tx.date}</td>
                        <td className="p-3 border-l border-white/5 text-white">
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
                            <td key={a.id} className={cn(
                              "p-3 border-l border-white/5 text-center font-mono",
                              amt > 0 ? "text-emerald-600" : amt < 0 ? "text-rose-600" : "text-white"
                            )} dir="ltr">
                              {formatCurrency(amt)}
                            </td>
                          );
                        })}
                        
                        {liabilities.map(a => {
                          const amt = getImpactAmount(tx, a.id);
                          return (
                            <td key={a.id} className={cn(
                              "p-3 border-l border-white/5 text-center font-mono",
                              amt > 0 ? "text-emerald-600" : amt < 0 ? "text-rose-600" : "text-white"
                            )} dir="ltr">
                              {formatCurrency(amt)}
                            </td>
                          );
                        })}
                        
                        {equities.map(a => {
                          const amt = getImpactAmount(tx, a.id);
                          return (
                            <td key={a.id} className={cn(
                              "p-3 text-center font-mono",
                              amt > 0 ? "text-emerald-600" : amt < 0 ? "text-rose-600" : "text-white"
                            )} dir="ltr">
                              {formatCurrency(amt)}
                            </td>
                          );
                        })}
                        
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => handleEditTransaction(tx)}
                              className="p-1.5 text-white hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title={t('editTransaction')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-1.5 text-white hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
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
                  <tfoot className="sticky bottom-0 z-20 bg-slate-800/30 border-t-2 border-white/20 font-bold shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <tr>
                      <td colSpan={3} className="p-4 border-l border-white/10 text-left text-white bg-slate-800/30">
                        {t('grandTotal')}
                      </td>
                      
                      {assets.map(a => (
                        <td key={a.id} className="p-4 border-l border-white/10 text-center text-indigo-900 font-mono bg-indigo-50/80" dir="ltr">
                          {formatCurrency(totals.accounts[a.id])}
                        </td>
                      ))}
                      
                      {liabilities.map(a => (
                        <td key={a.id} className="p-4 border-l border-white/10 text-center text-amber-900 font-mono bg-amber-50/80" dir="ltr">
                          {formatCurrency(totals.accounts[a.id])}
                        </td>
                      ))}
                      
                      {equities.map(a => (
                        <td key={a.id} className="p-4 border-l border-white/10 text-center text-emerald-900 font-mono bg-emerald-50/80" dir="ltr">
                          {formatCurrency(totals.accounts[a.id])}
                        </td>
                      ))}
                      <td className="bg-slate-800/30"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            
            {/* Final Equation Summary */}
            {transactions.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-md border-t border-white/10 text-white p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 font-mono text-lg">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-white font-sans mb-1">{t('assets')}</span>
                  <span className="text-indigo-300">{formatCurrency(totals.totalAssets)}</span>
                </div>
                <span className="text-white">=</span>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-white font-sans mb-1">{t('liabilities')}</span>
                  <span className="text-amber-300">{formatCurrency(totals.totalLiabilities)}</span>
                </div>
                <span className="text-white">+</span>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-white font-sans mb-1">{t('equity')}</span>
                  <span className="text-emerald-300">{formatCurrency(totals.totalEquity)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  ) : (
        <IncomeStatementView 
          totals={totals}
          currency={currency}
          formatCurrency={formatCurrency}
          t={t}
          transactions={transactions}
        />
      )}

      <DocPreviewModal 
        isOpen={isDocPreviewOpen} 
        url={previewUrl} 
        onClose={() => setIsDocPreviewOpen(false)} 
      />
    </div>
  );
}

// --- Component: IncomeStatementView ---
const IncomeStatementView: React.FC<{ 
  totals: any, 
  currency: string, 
  formatCurrency: (amt: number) => string, 
  t: any,
  transactions: Transaction[] 
}> = ({ totals, currency, formatCurrency, t, transactions }) => {
  const revenueAccounts = ACCOUNTS.filter(a => a.id === 'revenue'); // For now, we only have one revenue account
  const expenseAccounts = ACCOUNTS.filter(a => a.id === 'expenses'); // and one expenses account

  const totalRevenue = Math.abs(totals.accounts['revenue'] || 0);
  const totalExpenses = Math.abs(totals.accounts['expenses'] || 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div id="income-statement-report" className="glass-card p-8 animate-fade-in space-y-8 bg-slate-900">
      <div className="text-center space-y-2 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black text-white">{t('incomeStatement')}</h2>
        <p className="text-slate-400">{t('periodEnding')}: {new Date().toLocaleDateString('ar-SA')}</p>
      </div>

      <div className="space-y-6">
        {/* Revenue Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-400 uppercase tracking-widest flex justify-between">
            <span>{t('revenue')}</span>
            <span dir="ltr">{formatCurrency(totalRevenue)}</span>
          </h3>
          <div className="bg-slate-900/40 rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-right">
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white font-medium">{t('totalRevenue')}</td>
                  <td className="p-4 text-white font-mono" dir="ltr">{formatCurrency(totalRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-rose-400 uppercase tracking-widest flex justify-between">
            <span>{t('operatingExpenses')}</span>
            <span dir="ltr">{formatCurrency(totalExpenses)}</span>
          </h3>
          <div className="bg-slate-900/40 rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-right">
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white font-medium">{t('totalOperatingExpenses')}</td>
                  <td className="p-4 text-white font-mono" dir="ltr">{formatCurrency(totalExpenses)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Income Section */}
        <div className="pt-6 border-t border-white/20">
          <div className={cn(
            "p-6 rounded-3xl flex justify-between items-center",
            netIncome >= 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
          )}>
            <span className={cn(
              "text-2xl font-black uppercase tracking-tighter",
              netIncome >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {t('netIncome')}
            </span>
            <span className={cn(
              "text-3xl font-black font-mono",
              netIncome >= 0 ? "text-emerald-400" : "text-rose-400"
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
              const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0f172a'
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
function CashFlowView({ transactions, formatCurrency }: { transactions: Transaction[], formatCurrency: (val: number) => string }) {
  const { t } = useLanguage();

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
    <div id="cash-flow-report" className="glass-card p-8 animate-fade-in space-y-8 bg-slate-900 border border-white/10">
      <div className="text-center space-y-2 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black text-white">{t('cashFlowStatement')}</h2>
        <p className="text-slate-400">{t('periodEnding')}: {new Date().toLocaleDateString('ar-SA')}</p>
      </div>

      <div className="space-y-6">
        {/* Operating Activities */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-400 uppercase tracking-widest flex justify-between">
            <span>{t('operatingActivities')}</span>
            <span dir="ltr" className={operatingTotal >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {formatCurrency(operatingTotal)}
            </span>
          </h3>
        </div>

        {/* Investing Activities */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-amber-400 uppercase tracking-widest flex justify-between">
            <span>{t('investingActivities')}</span>
            <span dir="ltr" className={investingTotal >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {formatCurrency(investingTotal)}
            </span>
          </h3>
        </div>

        {/* Financing Activities */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-widest flex justify-between">
            <span>{t('financingActivities')}</span>
            <span dir="ltr" className={financingTotal >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {formatCurrency(financingTotal)}
            </span>
          </h3>
        </div>

        {/* Total Net Cash Flow */}
        <div className="pt-6 border-t border-white/20">
          <div className={cn(
            "p-6 rounded-3xl flex justify-between items-center",
            netCashFlow >= 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
          )}>
            <span className={cn(
              "text-2xl font-black uppercase tracking-tighter",
              netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {t('netCashFlow')}
            </span>
            <div className="text-right">
              <div className={cn(
                "text-3xl font-black font-mono",
                netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"
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
              const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0f172a'
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

const IncomeStatementView = ({ transactions, formatCurrency }: { transactions: Transaction[], formatCurrency: (val: number) => string }) => {
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
