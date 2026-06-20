import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Send, User, Bot, MessageSquarePlus, Check, Clock, Settings, Sparkles, Brain, BarChart3, DollarSign, HelpCircle, ChevronDown, ChevronUp, Key, Shield, Info } from 'lucide-react';
import { useLanguage } from './i18n';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: number;
  isAi?: boolean;
}

interface FinancialContext {
  accounts: Record<string, number>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
  transactionCount: number;
  netProfit: number;
  currentRatio: number;
  debtToEquity: number;
}

interface ChatWidgetProps {
  financialContext?: FinancialContext;
  geminiApiKey?: string;
  onApiKeyChange?: (key: string) => void;
}

// --- Enhanced Static Replies ---
const AUTO_REPLIES: Record<string, Record<string, string>> = {
  ar: {
    welcome: `🌟 **مرحباً بك في متزن!**

أنا مساعدك المالي الذكي. يمكنني مساعدتك في:

📊 **إدارة الميزانية** - شرح المعادلة المحاسبية وإدارة الحسابات
💳 **المعاملات** - كيفية إضافة وتعديل المعاملات
📄 **التقارير** - قائمة الدخل، التدفقات النقدية، التصدير
💰 **التحليلات المالية** - النسب والمؤشرات المالية
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

تم تفعيل وضع السياق المالي! يمكنني الآن تحليل بياناتك المالية والإجابة عن أسئلة مثل:

• "كم رصيدي في البنك؟"
• "ما هو إجمالي الأصول؟"
• "هل الميزانية متوازنة؟"
• "ما هو صافي الربح؟"

⚠️ لتحصل على إجابات دقيقة، يرجى إدخال مفتاح Gemini API في الإعدادات.`,
    aiMode: `🤖 **وضع الذكاء الاصطناعي**

عند تفعيل مفتاح Gemini API:
• سيتم توليد الردود بالذكاء الاصطناعي
• سأتمكن من تحليل بياناتك المالية بدقة
• إجابات مخصصة حسب وضعك المالي

**لتفعيل:**
1. اضغط على أيقونة الترس ⚙️
2. أدخل مفتاح Gemini API
3. اضغط حفظ
4. استمتع بتجربة محسّنة! 🚀`,
    default: `شكراً لسؤالك! 😊

لمزيد من المعلومات، يمكنك زيارة الأقسام التالية:
• 📊 **الميزانية العمومية** - لعرض الأصول والخصوم
• 📄 **قائمة الدخل** - لعرض الإيرادات والمصروفات
• 💡 **نصائح سريعة** - لتحسين استخدامك

أو اطرح سؤالك بشكل أكثر تحديداً وسأحاول مساعدتك!

**الكلمات المفتاحية المتاحة:**
مرحب، معادلة، كيف، تقرير، معاملة، تواصل، حساب، ميزانية، إهلاك، مسح، نصيحة`,
  },
  en: {
    welcome: `🌟 **Welcome to Motazin!**

I am your AI financial assistant. I can help you with:

📊 **Balance Management** - Accounting equation and account management
💳 **Transactions** - How to add and edit transactions
📄 **Reports** - Income statement, cash flow, export
💰 **Financial Analysis** - Ratios and indicators
❓ **Any other questions**

Type your question and I'll try to help!`,
    greeting: 'Hello and welcome! 🙋‍♂️\n\nHow can I help you manage your finances and accounts today?',
    equation: `📊 **Accounting Equation (Journal Entry)**

**Assets = Liabilities + Equity**

📌 **Simple Explanation:**
• **Assets**: Everything you own (Bank, Cash, Cars, Furniture, Buildings, Equipment)
• **Liabilities**: What you owe (Loans, Accounts Payable)
• **Equity**: Capital and retained earnings

✅ The site automatically checks the balance after each entry!

💡 **Example:**
If you buy a car for 15,000:
• Car account (Asset) increases ← Debit 15,000
• Bank account (Asset) decreases ← Credit 15,000
• Result: Assets = Assets ✅`,
    howto: `✅ **Motazin User Guide**

**1️⃣ Adding a New Transaction**
• Click the "Add Transaction" button (+)
• Enter: date, description, affected accounts
• Select debit or credit
• Enter the amount for each account
• Click save

**2️⃣ Recurring Transactions**
• Enable "Recurring Transaction" option
• Choose: daily, weekly, monthly, yearly
• Transactions will be created automatically

**3️⃣ Account Management**
• Add custom accounts
• Choose account type: Asset, Liability, Equity
• Set budgets for each account

**4️⃣ Reports**
• Balance Sheet
• Income Statement
• Cash Flow Statement
• Export to CSV or PDF

Start adding your transactions now! 🚀`,
    report: `📄 **Available Reports in Motazin**

**1️⃣ Balance Sheet**
• Shows Assets = Liabilities + Equity
• Auto-balance after each entry

**2️⃣ Income Statement**
• Shows revenues and expenses
• Net profit / loss

**3️⃣ Cash Flow Statement**
• Operating activities
• Investing activities
• Financing activities

**4️⃣ Financial Analysis**
• Current Ratio
• Debt-to-Equity Ratio
• Asset distribution chart
• Income & expenses chart
• Monthly profit trend

**📥 Export:**
• CSV export (for Excel)
• PDF export (for printing/sharing)

⚠️ Tip: Use reports to track your business performance!`,
    transaction: `💳 **Managing Transactions**

**🔹 Adding a New Transaction:**
1. Click the (+) button at the bottom (or "Add Transaction" in menu)
2. Enter transaction date (e.g., 1/1)
3. Write a clear description
4. Add affected accounts (you can add more than 2)
5. For each account: choose debit or credit
6. Enter the amount
7. Click "Add Transaction"

**🔸 Editing a Transaction:**
• Hover over the transaction in the table
• Click the pencil icon (edit)
• Modify the required data
• Click "Save Changes"

**🗑️ Deleting Transactions:**
• Individual delete: trash icon
• Bulk delete: check boxes → "Delete Selected"
• Clear all: trash button in menu

**💡 Tip:**
Use clear descriptions for easy reference later!`,
    contact: `📧 **Contact the Developer**

You can reach me via:
📧 **Email:** abdullahalalawi52@gmail.com
📍 **Address:** Muscat, Sultanate of Oman

Or through the "Contact Us" page - send a direct message and you'll be replied to soon!`,
    accounts: `🏦 **Chart of Accounts in Motazin**

**Assets:**
🟢 Bank, Cash, Cars, Furniture, Buildings
🟢 Equipment, Inventory, AR, Land
🟢 Investments, Intangible Assets, Goodwill

**Liabilities:**
🔴 Accounts Payable, Short/Long-term Loans
🔴 Accrued Expenses, Unearned Revenues

**Equity:**
🟣 Capital, Share Capital, Retained Earnings
🟣 Revenue, Expenses, Drawings

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

// --- Text Normalization for Flexible Arabic/English Matching ---
function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();
  // Arabic normalization
  normalized = normalized.replace(/[أإآا]/g, 'ا');
  normalized = normalized.replace(/ة/g, 'ه');
  normalized = normalized.replace(/ى/g, 'ي');
  normalized = normalized.replace(/ؤ/g, 'ء');
  normalized = normalized.replace(/ئ/g, 'ء');
  normalized = normalized.replace(/[ًٌٍَُِّ]/g, ''); // Remove Harakat
  // Strip common Arabic prefixes like "ال" (definitiveness) to match raw stems
  // Fixed: \w does not match Arabic chars, so use \S+ to match any non-space characters
  normalized = normalized.replace(/(^|\s)ال(\S+)/g, '$1$2');
  return normalized;
}

// --- Enhanced Keyword Matching with Score Weighting ---
const KEYWORDS: Record<string, { keywords: string[], replyKey: string, weight?: number }[]> = {
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
    { keywords: ['نصيح', 'تلميح', 'اختصار', 'مختصر', 'سريع', 'ميزه', 'افضل', 'طريقه صحيحه', 'ارشادات'], replyKey: 'tips', weight: 3 },
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

// --- Financial Analysis Helpers (for static context-aware replies) ---
function getFinancialAnalysis(context: FinancialContext | undefined, language: string): string | null {
  if (!context || context.transactionCount === 0) return null;

  const isAr = language === 'ar';

  // Build a dynamic analysis based on actual data
  let analysis = isAr
    ? `📊 **تحليل سريع لبياناتك المالية**\n\n`
    : `📊 **Quick Financial Analysis**\n\n`;

  // Balance status
  if (context.isBalanced) {
    analysis += isAr
      ? `✅ **الميزانية متوازنة** - الأصول = الخصوم + حقوق الملكية\n`
      : `✅ **Balanced Sheet** - Assets = Liabilities + Equity\n`;
  } else {
    analysis += isAr
      ? `⚠️ **الميزانية غير متوازنة** - يرجى مراجعة المعاملات!\n`
      : `⚠️ **Unbalanced Sheet** - Please review your transactions!\n`;
  }

  // Key metrics
  analysis += `\n${isAr ? '• **إجمالي الأصول**:' : '• **Total Assets**:'} ${context.totalAssets.toLocaleString()}\n`;
  analysis += `${isAr ? '• **إجمالي الخصوم**:' : '• **Total Liabilities**:'} ${context.totalLiabilities.toLocaleString()}\n`;
  analysis += `${isAr ? '• **حقوق الملكية**:' : '• **Equity**:'} ${context.totalEquity.toLocaleString()}\n`;
  analysis += `${isAr ? '• **عدد المعاملات**:' : '• **Transactions**:'} ${context.transactionCount}\n`;

  // Net profit
  if (context.netProfit !== 0) {
    const profitEmoji = context.netProfit >= 0 ? '📈' : '📉';
    analysis += `\n${profitEmoji} ${isAr ? '**صافي الربح/الخسارة**:' : '**Net Profit/Loss**:'} ${context.netProfit.toLocaleString()}\n`;
  }

  // Current Ratio
  analysis += `\n${isAr ? '• **نسبة السيولة (Current Ratio)**:' : '• **Current Ratio**:'} ${context.currentRatio.toFixed(2)}`;
  if (context.currentRatio >= 1.5) {
    analysis += ` ${isAr ? '✅ ممتازة' : '✅ Healthy'}`;
  } else if (context.currentRatio >= 1) {
    analysis += ` ${isAr ? '⚠️ مقبولة' : '⚠️ Acceptable'}`;
  } else {
    analysis += ` ${isAr ? '🔴 منخفضة - انتبه!' : '🔴 Low - Caution!'}`;
  }

  // Debt to Equity
  analysis += `\n${isAr ? '• **نسبة الديون إلى الملكية**:' : '• **Debt-to-Equity Ratio**:'} ${context.debtToEquity.toFixed(2)}`;
  if (context.debtToEquity > 2) {
    analysis += ` ${isAr ? '⚠️ مرتفعة' : '⚠️ High'}`;
  } else if (context.debtToEquity > 0) {
    analysis += ` ${isAr ? '✅ ضمن الحدود الطبيعية' : '✅ Within normal range'}`;
  }

  analysis += `\n\n${isAr ? '💡 استمر في إضافة المعاملات للحصول على تحليل أكثر دقة!' : '💡 Keep adding transactions for more accurate analysis!'}`;

  return analysis;
}

const STORAGE_KEY = 'motazin_chat_messages';
const API_KEY_STORAGE_KEY = 'motazin_gemini_chat_key';

export function ChatWidget(props: ChatWidgetProps) {
  const { financialContext, geminiApiKey: externalApiKey, onApiKeyChange } = props;
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lang = language === 'ar' ? 'ar' : 'en';
  const replies = AUTO_REPLIES[lang];
  const keywords = KEYWORDS[lang];

  // Determine if AI is available (assume backend handles it by default, or fallback to user key)
  const effectiveApiKey = externalApiKey || localApiKey;
  const isAiAvailable = true; // Assume AI is available via our secure backend

  // Welcome message on first open
  const hasSentWelcome = useRef(false);
  useEffect(() => {
    if (isOpen && messages.length === 0 && !hasSentWelcome.current) {
      hasSentWelcome.current = true;
      let welcomeText = replies.welcome;

      // Add financial context if available
      if (financialContext && financialContext.transactionCount > 0) {
        welcomeText += `\n\n📊 ${language === 'ar' ? 'لديّ **بياناتك المالية** وأستطيع مساعدتك في تحليلها!' : 'I have your **financial data** and can help analyze it!'}`;
      }

      // Add AI availability if key exists
      if (isAiAvailable) {
        welcomeText += `\n🤖 ${language === 'ar' ? 'الذكاء الاصطناعي مفعل! اسألني أي سؤال وسأحاول الإجابة بدقة!' : 'AI is active! Ask me anything and I\'ll try to answer accurately!'}`;
      } else {
        welcomeText += `\n⚙️ ${language === 'ar' ? 'لتفعيل الذكاء الاصطناعي، أدخل مفتاح Gemini API في الإعدادات (الترس ⚙️)' : 'To enable AI, enter your Gemini API key in settings (gear icon ⚙️)'}`;
      }

      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'bot',
        text: welcomeText,
        timestamp: Date.now(),
        isAi: false
      };
      const newMessages = [welcomeMsg];
      setMessages(newMessages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const saveApiKey = () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, localApiKey);
    if (onApiKeyChange) {
      onApiKeyChange(localApiKey);
    }
    setShowSettings(false);
    setHasError(false);

    // Add a system message about activation
    if (localApiKey.trim()) {
      const activationMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'bot',
        text: isAiAvailable
          ? (language === 'ar' ? '✅ تم حفظ المفتاح! الذكاء الاصطناعي نشط الآن. اسألني أي سؤال.' : '✅ Key saved! AI is now active. Ask me anything.')
          : (language === 'ar' ? '❌ المفتاح غير صالح، يرجى التحقق.' : '❌ Invalid key, please check.'),
        timestamp: Date.now(),
        isAi: false
      };
      const newMessages = [...messages, activationMsg];
      setMessages(newMessages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    }
  };

  const findReply = (text: string): string => {
    const normalizedInput = normalizeText(text);

    // Check for financial context queries
    if (financialContext && financialContext.transactionCount > 0) {
      // Check if asking about financial totals
      const balanceKeywords = financialContext?.totalAssets !== undefined ?
        (language === 'ar'
          ? ['رصيد', 'مبلغ', 'مجموع', 'اجمالي', 'كم', 'قيمه', 'ميزاني', 'اصول', 'خصوم', 'حقوق', 'ربح', 'خساره']
          : ['balance', 'total', 'amount', 'how much', 'assets', 'liabilities', 'equity', 'profit', 'loss', 'net income', 'ratio'])
        : [];

      const isFinancialQuery = balanceKeywords.some(k => normalizedInput.includes(normalizeText(k)));

      if (isFinancialQuery) {
        // Check specific account queries
        const accountMap: Record<string, string> = language === 'ar'
          ? { 'بنك': 'bank', 'نقد': 'cash', 'سياره': 'cars', 'اثاث': 'furniture', 'مخزون': 'inventory', 'معدات': 'equipment', 'مباني': 'buildings', 'اراضي': 'land' }
          : { 'bank': 'bank', 'cash': 'cash', 'car': 'cars', 'furniture': 'furniture', 'inventory': 'inventory', 'equipment': 'equipment', 'building': 'buildings', 'land': 'land' };

        for (const [key, accountId] of Object.entries(accountMap)) {
          if (normalizedInput.includes(normalizeText(key))) {
            const amount = financialContext.accounts[accountId] || 0;
            if (amount !== 0) {
              const accountName = language === 'ar'
                ? (t(accountId) || accountId)
                : (accountId === 'cars' ? 'Cars' : t(accountId) || accountId);
              return language === 'ar'
                ? `💰 **رصيد ${accountName}:** ${amount.toLocaleString()}\n\n(بيانات من سجلاتك المالية)`
                : `💰 **${accountName} Balance:** ${amount.toLocaleString()}\n\n(From your financial records)`;
            } else {
              return language === 'ar'
                ? `ℹ️ لا يوجد رصيد مسجل لهذا الحساب. أضف معاملة جديدة لتسجيله.`
                : `ℹ️ No balance recorded for this account. Add a new transaction to record it.`;
            }
          }
        }

        // General financial summary
        return getFinancialAnalysis(financialContext, language) || replies.default;
      }
    }

    // Check keyword groups using Score-based matching (choose the category with most matching points)
    let bestMatchKey = '';
    let highestScore = 0;

    for (const group of keywords) {
      let score = 0;
      for (const k of group.keywords) {
        const normalizedKeyword = normalizeText(k);
        if (normalizedInput.includes(normalizedKeyword)) {
          // Score matches: exact matches and stem matches get points based on keyword weight
          score += (group.weight || 1);
          if (normalizedInput === normalizedKeyword) {
            score += 2; // Extra bonus for exact match
          }
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatchKey = group.replyKey;
      }
    }

    if (highestScore > 0 && bestMatchKey) {
      let reply = replies[bestMatchKey as keyof typeof replies];

      // Append financial context if relevant
      if (bestMatchKey === 'equation' && financialContext && financialContext.transactionCount > 0) {
        const status = financialContext.isBalanced
          ? (language === 'ar' ? '✅ ميزانيتك الحالية متوازنة!' : '✅ Your current balance sheet is balanced!')
          : (language === 'ar' ? '⚠️ ميزانيتك الحالية غير متوازنة!' : '⚠️ Your current balance sheet is unbalanced!');
        reply += `\n\n📊 ${status}`;
      }

      return reply;
    }

    // Check if asking about financial data specifically
    if (normalizedInput.includes('تحليل') || normalizedInput.includes('analysis') || normalizedInput.includes('financial')) {
      const analysis = getFinancialAnalysis(financialContext, language);
      if (analysis) return analysis;
    }

    return replies.default;
  };

  const callGeminiApi = async (chatHistory: ChatMessage[], newText: string, context: FinancialContext | undefined) => {
    const apiKey = effectiveApiKey?.trim();
    // We no longer return null if !apiKey, because we will rely on the secure backend /api/chat

    try {
      // Build context for Gemini
      let systemPrompt = language === 'ar'
        ? 'أنت مستشار مالي ومحاسب قانوني ذكي. اسمك "متزن" (Motazin). هدفك مساعدة المستخدم في إدارة أمواله، إدخال القيود المزدوجة، وتحليل ميزانيته. أجب بلغة عربية احترافية ومبسطة لتناسب غير المحاسبين. كن مختصراً ومباشراً، واستخدم التنسيق العريض (**Bold**) للكلمات المهمة، وضع النصائح في نقاط واضحة، مع استخدام الرموز التعبيرية بحكمة لتجميل النص.'
        : 'You are an expert financial advisor and smart accountant. Your name is "Motazin". Your goal is to help the user manage their finances, enter double-entry transactions, and analyze their balance sheet. Answer in highly professional yet simple English suitable for non-accountants. Be concise, use bold (**Bold**) formatting for important terms, put tips in clear bullet points, and use emojis wisely.';

      if (context && context.transactionCount > 0) {
        systemPrompt += language === 'ar'
          ? `\n\nالبيانات المالية الحالية للمستخدم:\n- إجمالي الأصول: ${context.totalAssets}\n- إجمالي الخصوم: ${context.totalLiabilities}\n- حقوق الملكية: ${context.totalEquity}\n- صافي الربح: ${context.netProfit}\n- نسبة السيولة: ${context.currentRatio.toFixed(2)}\n- الميزانية ${context.isBalanced ? 'متوازنة ✅' : 'غير متوازنة ⚠️'}\nعدد المعاملات: ${context.transactionCount}`
          : `\n\nCurrent financial data:\n- Total Assets: ${context.totalAssets}\n- Total Liabilities: ${context.totalLiabilities}\n- Equity: ${context.totalEquity}\n- Net Profit: ${context.netProfit}\n- Current Ratio: ${context.currentRatio.toFixed(2)}\n- Balance is ${context.isBalanced ? 'Balanced ✅' : 'Unbalanced ⚠️'}\n- Transaction count: ${context.transactionCount}`;

        // Add detailed accounts breakdown
        if (context.accounts) {
          const nonZeroAccounts = Object.entries(context.accounts).filter(([_, val]) => val !== 0);
          if (nonZeroAccounts.length > 0) {
            // Note: Assuming t() is available in the component scope
            const accountDetails = nonZeroAccounts.map(([key, val]) => `- ${t(key) || key}: ${val}`).join('\n');
            systemPrompt += language === 'ar' 
              ? `\n\nتفاصيل الأرصدة الدقيقة لكل حساب:\n${accountDetails}`
              : `\n\nDetailed Account Balances:\n${accountDetails}`;
          }
        }
      }

      // Convert chat history to Gemini format, ensuring alternating roles
      // Filter out static messages, keep only user and actual AI responses
      const validHistory = chatHistory.filter(msg => msg.role === 'user' || msg.isAi).slice(-10);

      const contents: { role: string, parts: { text: string }[] }[] = [];

      for (const msg of validHistory) {
        const role = msg.role === 'user' ? 'user' : 'model';
        // Gemini API strictly requires alternating roles. Combine consecutive messages.
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += '\n\n' + msg.text;
        } else {
          contents.push({ role, parts: [{ text: msg.text }] });
        }
      }

      // Add the new user message
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += '\n\n' + newText;
      } else {
        contents.push({ role: 'user', parts: [{ text: newText }] });
      }

      let response;
      if (apiKey) {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }]
              },
              contents: contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
              }
            })
          }
        );
      } else {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: contents
          })
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Gemini API error:', response.status, errData);
        if (response.status === 429) {
          return "RATE_LIMIT_EXCEEDED";
        }
        return null;
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return reply || null;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return null;
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
    setInput('');
    setIsTyping(true);

    // Determine delay (longer for AI, shorter for static)
    const useAi = isAiAvailable;
    const delay = useAi ? 600 + Math.random() * 400 : 800 + Math.random() * 600;

    setTimeout(async () => {
      let botReply: string;
      let isAi = false;

      if (useAi) {
        // Try AI first
        const aiReply = await callGeminiApi(messages, text, financialContext);
        if (aiReply === "RATE_LIMIT_EXCEEDED") {
          botReply = language === 'ar'
            ? '⏳ **عذراً، لقد تجاوزت الحد المسموح به للطلبات (Rate Limit).**\nيرجى الانتظار دقيقة واحدة ثم المحاولة مرة أخرى.'
            : '⏳ **Sorry, you have exceeded the rate limit.**\nPlease wait a minute and try again.';
          isAi = false;
          setHasError(true);
        } else if (aiReply) {
          botReply = aiReply;
          isAi = true;
          setHasError(false);
        } else {
          // AI Failed (e.g. invalid key, quota exceeded, 400 error)
          botReply = language === 'ar'
            ? '⚠️ **عذراً، فشل الاتصال بالذكاء الاصطناعي.**\nيرجى التأكد من أن مفتاح Gemini API الخاص بك صحيح ويعمل، أو تحقق من اتصال الإنترنت. (يمكنك مراجعة نافذة الـ Console بالضغط على F12 لمعرفة الخطأ بالتفصيل).'
            : '⚠️ **Sorry, connection to AI failed.**\nPlease ensure your Gemini API key is valid and working. (Check the Console using F12 for detailed error).';
          setHasError(true);
        }
      } else {
        botReply = findReply(text);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: botReply,
        timestamp: Date.now(),
        isAi
      };
      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalMessages));
      setIsTyping(false);
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (window.confirm(language === 'ar' ? 'هل تريد مسح المحادثة وبدء محادثة جديدة؟' : 'Are you sure you want to start a new chat?')) {
      hasSentWelcome.current = false;
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-24 md:bottom-10 right-4 md:right-10 z-[9999] p-4 rounded-2xl shadow-2xl transition-all duration-300 group",
          isOpen
            ? "bg-rose-500 hover:bg-rose-600 scale-110 rotate-90"
            : "bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 hover:scale-110"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            {/* AI Badge */}
            {isAiAvailable && (
              <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-indigo-700">
                <Sparkles className="w-2 h-2 text-white" />
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-40 md:bottom-28 right-4 md:right-10 z-[9998] w-[calc(100%-32px)] md:w-[400px] max-h-[600px] h-[500px] glass dark:bg-slate-900/95 bg-white/95 rounded-3xl border dark:border-white/10 border-slate-200 shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right",
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-75 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-white/10 border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30 relative">
              <MessageCircle className="w-5 h-5 text-indigo-400" />
              {isAiAvailable && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-1.5 h-1.5 text-white" />
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold dark:text-white text-slate-900">
                {language === 'ar' ? 'المساعد الافتراضي' : 'Virtual Assistant'}
              </h3>
              <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {isAiAvailable
                  ? (language === 'ar' ? 'ذكي (AI)' : 'AI Powered')
                  : (language === 'ar' ? 'متصل' : 'Online')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Settings Button */}
            {hasError && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  showSettings
                    ? "bg-indigo-500/20 text-indigo-500"
                    : "dark:text-slate-400 text-slate-500 hover:bg-indigo-500/20 hover:text-indigo-500"
                )}
                title={language === 'ar' ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            {/* Clear Button */}
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold dark:text-slate-300 text-slate-600 hover:bg-indigo-500/20 hover:text-indigo-500 rounded-xl transition-all"
              title={language === 'ar' ? 'محادثة جديدة' : 'New Chat'}
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'محادثة جديدة' : 'New Chat'}</span>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 border-b dark:border-white/10 border-slate-200 bg-indigo-500/5 flex-shrink-0 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold dark:text-white text-slate-900">
                {language === 'ar' ? 'مفتاح Gemini API' : 'Gemini API Key'}
              </span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline ml-auto"
              >
                {language === 'ar' ? 'الحصول على مفتاح' : 'Get API Key'}
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل المفتاح هنا...' : 'Enter your API key...'}
                className="flex-1 px-3 py-2 rounded-xl border dark:border-white/10 border-slate-200 dark:bg-slate-800/50 bg-slate-100 dark:text-white text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={saveApiKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
            <p className="text-[9px] dark:text-slate-500 text-slate-400 mt-2">
              {language === 'ar'
                ? 'المفتاح يُحفظ محلياً فقط ولا يُرسل إلى أي خادم آخر.'
                : 'The key is stored locally only and never sent anywhere else.'}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2 animate-fade-in",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'bot' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center relative">
                  {msg.isAi ? (
                    <>
                      <Brain className="w-4 h-4 text-indigo-400" />
                      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-1.5 h-1.5 text-white" />
                      </span>
                    </>
                  ) : (
                    <Bot className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user'
                    ? "bg-indigo-600 text-white rounded-br-md"
                    : "dark:bg-slate-800 bg-slate-100 dark:text-white text-slate-900 rounded-bl-md"
                )}
              >
                <div className="whitespace-pre-line">
                  {msg.text.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('`') && part.endsWith('`')) {
                      return <code key={i} className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-[13px] font-mono">{part.slice(1, -1)}</code>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
                <div className={cn(
                  "flex items-center gap-1 mt-1",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  <Clock className="w-3 h-3 opacity-60" />
                  <span className="text-[9px] opacity-60">{formatTime(msg.timestamp)}</span>
                  {msg.role === 'user' && (
                    <Check className="w-3 h-3 text-emerald-400" />
                  )}
                  {msg.role === 'bot' && msg.isAi && (
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400 opacity-60" />
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                {isAiAvailable ? (
                  <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
                ) : (
                  <Bot className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <div className="dark:bg-slate-800 bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 dark:bg-white/40 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 dark:bg-white/40 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 dark:bg-white/40 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Status Bar */}
        {financialContext && financialContext.transactionCount > 0 && (
          <div className="px-4 py-1.5 border-t dark:border-white/5 border-slate-100 dark:bg-slate-900/50 bg-slate-50/80 flex-shrink-0">
            <div className="flex items-center gap-2 justify-center">
              <BarChart3 className="w-3 h-3 text-indigo-400" />
              <span className="text-[9px] dark:text-slate-400 text-slate-500">
                {language === 'ar'
                  ? `${financialContext.transactionCount} معاملة | ${isAiAvailable ? 'AI نشط 🧠' : 'الردود التلقائية'}`
                  : `${financialContext.transactionCount} transactions | ${isAiAvailable ? 'AI Active 🧠' : 'Auto-replies'}`}
              </span>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t dark:border-white/10 border-slate-200 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
              className="flex-1 px-4 py-3 rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-slate-800/50 bg-slate-100 dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition-all active:scale-95 relative"
            >
              {isAiAvailable ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-[10px] dark:text-slate-500 text-slate-400 mt-2 text-center">
            {isAiAvailable
              ? (language === 'ar' ? '🧠 يستخدم الذكاء الاصطناعي للإجابة على أسئلتك' : '🧠 AI-powered responses to your questions')
              : (language === 'ar' ? 'المساعد يرد تلقائياً - فعّل AI للحصول على إجابات أكثر ذكاءً' : 'Auto-replies active - enable AI for smarter answers')}
          </p>
        </div>
      </div>
    </>
  );
}