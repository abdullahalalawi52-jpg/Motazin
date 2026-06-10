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
  const { t, dir, language } = useLanguage();
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
        
        const items = content.items as any[];
        
        if (items.length === 0) {
            // Scanned PDF fallback
            setStatus(`Page ${i} appears to be scanned. Running OCR...`);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: ctx, viewport }).promise;
                
                const worker = await createWorker(ocrLanguage, 1, {
                  logger: m => {
                    if (m.status === 'recognizing text') {
                      setProgress(Math.round(((i - 1) + m.progress) / pdf.numPages * 100));
                      setStatus(`OCR Page ${i}: Recognizing ${ocrLanguage.toUpperCase()} text...`);
                    }
                  }
                });
                
                try {
                  const { data: { text } } = await worker.recognize(canvas);
                  fullText += text + '\n';
                } finally {
                  await worker.terminate();
                }
            }
            continue;
        }
        
        const linesMap = new Map<number, any[]>();
        
        items.forEach((item) => {
          if (!item.str.trim() && item.str !== ' ') return;
          const y = Math.round(item.transform[5]);
          
          let foundLineY = -1;
          for (const lineY of linesMap.keys()) {
              if (Math.abs(lineY - y) < 5) {
                  foundLineY = lineY;
                  break;
              }
          }
          
          if (foundLineY === -1) {
              linesMap.set(y, [item]);
          } else {
              linesMap.get(foundLineY)!.push(item);
          }
        });

        // Sort by Y descending (top to bottom)
        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
        
        sortedY.forEach(y => {
            const lineItems = linesMap.get(y)!;
            // Sort by X ascending (left to right)
            lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
            
            const lineText = lineItems.map(item => item.str).join(' ');
            fullText += lineText + '\n';
        });
    }
    
    setRawText(fullText);
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-12 lg:p-20 bg-slate-950/60 backdrop-blur-sm transition-all duration-700 animate-in fade-in" dir={dir}>
      <div className="bg-[#0f172a]/95 border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[3rem] w-full max-w-5xl h-[92vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] relative transition-all duration-500 animate-in slide-in-from-bottom sm:zoom-in-95 fade-in">
        
        {/* Decorative subtle top light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent blur-sm"></div>

        {/* Header Section */}
        <div className="p-6 sm:p-10 pb-4 sm:pb-6 relative flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl sm:text-3xl font-black flex items-center gap-3 sm:gap-4 text-white">
              <div className="p-2 sm:p-3 bg-indigo-500/10 rounded-xl sm:rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <UploadCloud className="text-indigo-400 w-5 h-5 sm:w-8 sm:h-8" />
              </div>
              {language === 'ar' ? 'استيراد ملفات/صور' : 'Import Files / Images'}
            </h2>
            <p className="text-slate-400 text-xs sm:text-base font-medium max-w-xl leading-relaxed mt-1 sm:mt-2 opacity-80">
              {language === 'ar' 
                ? 'استخرج المعاملات المالية بذكاء من PDF، Word، Excel، أو حتى الصور الملتقطة.' 
                : 'Intelligently extract financial transactions from PDF, Word, Excel, or captured photos.'}
            </p>
          </div>

          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 hover:scale-110 active:scale-95 shadow-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {parsedRows.length === 0 && !isProcessing && (
          <div className="px-6 sm:px-10 pb-6 sm:pb-10 flex flex-col flex-1 overflow-hidden">
            {/* Language Selector Pill */}
            <div className="flex items-center justify-center mb-6 sm:mb-10">
              <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-1.5 sm:p-2 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-2 sm:gap-3 shadow-2xl w-full sm:w-auto">
                <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-1.5 sm:py-2 border-b sm:border-b-0 sm:border-r border-white/10 rtl:sm:border-r-0 rtl:sm:border-l w-full sm:w-auto justify-center sm:justify-start">
                   <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                   <span className="text-[9px] sm:text-[11px] font-black text-slate-300 uppercase tracking-widest">
                     {language === 'ar' ? 'لغة التعرف' : 'OCR Language'}
                   </span>
                </div>
                <div className="flex gap-1.5 sm:gap-2 pr-0 sm:pr-2 rtl:sm:pr-0 rtl:sm:pl-2">
                  {(['ara+eng', 'ara', 'eng'] as const).map(lang => (
                    <button 
                      key={lang}
                      onClick={() => setOcrLanguage(lang)}
                      className={cn(
                        "px-4 sm:px-6 py-2 sm:py-2.5 rounded-[1.5rem] text-[9px] sm:text-[11px] font-black transition-all uppercase tracking-widest",
                        ocrLanguage === lang 
                          ? "bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.4)] scale-105" 
                          : "text-slate-500 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-amber-400/80 font-bold px-4">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Tip: Use <b>ENG</b> for purely English docs</span>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <label 
              htmlFor="file-upload-input"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="flex-1 min-h-[250px] sm:min-h-[380px] border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-white/[0.02] hover:bg-indigo-500/[0.05] transition-all duration-500 rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center justify-center cursor-pointer p-6 sm:p-12 group relative overflow-hidden shadow-inner"
            >
              <input 
                id="file-upload-input"
                name="document"
                type="file" 
                accept=".pdf, .docx, .xlsx, .xls, .pptx, .png, .jpg, .jpeg, .webp" 
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              
              <div className="flex gap-4 sm:gap-8 mb-6 sm:mb-12 relative z-10">
                {[
                  { icon: FileText, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                  { icon: FileSpreadsheet, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  { icon: Image, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-500 shadow-xl group-hover:scale-110 group-hover:-translate-y-2",
                    item.bg, item.border
                  )}>
                    <item.icon className={cn("w-6 h-6 sm:w-10 sm:h-10", item.color)} />
                  </div>
                ))}
              </div>

              <div className="text-center space-y-2 sm:space-y-4 relative z-10">
                <h3 className="text-lg sm:text-3xl font-black text-white tracking-tight leading-tight px-4">
                  {language === 'ar' ? 'انقر هنا للرفع أو اسحب الملف هنا' : 'Click to upload or drag files here'}
                </h3>
                <p className="text-slate-500 text-[8px] sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-60">
                  PDF, Word, Excel, PPTX, PNG, JPG (Max 10MB)
                </p>
              </div>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/[0.03] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              {/* Corner Accents */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/5 rounded-tl-xl group-hover:border-indigo-500/30 transition-colors"></div>
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/5 rounded-br-xl group-hover:border-indigo-500/30 transition-colors"></div>
            </label>
          </div>
        )}

        {isProcessing && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-8 p-12">
            <div className="relative w-32 h-32">
               <div className="absolute inset-0 border-[6px] border-white/5 rounded-full"></div>
               <div className="absolute inset-0 border-[6px] border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.3)]"></div>
            </div>
            <div className="text-center space-y-4">
               <p className="font-black text-2xl uppercase tracking-[0.3em] text-white animate-pulse">{status}</p>
               <div className="w-80 h-3 bg-white/5 rounded-full overflow-hidden mx-auto border border-white/5 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
               <p className="text-indigo-400 text-sm font-black tracking-widest">{progress}%</p>
            </div>
          </div>
        )}

        {error && !isProcessing && (
          <div className="mx-8 mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4 text-rose-400 shadow-2xl shadow-rose-500/5 animate-in slide-in-from-top-2">
            <AlertCircle className="w-7 h-7 flex-shrink-0" />
            <p className="text-sm font-black leading-relaxed">{error}</p>
          </div>
        )}

        {parsedRows.length > 0 && !isProcessing && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-10 pb-4 sm:pb-10">
            <div className="flex-1 overflow-auto rounded-2xl sm:rounded-[2rem] border border-white/10 bg-black/20 mb-4 sm:mb-6 custom-scrollbar shadow-inner relative">
              <table className="w-full text-left rtl:text-right text-sm">
                <thead className="text-[10px] uppercase bg-slate-900/90 text-slate-500 sticky top-0 backdrop-blur-xl z-10 font-black tracking-[0.15em] border-b border-white/5">
                  <tr>
                    <th className="px-6 py-5">
                      <input 
                        id="select-all-parsed"
                        name="selectAllParsed"
                        type="checkbox" 
                        checked={parsedRows.every(r => r.selected)}
                        onChange={(e) => setParsedRows(prev => prev.map(r => ({ ...r, selected: e.target.checked })))}
                        className="rounded-lg border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/30 w-5 h-5 cursor-pointer transition-all appearance-none checked:bg-indigo-500 relative before:content-[''] before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCA2TDkgMTdsLTUtNSIvPjwvc3ZnPg==')] before:bg-no-repeat before:bg-center before:bg-[length:14px_14px] before:opacity-0 checked:before:opacity-100"
                        aria-label="Select all parsed rows"
                      />
                    </th>
                    <th className="px-6 py-5">{t('date')}</th>
                    <th className="px-6 py-5">{t('description')}</th>
                    <th className="px-6 py-5">{t('account') || 'Account'}</th>
                    <th className="px-6 py-5 text-right rtl:text-left">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parsedRows.map((row, idx) => {
                    const d = row.description.toLowerCase();
                    const isTotal = /\btotal\b|إجمالي|مجموع|صافي|net\b|liabilities.*equity|shareholders.*funds/i.test(d);
                    
                    return (
                    <tr key={row.id} className={cn(
                      "hover:bg-white/[0.03] transition-all group",
                      isTotal && "bg-indigo-500/[0.03]"
                    )}>
                      <td className="px-6 py-4">
                        <input 
                          id={`select-row-${idx}`}
                          name={`selectRow-${idx}`}
                          type="checkbox" 
                          checked={row.selected}
                          onChange={() => handleToggleRow(row.id)}
                          className={cn(
                            "rounded-lg border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/30 w-5 h-5 cursor-pointer transition-all appearance-none checked:bg-indigo-500 relative before:content-[''] before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCA2TDkgMTdsLTUtNSIvPjwvc3ZnPg==')] before:bg-no-repeat before:bg-center before:bg-[length:14px_14px] before:opacity-0 checked:before:opacity-100",
                            isTotal && "opacity-40"
                          )}
                          aria-label={`Select row ${idx + 1}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         {isTotal && <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter mr-2">Total</span>}
                        <input 
                          id={`date-row-${idx}`}
                          name={`dateRow-${idx}`}
                          type="text" 
                          value={row.date}
                          onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-white/10 rounded-lg px-2 py-1.5 w-28 font-black transition-all text-white"
                          aria-label={`Date for row ${idx + 1}`}
                        />
                      </td>
                      <td className="px-6 py-4 w-full">
                        <input 
                          id={`desc-row-${idx}`}
                          name={`descRow-${idx}`}
                          type="text" 
                          value={row.description}
                          onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-white/10 rounded-lg px-2 py-1.5 w-full font-black transition-all text-white"
                          aria-label={`Description for row ${idx + 1}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          id={`account-row-${idx}`}
                          name={`accountRow-${idx}`}
                          value={row.accountId}
                          onChange={(e) => handleUpdateRow(row.id, 'accountId', e.target.value)}
                          className="bg-slate-900/50 border border-white/10 rounded-xl text-[11px] font-black text-indigo-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer shadow-lg"
                          aria-label={`Account for row ${idx + 1}`}
                        >
                          <optgroup label="Assets" className="font-black text-[10px] uppercase bg-slate-900">
                             <option value="bank" className="font-bold">Bank / بنك</option>
                             <option value="cash" className="font-bold">Cash / نقدية</option>
                             <option value="ar" className="font-bold">Receivables / مدينون</option>
                             <option value="inventory" className="font-bold">Inventory / مخزون</option>
                             <option value="equipment" className="font-bold">Equipment / معدات</option>
                             <option value="furniture" className="font-bold">Furniture / أثاث</option>
                             <option value="cars" className="font-bold">Cars / سيارات</option>
                             <option value="fixed_assets" className="font-bold">Fixed Assets / أصول ثابتة</option>
                          </optgroup>
                          <optgroup label="Liabilities" className="font-black text-[10px] uppercase bg-slate-900">
                             <option value="ap" className="font-bold">Payables / دائنون</option>
                             <option value="short_term_loans" className="font-bold">Short Loans / قروض قصيرة</option>
                             <option value="long_term_loans" className="font-bold">Long Loans / قروض طويلة</option>
                          </optgroup>
                          <optgroup label="Equity" className="font-black text-[10px] uppercase bg-slate-900">
                             <option value="capital" className="font-bold">Capital / رأس مال</option>
                             <option value="retained_earnings" className="font-bold">Retained Earnings / أرباح مبقاة</option>
                             <option value="revenue" className="font-bold">Revenue / إيرادات</option>
                             <option value="expenses" className="font-bold">Expenses / مصروفات</option>
                          </optgroup>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right rtl:text-left">
                        <input 
                          id={`amount-row-${idx}`}
                          name={`amountRow-${idx}`}
                          type="number" 
                          value={row.amount || ''}
                          onChange={(e) => handleUpdateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="bg-transparent border-none focus:ring-1 focus:ring-white/10 rounded-lg px-2 py-1.5 w-32 text-right rtl:text-left text-indigo-400 font-black text-base transition-all"
                          aria-label={`Amount for row ${idx + 1}`}
                        />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-end pt-4 sm:pt-6 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:mr-auto items-stretch sm:items-center gap-3 sm:gap-4">
                <button 
                  onClick={handleAddManualRow}
                  className="px-6 py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20 uppercase tracking-[0.1em] shadow-lg shadow-indigo-500/5"
                >
                  + {language === 'ar' ? 'إضافة صف يدوياً' : 'Add Row Manually'}
                </button>
                
                <div className="flex gap-2 sm:gap-4 p-1.5 sm:p-2 bg-black/20 rounded-xl sm:rounded-[1.25rem] border border-white/5 justify-around">
                   <div className="px-3 sm:px-4 py-1 sm:py-1.5 flex flex-col items-center">
                      <span className="text-[8px] sm:text-[9px] uppercase font-black text-slate-500 mb-0.5">{t('assets')}</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-400">
                        {parsedRows.filter(r => r.selected && r.accountId !== 'ap' && r.accountId !== 'capital' && r.accountId !== 'retained_earnings').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                      </span>
                   </div>
                   <div className="w-[1px] bg-white/5 self-stretch"></div>
                   <div className="px-3 sm:px-4 py-1 sm:py-1.5 flex flex-col items-center">
                      <span className="text-[8px] sm:text-[9px] uppercase font-black text-slate-500 mb-0.5">{t('liabilities')}+E</span>
                      <span className="text-xs sm:text-sm font-black text-rose-400">
                        {parsedRows.filter(r => r.selected && (r.accountId === 'ap' || r.accountId === 'capital' || r.accountId === 'retained_earnings' || r.accountId === 'short_term_loans')).reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                      </span>
                   </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRawText(!showRawText)}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10 uppercase tracking-[0.1em]"
                >
                  {showRawText ? (language === 'ar' ? 'إخفاء النص' : 'Hide Text') : (language === 'ar' ? 'عرض النص' : 'View Text')}
                </button>
                
                <button 
                  onClick={handleImport}
                  disabled={!parsedRows.some(r => r.selected)}
                  className="flex-[2] sm:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-[0.2em] text-[10px] sm:text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('save')} ({parsedRows.filter(r => r.selected).length})
                </button>
              </div>
            </div>

            {showRawText && (
               <div className="mt-6 p-6 bg-black/40 rounded-[1.5rem] border border-white/5 max-h-[250px] overflow-auto shadow-inner animate-in slide-in-from-top-2">
                  <h4 className="text-[9px] font-black text-slate-500 mb-4 sticky top-0 bg-black/40 backdrop-blur-md uppercase tracking-[0.2em]">RAW TEXT EXTRACTED:</h4>
                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
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
