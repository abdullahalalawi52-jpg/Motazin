import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { FileScanner } from './PdfScanner';
import { LanguageProvider } from './i18n';

// Mock external heavy libraries
vi.mock('pdfjs-dist', () => ({
  version: 'mock-version',
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: '10/10/2026' }, { str: 'شراء لوازم مكتبية' }, { str: '-150' }, { str: 'supplies' }]
        })
      })
    })
  })
}));

vi.mock('xlsx', () => ({
  read: vi.fn().mockReturnValue({
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {}
    }
  }),
  utils: {
    sheet_to_json: vi.fn().mockReturnValue([
      ['10/10/2026', 'شراء لوازم مكتبية', -150, 'supplies']
    ])
  }
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: '10/10/2026 شراء لوازم مكتبية -150' })
  }
}));

// Mock tesseract.js worker inline to avoid hoisting/initialization issues
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn().mockResolvedValue({
    recognize: vi.fn().mockResolvedValue({ data: { text: '10/10/2026 شراء لوازم مكتبية -150' } }),
    terminate: vi.fn().mockResolvedValue(null)
  })
}));

describe('FileScanner (PdfScanner) Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderScanner = (onImport = vi.fn(), onClose = vi.fn()) => {
    return render(
      <LanguageProvider>
        <FileScanner geminiApiKey="" onImport={onImport} onClose={onClose} />
      </LanguageProvider>
    );
  };

  it('renders correctly with upload dropzone', () => {
    renderScanner();

    // Verify header and dropzone label
    expect(screen.getByText(/استيراد ملفات\/صور/i)).toBeInTheDocument();
    expect(screen.getByText(/انقر هنا للرفع أو اسحب الملف هنا/i)).toBeInTheDocument();
  });

  it('displays error on unsupported file type', async () => {
    renderScanner();

    const input = screen.getByLabelText(/انقر هنا للرفع|click to upload/i);
    
    // Create an unsupported file
    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Unsupported file format/i)).toBeInTheDocument();
    });
  });

  it('successfully triggers close callback when clicking close button', () => {
    const onClose = vi.fn();
    renderScanner(vi.fn(), onClose);

    const closeBtn = screen.getByRole('button', { name: /إغلاق|close/i });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
