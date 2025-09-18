import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NotFoundProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function NotFound({ 
  title = "Nothing found", 
  message = "Try adjusting your search or browse different categories.",
  onRetry 
}: NotFoundProps) {
  return (
    <Card className="text-center py-12 border-orange-200 bg-white">
      <CardContent>
        <div className="text-gray-500">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm mb-4">{message}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="border-orange-200 hover:bg-orange-50"
            >
              🔄 Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}