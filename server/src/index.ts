import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  getStoriesInputSchema, 
  getStoryInputSchema, 
  getCommentsInputSchema,
  searchStoriesInputSchema
} from './schema';

// Import handlers
import { getStories } from './handlers/get_stories';
import { getStory } from './handlers/get_story';
import { getComments } from './handlers/get_comments';
import { getStoryWithComments } from './handlers/get_story_with_comments';
import { searchStories } from './handlers/search_stories';
import { syncHackerNewsData } from './handlers/sync_hn_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Get stories with optional filtering and pagination
  getStories: publicProcedure
    .input(getStoriesInputSchema)
    .query(({ input }) => getStories(input)),

  // Get a single story by ID
  getStory: publicProcedure
    .input(getStoryInputSchema)
    .query(({ input }) => getStory(input)),

  // Get comments for a specific story
  getComments: publicProcedure
    .input(getCommentsInputSchema)
    .query(({ input }) => getComments(input)),

  // Get story with its comments in one request
  getStoryWithComments: publicProcedure
    .input(getStoryInputSchema)
    .query(({ input }) => getStoryWithComments(input)),

  // Search stories by query
  searchStories: publicProcedure
    .input(searchStoriesInputSchema)
    .query(({ input }) => searchStories(input)),

  // Sync data from Hacker News API (typically called by scheduled jobs)
  syncHackerNewsData: publicProcedure
    .mutation(() => syncHackerNewsData()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Hacker News TRPC server listening at port: ${port}`);
}

start();