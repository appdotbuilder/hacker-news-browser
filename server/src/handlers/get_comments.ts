import { db } from '../db';
import { commentsTable } from '../db/schema';
import { type GetCommentsInput, type Comment } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getComments = async (input: GetCommentsInput): Promise<Comment[]> => {
  try {
    // Build the complete query in one go to avoid TypeScript issues
    const results = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.story_id, input.story_id))
      .orderBy(asc(commentsTable.time))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Return the comments (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Comment fetching failed:', error);
    throw error;
  }
};