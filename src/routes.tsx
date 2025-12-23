import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  requiresAuth?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <HomePage />,
    visible: false,
    requiresAuth: false
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <DashboardPage />,
    requiresAuth: true
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    visible: false,
    requiresAuth: false
  },
  {
    name: 'Signup',
    path: '/signup',
    element: <SignupPage />,
    visible: false,
    requiresAuth: false
  },
  {
    name: 'Transactions',
    path: '/transactions',
    element: <TransactionsPage />,
    requiresAuth: true
  },
  {
    name: 'Spending Limits',
    path: '/budgets',
    element: <BudgetsPage />,
    requiresAuth: true
  },
  {
    name: 'Patterns',
    path: '/insights',
    element: <InsightsPage />,
    requiresAuth: true
  },
  {
    name: 'Settings',
    path: '/settings',
    element: <SettingsPage />,
    requiresAuth: true
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminPage />,
    visible: false,
    requiresAuth: true
  }
];

export default routes;
