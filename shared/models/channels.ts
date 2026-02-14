import { sql } from "drizzle-orm";
import { pgTable, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const channelHealth = pgTable("channel_health", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  country: varchar("country").notNull(),
  channelGroup: varchar("channel_group").notNull(),
  iptvUrl: varchar("iptv_url").notNull(),
  isOnline: boolean("is_online").default(true),
  validated: boolean("validated").default(false),
  lastChecked: timestamp("last_checked"),
  consecutiveFailures: integer("consecutive_failures").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChannelHealthSchema = createInsertSchema(channelHealth).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertChannelHealth = z.infer<typeof insertChannelHealthSchema>;
export type ChannelHealth = typeof channelHealth.$inferSelect;
