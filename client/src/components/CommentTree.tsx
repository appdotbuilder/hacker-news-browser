import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { Comment } from '../../../server/src/schema';

interface CommentTreeProps {
  comments: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  children: Comment[];
  depth: number;
  allComments: Comment[];
}

function CommentItem({ comment, children, depth, allComments }: CommentItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // Calculate indent based on depth (max depth for visual clarity)
  const maxVisualDepth = 8;
  const visualDepth = Math.min(depth, maxVisualDepth);
  const indentWidth = visualDepth * 20;

  return (
    <div style={{ marginLeft: `${indentWidth}px` }}>
      <Card className={`mb-3 border-l-4 ${depth === 0 ? 'border-l-orange-400' : 'border-l-gray-300'} bg-white`}>
        <CardContent className="p-3">
          {/* Comment Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <span>👤</span>
                <span className="font-medium">{comment.author}</span>
              </span>
              <span>•</span>
              <span>{formatTimeAgo(comment.time)}</span>
              {children.length > 0 && (
                <>
                  <span>•</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-0 h-auto text-xs hover:text-orange-600"
                  >
                    {isCollapsed ? `[+] ${children.length + 1} replies` : '[-] collapse'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Comment Text */}
          {!isCollapsed && (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                {comment.text}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Child Comments */}
      {!isCollapsed && children.length > 0 && (
        <div className="space-y-2">
          {children.map((child: Comment) => {
            const grandchildren = allComments.filter((c: Comment) => c.parent_id === child.id);
            return (
              <CommentItem
                key={child.id}
                comment={child}
                children={grandchildren}
                depth={depth + 1}
                allComments={allComments}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CommentTree({ comments }: CommentTreeProps) {
  // Build comment tree structure
  const rootComments = comments.filter((comment: Comment) => comment.parent_id === null);
  
  // If no comments, show empty state
  if (rootComments.length === 0) {
    return (
      <Card className="border-orange-200">
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <div className="text-3xl mb-3">💭</div>
            <p className="text-sm">
              No comments to display. This is expected with stub data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rootComments.map((comment: Comment) => {
        const children = comments.filter((c: Comment) => c.parent_id === comment.id);
        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            children={children}
            depth={0}
            allComments={comments}
          />
        );
      })}
    </div>
  );
}