import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, integer, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";

export const features = pgTable("features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("requested"), // "requested" | "confirmed" | "deployed"
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const featureVotes = pgTable("feature_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureId: varchar("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  voteType: varchar("vote_type", { length: 10 }).notNull(), // "upvote" | "downvote"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("feature_votes_user_feature_unique").on(table.userId, table.featureId),
  index("feature_votes_feature_idx").on(table.featureId),
  index("feature_votes_user_idx").on(table.userId),
]);

export const insertFeatureSchema = createInsertSchema(features).omit({
  id: true,
  upvotes: true,
  downvotes: true,
  createdAt: true,
});

export const insertFeatureVoteSchema = createInsertSchema(featureVotes).omit({
  id: true,
  createdAt: true,
});

export type Feature = typeof features.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type FeatureVote = typeof featureVotes.$inferSelect;
export type InsertFeatureVote = z.infer<typeof insertFeatureVoteSchema>;
