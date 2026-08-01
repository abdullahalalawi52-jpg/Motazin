import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import chatHandler from '../../api/chat';
import parseHandler from '../../api/parse';

// Mock the global fetch
const originalFetch = global.fetch;

describe('API Endpoints', () => {
  beforeEach(() => {
    // Set dummy env variables
    process.env.GEMINI_API_KEY = 'test-api-key';
    
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('chat.ts', () => {
    it('should return 405 for GET requests', async () => {
      const req = new Request('http://localhost/api/chat', {
        method: 'GET',
        headers: { origin: 'http://localhost' }
      });
      const res = await chatHandler(req);
      expect(res.status).toBe(405);
      const data = await res.json();
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 403 for unauthorized origins', async () => {
      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { origin: 'https://evil-site.com' },
        body: JSON.stringify({}),
      });
      const res = await chatHandler(req);
      expect(res.status).toBe(403);
    });

    it('should return 400 for empty contents', async () => {
      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { origin: 'http://localhost' },
        body: JSON.stringify({ contents: [] }),
      });
      const res = await chatHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid or empty contents');
    });

    it('should return 400 for invalid system instruction', async () => {
      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { origin: 'http://localhost' },
        body: JSON.stringify({ 
          contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
          system_instruction: { parts: [{ text: 'I am a malicious prompt' }] } 
        }),
      });
      const res = await chatHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid system instruction');
    });

    it('should process a valid request and return success (Happy Path)', async () => {
      // Mock fetch success
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'response' }] } }] })
      });

      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { origin: 'http://localhost' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
          system_instruction: { parts: [{ text: `أنت مساعد مالي ذكي ومحاسب محترف في تطبيق "متزن". مهمتك هي مساعدة المستخدم في فهم معادلة الميزانية (الأصول = الخصوم + حقوق الملكية)، وإدارة حساباته، وتقديم نصائح مالية مبنية على البيانات.
تحدث بلهجة مهنية وودية باللغة العربية. استخدم التنسيق الغني (Markdown) والنقاط لجعل الإجابات سهلة القراءة.` }] }
        }),
      });
      
      const res = await chatHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.candidates).toBeDefined();
    });
  });

  describe('parse.ts', () => {
    it('should return 405 for GET requests', async () => {
      const req = new Request('http://localhost/api/parse', {
        method: 'GET',
        headers: { origin: 'http://localhost' }
      });
      const res = await parseHandler(req);
      expect(res.status).toBe(405);
    });

    it('should return 403 for unauthorized origins', async () => {
      const req = new Request('http://localhost/api/parse', {
        method: 'POST',
        headers: { origin: 'https://evil-site.com' },
        body: JSON.stringify({}),
      });
      const res = await parseHandler(req);
      expect(res.status).toBe(403);
    });

    it('should return 400 for missing text', async () => {
      const req = new Request('http://localhost/api/parse', {
        method: 'POST',
        headers: { origin: 'http://localhost' },
        body: JSON.stringify({}),
      });
      const res = await parseHandler(req);
      expect(res.status).toBe(400);
    });

    it('should process a valid request and return parsed JSON (Happy Path)', async () => {
      // Mock fetch success
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([{ date: '01/01/2026', description: 'Test', amount: 100 }])
      });

      const req = new Request('http://localhost/api/parse', {
        method: 'POST',
        headers: { origin: 'http://localhost' },
        body: JSON.stringify({ text: 'Valid OCR text' }),
      });
      
      const res = await parseHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].amount).toBe(100);
    });
  });
});
