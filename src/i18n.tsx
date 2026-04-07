import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'ar' | 'en';

interface Translations {
  [key: string]: {
    ar: string;
    en: string;
  };
}

export const translations: Translations = {
  appTitle: { ar: 'مُتّزِن', en: 'Motazin' },
  appSubtitle: { ar: 'الأصول = الخصوم + حقوق الملكية', en: 'Assets = Liabilities + Equity' },
  loginGoogle: { ar: 'تسجيل الدخول باستخدام Google', en: 'Sign in with Google' },
  logout: { ar: 'تسجيل الخروج', en: 'Logout' },
  exportCSV: { ar: 'تصدير CSV', en: 'Export CSV' },
  exportPDF: { ar: 'تصدير PDF', en: 'Export PDF' },
  clearAll: { ar: 'مسح الكل', en: 'Clear All' },
  assetDistribution: { ar: 'توزيع الأصول', en: 'Asset Distribution' },
  noAssets: { ar: 'لا توجد أصول لعرضها', en: 'No assets to display' },
  incomeExpenses: { ar: 'الإيرادات والمصروفات', en: 'Income & Expenses' },
  noIncomeExpenses: { ar: 'لا توجد إيرادات أو مصروفات لعرضها', en: 'No income or expenses to display' },
  addNewTransaction: { ar: 'إضافة عملية جديدة', en: 'Add New Transaction' },
  editTransaction: { ar: 'تعديل العملية', en: 'Edit Transaction' },
  date: { ar: 'التاريخ', en: 'Date' },
  description: { ar: 'البيان', en: 'Description' },
  impactOnAccounts: { ar: 'التأثير على الحسابات', en: 'Impact on Accounts' },
  addAccount: { ar: 'إضافة حساب', en: 'Add Account' },
  recurringTransaction: { ar: 'عملية متكررة', en: 'Recurring Transaction' },
  repeatsEvery: { ar: 'تتكرر كل:', en: 'Repeats every:' },
  daily: { ar: 'يوميا', en: 'Daily' },
  weekly: { ar: 'أسبوعيا', en: 'Weekly' },
  monthly: { ar: 'شهريا', en: 'Monthly' },
  yearly: { ar: 'سنويا', en: 'Yearly' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  saveChanges: { ar: 'حفظ التعديلات', en: 'Save Changes' },
  addTransaction: { ar: 'إضافة العملية', en: 'Add Transaction' },
  transactionHistory: { ar: 'سجل العمليات (معادلة الميزانية)', en: 'Transaction History' },
  deleteSelected: { ar: 'حذف المحدد', en: 'Delete Selected' },
  assets: { ar: 'الأصول', en: 'Assets' },
  liabilities: { ar: 'الخصوم', en: 'Liabilities' },
  equity: { ar: 'حقوق الملكية', en: 'Equity' },
  grandTotal: { ar: 'الإجمالي النهائي:', en: 'Grand Total:' },
  balanced: { ar: 'الميزانية متوازنة', en: 'Balance Sheet is Balanced' },
  unbalanced: { ar: 'الميزانية غير متوازنة', en: 'Balance Sheet is Unbalanced' },
  difference: { ar: 'الفرق:', en: 'Difference:' },
  bank: { ar: 'البنك', en: 'Bank' },
  cash: { ar: 'الصندوق (النقدية)', en: 'Cash' },
  cars: { ar: 'السيارات', en: 'Cars' },
  furniture: { ar: 'الأثاث', en: 'Furniture' },
  ar: { ar: 'الذمم المدينة (العملاء)', en: 'Accounts Receivable' },
  ap: { ar: 'الذمم الدائنة (الموردون)', en: 'Accounts Payable' },
  current_assets: { ar: 'الأصول المتداولة', en: 'Current Assets' },
  fixed_assets: { ar: 'الأصول الثابتة', en: 'Fixed Assets' },
  inventory: { ar: 'المخزون', en: 'Inventory' },
  short_term_loans: { ar: 'قروض قصيرة الأجل', en: 'Short-term Loans' },
  long_term_loans: { ar: 'قروض طويلة الأجل', en: 'Long-term Loans' },
  land: { ar: 'الأراضي', en: 'Land' },
  buildings: { ar: 'المباني', en: 'Buildings' },
  equipment: { ar: 'المعدات والآلات', en: 'Equipment' },
  supplies: { ar: 'المهمات / الأدوات', en: 'Supplies' },
  prepaid_expenses: { ar: 'مصروفات مدفوعة مقدماً', en: 'Prepaid Expenses' },
  intangible_assets: { ar: 'أصول غير ملموسة', en: 'Intangible Assets' },
  investments: { ar: 'استثمارات', en: 'Investments' },
  accrued_expenses: { ar: 'مصروفات مستحقة', en: 'Accrued Expenses' },
  unearned_revenues: { ar: 'إيرادات غير مكتسبة (مقدمة)', en: 'Unearned Revenues' },
  mortgages_payable: { ar: 'قروض برهن عقاري', en: 'Mortgages Payable' },
  drawings: { ar: 'المسحوبات الشخصية', en: 'Drawings' },
  retained_earnings: { ar: 'أرباح محتجزة', en: 'Retained Earnings' },
  capital: { ar: 'رأس المال', en: 'Capital' },
  revenue: { ar: 'الإيرادات', en: 'Revenue' },
  expenses: { ar: 'المصروفات', en: 'Expenses' },
  exampleDate: { ar: 'مثال: 1/2', en: 'e.g. 1/2' },
  exampleDesc: { ar: 'مثال: شراء أثاث نقداً', en: 'e.g. Bought furniture with cash' },
  amount: { ar: 'المبلغ', en: 'Amount' },
  confirmDelete: { ar: 'هل أنت متأكد من حذف هذه العملية؟', en: 'Are you sure you want to delete this transaction?' },
  confirmDeleteMultiple: { ar: 'هل أنت متأكد من حذف العمليات المحددة؟', en: 'Are you sure you want to delete selected transactions?' },
  confirmClearAll: { ar: 'هل أنت متأكد من مسح جميع العمليات؟', en: 'Are you sure you want to clear all transactions?' },
  errorSaving: { ar: 'حدث خطأ أثناء حفظ العمليات', en: 'Error saving transactions' },
  enterValidAmount: { ar: 'الرجاء إدخال مبالغ صحيحة', en: 'Please enter valid amounts' },
  enterDescription: { ar: 'الرجاء إدخال وصف للعملية', en: 'Please enter a description' },
  successRecurring: { ar: 'تم إنشاء عمليات متكررة تلقائياً', en: 'Recurring transactions created automatically' },
  language: { ar: 'English', en: 'العربية' },
  asset: { ar: 'الأصول', en: 'Assets' },
  liability: { ar: 'الخصوم', en: 'Liabilities' },
  undo: { ar: 'تراجع', en: 'Undo' },
  redo: { ar: 'إعادة', en: 'Redo' },
  budgetAlerts: { ar: 'تنبيهات الميزانية', en: 'Budget Alerts' },
  budgetExceeded: { ar: 'تجاوز الميزانية', en: 'Budget Exceeded' },
  budgetApproaching: { ar: 'اقتراب من الميزانية', en: 'Approaching Budget' },
  editBudgets: { ar: 'تعديل الميزانيات', en: 'Edit Budgets' },
  saveBudgets: { ar: 'حفظ الميزانيات', en: 'Save Budgets' },
  budgetLimit: { ar: 'حد الميزانية', en: 'Budget Limit' },
  currency: { ar: 'العملة', en: 'Currency' },
  save: { ar: 'حفظ', en: 'Save' },
  recurring: { ar: 'متكررة', en: 'Recurring' },
  day: { ar: 'يوم', en: 'Day' },
  week: { ar: 'أسبوع', en: 'Week' },
  month: { ar: 'شهر', en: 'Month' },
  year: { ar: 'سنة', en: 'Year' },
  repeatsEveryLabel: { ar: 'تتكرر كل', en: 'Repeats every' },
  SAR: { ar: 'ريال سعودي', en: 'Saudi Riyal' },
  OMR: { ar: 'ريال عماني', en: 'Omani Rial' },
  USD: { ar: 'دولار أمريكي', en: 'US Dollar' },
  EUR: { ar: 'يورو', en: 'Euro' },
  GBP: { ar: 'جنيه إسترليني', en: 'British Pound' },
  AED: { ar: 'درهم إماراتي', en: 'UAE Dirham' },
  KWD: { ar: 'دينار كويتي', en: 'Kuwaiti Dinar' },
  EGP: { ar: 'جنيه مصري', en: 'Egyptian Pound' },
  equationBalanced: { ar: 'المعادلة متوازنة', en: 'Equation is Balanced' },
  equationUnbalanced: { ar: 'المعادلة غير متوازنة!', en: 'Equation is Unbalanced!' },
  totalAssets: { ar: 'إجمالي الأصول', en: 'Total Assets' },
  totalLiabilitiesEquity: { ar: 'الخصوم + حقوق الملكية', en: 'Liabilities + Equity' },
  errorSavingTransactions: { ar: 'حدث خطأ أثناء حفظ العمليات', en: 'Error saving transactions' },
  recurringCreated: { ar: 'تم إنشاء عمليات متكررة تلقائياً', en: 'Recurring transactions created automatically' },
  budgetExceededAlert: { ar: 'تجاوز الميزانية: لقد تجاوزت الميزانية المخصصة لحساب', en: 'Budget Exceeded: You have exceeded the budget for account' },
  budgetWarningAlert: { ar: 'تنبيه ميزانية: لقد استهلكت أكثر من 85% من ميزانية', en: 'Budget Warning: You have consumed more than 85% of the budget for' },
  budgetSavedSuccess: { ar: 'تم حفظ الميزانية بنجاح', en: 'Budget saved successfully' },
  budgetSaveError: { ar: 'حدث خطأ أثناء حفظ الميزانية', en: 'Error saving budget' },
  errorExportingPDF: { ar: 'حدث خطأ أثناء تصدير ملف PDF', en: 'Error exporting PDF file' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...' },
  loginPrompt: { ar: 'يرجى تسجيل الدخول لحفظ وإدارة عملياتك المالية بأمان.', en: 'Please sign in to securely save and manage your financial transactions.' },
  noTransactions: { ar: 'لا توجد عمليات مسجلة بعد.', en: 'No transactions recorded yet.' },
  addTransactionPrompt: { ar: 'قم بإضافة عملية جديدة من النموذج الجانبي.', en: 'Add a new transaction from the side form.' },
  deleteTransaction: { ar: 'حذف العملية', en: 'Delete Transaction' },
  amountPlaceholder: { ar: 'المبلغ (+ أو -)', en: 'Amount (+ or -)' },
  negativeAmountNote: { ar: '* أدخل المبلغ بالسالب (-) في حالة النقص.', en: '* Enter a negative amount (-) for a decrease.' },
  importFiles: { ar: 'استيراد ملفات/صور', en: 'Import Files/Images' },
  importFilesDesc: { ar: 'استخرج المعاملات من PDF، Word، Excel، PowerPoint أو الصور (يدعم العربية والإنجليزية).', en: 'Extract transactions from PDF, Word, Excel, PowerPoint or Photos (Arabic/English supported).' },
  clickToUpload: { ar: 'انقر هنا للرفع أو اسحب الملف/الصورة هنا', en: 'Click to upload or drag a File/Image here' },
  analyzing: { ar: 'جاري استخراج البيانات وتحليل النص...', en: 'Analyzing text and extracting data...' },
  clear: { ar: 'مسح', en: 'Clear' },
  depreciationCalc: { ar: 'حاسبة الإهلاك', en: 'Depreciation Calculator' },
  assetCost: { ar: 'تكلفة الأصل', en: 'Asset Cost' },
  salvageValue: { ar: 'القيمة التخريدية (الخردة)', en: 'Salvage Value' },
  usefulLife: { ar: 'العمر الإنتاجي (سنوات)', en: 'Useful Life (Years)' },
  annualDepreciation: { ar: 'الإهلاك السنوي', en: 'Annual Depreciation' },
  monthlyDepreciation: { ar: 'الإهلاك الشهري', en: 'Monthly Depreciation' },
  applyDepreciation: { ar: 'تسجيل الإهلاك في السجل', en: 'Apply to Ledger' },
  selectAssetToDepreciate: { ar: 'اختر الأصل لإهلاكه', en: 'Select Asset to Depreciate' },
  depreciationFor: { ar: 'إهلاك لـ', en: 'Depreciation for' },
  financialInsights: { ar: 'التحليلات المالية', en: 'Financial Insights' },
  currentRatio: { ar: 'نسبة السيولة (التداول)', en: 'Current Ratio' },
  currentRatioDesc: { ar: 'القدرة على سداد الالتزامات قصيرة الأجل', en: 'Ability to pay short-term obligations' },
  debtToEquity: { ar: 'نسبة الديون إلى الملكية', en: 'Debt-to-Equity Ratio' },
  debtToEquityDesc: { ar: 'درجة الاعتماد على الديون في التمويل', en: 'Degree of reliance on debt' },
  netProfit: { ar: 'صافي الربح', en: 'Net Profit' },
  monthlyProfitTrend: { ar: 'اتجاه صافي الربح شهرياً', en: 'Monthly Net Profit Trend' },
  lowLiquidity: { ar: 'سيولة منخفضة! انتبه لالتزاماتك', en: 'Low Liquidity! Watch your obligations' },
  healthyLiquidity: { ar: 'سيولة ممتازة', en: 'Healthy Liquidity' },
  attachDocument: { ar: 'إرفاق مستند', en: 'Attach Document' },
  viewDocument: { ar: 'عرض المستند', en: 'View Document' },
  uploading: { ar: 'جاري الرفع...', en: 'Uploading...' },
  documentPreview: { ar: 'معاينة المستند', en: 'Document Preview' },
  noDocument: { ar: 'لا يوجد مستند مرفق', en: 'No document attached' },
  debit: { ar: 'مدين (+)', en: 'Debit (+)' },
  credit: { ar: 'دائن (-)', en: 'Credit (-)' },
  accountName: { ar: 'اسم الحساب', en: 'Account Name' },
  impactValue: { ar: 'قيمة التأثير', en: 'Impact Value' },
  transactionSource: { ar: 'مصدر العملية', en: 'Transaction Source' },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => setLanguage(prev => prev === 'ar' ? 'en' : 'ar');

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, dir: language === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
