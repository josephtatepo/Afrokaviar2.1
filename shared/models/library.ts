import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, integer, index, bigint, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";

export const libraryItems = pgTable("library_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  referenceId: varchar("reference_id"),
  objectPath: text("object_path"),
  fileSize: bigint("file_size", { mode: "number" }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("library_items_user_idx").on(table.userId),
  index("library_items_user_type_idx").on(table.userId, table.type),
]);

export const insertLibraryItemSchema = createInsertSchema(libraryItems).omit({
  id: true,
  createdAt: true,
});

export const playbackProgress = pgTable("playback_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: varchar("item_id").notNull().references(() => libraryItems.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  duration: integer("duration"),
  lastPlayed: timestamp("last_played").defaultNow().notNull(),
}, (table) => [
  index("playback_progress_user_item_idx").on(table.userId, table.itemId),
]);

export const insertPlaybackProgressSchema = createInsertSchema(playbackProgress).omit({
  id: true,
  lastPlayed: true,
});

export const userStorage = pgTable("user_storage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  usedBytes: bigint("used_bytes", { mode: "number" }).notNull().default(0),
  limitBytes: bigint("limit_bytes", { mode: "number" }).notNull().default(0),
  subscriptionActive: jsonb("subscription_active"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_storage_user_idx").on(table.userId),
]);

export const insertUserStorageSchema = createInsertSchema(userStorage).omit({
  id: true,
  updatedAt: true,
});

export type LibraryItem = typeof libraryItems.$inferSelect;
export type InsertLibraryItem = z.infer<typeof insertLibraryItemSchema>;
export type PlaybackProgress = typeof playbackProgress.$inferSelect;
export type InsertPlaybackProgress = z.infer<typeof insertPlaybackProgressSchema>;
export type UserStorage = typeof userStorage.$inferSelect;
export type InsertUserStorage = z.infer<typeof insertUserStorageSchema>;
