import { ChatMessage, FinancialContext } from '../types/accounting';

export const AUTO_REPLIES: Record<string, Record<string, string>> = {
  ar: {
    welcome: `🌟 **مرحباً بك في متزن!**

أنا مساعدك المالي الذكي. يمكنني مساعدتك في:

📊 **إدارة الميزانية** - شرح المعادلة المحاسبية وإدارة الحسابات
💳 **المعاملات** - كيفية إضافة وتعديل المعاملات
📄 **التقارير** - قائمة الدخل، التدفقات النقدية، التصدير
📊 **التحليلات المالية** - النسب والمؤشرات المالية
❓ **أي استفسار آخر**

اكتب سؤالك وسأحاول مساعدتك!`,
    greeting: 'أهلاً وسهلاً بك! 🙋‍♂️\n\nكيف يمكنني مساعدتك في إدارة أموالك وحساباتك اليوم؟',
    equation: `📊 **معادلة الميزانية (القيد المحاسبي)**

**الأصول = الخصوم + حقوق الملكية**

📌 **شرح مبسط:**
• **الأصول (Assets)**: كل ما تملكه (بنك، نقدية، سيارات، أثاث، مباني، معدات)
• **الخصوم (Liabilities)**: ما عليك من ديون (قروض، ذمم دائنة)
• **حقوق الملكية (Equity)**: رأس المال والأرباح المحتجزة

✅ الموقع يتأكد تلقائياً من توازن المعادلة بعد كل إدخال!

💡 **مثال:**
إذا اشتريت سيارة ب 15,000 ريال:
• حساب السيارة (أصل) يزيد ← مدين 15,000
• حساب البنك (أصل) ينقص ← دائن 15,000
• النتيجة: الأصول = الأصول ✅`,
    howto: `✅ **دليل استخدام متزن**

**1️⃣ إضافة معاملة جديدة**
• اضغط على زر "إضافة معاملة" (+)
• أدخل: التاريخ، الوصف، الحسابات المتأثرة
• حدد مدين ( debit ) أو دائن ( credit )
• أدخل المبلغ لكل حساب
• اضغط حفظ

**2️⃣ المعاملات المتكررة**
• فعّل خيار "عملية متكررة"
• اختر: يومياً، أسبوعياً، شهرياً، سنوياً
• سيتم إنشاء المعاملات تلقائياً حسب الفترة

**3️⃣ إدارة الحسابات**
• يمكنك إضافة حسابات مخصصة
• اختر نوع الحساب: أصل، خصم، حقوق ملكية
• تحكم في ميزانيات كل حساب

**4️⃣ التقارير**
• الميزانية العمومية
• قائمة الدخل
• قائمة التدفقات النقدية
• تصدير CSV أو PDF

ابدأ الآن بإضافة معاملاتك! 🚀`,
    report: `📄 **التقارير المتاحة في متزن**

**1️⃣ الميزانية العمومية (Balance Sheet)**
• تعرض الأصول = الخصوم + حقوق الملكية
• توازن تلقائي بعد كل إدخال

**2️⃣ قائمة الدخل (Income Statement)**
• تعرض الإيرادات والمصروفات
• صافي الربح / الخسارة

**3️⃣ قائمة التدفقات النقدية (Cash Flow)**
• الأنشطة التشغيلية
• الأنشطة الاستثمارية
• الأنشطة التمويلية

**4️⃣ التحليلات المالية**
• نسبة السيولة (Current Ratio)
• نسبة الديون إلى الملكية (Debt-to-Equity)
• رسم بياني لتوزيع الأصول
• رسم بياني للإيرادات والمصروفات
• اتجاه صافي الربح الشهري

**📥 التصدير:**
• تصدير CSV (لبرامج Excel)
• تصدير PDF (للطباعة والمشاركة)

⚠️ نصيحة: استخدم التقارير لمتابعة أداء أعمالك!`,
    transaction: `💳 **إضافة وتعديل المعاملات**

**🔹 إضافة معاملة جديدة:**
1. اضغط على زر (+) في الأسفل (أو "إضافة معاملة" في القائمة)
2. أدخل تاريخ المعاملة (مثال: 1/1)
3. اكتب وصفاً واضحاً للمعاملة
4. أضف الحسابات المتأثرة (يمكن إضافة أكثر من حسابين)
5. لكل حساب: اختر مدين ( debit ) أو دائن ( credit )
6. أدخل المبلغ
7. اضغط "إضافة العملية"

**🔸 تعديل معاملة:**
• مرر مؤشر الفأرة على المعاملة في الجدول
• اضغط على أيقونة القلم (تعديل)
• عدّل البيانات المطلوبة
• اضغط "حفظ التعديلات"

**🗑️ حذف المعاملات:**
• حذف فردي: أيقونة سلة المهملات
• حذف متعدد: حدد المربعات ← "حذف المحدد"
• مسح الكل: زر سلة المهملات في القائمة

**💡 نصيحة:**
استخدم وصفاً واضحاً لتسهيل الرجوع للمعاملات لاحقاً!`,
    contact: `📧 **للتواصل مع المطور**

يمكنك التواصل عبر:
📧 **البريد الإلكتروني:** abdullahalalawi52@gmail.com
📍 **العنوان:** مسقط، سلطنة عمان

أو من خلال صفحة "اتصل بي" في الموقع - يمكنك إرسال رسالة مباشرة وسيتم الرد عليك قريباً إن شاء الله.`,
    accounts: `🏦 **الحسابات المحاسبية في متزن**

**الأصول (Assets):**
🟢 البنك، النقدية، السيارات، الأثاث، المباني
🟢 المعدات، المخزون، الذمم المدينة، الأراضي
🟢 الاستثمارات، الأصول غير الملموسة، الشهرة

**الخصوم (Liabilities):**
🔴 الذمم الدائنة، القروض قصيرة/طويلة الأجل
🔴 المصروفات المستحقة، الإيرادات غير المكتسبة

**حقوق الملكية (Equity):**
🟣 رأس المال، رأس مال الأسهم، الأرباح المحتجزة
🟣 الإيرادات، المصروفات، المسحوبات الشخصية

💡 يمكنك إضافة حسابات مخصصة من قائمة الحسابات!`,
    budgets: `🎯 **الميزانيات والتنبيهات**

يساعدك متزن في تتبع ميزانياتك:

• **تحديد الميزانية**: ضع حداً أقصى لكل حساب
• **تنبيهات ذكية**: يحذرك عند استهلاك 85% من الميزانية
• **إنذار تجاوز**: ينبهك عند تجاوز الميزانية المحددة

**كيفية الإعداد:**
1. اذهب إلى قسم "تنبيهات الميزانية"
2. اضغط على أيقونة القلم لتعديل الميزانيات
3. أدخل الحد الأقصى لكل حساب
4. اضغط حفظ

**الألوان المستخدمة:**
• 🟢 أخضر: ضمن الميزانية
• 🟠 برتقالي: قرب الوصول للحد (أكثر من 85%)
• 🔴 أحمر: تجاوز الميزانية`,
    depreciation: `📉 **حاسبة الإهلاك (الاستهلاك)**

يمكنك حساب إهلاك الأصول الثابتة بسهولة:

**طريقة الحساب (القسط الثابت):**
الإهلاك السنوي = (تكلفة الأصل - القيمة التخريدية) ÷ العمر الإنتاجي

**مثال:**
• تكلفة السيارة: 15,000 ريال
• القيمة التخريدية: 1,000 ريال
• العمر الإنتاجي: 5 سنوات
• الإهلاك السنوي = (15,000 - 1,000) ÷ 5 = 2,800 ريال

**خطوات التسجيل:**
1. اضغط على "حاسبة الإهلاك"
2. أدخل بيانات الأصل
3. شاهد الإهلاك السنوي والشهري
4. اضغط "تسجيل الإهلاك" لإضافته كمعاملة`,
    scans: `📄 **مسح المستندات واستخراج البيانات**

يمكنك استيراد المعاملات من:
• **PDF** - فواتير، كشوفات بنكية
• **Word** - مستندات
• **Excel** - جداول البيانات
• **الصور** - فواتير مصورة

**الطريقة:**
1. اضغط على "مسح PDF/صور"
2. اختر الملف أو اسحبه وأفلته
3. سيتم استخراج البيانات تلقائياً (باستخدام Gemini AI أو Tesseract OCR)
4. راجع البيانات المستخرجة وأكمل الإضافة

💡 *يتطلب تفعيل Gemini API للحصول على أفضل النتائج*`,
    tips: `💡 **نصائح سريعة للاستخدام الأمثل**

🎯 **للمبتدئين:**
• ابدأ بتسجيل رأس المال (أول معاملة)
• سجل كل معاملة فور حدوثها
• استخدم أوصافاً واضحة

📊 **للتحليل المالي:**
• راجع التحليلات المالية بانتظام
• تابع نسبة السيولة (يجب أن تكون > 1.5)
• احرص على توازن الميزانية دائماً

🔄 **ميزات متقدمة:**
• استخدم المعاملات المتكررة للفواتير الشهرية
• فعّل الميزانيات للتحكم في المصروفات
• احفظ نسخ احتياطية (Snapshots)
• صدر التقارير بشكل دوري

⚡ **اختصارات:**
• Ctrl+Z: تراجع
• Ctrl+Y: إعادة
• اختر عدة معاملات للحذف الجماعي`,
    financialContext: `📊 **وضع البيانات المالية**

وضع البيانات المالية نشط! أستطيع الآن تحليل بياناتك المالية والإجابة على أسئلة مثل:

• "كم الرصيد في البنك؟"
• "كم إجمالي الأصول؟"
• "هل الميزانية متوازنة؟"
• "ما هو صافي الربح؟"

⚠️ للحصول على أفضل إجابات، يرجى إدخال مفتاح Gemini API في الإعدادات.`,
    aiMode: `🤖 **تفعيل الذكاء الاصطناعي (AI Mode)**

عند إدخال مفتاح Gemini API الخاص بك:
• سيتم توليد الردود بالكامل عبر الذكاء الاصطناعي
• سأستطيع تحليل حساباتك المالية بدقة عالية
• ستحصل على إجابات مخصصة تناسب وضعك المالي بدقة

**طريقة التفعيل:**
1. اضغط على أيقونة الترس ⚙️ في أعلى نافذة الدردشة
2. الصق مفتاح Gemini API الخاص بك
3. اضغط حفظ المفتاح
4. استمتع بتجربة ذكية متكاملة! 🚀`,
    default: `شكراً لسؤالك! 😊

للمزيد من المعلومات، يمكنك زيارة الأقسام التالية في الموقع:
• 📊 **الميزانية العمومية** - لمشاهدة الأصول والالتزامات
• 📄 **قائمة الدخل** - لمشاهدة الإيرادات والمصروفات
• 💡 **نصائح سريعة** - لمعرفة كيفية الاستخدام الأمثل

أو يمكنك كتابة سؤالك بوضوح أكبر وسأحاول مساعدتك!

**الكلمات المفتاحية المتاحة:**
مرحبا، معادلة، كيف، تقرير، معامله، تواصل، حساب، حد، اهلاك، مسح، نصيحه`,
  },
  en: {
    welcome: `🌟 **Welcome to Motazin!**

I am your smart financial assistant. I can help you with:

📊 **Budget Management** - Explaining the accounting equation and accounts
💳 **Transactions** - How to add and edit transactions
📄 **Reports** - Income statement, cash flow, exporting data
📊 **Financial Analysis** - Ratios and financial metrics
❓ **Any other query**

Type your question and I'll do my best to help!`,
    greeting: 'Hello there! 🙋‍♂️\n\nHow can I help you manage your finances and accounts today?',
    equation: `📊 **Accounting Equation (Double-entry)**

**Assets = Liabilities + Equity**

📌 **Simple Explanation:**
• **Assets**: What you own (bank, cash, cars, furniture, buildings, equipment)
• **Liabilities**: What you owe (loans, accounts payable)
• **Equity**: Capital and retained earnings

✅ The app automatically validates the balance equation after every transaction!

💡 **Example:**
If you buy a car for 15,000 OMR:
• Car account (Asset) increases ← Debit 15,000
• Bank account (Asset) decreases ← Credit 15,000
• Result: Assets = Assets (Balanced) ✅`,
    howto: `✅ **Motazin User Guide**

**1️⃣ Adding a new transaction**
• Click the "+" button in the mobile view or "Add Transaction" button
• Fill: Date, Description, Affected accounts
• Select Debit or Credit for each account
• Enter the amount
• Click Save

**2️⃣ Recurring Transactions**
• Toggle "Recurring Transaction"
• Select: Daily, Weekly, Monthly, Yearly
• Transactions will be generated automatically at the due dates

**3️⃣ Manage Accounts**
• You can create custom accounts
• Select Account Type: Asset, Liability, Equity
• Control budgets for each account

**4️⃣ Reports**
• Balance Sheet
• Income Statement
• Cash Flow Statement
• Export CSV or PDF

Start adding your transactions now! 🚀`,
    report: `📄 **Available Reports in Motazin**

**1️⃣ Balance Sheet**
• Displays Assets = Liabilities + Equity
• Balanced automatically on every change

**2️⃣ Income Statement**
• Displays Revenues and Expenses
• Calculates Net Profit / Loss

**3️⃣ Cash Flow Statement**
• Operating Activities
• Investing Activities
• Financing Activities

**4️⃣ Financial Ratios**
• Current Ratio
• Debt-to-Equity Ratio
• Asset Distribution Chart
• Revenue vs Expenses Chart
• Monthly Net Profit Trend

**📥 Export Options:**
• Export CSV (for Excel)
• Export PDF (for print/share)

⚠️ Tip: Use reports to track business performance!`,
    transaction: `💳 **Adding & Editing Transactions**

**🔹 Adding a transaction:**
1. Click the (+) button in the bottom menu (or "Add Transaction")
2. Enter the transaction date (e.g. 1/1)
3. Write a clear description
4. Add the affected accounts (multi-ledger supported)
5. Select Debit or Credit for each ledger
6. Enter the amount
7. Click "Add Transaction"

**🔸 Editing a transaction:**
• Hover over the transaction in the table
• Click the pencil icon (edit)
• Update details
• Click "Save Changes"

**🗑️ Deleting Transactions:**
• Single delete: Trash can icon
• Bulk delete: Check boxes ← "Delete Selected"
• Clear all: Trash icon in top bar

💡 **Tip:**
Use clear descriptions to easily search records later!`,
    contact: `📧 **Contact Developer**

You can reach out via:
📧 **Email:** abdullahalalawi52@gmail.com
📍 **Location:** Muscat, Oman

Or submit a message through the "Contact Us" page in the app, and I will reply as soon as possible.`,
    accounts: `🏦 **Accounting Chart of Accounts**

**Assets:**
🟢 Bank, Cash, Cars, Furniture, Buildings, Equipment, Inventory, Accounts Receivable, Land

**Liabilities:**
🔴 Accounts Payable, Short/Long-term Loans, Accrued Expenses, Unearned Revenues

**Equity:**
Purple Capital, Revenues, Expenses, Drawings

💡 You can add custom accounts from the account list!`,
    budgets: `🎯 **Budgets & Alerts**

Motazin helps you track your budgets:

• **Set Budget**: Set a maximum limit for each account
• **Smart Alerts**: Warns you at 85% of budget usage
• **Over Budget Alert**: Notifies when budget is exceeded

**How to set up:**
1. Go to "Budget Alerts" section
2. Click the pencil icon to edit budgets
3. Enter the maximum limit for each account
4. Click save

**Color indicators:**
• 🟢 Green: Within budget
• 🟠 Orange: Approaching limit (over 85%)
• 🔴 Red: Budget exceeded`,
    depreciation: `📉 **Depreciation Calculator**

Easily calculate asset depreciation:

**Straight-Line Method:**
Annual Depreciation = (Cost - Salvage Value) ÷ Useful Life

**Example:**
• Car cost: 15,000
• Salvage value: 1,000
• Useful life: 5 years
• Annual Depreciation = (15,000 - 1,000) ÷ 5 = 2,800

**Steps:**
1. Click "Depreciation Calculator"
2. Enter asset details
3. View annual and monthly depreciation
4. Click "Apply to Ledger" to record as transaction`,
    scans: `📄 **Document Scanning & Data Extraction**

You can import transactions from:
• **PDF** - Invoices, bank statements
• **Word** - Documents
• **Excel** - Spreadsheets
• **Images** - Scanned invoices

**How to use:**
1. Click "Scan PDF/Image"
2. Choose or drag & drop a file
3. Data will be extracted automatically (using Gemini AI or Tesseract OCR)
4. Review and complete the import

💡 *Requires Gemini API key for best results*`,
    tips: `💡 **Quick Tips for Best Usage**

🎯 **For Beginners:**
• Start by recording your capital (first transaction)
• Record each transaction as it happens
• Use clear descriptions

📊 **For Financial Analysis:**
• Review financial insights regularly
• Monitor Current Ratio (should be > 1.5)
• Always keep the balance sheet balanced

🔄 **Advanced Features:**
• Use recurring transactions for monthly bills
• Enable budgets to control expenses
• Save snapshots as backups
• Export reports periodically

⚡ **Shortcuts:**
• Ctrl+Z: Undo
• Ctrl+Y: Redo
• Select multiple transactions for bulk delete`,
    financialContext: `📊 **Financial Context Mode**

Financial context mode is active! I can now analyze your financial data and answer questions like:

• "How much is in my bank?"
• "What are total assets?"
• "Is the balance sheet balanced?"
• "What is the net profit?"

⚠️ For accurate answers, please enter your Gemini API key in settings.`,
    aiMode: `🤖 **AI Mode**

When you activate your Gemini API key:
• Responses will be generated by AI
• I'll be able to analyze your financial data accurately
• Personalized answers based on your financial situation

**To activate:**
1. Click the gear icon ⚙️
2. Enter your Gemini API key
3. Click save
4. Enjoy an enhanced experience! 🚀`,
    default: `Thank you for your question! 😊

For more information, you can visit these sections:
• 📊 **Balance Sheet** - View assets and liabilities
• 📄 **Income Statement** - View revenues and expenses
• 💡 **Quick Tips** - Improve your usage

Or ask your question more specifically and I'll try to help!

**Available keywords:**
hello, equation, how, report, transaction, contact, account, budget, depreciation, scan, tip`,
  }
};

export function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();
  // Arabic normalization
  normalized = normalized.replace(/[أإآا]/g, 'ا');
  normalized = normalized.replace(/ة/g, 'ه');
  normalized = normalized.replace(/ى/g, 'ي');
  normalized = normalized.replace(/ؤ/g, 'ء');
  normalized = normalized.replace(/ئ/g, 'ء');
  normalized = normalized.replace(/[ًٌٍَُِّ]/g, '');
  normalized = normalized.replace(/(^|\s)ال(\S+)/g, '$1$2');
  return normalized;
}

export const KEYWORDS: Record<string, { keywords: string[], replyKey: string, weight?: number }[]> = {
  ar: [
    { keywords: ['مرحب', 'اهلا', 'السلام', 'مساء', 'صباح', 'تحيه', 'هلا', 'اهلين', 'مرحبا', 'شلونك', 'كيفك', 'اخبارك', 'هاي'], replyKey: 'greeting', weight: 5 },
    { keywords: ['معادله', 'ميزانيه', 'قيد', 'اصل', 'خصم', 'حقوق', 'مدين', 'دائن', 'محاسبي', 'توازن', 'متوازن', 'متزنه', 'دفتر قيد', 'راس المال'], replyKey: 'equation', weight: 4 },
    { keywords: ['كيف', 'استخدام', 'بدء', 'طريق', 'بدا', 'تعليم', 'دليل', 'مبتدء', 'شرح', 'خطوات', 'شلون', 'كيفيه'], replyKey: 'howto', weight: 3 },
    { keywords: ['تقرير', 'قائمه', 'دخل', 'تدفق', 'pdf', 'csv', 'تصدير', 'طباعه', 'تحميل', 'حفظ تقرير', 'كشف'], replyKey: 'report', weight: 4 },
    { keywords: ['معامله', 'اضافه', 'ادخال', 'تسجيل', 'تعديل', 'حذف', 'جديد', 'امسح', 'عدل', 'سجل', 'اضيف', 'عمليه'], replyKey: 'transaction', weight: 4 },
    { keywords: ['تواصل', 'اتصال', 'مطور', 'بريد', 'ايميل', 'رساله', 'رقم', 'هاتف', 'اتصل', 'مساعده', 'الدعم', 'فريق'], replyKey: 'contact', weight: 4 },
    { keywords: ['حساب', 'اصول', 'خصوم', 'ملكيه', 'دفتر', 'شجره الحسابات', 'تصنيف', 'بنك', 'نقد', 'كاش'], replyKey: 'accounts', weight: 3 },
    { keywords: ['تنبيه', 'حد', 'تجاوز', 'ميزانيات', 'انذار', 'ميزانيه الحساب', 'ميزانيه حساب'], replyKey: 'budgets', weight: 3 },
    { keywords: ['اهلاك', 'استهلاك', 'اطفاء', 'خرده', 'عمر', 'اصل ثابت', 'اصول ثابته', 'حاسبه الاهلاك'], replyKey: 'depreciation', weight: 4 },
    { keywords: ['مسح', 'صوره', 'استيراد', 'رفع', 'ملف', 'scan', 'ocr', 'tesseract', 'فاتوره', 'كاميرا'], replyKey: 'scans', weight: 4 },
    { keywords: ['نصيح', 'تلميح', 'اختصار', 'مختصر', 'سريع', 'ميزه', 'افضل', 'طريقة صحيحه', 'ارشادات'], replyKey: 'tips', weight: 3 },
    { keywords: ['ذكاء', 'ai', 'gemini', 'api', 'مفتاح', 'تطوير', 'جيميني', 'شات', 'مساعد ذكي', 'تفعيل'], replyKey: 'aiMode', weight: 5 },
  ],
  en: [
    { keywords: ['hello', 'hi', 'hey', 'greeting', 'good morning', 'good evening', 'howdy', 'sup', 'welcome', 'yo', 'how are you'], replyKey: 'greeting', weight: 5 },
    { keywords: ['equation', 'account', 'balance', 'asset', 'liability', 'equity', 'formula', 'debit', 'credit', 'double entry', 'capital', 'journal'], replyKey: 'equation', weight: 4 },
    { keywords: ['how', 'use', 'start', 'begin', 'guide', 'tutorial', 'beginner', 'instruction', 'help', 'steps', 'explain'], replyKey: 'howto', weight: 3 },
    { keywords: ['report', 'statement', 'income', 'cash flow', 'pdf', 'csv', 'export', 'print', 'download', 'save'], replyKey: 'report', weight: 4 },
    { keywords: ['transaction', 'add', 'entry', 'record', 'journal', 'edit', 'delete', 'remove', 'new', 'modify', 'insert'], replyKey: 'transaction', weight: 4 },
    { keywords: ['contact', 'email', 'developer', 'support', 'message', 'phone', 'call', 'reach', 'helpdesk'], replyKey: 'contact', weight: 4 },
    { keywords: ['account', 'asset', 'liability', 'equity', 'chart', 'ledger', 'coa', 'bank', 'cash'], replyKey: 'accounts', weight: 3 },
    { keywords: ['budget', 'alert', 'limit', 'warning', 'exceed', 'track', 'threshold'], replyKey: 'budgets', weight: 3 },
    { keywords: ['depreciation', 'deprec', 'amortization', 'salvage', 'useful life', 'straight line', 'asset life'], replyKey: 'depreciation', weight: 4 },
    { keywords: ['scan', 'pdf', 'image', 'import', 'upload', 'file', 'ocr', 'tesseract', 'extract', 'invoice', 'camera'], replyKey: 'scans', weight: 4 },
    { keywords: ['tip', 'trick', 'shortcut', 'quick', 'feature', 'best', 'advice', 'recommend'], replyKey: 'tips', weight: 3 },
    { keywords: ['ai', 'gemini', 'api', 'key', 'intelligence', 'smart', 'gpt', 'llm', 'chat', 'activate'], replyKey: 'aiMode', weight: 5 },
  ]
};

export function getFinancialAnalysis(context: FinancialContext | undefined, language: string): string | null {
  if (!context || context.transactionCount === 0) return null;

  const isAr = language === 'ar';

  let analysis = isAr
    ? `📊 **تحليل سريع لبياناتك المالية**\n\n`
    : `📊 **Quick Financial Analysis**\n\n`;

  if (context.isBalanced) {
    analysis += isAr
      ? `✅ **الميزانية متوازنة** - الأصول = الخصوم + حقوق الملكية\n`
      : `✅ **Balanced Sheet** - Assets = Liabilities + Equity\n`;
  } else {
    analysis += isAr
      ? `⚠️ **الميزانية غير متوازنة** - يرجى مراجعة المعاملات!\n`
      : `⚠️ **Unbalanced Sheet** - Please review your transactions!\n`;
  }

  analysis += `\n${isAr ? '• **إجمالي الأصول**:' : '• **Total Assets**:'} ${context.totalAssets.toLocaleString()}\n`;
  analysis += `${isAr ? '• **إجمالي الخصوم**:' : '• **Total Liabilities**:'} ${context.totalLiabilities.toLocaleString()}\n`;
  analysis += `${isAr ? '• **حقوق الملكية**:' : '• **Equity**:'} ${context.totalEquity.toLocaleString()}\n`;
  analysis += `${isAr ? '• **عدد المعاملات**:' : '• **Transactions**:'} ${context.transactionCount}\n`;

  if (context.netProfit !== 0) {
    const profitEmoji = context.netProfit >= 0 ? '📈' : '📉';
    analysis += `\n${profitEmoji} ${isAr ? '**صافي الربح/الخسارة**:' : '**Net Profit/Loss**:'} ${context.netProfit.toLocaleString()}\n`;
  }

  analysis += `\n${isAr ? '• **نسبة السيولة (Current Ratio)**:' : '• **Current Ratio**:'} ${context.currentRatio.toFixed(2)}`;
  if (context.currentRatio >= 1.5) {
    analysis += ` ${isAr ? '✅ ممتازة' : '✅ Healthy'}`;
  } else if (context.currentRatio >= 1) {
    analysis += ` ${isAr ? '⚠️ مقبولة' : '⚠️ Acceptable'}`;
  } else {
    analysis += ` ${isAr ? '🔴 منخفضة - انتبه!' : '🔴 Low - Caution!'}`;
  }

  analysis += `\n${isAr ? '• **نسبة الديون إلى الملكية**:' : '• **Debt-to-Equity Ratio**:'} ${context.debtToEquity.toFixed(2)}`;
  if (context.debtToEquity > 2) {
    analysis += ` ${isAr ? '⚠️ مرتفعة' : '⚠️ High'}`;
  } else if (context.debtToEquity > 0) {
    analysis += ` ${isAr ? '✅ ضمن الحدود الطبيعية' : '✅ Within normal range'}`;
  }

  analysis += `\n\n${isAr ? '💡 استمر في إضافة المعاملات للحصول على تحليل أكثر دقة!' : '💡 Keep adding transactions for more accurate analysis!'}`;

  return analysis;
}

export function buildSystemPrompt(context: FinancialContext | undefined, language: string): string {
  const isAr = language === 'ar';
  const basePrompt = isAr
    ? `أنت مساعد مالي ذكي ومحاسب محترف في تطبيق "متزن". مهمتك هي مساعدة المستخدم في فهم معادلة الميزانية (الأصول = الخصوم + حقوق الملكية)، وإدارة حساباته، وتقديم نصائح مالية مبنية على البيانات.
تحدث بلهجة مهنية وودية باللغة العربية. استخدم التنسيق الغني (Markdown) والنقاط لجعل الإجابات سهلة القراءة.`
    : `You are a smart financial advisor and professional accountant inside the "Motazin" app. Your task is to help the user understand the accounting equation (Assets = Liabilities + Equity), manage accounts, and provide data-driven financial advice.
Speak in a professional and friendly tone in English. Use rich Markdown formatting and bullet points to make responses readable.`;

  if (!context || context.transactionCount === 0) {
    return basePrompt;
  }

  const contextPrompt = isAr
    ? `\n\nالبيانات المالية الحالية للمستخدم:\n- إجمالي الأصول: ${context.totalAssets}\n- إجمالي الخصوم: ${context.totalLiabilities}\n- حقوق الملكية: ${context.totalEquity}\n- صافي الربح: ${context.netProfit}\n- نسبة السيولة: ${context.currentRatio.toFixed(2)}\n- الميزانية ${context.isBalanced ? 'متوازنة ✅' : 'غير متوازنة ⚠️'}\nعدد المعاملات: ${context.transactionCount}`
    : `\n\nCurrent financial data:\n- Total Assets: ${context.totalAssets}\n- Total Liabilities: ${context.totalLiabilities}\n- Equity: ${context.totalEquity}\n- Net Profit: ${context.netProfit}\n- Current Ratio: ${context.currentRatio.toFixed(2)}\n- Balance is ${context.isBalanced ? 'Balanced ✅' : 'Unbalanced ⚠️'}\n- Transaction count: ${context.transactionCount}`;

  return basePrompt + contextPrompt;
}
