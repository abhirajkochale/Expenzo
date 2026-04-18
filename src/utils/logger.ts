// Simple global logging service for production debugging
type LogEntry = {
  timestamp: string;
  level: 'info' | 'error' | 'warn';
  message: string;
  data?: any;
};

const LOG_STORAGE_KEY = 'expenzo_debug_logs';

export const logger = {
  log: (message: string, data?: any) => {
    logger._addEntry('info', message, data);
  },
  error: (message: string, data?: any) => {
    logger._addEntry('error', message, data);
  },
  warn: (message: string, data?: any) => {
    logger._addEntry('warn', message, data);
  },
  getLogs: (): LogEntry[] => {
    try {
      return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },
  clearLogs: () => {
    localStorage.removeItem(LOG_STORAGE_KEY);
  },
  _addEntry: (level: LogEntry['level'], message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data
    };
    console[level](`[Expenzo] ${message}`, data);
    const logs = logger.getLogs();
    logs.unshift(entry);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(0, 50))); // Keep last 50
    // Dispatch event so UI can update
    window.dispatchEvent(new CustomEvent('expenzo_log_added'));
  }
};
