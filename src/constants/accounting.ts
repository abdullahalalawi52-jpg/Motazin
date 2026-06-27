import { Account, Category, Transaction } from '../types/accounting';

export const ACCOUNTS: Account[] = [
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

export const CATEGORY_LABELS: Record<Category, string> = {
  asset: 'asset',
  liability: 'liability',
  equity: 'equity',
};

export const CURRENCIES = [
  { code: 'SAR', name: 'SAR', symbol: 'ر.س' },
  { code: 'OMR', name: 'OMR', symbol: 'ر.ع' },
  { code: 'USD', name: 'USD', symbol: '$' },
  { code: 'EUR', name: 'EUR', symbol: '€' },
  { code: 'GBP', name: 'GBP', symbol: '£' },
  { code: 'AED', name: 'AED', symbol: 'د.إ' },
  { code: 'KWD', name: 'KWD', symbol: 'د.ك' },
  { code: 'EGP', name: 'EGP', symbol: 'ج.م' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
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
