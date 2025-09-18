import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-white border-t border-orange-200 mt-12">
      <div className="container mx-auto px-4 py-6">
        <Separator className="mb-4" />
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="text-orange-600">🔥</span>
            <span>Hacker News Browser</span>
            <span>•</span>
            <span>Built with React & tRPC</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>Made with ❤️ for the community</span>
          </div>
        </div>
      </div>
    </footer>
  );
}