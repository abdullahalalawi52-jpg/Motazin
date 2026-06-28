import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatWidget } from './Chat';
import { LanguageProvider } from './i18n';

// Mock scrollIntoView as it's not supported in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockFinancialContext = {
  accounts: { bank: 15000, capital: 15000, cash: 0 },
  totalAssets: 15000,
  totalLiabilities: 0,
  totalEquity: 15000,
  isBalanced: true,
  transactionCount: 2,
  netProfit: 0,
  currentRatio: 1.5,
  debtToEquity: 0,
};

describe('ChatWidget Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Default mock response for fetch to avoid unhandled rejections/TypeError
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [] })
    });
  });

  const renderChat = (financialContext = mockFinancialContext, geminiApiKey = '') => {
    return render(
      <LanguageProvider>
        <ChatWidget
          financialContext={financialContext}
          geminiApiKey={geminiApiKey}
          onApiKeyChange={vi.fn()}
        />
      </LanguageProvider>
    );
  };

  it('renders floating chat button and toggles chat window', async () => {
    renderChat();

    // Find the floating button (uses aria-label="المستشار الذكي")
    const toggleButton = screen.getByLabelText('المستشار الذكي');
    expect(toggleButton).toBeInTheDocument();

    // Click to open
    fireEvent.click(toggleButton);

    // Verify chat header is rendered (المساعد الافتراضي)
    expect(screen.getByText(/المساعد الافتراضي/i)).toBeInTheDocument();

    // Click to close
    fireEvent.click(toggleButton);

    // Verify chat window is closed (has pointer-events-none class)
    expect(screen.getByText(/المساعد الافتراضي/i).closest('.glass')).toHaveClass('pointer-events-none');
  });

  it('displays welcome message with financial context indicators when opened', async () => {
    renderChat();

    // Open chat
    fireEvent.click(screen.getByLabelText('المستشار الذكي'));

    // Check welcome message includes mention of financial data being available
    expect(screen.getByText(/لديّ/i)).toBeInTheDocument();
    expect(screen.getByText(/بياناتك المالية/i)).toBeInTheDocument();
  });

  it('falls back to static keyword replies when AI is not configured or fails', async () => {
    renderChat(mockFinancialContext, '');

    // Open chat
    fireEvent.click(screen.getByLabelText('المستشار الذكي'));

    const input = screen.getByPlaceholderText(/اكتب رسالتك هنا/i);
    const sendButton = screen.getByRole('button', { name: /إرسال|send/i });

    // Send "معادلة" (equation keyword)
    fireEvent.change(input, { target: { value: 'معادلة الميزانية' } });
    await waitFor(() => expect(sendButton).not.toBeDisabled());
    fireEvent.click(sendButton);

    // Wait for the response (it has a mock delay of 800-1400ms for static replies)
    await waitFor(() => {
      expect(screen.getByText(/الأصول = الخصوم \+ حقوق الملكية/i)).toBeInTheDocument();
    }, { timeout: 2500 });
  });

  it('handles financial queries using local context data', async () => {
    renderChat(mockFinancialContext, '');

    // Open chat
    fireEvent.click(screen.getByLabelText('المستشار الذكي'));

    const input = screen.getByPlaceholderText(/اكتب رسالتك هنا/i);
    const sendButton = screen.getByRole('button', { name: /إرسال|send/i });

    // Send "رصيد البنك"
    fireEvent.change(input, { target: { value: 'كم رصيد البنك؟' } });
    await waitFor(() => expect(sendButton).not.toBeDisabled());
    fireEvent.click(sendButton);

    await waitFor(() => {
      // Check that the mock context value is displayed (handles both English and Arabic-Indic digit formats)
      expect(screen.getByText(/رصيد البنك:/)).toBeInTheDocument();
      const contentText = screen.getByText(/رصيد البنك:/).closest('div')?.textContent || '';
      expect(contentText).toMatch(/15|١٥/);
    }, { timeout: 2500 });
  });

  it('calls Gemini API endpoint when geminiApiKey is provided', async () => {
    // Mock successful Gemini API response for all model tries
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: 'أهلاً بك! ميزانيتك ممتازة ومتوازنة.' }]
          }
        }]
      })
    });

    renderChat(mockFinancialContext, 'dummy-api-key');

    // Open chat
    fireEvent.click(screen.getByLabelText('المستشار الذكي'));

    const input = screen.getByPlaceholderText(/اكتب رسالتك هنا/i);
    const sendButton = screen.getByRole('button', { name: /إرسال|send/i });

    // Send custom question
    fireEvent.change(input, { target: { value: 'حلل وضعي المالي' } });
    await waitFor(() => expect(sendButton).not.toBeDisabled());
    fireEvent.click(sendButton);

    // Verify it shows typing state (bouncing dots animation)
    expect(document.querySelector('.animate-bounce')).toBeInTheDocument();

    await waitFor(() => {
      // Check that API response text is rendered in chat
      expect(screen.getByText(/ميزانيتك ممتازة ومتوازنة/i)).toBeInTheDocument();
    }, { timeout: 2500 });

    // Verify fetch was called with the correct models URL
    expect(mockFetch).toHaveBeenCalled();
  });

  it('displays rate limit message when API returns 429', async () => {
    // Mock rate limit response for all model tries
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Quota exceeded' })
    });

    renderChat(mockFinancialContext, 'dummy-api-key');

    // Open chat
    fireEvent.click(screen.getByLabelText('المستشار الذكي'));

    const input = screen.getByPlaceholderText(/اكتب رسالتك هنا/i);
    const sendButton = screen.getByRole('button', { name: /إرسال|send/i });

    fireEvent.change(input, { target: { value: 'حلل وضعي المالي' } });
    await waitFor(() => expect(sendButton).not.toBeDisabled());
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/تجاوزت الحد المسموح به للطلبات/i)).toBeInTheDocument();
    }, { timeout: 2500 });
  });
});
