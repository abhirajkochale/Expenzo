import { supabase } from '../lib/supabase';
import type {
  Profile,
  Account,
  Transaction,
  Budget,
  Goal,
  Rule,
  Notification,
  AIExplanation,
  TransactionFormData,
  BudgetFormData,
  GoalFormData,
  MonthlySummary,
  CategorySpend,
  RecurringMerchant,
} from '@/types/types';

// Profile API
export const profileApi = {
  async getCurrent(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async update(updates: Partial<Profile>): Promise<Profile> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async updateRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    
    if (error) throw error;
  },
};

// Account API
export const accountApi = {
  async getAll(): Promise<Account[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('accounts')
      .insert({ ...account, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Transaction API
export const transactionApi = {
  async getAll(filters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    type?: string;
  }): Promise<Transaction[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(transaction: TransactionFormData): Promise<Transaction> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        user_id: userId,
        tags: [],
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // NEW: Bulk Create Method for Fast Uploads
  async createMany(transactions: TransactionFormData[]): Promise<Transaction[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('transactions')
      .insert(
        transactions.map(t => ({
          ...t,
          user_id: userId,
          tags: [],
        }))
      )
      .select();
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteAll(): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getRecent(limit = 10): Promise<Transaction[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },
};

// Budget API
export const budgetApi = {
  async getAll(): Promise<Budget[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('category');
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getByMonth(month: number, year: number): Promise<Budget[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .order('category');
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(budget: BudgetFormData): Promise<Budget> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        ...budget,
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Budget>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateSpentAmount(userId: string, month: number, year: number, category: string, amount: number): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .update({ spent_amount: amount })
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .eq('category', category);
    
    if (error) throw error;
  },
};

// Goal API
export const goalApi = {
  async getAll(): Promise<Goal[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(goal: GoalFormData): Promise<Goal> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goal,
        user_id: userId,
        target_date: goal.target_date || null,
        // @ts-ignore - Handle flexible fields not in all types yet
        saving_type: (goal as any).saving_type,
        target_month: (goal as any).target_month,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Rule API
export const ruleApi = {
  async getAll(): Promise<Rule[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(rule: Omit<Rule, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Rule> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('rules')
      .insert({
        ...rule,
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Rule>): Promise<Rule> {
    const { data, error } = await supabase
      .from('rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('rules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Notification API
export const notificationApi = {
  async getAll(): Promise<Notification[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  async markAllAsRead(): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async create(notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'read_at'>): Promise<Notification> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // NEW: Check if specific budget alert already sent this month
  async hasSentBudgetAlert(budgetId: string, threshold: number): Promise<boolean> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    // Get first day of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth)
      .eq('metadata->>budget_id', budgetId)
      .eq('metadata->>threshold', threshold.toString())
      .maybeSingle();

    return !!data;
  },
};

// AI Explanation API
export const aiExplanationApi = {
  async create(explanation: Omit<AIExplanation, 'id' | 'user_id' | 'created_at'>): Promise<AIExplanation> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('ai_explanations')
      .insert({
        ...explanation,
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getRecent(limit = 10): Promise<AIExplanation[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('ai_explanations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },
};

// Views API
export const viewsApi = {
  async getMonthlySummary(month?: string): Promise<MonthlySummary[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    let query = supabase
      .from('v_monthly_summary')
      .select('*')
      .eq('user_id', userId);

    if (month) {
      const monthStart = `${month}-01T00:00:00Z`;
      query = query.eq('month', monthStart);
    }

    const { data, error } = await query.order('month', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getCategorySpend(month?: string): Promise<CategorySpend[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    let query = supabase
      .from('v_category_spend')
      .select('*')
      .eq('user_id', userId);

    if (month) {
      const monthStart = `${month}-01T00:00:00Z`;
      query = query.eq('month', monthStart);
    }

    const { data, error } = await query.order('total_spent', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getRecurringMerchants(): Promise<RecurringMerchant[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('v_recurring_merchants')
      .select('*')
      .eq('user_id', userId)
      .order('occurrence_count', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },
};

// --- Unified API Adapter ---
// Bridges your existing APIs with the new Budgets/AI logic
export const api = {
  getBudgets: budgetApi.getAll,
  createBudget: budgetApi.create,
  updateBudget: budgetApi.update,
  deleteBudget: budgetApi.delete,
  getGoals: goalApi.getAll,
  createGoal: goalApi.create,
  updateGoal: async (id: string, amountToAdd: number) => {
    // Helper to increment goal amount
    const { data: currentGoal } = await supabase.from('goals').select('current_amount').eq('id', id).single();
    if (currentGoal) {
       return goalApi.update(id, { current_amount: Number(currentGoal.current_amount) + amountToAdd });
    }
  },
  getTransactions: async () => transactionApi.getAll(),
  getNotifications: notificationApi.getAll,
  createNotification: notificationApi.create,
  hasSentBudgetAlert: notificationApi.hasSentBudgetAlert,
  getCategorySpendingThisMonth: async (month: string, year: number) => {
    // Convert "December" -> "12"
    const monthIndex = new Date(`${month} 1, 2000`).getMonth() + 1;
    const monthStr = `${year}-${String(monthIndex).padStart(2, '0')}`;
    return viewsApi.getCategorySpend(monthStr);
  }
};