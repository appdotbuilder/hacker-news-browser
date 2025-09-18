import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { StoryCard } from '@/components/StoryCard';
import { SearchBar } from '@/components/SearchBar';
import { StoryDetailModal } from '@/components/StoryDetailModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotFound } from '@/components/NotFound';
import { Footer } from '@/components/Footer';
import { KeyboardShortcuts, KeyboardShortcutsHelp } from '@/components/KeyboardShortcuts';
// Using type-only imports for better TypeScript compliance
import type { Story, StoriesResponse, StoryWithComments } from '../../server/src/schema';

function App() {
  // State for stories and pagination
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'top' | 'new' | 'best' | 'ask' | 'show' | 'job'>('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStory, setSelectedStory] = useState<StoryWithComments | null>(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Load stories based on current tab and search
  const loadStories = useCallback(async (resetData = false, currentOffset = offset) => {
    setIsLoading(true);
    try {
      let result: StoriesResponse;
      
      if (searchQuery.trim()) {
        result = await trpc.searchStories.query({
          query: searchQuery.trim(),
          limit: 30,
          offset: resetData ? 0 : currentOffset
        });
      } else {
        result = await trpc.getStories.query({
          type: activeTab,
          limit: 30,
          offset: resetData ? 0 : currentOffset
        });
      }

      if (resetData) {
        setStories(result.stories);
        setOffset(result.stories.length);
      } else {
        setStories((prev: Story[]) => [...prev, ...result.stories]);
        setOffset((prev: number) => prev + result.stories.length);
      }
      
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, offset]);

  // Load stories on tab or search change
  useEffect(() => {
    setOffset(0);
    loadStories(true, 0);
  }, [activeTab, searchQuery]);

  // Handle story click
  const handleStoryClick = async (storyId: number) => {
    try {
      const storyWithComments = await trpc.getStoryWithComments.query({ id: storyId });
      setSelectedStory(storyWithComments);
      setIsStoryModalOpen(true);
    } catch (error) {
      console.error('Failed to load story details:', error);
    }
  };

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle keyboard shortcuts
  const focusSearch = useCallback(() => {
    // Focus the search input - would need ref implementation
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement | null;
    searchInput?.focus();
  }, []);

  const refreshStories = useCallback(() => {
    setOffset(0);
    loadStories(true);
  }, [loadStories]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newTab = value as 'top' | 'new' | 'best' | 'ask' | 'show' | 'job';
    setActiveTab(newTab);
    setSearchQuery(''); // Clear search when changing tabs
  };

  // Load more stories
  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadStories(false);
    }
  };

  // Sync data from Hacker News
  const syncData = async () => {
    try {
      await trpc.syncHackerNewsData.mutate();
      // Reload current stories after sync
      setOffset(0);
      loadStories(true);
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">🔥</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Hacker News
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <SearchBar onSearch={handleSearch} />
              <Button 
                onClick={syncData} 
                variant="outline"
                className="border-orange-200 hover:bg-orange-50"
              >
                🔄 Sync Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Notice about stub data */}
        <div className="space-y-4 mb-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <span className="text-orange-600">⚠️</span>
                <p className="text-orange-800 text-sm">
                  <strong>Demo Mode:</strong> Backend handlers are currently using stub data. 
                  Stories and comments shown are placeholders until the database is implemented.
                </p>
              </div>
            </CardContent>
          </Card>
          <KeyboardShortcutsHelp />
        </div>

        {/* Story Categories */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid grid-cols-6 w-full bg-white border border-orange-200">
            <TabsTrigger value="top" className="data-[state=active]:bg-orange-100">
              🔥 Top
            </TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-orange-100">
              ✨ New
            </TabsTrigger>
            <TabsTrigger value="best" className="data-[state=active]:bg-orange-100">
              ⭐ Best
            </TabsTrigger>
            <TabsTrigger value="ask" className="data-[state=active]:bg-orange-100">
              ❓ Ask
            </TabsTrigger>
            <TabsTrigger value="show" className="data-[state=active]:bg-orange-100">
              📱 Show
            </TabsTrigger>
            <TabsTrigger value="job" className="data-[state=active]:bg-orange-100">
              💼 Jobs
            </TabsTrigger>
          </TabsList>

          {/* Stories Content */}
          <div className="mt-6">
            {searchQuery && (
              <div className="mb-4">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  🔍 Search results for: "{searchQuery}"
                </Badge>
              </div>
            )}

            {stories.length === 0 && !isLoading ? (
              <NotFound
                title="No stories found"
                message={searchQuery 
                  ? "Try adjusting your search query or browse different categories."
                  : "Stories will appear here once the backend is connected to real data."
                }
                onRetry={() => loadStories(true)}
              />
            ) : (
              <div className="space-y-4">
                {stories.map((story: Story, index: number) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    index={index + 1}
                    onClick={() => handleStoryClick(story.id)}
                  />
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center pt-6">
                    <Button 
                      onClick={loadMore} 
                      disabled={isLoading}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      {isLoading ? 'Loading...' : '📚 Load More Stories'}
                    </Button>
                  </div>
                )}

                {/* Loading indicator */}
                {isLoading && stories.length === 0 && (
                  <div className="text-center py-8">
                    <LoadingSpinner size="md" text="Loading stories..." />
                  </div>
                )}
              </div>
            )}
          </div>
        </Tabs>
      </main>

      <Footer />

      {/* Story Detail Modal */}
      <StoryDetailModal
        storyWithComments={selectedStory}
        isOpen={isStoryModalOpen}
        onClose={() => {
          setIsStoryModalOpen(false);
          setSelectedStory(null);
        }}
      />

      {/* Keyboard Shortcuts Handler */}
      <KeyboardShortcuts onSearch={focusSearch} onRefresh={refreshStories} />
      </div>
    </ErrorBoundary>
  );
}

export default App;