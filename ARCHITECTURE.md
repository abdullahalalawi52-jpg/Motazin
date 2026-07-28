# Architecture & Data Flow

## 1. Overview
The Motazin (حاسبة معادلة الميزانية) app is a React application built with Vite and Tailwind CSS. It focuses on double-entry bookkeeping and accounting equation balancing.

## 2. State Management (Zustand)
The application leverages **Zustand** as a centralized state management solution via `src/store/useAppStore.ts`.
- **Global State**: Includes `budgets`, `currency`, `selectedFile`, and UI states.
- **Transactions & Accounts**: Managed using custom hooks or local state that interacts with Firebase Firestore.
- **Store Abstraction**: By centralizing shared business logic, components like `App.tsx` remain purely presentational, offloading logic to the store or layout components.

## 3. Data Flow & Backend
- **Firebase Firestore**: Used as the primary database for transactions and accounts. The rules (`firestore.rules`) have been updated to support custom accounts, attachment URLs, and rate-limiting on the `/messages` collection.
- **Serverless Functions**: 
  - To secure the Gemini API key, direct client-side calls have been removed.
  - Parsing requests are now routed through `/api/parse`, a Vercel serverless function that interacts with Google's Gemini API on the backend.
  - This prevents `VITE_GEMINI_API_KEY` from being exposed in the frontend bundle.

## 4. Validation (Zod)
All transaction inputs are validated on the client side using **Zod** (`src/utils/validation.ts`).
- **Transaction Schema**: Validates properties such as `date`, `description`, `amount` limits, and `isRecurring` flags.
- **UI Integration**: The `TransactionForm` uses `transactionSchema.safeParse` to capture errors, which are then displayed inline beneath the corresponding input fields to provide immediate user feedback.

## 5. UI Architecture
- **MainLayout**: Provides the primary shell, navigation, and mobile drawer.
- **ModalsContainer**: Centralizes all overlay components (modals) to reduce clutter in the main application tree and leverage lazy loading.
- **Date Formatting**: Managed centrally via `src/utils/date.ts` to ensure consistent localization (`ar-SA` vs `en-GB`) across all tables and forms.
