import { ReactNode } from 'react';

// User and Profile types
export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  income_range: string | null;
  risk_profile: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

// Account types
export type AccountType = 'cash' | 'bank' | 'credit_card' | 'wallet';

export interface Account {
  id: string;
  user_id: string;
  type: AccountType;
  name: string;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

// Transaction types
export type TransactionType = 'income' | 'expense';

export type CategoryType = 
  | 'food' 
  | 'rent' 
  | 'shopping' 
  | 'travel' 
  | 'subscriptions'
  | 'entertainment' 
  | 'healthcare' 
  | 'education' 
  | 'utilities'
  | 'transport' 
  | 'salary' 
  | 'investment' 
  | 'other';

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  merchant: string | null;
  category: CategoryType;
  subcategory: string | null;
  tags: string[];
  is_recurring: boolean;
  source: string;
  payment_mode: string | null;
  created_at: string;
  updated_at: string;
}

// Budget types
export interface Budget {
  id: string;
  user_id: string;
  month: number;
  year: number;
  category: CategoryType;
  limit_amount: number;
  spent_amount: number;
  created_at: string;
  updated_at: string;
}

// Goal types
export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  priority: number;
  is_completed: boolean;
  saving_type?: 'target' | 'monthly' | 'yearly';
  target_month?: string;
  created_at: string;
  updated_at: string;
}

// Rule types
export type RuleType = 'budget_threshold' | 'round_up' | 'recurring_alert';

export interface Rule {
  id: string;
  user_id: string;
  rule_type: RuleType;
  params: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Notification types - UPDATED TO FIX ERRORS
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string; 
  body?: string;    
  type: 'info' | 'warning' | 'alert' | 'success'; 
  level?: string;   // Made OPTIONAL to fix BudgetsPage error
  is_read?: boolean; // Made OPTIONAL to fix MainLayout error
  read_at?: string | null;
  created_at: string;
  metadata?: {
    budget_id?: string;
    threshold?: number;
  };
}

// AI Explanation types
export interface AIExplanation {
  id: string;
  user_id: string;
  type: string;
  input_summary: string | null;
  output_text: string;
  created_at: string;
}

// Guardian Status types
export type GuardianStatus = 'SAFE' | 'CAUTION' | 'CRITICAL';

// View types
export interface MonthlySummary {
  user_id: string;
  month: string;
  total_income: number;
  total_expense: number;
  net_savings: number;
}

export interface CategorySpend {
  user_id: string;   // Required field
  month: string;     // Required field
  category: CategoryType;
  total_spent: number;
  transaction_count: number;
}

export interface RecurringMerchant {
  user_id: string;
  merchant: string;
  occurrence_count: number;
  avg_amount: number;
  last_transaction_date: string;
}

// Form types
export interface OnboardingData {
  username: string;
  password: string;
  income_range: string;
  risk_profile: string;
}

export interface TransactionFormData {
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  merchant?: string;
  category: CategoryType;
  subcategory?: string;
  account_id?: string;
  payment_mode?: string;
  source?: string;
}

export interface BudgetFormData {
  month: number;
  year: number;
  category: CategoryType;
  limit_amount: number;
}

export interface GoalFormData {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  priority?: number;
  saving_type?: string;
  target_month?: string;
}

// Chat types
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

// Dashboard types
export interface DashboardData {
  status: GuardianStatus;
  monthly_income: number;
  monthly_expense: number;
  savings_rate: number;
  top_categories: CategorySpend[];
  upcoming_bills: Transaction[];
  cash_flow_prediction: number;
}

// Category metadata
export interface CategoryMeta {
  value: CategoryType;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORY_METADATA: Record<CategoryType, Omit<CategoryMeta, 'value'>> = {
  food: { label: 'Food & Dining', icon: '🍽️', color: 'chart-1' },
  rent: { label: 'Rent', icon: '🏠', color: 'chart-2' },
  shopping: { label: 'Shopping', icon: '🛍️', color: 'chart-3' },
  travel: { label: 'Travel', icon: '✈️', color: 'chart-4' },
  subscriptions: { label: 'Subscriptions', icon: '📱', color: 'chart-5' },
  entertainment: { label: 'Entertainment', icon: '🎬', color: 'chart-1' },
  healthcare: { label: 'Healthcare', icon: '⚕️', color: 'chart-2' },
  education: { label: 'Education', icon: '📚', color: 'chart-3' },
  utilities: { label: 'Utilities', icon: '💡', color: 'chart-4' },
  transport: { label: 'Transport', icon: '🚗', color: 'chart-5' },
  salary: { label: 'Salary', icon: '💰', color: 'success' },
  investment: { label: 'Investment', icon: '📈', color: 'primary' },
  other: { label: 'Other', icon: '📦', color: 'muted' },
};