type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  category?: string;
}

type LogListener = (entry: LogEntry) => void;

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 1000;
  private enabled = true;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createEntry(level: LogLevel, message: string, data?: any, category?: string): LogEntry {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      data,
      category
    };
  }

  private addLog(entry: LogEntry) {
    if (!this.enabled) return;

    this.logs.push(entry);
    
    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify all listeners
    this.listeners.forEach(listener => listener(entry));

    // Also log to console in development
    if (import.meta.env.DEV) {
      const style = this.getConsoleStyle(entry.level);
      console.log(
        `%c[${entry.level.toUpperCase()}]%c ${entry.category ? `[${entry.category}] ` : ''}${entry.message}`,
        style,
        'color: inherit',
        entry.data
      );
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case 'debug': return 'color: #6B7280';
      case 'info': return 'color: #3B82F6';
      case 'warn': return 'color: #F59E0B';
      case 'error': return 'color: #EF4444; font-weight: bold';
    }
  }

  debug(message: string, data?: any, category?: string) {
    this.addLog(this.createEntry('debug', message, data, category));
  }

  info(message: string, data?: any, category?: string) {
    this.addLog(this.createEntry('info', message, data, category));
  }

  warn(message: string, data?: any, category?: string) {
    this.addLog(this.createEntry('warn', message, data, category));
  }

  error(message: string, data?: any, category?: string) {
    this.addLog(this.createEntry('error', message, data, category));
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getLogs(filter?: { level?: LogLevel; category?: string; limit?: number }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter?.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }

    if (filter?.category) {
      filtered = filtered.filter(log => log.category === filter.category);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener(this.createEntry('info', 'Logs cleared')));
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = Logger.getInstance();
export type { LogEntry, LogLevel, LogListener }; 