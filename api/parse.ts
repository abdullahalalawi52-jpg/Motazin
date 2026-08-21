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

    const prompt = `You are an expert financial and accounting data extractor.
Analyze the provided document or image, which may contain receipts, invoices, bank statements, ledger tables, or T-accounts (with debits, credits, and balances).
Extract all individual financial transactions or ledger movements.

Guidelines:
1. If the image contains General Ledger / T-Accounts (e.g. Acct 101 Cash, Acct 110 Accounts Receivable, Acct 125 Supplies, Acct 139 Inventory, Acct 200 Accounts Payable, Acct 410 Sales, Acct 525 Cost of Goods Sold, Acct 610 Supplies Expense):
   - For every active Debit or Credit movement with an amount > 0:
     - 'amount': positive number (the transaction amount)
     - 'date': normalized as 'YYYY-MM-DD' or standard date (e.g., '1-Sep-YY' -> '2026-09-01')
     - 'description': clear descriptive name combining account title and action (e.g. 'Cash on Hand - Debit' or 'Product Sales Revenue - Credit')
     - 'accountId': choose the best matching account ID from: ['cash', 'bank', 'fixed_assets', 'expenses', 'inventory', 'ar', 'ap', 'capital', 'sales', 'retained_earnings']
     - 'creditAccountId': if an offsetting account is identifiable from the context, specify it; otherwise omit or leave null.
2. If the document is an invoice, receipt, or bank statement:
   - Extract each item or transaction with 'date', 'description', 'amount', 'accountId', 'creditAccountId'.

Return ONLY a valid JSON array of objects. If nothing is found, return []. Do NOT include Markdown code blocks or explanation.`;

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
