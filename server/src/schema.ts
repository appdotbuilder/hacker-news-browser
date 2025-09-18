import { z } from 'zod';

// Story schema for Hacker News items
export const storySchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string().url().nullable(),
  text: z.string().nullable(),
  author: z.string(),
  score: z.number().int(),
  descendants: z.number().int(), // Number of comments
  time: z.coerce.date(),
  story_type: z.enum(['story', 'job', 'ask', 'show', 'poll']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Story = z.infer<typeof storySchema>;

// Comment schema for Hacker News comments
export const commentSchema = z.object({
  id: z.number(),
  story_id: z.number(),
  parent_id: z.number().nullable(), // For threaded comments
  author: z.string(),
  text: z.string(),
  time: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Comment = z.infer<typeof commentSchema>;

// Input schema for fetching stories with pagination
export const getStoriesInputSchema = z.object({
  type: z.enum(['top', 'new', 'best', 'ask', 'show', 'job']).optional(),
  limit: z.number().int().min(1).max(100).default(30),
  offset: z.number().int().min(0).default(0)
});

export type GetStoriesInput = z.infer<typeof getStoriesInputSchema>;

// Input schema for fetching a single story
export const getStoryInputSchema = z.object({
  id: z.number().int().positive()
});

export type GetStoryInput = z.infer<typeof getStoryInputSchema>;

// Input schema for fetching comments for a story
export const getCommentsInputSchema = z.object({
  story_id: z.number().int().positive(),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0)
});

export type GetCommentsInput = z.infer<typeof getCommentsInputSchema>;

// Input schema for searching stories
export const searchStoriesInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(30),
  offset: z.number().int().min(0).default(0)
});

export type SearchStoriesInput = z.infer<typeof searchStoriesInputSchema>;

// Response schema for paginated stories
export const storiesResponseSchema = z.object({
  stories: z.array(storySchema),
  total: z.number().int(),
  hasMore: z.boolean()
});

export type StoriesResponse = z.infer<typeof storiesResponseSchema>;

// Response schema for story with comments
export const storyWithCommentsSchema = z.object({
  story: storySchema,
  comments: z.array(commentSchema),
  totalComments: z.number().int()
});

export type StoryWithComments = z.infer<typeof storyWithCommentsSchema>;