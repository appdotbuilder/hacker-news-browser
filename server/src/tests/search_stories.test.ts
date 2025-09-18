import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { storiesTable } from '../db/schema';
import { type SearchStoriesInput } from '../schema';
import { searchStories } from '../handlers/search_stories';

describe('searchStories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test stories with different content
  const createTestStories = async () => {
    await db.insert(storiesTable).values([
      {
        id: 1,
        title: 'JavaScript Best Practices',
        url: 'https://example.com/js',
        text: 'Learn modern JavaScript development techniques',
        author: 'johndoe',
        score: 100,
        descendants: 25,
        time: new Date('2023-01-01'),
        story_type: 'story'
      },
      {
        id: 2,
        title: 'Python Machine Learning Guide',
        url: null,
        text: 'Complete guide to machine learning with Python and scikit-learn',
        author: 'pythondev',
        score: 150,
        descendants: 40,
        time: new Date('2023-01-02'),
        story_type: 'story'
      },
      {
        id: 3,
        title: 'Ask HN: Best IDE for JavaScript?',
        url: null,
        text: 'Looking for recommendations on JavaScript IDEs',
        author: 'newcoder',
        score: 75,
        descendants: 30,
        time: new Date('2023-01-03'),
        story_type: 'ask'
      },
      {
        id: 4,
        title: 'Rust Performance Optimization',
        url: 'https://example.com/rust',
        text: 'How to optimize Rust code for maximum performance',
        author: 'rustdev',
        score: 200,
        descendants: 15,
        time: new Date('2023-01-04'),
        story_type: 'story'
      },
      {
        id: 5,
        title: 'Show HN: My Python Web Framework',
        url: 'https://github.com/example/framework',
        text: 'Built a lightweight web framework using Python',
        author: 'pythondev',
        score: 80,
        descendants: 12,
        time: new Date('2023-01-05'),
        story_type: 'show'
      }
    ]).execute();
  };

  it('should search stories by title', async () => {
    await createTestStories();
    
    const input: SearchStoriesInput = {
      query: 'JavaScript',
      limit: 30,
      offset: 0
    };

    const result = await searchStories(input);

    expect(result.stories).toHaveLength(2);
    expect(result.total).toEqual(2);
    expect(result.hasMore).toBe(false);
    
    // Should find both JavaScript stories
    const titles = result.stories.map(s => s.title);
    expect(titles).toContain('JavaScript Best Practices');
    expect(titles).toContain('Ask HN: Best IDE for JavaScript?');
  });

  it('should search stories by text content', async () => {
    await createTestStories();
    
    const input: SearchStoriesInput = {
      query: 'machine learning',
      limit: 30,
      offset: 0
    };

    const result = await searchStories(input);

    expect(result.stories).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.hasMore).toBe(false);
    expect(result.stories[0].title).toEqual('Python Machine Learning Guide');
  });

  it('should search stories by author', async () => {
    await createTestStories();
    
    const input: SearchStoriesInput = {
      query: 'pythondev',
      limit: 30,
      offset: 0
    };

    const result = await searchStories(input);

    expect(result.stories).toHaveLength(2);
    expect(result.total).toEqual(2);
    expect(result.hasMore).toBe(false);
    
    // Should find both stories by pythondev
    const authors = result.stories.map(s => s.author);
    expect(authors.every(author => author === 'pythondev')).toBe(true);
  });

  it('should be case insensitive', async () => {
    await createTestStories();
    
    const input: SearchStoriesInput = {
      query: 'PYTHON',
      limit: 30,
      offset: 0
    };

    const result = await searchStories(input);

    expect(result.stories.length).toBeGreaterThan(0);
    // Should find Python-related stories despite case difference
    const hasValidResults = result.stories.some(story => 
      story.title.toLowerCase().includes('python') ||
      story.text?.toLowerCase().includes('python') ||
      story.author.toLowerCase().includes('python')
    );
    expect(hasValidResults).toBe(true);
  });

  it('should support partial matches', async () => {
    await createTestStories();
    
    const input: SearchStoriesInput = {
      query: 'Script',
      limit: 30,
      offset: 0
    };

    const result = await searchStories(input);

    expect(result.stories).toHaveLength(2);
    // Should match "JavaScript" stories with partial "Script"
    const titles = result.stories.map(s => s.title);
    expect(titles).toContain('JavaScript Best Practices');
    expect(titles).toContain('Ask HN: Best IDE for JavaScript?');
  });

  it('should handle pagination correctly', async () => {
    await createTestStories();
    
    // First page with limit of 2
    const firstPageInput: SearchStoriesInput = {
      query: 'Python',
      limit: 1,
      offset: 0
    };

    const firstPage = await searchStories(firstPageInput);

    expect(firstPage.stories).toHaveLength(1);
    expect(firstPage.total).toEqual(2);
    expect(firstPage.hasMore).toBe(true);

    // Second page
    const secondPageInput: SearchStoriesInput = {
      query: 'Python',
      limit: 1,
      offset: 1
    };

    const secondPage = await searchStories(secondPageInput);

    expect(secondPage.stories).toHaveLength(1);
    expect(secondPage.total).toEqual(2);
    expect(secondPage.hasMore).toBe(false);

    // Ensure different stories on different pages
    expect(firstPage.stories[0].id).not.toEqual(secondPage.stories[0].id);
  });

  it('should order results by score desc then time desc', async () => {
    await createTestStories();
    
    const input: SearchStoriesInput = {
      query: 'Python',
      limit: 30,
      offset: 0
    };

    const result = await searchStories(input);

    expect(result.stories).toHaveLength(2);
    
    // Results should be ordered by score descending (150 > 80)
    expect(result.stories[0].score).toEqual(150);
    expect(result.stories[1].score).toEqual(80);
    expect(result.stories[0].title).toEqual('Python Machine Learning Guide');
    expect(result.stories[1].title).toEqual('Show HN: My Python Web Framework');
  });

  it('should return empty results for no matches', async () => {
    await createTestStories();
    
    const input: SearchStoriesInput = {
      query: 'nonexistent',
      limit: 30,
      offset: 0
    };

    const result = await searchStories(input);

    expect(result.stories).toHaveLength(0);
    expect(result.total).toEqual(0);
    expect(result.hasMore).toBe(false);
  });

  it('should handle empty query gracefully', async () => {
    await createTestStories();
    
    const input: SearchStoriesInput = {
      query: '',
      limit: 30,
      offset: 0
    };

    // This should find all stories since empty string matches everything
    const result = await searchStories(input);

    expect(result.stories).toHaveLength(5);
    expect(result.total).toEqual(5);
    expect(result.hasMore).toBe(false);
  });

  it('should handle special characters in search query', async () => {
    await createTestStories();
    
    const input: SearchStoriesInput = {
      query: 'HN:',
      limit: 30,
      offset: 0
    };

    const result = await searchStories(input);

    expect(result.stories).toHaveLength(2);
    // Should find "Ask HN:" and "Show HN:" stories
    const titles = result.stories.map(s => s.title);
    expect(titles.some(title => title.includes('Ask HN:'))).toBe(true);
    expect(titles.some(title => title.includes('Show HN:'))).toBe(true);
  });

  it('should search across multiple fields simultaneously', async () => {
    await createTestStories();
    
    const input: SearchStoriesInput = {
      query: 'optimization',
      limit: 30,
      offset: 0
    };

    const result = await searchStories(input);

    expect(result.stories).toHaveLength(1);
    expect(result.stories[0].title).toEqual('Rust Performance Optimization');
    // Query matches both title and text content
    expect(result.stories[0].text?.toLowerCase()).toContain('optimize');
  });
});