import React, { useEffect, useState, useRef } from 'react';
import { logger, type LogEntry, type LogLevel } from '@/lib/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Download, Play, Pause, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<{ level?: LogLevel; search?: string }>({});
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial logs
    setLogs(logger.getLogs());

    // Subscribe to new logs
    const unsubscribe = logger.subscribe((entry) => {
      if (!isPaused) {
        setLogs(prevLogs => [...prevLogs, entry].slice(-1000)); // Keep last 1000 logs
      }
    });

    return unsubscribe;
  }, [isPaused]);

  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filter.level && log.level !== filter.level) return false;
    if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'debug': return 'text-gray-500';
      case 'info': return 'text-blue-500';
      case 'warn': return 'text-yellow-500';
      case 'error': return 'text-red-500';
    }
  };

  const getLevelBadgeVariant = (level: LogLevel) => {
    switch (level) {
      case 'debug': return 'outline';
      case 'info': return 'default';
      case 'warn': return 'secondary';
      case 'error': return 'destructive';
    }
  };

  const clearLogs = () => {
    logger.clear();
    setLogs([]);
  };

  const exportLogs = () => {
    const blob = new Blob([logger.exportLogs()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (date: Date) => {
    const time = date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-shrink-0 p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Logs</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className={cn(isPaused && "bg-yellow-50")}
              aria-label={isPaused ? 'Resume logging' : 'Pause logging'}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs} aria-label="Clear all logs">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs} aria-label="Export logs to JSON">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filter.level || 'all'}
            onValueChange={(value) => setFilter(prev => ({ 
              ...prev, 
              level: value === 'all' ? undefined : value as LogLevel 
            }))}
          >
            <SelectTrigger className="w-[120px]" aria-label="Filter logs by level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search logs..."
            value={filter.search || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className="flex-1 min-w-[200px]"
            aria-label="Search logs"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoscroll"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
              aria-describedby="autoscroll-help"
            />
            <label htmlFor="autoscroll" className="text-sm text-muted-foreground cursor-pointer">
              Auto-scroll
            </label>
            <span id="autoscroll-help" className="sr-only">
              Automatically scroll to show new log entries
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="p-4">
            <div className="space-y-1 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No logs to display
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded hover:bg-muted/50 transition-colors",
                      log.level === 'error' && "bg-red-50/50",
                      log.level === 'warn' && "bg-yellow-50/50"
                    )}
                    role="log"
                    aria-label={`${log.level} log entry`}
                  >
                    <span className="text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatTimestamp(new Date(log.timestamp))}
                    </span>
                    <Badge 
                      variant={getLevelBadgeVariant(log.level)} 
                      className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0"
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    {log.category && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                        {log.category}
                      </Badge>
                    )}
                    <span className={cn("flex-1 break-words min-w-0", getLevelColor(log.level))}>
                      {log.message}
                    </span>
                    {log.data && (
                      <details className="flex-shrink-0">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground text-xs">
                          Data
                        </summary>
                        <div className="absolute right-0 mt-1 z-10 bg-white border rounded shadow-lg max-w-md">
                          <pre className="p-2 bg-muted rounded text-[10px] overflow-auto max-h-40 whitespace-pre-wrap">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="flex-shrink-0 p-2 border-t text-xs text-muted-foreground text-center bg-gray-50">
        Showing {filteredLogs.length} of {logs.length} logs
        {isPaused && <span className="ml-2 text-yellow-600 font-medium">(Paused)</span>}
      </div>
    </div>
  );
}; 