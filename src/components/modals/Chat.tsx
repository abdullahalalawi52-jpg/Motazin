import React from 'react';
import { ChatWindow } from '../Chat/ChatWindow';

interface FinancialContext {
  accounts: Record<string, number>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
  transactionCount: number;
  netProfit: number;
  currentRatio: number;
  debtToEquity: number;
}

interface ChatWidgetProps {
  financialContext?: FinancialContext;
  geminiApiKey?: string;
  onApiKeyChange?: (key: string) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = (props) => {
  return <ChatWindow {...props} />;
};