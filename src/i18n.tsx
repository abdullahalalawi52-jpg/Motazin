import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Language = 'ar' | 'en' | 'fr' | 'es' | 'tr' | 'ur';

interface Translations {
  [key: string]: {
    ar: string;
    en: string;
    fr: string;
    es: string;
    tr: string;
    ur: string;
  };
}

export const translations: Translations = {
  appTitle: { 
    ar: 'مُتّزِن', en: 'Motazin', fr: 'Motazin', es: 'Motazin', tr: 'Motazin', ur: 'متوازن' 
  },
  appSubtitle: { 
    ar: 'الأصول = الخصوم + حقوق الملكية', 
    en: 'Assets = Liabilities + Equity',
    fr: 'Actif = Passif + Capitaux Propres',
    es: 'Activo = Pasivo + Patrimonio Neto',
    tr: 'Varlıklar = Yükümlülükler + Özkaynak',
    ur: 'اثاثے = واجبات + ایکویٹی'
  },
  loginGoogle: { 
    ar: 'تسجيل الدخول باستخدام Google', en: 'Sign in with Google', fr: 'Se connecter avec Google', es: 'Iniciar sesión con Google', tr: 'Google ile Giriş Yap', ur: 'Google کے ساتھ سائن ان کریں' 
  },
  logout: { 
    ar: 'تسجيل الخروج', en: 'Logout', fr: 'Déconnexion', es: 'Cerrar sesión', tr: 'Çıkış Yap', ur: 'لاگ آؤٹ' 
  },
  exportCSV: { 
    ar: 'تصدير CSV', en: 'Export CSV', fr: 'Exporter CSV', es: 'Exportar CSV', tr: 'CSV Dışa Aktar', ur: 'CSV ایکسپورٹ کریں' 
  },
  exportPDF: { 
    ar: 'تصدير PDF', en: 'Export PDF', fr: 'Exporter PDF', es: 'Exportar PDF', tr: 'PDF Dışa Aktar', ur: 'PDF ایکسپورٹ کریں' 
  },
  clearAll: { 
    ar: 'مسح الكل', en: 'Clear All', fr: 'Tout Effacer', es: 'Limpiar Todo', tr: 'Tümünü Temizle', ur: 'تمام صاف کریں' 
  },
  assetDistribution: { 
    ar: 'توزيع الأصول', en: 'Asset Distribution', fr: 'Distribution des Actifs', es: 'Distribución de Activos', tr: 'Varlık Dağılımı', ur: 'اثاثوں کی تقسیم' 
  },
  noAssets: { 
    ar: 'لا توجد أصول لعرضها', en: 'No assets to display', fr: 'Aucun actif à afficher', es: 'No hay activos para mostrar', tr: 'Gösterilecek varlık yok', ur: 'دکھانے کے لیے کوئی اثاثہ نہیں ہے' 
  },
  incomeExpenses: { 
    ar: 'الإيرادات والمصروفات', en: 'Income & Expenses', fr: 'Revenus et Dépenses', es: 'Ingresos y Gastos', tr: 'Gelir ve Giderler', ur: 'آمدنی اور اخراجات' 
  },
  noIncomeExpenses: { 
    ar: 'لا توجد إيرادات أو مصروفات لعرضها', en: 'No income or expenses to display', fr: 'Aucun revenu ou dépense à afficher', es: 'No hay ingresos o gastos para mostrar', tr: 'Gösterilecek gelir veya gider yok', ur: 'دکھانے کے لیے کوئی آمدنی یا اخراجات نہیں ہیں' 
  },
  addNewTransaction: { 
    ar: 'إضافة عملية جديدة', en: 'Add New Transaction', fr: 'Ajouter une Transaction', es: 'Agregar Nueva Transacción', tr: 'Yeni İşlem Ekle', ur: 'نئی ٹرانزیکشن شامل کریں' 
  },
  editTransaction: { 
    ar: 'تعديل العملية', en: 'Edit Transaction', fr: 'Modifier la Transaction', es: 'Editar Transacción', tr: 'İşlemi Düzenle', ur: 'ٹرانزیکشن میں ترمیم کریں' 
  },
  date: { 
    ar: 'التاريخ', en: 'Date', fr: 'Date', es: 'Fecha', tr: 'Tarih', ur: 'تاریخ' 
  },
  description: { 
    ar: 'البيان', en: 'Description', fr: 'Description', es: 'Descripción', tr: 'Açıklama', ur: 'تفصیل' 
  },
  impactOnAccounts: { 
    ar: 'التأثير على الحسابات', en: 'Impact on Accounts', fr: 'Impact sur les Comptes', es: 'Impacto en Cuentas', tr: 'Hesaplar Üzerindeki Etki', ur: 'اکاؤنٹس پر اثر' 
  },
  addAccount: { 
    ar: 'إضافة حساب', en: 'Add Account', fr: 'Ajouter un Compte', es: 'Agregar Cuenta', tr: 'Hesap Ekle', ur: 'اکاؤنٹ شامل کریں' 
  },
  recurringTransaction: { 
    ar: 'عملية متكررة', en: 'Recurring Transaction', fr: 'Transaction Récurrente', es: 'Transacción Recurrente', tr: 'Tekrarlayan İşlem', ur: 'بار بار ہونے والی ٹرانزیکشن' 
  },
  repeatsEvery: { 
    ar: 'تتكرر كل:', en: 'Repeats every:', fr: 'Se répète tous les:', es: 'Se repite cada:', tr: 'Tekrarlanma:', ur: 'ہر بار دہراتا ہے:' 
  },
  daily: { 
    ar: 'يوميا', en: 'Daily', fr: 'Quotidien', es: 'Diario', tr: 'Günlük', ur: 'روزانہ' 
  },
  weekly: { 
    ar: 'أسبوعيا', en: 'Weekly', fr: 'Hebdomadaire', es: 'Semanal', tr: 'Haftalık', ur: 'ہفتہ وار' 
  },
  monthly: { 
    ar: 'شهريا', en: 'Monthly', fr: 'Mensuel', es: 'Mensual', tr: 'Aylık', ur: 'ماہانہ' 
  },
  yearly: { 
    ar: 'سنويا', en: 'Yearly', fr: 'Annuel', es: 'Anual', tr: 'Yıllık', ur: 'سالانہ' 
  },
  cancel: { 
    ar: 'إلغاء', en: 'Cancel', fr: 'Annuler', es: 'Cancelar', tr: 'İptal', ur: 'منسوخ کریں' 
  },
  saveChanges: { 
    ar: 'حفظ التعديلات', en: 'Save Changes', fr: 'Enregistrer', es: 'Guardar Cambios', tr: 'Değişiklikleri Kaydet', ur: 'تبدیلیاں محفوظ کریں' 
  },
  addTransaction: { 
    ar: 'إضافة العملية', en: 'Add Transaction', fr: 'Ajouter', es: 'Agregar Transacción', tr: 'İşlem Ekle', ur: 'ٹرانزیکشن شامل کریں' 
  },
  transactionHistory: { 
    ar: 'سجل العمليات (معادلة الميزانية)', en: 'Transaction History', fr: 'Historique', es: 'Historial', tr: 'İşlem Geçmişi', ur: 'ٹرانزیکشن کی تاریخ' 
  },
  deleteSelected: { 
    ar: 'حذف المحدد', en: 'Delete Selected', fr: 'Supprimer la Sélection', es: 'Eliminar Seleccionados', tr: 'Seçilenleri Sil', ur: 'منتخب کردہ کو حذف کریں' 
  },
  assets: { 
    ar: 'الأصول', en: 'Assets', fr: 'Actifs', es: 'Activos', tr: 'Varlıklar', ur: 'اثاثے' 
  },
  liabilities: { 
    ar: 'الخصوم', en: 'Liabilities', fr: 'Passifs', es: 'Pasivos', tr: 'Yükümlülükler', ur: 'واجبات' 
  },
  equity: { 
    ar: 'حقوق الملكية', en: 'Equity', fr: 'Capitaux Propres', es: 'Patrimonio Neto', tr: 'Özkaynak', ur: 'ایکویٹی' 
  },
  grandTotal: { 
    ar: 'الإجمالي النهائي:', en: 'Grand Total:', fr: 'Total Général:', es: 'Gran Total:', tr: 'Genel Toplam:', ur: 'کل مجموعہ:' 
  },
  balanced: { 
    ar: 'الميزانية متوازنة', en: 'Balance Sheet is Balanced', fr: 'Bilan Équilibré', es: 'Balance Equilibrado', tr: 'Bilanço Dengeli', ur: 'بیلنس شیٹ متوازن ہے' 
  },
  unbalanced: { 
    ar: 'الميزانية غير متوازنة', en: 'Balance Sheet is Unbalanced', fr: 'Bilan Non Équilibré', es: 'Balance No Equilibrado', tr: 'Bilanço Dengesiz', ur: 'بیلنس شیٹ غیر متوازن ہے' 
  },
  difference: { 
    ar: 'الفرق:', en: 'Difference:', fr: 'Différence:', es: 'Diferencia:', tr: 'Fark:', ur: 'فرق:' 
  },
  bank: { 
    ar: 'البنك', en: 'Bank', fr: 'Banque', es: 'Banco', tr: 'Banka', ur: 'بینک' 
  },
  cash: { 
    ar: 'الصندوق (النقدية)', en: 'Cash', fr: 'Caisse', es: 'Efectivo', tr: 'Kasa', ur: 'نقد' 
  },
  cars: { 
    ar: 'السيارات', en: 'Cars', fr: 'Voitures', es: 'Vehículos', tr: 'Arabalar', ur: 'گاڑیاں' 
  },
  furniture: { 
    ar: 'الأثاث', en: 'Furniture', fr: 'Meubles', es: 'Muebles', tr: 'Mobilya', ur: 'فرنیچر' 
  },
  ar: { 
    ar: 'الذمم المدينة (العملاء)', en: 'Accounts Receivable', fr: 'Créances Clients', es: 'Cuentas a Cobrar', tr: 'Alacak Hesapları', ur: 'وصول طلب اکاؤنٹس' 
  },
  ap: { 
    ar: 'الذمم الدائنة (الموردون)', en: 'Accounts Payable', fr: 'Dettes Fournisseurs', es: 'Cuentas a Pagar', tr: 'Borç Hesapları', ur: 'قابل ادائیگی اکاؤنٹس' 
  },
  current_assets: { 
    ar: 'الأصول المتداولة', en: 'Current Assets', fr: 'Actifs Courants', es: 'Activos Corrientes', tr: 'Dönen Varlıklar', ur: 'موجودہ اثاثے' 
  },
  fixed_assets: { 
    ar: 'الأصول الثابتة', en: 'Fixed Assets', fr: 'Actifs Immobilisés', es: 'Activos Fijos', tr: 'Duran Varlıklar', ur: 'مستقل اثاثے' 
  },
  inventory: { 
    ar: 'المخزون', en: 'Inventory', fr: 'Stocks', es: 'Inventario', tr: 'Stok', ur: 'انوینٹری' 
  },
  short_term_loans: { 
    ar: 'قروض قصيرة الأجل', en: 'Short-term Loans', fr: 'Prêts à Court Terme', es: 'Préstamos a Corto Plazo', tr: 'Kısa Vadeli Krediler', ur: 'لیل مدتی قرضے' 
  },
  long_term_loans: { 
    ar: 'قروض طويلة الأجل', en: 'Long-term Loans', fr: 'Prêts à Long Terme', es: 'Préstamos a Largo Plazo', tr: 'Uzun Vadeli Krediler', ur: 'طویل مدتی قرضے' 
  },
  land: { 
    ar: 'الأراضي', en: 'Land', fr: 'Terrain', es: 'Terrenos', tr: 'Arazi', ur: 'زمین' 
  },
  buildings: { 
    ar: 'المباني', en: 'Buildings', fr: 'Bâtiments', es: 'Edificios', tr: 'Binalar', ur: 'عمارتیں' 
  },
  equipment: { 
    ar: 'المعدات والآلات', en: 'Equipment', fr: 'Équipement', es: 'Equipo', tr: 'Ekipman', ur: 'آلات' 
  },
  supplies: { 
    ar: 'المهمات / الأدوات', en: 'Supplies', fr: 'Fournitures', es: 'Suministros', tr: 'Malzemeler', ur: 'سامان' 
  },
  prepaid_expenses: { 
    ar: 'مصروفات مدفوعة مقدماً', en: 'Prepaid Expenses', fr: 'Charges Constatées d\'Avance', es: 'Gastos Pagados por Adelantado', tr: 'Önceden Ödenmiş Giderler', ur: 'پیشگی ادا شدہ اخراجات' 
  },
  intangible_assets: { 
    ar: 'أصول غير ملموسة', en: 'Intangible Assets', fr: 'Actifs Incorporels', es: 'Activos Intangibles', tr: 'Maddi Olmayan Varlıklar', ur: 'غیر مادی اثاثے' 
  },
  investments: { 
    ar: 'استثمارات', en: 'Investments', fr: 'Investissements', es: 'Inversiones', tr: 'Yatırımlar', ur: 'سرمایہ کاری' 
  },
  accrued_expenses: { 
    ar: 'مصروفات مستحقة', en: 'Accrued Expenses', fr: 'Charges à Payer', es: 'Gastos Acumulados', tr: 'Tahakkuk Eden Giderler', ur: 'واجب الادا اخراجات' 
  },
  unearned_revenues: { 
    ar: 'إيرادات غير مكتسبة (مقدمة)', en: 'Unearned Revenues', fr: 'Produits Constatés d\'Avance', es: 'Ingresos no Devengados', tr: 'Kazanılmamış Gelirler', ur: 'غیر کمائی گئی آمدنی' 
  },
  mortgages_payable: { 
    ar: 'قروض برهن عقاري', en: 'Mortgages Payable', fr: 'Hypothèques à Payer', es: 'Hipotecas por Pagar', tr: 'İpoteğe Dayalı Krediler', ur: 'رہن کے واجبات' 
  },
  drawings: { 
    ar: 'المسحوبات الشخصية', en: 'Drawings', fr: 'Prélèvements', es: 'Retiros', tr: 'Şahsi Çekimler', ur: 'ذاتی نکاسی' 
  },
  retained_earnings: { 
    ar: 'أرباح محتجزة', en: 'Retained Earnings', fr: 'Bénéfices Non Distribués', es: 'Ganancias Retenidas', tr: 'Geçmiş Yıl Karları', ur: 'برقرار رکھی گئی آمدنی' 
  },
  capital: { 
    ar: 'رأس المال', en: 'Capital', fr: 'Capital', es: 'Capital', tr: 'Sermaye', ur: 'سرمایہ' 
  },
  revenue: { 
    ar: 'الإيرادات', en: 'Revenue', fr: 'Revenus', es: 'Ingresos', tr: 'Gelir', ur: 'آمدنی' 
  },
  expenses: { 
    ar: 'المصروفات', en: 'Expenses', fr: 'Dépenses', es: 'Gastos', tr: 'Giderler', ur: 'اخراجات' 
  },
  exampleDate: { 
    ar: 'مثال: 1/1', en: 'e.g. 1/1', fr: 'ex. 01/01', es: 'ej. 01/01', tr: 'ör. 01/01', ur: 'مثال: 1/1' 
  },
  exampleDesc: { 
    ar: 'مثال: شراء أثاث نقداً', en: 'e.g. Bought furniture with cash', fr: 'ex. Achat de meubles au comptant', es: 'ej. Compra de muebles al contado', tr: 'ör. Nakit mobilya alımı', ur: 'مثال: نقد فرنیچر خریدا' 
  },
  amount: { 
    ar: 'المبلغ', en: 'Amount', fr: 'Montant', es: 'Monto', tr: 'Tutar', ur: 'رقم' 
  },
  confirmDelete: { 
    ar: 'هل أنت متأكد من حذف هذه العملية؟', en: 'Are you sure you want to delete this transaction?', fr: 'Supprimer?', es: '¿Eliminar?', tr: 'Silinsin mi?', ur: 'کیا آپ حذف کرنا چاہتے ہیں؟' 
  },
  confirmDeleteMultiple: { 
    ar: 'هل أنت متأكد من حذف العمليات المحددة؟', en: 'Are you sure you want to delete selected transactions?', fr: 'Supprimer la sélection?', es: '¿Eliminar seleccionados?', tr: 'Seçilenler silinsin mi?', ur: 'کیا آپ منتخب کردہ کو حذف کرنا چاہتے ہیں؟' 
  },
  confirmClearAll: { 
    ar: 'هل أنت متأكد من مسح جميع العمليات؟', en: 'Are you sure you want to clear all transactions?', fr: 'Tout effacer?', es: '¿Limpiar todo?', tr: 'Tümünü temizle?', ur: 'کیا آپ تمام صاف کرنا چاہتے ہیں؟' 
  },
  errorSaving: { 
    ar: 'حدث خطأ أثناء حفظ العمليات', en: 'Error saving transactions', fr: 'Erreur', es: 'Error', tr: 'Hata', ur: 'خرابی' 
  },
  enterValidAmount: { 
    ar: 'الرجاء إدخال مبالغ صحيحة', en: 'Please enter valid amounts', fr: 'Montant invalide', es: 'Monto inválido', tr: 'Geçersiz tutar', ur: 'درست رقم درج کریں' 
  },
  enterDescription: { 
    ar: 'الرجاء إدخال وصف للعملية', en: 'Please enter a description', fr: 'Entrez une description', es: 'Ingrese descripción', tr: 'Açıklama girin', ur: 'تفصیل درج کریں' 
  },
  successRecurring: { 
    ar: 'تم إنشاء عمليات متكررة تلقائياً', en: 'Recurring transactions created automatically', fr: 'Transactions récurrentes créées', es: 'Transacciones recurrentes creadas', tr: 'Tekrarlayan işlemler oluşturuldu', ur: 'بار بار ہونے والی ٹرانزیکشنز بنائی گئیں' 
  },
  language: { 
    ar: 'اللغة', en: 'Language', fr: 'Langue', es: 'Idioma', tr: 'Dil', ur: 'زبان' 
  },
  asset: { 
    ar: 'الأصول', en: 'Assets', fr: 'Actifs', es: 'Activos', tr: 'Varlıklar', ur: 'اثاثے' 
  },
  liability: { 
    ar: 'الخصوم', en: 'Liabilities', fr: 'Passifs', es: 'Pasivos', tr: 'Yükümlülükler', ur: 'واجبات' 
  },
  undo: { 
    ar: 'تراجع', en: 'Undo', fr: 'Annuler', es: 'Deshacer', tr: 'Geri Al', ur: 'واپس' 
  },
  redo: { 
    ar: 'إعادة', en: 'Redo', fr: 'Rétablir', es: 'Rehacer', tr: 'İleri Al', ur: 'آگے' 
  },
  budgetAlerts: { 
    ar: 'تنبيهات الميزانية', en: 'Budget Alerts', fr: 'Alertes Budget', es: 'Alertas de Presupuesto', tr: 'Bütçe Uyarıları', ur: 'بجٹ الرٹس' 
  },
  budgetExceeded: { 
    ar: 'تجاوز الميزانية', en: 'Budget Exceeded', fr: 'Budget Dépassé', es: 'Presupuesto Excedido', tr: 'Bütçe Aşıldı', ur: 'بجٹ بڑھ گیا' 
  },
  budgetApproaching: { 
    ar: 'اقتراب من الميزانية', en: 'Approaching Budget', fr: 'Budget Proche', es: 'Presupuesto Cercano', tr: 'Bütçeye Yaklaşıldı', ur: 'بجٹ کے قریب' 
  },
  editBudgets: { 
    ar: 'تعديل الميزانيات', en: 'Edit Budgets', fr: 'Modifier les Budgets', es: 'Editar Presupuestos', tr: 'Bütçeleri Düzenle', ur: 'بجٹ میں ترمیم کریں' 
  },
  saveBudgets: { 
    ar: 'حفظ الميزانيات', en: 'Save Budgets', fr: 'Enregistrer les Budgets', es: 'Guardar Presupuestos', tr: 'Bütçeleri Kaydet', ur: 'بجٹ محفوظ کریں' 
  },
  budgetLimit: { 
    ar: 'حد الميزانية', en: 'Budget Limit', fr: 'Limite du Budget', es: 'Límite de Presupuesto', tr: 'Bütçe Sınırı', ur: 'بجٹ کی حد' 
  },
  currency: { 
    ar: 'العملة', en: 'Currency', fr: 'Devise', es: 'Moneda', tr: 'Para Birimi', ur: 'کرنسی' 
  },
  save: { 
    ar: 'حفظ', en: 'Save', fr: 'Enregistrer', es: 'Guardar', tr: 'Kaydet', ur: 'محفوظ کریں' 
  },
  recurring: { 
    ar: 'متكررة', en: 'Recurring', fr: 'Récurrent', es: 'Recurrente', tr: 'Tekrarlayan', ur: 'بار بار' 
  },
  day: { 
    ar: 'يوم', en: 'Day', fr: 'Jour', es: 'Día', tr: 'Gün', ur: 'دن' 
  },
  week: { 
    ar: 'أسبوع', en: 'Week', fr: 'Semaine', es: 'Semana', tr: 'Hafta', ur: 'ہفتہ' 
  },
  month: { 
    ar: 'شهر', en: 'Month', fr: 'Mois', es: 'Mes', tr: 'Ay', ur: 'مہینہ' 
  },
  year: { 
    ar: 'سنة', en: 'Year', fr: 'An', es: 'Año', tr: 'Yıl', ur: 'سال' 
  },
  repeatsEveryLabel: { 
    ar: 'تتكرر كل', en: 'Repeats every', fr: 'Répéter tous les', es: 'Se repite cada', tr: 'Tekrarlanma', ur: 'ہر بار دہراتا ہے' 
  },
  SAR: { 
    ar: 'ريال سعودي', en: 'Saudi Riyal', fr: 'Riyal Saoudien', es: 'Riyal Saudí', tr: 'Suudi Riyali', ur: 'سعودی ریال' 
  },
  OMR: { 
    ar: 'ريال عماني', en: 'Omani Rial', fr: 'Rial Omanais', es: 'Rial Omaní', tr: 'Umman Riyali', ur: 'عمانی ریال' 
  },
  USD: { 
    ar: 'دولار أمريكي', en: 'US Dollar', fr: 'Dollar US', es: 'Dólar Estadounidense', tr: 'ABD Doları', ur: 'امریکی ڈالر' 
  },
  EUR: { 
    ar: 'يورو', en: 'Euro', fr: 'Euro', es: 'Euro', tr: 'Euro', ur: 'یورو' 
  },
  GBP: { 
    ar: 'جنيه إسترليني', en: 'British Pound', fr: 'Livre Brit.', es: 'Libra Esterlina', tr: 'İngiliz Sterlini', ur: 'برطانوی پاؤنڈ' 
  },
  AED: { 
    ar: 'درهم إماراتي', en: 'UAE Dirham', fr: 'Dirham UAE', es: 'Dirham EAU', tr: 'BAE Dirhemi', ur: 'اماراتی درہم' 
  },
  KWD: { 
    ar: 'دينار كويتي', en: 'Kuwaiti Dinar', fr: 'Dinar Koweïtien', es: 'Dinar Kuwaití', tr: 'Kuveyt Dinarı', ur: 'کویتی دینار' 
  },
  EGP: { 
    ar: 'جنيه مصري', en: 'Egyptian Pound', fr: 'Livre Égypt.', es: 'Libra Egipcia', tr: 'Mısır Lirası', ur: 'مصری پاؤنڈ' 
  },
  equationBalanced: { 
    ar: 'المعادلة متوازنة', en: 'Equation is Balanced', fr: 'Équation Équilibrée', es: 'Ecuación Equilibrada', tr: 'Denklem Dengeli', ur: 'مساوات متوازن ہے' 
  },
  equationUnbalanced: { 
    ar: 'المعادلة غير متوازنة!', en: 'Equation is Unbalanced!', fr: 'Équation Non Équilibrée', es: 'Ecuación No Equilibrada', tr: 'Denklem Dengesiz!', ur: 'مساوات غیر متوازن ہے!' 
  },
  totalAssets: { 
    ar: 'إجمالي الأصول', en: 'Total Assets', fr: 'Total Actifs', es: 'Total Activos', tr: 'Toplam Varlıklar', ur: 'کل اثاثے' 
  },
  totalLiabilitiesEquity: { 
    ar: 'الخصوم + حقوق الملكية', en: 'Liabilities + Equity', fr: 'Passifs + CP', es: 'Pasivos + PN', tr: 'Yükümlülük + Özkaynak', ur: 'واجبات + ایکویٹی' 
  },
  errorSavingTransactions: { 
    ar: 'حدث خطأ أثناء حفظ العمليات', en: 'Error saving transactions', fr: 'Erreur d\'enregistrement', es: 'Error al guardar', tr: 'İşlemler kaydedilirken hata', ur: 'ٹرانزیکشن محفوظ کرنے میں خرابی' 
  },
  recurringCreated: { 
    ar: 'تم إنشاء عمليات متكررة تلقائياً', en: 'Recurring transactions created automatically', fr: 'Série de transactions créée', es: 'Transacciones automáticas creadas', tr: 'Tekrarlayan işlemler otomatik oluşturuldu', ur: 'ٹرانزیکشنز خود بخود بن گئیں' 
  },
  budgetExceededAlert: { 
    ar: 'تجاوز الميزانية: لقد تجاوزت الميزانية المخصصة لحساب', en: 'Budget Exceeded for', fr: 'Budget Dépassé pour', es: 'Presupuesto Excedido para', tr: 'Bütçe Aşıldı:', ur: 'بجٹ بڑھ گیا:' 
  },
  budgetWarningAlert: { 
    ar: 'تنبيه ميزانية: لقد استهلكت أكثر من 85% من ميزانية', en: 'Budget Warning for', fr: 'Alerte Budget pour', es: 'Alerta Presupuesto para', tr: 'Bütçe Uyarısı:', ur: 'بجٹ الرٹ:' 
  },
  budgetSavedSuccess: { 
    ar: 'تم حفظ الميزانية بنجاح', en: 'Budget saved successfully', fr: 'Budget enregistré', es: 'Presupuesto guardado', tr: 'Bütçe başarıyla kaydedildi', ur: 'بجٹ محفوظ ہو گیا' 
  },
  budgetSaveError: { 
    ar: 'حدث خطأ أثناء حفظ الميزانية', en: 'Error saving budget', fr: 'Erreur budget', es: 'Error presupuesto', tr: 'Bütçe kaydedilirken hata', ur: 'بجٹ محفوظ کرنے میں خرابی' 
  },
  errorExportingPDF: { 
    ar: 'حدث خطأ أثناء تصدير ملف PDF', en: 'Error exporting PDF', fr: 'Erreur PDF', es: 'Error PDF', tr: 'PDF dışa aktarılırken hata', ur: 'PDF ایکسپورٹ کرنے میں خرابی' 
  },
  loading: { 
    ar: 'جاري التحميل...', en: 'Loading...', fr: 'Chargement...', es: 'Cargando...', tr: 'Yükleniyor...', ur: 'لوڈنگ...' 
  },
  loginPrompt: { 
    ar: 'يرجى تسجيل الدخول لحفظ وإدارة عملياتك المالية بأمان.', en: 'Please sign in to manage your finances.', fr: 'Connectez-vous SVP', es: 'Inicie sesión por favor', tr: 'Lütfen giriş yapın', ur: 'براہ کرم سائن ان کریں' 
  },
  noTransactions: { 
    ar: 'لا توجد عمليات مسجلة بعد.', en: 'No transactions yet.', fr: 'Pas de transactions', es: 'Sin transacciones', tr: 'Henüz işlem yok', ur: 'ابھی تک کوئی ٹرانزیکشن نہیں' 
  },
  addTransactionPrompt: { 
    ar: 'قم بإضافة عملية جديدة من النموذج الجانبي.', en: 'Add a new transaction.', fr: 'Ajouter une transaction', es: 'Agregar transacción', tr: 'Yeni işlem ekleyin', ur: 'نئی ٹرانزیکشن شامل کریں' 
  },
  deleteTransaction: { 
    ar: 'حذف العملية', en: 'Delete Transaction', fr: 'Supprimer', es: 'Eliminar', tr: 'İşlemi Sil', ur: 'حذف کریں' 
  },
  amountPlaceholder: { 
    ar: 'المبلغ (+ أو -)', en: 'Amount (+ or -)', fr: 'Montant (+/-)', es: 'Monto (+/-)', tr: 'Tutar (+/-)', ur: 'رقم (+ یا -)' 
  },
  negativeAmountNote: { 
    ar: '* أدخل المبلغ بالسالب (-) في حالة النقص.', en: '* Enter negative (-) for decrease.', fr: '* Négatif (-) pour diminution', es: '* Negativo (-) para disminución', tr: '* Azalış için negatif (-) girin', ur: '* کمی کے لیے منفی (-) درج کریں' 
  },
  importFiles: { 
    ar: 'استيراد ملفات/صور', en: 'Import Files/Images', fr: 'Importer des Fichiers', es: 'Importar Archivos', tr: 'Dosya/Resim İçe Aktar', ur: 'فائلیں/تصاویر درآمد کریں' 
  },
  importFilesDesc: { 
    ar: 'استخرج المعاملات من PDF، Word، Excel، PowerPoint أو الصور.', en: 'Extract from PDF, Word, Excel, Images.', fr: 'Extraire de PDF, Word, Excel, Images', es: 'Extraer de PDF, Word, Excel, Imágenes', tr: 'PDF, Word, Excel veya Resimlerden veri çekin', ur: 'PDF، Word، Excel یا تصاویر سے ڈیٹا نکالیں' 
  },
  clickToUpload: { 
    ar: 'انقر هنا للرفع أو اسحب الملف/الصورة هنا', en: 'Click to upload or drag here', fr: 'Cliquez ou glissez ici', es: 'Click o arrastre aquí', tr: 'Yüklemek için tıklayın veya sürükleyin', ur: 'اپ لوڈ کرنے کے لیے کلک کریں یا یہاں گھسیٹیں' 
  },
  analyzing: { 
    ar: 'جاري استخراج البيانات وتحليل النص...', en: 'Analyzing data...', fr: 'Analyse en cours...', es: 'Analizando...', tr: 'Veri analiz ediliyor...', ur: 'تجزیہ کیا جا رہا ہے...' 
  },
  clear: { 
    ar: 'مسح', en: 'Clear', fr: 'Effacer', es: 'Limpiar', tr: 'Temizle', ur: 'صاف کریں' 
  },
  depreciationCalc: { 
    ar: 'حاسبة الإهلاك', en: 'Depreciation Calc', fr: 'Calcul d\'Amortissement', es: 'Calc. Depreciación', tr: 'Amortisman Hesaplayıcı', ur: 'فرسودگی کا کیلکولیٹر' 
  },
  assetCost: { 
    ar: 'تكلفة الأصل', en: 'Asset Cost', fr: 'Coût de l\'Actif', es: 'Costo del Activo', tr: 'Varlık Maliyeti', ur: 'اثاثے کی قیمت' 
  },
  salvageValue: { 
    ar: 'القيمة التخريدية (الخردة)', en: 'Salvage Value', fr: 'Valeur Résiduelle', es: 'Valor Residual', tr: 'Hurda Değeri', ur: 'سکریپ کی قیمت' 
  },
  usefulLife: { 
    ar: 'العمر الإنتاجي (سنوات)', en: 'Useful Life (Years)', fr: 'Durée de Vie (Ans)', es: 'Vida Útil (Años)', tr: 'Faydalı Ömür (Yıl)', ur: 'کارآمد زندگی (سال)' 
  },
  annualDepreciation: { 
    ar: 'الإهلاك السنوي', en: 'Annual Depr.', fr: 'Amort. Annuel', es: 'Depr. Anual', tr: 'Yıllık Amortisman', ur: 'سالانہ فرسودگی' 
  },
  monthlyDepreciation: { 
    ar: 'الإهلاك الشهري', en: 'Monthly Depr.', fr: 'Amort. Mensuel', es: 'Depr. Mensual', tr: 'Aylık Amortisman', ur: 'ماہانہ فرسودگی' 
  },
  applyDepreciation: { 
    ar: 'تسجيل الإهلاك في السجل', en: 'Apply to Ledger', fr: 'Appliquer au Grand Livre', es: 'Aplicar al Libro Mayor', tr: 'Deftere İşle', ur: 'لیجر پر لاگو کریں' 
  },
  selectAssetToDepreciate: { 
    ar: 'اختر الأصل لإهلاكه', en: 'Select Asset', fr: 'Choisir l\'Actif', es: 'Seleccionar Activo', tr: 'Varlık Seçin', ur: 'اثاثہ منتخب کریں' 
  },
  depreciationFor: { 
    ar: 'إهلاك لـ', en: 'Depr. for', fr: 'Amort. pour', es: 'Depr. para', tr: 'Amortisman:', ur: 'فرسودگی برائے' 
  },
  financialInsights: { 
    ar: 'التحليلات المالية', en: 'Financial Insights', fr: 'Analyses Financières', es: 'Análisis Financieros', tr: 'Finansal Analizler', ur: 'مالیاتی تجزیات' 
  },
  currentRatio: { 
    ar: 'نسبة السيولة (التداول)', en: 'Current Ratio', fr: 'Ratio de Liquidité', es: 'Razón Circulante', tr: 'Cari Oran', ur: 'موجودہ تناسب' 
  },
  currentRatioDesc: { 
    ar: 'القدرة على سداد الالتزامات قصيرة الأجل', en: 'Short-term debt ability', fr: 'Capacité de dette court terme', es: 'Capacidad deuda corto plazo', tr: 'Kısa vadeli borç ödeme gücü', ur: 'قلیل مدتی قرض کی ادائیگی' 
  },
  debtToEquity: { 
    ar: 'نسبة الديون إلى الملكية', en: 'Debt-to-Equity Ratio', fr: 'Ratio Dette/Fonds Propres', es: 'Razón Deuda/Capital', tr: 'Borç/Özkaynak Oranı', ur: 'قرض سے ایکویٹی کا تناسب' 
  },
  debtToEquityDesc: { 
    ar: 'درجة الاعتماد على الديون في التمويل', en: 'Reliance on debt', fr: 'Dépendance à la dette', es: 'Dependencia de la deuda', tr: 'Borca dayalı finansman düzeyi', ur: 'قرض پر انحصار' 
  },
  netProfit: { 
    ar: 'صافي الربح', en: 'Net Profit', fr: 'Bénéfice Net', es: 'Utilidad Neta', tr: 'Net Kar', ur: 'خالص منافع' 
  },
  monthlyProfitTrend: { 
    ar: 'اتجاه صافي الربح شهرياً', en: 'Monthly Profit Trend', fr: 'Tendance Mensuelle', es: 'Tendencia Mensual', tr: 'Aylık Kar Trendi', ur: 'ماہانہ منافع کا رجحان' 
  },
  lowLiquidity: { 
    ar: 'سيولة منخفضة! انتبه لالتزاماتك', en: 'Low Liquidity!', fr: 'Liquidité Faible!', es: 'Liquidez Baja!', tr: 'Düşük Likidite!', ur: 'کم لیکویڈیٹی!' 
  },
  healthyLiquidity: { 
    ar: 'سيولة ممتازة', en: 'Healthy Liquidity', fr: 'Liquidité Saine', es: 'Liquidez Saludable', tr: 'Sağlıklı Likidite', ur: 'بہترین لیکویڈیٹی' 
  },
  attachDocument: { 
    ar: 'إرفاق مستند', en: 'Attach Document', fr: 'Joindre Document', es: 'Adjuntar Doc.', tr: 'Dosya Ekle', ur: 'دستاویز منسلک کریں' 
  },
  viewDocument: { 
    ar: 'عرض المستند', en: 'View Document', fr: 'Voir Document', es: 'Ver Doc.', tr: 'Dosyayı Gör', ur: 'دستاویز دیکھیں' 
  },
  uploading: { 
    ar: 'جاري الرفع...', en: 'Uploading...', fr: 'Envoi...', es: 'Subiendo...', tr: 'Yükleniyor...', ur: 'اپ لوڈ ہو رہا ہے...' 
  },
  documentPreview: { 
    ar: 'معاينة المستند', en: 'Document Preview', fr: 'Aperçu', es: 'Vista Previa', tr: 'Dosya Önizleme', ur: 'دستاویز کا معائنہ' 
  },
  noDocument: { 
    ar: 'لا يوجد مستند مرفق', en: 'No document', fr: 'Aucun document', es: 'Sin documento', tr: 'Dosya yok', ur: 'کوئی دستاویز نہیں ہے' 
  },
  debit: { 
    ar: 'مدين (+)', en: 'Debit (+)', fr: 'Débit (+)', es: 'Débito (+)', tr: 'Borç (+)', ur: 'ڈیبٹ (+)' 
  },
  credit: { 
    ar: 'دائن (-)', en: 'Credit (-)', fr: 'Crédit (-)', es: 'Crédito (-)', tr: 'Alacak (-)', ur: 'کریڈٹ (-)' 
  },
  accountName: { 
    ar: 'اسم الحساب', en: 'Account Name', fr: 'Compte', es: 'Cuenta', tr: 'Hesap Adı', ur: 'اکاؤنٹ کا نام' 
  },
  impactValue: { 
    ar: 'قيمة التأثير', en: 'Impact Value', fr: 'Valeur', es: 'Valor', tr: 'Etki Değeri', ur: 'اثر کی قیمت' 
  },
  transactionSource: { 
    ar: 'مصدر العملية', en: 'Transaction Source', fr: 'Source', es: 'Fuente', tr: 'İşlem Kaynağı', ur: 'ذریعہ' 
  },
  incomeStatement: {
    ar: 'قائمة الدخل', en: 'Income Statement', fr: 'Compte de Résultat', es: 'Estado de Resultados', tr: 'Gelir Tablosu', ur: 'آمدنی کا گوشوارہ'
  },
  periodEnding: {
    ar: 'للفترة المنتهية في', en: 'For the period ending', fr: 'Pour la période se terminant le', es: 'Para el período que termina el', tr: 'Dönem sonu:', ur: 'ختم ہونے والی مدت کے لیے'
  },
  operatingExpenses: {
    ar: 'المصروفات التشغيلية', en: 'Operating Expenses', fr: 'Charges d\'Exploitation', es: 'Gastos Operativos', tr: 'Faaliyet Giderleri', ur: 'آپریٹنگ اخراجات'
  },
  totalOperatingExpenses: {
    ar: 'إجمالي المصروفات التشغيلية', en: 'Total Operating Expenses', fr: 'Total Charges d\'Exploitation', es: 'Total Gastos Operativos', tr: 'Toplam Faaliyet Giderleri', ur: 'کل آپریٹنگ اخراجات'
  },
  netIncome: {
    ar: 'صافي الدخل', en: 'Net Income', fr: 'Résultat Net', es: 'Utilidad Neta', tr: 'Net Gelir', ur: 'خالص آمدنی'
  },
  totalRevenue: {
    ar: 'إجمالي الإيرادات', en: 'Total Revenue', fr: 'Chiffre d\'Affaires Total', es: 'Ingresos Totales', tr: 'Toplam Gelir', ur: 'کل آمدنی'
  },
  exportingPDF: {
    ar: 'جاري تصدير ملف PDF...', en: 'Exporting PDF...', fr: 'Exportation PDF...', es: 'Exportando PDF...', tr: 'PDF dışa aktarılıyor...', ur: 'PDF ایکسپورٹ ہو رہا ہے...'
  },
  exportSuccess: {
    ar: 'تم تصدير الملف بنجاح', en: 'Exported successfully', fr: 'Exporté avec succès', es: 'Exportado con éxito', tr: 'Başarıyla dışa aktarıldı', ur: 'کامیابی سے ایکسپورٹ ہو گیا'
  },
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
