export const config = {
  runtime: 'edge', // Using Edge runtime for fast responses
};

// Check if the given value (Origin or Referer) represents a trusted host or preview site
function isAllowedHostOrOrigin(value: string | null): boolean {
  if (!value) return false;
  try {
    // If value has no scheme, prepend one to make it a valid URL for parsing
    const urlStr = value.startsWith('http://') || value.startsWith('https://') 
      ? value 
      : `https://${value}`;
    const url = new URL(urlStr);
    const hostname = url.hostname;

    // 1. Strict exact matches
    const exactHosts = [
      'motazin.vercel.app',
      'abdullahalalawi52-jpg.github.io',
      'localhost',
      '127.0.0.1'
    ];
    if (exactHosts.includes(hostname)) {
      return true;
    }

    // 2. Allow Vercel preview environments specific to this project or owner
    if (hostname.endsWith('.vercel.app')) {
      if (hostname.startsWith('motazin-') || hostname.endsWith('-abdullahalalawi52-jpg.vercel.app')) {
        return true;
      }
    }
  } catch (_) {}
  return false;
}

export default async function handler(req: Request) {
  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';

  const isAllowedOrigin = isAllowedHostOrOrigin(origin);
  const isAllowedReferer = isAllowedHostOrOrigin(referer);

  // Secure validation: block request if both Origin and Referer are invalid, 
  // or if Origin is present but invalid. This prevents curl bypass where Origin is empty.
  const isValidSource = isAllowedOrigin || (origin === '' && isAllowedReferer);

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Only append Allow-Origin if it is a valid allowed origin
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
      headers: { 'Content-Type': 'application/json' }, // Do not include corsHeaders here to prevent origin exposure
    });
  }

  try {
    const body = await req.json();
    const { contents, system_instruction } = body;

    // Validate request body
    if (!Array.isArray(contents) || contents.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or empty contents' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Validate system instruction to prevent general API key abuse
    const systemPromptText = system_instruction?.parts?.[0]?.text || '';
    const isArabicBase = systemPromptText.includes('أنت مستشار مالي ومحاسب قانوني ذكي');
    const isEnglishBase = systemPromptText.includes('You are an expert financial advisor');

    if (!isArabicBase && !isEnglishBase) {
      return new Response(JSON.stringify({ error: 'Invalid system instruction' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    
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
      // Return a safe error message without exposing backend details
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch from Gemini model backend', 
        message: 'The AI service is temporarily unavailable. Please try again later.' 
      }), {
        status: responseStatus,
        headers: jsonHeaders,
      });
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}
