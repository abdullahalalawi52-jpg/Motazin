import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
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

  const renderApp = () => {
    return render(
      <LanguageProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LanguageProvider>
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

    // Find and click the depreciation calculator button
    // The depreciation button in Arabic contains "إهلاك" (depreciation) or has the calculator icon
    const depBtn = screen.getByRole('button', { name: /حاسبة الإهلاك/i });
    expect(depBtn).toBeInTheDocument();
    
    fireEvent.click(depBtn);

    // Verify the depreciation modal is shown via its test ID
    await waitFor(() => {
      expect(screen.getByTestId('depreciation-modal')).toBeInTheDocument();
    });
  });
});
