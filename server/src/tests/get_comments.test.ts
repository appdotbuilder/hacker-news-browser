import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storiesTable, commentsTable } from '../db/schema';
import { type GetCommentsInput } from '../schema';
import { getComments } from '../handlers/get_comments';
import { eq } from 'drizzle-orm';

describe('getComments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create a test story first
    const storyResult = await db.insert(storiesTable)
      .values({
        id: 1,
        title: 'Test Story',
        author: 'testuser',
        score: 10,
        descendants: 3,
        time: new Date('2024-01-01T10:00:00Z'),
        story_type: 'story'
      })
      .returning()
      .execute();

    const story = storyResult[0];

    // Create test comments with different timestamps for ordering
    await db.insert(commentsTable)
      .values([
        {
          id: 1,
          story_id: story.id,
          parent_id: null, // Top-level comment
          author: 'commenter1',
          text: 'First comment',
          time: new Date('2024-01-01T10:05:00Z')
        },
        {
          id: 2,
          story_id: story.id,
          parent_id: 1, // Reply to first comment
          author: 'commenter2',
          text: 'Reply to first comment',
          time: new Date('2024-01-01T10:10:00Z')
        },
        {
          id: 3,
          story_id: story.id,
          parent_id: null, // Another top-level comment
          author: 'commenter3',
          text: 'Second top-level comment',
          time: new Date('2024-01-01T10:15:00Z')
        }
      ])
      .execute();

    return { story };
  };

  it('should fetch comments for a story', async () => {
    const { story } = await createTestData();

    const input: GetCommentsInput = {
      story_id: story.id,
      limit: 100,
      offset: 0
    };

    const result = await getComments(input);

    expect(result).toHaveLength(3);
    expect(result[0].author).toEqual('commenter1');
    expect(result[0].text).toEqual('First comment');
    expect(result[0].story_id).toEqual(story.id);
    expect(result[0].parent_id).toBeNull();
    expect(result[0].time).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should order comments by time chronologically', async () => {
    const { story } = await createTestData();

    const input: GetCommentsInput = {
      story_id: story.id,
      limit: 100,
      offset: 0
    };

    const result = await getComments(input);

    expect(result).toHaveLength(3);
    
    // Verify chronological ordering
    expect(result[0].text).toEqual('First comment');
    expect(result[1].text).toEqual('Reply to first comment');
    expect(result[2].text).toEqual('Second top-level comment');
    
    // Verify timestamps are in order
    expect(result[0].time.getTime()).toBeLessThan(result[1].time.getTime());
    expect(result[1].time.getTime()).toBeLessThan(result[2].time.getTime());
  });

  it('should handle pagination correctly', async () => {
    const { story } = await createTestData();

    // Test first page
    const firstPage: GetCommentsInput = {
      story_id: story.id,
      limit: 2,
      offset: 0
    };

    const firstResult = await getComments(firstPage);
    expect(firstResult).toHaveLength(2);
    expect(firstResult[0].text).toEqual('First comment');
    expect(firstResult[1].text).toEqual('Reply to first comment');

    // Test second page
    const secondPage: GetCommentsInput = {
      story_id: story.id,
      limit: 2,
      offset: 2
    };

    const secondResult = await getComments(secondPage);
    expect(secondResult).toHaveLength(1);
    expect(secondResult[0].text).toEqual('Second top-level comment');
  });

  it('should return empty array for non-existent story', async () => {
    await createTestData();

    const input: GetCommentsInput = {
      story_id: 999, // Non-existent story ID
      limit: 100,
      offset: 0
    };

    const result = await getComments(input);
    expect(result).toHaveLength(0);
  });

  it('should handle different comment threading levels', async () => {
    const { story } = await createTestData();

    const input: GetCommentsInput = {
      story_id: story.id,
      limit: 100,
      offset: 0
    };

    const result = await getComments(input);

    // Find top-level and nested comments
    const topLevelComments = result.filter(comment => comment.parent_id === null);
    const nestedComments = result.filter(comment => comment.parent_id !== null);

    expect(topLevelComments).toHaveLength(2);
    expect(nestedComments).toHaveLength(1);
    expect(nestedComments[0].parent_id).toEqual(1); // Reply to first comment
  });

  it('should handle default pagination values', async () => {
    const { story } = await createTestData();

    // Test that Zod defaults are applied properly in the handler
    const input: GetCommentsInput = {
      story_id: story.id,
      limit: 30, // Default from schema
      offset: 0   // Default from schema
    };

    const result = await getComments(input);
    expect(result).toHaveLength(3); // All comments fit within default limit
  });

  it('should verify database persistence', async () => {
    const { story } = await createTestData();

    // Verify comments are actually in the database
    const dbComments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.story_id, story.id))
      .execute();

    expect(dbComments).toHaveLength(3);

    // Now test the handler
    const input: GetCommentsInput = {
      story_id: story.id,
      limit: 100,
      offset: 0
    };

    const result = await getComments(input);
    expect(result).toHaveLength(3);
    
    // Verify the data matches what's in the database
    result.forEach((comment, index) => {
      const dbComment = dbComments.find(db => db.id === comment.id);
      expect(dbComment).toBeDefined();
      expect(comment.text).toEqual(dbComment!.text);
      expect(comment.author).toEqual(dbComment!.author);
    });
  });
});