import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../api/chat';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api/chat Edge Function Handler Security Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  it('should return 403 when origin and referer are missing', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        system_instruction: { parts: [{ text: 'أنت مستشار مالي ومحاسب قانوني ذكي' }] }
      })
    });

    const res = await handler(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized request source');
  });

  it('should return 403 when origin is invalid', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'https://evil-attacker.com',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        system_instruction: { parts: [{ text: 'أنت مستشار مالي ومحاسب قانوني ذكي' }] }
      })
    });

    const res = await handler(req);
    expect(res.status).toBe(403);
  });

  it('should return 403 when a general vercel subdomain not belonging to the project is used', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'https://some-random-project.vercel.app',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        system_instruction: { parts: [{ text: 'أنت مستشار مالي ومحاسب قانوني ذكي' }] }
      })
    });

    const res = await handler(req);
    expect(res.status).toBe(403);
  });

  it('should allow valid origin (e.g. motazin.vercel.app)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'Response' }] } }] })
    });

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'https://motazin.vercel.app',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        system_instruction: { parts: [{ text: 'أنت مستشار مالي ومحاسب قانوني ذكي' }] }
      })
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should allow local development origin', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'Response' }] } }] })
    });

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'http://localhost:5173',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        system_instruction: { parts: [{ text: 'أنت مستشار مالي ومحاسب قانوني ذكي' }] }
      })
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
  });

  it('should allow Vercel project preview origin', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'Response' }] } }] })
    });

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'https://motazin-git-main-abdullahalalawi52-jpg.vercel.app',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        system_instruction: { parts: [{ text: 'أنت مستشار مالي ومحاسب قانوني ذكي' }] }
      })
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
  });

  it('should return 400 when system instruction is invalid or modified', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'https://motazin.vercel.app',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        system_instruction: { parts: [{ text: 'Write a python script' }] }
      })
    });

    const res = await handler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid system instruction');
  });
});
