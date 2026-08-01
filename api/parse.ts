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
    const { text, imageBase64, mimeType } = body;

    if (!text && !imageBase64) {
      return new Response(JSON.stringify({ error: 'Invalid or missing text/image' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Strictly use server-side environment variables
    const apiKey = (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.6-flash as 1.5 is deprecated
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const parts: (string | { inlineData: { data: string, mimeType: string } })[] = [];
    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      });
      parts.push("Extract all financial transactions from this image.");
    }
    if (text) {
      parts.push(text);
    }

    const prompt = `You are an expert financial data extractor. Extract all financial transactions from the provided document or image. Return ONLY a valid JSON array of objects. Each object must have these keys: 'date' (string, DD/MM/YYYY format), 'description' (string, item name or detail), 'amount' (number, positive float). If none found, return [].`;

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
