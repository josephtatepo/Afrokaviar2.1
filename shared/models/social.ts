import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";
import { songs } from "./music";

export const socialTracks = pgTable("social_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  audioUrl: text("audio_url").notNull(),
  artworkUrl: text("artwork_url"),
  duration: integer("duration"),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  approved: boolean("approved").default(false).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  featuredInCatalogue: varchar("featured_in_catalogue").references(() => songs.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("social_tracks_uploaded_by_idx").on(table.uploadedBy),
  index("social_tracks_approved_idx").on(table.approved),
  index("social_tracks_status_idx").on(table.status),
  index("social_tracks_created_at_idx").on(table.createdAt),
]);

export const insertSocialTrackSchema = createInsertSchema(socialTracks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approved: true,
  featuredInCatalogue: true,
});

export const socialTrackSaves = pgTable("social_track_saves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trackId: varchar("track_id").notNull().references(() => socialTracks.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("social_track_saves_user_track_idx").on(table.userId, table.trackId),
  index("social_track_saves_user_idx").on(table.userId),
]);

export const insertSocialTrackSaveSchema = createInsertSchema(socialTrackSaves).omit({
  id: true,
  createdAt: true,
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targetType: text("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  reportedBy: varchar("reported_by").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("reports_target_idx").on(table.targetType, table.targetId),
  index("reports_resolved_idx").on(table.resolved),
]);

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  resolved: true,
  resolvedBy: true,
  resolvedAt: true,
});

export const socialPosts = pgTable("social_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  textContent: text("text_content"),
  imageUrl: text("image_url"),
  audioUrl: text("audio_url"),
  audioTitle: text("audio_title"),
  audioDuration: integer("audio_duration"),
  videoUrl: text("video_url"),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("social_posts_author_idx").on(table.authorId),
  index("social_posts_created_at_idx").on(table.createdAt),
]);

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  likesCount: true,
  commentsCount: true,
  createdAt: true,
  updatedAt: true,
});

export const socialPostLikes = pgTable("social_post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("social_post_likes_user_post_idx").on(table.userId, table.postId),
]);

export const insertSocialPostLikeSchema = createInsertSchema(socialPostLikes).omit({
  id: true,
  createdAt: true,
});

export const socialPostComments = pgTable("social_post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  textContent: text("text_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("social_post_comments_post_idx").on(table.postId),
  index("social_post_comments_author_idx").on(table.authorId),
  index("social_post_comments_created_at_idx").on(table.createdAt),
]);

export const insertSocialPostCommentSchema = createInsertSchema(socialPostComments).omit({
  id: true,
  createdAt: true,
});

export const clips = pgTable("clips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("clips_author_idx").on(table.authorId),
  index("clips_created_at_idx").on(table.createdAt),
]);

export const insertClipSchema = createInsertSchema(clips).omit({
  id: true,
  likesCount: true,
  commentsCount: true,
  createdAt: true,
});

export const clipLikes = pgTable("clip_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clipId: varchar("clip_id").notNull().references(() => clips.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("clip_likes_user_clip_idx").on(table.userId, table.clipId),
]);

export const insertClipLikeSchema = createInsertSchema(clipLikes).omit({
  id: true,
  createdAt: true,
});

export type SocialTrack = typeof socialTracks.$inferSelect;
export type InsertSocialTrack = z.infer<typeof insertSocialTrackSchema>;
export type SocialTrackSave = typeof socialTrackSaves.$inferSelect;
export type InsertSocialTrackSave = z.infer<typeof insertSocialTrackSaveSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPostLike = typeof socialPostLikes.$inferSelect;
export type InsertSocialPostLike = z.infer<typeof insertSocialPostLikeSchema>;
export type SocialPostComment = typeof socialPostComments.$inferSelect;
export type InsertSocialPostComment = z.infer<typeof insertSocialPostCommentSchema>;
export type Clip = typeof clips.$inferSelect;
export type InsertClip = z.infer<typeof insertClipSchema>;
export type ClipLike = typeof clipLikes.$inferSelect;
export type InsertClipLike = z.infer<typeof insertClipLikeSchema>;
