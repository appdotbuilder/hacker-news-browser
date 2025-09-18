import { db } from '../db';
import { storiesTable } from '../db/schema';
import { type SearchStoriesInput, type StoriesResponse } from '../schema';
import { or, ilike, sql, count } from 'drizzle-orm';

export const searchStories = async (input: SearchStoriesInput): Promise<StoriesResponse> => {
  try {
    const { query, limit, offset } = input;
    
    // Create search conditions for title, text, and author (case-insensitive partial matches)
    const searchTerm = `%${query}%`;
    const searchConditions = or(
      ilike(storiesTable.title, searchTerm),
      ilike(storiesTable.text, searchTerm),
      ilike(storiesTable.author, searchTerm)
    );

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(storiesTable)
      .where(searchConditions)
      .execute();
    
    const total = totalResult[0]?.count || 0;

    // Get the actual stories with pagination, ordered by score desc then time desc
    const storiesResult = await db
      .select()
      .from(storiesTable)
      .where(searchConditions)
      .orderBy(sql`${storiesTable.score} DESC, ${storiesTable.time} DESC`)
      .limit(limit)
      .offset(offset)
      .execute();

    // Calculate if there are more results
    const hasMore = offset + limit < total;

    return {
      stories: storiesResult,
      total,
      hasMore
    };
  } catch (error) {
    console.error('Story search failed:', error);
    throw error;
  }
};