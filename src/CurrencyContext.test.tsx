import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CurrencyProvider, useCurrency, currencies } from './CurrencyContext';

// A helper component to test the context consumer
const TestConsumer = () => {
  const { currency, setCurrency, formatCurrency, formatCurrencyCompact, currencySymbol } = useCurrency();
  return (
    <div>
      <span data-testid="currency">{currency}</span>
      <span data-testid="symbol">{currencySymbol}</span>
      <span data-testid="formatted">{formatCurrency(1250.5)}</span>
      <span data-testid="compact">{formatCurrencyCompact(1500000)}</span>
      <button data-testid="set-usd" onClick={() => setCurrency('USD')}>Set USD</button>
    </div>
  );
};

describe('CurrencyContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides default currency OMR', () => {
    render(
      <CurrencyProvider>
        <TestConsumer />
      </CurrencyProvider>
    );

    expect(screen.getByTestId('currency').textContent).toBe('OMR');
    expect(screen.getByTestId('symbol').textContent).toBe('ر.ع.');
  });

  it('loads saved currency from localStorage on mount', () => {
    localStorage.setItem('app_currency', 'USD');

    render(
      <CurrencyProvider>
        <TestConsumer />
      </CurrencyProvider>
    );

    expect(screen.getByTestId('currency').textContent).toBe('USD');
  });

  it('updates currency and saves to localStorage', () => {
    render(
      <CurrencyProvider>
        <TestConsumer />
      </CurrencyProvider>
    );

    const button = screen.getByTestId('set-usd');
    fireEvent.click(button);

    expect(screen.getByTestId('currency').textContent).toBe('USD');
    expect(localStorage.getItem('app_currency')).toBe('USD');
  });

  it('formats currency correctly', () => {
    render(
      <CurrencyProvider>
        <TestConsumer />
      </CurrencyProvider>
    );

    // OMR format: check that it includes Rial or OMR symbol/locale format
    const formatted = screen.getByTestId('formatted').textContent;
    expect(formatted).toContain('OMR');
    expect(formatted).toContain('1,250.50');
  });

  it('formats compact currency correctly', () => {
    render(
      <CurrencyProvider>
        <TestConsumer />
      </CurrencyProvider>
    );

    // OMR compact format for 1,500,000 should be 1.5M OMR
    const compact = screen.getByTestId('compact').textContent;
    expect(compact).toContain('OMR');
    expect(compact).toContain('1.5');
  });

  it('throws error when useCurrency is used outside CurrencyProvider', () => {
    // Suppress console.error for clean test run
    const consoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useCurrency must be used within a CurrencyProvider');

    console.error = consoleError;
  });
});
