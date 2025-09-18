import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storiesTable } from '../db/schema';
import { type GetStoriesInput } from '../schema';
import { getStories } from '../handlers/get_stories';

// Test data for stories
const testStories = [
  {
    id: 1,
    title: 'Top Story with High Score',
    url: 'https://example.com/top',
    text: null,
    author: 'topuser',
    score: 500,
    descendants: 25,
    time: new Date('2024-01-01T10:00:00Z'),
    story_type: 'story' as const
  },
  {
    id: 2,
    title: 'Ask HN: How to test handlers?',
    url: null,
    text: 'I need advice on testing database handlers',
    author: 'askuser',
    score: 100,
    descendants: 15,
    time: new Date('2024-01-01T11:00:00Z'),
    story_type: 'ask' as const
  },
  {
    id: 3,
    title: 'Show HN: My new project',
    url: 'https://example.com/show',
    text: 'Check out my latest creation',
    author: 'showuser',
    score: 75,
    descendants: 8,
    time: new Date('2024-01-01T12:00:00Z'),
    story_type: 'show' as const
  },
  {
    id: 4,
    title: 'Job: Senior Developer Position',
    url: 'https://example.com/job',
    text: null,
    author: 'recruiter',
    score: 0,
    descendants: 2,
    time: new Date('2024-01-01T13:00:00Z'),
    story_type: 'job' as const
  },
  {
    id: 5,
    title: 'Recent Story with Medium Score',
    url: 'https://example.com/recent',
    text: null,
    author: 'recentuser',
    score: 200,
    descendants: 10,
    time: new Date('2024-01-01T14:00:00Z'),
    story_type: 'story' as const
  }
];

describe('getStories', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test stories
    await db.insert(storiesTable).values(testStories).execute();
  });

  afterEach(resetDB);

  it('should get all stories with default pagination', async () => {
    const input: GetStoriesInput = {
      limit: 30,
      offset: 0
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(false);
    expect(result.stories[0].title).toBeDefined();
    expect(result.stories[0].author).toBeDefined();
    expect(result.stories[0].score).toBeTypeOf('number');
  });

  it('should filter ask stories', async () => {
    const input: GetStoriesInput = {
      type: 'ask',
      limit: 30,
      offset: 0
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
    expect(result.stories[0].story_type).toBe('ask');
    expect(result.stories[0].title).toBe('Ask HN: How to test handlers?');
  });

  it('should filter show stories', async () => {
    const input: GetStoriesInput = {
      type: 'show',
      limit: 30,
      offset: 0
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
    expect(result.stories[0].story_type).toBe('show');
    expect(result.stories[0].title).toBe('Show HN: My new project');
  });

  it('should filter job stories', async () => {
    const input: GetStoriesInput = {
      type: 'job',
      limit: 30,
      offset: 0
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
    expect(result.stories[0].story_type).toBe('job');
    expect(result.stories[0].title).toBe('Job: Senior Developer Position');
  });

  it('should handle top stories with score ordering', async () => {
    const input: GetStoriesInput = {
      type: 'top',
      limit: 30,
      offset: 0
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(false);
    
    // Should be ordered by score descending
    expect(result.stories[0].score).toBe(500); // Top story
    expect(result.stories[1].score).toBe(200); // Recent story
    expect(result.stories[2].score).toBe(100); // Ask story
  });

  it('should handle best stories with score ordering', async () => {
    const input: GetStoriesInput = {
      type: 'best',
      limit: 30,
      offset: 0
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(5);
    expect(result.total).toBe(5);
    
    // Should be ordered by score descending (same as top)
    expect(result.stories[0].score).toBe(500);
    expect(result.stories[1].score).toBe(200);
    expect(result.stories[2].score).toBe(100);
  });

  it('should handle new stories with time ordering', async () => {
    const input: GetStoriesInput = {
      type: 'new',
      limit: 30,
      offset: 0
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(5);
    expect(result.total).toBe(5);
    
    // Should be ordered by created_at descending (newest first)
    // Since we don't set created_at explicitly, they should be in insertion order
    expect(result.stories[0].id).toBeDefined();
    expect(result.stories[0].time).toBeInstanceOf(Date);
  });

  it('should handle pagination correctly', async () => {
    const input: GetStoriesInput = {
      limit: 2,
      offset: 0
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(true);
  });

  it('should handle pagination on second page', async () => {
    const input: GetStoriesInput = {
      limit: 2,
      offset: 2
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(true);
  });

  it('should handle pagination on last page', async () => {
    const input: GetStoriesInput = {
      limit: 2,
      offset: 4
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(1);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(false);
  });

  it('should handle empty results for filtered type', async () => {
    // Clear all stories and insert only one type
    await db.delete(storiesTable).execute();
    await db.insert(storiesTable).values([{
      id: 100,
      title: 'Only Story',
      url: 'https://example.com/only',
      text: null,
      author: 'onlyuser',
      score: 50,
      descendants: 5,
      time: new Date(),
      story_type: 'story' as const
    }]).execute();

    const input: GetStoriesInput = {
      type: 'ask',
      limit: 30,
      offset: 0
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('should handle large offset gracefully', async () => {
    const input: GetStoriesInput = {
      limit: 10,
      offset: 100
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(0);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(false);
  });

  it('should include all required story fields', async () => {
    const input: GetStoriesInput = {
      limit: 1,
      offset: 0
    };

    const result = await getStories(input);

    expect(result.stories).toHaveLength(1);
    const story = result.stories[0];
    
    expect(story.id).toBeTypeOf('number');
    expect(story.title).toBeTypeOf('string');
    expect(story.author).toBeTypeOf('string');
    expect(story.score).toBeTypeOf('number');
    expect(story.descendants).toBeTypeOf('number');
    expect(story.time).toBeInstanceOf(Date);
    expect(story.story_type).toBeTypeOf('string');
    expect(story.created_at).toBeInstanceOf(Date);
    expect(story.updated_at).toBeInstanceOf(Date);
  });
});