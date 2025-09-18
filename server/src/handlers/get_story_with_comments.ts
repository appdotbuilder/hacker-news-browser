import { db } from '../db';
import { storiesTable, commentsTable } from '../db/schema';
import { type GetStoryInput, type StoryWithComments } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getStoryWithComments = async (input: GetStoryInput): Promise<StoryWithComments | null> => {
  try {
    // First, fetch the story
    const storyResults = await db.select()
      .from(storiesTable)
      .where(eq(storiesTable.id, input.id))
      .execute();

    if (storyResults.length === 0) {
      return null; // Story not found
    }

    const story = storyResults[0];

    // Then, fetch all comments for this story, ordered by time (oldest first for threaded display)
    const commentsResults = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.story_id, input.id))
      .orderBy(asc(commentsTable.time))
      .execute();

    // Return the combined result
    return {
      story: {
        ...story,
        time: story.time, // Already a Date object
        created_at: story.created_at, // Already a Date object
        updated_at: story.updated_at // Already a Date object
      },
      comments: commentsResults.map(comment => ({
        ...comment,
        time: comment.time, // Already a Date object
        created_at: comment.created_at // Already a Date object
      })),
      totalComments: commentsResults.length
    };
  } catch (error) {
    console.error('Failed to fetch story with comments:', error);
    throw error;
  }
};