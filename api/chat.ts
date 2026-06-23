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

    const modelsToTry = [
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      'gemini-3.5-flash'
    ];

    let lastError: any = null;
    let responseStatus = 500;
    let responseData: any = null;
    let success = false;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
            signal: AbortSignal.timeout(5000)
          }
        );

        responseStatus = response.status;
        responseData = await response.json().catch(() => ({}));

        if (response.ok) {
          success = true;
          break;
        } else {
          console.warn(`Model ${model} failed with status ${response.status}:`, responseData);
          lastError = responseData;
        }
      } catch (err: any) {
        console.error(`Error with model ${model}:`, err.message);
        lastError = { message: err.message };
      }
    }

    if (success) {
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: jsonHeaders,
      });
    } else {
      return new Response(JSON.stringify({ error: 'Failed to fetch from Gemini', details: lastError }), {
        status: responseStatus,
        headers: jsonHeaders,
      });
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}
