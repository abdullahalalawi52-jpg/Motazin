# 🏗️ Motazin Architecture & Data Flow

This document details the internal architecture, state management, and data flow of the Motazin application.

## 1. System Components
Motazin is a client-first React application (SPA) with a serverless backend.
- **Frontend**: React, TypeScript, Tailwind CSS, Vite.
- **Backend (Database & Auth)**: Firebase Auth, Cloud Firestore.
- **Backend (AI & External API)**: Vercel Edge Functions (`/api/chat`).

## 2. Data Flow & State Management

### 2.1 The Dual-Storage Sync Model
Motazin employs an "offline-first capable" dual-storage model to ensure users can interact with the app without an internet connection or before creating an account.

1. **Guest Users (Not Logged In):**
   - Transactions and preferences are saved entirely in the browser's `localStorage` (`motazin_transactions`, `motazin_theme`, `motazin_lang`, etc.).
2. **Authenticated Users:**
   - On login, `localStorage` data is typically migrated or cleared to prevent conflicts, and Firestore becomes the **Single Source of Truth**.
   - `useTransactions` hook listens for real-time changes or syncs data using batch commits to Firestore.

### 2.2 Component Hierarchy & Prop Drilling (Current State)
Currently, state is largely managed in `App.tsx` and passed down through props.
```mermaid
graph TD
    App[App.tsx (Main State Container)]
    App --> MainLayout
    App --> TransactionTable
    App --> FinancialCharts
    App --> AIChat
    App --> useFinancialInsights((Custom Hook))
    App --> useTransactions((Custom Hook))
```
*Note: Due to the size of `App.tsx`, migrating to a global state manager (e.g., Zustand or Context API) is planned for future refactoring to alleviate prop drilling.*

### 2.3 Financial Calculation Pipeline
The financial calculations (Balance Sheet equation: Assets = Liabilities + Equity) are derived dynamically from the raw transactions.

1. **Raw Data**: `Transaction[]` (Array of transactions).
2. **Memoized Calculation (`useFinancialInsights`)**:
   - Iterates over transactions to compute balances for each account (`cash`, `accountsPayable`, `capital`, etc.).
   - Aggregates totals for Assets, Liabilities, and Equities.
   - Computes ratios (Current Ratio, Debt-to-Equity).
3. **UI Rendering**: The aggregated `totals` object is passed to `TransactionTable`, `FinancialCharts`, and the `Dashboard` metrics.

### 2.4 History (Undo/Redo) Architecture
Motazin implements a Command Pattern for Undo/Redo to optimize memory:
- Instead of keeping copies of the entire `Transaction[]` array for each action (which is $O(N \times M)$), the application tracks `HistoryAction` objects.
- A `HistoryAction` contains the delta (what was added, modified, or deleted).
- Reverting an action pops the delta, applies the inverse operation to the current state, and pushes it to the redo stack.

## 3. Data Processing Pipelines (OCR & Files)

### PDF & Image Processing
1. User uploads a PDF or Image.
2. If PDF, `pdf.js` extracts embedded text. If pages are scanned (no embedded text), it renders the page to a `<canvas>`.
3. `tesseract.js` (loaded dynamically to save bundle size) performs OCR on the canvas/image to extract raw text.
4. The raw text is sent to the AI (`/api/chat`) for intelligent extraction into structured `Transaction` JSON format.

### Excel/CSV Processing
1. `xlsx` library parses the uploaded spreadsheet.
2. A heuristic algorithm (Regex and column checking) identifies dates, descriptions, and amounts.
3. Automatically maps the results to `ParsedRow` structures for user review before importing.

## 4. Performance Optimizations
- **React.memo**: Heavy components like `TransactionTable` and `FinancialCharts` are memoized to avoid re-rendering during unrelated state updates (e.g., typing in the search bar or chat).
- **Dynamic Imports**: Large libraries (`tesseract.js`, `html2canvas`, `jspdf`) are loaded only when their specific features are invoked.
- **Batch Commits**: Firestore updates are grouped into chunks of 500 using `writeBatch` to minimize network requests and respect Firestore limits.
