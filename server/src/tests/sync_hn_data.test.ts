import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storiesTable, commentsTable } from '../db/schema';
import { syncHackerNewsData } from '../handlers/sync_hn_data';
import { eq } from 'drizzle-orm';

// Mock data
const mockTopStories = [1, 2, 3];

const mockStoryItem = {
  id: 1,
  type: 'story',
  title: 'Test Story',
  url: 'https://example.com',
  text: null,
  by: 'testuser',
  score: 100,
  descendants: 5,
  time: 1640995200, // 2022-01-01 00:00:00 UTC
  kids: [10, 11]
};

const mockAskStoryItem = {
  id: 2,
  type: 'story',
  title: 'Ask HN: What is your favorite programming language?',
  url: null,
  text: 'Just curious about everyone\'s preferences.',
  by: 'askuser',
  score: 50,
  descendants: 10,
  time: 1640998800, // 2022-01-01 01:00:00 UTC
  kids: [20]
};

const mockJobItem = {
  id: 3,
  type: 'job',
  title: 'Software Engineer at Tech Company',
  url: 'https://jobs.example.com',
  text: null,
  by: 'recruiter',
  score: 1,
  descendants: 0,
  time: 1641002400, // 2022-01-01 02:00:00 UTC
  kids: []
};

const mockCommentItem = {
  id: 10,
  type: 'comment',
  text: 'Great article! Thanks for sharing.',
  by: 'commenter',
  time: 1640999400, // 2022-01-01 01:10:00 UTC
  parent: 1
};

const mockNestedCommentItem = {
  id: 11,
  type: 'comment',
  text: 'I agree with the previous comment.',
  by: 'replier',
  time: 1641000000, // 2022-01-01 01:20:00 UTC
  parent: 10
};

describe('syncHackerNewsData', () => {
  let originalFetch: typeof fetch;

  beforeEach(async () => {
    await createDB();
    originalFetch = global.fetch;
  });

  afterEach(async () => {
    await resetDB();
    global.fetch = originalFetch;
  });

  it('should sync stories and comments successfully', async () => {
    // Create a mock fetch that returns different responses based on URL
    const mockFetch = async (input: string | Request | URL): Promise<Response> => {
      const urlStr = input.toString();
      
      if (urlStr.includes('topstories.json')) {
        return new Response(JSON.stringify(mockTopStories), { status: 200 });
      } else if (urlStr.includes('item/1.json')) {
        return new Response(JSON.stringify(mockStoryItem), { status: 200 });
      } else if (urlStr.includes('item/2.json')) {
        return new Response(JSON.stringify(mockAskStoryItem), { status: 200 });
      } else if (urlStr.includes('item/3.json')) {
        return new Response(JSON.stringify(mockJobItem), { status: 200 });
      } else if (urlStr.includes('item/10.json')) {
        return new Response(JSON.stringify(mockCommentItem), { status: 200 });
      } else if (urlStr.includes('item/11.json')) {
        return new Response(JSON.stringify(mockNestedCommentItem), { status: 200 });
      } else if (urlStr.includes('item/20.json')) {
        return new Response(JSON.stringify({
          id: 20,
          type: 'comment',
          text: 'Comment on Ask HN story',
          by: 'askcommenter',
          time: 1641003000,
          parent: 2
        }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    };

    global.fetch = mockFetch as any;

    const result = await syncHackerNewsData();

    expect(result.synced).toEqual(3);
    expect(result.message).toContain('Successfully synced 3 stories');

    // Verify stories were saved
    const stories = await db.select().from(storiesTable).execute();
    expect(stories).toHaveLength(3);

    // Check regular story
    const story1 = stories.find(s => s.id === 1);
    expect(story1?.title).toEqual('Test Story');
    expect(story1?.url).toEqual('https://example.com');
    expect(story1?.author).toEqual('testuser');
    expect(story1?.score).toEqual(100);
    expect(story1?.descendants).toEqual(5);
    expect(story1?.story_type).toEqual('story');
    expect(story1?.time).toEqual(new Date('2022-01-01T00:00:00.000Z'));

    // Check Ask HN story
    const story2 = stories.find(s => s.id === 2);
    expect(story2?.title).toEqual('Ask HN: What is your favorite programming language?');
    expect(story2?.story_type).toEqual('ask');
    expect(story2?.text).toEqual('Just curious about everyone\'s preferences.');

    // Check job story
    const story3 = stories.find(s => s.id === 3);
    expect(story3?.title).toEqual('Software Engineer at Tech Company');
    expect(story3?.story_type).toEqual('job');

    // Verify comments were saved
    const comments = await db.select().from(commentsTable).execute();
    expect(comments).toHaveLength(3);

    const comment1 = comments.find(c => c.id === 10);
    expect(comment1?.story_id).toEqual(1);
    expect(comment1?.parent_id).toEqual(1);
    expect(comment1?.author).toEqual('commenter');
    expect(comment1?.text).toEqual('Great article! Thanks for sharing.');
  });

  it('should update existing stories', async () => {
    // First, insert an existing story
    await db.insert(storiesTable)
      .values({
        id: 1,
        title: 'Old Title',
        url: null,
        text: null,
        author: 'testuser',
        score: 50,
        descendants: 2,
        time: new Date('2022-01-01T00:00:00.000Z'),
        story_type: 'story',
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();

    // Mock fetch
    const mockFetch = async (input: string | Request | URL): Promise<Response> => {
      const urlStr = input.toString();
      
      if (urlStr.includes('topstories.json')) {
        return new Response(JSON.stringify([1]), { status: 200 });
      } else if (urlStr.includes('item/1.json')) {
        return new Response(JSON.stringify(mockStoryItem), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    };

    global.fetch = mockFetch as any;

    const result = await syncHackerNewsData();

    expect(result.synced).toEqual(1);

    // Verify story was updated
    const stories = await db.select()
      .from(storiesTable)
      .where(eq(storiesTable.id, 1))
      .execute();

    expect(stories).toHaveLength(1);
    expect(stories[0].title).toEqual('Test Story'); // Updated title
    expect(stories[0].score).toEqual(100); // Updated score
    expect(stories[0].url).toEqual('https://example.com'); // Updated URL
  });

  it('should skip duplicate comments', async () => {
    // First, insert a story and existing comment
    await db.insert(storiesTable)
      .values({
        id: 1,
        title: 'Test Story',
        url: null,
        text: null,
        author: 'testuser',
        score: 100,
        descendants: 5,
        time: new Date('2022-01-01T00:00:00.000Z'),
        story_type: 'story',
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();

    await db.insert(commentsTable)
      .values({
        id: 10,
        story_id: 1,
        parent_id: 1,
        author: 'commenter',
        text: 'Existing comment',
        time: new Date('2022-01-01T01:10:00.000Z'),
        created_at: new Date()
      })
      .execute();

    // Mock fetch
    const mockFetch = async (input: string | Request | URL): Promise<Response> => {
      const urlStr = input.toString();
      
      if (urlStr.includes('topstories.json')) {
        return new Response(JSON.stringify([1]), { status: 200 });
      } else if (urlStr.includes('item/1.json')) {
        return new Response(JSON.stringify(mockStoryItem), { status: 200 });
      } else if (urlStr.includes('item/10.json')) {
        return new Response(JSON.stringify(mockCommentItem), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    };

    global.fetch = mockFetch as any;

    await syncHackerNewsData();

    // Verify only one comment exists (duplicate was skipped)
    const comments = await db.select().from(commentsTable).execute();
    expect(comments).toHaveLength(1);
    expect(comments[0].text).toEqual('Existing comment'); // Original text preserved
  });

  it('should handle API failures gracefully', async () => {
    // Mock fetch to return 500 error
    const mockFetch = async (): Promise<Response> => {
      return new Response('Internal Server Error', { status: 500 });
    };

    global.fetch = mockFetch as any;

    const result = await syncHackerNewsData();

    expect(result.synced).toEqual(0);
    expect(result.message).toContain('Successfully synced 0 stories');

    // Verify no data was saved
    const stories = await db.select().from(storiesTable).execute();
    expect(stories).toHaveLength(0);
  });

  it('should correctly categorize story types', async () => {
    const showStoryItem = {
      id: 4,
      type: 'story',
      title: 'Show HN: My new project',
      url: 'https://project.example.com',
      text: null,
      by: 'creator',
      score: 75,
      descendants: 3,
      time: 1641006000,
      kids: []
    };

    // Mock fetch
    const mockFetch = async (input: string | Request | URL): Promise<Response> => {
      const urlStr = input.toString();
      
      if (urlStr.includes('topstories.json')) {
        return new Response(JSON.stringify([4]), { status: 200 });
      } else if (urlStr.includes('item/4.json')) {
        return new Response(JSON.stringify(showStoryItem), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    };

    global.fetch = mockFetch as any;

    const result = await syncHackerNewsData();

    expect(result.synced).toEqual(1);

    const stories = await db.select().from(storiesTable).execute();
    expect(stories).toHaveLength(1);
    expect(stories[0].story_type).toEqual('show');
  });

  it('should handle database insertion errors', async () => {
    // Mock fetch to return valid data
    const mockFetch = async (input: string | Request | URL): Promise<Response> => {
      const urlStr = input.toString();
      
      if (urlStr.includes('topstories.json')) {
        return new Response(JSON.stringify([1]), { status: 200 });
      } else if (urlStr.includes('item/1.json')) {
        // Return invalid data that will cause database error (missing required author field)
        return new Response(JSON.stringify({
          id: 1,
          type: 'story',
          title: 'Test Story',
          // by: missing - this will cause validation failure
          time: 1640995200
        }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    };

    global.fetch = mockFetch as any;

    const result = await syncHackerNewsData();

    expect(result.synced).toEqual(0);
    expect(result.message).toContain('Successfully synced 0 stories');
  });
});