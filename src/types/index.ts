export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string; // ISO string
  merchant?: string;
  payment_mode?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: string; // "December"
  year: number; // 2025
  spent?: number; // Calculated on fetch
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  saving_type: 'monthly' | 'yearly' | 'target'; // Added
  target_month?: string; // Added for 'monthly' type
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  is_read: boolean;
  created_at: string;
  metadata?: {
    budget_id?: string;
    threshold?: number; // 50, 80, 100
  };
}

export interface CategorySpend {
  category: string;
  amount: number;
}