import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";

export const savedItems = pgTable("saved_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentType: varchar("content_type").notNull(),
  contentId: varchar("content_id").notNull(),
  title: text("title").notNull(),
  metadata: jsonb("metadata"),
  savedAt: timestamp("saved_at").defaultNow(),
}, (table) => [
  index("saved_items_user_idx").on(table.userId),
  index("saved_items_user_content_idx").on(table.userId, table.contentType, table.contentId),
]);

export const insertSavedItemSchema = createInsertSchema(savedItems).omit({
  id: true,
  savedAt: true,
});

export type InsertSavedItem = z.infer<typeof insertSavedItemSchema>;
export type SavedItem = typeof savedItems.$inferSelect;
