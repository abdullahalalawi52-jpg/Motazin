import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import type { Worker } from 'tesseract.js';
import { ParsedRow } from '../types/accounting';
import { generateId } from './uuid';
import { toIsoDateString } from './date';
import { BALANCE_TOLERANCE } from './constants';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ProcessCallbacks {
  setProgress: (progress: number) => void;
  setStatus: (status: string) => void;
  setRawText: (text: string) => void;
  setParsedRows: (rows: ParsedRow[]) => void;
  setError: (error: string) => void;
}

export const extractTransactions = async (
  text: string,
  geminiApiKey: string | undefined,
  callbacks: ProcessCallbacks
) => {
  const { setStatus, setParsedRows, setError } = callbacks;
  
  if (geminiApiKey && text.trim().length > 10) {
    setStatus('Analyzing document using AI for precision...');
    try {
      const isGitHubPages = window.location.hostname.includes('github.io');
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiEndpoint = (isGitHubPages || isLocalhost)
        ? 'https://motazin.vercel.app/api/parse'
        : '/api/parse';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          localApiKey: geminiApiKey // Pass it to backend, backend will use it or fallback to env
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          try {
            const parsed = JSON.parse(aiText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const results: ParsedRow[] = parsed.map((item: { date?: string; description?: string; amount?: string | number }) => ({
                id: generateId(),
                date: item.date || toIsoDateString(new Date()),
                description: item.description || 'AI Extracted Item',
                amount: Math.abs(Number(item.amount) || 0),
                accountId: 'cash',
                selected: true
              })).filter((item: ParsedRow) => item.amount > 0);
              
              if (results.length > 0) {
                setParsedRows(results);
                setStatus('');
                return; // AI Succeeded!
              }
            }
          } catch (e) {
            console.error('Failed to parse Gemini JSON:', e);
          }
        }
      }
    } catch (error) {
      console.error('Gemini extraction failed, falling back to Regex:', error);
    }
    setStatus('AI extraction skipped/failed. Trying Regex fallback...');
  }

  const convertArabicDigits = (str: string) => {
    return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  };

  const normalizedText = convertArabicDigits(text);
  const lines = normalizedText.split('\n');
  const results: ParsedRow[] = [];
  
  // 1. Optimized Date Detection
  const dateRegex = /\b(\d{1,4}[\/\-.]\d{1,2}[\/\-.](?:\d{2,4})?|\d{1,2}[\/\-.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:,)? \d{2,4})\b/i;
  let globalDate = toIsoDateString(new Date());
  
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
      let clean = raw.replace(/\s/g, '').replace(/o/gi, '0').replace(/[—–-]$/, '');
      
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
      
      clean = clean.replace(/[.,]$/, '');
      
      const val = parseFloat(clean);
      
      const looksLikeYear = /^\d{4}$/.test(clean) && val >= 2020 && val <= 2035;
      const hasDecimal = clean.includes('.');
      
      if (!isNaN(val) && (Math.abs(val) > BALANCE_TOLERANCE) && (!looksLikeYear || hasDecimal)) {
        const finalVal = isNegative ? -Math.abs(val) : Math.abs(val);
        amountsFound.push({ value: finalVal, raw: match[1], index: match.index });
      }
    }

    if (amountsFound.length === 0) {
      if (trimmed.length < 60 && !trimmed.toLowerCase().includes('balance sheet') && !/page|صفحة/i.test(trimmed)) {
        pendingDescription = trimmed;
      }
      return;
    }

    let lastEnd = 0;
    amountsFound.forEach((amt, idx) => {
      let rawDesc = trimmed.substring(lastEnd, amt.index).trim();
      
      if ((!rawDesc || rawDesc.length < 2) && pendingDescription && idx === 0) {
         rawDesc = pendingDescription;
         pendingDescription = '';
      }

      if ((!rawDesc || rawDesc.length < 2) && idx === amountsFound.length - 1) {
         rawDesc = trimmed.substring(amt.index + amt.raw.length).trim();
      }
      
      if ((!rawDesc || rawDesc.length < 2) && idx < amountsFound.length - 1) {
         rawDesc = trimmed.substring(amt.index + amt.raw.length, amountsFound[idx+1].index).trim();
      }

      lastEnd = amt.index + amt.raw.length;

      let desc = rawDesc.replace(/[٠١٢٣٤٥٦٧٨٩]/g, '').replace(/[|\\/_#*~=+<>—–-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!desc || desc.length < 2) desc = `Detected Item (${amt.raw})`;

      const d = desc.toLowerCase();
      const isTotalLine = /\btotal\b|إجمالي|مجموع|صافي|net\b|liabilities.*equity|shareholders.*funds|total.*assets|total.*liabilities/i.test(d);
      
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

      let bestCategory = 'bank';
      let maxScore = 0;

      Object.entries(keywords).forEach(([id, terms]) => {
        let score = 0;
        terms.forEach(term => {
          if (d.includes(term)) {
            score += term.length; 
          }
        });
        if (score > maxScore) {
          maxScore = score;
          bestCategory = id;
        }
      });

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
      
      guessedAccountId = isTotalLine ? 'cash' : (categoryMap[bestCategory] || bestCategory);

      if (!results.some(r => r.amount === Math.abs(amt.value) && r.description === desc)) {
        results.push({
          id: generateId(),
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

export const processPdf = async (file: File, ocrLanguage: string, geminiApiKey: string | undefined, callbacks: ProcessCallbacks) => {
  const { setStatus, setProgress, setRawText } = callbacks;
  setStatus('Extracting PDF text...');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  let worker: Worker | null = null;
  let currentPageOCR = 1; 
  
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
        currentPageOCR = i;
        setProgress(Math.round((i / pdf.numPages) * 100));
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        const items = content.items as { str: string; transform: number[] }[];
        
        if (items.length === 0) {
            setStatus(`Page ${i} appears to be scanned. Running OCR...`);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                // @ts-ignore
                await page.render({ canvasContext: ctx, viewport }).promise;
                
                if (!worker) {
                  const tesseract = await import('tesseract.js');
                  worker = await tesseract.createWorker(ocrLanguage, 1, {
                    logger: m => {
                      if (m.status === 'recognizing text') {
                        setProgress(Math.round(((currentPageOCR - 1) + m.progress) / pdf.numPages * 100));
                        setStatus(`OCR Page ${currentPageOCR}: Recognizing ${ocrLanguage.toUpperCase()} text...`);
                      }
                    }
                  });
                }
                
                const { data: { text } } = await worker.recognize(canvas);
                fullText += text + '\n';
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

        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
        
        sortedY.forEach(y => {
            const lineItems = linesMap.get(y)!;
            lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
            
            const lineText = lineItems.map(item => item.str).join(' ');
            fullText += lineText + '\n';
        });
    }
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
  
  setRawText(fullText);
  await extractTransactions(fullText, geminiApiKey, callbacks);
};

export const processImage = async (file: File, ocrLanguage: string, geminiApiKey: string | undefined, callbacks: ProcessCallbacks) => {
  const { setStatus, setProgress, setRawText } = callbacks;
  setStatus('Preprocessing image for higher accuracy...');
  
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

  canvas.width = img.width * 3;
  canvas.height = img.height * 3;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = avg > 200 ? 255 : (avg < 150 ? 0 : avg);
    
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imageData, 0, 0);

  setStatus('Initializing OCR engine...');
  const tesseract = await import('tesseract.js');
  const worker = await tesseract.createWorker(ocrLanguage, 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        setProgress(Math.round(m.progress * 100));
        setStatus(`Recognizing ${ocrLanguage.toUpperCase()} text...`);
      }
    }
  });

  try {
    const { data: { text } } = await worker.recognize(canvas);
    setRawText(text);
    await extractTransactions(text, geminiApiKey, callbacks);
    URL.revokeObjectURL(objectUrl);
  } finally {
    await worker.terminate();
  }
};

export const processExcel = async (file: File, callbacks: ProcessCallbacks) => {
  const { setStatus, setParsedRows, setError } = callbacks;
  setStatus('Reading spreadsheet data...');
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  const results: ParsedRow[] = [];
  
  const dateRegex = /(\d{1,4}[\/\-.]\d{1,2}[\/\-.](?:\d{2,4})?|\d{1,2}[\/\-.]\d{1,2})/;
  
  for (const row of rows) {
    if (!row || row.length < 2) continue;
    
    let foundDate = '';
    let foundAmount: number | null = null;
    const descriptionParts: string[] = [];

    for (const cell of row) {
      if (cell === null || cell === undefined) continue;
      const cellStr = String(cell).trim();
      
      if (!foundDate) {
        const dm = cellStr.match(dateRegex);
        if (dm) foundDate = dm[1];
      }

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
        id: generateId(),
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

export const processWord = async (file: File, geminiApiKey: string | undefined, callbacks: ProcessCallbacks) => {
  callbacks.setStatus('Reading Word document...');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  callbacks.setRawText(result.value);
  await extractTransactions(result.value, geminiApiKey, callbacks);
};

export const processPowerPoint = async (file: File, geminiApiKey: string | undefined, callbacks: ProcessCallbacks) => {
  callbacks.setStatus('Parsing PowerPoint slides...');
  const zip = await JSZip.loadAsync(file);
  let fullText = '';
  
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  
  for (let i = 0; i < slideFiles.length; i++) {
    callbacks.setProgress(Math.round((i / slideFiles.length) * 100));
    const content = await zip.file(slideFiles[i])?.async('string');
    if (content) {
      const textNodes = content.match(/<a:t>.*?<\/a:t>/g) || [];
      const slideText = textNodes.map(node => node.replace(/<[^>]+>/g, '')).join(' ');
      fullText += slideText + '\n';
    }
  }
  callbacks.setRawText(fullText);
  await extractTransactions(fullText, geminiApiKey, callbacks);
};
