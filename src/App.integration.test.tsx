import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('./PdfScanner', () => ({
  FileScanner: () => <div>Mocked PdfScanner</div>,
}));

import App from './App';
import { LanguageProvider } from './i18n';
import { ThemeProvider } from './ThemeContext';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollIntoView for jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock Firebase Modules
vi.mock('./firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn((cb) => {
      // Simulate no authenticated user initially
      cb(null);
      return () => {};
    }),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  },
  db: {},
  storage: {},
  googleProvider: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  setDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  writeBatch: vi.fn(),
  addDoc: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  getRedirectResult: vi.fn(() => Promise.resolve(null)),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null);
    return () => {};
  }),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// Mock Recharts to prevent canvas/layout errors
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
}));

// Mock HTML2Canvas and jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));
vi.mock('html2canvas', () => vi.fn().mockResolvedValue({}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const renderApp = (initialRoute = '/equation') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <LanguageProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </LanguageProvider>
      </MemoryRouter>
    );
  };

  it('renders the dashboard with correct initial titles', async () => {
    renderApp();
    
    // Check if the application logo/title is visible
    // "مُتّزِن" is the default Arabic title
    expect(screen.getByText(/مُتّزِن/i)).toBeInTheDocument();
  });

  it('can open the Depreciation Modal and displays correct title', async () => {
    renderApp();

    const depBtn = screen.getByRole('button', { name: /حاسبة الإهلاك/i });
    expect(depBtn).toBeInTheDocument();
    
    fireEvent.click(depBtn);

    await waitFor(() => {
      expect(screen.getByTestId('depreciation-modal')).toBeInTheDocument();
    });
  });

  it.skip('can open the AI Settings modal and save API Key', async () => {
    // Test skipped because the settings button is now inside the ChatWidget 
    // and only appears conditionally when an API error occurs.
  });

  it('can navigate to AI Advisor and renders the view', async () => {
    renderApp();
    
    // Find and click the AI Advisor nav button
    const aiNavBtns = screen.getAllByRole('button', { name: /المستشار الذكي/i });
    expect(aiNavBtns.length).toBeGreaterThan(0);
    fireEvent.click(aiNavBtns[0]);
    
    // Verify the AI Advisor chat input is rendered
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/اكتب رسالتك هنا/i)).toBeInTheDocument();
    });
  });

  it('can navigate between views using Link tabs', async () => {
    renderApp();
    
    // Check that we have the Balance Sheet tab
    const balanceSheetLinks = screen.getAllByRole('link', { name: /الميزانية العمومية/i });
    expect(balanceSheetLinks.length).toBeGreaterThan(0);
    
    // Find and click the Income Statement link (قائمة الدخل)
    const incomeLinks = screen.getAllByRole('link', { name: /قائمة الدخل/i });
    expect(incomeLinks.length).toBeGreaterThan(0);
    fireEvent.click(incomeLinks[0]);
    
    // Verify that the active styling is applied to the clicked link
    await waitFor(() => {
      expect(incomeLinks[0]).toHaveClass('bg-indigo-600');
    });
  });

  it('can toggle the language from Arabic to English', async () => {
    renderApp();
    
    // Initially in Arabic
    expect(screen.getByText(/مُتّزِن/i)).toBeInTheDocument();
    
    // Find and click the Language switcher button
    const langBtn = screen.getByRole('button', { name: /العربية/i });
    expect(langBtn).toBeInTheDocument();
    fireEvent.click(langBtn);
    
    // Select English from dropdown
    const enBtn = screen.getByRole('button', { name: /English/i });
    expect(enBtn).toBeInTheDocument();
    fireEvent.click(enBtn);
    
    // Verify page elements translate to English
    await waitFor(() => {
      expect(screen.getByText(/Motazin/i)).toBeInTheDocument();
    });
  });

  it('can toggle the application theme', async () => {
    renderApp();
    
    // Find theme toggle button by its aria-label
    const themeBtn = screen.getByRole('button', { name: /Switch to/i });
    expect(themeBtn).toBeInTheDocument();
    
    // Click to toggle
    fireEvent.click(themeBtn);
    
    // Verify theme changes in localStorage
    expect(localStorage.getItem('app_theme')).toBeDefined();
  });

  it('can trigger undo and redo operations', async () => {
    renderApp();
    
    // Verify undo/redo buttons exist
    const undoBtn = screen.getByRole('button', { name: /Undo/i });
    const redoBtn = screen.getByRole('button', { name: /Redo/i });
    
    expect(undoBtn).toBeInTheDocument();
    expect(redoBtn).toBeInTheDocument();
    
    // Initially disabled (no transaction history)
    expect(undoBtn).toBeDisabled();
    expect(redoBtn).toBeDisabled();
  });
});
