import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";

export const songs = pgTable("songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  genre: text("genre"),
  artworkUrl: text("artwork_url"),
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration"),
  price: integer("price").notNull().default(100),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("songs_created_at_idx").on(table.createdAt),
  index("songs_uploaded_by_idx").on(table.uploadedBy),
]);

export const insertSongSchema = createInsertSchema(songs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const songReactions = pgTable("song_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  songId: varchar("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("song_reactions_user_song_idx").on(table.userId, table.songId),
  index("song_reactions_song_idx").on(table.songId),
]);

export const insertSongReactionSchema = createInsertSchema(songReactions).omit({
  id: true,
  createdAt: true,
});

export const songFavorites = pgTable("song_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  songId: varchar("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("song_favorites_user_song_idx").on(table.userId, table.songId),
  index("song_favorites_user_idx").on(table.userId),
]);

export const insertSongFavoriteSchema = createInsertSchema(songFavorites).omit({
  id: true,
  createdAt: true,
});

export type Song = typeof songs.$inferSelect;
export type InsertSong = z.infer<typeof insertSongSchema>;
export type SongReaction = typeof songReactions.$inferSelect;
export type InsertSongReaction = z.infer<typeof insertSongReactionSchema>;
export type SongFavorite = typeof songFavorites.$inferSelect;
export type InsertSongFavorite = z.infer<typeof insertSongFavoriteSchema>;
