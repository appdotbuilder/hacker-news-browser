import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storiesTable, commentsTable } from '../db/schema';
import { type GetStoryInput } from '../schema';
import { getStoryWithComments } from '../handlers/get_story_with_comments';

// Test data
const testStory = {
  id: 12345,
  title: 'Test Story',
  url: 'https://example.com',
  text: null,
  author: 'testuser',
  score: 100,
  descendants: 3,
  time: new Date('2023-01-01T10:00:00Z'),
  story_type: 'story' as const,
  created_at: new Date(),
  updated_at: new Date()
};

const testComments = [
  {
    id: 1001,
    story_id: 12345,
    parent_id: null,
    author: 'commenter1',
    text: 'This is the first comment',
    time: new Date('2023-01-01T11:00:00Z'),
    created_at: new Date()
  },
  {
    id: 1002,
    story_id: 12345,
    parent_id: 1001,
    author: 'commenter2',
    text: 'This is a reply to first comment',
    time: new Date('2023-01-01T12:00:00Z'),
    created_at: new Date()
  },
  {
    id: 1003,
    story_id: 12345,
    parent_id: null,
    author: 'commenter3',
    text: 'This is another top-level comment',
    time: new Date('2023-01-01T13:00:00Z'),
    created_at: new Date()
  }
];

describe('getStoryWithComments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch story with comments', async () => {
    // Insert test data
    await db.insert(storiesTable).values(testStory).execute();
    await db.insert(commentsTable).values(testComments).execute();

    const input: GetStoryInput = { id: 12345 };
    const result = await getStoryWithComments(input);

    expect(result).not.toBeNull();
    expect(result!.story.id).toEqual(12345);
    expect(result!.story.title).toEqual('Test Story');
    expect(result!.story.author).toEqual('testuser');
    expect(result!.story.score).toEqual(100);
    expect(result!.story.descendants).toEqual(3);
    expect(result!.story.url).toEqual('https://example.com');
    expect(result!.story.story_type).toEqual('story');
    expect(result!.story.time).toBeInstanceOf(Date);
    expect(result!.story.created_at).toBeInstanceOf(Date);
    expect(result!.story.updated_at).toBeInstanceOf(Date);

    expect(result!.comments).toHaveLength(3);
    expect(result!.totalComments).toEqual(3);
  });

  it('should return comments ordered by time', async () => {
    // Insert test data
    await db.insert(storiesTable).values(testStory).execute();
    await db.insert(commentsTable).values(testComments).execute();

    const input: GetStoryInput = { id: 12345 };
    const result = await getStoryWithComments(input);

    expect(result).not.toBeNull();
    
    // Comments should be ordered by time (ascending)
    const comments = result!.comments;
    expect(comments[0].id).toEqual(1001); // First comment (11:00)
    expect(comments[1].id).toEqual(1002); // Reply (12:00)
    expect(comments[2].id).toEqual(1003); // Last comment (13:00)
    
    // Verify time ordering
    expect(comments[0].time.getTime()).toBeLessThan(comments[1].time.getTime());
    expect(comments[1].time.getTime()).toBeLessThan(comments[2].time.getTime());
  });

  it('should handle story with no comments', async () => {
    // Insert story without comments
    await db.insert(storiesTable).values(testStory).execute();

    const input: GetStoryInput = { id: 12345 };
    const result = await getStoryWithComments(input);

    expect(result).not.toBeNull();
    expect(result!.story.id).toEqual(12345);
    expect(result!.comments).toHaveLength(0);
    expect(result!.totalComments).toEqual(0);
  });

  it('should return null for non-existent story', async () => {
    const input: GetStoryInput = { id: 99999 };
    const result = await getStoryWithComments(input);

    expect(result).toBeNull();
  });

  it('should handle story with text content (no URL)', async () => {
    const textStory = {
      ...testStory,
      id: 54321,
      url: null,
      text: 'This is a text-only story with content',
      story_type: 'ask' as const
    };

    await db.insert(storiesTable).values(textStory).execute();
    await db.insert(commentsTable).values([
      {
        id: 2001,
        story_id: 54321,
        parent_id: null,
        author: 'textcommenter',
        text: 'Great question!',
        time: new Date('2023-01-02T10:00:00Z'),
        created_at: new Date()
      }
    ]).execute();

    const input: GetStoryInput = { id: 54321 };
    const result = await getStoryWithComments(input);

    expect(result).not.toBeNull();
    expect(result!.story.id).toEqual(54321);
    expect(result!.story.url).toBeNull();
    expect(result!.story.text).toEqual('This is a text-only story with content');
    expect(result!.story.story_type).toEqual('ask');
    expect(result!.comments).toHaveLength(1);
    expect(result!.comments[0].text).toEqual('Great question!');
    expect(result!.totalComments).toEqual(1);
  });

  it('should handle comments with parent-child relationships', async () => {
    await db.insert(storiesTable).values(testStory).execute();
    await db.insert(commentsTable).values(testComments).execute();

    const input: GetStoryInput = { id: 12345 };
    const result = await getStoryWithComments(input);

    expect(result).not.toBeNull();
    
    const comments = result!.comments;
    
    // Find parent and child comments
    const parentComment = comments.find(c => c.id === 1001);
    const childComment = comments.find(c => c.id === 1002);
    
    expect(parentComment).toBeDefined();
    expect(childComment).toBeDefined();
    expect(parentComment!.parent_id).toBeNull(); // Top-level comment
    expect(childComment!.parent_id).toEqual(1001); // Reply to first comment
  });

  it('should validate date fields are Date objects', async () => {
    await db.insert(storiesTable).values(testStory).execute();
    await db.insert(commentsTable).values([testComments[0]]).execute();

    const input: GetStoryInput = { id: 12345 };
    const result = await getStoryWithComments(input);

    expect(result).not.toBeNull();
    
    // Story dates should be Date objects
    expect(result!.story.time).toBeInstanceOf(Date);
    expect(result!.story.created_at).toBeInstanceOf(Date);
    expect(result!.story.updated_at).toBeInstanceOf(Date);
    
    // Comment dates should be Date objects
    expect(result!.comments[0].time).toBeInstanceOf(Date);
    expect(result!.comments[0].created_at).toBeInstanceOf(Date);
  });
});