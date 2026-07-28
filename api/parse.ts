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
    const { text, localApiKey } = body;

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid or missing text' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Use local key if provided, else fallback to env
    const apiKey = localApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: text }] }],
        systemInstruction: {
          parts: [{ text: "You are an expert financial data extractor. Extract all financial transactions from the provided OCR text. Return ONLY a valid JSON array of objects. Each object must have these keys: 'date' (string, DD/MM/YYYY format), 'description' (string, item name or detail), 'amount' (number, positive float). If none found, return []." }]
        },
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: jsonHeaders,
    });

  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}
