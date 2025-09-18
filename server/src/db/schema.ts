import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for story types
export const storyTypeEnum = pgEnum('story_type', ['story', 'job', 'ask', 'show', 'poll']);

// Stories table
export const storiesTable = pgTable('stories', {
  id: integer('id').primaryKey(), // Using HN item ID as primary key
  title: text('title').notNull(),
  url: text('url'), // Nullable for text-only posts
  text: text('text'), // Nullable for link posts
  author: text('author').notNull(),
  score: integer('score').notNull().default(0),
  descendants: integer('descendants').notNull().default(0), // Number of comments
  time: timestamp('time').notNull(), // Original HN timestamp
  story_type: storyTypeEnum('story_type').notNull().default('story'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Comments table
export const commentsTable = pgTable('comments', {
  id: integer('id').primaryKey(), // Using HN comment ID as primary key
  story_id: integer('story_id').notNull().references(() => storiesTable.id),
  parent_id: integer('parent_id'), // Nullable for top-level comments
  author: text('author').notNull(),
  text: text('text').notNull(),
  time: timestamp('time').notNull(), // Original HN timestamp
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Define relations
export const storiesRelations = relations(storiesTable, ({ many }) => ({
  comments: many(commentsTable)
}));

export const commentsRelations = relations(commentsTable, ({ one, many }) => ({
  story: one(storiesTable, {
    fields: [commentsTable.story_id],
    references: [storiesTable.id]
  }),
  parent: one(commentsTable, {
    fields: [commentsTable.parent_id],
    references: [commentsTable.id]
  }),
  children: many(commentsTable)
}));

// TypeScript types for the table schemas
export type Story = typeof storiesTable.$inferSelect;
export type NewStory = typeof storiesTable.$inferInsert;
export type Comment = typeof commentsTable.$inferSelect;
export type NewComment = typeof commentsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  stories: storiesTable, 
  comments: commentsTable 
};

export const tableRelations = {
  stories: storiesRelations,
  comments: commentsRelations
};