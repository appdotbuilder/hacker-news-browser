import { db } from '../db';
import { storiesTable } from '../db/schema';
import { type GetStoriesInput, type StoriesResponse } from '../schema';
import { desc, eq, count } from 'drizzle-orm';

export const getStories = async (input: GetStoriesInput): Promise<StoriesResponse> => {
  try {
    // Build conditions array for filtering
    const conditions = [];

    if (input.type) {
      switch (input.type) {
        case 'ask':
          conditions.push(eq(storiesTable.story_type, 'ask'));
          break;
        case 'show':
          conditions.push(eq(storiesTable.story_type, 'show'));
          break;
        case 'job':
          conditions.push(eq(storiesTable.story_type, 'job'));
          break;
        case 'top':
        case 'new':
        case 'best':
          // These are sorting/ranking filters rather than type filters
          // No WHERE clause needed - just affects ordering
          break;
      }
    }

    // Build the main query based on conditions
    let mainQuery;
    let countQuery;

    if (conditions.length > 0) {
      mainQuery = db.select().from(storiesTable).where(conditions[0]);
      countQuery = db.select({ count: count() }).from(storiesTable).where(conditions[0]);
    } else {
      mainQuery = db.select().from(storiesTable);
      countQuery = db.select({ count: count() }).from(storiesTable);
    }

    // Apply ordering based on type
    if (input.type === 'new') {
      mainQuery = mainQuery.orderBy(desc(storiesTable.created_at));
    } else if (input.type === 'best' || input.type === 'top') {
      // Order by score for best/top stories
      mainQuery = mainQuery.orderBy(desc(storiesTable.score));
    } else {
      // Default ordering by created_at for other types
      mainQuery = mainQuery.orderBy(desc(storiesTable.created_at));
    }

    // Apply pagination to main query
    mainQuery = mainQuery.limit(input.limit).offset(input.offset);

    // Execute both queries
    const [results, totalResults] = await Promise.all([
      mainQuery.execute(),
      countQuery.execute()
    ]);

    const total = totalResults[0].count;

    // Calculate hasMore flag
    const hasMore = input.offset + input.limit < total;

    // Return the response with proper pagination info
    return {
      stories: results,
      total,
      hasMore
    };
  } catch (error) {
    console.error('Get stories failed:', error);
    throw error;
  }
};