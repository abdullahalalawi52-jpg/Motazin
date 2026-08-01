import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { useTheme } from './ThemeContext';
import { useLanguage } from './i18n';
import { Toaster, toast } from 'sonner';

import { SpeedInsights } from '@vercel/speed-insights/react';
import { cn } from './utils/cn';

import { Transaction } from './types/accounting';
import { CURRENCIES } from './constants/accounting';

import { useHistory } from './hooks/useHistory';
import { useTransactions } from './hooks/useTransactions';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { useRecurringTransactions } from './hooks/useRecurringTransactions';
import { useAccountingPeriod } from './hooks/useAccountingPeriod';
import { useFinancialInsights } from './hooks/useFinancialInsights';
import { useAppStore } from './store/useAppStore';
import { handleExportCSV, handleExportPDF } from './utils/export';

// Custom Hooks
import { useAuth } from './hooks/useAuth';
import { useAppEffects } from './hooks/useAppEffects';
import { useTransactionHandlers } from './hooks/useTransactionHandlers';
import { authService } from './services/authService';

// Component imports
import { MainLayout } from './layouts/MainLayout';
const AboutUsView = React.lazy(() => import('./components/AboutUsView').then(module => ({ default: module.AboutUsView })));
const ContactUsView = React.lazy(() => import('./components/ContactUsView').then(module => ({ default: module.ContactUsView })));
const IncomeStatementView = React.lazy(() => import('./components/IncomeStatementView').then(module => ({ default: module.IncomeStatementView })));
const CashFlowView = React.lazy(() => import('./components/CashFlowView').then(module => ({ default: module.CashFlowView })));
const TrialBalanceView = React.lazy(() => import('./components/TrialBalanceView').then(module => ({ default: module.TrialBalanceView })));
const EquityChangesView = React.lazy(() => import('./components/EquityChangesView').then(module => ({ default: module.EquityChangesView })));
const FinancialRatiosView = React.lazy(() => import('./components/FinancialRatiosView').then(module => ({ default: module.FinancialRatiosView })));

import { TransactionForm } from './components/TransactionForm';
import { EquationDashboard } from './components/EquationDashboard';
import { TransactionTable } from './components/TransactionTable';
const FinancialCharts = React.lazy(() => import('./components/FinancialCharts').then(module => ({ default: module.FinancialCharts })));
const FinancialInsights = React.lazy(() => import('./components/FinancialInsights').then(module => ({ default: module.FinancialInsights })));
import { PageTransition } from './components/PageTransition';
import { Skeleton, SkeletonCard, SkeletonRow } from './components/SkeletonLoader';
import { AnimatePresence } from 'framer-motion';

import { ModalsContainer } from './components/ModalsContainer';
import { OfflineBadge } from './components/OfflineBadge';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function App() {
  const { t, language, dir } = useLanguage();
  const { theme } = useTheme();
  
  const {
    user, setUser, isAuthReady, setIsAuthReady,
    deferredPrompt, handleInstallClick, handleGoogleLogin
  } = useAuth();

  const {
    setConfirmModalOpen,
    triggerConfirmation,
    setIsPdfScannerOpen,
    setIsDepreciationModalOpen,
    setIsVatModalOpen,
    setIsSnapshotsModalOpen,
    isTransactionFormOpen, setIsTransactionFormOpen,
    setIsDocPreviewOpen,
    setPreviewUrl,
    isEditingBudgets, setIsEditingBudgets,
    editingTransactionId, setEditingTransactionId,
    selectedTransactions, setSelectedTransactions,
    isUploading, setIsUploading,
    currency, setCurrency,
    budgets, setBudgets,
  } = useAppStore();

  const location = useLocation();

  const currentView = useMemo(() => {
    const path = location.pathname;
    if (path === '/income') return 'income';
    if (path === '/cashflow') return 'cashflow';
    if (path === '/trial-balance') return 'trial-balance';
    if (path === '/equity-changes') return 'equity-changes';
    if (path === '/financial-ratios') return 'financial-ratios';
    if (path === '/about') return 'about';
    if (path === '/contact') return 'contact';
    return 'equation';
  }, [location.pathname]);

  const modalScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isTransactionFormOpen && modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  }, [isTransactionFormOpen]);

  // --- 1. Transactions & Custom Accounts ---
  const {
    transactions,
    setTransactions,
    setCustomAccounts,
    allAccounts,
    saveTransactions,
    addCustomAccount,
  } = useTransactions(user, t);

  // --- 2. Undo/Redo Action Stack ---
  const {
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    applyAction,
    handleUndo,
    handleRedo,
  } = useHistory(transactions, setTransactions, saveTransactions);

  const updateTransactions = async (newTransactions: Transaction[], skipHistory = false) => {
    if (!skipHistory) {
      const added = newTransactions.filter(n => !transactions.some(o => o.id === n.id));
      const deleted = transactions.filter(o => !newTransactions.some(n => n.id === o.id));
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ type: 'BATCH', added, deleted });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    await saveTransactions(newTransactions);
  };

  // --- 3. Firestore synchronizations & Dual Storage ---
  useFirestoreSync(user, setTransactions, setBudgets, setCurrency, setCustomAccounts);

  // --- 4. Recurring Transactions Processor ---
  useRecurringTransactions(user, transactions, updateTransactions, t);

  // --- 5. Accounting Period filter ---
  const { accountingPeriod, setAccountingPeriod, filteredTransactions, previousFilteredTransactions } = useAccountingPeriod(transactions);

  // --- 6. Financial Insights memoizations ---
  const {
    totals,
    previousTotals,
    insights,
    assetChartData,
    incomeExpenseData,
    profitTrendData,
    assets,
    liabilities,
    equities,
    incomes,
    expenses,
    activeAccounts,
  } = useFinancialInsights(filteredTransactions, allAccounts, t, previousFilteredTransactions);

  // Setup Auth state listener within App (to sync with history properly)
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      setHistory([]);
      setHistoryIndex(-1);
      if (!currentUser) {
        const saved = localStorage.getItem('motazin_transactions');
        if (saved) {
          try {
            setTransactions(JSON.parse(saved));
          } catch {
            setTransactions([]);
          }
        } else {
          setTransactions([]);
        }
      }
    });
    return () => unsubscribe();
  }, [setHistory, setHistoryIndex, setTransactions, setUser, setIsAuthReady]);

  // --- Effects ---
  const [hasInitialBalance, setHasInitialBalance] = useState(totals.isBalanced);
  const isFormDirty = editingTransactionId !== null;
  useAppEffects(totals.isBalanced, hasInitialBalance, setHasInitialBalance, isFormDirty, budgets, totals.accounts, language);

  // --- Handlers ---
  const handlers = useTransactionHandlers({
    transactions, updateTransactions, applyAction,
    selectedTransactions, setSelectedTransactions,
    editingTransactionId, setEditingTransactionId,
    setIsTransactionFormOpen, setConfirmModalOpen,
    triggerConfirmation, user, budgets, setIsEditingBudgets,
    setCurrency, setIsUploading, t, language
  });

  const handleExportCSVWrapper = () => handleExportCSV(transactions, allAccounts, assets, liabilities, equities, incomes, expenses, totals, t);
  const handleExportPDFWrapper = () => handleExportPDF(
    filteredTransactions,
    allAccounts,
    assets,
    liabilities,
    equities,
    incomes,
    expenses,
    totals,
    t
  );

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
        <div className="glass rounded-[2.5rem] p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="hidden md:block w-24 h-10 rounded-2xl" />
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <Skeleton className="hidden md:block w-32 h-10 rounded-2xl" />
          </div>
        </div>

        {/* Navigation Tabs Skeleton */}
        <div className="hidden md:flex justify-center w-full">
          <div className="glass p-2 rounded-[2rem] flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="w-28 h-10 rounded-full" />
            ))}
          </div>
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 flex-grow max-w-[1920px] mx-auto w-full">
          <div className="col-span-1 md:col-span-5 space-y-6">
            <div className="glass-card p-6 space-y-6">
              <Skeleton className="w-1/2 h-6" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="col-span-1 h-12 rounded-2xl" />
                <Skeleton className="col-span-2 h-12 rounded-2xl" />
              </div>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>

          <div className="col-span-1 md:col-span-7">
            <div className="glass-card p-6 h-full space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Skeleton className="w-16 h-8 rounded-xl" />
                  <Skeleton className="w-24 h-8 rounded-xl" />
                </div>
                <Skeleton className="w-24 h-8 rounded-xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-12 rounded-xl" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleTransactionDrop = (transactionId: string, newAccountId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      const newImpacts = [...transaction.impacts];
      // Try to determine which impact to update (usually the first one, or the one that isn't 'bank'/'cash')
      // For simplicity, we update the first impact unless it's 'bank', then we update the second.
      const impactToUpdate = newImpacts.length > 1 && newImpacts[0].accountId === 'bank' ? 1 : 0;
      newImpacts[impactToUpdate] = { ...newImpacts[impactToUpdate], accountId: newAccountId };
      handlers.handleEditTransaction({ ...transaction, impacts: newImpacts });
      toast.success(language === 'ar' ? 'تم نقل المعاملة بنجاح' : 'Transaction moved successfully');
    }
  };

  return (
    <>
    <MainLayout
      user={user}
      currentView={currentView}
      currency={currency}
      handleCurrencyChange={handlers.handleCurrencyChange}
      accountingPeriod={accountingPeriod}
      setAccountingPeriod={setAccountingPeriod}
      historyIndex={historyIndex}
      historyLength={history.length}
      handleUndo={handleUndo}
      handleRedo={handleRedo}
      handleClearAll={handlers.handleClearAll}
      setIsPdfScannerOpen={setIsPdfScannerOpen}
      setIsSnapshotsModalOpen={setIsSnapshotsModalOpen}
      setIsTransactionFormOpen={setIsTransactionFormOpen}
      setEditingTransactionId={setEditingTransactionId}
      handleCancelEdit={handlers.handleCancelEdit}
      handleGoogleLogin={handleGoogleLogin}
      deferredPrompt={deferredPrompt}
      handleInstallClick={handleInstallClick}
    >
      <Toaster position="top-center" richColors theme={theme === 'system' ? 'system' : theme} dir={dir} />
      <SpeedInsights />

      <div className="relative w-full max-w-[1920px] mx-auto">
        
        {/* Balanced Status Banner */}
        <div className="flex justify-center md:hidden mb-4 sm:mb-6 mt-2">
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
          <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8"><Skeleton className="w-16 h-16 rounded-full" /></div>}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/equation" replace />} />
              <Route path="/equation" element={
                <PageTransition>
                  <div className="space-y-6 sm:space-y-8">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
                      {/* Desktop sidebar form */}
                      <div className="hidden md:block xl:col-span-5 space-y-6 rtl:order-last ltr:order-first">
                        <TransactionForm
                          initialTransaction={transactions.find(t => t.id === editingTransactionId)}
                          onSubmit={handlers.handleAddTransaction}
                          onCancel={handlers.handleCancelEdit}
                          isUploading={isUploading}
                          allAccounts={allAccounts}
                          currency={currency}
                          addCustomAccount={addCustomAccount}
                        />

                        {/* Dashboard Equation Status & Budget Warnings */}
                        <EquationDashboard
                          totals={totals}
                          previousTotals={previousTotals}
                          budgets={budgets}
                          setBudgets={setBudgets}
                          isEditingBudgets={isEditingBudgets}
                          setIsEditingBudgets={setIsEditingBudgets}
                          handleSaveBudgets={handlers.handleSaveBudgets}
                          activeAccounts={activeAccounts}
                          formatCurrency={formatCurrency}
                          onTransactionDrop={handleTransactionDrop}
                        />
                      </div>

                      {/* Right Column: Transactions Table */}
                      <TransactionTable
                        transactions={filteredTransactions}
                        selectedTransactions={selectedTransactions}
                        setIsPdfScannerOpen={setIsPdfScannerOpen}
                        setIsDepreciationModalOpen={setIsDepreciationModalOpen}
                        setIsVatModalOpen={setIsVatModalOpen}
                        handleBulkDelete={handlers.handleBulkDelete}
                        handleExportCSV={handleExportCSVWrapper}
                        handleExportPDF={handleExportPDFWrapper}
                        assets={assets}
                        liabilities={liabilities}
                        equities={equities}
                        incomes={incomes}
                        expenses={expenses}
                        totals={totals}
                        formatCurrency={formatCurrency}
                        allAccounts={allAccounts}
                        handleEditTransaction={handlers.handleEditTransaction}
                        handleDeleteTransaction={handlers.handleDeleteTransaction}
                        handleSelectTransaction={handlers.handleSelectTransaction}
                        handleSelectAll={handlers.handleSelectAll}
                        setPreviewUrl={setPreviewUrl}
                        setIsDocPreviewOpen={setIsDocPreviewOpen}
                      />
                    </div>

                    {/* Financial Charts */}
                    <React.Suspense fallback={<div className="h-96 flex items-center justify-center glass-card"><Skeleton className="w-full h-full rounded-2xl opacity-50" /></div>}>
                      <FinancialCharts
                        transactions={transactions}
                        assetChartData={assetChartData}
                        incomeExpenseData={incomeExpenseData}
                        theme={theme}
                        currency={currency}
                        colors={COLORS}
                      />
                    </React.Suspense>

                    {/* Financial Insights */}
                    <React.Suspense fallback={<div className="h-64 flex items-center justify-center glass-card mt-6"><Skeleton className="w-full h-full rounded-2xl opacity-50" /></div>}>
                      <FinancialInsights
                        transactions={transactions}
                        totals={totals}
                        insights={insights}
                        profitTrendData={profitTrendData}
                        theme={theme}
                        currency={currency}
                        formatCurrency={formatCurrency}
                      />
                    </React.Suspense>
                  </div>
                </PageTransition>
              } />
              <Route path="/income" element={
                <PageTransition>
                  <IncomeStatementView
                    formatCurrency={formatCurrency}
                    transactions={transactions}
                  />
                </PageTransition>
              } />
              <Route path="/cashflow" element={
                <PageTransition>
                  <CashFlowView
                    formatCurrency={formatCurrency}
                    transactions={transactions}
                  />
                </PageTransition>
              } />
              <Route path="/trial-balance" element={
                <PageTransition>
                  <TrialBalanceView
                    formatCurrency={formatCurrency}
                    accounts={totals.accounts}
                    activeAccounts={activeAccounts}
                  />
                </PageTransition>
              } />
              <Route path="/equity-changes" element={
                <PageTransition>
                  <EquityChangesView
                    formatCurrency={formatCurrency}
                    accounts={totals.accounts}
                    totalEquity={totals.totalEquity}
                  />
                </PageTransition>
              } />
              <Route path="/financial-ratios" element={
                <PageTransition>
                  <FinancialRatiosView
                    accounts={totals.accounts}
                    activeAccounts={activeAccounts}
                    totalAssets={totals.totalAssets}
                    totalLiabilities={totals.totalLiabilities}
                    totalEquity={totals.totalEquity}
                    netIncome={insights.netProfit}
                    profitTrendData={profitTrendData}
                  />
                </PageTransition>
              } />
              <Route path="/about" element={<PageTransition><AboutUsView /></PageTransition>} />
              <Route path="/contact" element={<PageTransition><ContactUsView /></PageTransition>} />
              <Route path="*" element={<Navigate to="/equation" replace />} />
            </Routes>
          </AnimatePresence>
          </React.Suspense>
        </main>
      </div>
    </MainLayout>
      <OfflineBadge />
      <ModalsContainer
        transactions={transactions}
        budgets={budgets}
        allAccounts={allAccounts}
        totals={totals}
        insights={insights}
        updateTransactions={updateTransactions}
        handleAddTransaction={handlers.handleAddTransaction}
        handleCancelEdit={handlers.handleCancelEdit}
        addCustomAccount={addCustomAccount}
        modalScrollRef={modalScrollRef}
      />
    </>
  );
}
