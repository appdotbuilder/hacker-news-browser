import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommentTree } from '@/components/CommentTree';
import type { StoryWithComments } from '../../../server/src/schema';

interface StoryDetailModalProps {
  storyWithComments: StoryWithComments | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryDetailModal({ storyWithComments, isOpen, onClose }: StoryDetailModalProps) {
  if (!storyWithComments) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Story Details</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Story not available</h3>
              <p className="text-sm">
                This is expected behavior with stub data. Story details will load once the backend is connected.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { story, comments, totalComments } = storyWithComments;

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  // Get story type info
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <DialogTitle className="text-xl leading-tight mb-3">
                    {story.title}
                  </DialogTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${typeInfo.color} border-0`}>
                      {typeInfo.emoji} {story.story_type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Story Content */}
            <Card className="mb-6 border-orange-200">
              <CardContent className="p-4">
                {/* Story URL */}
                {story.url && (
                  <div className="mb-4">
                    <Button
                      asChild
                      variant="outline"
                      className="border-orange-200 hover:bg-orange-50"
                    >
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2"
                      >
                        <span>🌐</span>
                        <span>Visit Link</span>
                        <span>↗</span>
                      </a>
                    </Button>
                  </div>
                )}

                {/* Story Text */}
                {story.text && (
                  <div className="mb-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {story.text}
                      </p>
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Story Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-6">
                    <span className="flex items-center space-x-2">
                      <span>⬆️</span>
                      <span className="font-medium">{story.score}</span>
                      <span>points</span>
                    </span>

                    <span className="flex items-center space-x-2">
                      <span>👤</span>
                      <span className="font-medium">{story.author}</span>
                    </span>

                    <span className="flex items-center space-x-2">
                      <span>⏰</span>
                      <span>{formatTimeAgo(story.time)}</span>
                    </span>

                    <span className="flex items-center space-x-2">
                      <span>💬</span>
                      <span className="font-medium">{totalComments}</span>
                      <span>comments</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  💬 Comments ({totalComments})
                </h3>
              </div>

              {comments.length === 0 ? (
                <Card className="border-orange-200">
                  <CardContent className="p-6 text-center">
                    <div className="text-gray-500">
                      <div className="text-3xl mb-3">💭</div>
                      <p className="text-sm">
                        {totalComments === 0 
                          ? "No comments yet. Be the first to comment!" 
                          : "Comments will appear here once the backend is connected."
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <CommentTree comments={comments} />
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}