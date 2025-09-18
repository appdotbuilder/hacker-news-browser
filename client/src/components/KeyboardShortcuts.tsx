import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface KeyboardShortcutsProps {
  onSearch: () => void;
  onRefresh: () => void;
}

export function KeyboardShortcuts({ onSearch, onRefresh }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        onSearch();
      }
      
      // Cmd/Ctrl + R for refresh
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault();
        onRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearch, onRefresh]);

  return null; // This component doesn't render anything
}

export function KeyboardShortcutsHelp() {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-3">
        <div className="flex items-center space-x-4 text-xs text-orange-800">
          <span className="font-medium">Shortcuts:</span>
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs px-1 py-0">⌘K</Badge>
            <span>Search</span>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs px-1 py-0">⌘R</Badge>
            <span>Refresh</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}