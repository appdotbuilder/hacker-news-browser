import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Story } from '../../../server/src/schema';

interface StoryCardProps {
  story: Story;
  index: number;
  onClick: () => void;
}

export function StoryCard({ story, index, onClick }: StoryCardProps) {
  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  // Get domain from URL
  const getDomain = (url: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return null;
    }
  };

  // Get story type emoji and color
  const getStoryTypeInfo = (type: string) => {
    const typeMap = {
      story: { emoji: '📰', color: 'bg-blue-100 text-blue-800' },
      job: { emoji: '💼', color: 'bg-green-100 text-green-800' },
      ask: { emoji: '❓', color: 'bg-purple-100 text-purple-800' },
      show: { emoji: '📱', color: 'bg-orange-100 text-orange-800' },
      poll: { emoji: '📊', color: 'bg-pink-100 text-pink-800' }
    };
    return typeMap[type as keyof typeof typeMap] || typeMap.story;
  };

  const typeInfo = getStoryTypeInfo(story.story_type);
  const domain = getDomain(story.url);

  return (
    <Card className="story-card hover:shadow-md transition-shadow duration-200 border-orange-200 bg-white">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Story Index */}
          <div className="flex-shrink-0 w-8 text-center">
            <span className="text-sm font-semibold text-gray-500">
              {index}.
            </span>
          </div>

          {/* Story Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">
                  {story.url ? (
                    <a
                      href={story.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-orange-600 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {story.title}
                    </a>
                  ) : (
                    <button
                      onClick={onClick}
                      className="text-left hover:text-orange-600 transition-colors focus:outline-none"
                    >
                      {story.title}
                    </button>
                  )}
                </h3>

                {/* Domain */}
                {domain && (
                  <p className="text-sm text-gray-500 mb-2">
                    🌐 {domain}
                  </p>
                )}

                {/* Text Preview (for Ask HN, etc.) */}
                {story.text && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {story.text.length > 200 
                      ? `${story.text.substring(0, 200)}...` 
                      : story.text
                    }
                  </p>
                )}
              </div>

              {/* Story Type Badge */}
              <Badge className={`ml-2 flex-shrink-0 ${typeInfo.color} border-0`}>
                {typeInfo.emoji} {story.story_type.toUpperCase()}
              </Badge>
            </div>

            <Separator className="my-3" />

            {/* Story Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <span>⬆️</span>
                  <span className="font-medium">{story.score}</span>
                  <span>points</span>
                </span>

                <span className="flex items-center space-x-1">
                  <span>👤</span>
                  <span>{story.author}</span>
                </span>

                <span className="flex items-center space-x-1">
                  <span>⏰</span>
                  <span>{formatTimeAgo(story.time)}</span>
                </span>

                {story.descendants > 0 && (
                  <button
                    onClick={onClick}
                    className="flex items-center space-x-1 hover:text-orange-600 transition-colors"
                  >
                    <span>💬</span>
                    <span className="font-medium">{story.descendants}</span>
                    <span>comments</span>
                  </button>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClick}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-1 h-auto"
              >
                View Details →
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}