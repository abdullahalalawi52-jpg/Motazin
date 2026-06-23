export const config = {
  runtime: 'edge', // Using Edge runtime for fast responses
};

const ALLOWED_ORIGINS = [
  'https://motazin.vercel.app',
  'https://abdullahalalawi52-jpg.github.io',
  'http://localhost:3000',
  'http://localhost:5173'
];

export default async function handler(req: Request) {
  const origin = req.headers.get('origin') || '';
  
  let isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
  if (!isAllowedOrigin && origin) {
    try {
      const url = new URL(origin);
      if (url.hostname.endsWith('.vercel.app') || url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        isAllowedOrigin = true;
      }
    } catch (_) {}
  }
  
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Only append Allow-Origin if it's from an explicitly allowed domain
  if (isAllowedOrigin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Include CORS headers in all responses
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

  // If origin is strictly not allowed, block the request before hitting Gemini
  if (!isAllowedOrigin && origin !== '') {
    return new Response(JSON.stringify({ error: 'Unauthorized origin' }), {
      status: 403,
      headers: jsonHeaders,
    });
  }

  try {
    const body = await req.json();
    const { contents, system_instruction } = body;
    
    // Read the API key securely from environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction,
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: 'Failed to fetch from Gemini', details: errorData }), {
        status: response.status,
        headers: jsonHeaders,
      });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: jsonHeaders,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}
