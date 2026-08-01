import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Image data is required' }), { status: 400 });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is missing' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `You are a financial AI assistant. I am providing an image of a receipt or invoice.
Please extract the following information and return ONLY a valid JSON object without markdown blocks:
{
  "amount": number (the total amount to pay or received),
  "date": "YYYY-MM-DD" (the date of the transaction),
  "description": "string" (a short description of what was purchased or the vendor name),
  "suggestedAccount": "string" (choose one of: 'cash', 'bank', 'inventory', 'supplies', 'accounts_payable', 'accounts_receivable', 'expense')
}

If any value is missing or you cannot read it, use null. For amounts, remove currency symbols and return a clean number.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg'
        }
      }
    ]);

    const text = result.response.text();
    // Clean up potential markdown formatting like ```json ... ```
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const data = JSON.parse(cleanedText);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Gemini Vision Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }), { status: 500 });
  }
}
