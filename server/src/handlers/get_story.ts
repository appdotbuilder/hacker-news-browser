import { db } from '../db';
import { storiesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetStoryInput, type Story } from '../schema';

export const getStory = async (input: GetStoryInput): Promise<Story | null> => {
  try {
    const result = await db.select()
      .from(storiesTable)
      .where(eq(storiesTable.id, input.id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const story = result[0];
    return {
      ...story,
      time: new Date(story.time),
      created_at: new Date(story.created_at),
      updated_at: new Date(story.updated_at)
    };
  } catch (error) {
    console.error('Failed to fetch story:', error);
    throw error;
  }
};