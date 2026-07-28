# 📊 Motazin (مُتّزِن) API & Database Documentation

This document provides a comprehensive overview of the Database Schema, Security Rules, and API specifications for the Motazin Web Application.

---

## 🗄️ 1. Database Schema & Storage

Motazin uses Cloud Firestore to store user preferences and transactions. 

### 1.1 Collections & Payloads

#### Collection: `/users/{userId}`
Stores user settings and configurations.
```typescript
{
  currency: string;           // e.g. "OMR", "USD" (Required, max 3 chars)
  createdAt: timestamp;       // ISO-8601 Timestamp (Required, immutable)
  updatedAt: timestamp;       // ISO-8601 Timestamp (Required)
  budgets?: Record<string, number>; // Map of account IDs to allocated amounts (Optional)
  customAccounts?: Account[]; // Array of user-defined accounts (Optional)
}
```

#### Collection: `/users/{userId}/transactions/{transactionId}`
Stores double-entry transaction documents.
```typescript
{
  date: string;               // e.g. "YYYY-MM-DD" (Required, max 50 chars)
  description: string;        // Transaction description (Required, max 500 chars)
  createdAt: timestamp;       // ISO-8601 Timestamp (Required, immutable)
  updatedAt: timestamp;       // ISO-8601 Timestamp (Required)
  impacts: Impact[];          // Array of account impacts (Required, max 100 items)
  
  // Optional Fields
  isRecurring?: boolean;
  recurrenceInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  nextRecurrenceDate?: string | null;
  attachmentUrl?: string | null;
}

// Impact Type
type Impact = {
  accountId: string;
  amount: number;
  type?: 'debit' | 'credit';
};
```

### 1.2 Cloud Firestore Security Rules (`firestore.rules`)
Our updated rules enforce strict validation on schema shapes, field sizes, and ownership.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    function hasOnlyAllowedFields(allowedFields) {
      return request.resource.data.keys().hasOnly(allowedFields);
    }
    
    function hasRequiredFields(requiredFields) {
      return request.resource.data.keys().hasAll(requiredFields);
    }
    
    // Validate User Preferences
    function isValidUserPreferences(data) {
      return hasOnlyAllowedFields(['budgets', 'currency', 'createdAt', 'updatedAt', 'customAccounts']) &&
             hasRequiredFields(['currency', 'createdAt', 'updatedAt']) &&
             data.currency is string && data.currency.size() <= 3;
             // ... [additional strict type checks]
    }
    
    // Validate Transactions
    function isValidTransaction(data) {
      return hasOnlyAllowedFields(['date', 'description', 'impacts', 'createdAt', 'updatedAt', 'isRecurring', 'recurrenceInterval', 'nextRecurrenceDate', 'attachmentUrl']) &&
             hasRequiredFields(['date', 'description', 'impacts', 'createdAt', 'updatedAt']) &&
             data.description.size() <= 500 && data.impacts.size() <= 100;
             // ... [additional strict type checks]
    }

    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId) && isValidUserPreferences(request.resource.data);
      allow update: if isOwner(userId) && isValidUserPreferences(request.resource.data) && request.resource.data.createdAt == resource.data.createdAt;
      
      match /transactions/{transactionId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) && isValidTransaction(request.resource.data);
        allow update: if isOwner(userId) && isValidTransaction(request.resource.data) && request.resource.data.createdAt == resource.data.createdAt;
        allow delete: if isOwner(userId);
      }
    }
  }
}
```

---

## 🤖 2. AI Chatbot API (`/api/chat.ts`)

Motazin integrates with Gemini AI through a serverless backend proxy endpoint.

### Endpoint Specification
* **Path**: `/api/chat`
* **Method**: `POST`
* **Content-Type**: `application/json`

#### Request Payload
```json
{
  "message": "String (User query)",
  "history": [
    { "role": "user" | "model", "parts": [{ "text": "String" }] }
  ],
  "context": {
    "totalAssets": 15000.0,
    "totalLiabilities": 5000.0,
    "totalEquity": 10000.0,
    "netProfit": 2500.0,
    "currentRatio": 3.0,
    "isBalanced": true,
    "transactionCount": 12
  },
  "geminiApiKey": "String (Optional override key from localStorage)"
}
```

#### Response Payload (Success)
```json
{
  "reply": "String (Markdown text response from Gemini)"
}
```

#### Response Payload (Error / Rate Limit 429)
```json
{
  "error": "Quota exceeded",
  "status": 429
}
```

---

## 🔒 3. Security & CSP Guidelines

To protect the financial calculations and user inputs, the web server/headers mandate the following Content-Security-Policy (CSP):

```text
default-src 'self';
script-src 'self';
style-src 'self' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https://lh3.googleusercontent.com;
connect-src 'self' https://*.googleapis.com https://identitytoolkit.googleapis.com;
frame-src 'self';
```
*(Note: 'unsafe-inline' and 'unsafe-eval' are strictly disabled to prevent XSS exploits).*
