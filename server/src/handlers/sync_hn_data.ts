import { db } from '../db';
import { storiesTable, commentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

interface HNItem {
  id: number;
  type: string;
  title?: string;
  url?: string;
  text?: string;
  by: string;
  score?: number;
  descendants?: number;
  time: number;
  kids?: number[];
  parent?: number;
}

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

async function fetchHNItem(id: number): Promise<HNItem | null> {
  try {
    const response = await fetch(`${HN_API_BASE}/item/${id}.json`);
    if (!response.ok) return null;
    return await response.json() as HNItem;
  } catch (error) {
    console.error(`Failed to fetch HN item ${id}:`, error);
    return null;
  }
}

async function fetchTopStoryIds(): Promise<number[]> {
  try {
    const response = await fetch(`${HN_API_BASE}/topstories.json`);
    if (!response.ok) return [];
    return await response.json() as number[];
  } catch (error) {
    console.error('Failed to fetch top stories:', error);
    return [];
  }
}

async function syncStory(item: HNItem): Promise<boolean> {
  try {
    // Validate required fields
    if (!item.by || !item.time) {
      console.error(`Invalid story data for item ${item.id}: missing required fields`);
      return false;
    }

    // Check if story already exists
    const existingStory = await db.select()
      .from(storiesTable)
      .where(eq(storiesTable.id, item.id))
      .limit(1)
      .execute();

    const storyData = {
      id: item.id,
      title: item.title || '',
      url: item.url || null,
      text: item.text || null,
      author: item.by,
      score: item.score || 0,
      descendants: item.descendants || 0,
      time: new Date(item.time * 1000), // Convert Unix timestamp to Date
      story_type: getStoryType(item),
      updated_at: new Date()
    };

    if (existingStory.length > 0) {
      // Update existing story
      await db.update(storiesTable)
        .set(storyData)
        .where(eq(storiesTable.id, item.id))
        .execute();
    } else {
      // Insert new story
      await db.insert(storiesTable)
        .values({
          ...storyData,
          created_at: new Date()
        })
        .execute();
    }

    return true;
  } catch (error) {
    console.error(`Failed to sync story ${item.id}:`, error);
    return false;
  }
}

async function syncComment(item: HNItem, storyId: number): Promise<boolean> {
  try {
    // Check if comment already exists
    const existingComment = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, item.id))
      .limit(1)
      .execute();

    if (existingComment.length > 0) {
      return true; // Comment already exists, skip
    }

    // Insert new comment
    await db.insert(commentsTable)
      .values({
        id: item.id,
        story_id: storyId,
        parent_id: item.parent || null,
        author: item.by,
        text: item.text || '',
        time: new Date(item.time * 1000),
        created_at: new Date()
      })
      .execute();

    return true;
  } catch (error) {
    console.error(`Failed to sync comment ${item.id}:`, error);
    return false;
  }
}

function getStoryType(item: HNItem): 'story' | 'job' | 'ask' | 'show' | 'poll' {
  if (item.type === 'job') return 'job';
  if (item.type === 'poll') return 'poll';
  
  const title = item.title?.toLowerCase() || '';
  if (title.startsWith('ask hn')) return 'ask';
  if (title.startsWith('show hn')) return 'show';
  
  return 'story';
}

export const syncHackerNewsData = async (): Promise<{ synced: number; message: string }> => {
  try {
    console.log('Starting Hacker News data sync...');
    
    // Fetch top story IDs (limit to first 50 for performance)
    const topStoryIds = await fetchTopStoryIds();
    const limitedStoryIds = topStoryIds.slice(0, 50);
    
    let syncedCount = 0;
    
    // Sync stories
    for (const storyId of limitedStoryIds) {
      const item = await fetchHNItem(storyId);
      
      if (!item || (item.type !== 'story' && item.type !== 'job')) {
        continue;
      }
      
      const success = await syncStory(item);
      if (success) {
        syncedCount++;
        
        // Sync comments for this story (limit to first 20 comments for performance)
        if (item.kids && item.kids.length > 0) {
          const limitedCommentIds = item.kids.slice(0, 20);
          
          for (const commentId of limitedCommentIds) {
            const commentItem = await fetchHNItem(commentId);
            
            if (commentItem && commentItem.type === 'comment') {
              await syncComment(commentItem, storyId);
            }
          }
        }
      }
    }
    
    const message = `Successfully synced ${syncedCount} stories and their comments`;
    console.log(message);
    
    return {
      synced: syncedCount,
      message
    };
  } catch (error) {
    console.error('Sync operation failed:', error);
    throw error;
  }
};