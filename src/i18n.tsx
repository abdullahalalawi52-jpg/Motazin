import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Language = 'ar' | 'en' | 'fr' | 'es' | 'tr' | 'ur' | 'ja' | 'zh' | 'ru' | 'pt';

interface Translations {
  [key: string]: {
    ar: string;
    en: string;
    fr: string;
    es: string;
    tr: string;
    ur: string;
    ja: string;
    zh: string;
    ru: string;
    pt: string;
  };
}

export const translations: Translations = {
  appTitle: {
ar: 'مُتّزِن', en: 'Motazin', fr: 'Motazin', es: 'Motazin', tr: 'Motazin', ur: 'متوازن',
    ja: 'Motazin', zh: 'Motazin', ru: 'Motazin', pt: 'Motazin'
  },
  pro_account: {
ar: 'حساب احترافي', en: 'PRO Account', fr: 'Compte PRO', es: 'Cuenta PRO', tr: 'PRO Hesap', ur: 'پرو اکاؤنٹ',
    ja: 'PRO Account', zh: 'PRO Account', ru: 'PRO Account', pt: 'PRO Account'
  },
  appSubtitle: {
ar: 'الأصول = الخصوم + حقوق الملكية', 
    en: 'Assets = Liabilities + Equity',
    fr: 'Actif = Passif + Capitaux Propres',
    es: 'Activo = Pasivo + Patrimonio Neto',
    tr: 'Varlıklar = Yükümlülükler + Özkaynak',
    ur: 'اثاثے = واجبات + ایکویٹی',
    ja: 'Assets = Liabilities + Equity', zh: 'Assets = Liabilities + Equity', ru: 'Assets = Liabilities + Equity', pt: 'Assets = Liabilities + Equity'
  },
  loginGoogle: {
ar: 'تسجيل الدخول باستخدام Google', en: 'Sign in with Google', fr: 'Se connecter avec Google', es: 'Iniciar sesión con Google', tr: 'Google ile Giriş Yap', ur: 'Google کے ساتھ سائن ان کریں',
    ja: 'Sign in with Google', zh: 'Sign in with Google', ru: 'Sign in with Google', pt: 'Sign in with Google'
  },
  logout: {
ar: 'تسجيل الخروج', en: 'Logout', fr: 'Déconnexion', es: 'Cerrar sesión', tr: 'Çıkış Yap', ur: 'لاگ آؤٹ',
    ja: 'Logout', zh: 'Logout', ru: 'Logout', pt: 'Logout'
  },
  exportCSV: {
ar: 'تصدير CSV', en: 'Export CSV', fr: 'Exporter CSV', es: 'Exportar CSV', tr: 'CSV Dışa Aktar', ur: 'CSV ایکسپورٹ کریں',
    ja: 'Export CSV', zh: 'Export CSV', ru: 'Export CSV', pt: 'Export CSV'
  },
  exportPDF: {
ar: 'تصدير PDF', en: 'Export PDF', fr: 'Exporter PDF', es: 'Exportar PDF', tr: 'PDF Dışa Aktar', ur: 'PDF ایکسپورٹ کریں',
    ja: 'Export PDF', zh: 'Export PDF', ru: 'Export PDF', pt: 'Export PDF'
  },
  clearAll: {
ar: 'مسح الكل', en: 'Clear All', fr: 'Tout Effacer', es: 'Limpiar Todo', tr: 'Tümünü Temizle', ur: 'تمام صاف کریں',
    ja: 'Clear All', zh: 'Clear All', ru: 'Clear All', pt: 'Clear All'
  },
  assetDistribution: {
ar: 'توزيع الأصول', en: 'Asset Distribution', fr: 'Distribution des Actifs', es: 'Distribución de Activos', tr: 'Varlık Dağılımı', ur: 'اثاثوں کی تقسیم',
    ja: 'Asset Distribution', zh: 'Asset Distribution', ru: 'Asset Distribution', pt: 'Asset Distribution'
  },
  noAssets: {
ar: 'لا توجد أصول لعرضها', en: 'No assets to display', fr: 'Aucun actif à afficher', es: 'No hay activos para mostrar', tr: 'Gösterilecek varlık yok', ur: 'دکھانے کے لیے کوئی اثاثہ نہیں ہے',
    ja: 'No assets to display', zh: 'No assets to display', ru: 'No assets to display', pt: 'No assets to display'
  },
  incomeExpenses: {
ar: 'الإيرادات والمصروفات', en: 'Income & Expenses', fr: 'Revenus et Dépenses', es: 'Ingresos y Gastos', tr: 'Gelir ve Giderler', ur: 'آمدنی اور اخراجات',
    ja: 'Income & Expenses', zh: 'Income & Expenses', ru: 'Income & Expenses', pt: 'Income & Expenses'
  },
  noIncomeExpenses: {
ar: 'لا توجد إيرادات أو مصروفات لعرضها', en: 'No income or expenses to display', fr: 'Aucun revenu ou dépense à afficher', es: 'No hay ingresos o gastos para mostrar', tr: 'Gösterilecek gelir veya gider yok', ur: 'دکھانے کے لیے کوئی آمدنی یا اخراجات نہیں ہیں',
    ja: 'No income or expenses to display', zh: 'No income or expenses to display', ru: 'No income or expenses to display', pt: 'No income or expenses to display'
  },
  addNewTransaction: {
ar: 'إضافة عملية جديدة', en: 'Add New Transaction', fr: 'Ajouter une Transaction', es: 'Agregar Nueva Transacción', tr: 'Yeni İşlem Ekle', ur: 'نئی ٹرانزیکشن شامل کریں',
    ja: 'Add New Transaction', zh: 'Add New Transaction', ru: 'Add New Transaction', pt: 'Add New Transaction'
  },
  editTransaction: {
ar: 'تعديل العملية', en: 'Edit Transaction', fr: 'Modifier la Transaction', es: 'Editar Transacción', tr: 'İşlemi Düzenle', ur: 'ٹرانزیکشن میں ترمیم کریں',
    ja: 'Edit Transaction', zh: 'Edit Transaction', ru: 'Edit Transaction', pt: 'Edit Transaction'
  },
  date: {
ar: 'التاريخ', en: 'Date', fr: 'Date', es: 'Fecha', tr: 'Tarih', ur: 'تاریخ',
    ja: 'Date', zh: 'Date', ru: 'Date', pt: 'Date'
  },
  description: {
ar: 'البيان', en: 'Description', fr: 'Description', es: 'Descripción', tr: 'Açıklama', ur: 'تفصیل',
    ja: 'Description', zh: 'Description', ru: 'Description', pt: 'Description'
  },
  impactOnAccounts: {
ar: 'التأثير على الحسابات', en: 'Impact on Accounts', fr: 'Impact sur les Comptes', es: 'Impacto en Cuentas', tr: 'Hesaplar Üzerindeki Etki', ur: 'اکاؤنٹس پر اثر',
    ja: 'Impact on Accounts', zh: 'Impact on Accounts', ru: 'Impact on Accounts', pt: 'Impact on Accounts'
  },
  addAccount: {
ar: 'إضافة حساب', en: 'Add Account', fr: 'Ajouter un Compte', es: 'Agregar Cuenta', tr: 'Hesap Ekle', ur: 'اکاؤنٹ شامل کریں',
    ja: 'Add Account', zh: 'Add Account', ru: 'Add Account', pt: 'Add Account'
  },
  recurringTransaction: {
ar: 'عملية متكررة', en: 'Recurring Transaction', fr: 'Transaction Récurrente', es: 'Transacción Recurrente', tr: 'Tekrarlayan İşlem', ur: 'بار بار ہونے والی ٹرانزیکشن',
    ja: 'Recurring Transaction', zh: 'Recurring Transaction', ru: 'Recurring Transaction', pt: 'Recurring Transaction'
  },
  repeatsEvery: {
ar: 'تتكرر كل:', en: 'Repeats every:', fr: 'Se répète tous les:', es: 'Se repite cada:', tr: 'Tekrarlanma:', ur: 'ہر بار دہراتا ہے:',
    ja: 'Repeats every:', zh: 'Repeats every:', ru: 'Repeats every:', pt: 'Repeats every:'
  },
  daily: {
ar: 'يوميا', en: 'Daily', fr: 'Quotidien', es: 'Diario', tr: 'Günlük', ur: 'روزانہ',
    ja: 'Daily', zh: 'Daily', ru: 'Daily', pt: 'Daily'
  },
  weekly: {
ar: 'أسبوعيا', en: 'Weekly', fr: 'Hebdomadaire', es: 'Semanal', tr: 'Haftalık', ur: 'ہفتہ وار',
    ja: 'Weekly', zh: 'Weekly', ru: 'Weekly', pt: 'Weekly'
  },
  monthly: {
ar: 'شهريا', en: 'Monthly', fr: 'Mensuel', es: 'Mensual', tr: 'Aylık', ur: 'ماہانہ',
    ja: 'Monthly', zh: 'Monthly', ru: 'Monthly', pt: 'Monthly'
  },
  yearly: {
ar: 'سنويا', en: 'Yearly', fr: 'Annuel', es: 'Anual', tr: 'Yıllık', ur: 'سالانہ',
    ja: 'Yearly', zh: 'Yearly', ru: 'Yearly', pt: 'Yearly'
  },
  cancel: {
ar: 'إلغاء', en: 'Cancel', fr: 'Annuler', es: 'Cancelar', tr: 'İptal', ur: 'منسوخ کریں',
    ja: 'Cancel', zh: 'Cancel', ru: 'Cancel', pt: 'Cancel'
  },
  saveChanges: {
ar: 'حفظ التعديلات', en: 'Save Changes', fr: 'Enregistrer', es: 'Guardar Cambios', tr: 'Değişiklikleri Kaydet', ur: 'تبدیلیاں محفوظ کریں',
    ja: 'Save Changes', zh: 'Save Changes', ru: 'Save Changes', pt: 'Save Changes'
  },
  addTransaction: {
ar: 'إضافة العملية', en: 'Add Transaction', fr: 'Ajouter', es: 'Agregar Transacción', tr: 'İşlem Ekle', ur: 'ٹرانزیکشن شامل کریں',
    ja: 'Add Transaction', zh: 'Add Transaction', ru: 'Add Transaction', pt: 'Add Transaction'
  },
  transactionHistory: {
ar: 'سجل العمليات (معادلة الميزانية)', en: 'Transaction History', fr: 'Historique', es: 'Historial', tr: 'İşlem Geçmişi', ur: 'ٹرانزیکشن کی تاریخ',
    ja: 'Transaction History', zh: 'Transaction History', ru: 'Transaction History', pt: 'Transaction History'
  },
  deleteSelected: {
ar: 'حذف المحدد', en: 'Delete Selected', fr: 'Supprimer la Sélection', es: 'Eliminar Seleccionados', tr: 'Seçilenleri Sil', ur: 'منتخب کردہ کو حذف کریں',
    ja: 'Delete Selected', zh: 'Delete Selected', ru: 'Delete Selected', pt: 'Delete Selected'
  },
  assets: {
ar: 'الأصول', en: 'Assets', fr: 'Actifs', es: 'Activos', tr: 'Varlıklar', ur: 'اثاثے',
    ja: 'Assets', zh: 'Assets', ru: 'Assets', pt: 'Assets'
  },
  liabilities: {
ar: 'الخصوم', en: 'Liabilities', fr: 'Passifs', es: 'Pasivos', tr: 'Yükümlülükler', ur: 'واجبات',
    ja: 'Liabilities', zh: 'Liabilities', ru: 'Liabilities', pt: 'Liabilities'
  },
  equity: {
ar: 'حقوق الملكية', en: 'Equity', fr: 'Capitaux Propres', es: 'Patrimonio Neto', tr: 'Özkaynak', ur: 'ایکویٹی',
    ja: 'Equity', zh: 'Equity', ru: 'Equity', pt: 'Equity'
  },
  grandTotal: {
ar: 'الإجمالي النهائي:', en: 'Grand Total:', fr: 'Total Général:', es: 'Gran Total:', tr: 'Genel Toplam:', ur: 'کل مجموعہ:',
    ja: 'Grand Total:', zh: 'Grand Total:', ru: 'Grand Total:', pt: 'Grand Total:'
  },
  balanced: {
ar: 'الميزانية متوازنة', en: 'Balance Sheet is Balanced', fr: 'Bilan Équilibré', es: 'Balance Equilibrado', tr: 'Bilanço Dengeli', ur: 'بیلنس شیٹ متوازن ہے',
    ja: 'Balance Sheet is Balanced', zh: 'Balance Sheet is Balanced', ru: 'Balance Sheet is Balanced', pt: 'Balance Sheet is Balanced'
  },
  unbalanced: {
ar: 'الميزانية غير متوازنة', en: 'Balance Sheet is Unbalanced', fr: 'Bilan Non Équilibré', es: 'Balance No Equilibrado', tr: 'Bilanço Dengesiz', ur: 'بیلنس شیٹ غیر متوازن ہے',
    ja: 'Balance Sheet is Unbalanced', zh: 'Balance Sheet is Unbalanced', ru: 'Balance Sheet is Unbalanced', pt: 'Balance Sheet is Unbalanced'
  },
  difference: {
ar: 'الفرق:', en: 'Difference:', fr: 'Différence:', es: 'Diferencia:', tr: 'Fark:', ur: 'فرق:',
    ja: 'Difference:', zh: 'Difference:', ru: 'Difference:', pt: 'Difference:'
  },
  bank: {
ar: 'البنك', en: 'Bank', fr: 'Banque', es: 'Banco', tr: 'Banka', ur: 'بینک',
    ja: 'Bank', zh: 'Bank', ru: 'Bank', pt: 'Bank'
  },
  cash: {
ar: 'الصندوق (النقدية)', en: 'Cash', fr: 'Caisse', es: 'Efectivo', tr: 'Kasa', ur: 'نقد',
    ja: 'Cash', zh: 'Cash', ru: 'Cash', pt: 'Cash'
  },
  cars: {
ar: 'السيارات', en: 'Cars', fr: 'Voitures', es: 'Vehículos', tr: 'Arabalar', ur: 'گاڑیاں',
    ja: 'Cars', zh: 'Cars', ru: 'Cars', pt: 'Cars'
  },
  furniture: {
ar: 'الأثاث', en: 'Furniture', fr: 'Meubles', es: 'Muebles', tr: 'Mobilya', ur: 'فرنیچر',
    ja: 'Furniture', zh: 'Furniture', ru: 'Furniture', pt: 'Furniture'
  },
  ar: {
ar: 'الذمم المدينة (العملاء)', en: 'Accounts Receivable', fr: 'Créances Clients', es: 'Cuentas a Cobrar', tr: 'Alacak Hesapları', ur: 'وصول طلب اکاؤنٹس',
    ja: 'Accounts Receivable', zh: 'Accounts Receivable', ru: 'Accounts Receivable', pt: 'Accounts Receivable'
  },
  ap: {
ar: 'الذمم الدائنة (الموردون)', en: 'Accounts Payable', fr: 'Dettes Fournisseurs', es: 'Cuentas a Pagar', tr: 'Borç Hesapları', ur: 'قابل ادائیگی اکاؤنٹس',
    ja: 'Accounts Payable', zh: 'Accounts Payable', ru: 'Accounts Payable', pt: 'Accounts Payable'
  },
  current_assets: {
ar: 'الأصول المتداولة', en: 'Current Assets', fr: 'Actifs Courants', es: 'Activos Corrientes', tr: 'Dönen Varlıklar', ur: 'موجودہ اثاثے',
    ja: 'Current Assets', zh: 'Current Assets', ru: 'Current Assets', pt: 'Current Assets'
  },
  fixed_assets: {
ar: 'الأصول الثابتة', en: 'Fixed Assets', fr: 'Actifs Immobilisés', es: 'Activos Fijos', tr: 'Duran Varlıklar', ur: 'مستقل اثاثے',
    ja: 'Fixed Assets', zh: 'Fixed Assets', ru: 'Fixed Assets', pt: 'Fixed Assets'
  },
  inventory: {
ar: 'المخزون', en: 'Inventory', fr: 'Stocks', es: 'Inventario', tr: 'Stok', ur: 'انوینٹری',
    ja: 'Inventory', zh: 'Inventory', ru: 'Inventory', pt: 'Inventory'
  },
  short_term_loans: {
ar: 'قروض قصيرة الأجل', en: 'Short-term Loans', fr: 'Prêts à Court Terme', es: 'Préstamos a Corto Plazo', tr: 'Kısa Vadeli Krediler', ur: 'لیل مدتی قرضے',
    ja: 'Short-term Loans', zh: 'Short-term Loans', ru: 'Short-term Loans', pt: 'Short-term Loans'
  },
  long_term_loans: {
ar: 'قروض طويلة الأجل', en: 'Long-term Loans', fr: 'Prêts à Long Terme', es: 'Préstamos a Largo Plazo', tr: 'Uzun Vadeli Krediler', ur: 'طويل مدتي قرضے',
    ja: 'Long-term Loans', zh: 'Long-term Loans', ru: 'Long-term Loans', pt: 'Long-term Loans'
  },
  borrowed_money: {
ar: 'أموال مقترضة', en: 'Borrowed Money', fr: 'Argent Emprunté', es: 'Dinero Prestado', tr: 'Ödünç Alınan Para', ur: 'ادھار لی گئی رقم',
    ja: 'Borrowed Money', zh: 'Borrowed Money', ru: 'Borrowed Money', pt: 'Borrowed Money'
  },
  land: {
ar: 'الأراضي', en: 'Land', fr: 'Terrain', es: 'Terrenos', tr: 'Arazi', ur: 'زمین',
    ja: 'Land', zh: 'Land', ru: 'Land', pt: 'Land'
  },
  buildings: {
ar: 'المباني', en: 'Buildings', fr: 'Bâtiments', es: 'Edificios', tr: 'Binalar', ur: 'عمارتیں',
    ja: 'Buildings', zh: 'Buildings', ru: 'Buildings', pt: 'Buildings'
  },
  equipment: {
ar: 'المعدات والآلات', en: 'Equipment', fr: 'Équipement', es: 'Equipo', tr: 'Ekipman', ur: 'آلات',
    ja: 'Equipment', zh: 'Equipment', ru: 'Equipment', pt: 'Equipment'
  },
  ppe: {
ar: 'الممتلكات والمعدات (PPE)', en: 'Property, Plant & Equip.', fr: 'Immobilisations Corporelles', es: 'Propiedad, Planta y Equipo', tr: 'Mülk, Tesis ve Ekipman', ur: 'جائیداد، پلانٹ اور آلات',
    ja: 'Property, Plant & Equip.', zh: 'Property, Plant & Equip.', ru: 'Property, Plant & Equip.', pt: 'Property, Plant & Equip.'
  },
  supplies: {
ar: 'المهمات / الأدوات', en: 'Supplies', fr: 'Fournitures', es: 'Suministros', tr: 'Malzemeler', ur: 'سامان',
    ja: 'Supplies', zh: 'Supplies', ru: 'Supplies', pt: 'Supplies'
  },
  prepaid_expenses: {
ar: 'مصروفات مدفوعة مقدماً', en: 'Prepaid Expenses', fr: 'Charges Constatées d\'Avance', es: 'Gastos Pagados por Adelantado', tr: 'Önceden Ödenmiş Giderler', ur: 'پیشگی ادا شدہ اخراجات',
    ja: 'Prepaid Expenses', zh: 'Prepaid Expenses', ru: 'Prepaid Expenses', pt: 'Prepaid Expenses'
  },
  intangible_assets: {
ar: 'أصول غير ملموسة', en: 'Intangible Assets', fr: 'Actifs Incorporels', es: 'Activos Intangibles', tr: 'Maddi Olmayan Varlıklar', ur: 'غیر مادی اثاثے',
    ja: 'Intangible Assets', zh: 'Intangible Assets', ru: 'Intangible Assets', pt: 'Intangible Assets'
  },
  goodwill: {
ar: 'شهرة المحل', en: 'Goodwill', fr: 'Écart d\'Acquisition', es: 'Fondo de Comercio', tr: 'Şerefiye', ur: 'گڈ ول',
    ja: 'Goodwill', zh: 'Goodwill', ru: 'Goodwill', pt: 'Goodwill'
  },
  investments: {
ar: 'استثمارات', en: 'Investments', fr: 'Investissements', es: 'Inversiones', tr: 'Yatırımlar', ur: 'سرمایہ کاری',
    ja: 'Investments', zh: 'Investments', ru: 'Investments', pt: 'Investments'
  },
  accrued_expenses: {
ar: 'مصروفات مستحقة', en: 'Accrued Expenses', fr: 'Charges à Payer', es: 'Gastos Acumulados', tr: 'Tahakkuk Eden Giderler', ur: 'واجب الادا اخراجات',
    ja: 'Accrued Expenses', zh: 'Accrued Expenses', ru: 'Accrued Expenses', pt: 'Accrued Expenses'
  },
  unearned_revenues: {
ar: 'إيرادات غير مكتسبة (مقدمة)', en: 'Unearned Revenues', fr: 'Produits Constatés d\'Avance', es: 'Ingresos no Devengados', tr: 'Kazanılmamış Gelirler', ur: 'غیر کمائی گئی آمدنی',
    ja: 'Unearned Revenues', zh: 'Unearned Revenues', ru: 'Unearned Revenues', pt: 'Unearned Revenues'
  },
  mortgages_payable: {
ar: 'قروض برهن عقاري', en: 'Mortgages Payable', fr: 'Hypothèques à Payer', es: 'Hipotecas por Pagar', tr: 'İpoteğe Dayalı Krediler', ur: 'رہن کے واجبات',
    ja: 'Mortgages Payable', zh: 'Mortgages Payable', ru: 'Mortgages Payable', pt: 'Mortgages Payable'
  },
  drawings: {
ar: 'المسحوبات الشخصية', en: 'Drawings', fr: 'Prélèvements', es: 'Retiros', tr: 'Şahsi Çekimler', ur: 'ذاتی نکاسی',
    ja: 'Drawings', zh: 'Drawings', ru: 'Drawings', pt: 'Drawings'
  },
  retained_earnings: {
ar: 'أرباح محتجزة', en: 'Retained Earnings', fr: 'Bénéfices Non Distribués', es: 'Ganancias Retenidas', tr: 'Geçmiş Yıl Karları', ur: 'برقرار رکھی گئی آمدنی',
    ja: 'Retained Earnings', zh: 'Retained Earnings', ru: 'Retained Earnings', pt: 'Retained Earnings'
  },
  capital: {
ar: 'رأس المال', en: 'Capital', fr: 'Capital', es: 'Capital', tr: 'Sermaye', ur: 'سرمایہ',
    ja: 'Capital', zh: 'Capital', ru: 'Capital', pt: 'Capital'
  },
  share_capital: {
ar: 'رأس مال الأسهم', en: 'Share Capital', fr: 'Capital Social', es: 'Capital Social', tr: 'Sermaye Hissesi', ur: 'شيئر كيپيٹل',
    ja: 'Share Capital', zh: 'Share Capital', ru: 'Share Capital', pt: 'Share Capital'
  },
  revenue: {
ar: 'الإيرادات', en: 'Revenue', fr: 'Revenus', es: 'Ingresos', tr: 'Gelir', ur: 'آمدنی',
    ja: 'Revenue', zh: 'Revenue', ru: 'Revenue', pt: 'Revenue'
  },
  expenses: {
ar: 'المصروفات', en: 'Expenses', fr: 'Dépenses', es: 'Gastos', tr: 'Giderler', ur: 'اخراجات',
    ja: 'Expenses', zh: 'Expenses', ru: 'Expenses', pt: 'Expenses'
  },
  exampleDate: {
ar: 'مثال: 1/1', en: 'e.g. 1/1', fr: 'ex. 01/01', es: 'ej. 01/01', tr: 'ör. 01/01', ur: 'مثال: 1/1',
    ja: 'e.g. 1/1', zh: 'e.g. 1/1', ru: 'e.g. 1/1', pt: 'e.g. 1/1'
  },
  exampleDesc: {
ar: 'مثال: شراء أثاث نقداً', en: 'e.g. Bought furniture with cash', fr: 'ex. Achat de meubles au comptant', es: 'ej. Compra de muebles al contado', tr: 'ör. Nakit mobilya alımı', ur: 'مثال: نقد فرنیچر خریدا',
    ja: 'e.g. Bought furniture with cash', zh: 'e.g. Bought furniture with cash', ru: 'e.g. Bought furniture with cash', pt: 'e.g. Bought furniture with cash'
  },
  amount: {
ar: 'المبلغ', en: 'Amount', fr: 'Montant', es: 'Monto', tr: 'Tutar', ur: 'رقم',
    ja: 'Amount', zh: 'Amount', ru: 'Amount', pt: 'Amount'
  },
  confirmDelete: {
ar: 'هل أنت متأكد من حذف هذه العملية؟', en: 'Are you sure you want to delete this transaction?', fr: 'Supprimer?', es: '¿Eliminar?', tr: 'Silinsin mi?', ur: 'کیا آپ حذف کرنا چاہتے ہیں؟',
    ja: 'Are you sure you want to delete this transaction?', zh: 'Are you sure you want to delete this transaction?', ru: 'Are you sure you want to delete this transaction?', pt: 'Are you sure you want to delete this transaction?'
  },
  confirmDeleteMultiple: {
ar: 'هل أنت متأكد من حذف العمليات المحددة؟', en: 'Are you sure you want to delete selected transactions?', fr: 'Supprimer la sélection?', es: '¿Eliminar seleccionados?', tr: 'Seçilenler silinsin mi?', ur: 'کیا آپ منتخب کردہ کو حذف کرنا چاہتے ہیں؟',
    ja: 'Are you sure you want to delete selected transactions?', zh: 'Are you sure you want to delete selected transactions?', ru: 'Are you sure you want to delete selected transactions?', pt: 'Are you sure you want to delete selected transactions?'
  },
  confirmClearAll: {
ar: 'هل أنت متأكد من مسح جميع العمليات؟', en: 'Are you sure you want to clear all transactions?', fr: 'Tout effacer?', es: '¿Limpiar todo?', tr: 'Tümünü temizle?', ur: 'کیا آپ تمام صاف کرنا چاہتے ہیں؟',
    ja: 'Are you sure you want to clear all transactions?', zh: 'Are you sure you want to clear all transactions?', ru: 'Are you sure you want to clear all transactions?', pt: 'Are you sure you want to clear all transactions?'
  },
  errorSaving: {
ar: 'حدث خطأ أثناء حفظ العمليات', en: 'Error saving transactions', fr: 'Erreur', es: 'Error', tr: 'Hata', ur: 'خرابی',
    ja: 'Error saving transactions', zh: 'Error saving transactions', ru: 'Error saving transactions', pt: 'Error saving transactions'
  },
  enterValidAmount: {
ar: 'الرجاء إدخال مبالغ صحيحة', en: 'Please enter valid amounts', fr: 'Montant invalide', es: 'Monto inválido', tr: 'Geçersiz tutar', ur: 'درست رقم درج کریں',
    ja: 'Please enter valid amounts', zh: 'Please enter valid amounts', ru: 'Please enter valid amounts', pt: 'Please enter valid amounts'
  },
  enterDescription: {
ar: 'الرجاء إدخال وصف للعملية', en: 'Please enter a description', fr: 'Entrez une description', es: 'Ingrese descripción', tr: 'Açıklama girin', ur: 'تفصیل درج کریں',
    ja: 'Please enter a description', zh: 'Please enter a description', ru: 'Please enter a description', pt: 'Please enter a description'
  },
  successRecurring: {
ar: 'تم إنشاء عمليات متكررة تلقائياً', en: 'Recurring transactions created automatically', fr: 'Transactions récurrentes créées', es: 'Transacciones recurrentes creadas', tr: 'Tekrarlayan işlemler oluşturuldu', ur: 'بار بار ہونے والی ٹرانزیکشنز بنائی گئیں',
    ja: 'Recurring transactions created automatically', zh: 'Recurring transactions created automatically', ru: 'Recurring transactions created automatically', pt: 'Recurring transactions created automatically'
  },
  language: {
ar: 'اللغة', en: 'Language', fr: 'Langue', es: 'Idioma', tr: 'Dil', ur: 'زبان',
    ja: 'Language', zh: 'Language', ru: 'Language', pt: 'Language'
  },
  asset: {
ar: 'الأصول', en: 'Assets', fr: 'Actifs', es: 'Activos', tr: 'Varlıklar', ur: 'اثاثے',
    ja: 'Assets', zh: 'Assets', ru: 'Assets', pt: 'Assets'
  },
  liability: {
ar: 'الخصوم', en: 'Liabilities', fr: 'Passifs', es: 'Pasivos', tr: 'Yükümlülükler', ur: 'واجبات',
    ja: 'Liabilities', zh: 'Liabilities', ru: 'Liabilities', pt: 'Liabilities'
  },
  undo: {
ar: 'تراجع', en: 'Undo', fr: 'Annuler', es: 'Deshacer', tr: 'Geri Al', ur: 'واپس',
    ja: 'Undo', zh: 'Undo', ru: 'Undo', pt: 'Undo'
  },
  redo: {
ar: 'إعادة', en: 'Redo', fr: 'Rétablir', es: 'Rehacer', tr: 'İleri Al', ur: 'آگے',
    ja: 'Redo', zh: 'Redo', ru: 'Redo', pt: 'Redo'
  },
  budgetAlerts: {
ar: 'تنبيهات الميزانية', en: 'Budget Alerts', fr: 'Alertes Budget', es: 'Alertas de Presupuesto', tr: 'Bütçe Uyarıları', ur: 'بجٹ الرٹس',
    ja: 'Budget Alerts', zh: 'Budget Alerts', ru: 'Budget Alerts', pt: 'Budget Alerts'
  },
  budgetExceeded: {
ar: 'تجاوز الميزانية', en: 'Budget Exceeded', fr: 'Budget Dépassé', es: 'Presupuesto Excedido', tr: 'Bütçe Aşıldı', ur: 'بجٹ بڑھ گیا',
    ja: 'Budget Exceeded', zh: 'Budget Exceeded', ru: 'Budget Exceeded', pt: 'Budget Exceeded'
  },
  budgetApproaching: {
ar: 'اقتراب من الميزانية', en: 'Approaching Budget', fr: 'Budget Proche', es: 'Presupuesto Cercano', tr: 'Bütçeye Yaklaşıldı', ur: 'بجٹ کے قریب',
    ja: 'Approaching Budget', zh: 'Approaching Budget', ru: 'Approaching Budget', pt: 'Approaching Budget'
  },
  editBudgets: {
ar: 'تعديل الميزانيات', en: 'Edit Budgets', fr: 'Modifier les Budgets', es: 'Editar Presupuestos', tr: 'Bütçeleri Düzenle', ur: 'بجٹ میں ترمیم کریں',
    ja: 'Edit Budgets', zh: 'Edit Budgets', ru: 'Edit Budgets', pt: 'Edit Budgets'
  },
  saveBudgets: {
ar: 'حفظ الميزانيات', en: 'Save Budgets', fr: 'Enregistrer les Budgets', es: 'Guardar Presupuestos', tr: 'Bütçeleri Kaydet', ur: 'بجٹ محفوظ کریں',
    ja: 'Save Budgets', zh: 'Save Budgets', ru: 'Save Budgets', pt: 'Save Budgets'
  },
  budgetLimit: {
ar: 'حد الميزانية', en: 'Budget Limit', fr: 'Limite du Budget', es: 'Límite de Presupuesto', tr: 'Bütçe Sınırı', ur: 'بجٹ کی حد',
    ja: 'Budget Limit', zh: 'Budget Limit', ru: 'Budget Limit', pt: 'Budget Limit'
  },
  currency: {
ar: 'العملة', en: 'Currency', fr: 'Devise', es: 'Moneda', tr: 'Para Birimi', ur: 'کرنسی',
    ja: 'Currency', zh: 'Currency', ru: 'Currency', pt: 'Currency'
  },
  save: {
ar: 'حفظ', en: 'Save', fr: 'Enregistrer', es: 'Guardar', tr: 'Kaydet', ur: 'محفوظ کریں',
    ja: 'Save', zh: 'Save', ru: 'Save', pt: 'Save'
  },
  recurring: {
ar: 'متكررة', en: 'Recurring', fr: 'Récurrent', es: 'Recurrente', tr: 'Tekrarlayan', ur: 'بار بار',
    ja: 'Recurring', zh: 'Recurring', ru: 'Recurring', pt: 'Recurring'
  },
  day: {
ar: 'يوم', en: 'Day', fr: 'Jour', es: 'Día', tr: 'Gün', ur: 'دن',
    ja: 'Day', zh: 'Day', ru: 'Day', pt: 'Day'
  },
  week: {
ar: 'أسبوع', en: 'Week', fr: 'Semaine', es: 'Semana', tr: 'Hafta', ur: 'ہفتہ',
    ja: 'Week', zh: 'Week', ru: 'Week', pt: 'Week'
  },
  month: {
ar: 'شهر', en: 'Month', fr: 'Mois', es: 'Mes', tr: 'Ay', ur: 'مہینہ',
    ja: 'Month', zh: 'Month', ru: 'Month', pt: 'Month'
  },
  year: {
ar: 'سنة', en: 'Year', fr: 'An', es: 'Año', tr: 'Yıl', ur: 'سال',
    ja: 'Year', zh: 'Year', ru: 'Year', pt: 'Year'
  },
  repeatsEveryLabel: {
ar: 'تتكرر كل', en: 'Repeats every', fr: 'Répéter tous les', es: 'Se repite cada', tr: 'Tekrarlanma', ur: 'ہر بار دہراتا ہے',
    ja: 'Repeats every', zh: 'Repeats every', ru: 'Repeats every', pt: 'Repeats every'
  },
  SAR: {
ar: 'ريال سعودي', en: 'Saudi Riyal', fr: 'Riyal Saoudien', es: 'Riyal Saudí', tr: 'Suudi Riyali', ur: 'سعودی ریال',
    ja: 'Saudi Riyal', zh: 'Saudi Riyal', ru: 'Saudi Riyal', pt: 'Saudi Riyal'
  },
  OMR: {
ar: 'ريال عماني', en: 'Omani Rial', fr: 'Rial Omanais', es: 'Rial Omaní', tr: 'Umman Riyali', ur: 'عمانی ریال',
    ja: 'Omani Rial', zh: 'Omani Rial', ru: 'Omani Rial', pt: 'Omani Rial'
  },
  USD: {
ar: 'دولار أمريكي', en: 'US Dollar', fr: 'Dollar US', es: 'Dólar Estadounidense', tr: 'ABD Doları', ur: 'امریکی ڈالر',
    ja: 'US Dollar', zh: 'US Dollar', ru: 'US Dollar', pt: 'US Dollar'
  },
  EUR: {
ar: 'يورو', en: 'Euro', fr: 'Euro', es: 'Euro', tr: 'Euro', ur: 'یورو',
    ja: 'Euro', zh: 'Euro', ru: 'Euro', pt: 'Euro'
  },
  GBP: {
ar: 'جنيه إسترليني', en: 'British Pound', fr: 'Livre Brit.', es: 'Libra Esterlina', tr: 'İngiliz Sterlini', ur: 'برطانوی پاؤنڈ',
    ja: 'British Pound', zh: 'British Pound', ru: 'British Pound', pt: 'British Pound'
  },
  AED: {
ar: 'درهم إماراتي', en: 'UAE Dirham', fr: 'Dirham UAE', es: 'Dirham EAU', tr: 'BAE Dirhemi', ur: 'اماراتی درہم',
    ja: 'UAE Dirham', zh: 'UAE Dirham', ru: 'UAE Dirham', pt: 'UAE Dirham'
  },
  KWD: {
ar: 'دينار كويتي', en: 'Kuwaiti Dinar', fr: 'Dinar Koweïtien', es: 'Dinar Kuwaití', tr: 'Kuveyt Dinarı', ur: 'کویتی دینار',
    ja: 'Kuwaiti Dinar', zh: 'Kuwaiti Dinar', ru: 'Kuwaiti Dinar', pt: 'Kuwaiti Dinar'
  },
  EGP: {
ar: 'جنيه مصري', en: 'Egyptian Pound', fr: 'Livre Égypt.', es: 'Libra Egipcia', tr: 'Mısır Lirası', ur: 'مصری پاؤنڈ',
    ja: 'Egyptian Pound', zh: 'Egyptian Pound', ru: 'Egyptian Pound', pt: 'Egyptian Pound'
  },
  equationBalanced: {
ar: 'المعادلة متوازنة', en: 'Equation is Balanced', fr: 'Équation Équilibrée', es: 'Ecuación Equilibrada', tr: 'Denklem Dengeli', ur: 'مساوات متوازن ہے',
    ja: 'Equation is Balanced', zh: 'Equation is Balanced', ru: 'Equation is Balanced', pt: 'Equation is Balanced'
  },
  equationUnbalanced: {
ar: 'المعادلة غير متوازنة!', en: 'Equation is Unbalanced!', fr: 'Équation Non Équilibrée', es: 'Ecuación No Equilibrada', tr: 'Denklem Dengesiz!', ur: 'مساوات غیر متوازن ہے!',
    ja: 'Equation is Unbalanced!', zh: 'Equation is Unbalanced!', ru: 'Equation is Unbalanced!', pt: 'Equation is Unbalanced!'
  },
  totalAssets: {
ar: 'إجمالي الأصول', en: 'Total Assets', fr: 'Total Actifs', es: 'Total Activos', tr: 'Toplam Varlıklar', ur: 'کل اثاثے',
    ja: 'Total Assets', zh: 'Total Assets', ru: 'Total Assets', pt: 'Total Assets'
  },
  totalLiabilitiesEquity: {
ar: 'الخصوم + حقوق الملكية', en: 'Liabilities + Equity', fr: 'Passifs + CP', es: 'Pasivos + PN', tr: 'Yükümlülük + Özkaynak', ur: 'واجبات + ایکویٹی',
    ja: 'Liabilities + Equity', zh: 'Liabilities + Equity', ru: 'Liabilities + Equity', pt: 'Liabilities + Equity'
  },
  errorSavingTransactions: {
ar: 'حدث خطأ أثناء حفظ العمليات', en: 'Error saving transactions', fr: 'Erreur d\'enregistrement', es: 'Error al guardar', tr: 'İşlemler kaydedilirken hata', ur: 'ٹرانزیکشن محفوظ کرنے میں خرابی',
    ja: 'Error saving transactions', zh: 'Error saving transactions', ru: 'Error saving transactions', pt: 'Error saving transactions'
  },
  recurringCreated: {
ar: 'تم إنشاء عمليات متكررة تلقائياً', en: 'Recurring transactions created automatically', fr: 'Série de transactions créée', es: 'Transacciones automáticas creadas', tr: 'Tekrarlayan işlemler otomatik oluşturuldu', ur: 'ٹرانزیکشنز خود بخود بن گئیں',
    ja: 'Recurring transactions created automatically', zh: 'Recurring transactions created automatically', ru: 'Recurring transactions created automatically', pt: 'Recurring transactions created automatically'
  },
  budgetExceededAlert: {
ar: 'تجاوز الميزانية: لقد تجاوزت الميزانية المخصصة لحساب', en: 'Budget Exceeded for', fr: 'Budget Dépassé pour', es: 'Presupuesto Excedido para', tr: 'Bütçe Aşıldı:', ur: 'بجٹ بڑھ گیا:',
    ja: 'Budget Exceeded for', zh: 'Budget Exceeded for', ru: 'Budget Exceeded for', pt: 'Budget Exceeded for'
  },
  budgetWarningAlert: {
ar: 'تنبيه ميزانية: لقد استهلكت أكثر من 85% من ميزانية', en: 'Budget Warning for', fr: 'Alerte Budget pour', es: 'Alerta Presupuesto para', tr: 'Bütçe Uyarısı:', ur: 'بجٹ الرٹ:',
    ja: 'Budget Warning for', zh: 'Budget Warning for', ru: 'Budget Warning for', pt: 'Budget Warning for'
  },
  budgetSavedSuccess: {
ar: 'تم حفظ الميزانية بنجاح', en: 'Budget saved successfully', fr: 'Budget enregistré', es: 'Presupuesto guardado', tr: 'Bütçe başarıyla kaydedildi', ur: 'بجٹ محفوظ ہو گیا',
    ja: 'Budget saved successfully', zh: 'Budget saved successfully', ru: 'Budget saved successfully', pt: 'Budget saved successfully'
  },
  budgetSaveError: {
ar: 'حدث خطأ أثناء حفظ الميزانية', en: 'Error saving budget', fr: 'Erreur budget', es: 'Error presupuesto', tr: 'Bütçe kaydedilirken hata', ur: 'بجٹ محفوظ کرنے میں خرابی',
    ja: 'Error saving budget', zh: 'Error saving budget', ru: 'Error saving budget', pt: 'Error saving budget'
  },
  errorExportingPDF: {
ar: 'حدث خطأ أثناء تصدير ملف PDF', en: 'Error exporting PDF', fr: 'Erreur PDF', es: 'Error PDF', tr: 'PDF dışa aktarılırken hata', ur: 'PDF ایکسپورٹ کرنے میں خرابی',
    ja: 'Error exporting PDF', zh: 'Error exporting PDF', ru: 'Error exporting PDF', pt: 'Error exporting PDF'
  },
  loading: {
ar: 'جاري التحميل...', en: 'Loading...', fr: 'Chargement...', es: 'Cargando...', tr: 'Yükleniyor...', ur: 'لوڈنگ...',
    ja: 'Loading...', zh: 'Loading...', ru: 'Loading...', pt: 'Loading...'
  },
  loginPrompt: {
ar: 'يرجى تسجيل الدخول لحفظ وإدارة عملياتك المالية بأمان.', en: 'Please sign in to manage your finances.', fr: 'Connectez-vous SVP', es: 'Inicie sesión por favor', tr: 'Lütfen giriş yapın', ur: 'براہ کرم سائن ان کریں',
    ja: 'Please sign in to manage your finances.', zh: 'Please sign in to manage your finances.', ru: 'Please sign in to manage your finances.', pt: 'Please sign in to manage your finances.'
  },
  noTransactions: {
ar: 'لا توجد عمليات مسجلة بعد.', en: 'No transactions yet.', fr: 'Pas de transactions', es: 'Sin transacciones', tr: 'Henüz işlem yok', ur: 'ابھی تک کوئی ٹرانزیکشن نہیں',
    ja: 'No transactions yet.', zh: 'No transactions yet.', ru: 'No transactions yet.', pt: 'No transactions yet.'
  },
  addTransactionPrompt: {
ar: 'قم بإضافة عملية جديدة من النموذج الجانبي.', en: 'Add a new transaction.', fr: 'Ajouter une transaction', es: 'Agregar transacción', tr: 'Yeni işlem ekleyin', ur: 'نئی ٹرانزیکشن شامل کریں',
    ja: 'Add a new transaction.', zh: 'Add a new transaction.', ru: 'Add a new transaction.', pt: 'Add a new transaction.'
  },
  deleteTransaction: {
ar: 'حذف العملية', en: 'Delete Transaction', fr: 'Supprimer', es: 'Eliminar', tr: 'İşlemi Sil', ur: 'حذف کریں',
    ja: 'Delete Transaction', zh: 'Delete Transaction', ru: 'Delete Transaction', pt: 'Delete Transaction'
  },
  amountPlaceholder: {
ar: 'المبلغ (+ أو -)', en: 'Amount (+ or -)', fr: 'Montant (+/-)', es: 'Monto (+/-)', tr: 'Tutar (+/-)', ur: 'رقم (+ یا -)',
    ja: 'Amount (+ or -)', zh: 'Amount (+ or -)', ru: 'Amount (+ or -)', pt: 'Amount (+ or -)'
  },
  negativeAmountNote: {
ar: '* أدخل المبلغ بالسالب (-) في حالة النقص.', en: '* Enter negative (-) for decrease.', fr: '* Négatif (-) pour diminution', es: '* Negativo (-) para disminución', tr: '* Azalış için negatif (-) girin', ur: '* کمی کے لیے منفی (-) درج کریں',
    ja: '* Enter negative (-) for decrease.', zh: '* Enter negative (-) for decrease.', ru: '* Enter negative (-) for decrease.', pt: '* Enter negative (-) for decrease.'
  },
  importFiles: {
ar: 'استيراد ملفات/صور', en: 'Import Files/Images', fr: 'Importer des Fichiers', es: 'Importar Archivos', tr: 'Dosya/Resim İçe Aktar', ur: 'فائلیں/تصاویر درآمد کریں',
    ja: 'Import Files/Images', zh: 'Import Files/Images', ru: 'Import Files/Images', pt: 'Import Files/Images'
  },
  importFilesDesc: {
ar: 'استخرج المعاملات من PDF، Word، Excel، PowerPoint أو الصور.', en: 'Extract from PDF, Word, Excel, Images.', fr: 'Extraire de PDF, Word, Excel, Images', es: 'Extraer de PDF, Word, Excel, Imágenes', tr: 'PDF, Word, Excel veya Resimlerden veri çekin', ur: 'PDF، Word، Excel یا تصاویر سے ڈیٹا نکالیں',
    ja: 'Extract from PDF, Word, Excel, Images.', zh: 'Extract from PDF, Word, Excel, Images.', ru: 'Extract from PDF, Word, Excel, Images.', pt: 'Extract from PDF, Word, Excel, Images.'
  },
  clickToUpload: {
ar: 'انقر هنا للرفع أو اسحب الملف/الصورة هنا', en: 'Click to upload or drag here', fr: 'Cliquez ou glissez ici', es: 'Click o arrastre aquí', tr: 'Yüklemek için tıklayın veya sürükleyin', ur: 'اپ لوڈ کرنے کے لیے کلک کریں یا یہاں گھسیٹیں',
    ja: 'Click to upload or drag here', zh: 'Click to upload or drag here', ru: 'Click to upload or drag here', pt: 'Click to upload or drag here'
  },
  analyzing: {
ar: 'جاري استخراج البيانات وتحليل النص...', en: 'Analyzing data...', fr: 'Analyse en cours...', es: 'Analizando...', tr: 'Veri analiz ediliyor...', ur: 'تجزیہ کیا جا رہا ہے...',
    ja: 'Analyzing data...', zh: 'Analyzing data...', ru: 'Analyzing data...', pt: 'Analyzing data...'
  },
  clear: {
ar: 'مسح', en: 'Clear', fr: 'Effacer', es: 'Limpiar', tr: 'Temizle', ur: 'صاف کریں',
    ja: 'Clear', zh: 'Clear', ru: 'Clear', pt: 'Clear'
  },
  depreciationCalc: {
ar: 'حاسبة الإهلاك', en: 'Depreciation Calc', fr: 'Calcul d\'Amortissement', es: 'Calc. Depreciación', tr: 'Amortisman Hesaplayıcı', ur: 'فرسودگی کا کیلکولیٹر',
    ja: 'Depreciation Calc', zh: 'Depreciation Calc', ru: 'Depreciation Calc', pt: 'Depreciation Calc'
  },
  assetCost: {
ar: 'تكلفة الأصل', en: 'Asset Cost', fr: 'Coût de l\'Actif', es: 'Costo del Activo', tr: 'Varlık Maliyeti', ur: 'اثاثے کی قیمت',
    ja: 'Asset Cost', zh: 'Asset Cost', ru: 'Asset Cost', pt: 'Asset Cost'
  },
  salvageValue: {
ar: 'القيمة التخريدية (الخردة)', en: 'Salvage Value', fr: 'Valeur Résiduelle', es: 'Valor Residual', tr: 'Hurda Değeri', ur: 'سکریپ کی قیمت',
    ja: 'Salvage Value', zh: 'Salvage Value', ru: 'Salvage Value', pt: 'Salvage Value'
  },
  usefulLife: {
ar: 'العمر الإنتاجي (سنوات)', en: 'Useful Life (Years)', fr: 'Durée de Vie (Ans)', es: 'Vida Útil (Años)', tr: 'Faydalı Ömür (Yıl)', ur: 'کارآمد زندگی (سال)',
    ja: 'Useful Life (Years)', zh: 'Useful Life (Years)', ru: 'Useful Life (Years)', pt: 'Useful Life (Years)'
  },
  annualDepreciation: {
ar: 'الإهلاك السنوي', en: 'Annual Depr.', fr: 'Amort. Annuel', es: 'Depr. Anual', tr: 'Yıllık Amortisman', ur: 'سالانہ فرسودگی',
    ja: 'Annual Depr.', zh: 'Annual Depr.', ru: 'Annual Depr.', pt: 'Annual Depr.'
  },
  monthlyDepreciation: {
ar: 'الإهلاك الشهري', en: 'Monthly Depr.', fr: 'Amort. Mensuel', es: 'Depr. Mensual', tr: 'Aylık Amortisman', ur: 'ماہانہ فرسودگی',
    ja: 'Monthly Depr.', zh: 'Monthly Depr.', ru: 'Monthly Depr.', pt: 'Monthly Depr.'
  },
  applyDepreciation: {
ar: 'تسجيل الإهلاك في السجل', en: 'Apply to Ledger', fr: 'Appliquer au Grand Livre', es: 'Aplicar al Libro Mayor', tr: 'Deftere İşle', ur: 'لیجر پر لاگو کریں',
    ja: 'Apply to Ledger', zh: 'Apply to Ledger', ru: 'Apply to Ledger', pt: 'Apply to Ledger'
  },
  selectAssetToDepreciate: {
ar: 'اختر الأصل لإهلاكه', en: 'Select Asset', fr: 'Choisir l\'Actif', es: 'Seleccionar Activo', tr: 'Varlık Seçin', ur: 'اثاثہ منتخب کریں',
    ja: 'Select Asset', zh: 'Select Asset', ru: 'Select Asset', pt: 'Select Asset'
  },
  depreciationFor: {
ar: 'إهلاك لـ', en: 'Depr. for', fr: 'Amort. pour', es: 'Depr. para', tr: 'Amortisman:', ur: 'فرسودگی برائے',
    ja: 'Depr. for', zh: 'Depr. for', ru: 'Depr. for', pt: 'Depr. for'
  },
  financialInsights: {
ar: 'التحليلات المالية', en: 'Financial Insights', fr: 'Analyses Financières', es: 'Análisis Financieros', tr: 'Finansal Analizler', ur: 'مالیاتی تجزیات',
    ja: 'Financial Insights', zh: 'Financial Insights', ru: 'Financial Insights', pt: 'Financial Insights'
  },
  currentRatio: {
ar: 'نسبة السيولة (التداول)', en: 'Current Ratio', fr: 'Ratio de Liquidité', es: 'Razón Circulante', tr: 'Cari Oran', ur: 'موجودہ تناسب',
    ja: 'Current Ratio', zh: 'Current Ratio', ru: 'Current Ratio', pt: 'Current Ratio'
  },
  currentRatioDesc: {
ar: 'القدرة على سداد الالتزامات قصيرة الأجل', en: 'Short-term debt ability', fr: 'Capacité de dette court terme', es: 'Capacidad deuda corto plazo', tr: 'Kısa vadeli borç ödeme gücü', ur: 'قلیل مدتی قرض کی ادائیگی',
    ja: 'Short-term debt ability', zh: 'Short-term debt ability', ru: 'Short-term debt ability', pt: 'Short-term debt ability'
  },
  debtToEquity: {
ar: 'نسبة الديون إلى الملكية', en: 'Debt-to-Equity Ratio', fr: 'Ratio Dette/Fonds Propres', es: 'Razón Deuda/Capital', tr: 'Borç/Özkaynak Oranı', ur: 'قرض سے ایکویٹی کا تناسب',
    ja: 'Debt-to-Equity Ratio', zh: 'Debt-to-Equity Ratio', ru: 'Debt-to-Equity Ratio', pt: 'Debt-to-Equity Ratio'
  },
  debtToEquityDesc: {
ar: 'درجة الاعتماد على الديون في التمويل', en: 'Reliance on debt', fr: 'Dépendance à la dette', es: 'Dependencia de la deuda', tr: 'Borca dayalı finansman düzeyi', ur: 'قرض پر انحصار',
    ja: 'Reliance on debt', zh: 'Reliance on debt', ru: 'Reliance on debt', pt: 'Reliance on debt'
  },
  netProfit: {
ar: 'صافي الربح', en: 'Net Profit', fr: 'Bénéfice Net', es: 'Utilidad Neta', tr: 'Net Kar', ur: 'خالص منافع',
    ja: 'Net Profit', zh: 'Net Profit', ru: 'Net Profit', pt: 'Net Profit'
  },
  monthlyProfitTrend: {
ar: 'اتجاه صافي الربح شهرياً', en: 'Monthly Profit Trend', fr: 'Tendance Mensuelle', es: 'Tendencia Mensual', tr: 'Aylık Kar Trendi', ur: 'ماہانہ منافع کا رجحان',
    ja: 'Monthly Profit Trend', zh: 'Monthly Profit Trend', ru: 'Monthly Profit Trend', pt: 'Monthly Profit Trend'
  },
  lowLiquidity: {
ar: 'سيولة منخفضة! انتبه لالتزاماتك', en: 'Low Liquidity!', fr: 'Liquidité Faible!', es: 'Liquidez Baja!', tr: 'Düşük Likidite!', ur: 'کم لیکویڈیٹی!',
    ja: 'Low Liquidity!', zh: 'Low Liquidity!', ru: 'Low Liquidity!', pt: 'Low Liquidity!'
  },
  healthyLiquidity: {
ar: 'سيولة ممتازة', en: 'Healthy Liquidity', fr: 'Liquidité Saine', es: 'Liquidez Saludable', tr: 'Sağlıklı Likidite', ur: 'بہترین لیکویڈیٹی',
    ja: 'Healthy Liquidity', zh: 'Healthy Liquidity', ru: 'Healthy Liquidity', pt: 'Healthy Liquidity'
  },
  attachDocument: {
ar: 'إرفاق مستند', en: 'Attach Document', fr: 'Joindre Document', es: 'Adjuntar Doc.', tr: 'Dosya Ekle', ur: 'دستاویز منسلک کریں',
    ja: 'Attach Document', zh: 'Attach Document', ru: 'Attach Document', pt: 'Attach Document'
  },
  viewDocument: {
ar: 'عرض المستند', en: 'View Document', fr: 'Voir Document', es: 'Ver Doc.', tr: 'Dosyayı Gör', ur: 'دستاویز دیکھیں',
    ja: 'View Document', zh: 'View Document', ru: 'View Document', pt: 'View Document'
  },
  uploading: {
ar: 'جاري الرفع...', en: 'Uploading...', fr: 'Envoi...', es: 'Subiendo...', tr: 'Yükleniyor...', ur: 'اپ لوڈ ہو رہا ہے...',
    ja: 'Uploading...', zh: 'Uploading...', ru: 'Uploading...', pt: 'Uploading...'
  },
  documentPreview: {
ar: 'معاينة المستند', en: 'Document Preview', fr: 'Aperçu', es: 'Vista Previa', tr: 'Dosya Önizleme', ur: 'دستاویز کا معائنہ',
    ja: 'Document Preview', zh: 'Document Preview', ru: 'Document Preview', pt: 'Document Preview'
  },
  noDocument: {
ar: 'لا يوجد مستند مرفق', en: 'No document', fr: 'Aucun document', es: 'Sin documento', tr: 'Dosya yok', ur: 'کوئی دستاویز نہیں ہے',
    ja: 'No document', zh: 'No document', ru: 'No document', pt: 'No document'
  },
  debit: {
ar: 'مدين (+)', en: 'Debit (+)', fr: 'Débit (+)', es: 'Débito (+)', tr: 'Borç (+)', ur: 'ڈیبٹ (+)',
    ja: 'Debit (+)', zh: 'Debit (+)', ru: 'Debit (+)', pt: 'Debit (+)'
  },
  credit: {
ar: 'دائن (-)', en: 'Credit (-)', fr: 'Crédit (-)', es: 'Crédito (-)', tr: 'Alacak (-)', ur: 'کریڈٹ (-)',
    ja: 'Credit (-)', zh: 'Credit (-)', ru: 'Credit (-)', pt: 'Credit (-)'
  },
  accountName: {
ar: 'اسم الحساب', en: 'Account Name', fr: 'Compte', es: 'Cuenta', tr: 'Hesap Adı', ur: 'اکاؤنٹ کا نام',
    ja: 'Account Name', zh: 'Account Name', ru: 'Account Name', pt: 'Account Name'
  },
  impactValue: {
ar: 'قيمة التأثير', en: 'Impact Value', fr: 'Valeur', es: 'Valor', tr: 'Etki Değeri', ur: 'اثر کی قیمت',
    ja: 'Impact Value', zh: 'Impact Value', ru: 'Impact Value', pt: 'Impact Value'
  },
  transactionSource: {
ar: 'مصدر العملية', en: 'Transaction Source', fr: 'Source', es: 'Fuente', tr: 'İşlem Kaynağı', ur: 'ذریعہ',
    ja: 'Transaction Source', zh: 'Transaction Source', ru: 'Transaction Source', pt: 'Transaction Source'
  },
  incomeStatement: {
ar: 'قائمة الدخل', en: 'Income Statement', fr: 'Compte de Résultat', es: 'Estado de Resultados', tr: 'Gelir Tablosu', ur: 'آمدنی کا گوشوارہ',
    ja: 'Income Statement', zh: 'Income Statement', ru: 'Income Statement', pt: 'Income Statement'
  },
  periodEnding: {
ar: 'للفترة المنتهية في', en: 'For the period ending', fr: 'Pour la période se terminant le', es: 'Para el período que termina el', tr: 'Dönem sonu:', ur: 'ختم ہونے والی مدت کے لیے',
    ja: 'For the period ending', zh: 'For the period ending', ru: 'For the period ending', pt: 'For the period ending'
  },
  operatingExpenses: {
ar: 'المصروفات التشغيلية', en: 'Operating Expenses', fr: 'Charges d\'Exploitation', es: 'Gastos Operativos', tr: 'Faaliyet Giderleri', ur: 'آپریٹنگ اخراجات',
    ja: 'Operating Expenses', zh: 'Operating Expenses', ru: 'Operating Expenses', pt: 'Operating Expenses'
  },
  totalOperatingExpenses: {
ar: 'إجمالي المصروفات التشغيلية', en: 'Total Operating Expenses', fr: 'Total Charges d\'Exploitation', es: 'Total Gastos Operativos', tr: 'Toplam Faaliyet Giderleri', ur: 'کل آپریٹنگ اخراجات',
    ja: 'Total Operating Expenses', zh: 'Total Operating Expenses', ru: 'Total Operating Expenses', pt: 'Total Operating Expenses'
  },
  netIncome: {
ar: 'صافي الدخل', en: 'Net Income', fr: 'Résultat Net', es: 'Utilidad Neta', tr: 'Net Gelir', ur: 'خالص آمدنی',
    ja: 'Net Income', zh: 'Net Income', ru: 'Net Income', pt: 'Net Income'
  },
  totalRevenue: {
ar: 'إجمالي الإيرادات', en: 'Total Revenue', fr: 'Chiffre d\'Affaires Total', es: 'Ingresos Totales', tr: 'Toplam Gelir', ur: 'کل آمدنی',
    ja: 'Total Revenue', zh: 'Total Revenue', ru: 'Total Revenue', pt: 'Total Revenue'
  },
  exportingPDF: {
ar: 'جاري تصدير ملف PDF...', en: 'Exporting PDF...', fr: 'Exportation PDF...', es: 'Exportando PDF...', tr: 'PDF dışa aktarılıyor...', ur: 'PDF ایکسپورٹ ہو رہا ہے...',
    ja: 'Exporting PDF...', zh: 'Exporting PDF...', ru: 'Exporting PDF...', pt: 'Exporting PDF...'
  },
  exportSuccess: {
ar: 'تم تصدير الملف بنجاح', en: 'Exported successfully', fr: 'Exporté avec succès', es: 'Exportado con éxito', tr: 'Başarıyla dışa aktarıldı', ur: 'کامیابی سے ایکسپورٹ ہو گیا',
    ja: 'Exported successfully', zh: 'Exported successfully', ru: 'Exported successfully', pt: 'Exported successfully'
  },
  balanceSheet: {
ar: 'الميزانية العمومية', en: 'Balance Sheet', fr: 'Bilan', es: 'Balance General', tr: 'Bilanço', ur: 'بیلنس شیٹ',
    ja: 'Balance Sheet', zh: 'Balance Sheet', ru: 'Balance Sheet', pt: 'Balance Sheet'
  },
  cashFlowStatement: {
ar: 'قائمة التدفقات النقدية', en: 'Cash Flow Statement', fr: 'État des Flux de Trésorerie', es: 'Estado de Flujos de Efectivo', tr: 'Nakit Akış Tablosu', ur: 'کیش فلو اسٹیٹمنٹ',
    ja: 'Cash Flow Statement', zh: 'Cash Flow Statement', ru: 'Cash Flow Statement', pt: 'Cash Flow Statement'
  },
  operatingActivities: {
ar: 'الأنشطة التشغيلية', en: 'Operating Activities', fr: 'Activités Opérationnelles', es: 'Actividades Operativas', tr: 'İşletme Faaliyetleri', ur: 'آپریٹنگ سرگرمیاں',
    ja: 'Operating Activities', zh: 'Operating Activities', ru: 'Operating Activities', pt: 'Operating Activities'
  },
  investingActivities: {
ar: 'الأنشطة الاستثمارية', en: 'Investing Activities', fr: 'Activités d\'Investissement', es: 'Actividades de Inversión', tr: 'Yatırım Faaliyetleri', ur: 'سرمایہ کاری کی سرگرمیاں',
    ja: 'Investing Activities', zh: 'Investing Activities', ru: 'Investing Activities', pt: 'Investing Activities'
  },
  financingActivities: {
ar: 'الأنشطة التمويلية', en: 'Financing Activities', fr: 'Activités de Financement', es: 'Actividades de Financiación', tr: 'Finansman Faaliyetleri', ur: 'مالیاتی سرگرمیاں',
    ja: 'Financing Activities', zh: 'Financing Activities', ru: 'Financing Activities', pt: 'Financing Activities'
  },
  netCashFlow: {
ar: 'صافي التدفق النقدي', en: 'Net Cash Flow', fr: 'Flux de Trésorerie Net', es: 'Flujo de Efectivo Neto', tr: 'Net Nakit Akışı', ur: 'خالص کیش فلو',
    ja: 'Net Cash Flow', zh: 'Net Cash Flow', ru: 'Net Cash Flow', pt: 'Net Cash Flow'
  },
  cashAtBeginning: {
ar: 'النقدية في بداية الفترة', en: 'Cash at Beginning', fr: 'Trésorerie au Début', es: 'Efectivo al Inicio', tr: 'Dönem Başı Nakit', ur: 'شروع میں نقد',
    ja: 'Cash at Beginning', zh: 'Cash at Beginning', ru: 'Cash at Beginning', pt: 'Cash at Beginning'
  },
  cashAtEnd: {
ar: 'النقدية في نهاية الفترة', en: 'Cash at End', fr: 'Trésorerie à la Fin', es: 'Efectivo al Final', tr: 'Dönem Sonu Nakit', ur: 'آخر میں نقد',
    ja: 'Cash at End', zh: 'Cash at End', ru: 'Cash at End', pt: 'Cash at End'
  },
  increaseInCash: {
ar: 'زيادة في النقدية', en: 'Increase in Cash', fr: 'Augmentation de la Trésorerie', es: 'Aumento de Efectivo', tr: 'Nakit Artışı', ur: 'نقد رقم میں اضافہ',
    ja: 'Increase in Cash', zh: 'Increase in Cash', ru: 'Increase in Cash', pt: 'Increase in Cash'
  },
  decreaseInCash: {
ar: 'نقص في النقدية', en: 'Decrease in Cash', fr: 'Diminution de la Trésorerie', es: 'Disminución de Efectivo', tr: 'Nakit Azalışı', ur: 'نقد رقم میں کمی',
    ja: 'Decrease in Cash', zh: 'Decrease in Cash', ru: 'Decrease in Cash', pt: 'Decrease in Cash'
  },
  aboutUs: {
ar: 'من نحن', en: 'About Us', fr: 'À Propos', es: 'Sobre Nosotros', tr: 'Hakkımızda', ur: 'ہمارے بارے میں',
    ja: 'About Us', zh: 'About Us', ru: 'About Us', pt: 'About Us'
  },
  contactUs: {
ar: 'اتصل بنا', en: 'Contact Us', fr: 'Contactez-Nous', es: 'Contáctenos', tr: 'İletişim', ur: 'ہم سے رابطہ کریں',
    ja: 'Contact Us', zh: 'Contact Us', ru: 'Contact Us', pt: 'Contact Us'
  },
  aboutTitle: {
ar: 'عن متزن', en: 'About Motazin', fr: 'À Propos de Motazin', es: 'Sobre Motazin', tr: 'Motazin Hakkında', ur: 'متوازن کے بارے میں',
    ja: 'About Motazin', zh: 'About Motazin', ru: 'About Motazin', pt: 'About Motazin'
  },
  aboutSubtitle: {
ar: 'تمكين الأفراد والشركات بأدوات مالية ذكية ومبسطة.', en: 'Empowering individuals and businesses with smart financial tools.', fr: 'Outiller les individus et les entreprises avec des outils financiers intelligents.', es: 'Empoderando a personas y empresas con herramientas financieras inteligentes.', tr: 'Bireyleri ve işletmeleri akıllı finansal araçlarla güçlendiriyoruz.', ur: 'افراد اور کاروبار کو سمارٹ مالیاتی ٹولز سے بااختیار بنانا۔',
    ja: 'Empowering individuals and businesses with smart financial tools.', zh: 'Empowering individuals and businesses with smart financial tools.', ru: 'Empowering individuals and businesses with smart financial tools.', pt: 'Empowering individuals and businesses with smart financial tools.'
  },
  ourStory: {
ar: 'قصتنا', en: 'Our Story', fr: 'Notre Histoire', es: 'Nuestra Historia', tr: 'Hikayemiz', ur: 'ہماری کہانی',
    ja: 'Our Story', zh: 'Our Story', ru: 'Our Story', pt: 'Our Story'
  },
  storyText: {
ar: 'تأسست حاسبة "متزن" من الرغبة في تبسيط تعقيدات المحاسبة. نؤمن بأن الإدارة المالية لا ينبغي أن تكون مهمة شاقة تقتصر على الخبراء فقط. اجتمع فريقنا من المحللين الماليين، المطورين، والمتخصصين لإنشاء منصة تتحدث لغتك وتسهل حياتك.', en: 'Motazin was born out of a desire to simplify the complexities of accounting. We believe that managing finances shouldn\'t be reserved only for experts. Our team of financial analysts, developers, and educators came together to create a platform that speaks your language.', fr: 'Motazin est né du désir de simplifier les complexités de la comptabilité.', es: 'Motazin nació del deseo de simplificar las complejidades de la contabilidad.', tr: 'Motazin, muhasebenin karmaşıklıklarını basitleştirme arzusuyla doğdu.', ur: 'متوازن اکاؤنٹنگ کی پیچیدگیوں کو آسان بنانے کی خواہش سے پیدا ہوا۔',
    ja: 'Motazin was born out of a desire to simplify the complexities of accounting.', zh: 'Motazin was born out of a desire to simplify the complexities of accounting.', ru: 'Motazin was born out of a desire to simplify the complexities of accounting.', pt: 'Motazin was born out of a desire to simplify the complexities of accounting.'
  },
  coreValues: {
ar: 'قيمنا الأساسية', en: 'Core Values', fr: 'Nos Valeurs', es: 'Nuestros Valores', tr: 'Temel Değerlerimiz', ur: 'بنیادی اقدار',
    ja: 'Core Values', zh: 'Core Values', ru: 'Core Values', pt: 'Core Values'
  },
  value1Title: {
ar: 'البساطة', en: 'Simplicity', fr: 'Simplicité', es: 'Simplicidad', tr: 'Basitlik', ur: 'سادگی',
    ja: 'Simplicity', zh: 'Simplicity', ru: 'Simplicity', pt: 'Simplicity'
  },
  value1Desc: {
ar: 'نقوم بإزالة التعقيد والمصطلحات الصعبة من الإدارة المالية.', en: 'We strip away the jargon and confusion from financial management.', fr: 'Nous éliminons le jargon et la confusion de la gestion financière.', es: 'Eliminamos la jerga y la confusión de la gestión financiera.', tr: 'Finans yönetiminden karmaşıklığı kaldırıyoruz.', ur: 'ہم مالیاتی انتظام سے پیچیدگی دور کرتے ہیں۔',
    ja: 'We strip away the jargon and confusion from financial management.', zh: 'We strip away the jargon and confusion from financial management.', ru: 'We strip away the jargon and confusion from financial management.', pt: 'We strip away the jargon and confusion from financial management.'
  },
  value2Title: {
ar: 'الدقة', en: 'Accuracy', fr: 'Précision', es: 'Precisión', tr: 'Doğruluk', ur: 'درستگی',
    ja: 'Accuracy', zh: 'Accuracy', ru: 'Accuracy', pt: 'Accuracy'
  },
  value2Desc: {
ar: 'الدقة المتناهية هي جوهر حاسباتنا وأنظمتنا الذكية.', en: 'Precision is at the heart of our calculators and AI systems.', fr: 'La précision est au cœur de nos calculateurs et systèmes IA.', es: 'La precisión está en el centro de nuestras calculadoras y sistemas IA.', tr: 'Hesaplayıcılarımızın ve yapay zeka sistemlerimizin özünde doğruluk var.', ur: 'درستگی ہمارے کیلکولیٹرز اور AI سسٹمز کا جوہر ہے۔',
    ja: 'Precision is at the heart of our calculators and AI systems.', zh: 'Precision is at the heart of our calculators and AI systems.', ru: 'Precision is at the heart of our calculators and AI systems.', pt: 'Precision is at the heart of our calculators and AI systems.'
  },
  value3Title: {
ar: 'التمكين', en: 'Empowerment', fr: 'Autonomisation', es: 'Empoderamiento', tr: 'Güçlendirme', ur: 'بااختیار بنانا',
    ja: 'Empowerment', zh: 'Empowerment', ru: 'Empowerment', pt: 'Empowerment'
  },
  value3Desc: {
ar: 'نهدف إلى منحك السيطرة الكاملة والفهم العميق لمستقبلك المالي.', en: 'We aim to give you total control and understanding of your financial destiny.', fr: 'Nous visons à vous donner le contrôle total de votre avenir financier.', es: 'Te damos el control total de tu destino financiero.', tr: 'Finansal geleceğiniz üzerinde tam kontrol sağlamayı hedefliyoruz.', ur: 'ہم آپ کو مالیاتی مستقبل پر مکمل کنٹرول دینا چاہتے ہیں۔',
    ja: 'We aim to give you total control and understanding of your financial destiny.', zh: 'We aim to give you total control and understanding of your financial destiny.', ru: 'We aim to give you total control and understanding of your financial destiny.', pt: 'We aim to give you total control and understanding of your financial destiny.'
  },
  contactTitle: {
ar: 'اتصل بنا', en: 'Contact Us', fr: 'Contactez-Nous', es: 'Contáctenos', tr: 'İletişim', ur: 'ہم سے رابطہ کریں',
    ja: 'Contact Us', zh: 'Contact Us', ru: 'Contact Us', pt: 'Contact Us'
  },
  contactSubtitle: {
ar: 'نحن هنا للمساعدة والإجابة على أي سؤال قد يراودك.', en: 'We are here to help and answer any question you might have.', fr: 'Nous sommes là pour vous aider.', es: 'Estamos aquí para ayudarte.', tr: 'Size yardımcı olmak için buradayız.', ur: 'ہم آپ کی مدد کے لیے حاضر ہیں۔',
    ja: 'We are here to help and answer any question you might have.', zh: 'We are here to help and answer any question you might have.', ru: 'We are here to help and answer any question you might have.', pt: 'We are here to help and answer any question you might have.'
  },
  sendMessage: {
ar: 'أرسل لنا رسالة', en: 'Send us a Message', fr: 'Envoyez-nous un Message', es: 'Envíenos un Mensaje', tr: 'Bize Mesaj Gönderin', ur: 'ہمیں پیغام بھیجیں',
    ja: 'Send us a Message', zh: 'Send us a Message', ru: 'Send us a Message', pt: 'Send us a Message'
  },
  fullName: {
ar: 'الاسم الكامل', en: 'Full Name', fr: 'Nom Complet', es: 'Nombre Completo', tr: 'Tam Adı', ur: 'پورا نام',
    ja: 'Full Name', zh: 'Full Name', ru: 'Full Name', pt: 'Full Name'
  },
  emailAddress: {
ar: 'البريد الإلكتروني', en: 'Email Address', fr: 'Adresse E-mail', es: 'Correo Electrónico', tr: 'E-posta Adresi', ur: 'ای میل ایڈریس',
    ja: 'Email Address', zh: 'Email Address', ru: 'Email Address', pt: 'Email Address'
  },
  yourMessage: {
ar: 'الرسالة', en: 'Your Message', fr: 'Votre Message', es: 'Su Mensaje', tr: 'Mesajınız', ur: 'آپ کا پیغام',
    ja: 'Your Message', zh: 'Your Message', ru: 'Your Message', pt: 'Your Message'
  },
  sendButton: {
ar: 'إرسال الرسالة', en: 'Send Message', fr: 'Envoyer', es: 'Enviar', tr: 'Gönder', ur: 'پیغام بھیجیں',
    ja: 'Send Message', zh: 'Send Message', ru: 'Send Message', pt: 'Send Message'
  },
  contactInfo: {
ar: 'معلومات الاتصال', en: 'Contact Information', fr: 'Coordonnées', es: 'Información de Contacto', tr: 'İletişim Bilgileri', ur: 'رابطہ کی معلومات',
    ja: 'Contact Information', zh: 'Contact Information', ru: 'Contact Information', pt: 'Contact Information'
  },
  emailLabel: {
ar: 'البريد الإلكتروني', en: 'Email', fr: 'E-mail', es: 'Correo', tr: 'E-posta', ur: 'ای میل',
    ja: 'Email', zh: 'Email', ru: 'Email', pt: 'Email'
  },
  phoneLabel: {
ar: 'الهاتف', en: 'Phone', fr: 'Téléphone', es: 'Teléfono', tr: 'Telefon', ur: 'فون',
    ja: 'Phone', zh: 'Phone', ru: 'Phone', pt: 'Phone'
  },
  addressLabel: {
ar: 'العنوان', en: 'Address', fr: 'Adresse', es: 'Dirección', tr: 'Adres', ur: 'پتہ',
    ja: 'Address', zh: 'Address', ru: 'Address', pt: 'Address'
  },
  addressValue: {
ar: 'مسقط، سلطنة عمان', en: 'Muscat, Sultanate of Oman', fr: 'Mascate, Oman', es: 'Mascate, Omán', tr: 'Maskat, Umman', ur: 'مسقط، سلطنت عمان',
    ja: 'Muscat, Sultanate of Oman', zh: 'Muscat, Sultanate of Oman', ru: 'Muscat, Sultanate of Oman', pt: 'Muscat, Sultanate of Oman'
  },
  namePlaceholder: {
ar: 'أحمد محمد', en: 'John Doe', fr: 'Jean Dupont', es: 'Juan Pérez', tr: 'Ahmet Yılmaz', ur: 'احمد محمد',
    ja: 'John Doe', zh: 'John Doe', ru: 'John Doe', pt: 'John Doe'
  },
  emailPlaceholder: {
ar: 'you@example.com', en: 'you@example.com', fr: 'vous@exemple.com', es: 'tu@ejemplo.com', tr: 'siz@ornek.com', ur: 'you@example.com',
    ja: 'you@example.com', zh: 'you@example.com', ru: 'you@example.com', pt: 'you@example.com'
  },
  messagePlaceholder: {
ar: 'كيف يمكننا مساعدتك؟', en: 'How can we help you?', fr: 'Comment pouvons-nous vous aider ?', es: '¿Cómo podemos ayudarte?', tr: 'Size nasıl yardımcı olabiliriz?', ur: 'ہم آپ کی کیسے مدد کر سکتے ہیں؟',
    ja: 'How can we help you?', zh: 'How can we help you?', ru: 'How can we help you?', pt: 'How can we help you?'
  },
  successSent: {
ar: 'تم الإرسال بنجاح!', en: 'Sent successfully!', fr: 'Envoyé avec succès !', es: '¡Enviado con éxito!', tr: 'Başarıyla gönderildi!', ur: 'کامیابی کے ساتھ بھیج دیا گیا!',
    ja: 'Sent successfully!', zh: 'Sent successfully!', ru: 'Sent successfully!', pt: 'Sent successfully!'
  },
  menu: {
ar: 'القائمة', en: 'Menu', fr: 'Menu', es: 'Menú', tr: 'Menü', ur: 'مینو',
    ja: 'Menu', zh: 'Menu', ru: 'Menu', pt: 'Menu'
  },
  theme: {
ar: 'المظهر', en: 'Theme', fr: 'Thème', es: 'Tema', tr: 'Tema', ur: 'تھیم',
    ja: 'Theme', zh: 'Theme', ru: 'Theme', pt: 'Theme'
  },
  guestUser: {
ar: 'مستخدم ضيف', en: 'Guest User', fr: 'Invité', es: 'Invitado', tr: 'Misafir Kullanıcı', ur: 'مہمان صارف',
    ja: 'Guest User', zh: 'Guest User', ru: 'Guest User', pt: 'Guest User'
  },
  login: {
ar: 'تسجيل الدخول', en: 'Login', fr: 'Connexion', es: 'Iniciar Sesión', tr: 'Giriş Yap', ur: 'لاگ ان',
    ja: 'Login', zh: 'Login', ru: 'Login', pt: 'Login'
  },
  dashboard: {
ar: 'لوحة القيادة', en: 'Dashboard', fr: 'Tableau de bord', es: 'Tablero', tr: 'Panel', ur: 'ڈیش بورڈ',
    ja: 'Dashboard', zh: 'Dashboard', ru: 'Dashboard', pt: 'Dashboard'
  },
  home: {
    ar: 'الرئيسية', en: 'Home', fr: 'Accueil', es: 'Inicio', tr: 'Ana Sayfa', ur: 'ہوم',
    ja: 'Home', zh: 'Home', ru: 'Home', pt: 'Home'
  },
  aiAdvisor: {
    ar: 'المستشار الذكي', en: 'AI Advisor', fr: 'Conseiller IA', es: 'Asesor IA', tr: 'Yapay Zeka Danışmanı', ur: 'آئی اے مشیر',
    ja: 'AI Advisor', zh: 'AI Advisor', ru: 'AI Advisor', pt: 'AI Advisor'
  },
  imageGenerator: {
    ar: 'مولد الصور', en: 'Image Generator', fr: 'Générateur d\'images', es: 'Generador de imágenes', tr: 'Resim Oluşturucu', ur: 'تصوير بنانے والا',
    ja: 'Image Generator', zh: 'Image Generator', ru: 'Image Generator', pt: 'Image Generator'
  },
  aiAdvisorTitle: {
    ar: 'المستشار المالي الذكي', en: 'AI Financial Advisor', fr: 'Conseiller Financier IA', es: 'Asesor Financiero IA', tr: 'Yapay Zeka Finansal Danışman', ur: 'آئی اے مالیاتی مشیر',
    ja: 'AI Financial Advisor', zh: 'AI Financial Advisor', ru: 'AI Financial Advisor', pt: 'AI Financial Advisor'
  },
  aiAdvisorSubtitle: {
    ar: 'اطرح أسئلة حول أموالك، الميزانيات العمومية، أو قوائم الدخل.',
    en: 'Ask questions about your finances, balance sheets, or income statements.',
    fr: 'Posez des questions sur vos finances, bilans ou comptes de résultat.',
    es: 'Haga preguntas sobre sus finanzas, balances o estados de resultados.',
    tr: 'Finansmanınız, bilançolarınız veya gelir tablolarınız hakkında sorular sorun.',
    ur: 'اپنے مالیات، بیلنس شیٹس، یا آمدنی کے گوشواروں کے بارے میں سوالات پوچھیں۔',
    ja: 'Ask questions about your finances, balance sheets, or income statements.',
    zh: 'Ask questions about your finances, balance sheets, or income statements.',
    ru: 'Ask questions about your finances, balance sheets, or income statements.',
    pt: 'Ask questions about your finances, balance sheets, or income statements.'
  },
  aiAdvisorWelcome: {
    ar: 'مرحباً! أنا مستشارك المالي الذكي. كيف يمكنني مساعدتك اليوم؟',
    en: 'Hello! I am your AI Financial Advisor. How can I help you today?',
    fr: 'Bonjour! Je suis votre conseiller financier IA. Comment puis-je vous aider aujourd\'hui?',
    es: '¡Hola! Soy su asesor financiero de IA. ¿Cómo puedo ayudarle hoy?',
    tr: 'Merhaba! Ben Yapay Zeka Finansal Danışmanınız. Bugün size nasıl yardımcı olabilirim?',
    ur: 'ہیلو! میں آپ کا آئی اے مالیاتی مشیر ہوں۔ آج میں آپ کی کیسے مدد کر سکتا ہوں؟',
    ja: 'Hello! I am your AI Financial Advisor. How can I help you today?',
    zh: 'Hello! I am your AI Financial Advisor. How can I help you today?',
    ru: 'Hello! I am your AI Financial Advisor. How can I help you today?',
    pt: 'Hello! I am your AI Financial Advisor. How can I help you today?'
  },
  imageGeneratorTitle: {
    ar: 'مولد الصور المالية', en: 'Financial Image Generator', fr: 'Générateur d\'Images Financières', es: 'Generador de Imágenes Financieras', tr: 'Finansal Resim Oluşturucu', ur: 'مالیاتی تصویر بنانے والا',
    ja: 'Financial Image Generator', zh: 'Financial Image Generator', ru: 'Financial Image Generator', pt: 'Financial Image Generator'
  },
  imageGeneratorSubtitle: {
    ar: 'قم بإنشاء رسوم بيانية، رسوم توضيحية، أو رسومات مالية باستخدام الذكاء الاصطناعي Gemini.',
    en: 'Generate charts, illustrations, or financial graphics using Gemini AI.',
    fr: 'Générez des graphiques, des illustrations ou des visuels financiers à l\'aide de Gemini IA.',
    es: 'Genere gráficos, ilustraciones o imágenes financieras usando Gemini IA.',
    tr: 'Gemini AI kullanarak grafikler, çizimler veya finansal görseller oluşturun.',
    ur: 'Gemini AI کا استعمال کرتے ہوئے چارٹ، عکاسی، یا مالیاتی گرافکس بنائیں۔',
    ja: 'Generate charts, illustrations, or financial graphics using Gemini AI.',
    zh: 'Generate charts, illustrations, or financial graphics using Gemini AI.',
    ru: 'Generate charts, illustrations, or financial graphics using Gemini AI.',
    pt: 'Generate charts, illustrations, or financial graphics using Gemini AI.'
  },
  apiKeyLabel: {
    ar: 'مفتاح Gemini API (السرّي)', en: 'Gemini API Key (Secret)', fr: 'Clé API Gemini (Secrète)', es: 'Clave API Gemini (Secreta)', tr: 'Gemini API Anahtarı (Gizli)', ur: 'جیمنی API کی (خفیہ)',
    ja: 'Gemini API Key (Secret)', zh: 'Gemini API Key (Secret)', ru: 'Gemini API Key (Secret)', pt: 'Gemini API Key (Secret)'
  },
  apiKeyPlaceholder: {
    ar: 'أدخل مفتاح Gemini API هنا...', en: 'Enter your Gemini API key here...', fr: 'Entrez votre clé API Gemini ici...', es: 'Ingrese su clave API Gemini aquí...', tr: 'Gemini API anahtarınızı buraya girin...', ur: 'اپنا جیمنی API کی یہاں درج کریں...',
    ja: 'Enter your Gemini API key here...', zh: 'Enter your Gemini API key here...', ru: 'Enter your Gemini API key here...', pt: 'Enter your Gemini API key here...'
  },
  getApiKeyLink: {
    ar: 'احصل على مفتاح مجاني من Google AI Studio ↗',
    en: 'Get a free API key from Google AI Studio ↗',
    fr: 'Obtenez une clé API gratuite de Google AI Studio ↗',
    es: 'Obtenga una clave API gratuita de Google AI Studio ↗',
    tr: 'Google AI Studio\'dan ücretsiz bir API anahtarı alın ↗',
    ur: 'Google AI Studio سے مفت API کی حاصل کریں ↗',
    ja: 'Get a free API key from Google AI Studio ↗',
    zh: 'Get a free API key from Google AI Studio ↗',
    ru: 'Get a free API key from Google AI Studio ↗',
    pt: 'Get a free API key from Google AI Studio ↗'
  },
  settingsTitle: {
    ar: 'إعدادات الذكاء الاصطناعي', en: 'AI Settings', fr: 'Paramètres IA', es: 'Ajustes de IA', tr: 'Yapay Zeka Ayarları', ur: 'آئی اے کی ترتیبات',
    ja: 'AI Settings', zh: 'AI Settings', ru: 'AI Settings', pt: 'AI Settings'
  },
  saveSettings: {
    ar: 'حفظ الإعدادات', en: 'Save Settings', fr: 'Enregistrer', es: 'Guardar Ajustes', tr: 'Ayarları Kaydet', ur: 'ترتیبات محفوظ کریں',
    ja: 'Save Settings', zh: 'Save Settings', ru: 'Save Settings', pt: 'Save Settings'
  },
  apiKeySaved: {
    ar: 'تم حفظ مفتاح Gemini API بنجاح!', en: 'Gemini API Key saved successfully!', fr: 'Clé API Gemini enregistrée !', es: '¡Clave API Gemini guardada con éxito!', tr: 'Gemini API Anahtarı başarıyla kaydedildi!', ur: 'جیمنی API کی کامیابی سے محفوظ ہو گیا!',
    ja: 'Gemini API Key saved successfully!', zh: 'Gemini API Key saved successfully!', ru: 'Gemini API Key saved successfully!', pt: 'Gemini API Key saved successfully!'
  },
  apiKeyRequired: {
    ar: 'يرجى تهيئة مفتاح Gemini API في إعدادات الذكاء الاصطناعي (أيقونة الترس في الأعلى) أولاً.',
    en: 'Please configure your Gemini API Key in the AI Settings (gear icon at the top) first.',
    fr: 'Veuillez d\'abord configurer votre clé API Gemini dans les paramètres (icône d\'engrenage).',
    es: 'Configure primero su clave API Gemini en los Ajustes de IA (icono de engranaje).',
    tr: 'Lütfen önce Yapay Zeka Ayarlarında (üstteki dişli simgesi) Gemini API Anahtarınızı yapılandırın.',
    ur: 'براہ کرم پہلے آئی اے کی ترتیبات (اوپر گیئر آئیکن) میں اپنا جیمنی API کی ترتیب دیں۔',
    ja: 'Please configure your Gemini API Key in the AI Settings (gear icon at the top) first.',
    zh: 'Please configure your Gemini API Key in the AI Settings (gear icon at the top) first.',
    ru: 'Please configure your Gemini API Key in the AI Settings (gear icon at the top) first.',
    pt: 'Please configure your Gemini API Key in the AI Settings (gear icon at the top) first.'
  },
  promptPlaceholder: {
    ar: 'مثال: رسم بياني ثلاثي الأبعاد يعبر عن نمو مبيعات قوي، ألوان نيون، خلفية داكنة...',
    en: 'e.g. A futuristic 3D bar chart showing exponential growth, neon colors, dark background...',
    fr: 'ex. Un graphique 3D futuriste montrant une croissance exponentielle, couleurs néon...',
    es: 'ej. Un gráfico de barras 3D futurista que muestra un crecimiento exponencial, colores de neón...',
    tr: 'ör. Üstel büyümeyi gösteren fütüristik bir 3D çubuk grafik, neon renkler, karanlık arka plan...',
    ur: 'مثال: ایک مستقبل کا 3D بار چارٹ جو تیز رفتار ترقی کو ظاہر کرتا ہے، نیون رنگ، گہرا پس منظر...',
    ja: 'e.g. A futuristic 3D bar chart showing exponential growth, neon colors, dark background...',
    zh: 'e.g. A futuristic 3D bar chart showing exponential growth, neon colors, dark background...',
    ru: 'e.g. A futuristic 3D bar chart showing exponential growth, neon colors, dark background...',
    pt: 'e.g. A futuristic 3D bar chart showing exponential growth, neon colors, dark background...'
  },
  aspectRatio: {
    ar: 'نسبة العرض إلى الارتفاع', en: 'Aspect Ratio', fr: 'Ratio d\'aspect', es: 'Relación de aspecto', tr: 'En Boy Oranı', ur: 'پہلو کا تناسب',
    ja: 'Aspect Ratio', zh: 'Aspect Ratio', ru: 'Aspect Ratio', pt: 'Aspect Ratio'
  },
  generateImage: {
    ar: 'إنشاء صورة', en: 'Generate Image', fr: 'Générer l\'Image', es: 'Generar Imagen', tr: 'Resim Oluştur', ur: 'تصویر بنائیں',
    ja: 'Generate Image', zh: 'Generate Image', ru: 'Generate Image', pt: 'Generate Image'
  },
  generating: {
    ar: 'جاري الإنشاء...', en: 'Generating...', fr: 'Génération en cours...', es: 'Generando...', tr: 'Oluşturuluyor...', ur: 'بن رہا ہے...',
    ja: 'Generating...', zh: 'Generating...', ru: 'Generating...', pt: 'Generating...'
  },
  download: {
    ar: 'تحميل', en: 'Download', fr: 'Télécharger', es: 'Descargar', tr: 'İndir', ur: 'ڈاؤن لوڈ',
    ja: 'Download', zh: 'Download', ru: 'Download', pt: 'Download'
  },
  attachReports: {
    ar: 'إرفاق التقارير المالية كـ سياق', en: 'Attach Financial Context', fr: 'Joindre Contexte Financier', es: 'Adjuntar Contexto Financiero', tr: 'Finansal Bağlam Ekle', ur: 'مالیاتی سیاق منسلک کریں',
    ja: 'Attach Financial Context', zh: 'Attach Financial Context', ru: 'Attach Financial Context', pt: 'Attach Financial Context'
  },
  attachAndSend: {
    ar: 'إرفاق وإرسال', en: 'Attach & Send', fr: 'Joindre & Envoyer', es: 'Adjuntar y Enviar', tr: 'Ekle ve Gönder', ur: 'منسلک کریں اور بھیجیں',
    ja: 'Attach & Send', zh: 'Attach & Send', ru: 'Attach & Send', pt: 'Attach & Send'
  },
  sendWithoutReports: {
    ar: 'إرسال بدون تقارير', en: 'Send without reports', fr: 'Envoyer sans rapports', es: 'Enviar sin informes', tr: 'Raporlar olmadan gönder', ur: 'رپورٹس کے بغیر بھیجیں',
    ja: 'Send without reports', zh: 'Send without reports', ru: 'Send without reports', pt: 'Send without reports'
  },
  suggestReportsMessage: {
    ar: 'لقد لاحظت أنك تسأل عن أرقامك المالية. هل ترغب في إرفاق التقارير الحالية (الميزانية وقائمة الدخل) لتمكين المستشار من تقديم إجابة دقيقة بناءً عليها؟',
    en: 'I noticed you\'re asking about your financial details. Would you like to attach the current reports to help the advisor analyze them directly?',
    fr: 'J\'ai remarqué que vous posiez des questions sur vos finances. Souhaitez-vous joindre les rapports actuels pour analyse ?',
    es: 'Noté que pregunta sobre sus finanzas. ¿Desea adjuntar los informes actuales para que el asesor los analice ?',
    tr: 'Finansal detaylarınız hakkında soru sorduğunuzu fark ettim. Danışmanın doğrudan analiz etmesi için güncel raporları eklemek ister misiniz?',
    ur: 'میں نے دیکھا کہ آپ اپنے مالیاتی تفصیلات کے بارے میں پوچھ رہے ہیں۔ کیا آپ مشیر کو براہ راست تجزیہ کرنے میں مدد کے لیے موجودہ رپورٹس منسلک کرنا چاہیں گے؟',
    ja: 'I noticed you\'re asking about your financial details. Would you like to attach the current reports to help the advisor analyze them directly?',
    zh: 'I noticed you\'re asking about your financial details. Would you like to attach the current reports to help the advisor analyze them directly?',
    ru: 'I noticed you\'re asking about your financial details. Would you like to attach the current reports to help the advisor analyze them directly?',
    pt: 'I noticed you\'re asking about your financial details. Would you like to attach the current reports to help the advisor analyze them directly?'
  },
  chatInputPlaceholder: {
    ar: 'اطرح سؤالاً مالياً أو ارفع صورة فاتورة...', en: 'Ask a financial question or upload a receipt...', fr: 'Posez une question ou joignez un reçu...', es: 'Pregunte o adjunte un recibo...', tr: 'Finansal bir soru sorun veya fiş ekleyin...', ur: 'مالیاتی سوال پوچھیں یا رسید اپ لوڈ کریں...',
    ja: 'Ask a financial question or upload a receipt...', zh: 'Ask a financial question or upload a receipt...', ru: 'Ask a financial question or upload a receipt...', pt: 'Ask a financial question or upload a receipt...'
  },
  prompt: {
    ar: 'الوصف أو الموجه (Prompt)', en: 'Prompt', fr: 'Prompt', es: 'Prompt', tr: 'Prompt', ur: 'پرمپٹ',
    ja: 'Prompt', zh: 'Prompt', ru: 'Prompt', pt: 'Prompt'
  },
  generatedImage: {
    ar: 'الصورة الناتجة', en: 'Generated Image', fr: 'Image Générée', es: 'Imagen Generada', tr: 'Oluşturulan Resim', ur: 'پیدا کردہ تصویر',
    ja: 'Generated Image', zh: 'Generated Image', ru: 'Generated Image', pt: 'Generated Image'
  },
  noImage: {
    ar: 'ستظهر الصورة المولدة هنا بعد الكتابة والنقر على إنشاء.',
    en: 'The generated image will appear here after you input a prompt and click generate.',
    fr: 'L\'image générée apparaîtra ici.',
    es: 'La imagen generada aparecerá aquí.',
    tr: 'Oluşturulan resim burada görünecektir.',
    ur: 'پیدا کردہ تصویر یہاں ظاہر ہوگی۔',
    ja: 'The generated image will appear here after you input a prompt and click generate.',
    zh: 'The generated image will appear here after you input a prompt and click generate.',
    ru: 'The generated image will appear here after you input a prompt and click generate.',
    pt: 'The generated image will appear here after you input a prompt and click generate.'
  },
  errorGenerate: {
    ar: 'فشل في إنشاء الصورة. يرجى تجربة وصف آخر أو التحقق من مفتاح الـ API.',
    en: 'Failed to generate image. Please try another prompt or check your API key.',
    fr: 'Échec de la génération.',
    es: 'Fallo al generar imagen.',
    tr: 'Resim oluşturulamadı.',
    ur: 'تصویر بنانے میں ناکام۔',
    ja: 'Failed to generate image. Please try another prompt or check your API key.',
    zh: 'Failed to generate image. Please try another prompt or check your API key.',
    ru: 'Failed to generate image. Please try another prompt or check your API key.',
    pt: 'Failed to generate image. Please try another prompt or check your API key.'
  },
  newChat: {
    ar: 'محادثة جديدة', en: 'New Chat', fr: 'Nouvelle Discussion', es: 'Nueva Conversación', tr: 'Yeni Sohbet', ur: 'نئی بات چیت',
    ja: 'New Chat', zh: 'New Chat', ru: 'New Chat', pt: 'New Chat'
  },
  send: {
    ar: 'إرسال', en: 'Send', fr: 'Envoyer', es: 'Enviar', tr: 'Gönder', ur: 'بھیجیں',
    ja: 'Send', zh: 'Send', ru: 'Send', pt: 'Send'
  },
  quickActions: {
    ar: 'إجراءات سريعة', en: 'Quick Actions', fr: 'Actions Rapides', es: 'Acciones Rápidas', tr: 'Hızlı İşlemler', ur: 'فوری کارروائیاں',
    ja: 'Quick Actions', zh: 'Quick Actions', ru: 'Quick Actions', pt: 'Quick Actions'
  },
  scanPDF: {
    ar: 'مسح PDF', en: 'Scan PDF', fr: 'Scanner PDF', es: 'Escanear PDF', tr: 'PDF Tara', ur: 'پی ڈی ایف اسکین کریں',
    ja: 'Scan PDF', zh: 'Scan PDF', ru: 'Scan PDF', pt: 'Scan PDF'
  },
  backups: {
    ar: 'النسخ الاحتياطي', en: 'Backups', fr: 'Sauvegardes', es: 'Copias de Seguridad', tr: 'Yedeklemeler', ur: 'بیک اپس',
    ja: 'Backups', zh: 'Backups', ru: 'Backups', pt: 'Backups'
  },
  appearance: {
    ar: 'المظهر', en: 'Appearance', fr: 'Apparence', es: 'Apariencia', tr: 'Görünüm', ur: 'ظاہری شکل',
    ja: 'Appearance', zh: 'Appearance', ru: 'Appearance', pt: 'Appearance'
  },
  lightMode: {
    ar: 'الوضع الفاتح', en: 'Light Mode', fr: 'Mode Clair', es: 'Modo Claro', tr: 'Açık Mod', ur: 'لائٹ موڈ',
    ja: 'Light Mode', zh: 'Light Mode', ru: 'Light Mode', pt: 'Light Mode'
  },
  darkMode: {
    ar: 'الوضع الداكن', en: 'Dark Mode', fr: 'Mode Sombre', es: 'Modo Oscuro', tr: 'Karanlık Mod', ur: 'ڈارک موڈ',
    ja: 'Dark Mode', zh: 'Dark Mode', ru: 'Dark Mode', pt: 'Dark Mode'
  },
  errorOccurred: {
    ar: 'حدث خطأ أثناء الاتصال. يرجى التأكد من صحة مفتاح Gemini API الخاص بك وأنه يملك صلاحيات كافية.',
    en: 'An error occurred during connection. Please ensure your Gemini API key is correct and has sufficient permissions.',
    fr: 'Une erreur s\'est produite. Veuillez vérifier votre clé API Gemini.',
    es: 'Se produjo un error. Verifique su clave API de Gemini.',
    tr: 'Bir hata oluştu. Lütfen Gemini API anahtarınızı kontrol edin.',
    ur: 'ایک خرابی پیش آگئی۔ براہ کرم اپنی جیمنی API کی کو چیک کریں۔',
    ja: 'エラーが発生しました。Gemini APIキーを確認してください。',
    zh: '发生错误。请检查您的Gemini API密钥。',
    ru: 'Произошла ошибка. Пожалуйста, проверьте ваш ключ API Gemini.',
    pt: 'Ocorreu um erro. Verifique sua chave da API Gemini.'
  },
  errorGenerate: {
    ar: 'حدث خطأ أثناء إنشاء الصورة. يرجى المحاولة مرة أخرى.',
    en: 'An error occurred while generating the image. Please try again.',
    fr: 'Une erreur s\'est produite lors de la génération de l\'image.',
    es: 'Se produjo un error al generar la imagen.',
    tr: 'Görüntü oluşturulurken bir hata oluştu.',
    ur: 'تصویر بنانے کے دوران ایک خرابی پیش آگئی۔',
    ja: '画像の生成中にエラーが発生しました。',
    zh: '生成图像时发生错误。',
    ru: 'Произошла ошибка при создании изображения.',
    pt: 'Ocorreu um erro ao gerar a imagem.'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    const isRtl = language === 'ar' || language === 'ur';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language] || translations[key]['en'];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: (language === 'ar' || language === 'ur') ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
