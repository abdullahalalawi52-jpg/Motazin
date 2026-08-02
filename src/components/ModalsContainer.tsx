import React, { Suspense } from 'react';
import { useLanguage } from '../i18n';
import { toast } from 'sonner';
import { generateId } from '../utils/uuid';
import { toIsoDateString } from '../utils/date';
import { useAppStore } from '../store/useAppStore';
import { ConfirmationModal } from './ConfirmationModal';
import { DocPreviewModal } from './DocPreviewModal';
import { TransactionForm } from './TransactionForm';
import { Transaction, Account, Category } from '../types/accounting';
import { TransactionFormData } from '../hooks/useTransactionForm';

// Lazy loaded modals
const PdfScanner = React.lazy(() => import('./modals/PdfScanner').then(module => ({ default: module.FileScanner })));
const DepreciationModal = React.lazy(() => import('./modals/DepreciationModal').then(module => ({ default: module.DepreciationModal })));
const VatCalculatorModal = React.lazy(() => import('./modals/VatCalculatorModal').then(module => ({ default: module.VatCalculatorModal })));
const SnapshotsModal = React.lazy(() => import('./modals/SnapshotsModal').then(module => ({ default: module.SnapshotsModal })));
const ChatWidget = React.lazy(() => import('./modals/Chat').then(module => ({ default: module.ChatWidget })));

interface ModalsContainerProps {
  transactions: Transaction[];
  budgets: Record<string, number>;
  allAccounts: Account[];
  totals: {
    accounts: Record<string, number>;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    isBalanced: boolean;
  };
  insights: {
    netProfit: number;
    currentRatio: number;
    debtToEquity: number;
  };
  updateTransactions: (transactions: Transaction[]) => void;
  handleAddTransaction: (data: TransactionFormData) => void;
  handleCancelEdit: () => void;
  addCustomAccount: (name: string, category: Category) => Promise<Account | null>;
  modalScrollRef: React.RefObject<HTMLDivElement>;
}

export const ModalsContainer = ({
  transactions,
  budgets,
  allAccounts,
  totals,
  insights,
  updateTransactions,
  handleAddTransaction,
  handleCancelEdit,
  addCustomAccount,
  modalScrollRef,
}: ModalsContainerProps) => {
  const { t, dir } = useLanguage();
  
  const {
    confirmModalOpen, setConfirmModalOpen, confirmModalConfig,
    isPdfScannerOpen, setIsPdfScannerOpen,
    isDepreciationModalOpen, setIsDepreciationModalOpen,
    isVatModalOpen, setIsVatModalOpen,
    isSnapshotsModalOpen, setIsSnapshotsModalOpen,
    isTransactionFormOpen, setIsTransactionFormOpen,
    isDocPreviewOpen, setIsDocPreviewOpen,
    previewUrl,
    editingTransactionId,
    isUploading,
    currency,
    geminiApiKey, setGeminiApiKey,
    setBudgets
  } = useAppStore();

  return (
    <>
      {/* Snapshots & Backups Modal */}
      <Suspense fallback={null}>
        <SnapshotsModal
          isOpen={isSnapshotsModalOpen}
          onClose={() => setIsSnapshotsModalOpen(false)}
          currentTransactions={transactions}
          currentBudgets={budgets}
          onLoadSnapshot={(loadedTransactions: Transaction[], loadedBudgets: Record<string, number>) => {
            updateTransactions(loadedTransactions);
            setBudgets(loadedBudgets);
            toast.success(t('backupLoaded') || 'Backup loaded successfully!');
          }}
        />
      </Suspense>

      {/* OCR/PDF Scanner Modal */}
      {isPdfScannerOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <PdfScanner
            geminiApiKey={geminiApiKey}
            onClose={() => setIsPdfScannerOpen(false)}
            onImport={(rows: Array<{ id?: string; date: string; description: string; amount: number; accountId?: string; creditAccountId?: string; }>) => {
              const newTransactions = rows.map(r => {
                const accountId = r.accountId || 'bank';
                const account = allAccounts.find((a: Account) => a.id === accountId);
                const category = account?.category || 'asset';

                let impacts = [];
                if (r.creditAccountId) {
                  impacts = [
                    { accountId: r.accountId || 'cash', amount: r.amount, type: 'debit' as const },
                    { accountId: r.creditAccountId, amount: r.amount, type: 'credit' as const }
                  ];
                } else if (category === 'asset') {
                  impacts = [
                    { accountId: accountId, amount: r.amount, type: 'debit' as const },
                    { accountId: 'capital', amount: r.amount, type: 'credit' as const }
                  ];
                } else if (category === 'liability') {
                  impacts = [
                    { accountId: accountId, amount: r.amount, type: 'debit' as const },
                    { accountId: 'capital', amount: r.amount, type: 'credit' as const }
                  ];
                } else {
                  impacts = [
                    { accountId: accountId, amount: r.amount, type: 'debit' as const },
                    { accountId: 'bank', amount: r.amount, type: 'credit' as const }
                  ];
                }

                return {
                  id: r.id || generateId(),
                  date: r.date,
                  description: r.description,
                  impacts: impacts.map(i => ({ ...i, id: generateId() })),
                  createdAt: new Date().toISOString()
                };
              });
              updateTransactions([...transactions, ...newTransactions]);
              setIsPdfScannerOpen(false);
              toast.success(t('dataImported') || 'Data imported successfully!');
            }}
          />
        </Suspense>
      )}

      {/* Depreciation Modal */}
      <Suspense fallback={null}>
        <DepreciationModal
          isOpen={isDepreciationModalOpen}
          onClose={() => setIsDepreciationModalOpen(false)}
          assets={allAccounts.filter((a: Account) => a.category === 'asset' && !['cash', 'bank', 'ar', 'inventory', 'supplies', 'prepaid_expenses'].includes(a.id))}
          onApply={(accountId: string, amount: number, description: string) => {
            const txId = generateId();
            const newTx = {
              id: txId,
              date: toIsoDateString(new Date()),
              description: description,
              impacts: [
                { id: generateId(), accountId: 'expenses', amount: amount },
                { id: generateId(), accountId: accountId, amount: -amount }
              ],
              createdAt: new Date().toISOString()
            };
            updateTransactions([...transactions, newTx]);
            setIsDepreciationModalOpen(false);
            toast.success(t('depreciationAdded') || 'Depreciation entry added successfully!');
          }}
        />
      </Suspense>

      {/* VAT Calculator Modal */}
      <Suspense fallback={null}>
        <VatCalculatorModal
          isOpen={isVatModalOpen}
          onClose={() => setIsVatModalOpen(false)}
          accounts={allAccounts}
          onApply={(taxAccountId: string, amount: number, description: string) => {
            const txId = generateId();
            const newTx = {
              id: txId,
              date: toIsoDateString(new Date()),
              description: description,
              impacts: [
                { id: generateId(), accountId: taxAccountId, amount: amount },
                { id: generateId(), accountId: 'bank', amount: -amount } // Default offset
              ],
              createdAt: new Date().toISOString()
            };
            updateTransactions([...transactions, newTx]);
            setIsVatModalOpen(false);
            toast.success(t('transactionAdded') || 'Transaction added successfully!');
          }}
        />
      </Suspense>

      {/* Document Attachment Preview Modal */}
      <DocPreviewModal
        isOpen={isDocPreviewOpen}
        url={previewUrl}
        onClose={() => setIsDocPreviewOpen(false)}
      />

      {/* Mobile Modal Form Wrapper */}
      {isTransactionFormOpen && (
        <TransactionForm
          initialTransaction={transactions.find((t: Transaction) => t.id === editingTransactionId)}
          onSubmit={(data: TransactionFormData) => {
            handleAddTransaction(data);
            setIsTransactionFormOpen(false);
          }}
          onCancel={handleCancelEdit}
          isUploading={isUploading}
          allAccounts={allAccounts}
          currency={currency}
          addCustomAccount={addCustomAccount}
          isModal={true}
          onCloseModal={() => {
            setIsTransactionFormOpen(false);
            handleCancelEdit();
          }}
          modalScrollRef={modalScrollRef}
        />
      )}

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
          onApiKeyChange={(key: string) => {
            setGeminiApiKey(key);
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
};
