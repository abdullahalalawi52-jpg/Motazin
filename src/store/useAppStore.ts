import { create } from 'zustand';

export interface ConfirmModalConfig {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
}

interface AppState {
  // Modals
  isPdfScannerOpen: boolean;
  setIsPdfScannerOpen: (isOpen: boolean) => void;
  
  isDepreciationModalOpen: boolean;
  setIsDepreciationModalOpen: (isOpen: boolean) => void;
  isVatModalOpen: boolean;
  setIsVatModalOpen: (isOpen: boolean) => void;
  
  isSnapshotsModalOpen: boolean;
  setIsSnapshotsModalOpen: (isOpen: boolean) => void;
  
  isTransactionFormOpen: boolean;
  setIsTransactionFormOpen: (isOpen: boolean) => void;
  
  isDocPreviewOpen: boolean;
  setIsDocPreviewOpen: (isOpen: boolean) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;

  // Confirmation Modal
  confirmModalOpen: boolean;
  setConfirmModalOpen: (isOpen: boolean) => void;
  confirmModalConfig: ConfirmModalConfig;
  triggerConfirmation: (config: ConfirmModalConfig) => void;
  
  // UI States
  isEditingBudgets: boolean;
  setIsEditingBudgets: (isEditing: boolean) => void;
  
  editingTransactionId: string | null;
  setEditingTransactionId: (id: string | null) => void;
  
  selectedTransactions: Set<string>;
  setSelectedTransactions: (selected: Set<string>) => void;
  
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;

  // Business State
  currency: string;
  setCurrency: (currency: string) => void;
  
  budgets: Record<string, number>;
  setBudgets: (budgets: Record<string, number>) => void;
  
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;

  // Search
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Modals
  isPdfScannerOpen: false,
  setIsPdfScannerOpen: (isOpen) => set({ isPdfScannerOpen: isOpen }),
  
  isDepreciationModalOpen: false,
  setIsDepreciationModalOpen: (isOpen) => set({ isDepreciationModalOpen: isOpen }),
  isVatModalOpen: false,
  setIsVatModalOpen: (isOpen) => set({ isVatModalOpen: isOpen }),
  
  isSnapshotsModalOpen: false,
  setIsSnapshotsModalOpen: (isOpen) => set({ isSnapshotsModalOpen: isOpen }),
  
  isTransactionFormOpen: false,
  setIsTransactionFormOpen: (isOpen) => set({ isTransactionFormOpen: isOpen }),
  
  isDocPreviewOpen: false,
  setIsDocPreviewOpen: (isOpen) => set({ isDocPreviewOpen: isOpen }),
  previewUrl: null,
  setPreviewUrl: (url) => set({ previewUrl: url }),

  // Confirmation Modal
  confirmModalOpen: false,
  setConfirmModalOpen: (isOpen) => set({ confirmModalOpen: isOpen }),
  confirmModalConfig: {
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {}
  },
  triggerConfirmation: (config) => set({ confirmModalConfig: config, confirmModalOpen: true }),

  // UI States
  isEditingBudgets: false,
  setIsEditingBudgets: (isEditing) => set({ isEditingBudgets: isEditing }),
  
  editingTransactionId: null,
  setEditingTransactionId: (id) => set({ editingTransactionId: id }),
  
  selectedTransactions: new Set(),
  setSelectedTransactions: (selected) => set({ selectedTransactions: selected }),
  
  isUploading: false,
  setIsUploading: (isUploading) => set({ isUploading: isUploading }),

  // Business State
  currency: localStorage.getItem('motazin_currency') || 'OMR',
  setCurrency: (currency) => {
    localStorage.setItem('motazin_currency', currency);
    set({ currency });
  },

  budgets: (() => {
    const saved = localStorage.getItem('motazin_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        console.warn('Failed to parse saved budgets');
      }
    }
    return {
      cars: 20000,
      furniture: 12000,
      expenses: 5000
    };
  })(),
  setBudgets: (budgets) => {
    localStorage.setItem('motazin_budgets', JSON.stringify(budgets));
    set({ budgets });
  },

  geminiApiKey: '',
  setGeminiApiKey: (key) => {
    set({ geminiApiKey: key });
  },

  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),

  globalSearchTerm: '',
  setGlobalSearchTerm: (term) => set({ globalSearchTerm: term }),
}));
