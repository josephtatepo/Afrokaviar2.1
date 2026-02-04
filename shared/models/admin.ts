import { sql } from "drizzle-orm";
import { pgTable, varchar, text, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";
import { songs } from "./music";

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  invitedBy: varchar("invited_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("admin_users_user_idx").on(table.userId),
  index("admin_users_role_idx").on(table.role),
]);

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

// Invitations system - for inviting new users (admin or regular)
export const invites = pgTable("invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  inviteCode: varchar("invite_code").notNull().unique(),
  role: text("role").notNull().default("user"), // user, admin, root_admin
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  acceptedBy: varchar("accepted_by").references(() => users.id),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("invites_email_idx").on(table.email),
  index("invites_code_idx").on(table.inviteCode),
  index("invites_invited_by_idx").on(table.invitedBy),
]);

export const insertInviteSchema = createInsertSchema(invites).omit({
  id: true,
  createdAt: true,
  acceptedBy: true,
  acceptedAt: true,
});

// Featured content for homepage
export const featuredContent = pgTable("featured_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentType: text("content_type").notNull(), // song, social_track
  contentId: varchar("content_id").notNull(),
  songId: varchar("song_id").references(() => songs.id),
  position: text("position").notNull().default("homepage_hero"), // homepage_hero, homepage_banner, etc.
  isActive: boolean("is_active").notNull().default(true),
  setBy: varchar("set_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("featured_content_position_idx").on(table.position),
  index("featured_content_active_idx").on(table.isActive),
]);

export const insertFeaturedContentSchema = createInsertSchema(featuredContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type Invite = typeof invites.$inferSelect;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
export type FeaturedContent = typeof featuredContent.$inferSelect;
export type InsertFeaturedContent = z.infer<typeof insertFeaturedContentSchema>;
