import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { createWorker } from 'tesseract.js';
import { UploadCloud, CheckCircle2, FileText, X, AlertCircle, Image, FileSpreadsheet, Presentation } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from './i18n';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ParsedRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  accountId: string;
  selected: boolean;
}

interface FileScannerProps {
  onImport: (rows: any[]) => void;
  onClose: () => void;
}

export const FileScanner: React.FC<FileScannerProps> = ({ onImport, onClose }) => {
  const { t, dir } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [rawText, setRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState<'ara+eng' | 'ara' | 'eng'>('ara+eng');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setParsedRows([]);
      setProgress(0);
      
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.pdf')) {
        await processPdf(file);
      } else if (fileName.match(/\.(png|jpg|jpeg|webp)$/)) {
        await processImage(file);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        await processExcel(file);
      } else if (fileName.endsWith('.docx')) {
        await processWord(file);
      } else if (fileName.endsWith('.pptx')) {
        await processPowerPoint(file);
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error processing file');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatus('');
    }
  };

  const processPdf = async (file: File) => {
    setStatus('Extracting PDF text...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(Math.round((i / pdf.numPages) * 100));
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        let lastY = -1;
        let lineText = '';
        const items = content.items as any[];
        
        items.forEach((item) => {
          const y = Math.round(item.transform[5]);
          if (lastY !== -1 && Math.abs(lastY - y) > 5) {
            fullText += lineText + '\n';
            lineText = '';
          }
          lineText += item.str + ' ';
          lastY = y;
        });
        if (lineText) fullText += lineText + '\n';
    }
    extractTransactions(fullText);
  };

  const processImage = async (file: File) => {
    setStatus('Preprocessing image for higher accuracy...');
    
    // 1. Create a canvas to process the image
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // 2. Increase DPI by 3x for maximum OCR precision on financial digits
    canvas.width = img.width * 3;
    canvas.height = img.height * 3;
    
    // Background white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // 3. Financial Document Optimization: Precise Grayscale & High Contrast
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Use standard luminance weights for better grayscale
      const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Improved thresholding: anything dark becomes blacker, anything light becomes pure white
      // This is better than sharpening for digital screenshots.
      const val = avg > 200 ? 255 : (avg < 150 ? 0 : avg);
      
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);
    
    // 4. Skip slow sharpening for digital images - it adds noise.
    // Instead, we rely on the 2x scaling and high-contrast thresholding.

    setStatus('Initializing OCR engine...');
    const worker = await createWorker(ocrLanguage, 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
          setStatus(`Recognizing ${ocrLanguage.toUpperCase()} text...`);
        }
      }
    });

    try {
      // 4. Recognize from processed canvas
      const { data: { text } } = await worker.recognize(canvas);
      setRawText(text);
      extractTransactions(text);
      URL.revokeObjectURL(objectUrl);
    } finally {
      await worker.terminate();
    }
  };

  const processExcel = async (file: File) => {
    setStatus('Reading spreadsheet data...');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Better way: convert to JSON rows to maintain column integrity
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const results: ParsedRow[] = [];
    
    const dateRegex = /(\d{1,4}[\/\-.]\d{1,2}[\/\-.](?:\d{2,4})?|\d{1,2}[\/\-.]\d{1,2})/;
    
    for (const row of rows) {
      if (!row || row.length < 2) continue;
      
      let foundDate = '';
      let foundAmount: number | null = null;
      let descriptionParts: string[] = [];

      for (const cell of row) {
        if (cell === null || cell === undefined) continue;
        const cellStr = String(cell).trim();
        
        // Try to find a date
        if (!foundDate) {
          const dm = cellStr.match(dateRegex);
          if (dm) foundDate = dm[1];
        }

        // Try to find an amount (numeric cell or string with numbers)
        if (typeof cell === 'number') {
          if (foundAmount === null || Math.abs(cell) > 0) foundAmount = Math.abs(cell);
        } else {
          const cleanAmt = cellStr.replace(/[^\d.-]/g, '');
          const val = parseFloat(cleanAmt);
          if (!isNaN(val) && Math.abs(val) > 0 && foundAmount === null) {
            foundAmount = Math.abs(val);
          } else if (cellStr.length > 2) {
            descriptionParts.push(cellStr);
          }
        }
      }

      if (foundDate && foundAmount !== null) {
        results.push({
          id: Math.random().toString(36).substr(2, 9),
          date: foundDate,
          description: descriptionParts.join(' ') || 'Excel Transaction',
          amount: foundAmount,
          accountId: 'cash',
          selected: true
        });
      }
    }

    if (results.length === 0) {
      setError('No valid transactions detected in Excel. Please ensure columns for date and amount exist.');
    } else {
      setParsedRows(results);
    }
  };

  const processWord = async (file: File) => {
    setStatus('Reading Word document...');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    extractTransactions(result.value);
  };

  const processPowerPoint = async (file: File) => {
    setStatus('Parsing PowerPoint slides...');
    const zip = await JSZip.loadAsync(file);
    let fullText = '';
    
    const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
    
    for (let i = 0; i < slideFiles.length; i++) {
      setProgress(Math.round((i / slideFiles.length) * 100));
      const content = await zip.file(slideFiles[i])?.async('string');
      if (content) {
        // Simple XML tag stripping to get text nodes <a:t>
        const textNodes = content.match(/<a:t>.*?<\/a:t>/g) || [];
        const slideText = textNodes.map(node => node.replace(/<[^>]+>/g, '')).join(' ');
        fullText += slideText + '\n';
      }
    }
    extractTransactions(fullText);
  };

  const extractTransactions = (text: string) => {
    const convertArabicDigits = (str: string) => {
      return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    };

    const normalizedText = convertArabicDigits(text);
    const lines = normalizedText.split('\n');
    const results: ParsedRow[] = [];
    
    // 1. Optimized Date Detection
    const dateRegex = /\b(\d{1,4}[\/\-.]\d{1,2}[\/\-.](?:\d{2,4})?|\d{1,2}[\/\-.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:,)? \d{2,4})\b/i;
    let globalDate = new Date().toLocaleDateString('en-GB');
    
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const dm = lines[i].match(dateRegex);
      if (dm) {
        globalDate = dm[1];
        break;
      }
    }

    // 2. Financial Number Regex: Handles negatives in brackets (1,200), decimals, and commas
    const amountRegex = /((?:\()?\d+(?:[.,\s]\d{3})*(?:[.,]\d+)?(?:\))?)/g;

    let pendingDescription = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length < 2) return;

      // Extract all potential amounts
      const amountsFound: { value: number; raw: string; index: number }[] = [];
      let match;
      amountRegex.lastIndex = 0;
      
      while ((match = amountRegex.exec(trimmed)) !== null) {
        let raw = match[1];
        let isNegative = false;
        if (raw.startsWith('(') && raw.endsWith(')')) {
          isNegative = true;
          raw = raw.slice(1, -1);
        }
        
        // --- AGGRESSIVE FINANCIAL NUMBER CLEANING ---
        // 1. Remove ALL spaces & common OCR noise (often sees "3 , 800" or "3800 . 00")
        // Also swap common misreads: 'O' or 'o' instead of '0'
        let clean = raw.replace(/\s/g, '').replace(/o/gi, '0').replace(/[—–-]$/, '');
        
        // 2. Handle Thousands vs Decimal Separators
        if (clean.includes(',') && clean.includes('.')) {
          clean = clean.replace(/,/g, '');
        } else if (clean.includes(',')) {
          const parts = clean.split(',');
          if (parts[parts.length - 1].length === 3) {
            clean = clean.replace(/,/g, ''); 
          } else {
            clean = clean.replace(/,/g, '.');
          }
        }
        
        // Final sanity: remove trailing punctuation that might be noise
        clean = clean.replace(/[.,]$/, '');
        
        const val = parseFloat(clean);
        
        // Smart Year Filtering: Ignore numbers that look like years (2020-2035)
        const looksLikeYear = /^\d{4}$/.test(clean) && val >= 2020 && val <= 2035;
        const hasDecimal = clean.includes('.');
        
        if (!isNaN(val) && (Math.abs(val) > 0.01) && (!looksLikeYear || hasDecimal)) {
          // Force positive unless explicitly negative (brackets) to avoid lines/noise being read as minus
          const finalVal = isNegative ? -Math.abs(val) : Math.abs(val);
          amountsFound.push({ value: finalVal, raw: match[1], index: match.index });
        }
      }

      // If no amounts, this could be a header or description for the next line
      if (amountsFound.length === 0) {
        if (trimmed.length < 60 && !trimmed.toLowerCase().includes('balance sheet') && !/page|صفحة/i.test(trimmed)) {
          pendingDescription = trimmed;
        }
        return;
      }

      // Process amounts on the line
      let lastEnd = 0;
      amountsFound.forEach((amt, idx) => {
        let rawDesc = trimmed.substring(lastEnd, amt.index).trim();
        
        // Handle multi-column scenarios: if no description before amount, maybe it's in the pending buffer
        if ((!rawDesc || rawDesc.length < 2) && pendingDescription && idx === 0) {
           rawDesc = pendingDescription;
           pendingDescription = '';
        }

        // If description is still empty/short, use whatever follows the amount on the same line
        if ((!rawDesc || rawDesc.length < 2) && idx === amountsFound.length - 1) {
           rawDesc = trimmed.substring(amt.index + amt.raw.length).trim();
        }
        
        // Final fallback: if still empty, check if description follows the amount but NOT at the end
        if ((!rawDesc || rawDesc.length < 2) && idx < amountsFound.length - 1) {
           rawDesc = trimmed.substring(amt.index + amt.raw.length, amountsFound[idx+1].index).trim();
        }

        lastEnd = amt.index + amt.raw.length;

        // Cleanup noise from description (including underscores/lines)
        let desc = rawDesc.replace(/[٠١٢٣٤٥٦٧٨٩]/g, '').replace(/[|\\/_#*~=+<>—–-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!desc || desc.length < 2) desc = `Detected Item (${amt.raw})`;

        const d = desc.toLowerCase();
        // Smarter total line detection: handle various wordings and missing punctuation
        const isTotalLine = /\btotal\b|إجمالي|مجموع|صافي|net\b|liabilities.*equity|shareholders.*funds|total.*assets|total.*liabilities/i.test(d);
        
        // --- ADANCED ACCOUNT MAPPING DICTIONARY ---
        let guessedAccountId = 'bank';
        
        const keywords = {
          cash: ['cash', 'نقد', 'صندوق', 'خزينة', 'petty', 'funds', 'نقداً', 'كاش', 'سيولة', 'مقبوضات'],
          bank: ['bank', 'بنك', 'مصرف', 'stc', 'pay', 'rajhi', 'ahli', 'alinma', 'riyad', 'تحويل', 'سداد', 'مدى', 'فيزا', 'ماستركارد', 'إنماء', 'بلاد', 'فرنسي', 'حوالة', 'راجحي', 'أهلي'],
          ar: ['receivable', 'مدينون', 'عملاء', 'ذمم مدينة', 'customers', 'debtor', 'ar', 'مطلوبات', 'على الحساب', 'مديوينة', 'حسابات العملاء'],
          ap: ['payable', 'دائنون', 'موردون', 'ذمم دائنة', 'vendors', 'suppliers', 'ap', 'creditor', 'لصالح', 'مطالبة', 'التزامات تجارية', 'موردين', 'مستحقات'],
          inventory: ['inventory', 'مخزون', 'بضاعة', 'stock', 'goods', 'مواد', 'قطع غيار', 'سعلة'],
          fixed_assets: ['fixed', 'asset', 'ppe', 'property', 'plant', 'equipment', 'furniture', 'car', 'vehicle', 'land', 'building', 'أثاث', 'مكتب', 'عقارات', 'سيارات', 'معدات', 'آلات', 'تجهيزات', 'كمبيوتر', 'ممتلكات', 'رأسمالية'],
          goodwill: ['goodwill', 'شهرة', 'محل'],
          intangible: ['intangible', 'غير ملموسة', 'براءة', 'trademark', 'ملكية فكرية', 'حقوق'],
          loan: ['loan', 'debt', 'borrow', 'financing', 'قرض', 'تمويل', 'تسهيلات', 'دين', 'مديونية', 'قروض'],
          accrued: ['accrued', 'outstanding', 'payable', 'مستحق', 'مطالبة', 'مستحقات'],
          prepaid: ['prepaid', 'advance', 'deposit', 'مقدم', 'تأمين', 'عربون', 'مدفوعات مقدماً'],
          capital: ['capital', 'stockholder', 'shareholder', 'equity', 'share capital', 'رأس مال', 'مساهمة', 'حقوق الملكية', 'شركاء', 'حقوق مساهمين', 'استثمار'],
          retained: ['retained', 'earning', 'surplus', 'retained earnings', 'أرباح', 'محتجزة', 'مبقاة', 'توزيعات', 'احتياطي'],
          revenue: ['revenue', 'sales', 'service', 'income', 'إيراد', 'مبيعات', 'خدمات', 'بيع', 'أتعاب', 'دخل'],
          expenses: ['expense', 'cost', 'مصروف', 'تكلفة', 'أجور', 'رواتب', 'فاتورة', 'إيجار', 'صيانة', 'كهرباء', 'مياه', 'اتصالات', 'بنزين', 'سفر', 'إعاشة']
        };

        // Score-based matching for better accuracy
        let bestCategory = 'bank';
        let maxScore = 0;

        Object.entries(keywords).forEach(([id, terms]) => {
          let score = 0;
          terms.forEach(term => {
            if (d.includes(term)) {
              score += term.length; // Longer matches get higher scores
            }
          });
          if (score > maxScore) {
            maxScore = score;
            bestCategory = id;
          }
        });

        // Resolve aliases to final IDs
        const categoryMap: Record<string, string> = {
          ppe: 'ppe',
          fixed_assets: 'fixed_assets',
          goodwill: 'goodwill',
          intangible: 'intangible_assets',
          loan: 'borrowed_money',
          accrued: 'accrued_expenses',
          prepaid: 'prepaid_expenses',
          retained: 'retained_earnings',
          capital: 'share_capital'
        };
        
        // If it's a total/summary line, we don't want it hitting a specific account like 'share_capital'
        guessedAccountId = isTotalLine ? 'cash' : (categoryMap[bestCategory] || bestCategory);

        if (!results.some(r => r.amount === Math.abs(amt.value) && r.description === desc)) {
          results.push({
            id: Math.random().toString(36).substr(2, 9),
            date: globalDate,
            description: desc,
            amount: Math.abs(amt.value),
            accountId: guessedAccountId,
            selected: !isTotalLine,
          });
        }
      });
    });

    if (results.length === 0) {
      const snippet = text.slice(0, 150).replace(/\n/g, ' ');
      setError(`No patterns found. Recognized: "${snippet}..."`);
    } else {
      setParsedRows(results);
    }
  };



  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleToggleRow = (id: string) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const handleUpdateRow = (id: string, field: keyof ParsedRow, value: any) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddManualRow = () => {
     setParsedRows(prev => [...prev, {
       id: Math.random().toString(36).substr(2, 9),
       date: new Date().toLocaleDateString('en-GB'),
       description: 'Manual Transaction',
       amount: 0,
       accountId: 'cash',
       selected: true
     }]);
  };

  const handleImport = () => {
    const selectedRows = parsedRows.filter(r => r.selected);
    onImport(selectedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={dir}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative transition-colors duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-theme-primary hover:text-indigo-600 dark:hover:text-white transition-all opacity-70 hover:opacity-100">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-black mb-2 flex items-center gap-2 text-theme-primary">
          <UploadCloud className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
          {t('importFiles') || 'Import Document / Image'}
        </h2>
        <p className="text-[15px] mb-6 font-black text-theme-muted">
          {t('importFilesDesc') || 'Extract transactions from PDF, Word, Excel, PPTX or Photos (Arabic/English supported).'}
        </p>

        {parsedRows.length === 0 && !isProcessing && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex flex-wrap items-center gap-4 mb-4 dark:bg-slate-800/40 bg-slate-100 p-3 rounded-2xl border dark:border-white/5 border-slate-300">
                <span className="text-sm font-black ml-1 text-theme-muted">{t('ocrLanguage') || 'OCR Language'}:</span>
                <div className="flex gap-1.5">
                  {(['ara+eng', 'ara', 'eng'] as const).map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setOcrLanguage(lang)}
                      className={cn(
                        "px-4 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-tight",
                        ocrLanguage === lang ? "bg-indigo-600 text-white shadow-lg" : "dark:bg-slate-700 bg-white dark:text-slate-300 text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-none"
                      )}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 font-bold ml-auto">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Tip: Use <b>ENG</b> for purely English docs.</span>
                </div>
            </div>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[300px] border-2 border-dashed dark:border-slate-700 border-slate-300 hover:border-indigo-500 dark:hover:bg-indigo-500/10 hover:bg-indigo-50 transition-all rounded-3xl flex flex-col items-center justify-center cursor-pointer p-8 text-center group"
            >
              <input 
                type="file" 
                accept=".pdf, .docx, .xlsx, .xls, .pptx, .png, .jpg, .jpeg, .webp" 
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              <div className="flex gap-4 mb-6">
                <FileText className="w-12 h-12 text-rose-500 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                <FileSpreadsheet className="w-12 h-12 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <Presentation className="w-12 h-12 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                <Image className="w-12 h-12 text-sky-500 dark:text-sky-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-black mb-2 font-cairo uppercase tracking-tight text-theme-primary">{t('clickToUpload')}</h3>
              <p className="text-sm max-w-md font-black italic text-theme-muted">PDF, Word, Excel, PPTX, PNG, JPG (Max 10MB)</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] space-y-6">
            <div className="relative w-24 h-24">
               <div className="absolute inset-0 border-4 dark:border-indigo-500/20 border-indigo-100 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
               <p className="font-black text-2xl mb-4 uppercase tracking-widest text-theme-primary">{status}</p>
               <div className="w-64 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mx-auto shadow-inner">
                  <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
               <p className="dark:text-slate-400 text-slate-500 text-sm mt-3 font-black">{progress}%</p>
            </div>
          </div>
        )}

        {error && !isProcessing && (
          <div className="mt-4 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 shadow-sm animate-fade-in">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {parsedRows.length > 0 && !isProcessing && (
          <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
            <div className="flex-1 overflow-auto rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-slate-800/30 bg-slate-50 mb-4 custom-scrollbar shadow-inner">
              <table className="w-full text-left rtl:text-right text-sm">
                <thead className="text-[11px] uppercase dark:bg-slate-900/90 bg-slate-200 dark:text-slate-400 text-slate-900 sticky top-0 backdrop-blur-md z-10 font-black tracking-widest border-b border-slate-300 dark:border-white/10">
                  <tr>
                    <th className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={parsedRows.every(r => r.selected)}
                        onChange={(e) => setParsedRows(prev => prev.map(r => ({ ...r, selected: e.target.checked })))}
                        className="rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer transition-all"
                      />
                    </th>
                    <th className="px-6 py-4">{t('date')}</th>
                    <th className="px-6 py-4">{t('description')}</th>
                    <th className="px-6 py-4">{t('account') || 'Account'}</th>
                    <th className="px-6 py-4 text-right rtl:text-left">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/5 divide-slate-200">
                  {parsedRows.map(row => {
                    const d = row.description.toLowerCase();
                    const isTotal = /\btotal\b|إجمالي|مجموع|صافي|net\b|liabilities.*equity|shareholders.*funds/i.test(d);
                    
                    return (
                    <tr key={row.id} className={cn(
                      "dark:hover:bg-white/5 hover:bg-white transition-all group",
                      isTotal && "bg-indigo-50/50 dark:bg-indigo-500/5"
                    )}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={row.selected}
                          onChange={() => handleToggleRow(row.id)}
                          className={cn(
                            "rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer transition-all",
                            isTotal && "opacity-40"
                          )}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         {isTotal && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter mr-2">Total</span>}
                        <input 
                          type="text" 
                          value={row.date}
                          onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
                          className="bg-transparent border-none focus:ring-2 focus:ring-indigo-500/30 rounded-lg px-2 py-1.5 w-28 font-black transition-all dark:text-white text-slate-900"
                        />
                      </td>
                      <td className="px-6 py-4 w-full">
                        <input 
                          type="text" 
                          value={row.description}
                          onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                          className="bg-transparent border-none focus:ring-2 focus:ring-indigo-500/30 rounded-lg px-2 py-1.5 w-full font-black transition-all dark:text-white text-slate-900"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={row.accountId}
                          onChange={(e) => handleUpdateRow(row.id, 'accountId', e.target.value)}
                          className="dark:bg-slate-900/50 bg-white border dark:border-white/10 border-slate-300 rounded-xl text-xs font-black dark:text-indigo-300 text-indigo-900 p-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
                        >
                          <optgroup label="Assets" className="font-black text-[10px] uppercase dark:bg-slate-900 bg-slate-50">
                             <option value="bank" className="font-bold">Bank / بنك</option>
                             <option value="cash" className="font-bold">Cash / نقدية</option>
                             <option value="ar" className="font-bold">Receivables / مدينون</option>
                             <option value="inventory" className="font-bold">Inventory / مخزون</option>
                             <option value="equipment" className="font-bold">Equipment / معدات</option>
                             <option value="furniture" className="font-bold">Furniture / أثاث</option>
                             <option value="cars" className="font-bold">Cars / سيارات</option>
                             <option value="fixed_assets" className="font-bold">Fixed Assets / أصول ثابتة</option>
                          </optgroup>
                          <optgroup label="Liabilities" className="font-black text-[10px] uppercase dark:bg-slate-900 bg-slate-50">
                             <option value="ap" className="font-bold">Payables / دائنون</option>
                             <option value="short_term_loans" className="font-bold">Short Loans / قروض قصيرة</option>
                             <option value="long_term_loans" className="font-bold">Long Loans / قروض طويلة</option>
                          </optgroup>
                          <optgroup label="Equity" className="font-black text-[10px] uppercase dark:bg-slate-900 bg-slate-50">
                             <option value="capital" className="font-bold">Capital / رأس مال</option>
                             <option value="retained_earnings" className="font-bold">Retained Earnings / أرباح مبقاة</option>
                             <option value="revenue" className="font-bold">Revenue / إيرادات</option>
                             <option value="expenses" className="font-bold">Expenses / مصروفات</option>
                          </optgroup>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right rtl:text-left">
                        <input 
                          type="number" 
                          value={row.amount || ''}
                          onChange={(e) => handleUpdateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="bg-transparent border-none focus:ring-2 focus:ring-indigo-500/30 rounded-lg px-2 py-1.5 w-32 text-right rtl:text-left dark:text-indigo-300 text-indigo-600 font-black text-base transition-all"
                        />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end pt-5 border-t dark:border-white/10 border-slate-200">
              <div className="mr-auto flex items-center gap-4">
                <button 
                  onClick={handleAddManualRow}
                  className="px-5 py-2.5 rounded-xl text-xs font-black dark:bg-indigo-500/10 bg-indigo-50 dark:text-indigo-400 text-indigo-600 hover:dark:bg-indigo-500/20 hover:bg-indigo-100 transition-all border border-indigo-500/30 uppercase tracking-widest shadow-sm"
                >
                  + Add Row Manually
                </button>
                
                {/* Real-time Balance Check Indicator */}
                <div className="flex gap-4 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border dark:border-white/5 border-slate-200">
                   <div className="px-3 py-1 flex flex-col">
                      <span className="text-[9px] uppercase font-black text-theme-muted">Assets</span>
                      <span className="text-xs font-black text-emerald-600">
                        {parsedRows.filter(r => r.selected && r.accountId !== 'ap' && r.accountId !== 'capital' && r.accountId !== 'retained_earnings').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                      </span>
                   </div>
                   <div className="w-[1px] bg-slate-300 dark:bg-white/10 self-stretch"></div>
                   <div className="px-3 py-1 flex flex-col">
                      <span className="text-[9px] uppercase font-black text-theme-muted">L + E</span>
                      <span className="text-xs font-black text-rose-600">
                        {parsedRows.filter(r => r.selected && (r.accountId === 'ap' || r.accountId === 'capital' || r.accountId === 'retained_earnings' || r.accountId === 'short_term_loans')).reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                      </span>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => setShowRawText(!showRawText)}
                className="px-5 py-2.5 rounded-xl text-xs font-black dark:bg-slate-800 bg-slate-100 dark:text-indigo-400 text-indigo-600 hover:dark:bg-slate-700 hover:bg-slate-200 transition-all border dark:border-indigo-500/20 border-slate-300 uppercase tracking-widest shadow-sm"
              >
                {showRawText ? 'Hide Text' : 'View Detected Text'}
              </button>
              <button 
                onClick={() => { setParsedRows([]); setError(null); setRawText(''); }} 
                className="px-6 py-2.5 rounded-xl text-sm font-bold dark:text-slate-400 text-slate-500 hover:dark:text-white hover:text-slate-800 dark:hover:bg-slate-800 hover:bg-slate-100 transition-all uppercase tracking-widest"
                disabled={isProcessing}
              >
                {t('clear') || 'Reset'}
              </button>
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold dark:text-slate-400 text-slate-500 hover:dark:text-white hover:text-slate-800 dark:hover:bg-slate-800 hover:bg-slate-100 transition-all uppercase tracking-widest">
                {t('cancel')}
              </button>
              <button 
                onClick={handleImport}
                disabled={!parsedRows.some(r => r.selected)}
                className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest text-sm"
              >
                <CheckCircle2 className="w-6 h-6" />
                {t('save')} ({parsedRows.filter(r => r.selected).length})
              </button>
            </div>

            {showRawText && (
               <div className="mt-5 p-5 dark:bg-slate-950/80 bg-slate-100 rounded-2xl border dark:border-white/5 border-slate-200 max-h-[300px] overflow-auto shadow-inner animate-fade-in relative">
                  <h4 className="text-[10px] font-black dark:text-slate-500 text-slate-400 mb-3 sticky top-0 dark:bg-slate-950/90 bg-slate-100/90 backdrop-blur-sm uppercase tracking-widest">RAW TEXT EXTRACTED:</h4>
                  <pre className="text-[11px] dark:text-slate-400 text-slate-600 whitespace-pre-wrap font-mono leading-relaxed px-1">
                     {rawText || "Processing text..."}
                  </pre>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
