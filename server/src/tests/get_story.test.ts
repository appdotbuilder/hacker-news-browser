import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storiesTable } from '../db/schema';
import { type GetStoryInput } from '../schema';
import { getStory } from '../handlers/get_story';

describe('getStory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testStoryData = {
    id: 12345,
    title: 'Test Story Title',
    url: 'https://example.com/test-story',
    text: 'This is a test story with some content.',
    author: 'test_user',
    score: 42,
    descendants: 5,
    time: new Date('2024-01-15T10:30:00Z'),
    story_type: 'story' as const,
    created_at: new Date('2024-01-15T10:30:00Z'),
    updated_at: new Date('2024-01-15T10:30:00Z')
  };

  const setupTestStory = async () => {
    await db.insert(storiesTable)
      .values(testStoryData)
      .execute();
  };

  it('should return a story when it exists', async () => {
    await setupTestStory();

    const input: GetStoryInput = { id: 12345 };
    const result = await getStory(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(12345);
    expect(result!.title).toEqual('Test Story Title');
    expect(result!.url).toEqual('https://example.com/test-story');
    expect(result!.text).toEqual('This is a test story with some content.');
    expect(result!.author).toEqual('test_user');
    expect(result!.score).toEqual(42);
    expect(result!.descendants).toEqual(5);
    expect(result!.story_type).toEqual('story');
    expect(result!.time).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when story does not exist', async () => {
    const input: GetStoryInput = { id: 99999 };
    const result = await getStory(input);

    expect(result).toBeNull();
  });

  it('should handle text-only posts (no URL)', async () => {
    const textOnlyStory = {
      ...testStoryData,
      id: 67890,
      title: 'Ask HN: What do you think?',
      url: null,
      text: 'This is an Ask HN post with only text content.',
      story_type: 'ask' as const
    };

    await db.insert(storiesTable)
      .values(textOnlyStory)
      .execute();

    const input: GetStoryInput = { id: 67890 };
    const result = await getStory(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(67890);
    expect(result!.title).toEqual('Ask HN: What do you think?');
    expect(result!.url).toBeNull();
    expect(result!.text).toEqual('This is an Ask HN post with only text content.');
    expect(result!.story_type).toEqual('ask');
  });

  it('should handle link-only posts (no text)', async () => {
    const linkOnlyStory = {
      ...testStoryData,
      id: 11111,
      title: 'Interesting Link',
      url: 'https://fascinating-article.com',
      text: null
    };

    await db.insert(storiesTable)
      .values(linkOnlyStory)
      .execute();

    const input: GetStoryInput = { id: 11111 };
    const result = await getStory(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(11111);
    expect(result!.title).toEqual('Interesting Link');
    expect(result!.url).toEqual('https://fascinating-article.com');
    expect(result!.text).toBeNull();
  });

  it('should handle different story types', async () => {
    const jobStory = {
      ...testStoryData,
      id: 22222,
      title: 'Software Engineer at ACME Corp',
      story_type: 'job' as const
    };

    await db.insert(storiesTable)
      .values(jobStory)
      .execute();

    const input: GetStoryInput = { id: 22222 };
    const result = await getStory(input);

    expect(result).not.toBeNull();
    expect(result!.story_type).toEqual('job');
  });

  it('should preserve date objects correctly', async () => {
    await setupTestStory();

    const input: GetStoryInput = { id: 12345 };
    const result = await getStory(input);

    expect(result).not.toBeNull();
    expect(result!.time).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.time.getTime()).toBeGreaterThan(0);
    expect(result!.created_at.getTime()).toBeGreaterThan(0);
    expect(result!.updated_at.getTime()).toBeGreaterThan(0);
  });

  it('should handle stories with zero score and descendants', async () => {
    const zeroScoreStory = {
      ...testStoryData,
      id: 33333,
      score: 0,
      descendants: 0
    };

    await db.insert(storiesTable)
      .values(zeroScoreStory)
      .execute();

    const input: GetStoryInput = { id: 33333 };
    const result = await getStory(input);

    expect(result).not.toBeNull();
    expect(result!.score).toEqual(0);
    expect(result!.descendants).toEqual(0);
  });
});