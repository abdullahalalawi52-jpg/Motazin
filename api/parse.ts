import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge', // Using Edge runtime for fast responses
};

// Check if the given value (Origin or Referer) represents a trusted host or preview site
function isAllowedHostOrOrigin(value: string | null): boolean {
  if (!value) return false;
  try {
    const urlStr = value.startsWith('http://') || value.startsWith('https://') 
      ? value 
      : `https://${value}`;
    const url = new URL(urlStr);
    const hostname = url.hostname;

    const exactHosts = [
      'motazin.vercel.app',
      'abdullahalalawi52-jpg.github.io',
      'localhost',
      '127.0.0.1'
    ];
    if (exactHosts.includes(hostname)) {
      return true;
    }

    if (hostname.endsWith('.vercel.app')) {
      if (hostname.startsWith('motazin-') || hostname.endsWith('-abdullahalalawi52-jpg.vercel.app')) {
        return true;
      }
    }
  } catch {
    // Ignore invalid URLs
  }
  return false;
}

export default async function handler(req: Request) {
  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';

  const isAllowedOrigin = isAllowedHostOrOrigin(origin);
  const isAllowedReferer = isAllowedHostOrOrigin(referer);
  const isValidSource = isAllowedOrigin || (origin === '' && isAllowedReferer);

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (origin && isAllowedOrigin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  if (req.method === 'OPTIONS') {
    if (!isValidSource) {
      return new Response(JSON.stringify({ error: 'Unauthorized origin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const jsonHeaders = {
    'Content-Type': 'application/json',
    ...corsHeaders
  };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  if (!isValidSource) {
    return new Response(JSON.stringify({ error: 'Unauthorized request source' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { text, imageBase64, mimeType, localApiKey } = body;

    if (!text && !imageBase64) {
      return new Response(JSON.stringify({ error: 'Invalid or missing text/image' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Support server-side env key or client-provided localApiKey
    const apiKey = (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || localApiKey || '').trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key is required. Please provide it in settings or configure GEMINI_API_KEY on the server.' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.7-flash for higher precision extraction and speed
    const model = genAI.getGenerativeModel({ model: 'gemini-3.7-flash' });

    const safeMimeType = (mimeType && mimeType.startsWith('image/')) ? mimeType : 'image/jpeg';
    const parts: (string | { inlineData: { data: string, mimeType: string } })[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: safeMimeType
        }
      });
      parts.push("Extract all financial transactions, ledger journal entries, or T-account debits and credits from this image.");
    }
    if (text) {
      parts.push(text);
    }

    const prompt = `You are an expert accounting and financial data extraction assistant.
Analyze the provided document or image, which may contain receipts, invoices, bank statements, ledger tables, or T-accounts.
Extract all authentic financial transactions.

CRITICAL ACCOUNTING RULES:
1. RUNNING BALANCE COLUMN EXCLUSION:
   - In General Ledger tables, Cash books, or T-accounts with columns like [Date, Description, Dr./Debit, Cr./Credit, Balance (Dr./Cr.)]:
   - NEVER extract numbers from the "Balance" column! The Balance is just a running mathematical total.
   - ONLY extract the actual transaction amount from the "Dr." (Debit) or "Cr." (Credit) columns.
2. THOUSANDS & AMOUNTS:
   - Return numbers in full numeric format without commas (e.g. "40,000" -> 40000, "26,000" -> 26000, "3,400" -> 3400, "600" -> 600, "100" -> 100).
3. DATE NORMALIZATION:
   - Convert dates like "Jan. 20", "Jan 21", "1-Sep-YY" into standard ISO format "YYYY-MM-DD" (e.g. "2026-01-20").
4. ACCURATE ACCOUNT CLASSIFICATION:
   - "Wages", "Salaries", "Supplies", "Rent", "Utility", "Maintenance" -> accountId: "expenses"
   - "Furniture", "Equipment", "Vehicles", "Machinery" -> accountId: "fixed_assets"
   - "A/C R.A", "Accounts Receivable", "Customers" -> accountId: "ar"
   - "A/C P.A", "Accounts Payable", "Vendors", "Suppliers" -> accountId: "ap"
   - "Product Sales", "Sales Revenue", "Services" -> accountId: "sales"
   - "Cash on Hand", "Cash" -> accountId: "cash"
   - If the main table is a CASH ledger:
     - For Dr. (Cash received): debit is 'cash', creditAccountId is the offsetting account (e.g. 'ar' for A/C R.A, 'sales' for revenue).
     - For Cr. (Cash paid): debit accountId is the expense/asset (e.g. 'expenses' for Wages/Salaries, 'fixed_assets' for Furniture, 'ap' for A/C P.A) and creditAccountId is 'cash'.

Return ONLY a valid JSON array of objects. Example:
[
  {
    "date": "2026-01-20",
    "description": "Collection from A/C R.A",
    "amount": 40000,
    "accountId": "cash",
    "creditAccountId": "ar"
  },
  {
    "date": "2026-01-21",
    "description": "Payment to A/C P.A",
    "amount": 26000,
    "accountId": "ap",
    "creditAccountId": "cash"
  },
  {
    "date": "2026-01-22",
    "description": "Wages Expense",
    "amount": 3000,
    "accountId": "expenses",
    "creditAccountId": "cash"
  }
]
If nothing is found, return []. Do NOT include Markdown code fences or extra text.`;

    const result = await model.generateContent([prompt, ...parts]);
    const responseText = result.response.text();

    // Clean up potential markdown formatting like ```json ... ```
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch {
      // Fallback if parsing fails
      parsedData = { text: cleanedText };
    }

    // Wrap in standard response format expected by client
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(parsedData) }] } }] }), {
      status: 200,
      headers: jsonHeaders,
    });

  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}
