import { 
  type Song, 
  type InsertSong, 
  type SongReaction, 
  type InsertSongReaction,
  type SongFavorite,
  type InsertSongFavorite,
  type Entitlement,
  type InsertEntitlement,
  type User,
  type ChannelHealth,
  type InsertChannelHealth,
  type Invite,
  type InsertInvite,
  type FeaturedContent,
  type InsertFeaturedContent,
  type SocialTrack,
  type InsertSocialTrack,
  type SocialPost,
  type InsertSocialPost,
  type SocialPostLike,
  type InsertSocialPostLike,
  type SocialPostComment,
  type InsertSocialPostComment,
  type Clip,
  type InsertClip,
  type LibraryItem,
  type InsertLibraryItem,
  songs,
  songReactions,
  songFavorites,
  adminUsers,
  users,
  entitlements,
  orders,
  orderItems,
  channelHealth,
  invites,
  featuredContent,
  socialTracks,
  socialPosts,
  socialPostLikes,
  socialPostComments,
  clips,
  clipLikes,
  libraryItems,
  type AdminUser,
  type InsertAdminUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, lt, count } from "drizzle-orm";

export interface IStorage {
  getSongs(limit?: number, offset?: number): Promise<Song[]>;
  getSongById(id: string): Promise<Song | undefined>;
  createSong(song: InsertSong): Promise<Song>;
  updateSong(id: string, song: Partial<InsertSong>): Promise<Song | undefined>;
  deleteSong(id: string): Promise<boolean>;
  
  getSongReactions(songId: string): Promise<SongReaction[]>;
  getUserSongReaction(userId: string, songId: string): Promise<SongReaction | undefined>;
  createSongReaction(reaction: InsertSongReaction): Promise<SongReaction>;
  deleteSongReaction(userId: string, songId: string): Promise<boolean>;
  
  getSongFavorites(userId: string): Promise<SongFavorite[]>;
  isSongFavorited(userId: string, songId: string): Promise<boolean>;
  createSongFavorite(favorite: InsertSongFavorite): Promise<SongFavorite>;
  deleteSongFavorite(userId: string, songId: string): Promise<boolean>;
  
  getAdminUser(userId: string): Promise<AdminUser | undefined>;
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
  isRootAdmin(userId: string): Promise<boolean>;
  
  getUser(userId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByHandle(handle: string): Promise<User | undefined>;
  getUserByProviderId(authProvider: string, authProviderId: string): Promise<User | undefined>;
  updateUserHandle(userId: string, handle: string, changesThisMonth: number): Promise<User | undefined>;
  upsertUser(userData: Partial<User> & { email?: string; authProvider?: string; authProviderId?: string }): Promise<User>;
  updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string | null }): Promise<User | undefined>;
  getUserEntitlements(userId: string): Promise<Entitlement[]>;
  hasEntitlement(userId: string, songId: string): Promise<boolean>;
  createEntitlement(entitlement: InsertEntitlement): Promise<Entitlement>;
  createOrder(order: { userId: string; stripePaymentIntentId: string; status: string; totalAmount: number }): Promise<any>;
  updateOrderStatus(orderId: string, status: string, completedAt?: Date): Promise<any>;
  createOrderItem(item: { orderId: string; songId: string; price: number }): Promise<any>;
  getOrderByPaymentIntent(paymentIntentId: string): Promise<any>;
  
  getAllChannels(): Promise<ChannelHealth[]>;
  getOnlineChannels(): Promise<ChannelHealth[]>;
  getChannelById(id: string): Promise<ChannelHealth | undefined>;
  upsertChannel(channel: InsertChannelHealth): Promise<ChannelHealth>;
  updateChannelStatus(id: string, isOnline: boolean, consecutiveFailures: number): Promise<ChannelHealth | undefined>;
  getChannelsNeedingCheck(olderThanHours: number): Promise<ChannelHealth[]>;
  getValidatedChannels(): Promise<ChannelHealth[]>;
  toggleChannelValidation(id: string, validated: boolean): Promise<ChannelHealth | undefined>;
  
  // Analytics
  getAnalytics(): Promise<{ uploads: number; purchases: number; promoted: number; libraryItems: number; registeredUsers: number }>;
  
  // Social tracks
  createSocialTrack(track: InsertSocialTrack): Promise<SocialTrack>;
  getPendingSocialTracks(): Promise<SocialTrack[]>;
  getApprovedSocialTracks(): Promise<SocialTrack[]>;
  getSocialTrackById(id: string): Promise<SocialTrack | undefined>;
  getSocialTracksByUser(userId: string): Promise<SocialTrack[]>;
  updateSocialTrackStatus(id: string, status: string, reviewedBy: string): Promise<SocialTrack | undefined>;
  promoteSocialTrackToSong(trackId: string, songId: string): Promise<SocialTrack | undefined>;
  submitTrackForSale(trackId: string): Promise<SocialTrack | undefined>;
  deleteSocialTrack(id: string, userId: string): Promise<boolean>;
  deleteSocialTrackAsAdmin(id: string): Promise<boolean>;
  updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined>;
  
  // Invites
  createInvite(invite: InsertInvite): Promise<Invite>;
  getInviteByCode(code: string): Promise<Invite | undefined>;
  getInvitesByUser(userId: string): Promise<Invite[]>;
  acceptInvite(code: string, userId: string): Promise<Invite | undefined>;
  
  // Featured content
  getFeaturedContent(position: string): Promise<FeaturedContent | undefined>;
  setFeaturedContent(content: InsertFeaturedContent): Promise<FeaturedContent>;
  
  // Social posts
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  getSocialPosts(limit?: number, offset?: number): Promise<SocialPost[]>;
  getSocialPostById(id: string): Promise<SocialPost | undefined>;
  deleteSocialPost(id: string, authorId: string): Promise<boolean>;
  likeSocialPost(userId: string, postId: string): Promise<boolean>;
  unlikeSocialPost(userId: string, postId: string): Promise<boolean>;
  getSocialPostLikes(userId: string, postIds: string[]): Promise<string[]>;
  
  // Social post comments
  createSocialPostComment(comment: InsertSocialPostComment): Promise<SocialPostComment>;
  getSocialPostComments(postId: string, limit?: number, offset?: number): Promise<SocialPostComment[]>;
  deleteSocialPostComment(id: string, authorId: string): Promise<boolean>;
  
  // Clips
  createClip(clip: InsertClip): Promise<Clip>;
  getClips(limit?: number, offset?: number): Promise<Clip[]>;
  getClipById(id: string): Promise<Clip | undefined>;
  deleteClip(id: string, authorId: string): Promise<boolean>;
  likeClip(userId: string, clipId: string): Promise<boolean>;
  unlikeClip(userId: string, clipId: string): Promise<boolean>;
  getClipLikes(userId: string, clipIds: string[]): Promise<string[]>;

  // Library items
  createLibraryItem(item: InsertLibraryItem): Promise<LibraryItem>;
  getUserLibraryItems(userId: string, type?: string): Promise<LibraryItem[]>;
  getUserStorageStats(userId: string): Promise<{ usedBytes: number; limitBytes: number; isAdmin: boolean }>;
}

export class DatabaseStorage implements IStorage {
  async getSongs(limit: number = 50, offset: number = 0): Promise<Song[]> {
    return db.select().from(songs).orderBy(desc(songs.createdAt)).limit(limit).offset(offset);
  }

  async getSongById(id: string): Promise<Song | undefined> {
    const [song] = await db.select().from(songs).where(eq(songs.id, id));
    return song;
  }

  async createSong(song: InsertSong): Promise<Song> {
    const [newSong] = await db.insert(songs).values(song).returning();
    return newSong;
  }

  async updateSong(id: string, song: Partial<InsertSong>): Promise<Song | undefined> {
    const [updated] = await db
      .update(songs)
      .set({ ...song, updatedAt: new Date() })
      .where(eq(songs.id, id))
      .returning();
    return updated;
  }

  async deleteSong(id: string): Promise<boolean> {
    const result = await db.delete(songs).where(eq(songs.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getSongReactions(songId: string): Promise<SongReaction[]> {
    return db.select().from(songReactions).where(eq(songReactions.songId, songId));
  }

  async getUserSongReaction(userId: string, songId: string): Promise<SongReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(songReactions)
      .where(and(eq(songReactions.userId, userId), eq(songReactions.songId, songId)));
    return reaction;
  }

  async createSongReaction(reaction: InsertSongReaction): Promise<SongReaction> {
    const existing = await this.getUserSongReaction(reaction.userId, reaction.songId);
    if (existing) {
      const [updated] = await db
        .update(songReactions)
        .set({ type: reaction.type })
        .where(and(eq(songReactions.userId, reaction.userId), eq(songReactions.songId, reaction.songId)))
        .returning();
      return updated;
    }
    const [newReaction] = await db.insert(songReactions).values(reaction).returning();
    return newReaction;
  }

  async deleteSongReaction(userId: string, songId: string): Promise<boolean> {
    const result = await db
      .delete(songReactions)
      .where(and(eq(songReactions.userId, userId), eq(songReactions.songId, songId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getSongFavorites(userId: string): Promise<SongFavorite[]> {
    return db.select().from(songFavorites).where(eq(songFavorites.userId, userId));
  }

  async isSongFavorited(userId: string, songId: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(songFavorites)
      .where(and(eq(songFavorites.userId, userId), eq(songFavorites.songId, songId)));
    return !!favorite;
  }

  async createSongFavorite(favorite: InsertSongFavorite): Promise<SongFavorite> {
    const [newFavorite] = await db.insert(songFavorites).values(favorite).returning();
    return newFavorite;
  }

  async deleteSongFavorite(userId: string, songId: string): Promise<boolean> {
    const result = await db
      .delete(songFavorites)
      .where(and(eq(songFavorites.userId, userId), eq(songFavorites.songId, songId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAdminUser(userId: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.userId, userId));
    return admin;
  }

  async createAdminUser(admin: InsertAdminUser): Promise<AdminUser> {
    const [newAdmin] = await db.insert(adminUsers).values(admin).returning();
    return newAdmin;
  }

  async isRootAdmin(userId: string): Promise<boolean> {
    const admin = await this.getAdminUser(userId);
    return admin?.role === "root_admin";
  }

  async getUser(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByHandle(handle: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.handle, handle));
    return user;
  }

  async updateUserHandle(userId: string, handle: string, changesThisMonth: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        handle,
        handleLastChanged: new Date(),
        handleChangesThisMonth: changesThisMonth.toString(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByProviderId(authProvider: string, authProviderId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.authProvider, authProvider), eq(users.authProviderId, authProviderId)));
    return user;
  }

  async upsertUser(userData: Partial<User> & { email?: string; authProvider?: string; authProviderId?: string }): Promise<User> {
    // First try to find by provider ID (most reliable)
    if (userData.authProvider && userData.authProviderId) {
      const existingByProvider = await this.getUserByProviderId(userData.authProvider, userData.authProviderId);
      if (existingByProvider) {
        const [updated] = await db
          .update(users)
          .set({ ...userData, updatedAt: new Date() })
          .where(eq(users.id, existingByProvider.id))
          .returning();
        return updated;
      }
    }
    
    // Then try by email
    if (userData.email) {
      const existingByEmail = await this.getUserByEmail(userData.email);
      if (existingByEmail) {
        const [updated] = await db
          .update(users)
          .set({ ...userData, updatedAt: new Date() })
          .where(eq(users.id, existingByEmail.id))
          .returning();
        return updated;
      }
    }
    
    const [newUser] = await db.insert(users).values(userData as any).returning();
    return newUser;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
  }): Promise<User | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (stripeInfo.stripeCustomerId !== undefined) {
      updateData.stripeCustomerId = stripeInfo.stripeCustomerId;
    }
    if (stripeInfo.stripeSubscriptionId !== undefined) {
      updateData.stripeSubscriptionId = stripeInfo.stripeSubscriptionId;
    }
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserEntitlements(userId: string): Promise<Entitlement[]> {
    return db.select().from(entitlements).where(eq(entitlements.userId, userId));
  }

  async hasEntitlement(userId: string, songId: string): Promise<boolean> {
    const [entitlement] = await db
      .select()
      .from(entitlements)
      .where(and(eq(entitlements.userId, userId), eq(entitlements.songId, songId)));
    return !!entitlement;
  }

  async createEntitlement(entitlement: InsertEntitlement): Promise<Entitlement> {
    const [newEntitlement] = await db.insert(entitlements).values(entitlement).returning();
    return newEntitlement;
  }

  async createOrder(order: { userId: string; stripePaymentIntentId: string; status: string; totalAmount: number }) {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: string, completedAt?: Date) {
    const [updated] = await db
      .update(orders)
      .set({ status, completedAt })
      .where(eq(orders.id, orderId))
      .returning();
    return updated;
  }

  async createOrderItem(item: { orderId: string; songId: string; price: number }) {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  async getOrderByPaymentIntent(paymentIntentId: string) {
    const [order] = await db.select().from(orders).where(eq(orders.stripePaymentIntentId, paymentIntentId));
    return order;
  }

  async getAllChannels(): Promise<ChannelHealth[]> {
    return db.select().from(channelHealth).orderBy(channelHealth.name);
  }

  async getOnlineChannels(): Promise<ChannelHealth[]> {
    return db.select().from(channelHealth).where(eq(channelHealth.isOnline, true)).orderBy(channelHealth.name);
  }

  async getChannelById(id: string): Promise<ChannelHealth | undefined> {
    const [channel] = await db.select().from(channelHealth).where(eq(channelHealth.id, id));
    return channel;
  }

  async upsertChannel(channel: InsertChannelHealth): Promise<ChannelHealth> {
    const existing = await this.getChannelById(channel.id);
    if (existing) {
      const [updated] = await db
        .update(channelHealth)
        .set({ ...channel, updatedAt: new Date() })
        .where(eq(channelHealth.id, channel.id))
        .returning();
      return updated;
    }
    const [newChannel] = await db.insert(channelHealth).values(channel).returning();
    return newChannel;
  }

  async updateChannelStatus(id: string, isOnline: boolean, consecutiveFailures: number): Promise<ChannelHealth | undefined> {
    const [updated] = await db
      .update(channelHealth)
      .set({
        isOnline,
        consecutiveFailures,
        lastChecked: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(channelHealth.id, id))
      .returning();
    return updated;
  }

  async getChannelsNeedingCheck(olderThanHours: number): Promise<ChannelHealth[]> {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    return db
      .select()
      .from(channelHealth)
      .where(sql`${channelHealth.lastChecked} IS NULL OR ${channelHealth.lastChecked} < ${cutoff}`);
  }

  async getValidatedChannels(): Promise<ChannelHealth[]> {
    return db.select().from(channelHealth).where(eq(channelHealth.validated, true)).orderBy(channelHealth.name);
  }

  async toggleChannelValidation(id: string, validated: boolean): Promise<ChannelHealth | undefined> {
    const [updated] = await db.update(channelHealth)
      .set({ validated, updatedAt: new Date() })
      .where(eq(channelHealth.id, id))
      .returning();
    return updated;
  }

  // Analytics
  async getAnalytics(): Promise<{ uploads: number; purchases: number; promoted: number; libraryItems: number; registeredUsers: number }> {
    const [uploadsResult] = await db.select({ count: count() }).from(socialTracks);
    const [purchasesResult] = await db.select({ count: count() }).from(entitlements);
    const [promotedResult] = await db.select({ count: count() }).from(socialTracks).where(eq(socialTracks.status, "approved"));
    const [libraryResult] = await db.select({ count: count() }).from(entitlements);
    const [usersResult] = await db.select({ count: count() }).from(users);
    
    return {
      uploads: uploadsResult?.count || 0,
      purchases: purchasesResult?.count || 0,
      promoted: promotedResult?.count || 0,
      libraryItems: libraryResult?.count || 0,
      registeredUsers: usersResult?.count || 0,
    };
  }

  // Social tracks
  async getPendingSocialTracks(): Promise<SocialTrack[]> {
    return db.select().from(socialTracks).where(eq(socialTracks.status, "pending")).orderBy(desc(socialTracks.createdAt));
  }

  async getSocialTracksByUser(userId: string): Promise<SocialTrack[]> {
    return db.select().from(socialTracks).where(eq(socialTracks.uploadedBy, userId)).orderBy(desc(socialTracks.createdAt));
  }

  async updateSocialTrackStatus(id: string, status: string, reviewedBy: string): Promise<SocialTrack | undefined> {
    const [updated] = await db
      .update(socialTracks)
      .set({
        status,
        approved: status === "approved",
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(socialTracks.id, id))
      .returning();
    return updated;
  }

  async createSocialTrack(track: InsertSocialTrack): Promise<SocialTrack> {
    const [created] = await db.insert(socialTracks).values(track).returning();
    return created;
  }

  async getApprovedSocialTracks(): Promise<SocialTrack[]> {
    return db.select().from(socialTracks).where(eq(socialTracks.status, "approved")).orderBy(desc(socialTracks.createdAt));
  }

  async getSocialTrackById(id: string): Promise<SocialTrack | undefined> {
    const [track] = await db.select().from(socialTracks).where(eq(socialTracks.id, id));
    return track;
  }

  async promoteSocialTrackToSong(trackId: string, songId: string): Promise<SocialTrack | undefined> {
    const [updated] = await db
      .update(socialTracks)
      .set({
        featuredInCatalogue: songId,
        updatedAt: new Date(),
      })
      .where(eq(socialTracks.id, trackId))
      .returning();
    return updated;
  }

  async submitTrackForSale(trackId: string): Promise<SocialTrack | undefined> {
    const [updated] = await db
      .update(socialTracks)
      .set({
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(socialTracks.id, trackId))
      .returning();
    return updated;
  }

  async deleteSocialTrack(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(socialTracks).where(and(eq(socialTracks.id, id), eq(socialTracks.uploadedBy, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteSocialTrackAsAdmin(id: string): Promise<boolean> {
    const result = await db.delete(socialTracks).where(eq(socialTracks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ profileImageUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Invites
  async createInvite(invite: InsertInvite): Promise<Invite> {
    const [newInvite] = await db.insert(invites).values(invite).returning();
    return newInvite;
  }

  async getInviteByCode(code: string): Promise<Invite | undefined> {
    const [invite] = await db.select().from(invites).where(eq(invites.inviteCode, code));
    return invite;
  }

  async getInvitesByUser(userId: string): Promise<Invite[]> {
    return db.select().from(invites).where(eq(invites.invitedBy, userId)).orderBy(desc(invites.createdAt));
  }

  async acceptInvite(code: string, userId: string): Promise<Invite | undefined> {
    const [updated] = await db
      .update(invites)
      .set({ acceptedBy: userId, acceptedAt: new Date() })
      .where(eq(invites.inviteCode, code))
      .returning();
    return updated;
  }

  // Featured content
  async getFeaturedContent(position: string): Promise<FeaturedContent | undefined> {
    const [content] = await db
      .select()
      .from(featuredContent)
      .where(and(eq(featuredContent.position, position), eq(featuredContent.isActive, true)))
      .orderBy(desc(featuredContent.createdAt));
    return content;
  }

  async setFeaturedContent(content: InsertFeaturedContent): Promise<FeaturedContent> {
    // Deactivate any existing featured content for this position
    await db
      .update(featuredContent)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(featuredContent.position, content.position as string));
    
    // Create new featured content
    const [newContent] = await db.insert(featuredContent).values(content).returning();
    return newContent;
  }

  async createLibraryItem(item: InsertLibraryItem): Promise<LibraryItem> {
    const [created] = await db.insert(libraryItems).values(item).returning();
    return created;
  }

  async getUserLibraryItems(userId: string, type?: string): Promise<LibraryItem[]> {
    if (type) {
      return db.select().from(libraryItems).where(and(eq(libraryItems.userId, userId), eq(libraryItems.type, type))).orderBy(desc(libraryItems.createdAt));
    }
    return db.select().from(libraryItems).where(eq(libraryItems.userId, userId)).orderBy(desc(libraryItems.createdAt));
  }

  async getUserStorageStats(userId: string): Promise<{ usedBytes: number; limitBytes: number; isAdmin: boolean }> {
    const FREE_LIMIT = 200 * 1024 * 1024; // 200MB
    const adminUser = await this.getAdminUser(userId);
    const isAdminUser = !!adminUser;
    const items = await db.select({ fileSize: libraryItems.fileSize }).from(libraryItems)
      .where(and(eq(libraryItems.userId, userId), eq(libraryItems.type, "upload")));
    const usedBytes = items.reduce((sum, item) => sum + (item.fileSize || 0), 0);
    return { usedBytes, limitBytes: isAdminUser ? Number.MAX_SAFE_INTEGER : FREE_LIMIT, isAdmin: isAdminUser };
  }

  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const [created] = await db.insert(socialPosts).values(post).returning();
    return created;
  }

  async getSocialPosts(limit: number = 50, offset: number = 0): Promise<SocialPost[]> {
    return db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt)).limit(limit).offset(offset);
  }

  async getSocialPostById(id: string): Promise<SocialPost | undefined> {
    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
    return post;
  }

  async deleteSocialPost(id: string, authorId: string): Promise<boolean> {
    const result = await db.delete(socialPosts).where(and(eq(socialPosts.id, id), eq(socialPosts.authorId, authorId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async likeSocialPost(userId: string, postId: string): Promise<boolean> {
    const existing = await db.select().from(socialPostLikes)
      .where(and(eq(socialPostLikes.userId, userId), eq(socialPostLikes.postId, postId)));
    if (existing.length > 0) return false;
    await db.insert(socialPostLikes).values({ userId, postId });
    await db.update(socialPosts).set({ likesCount: sql`${socialPosts.likesCount} + 1` }).where(eq(socialPosts.id, postId));
    return true;
  }

  async unlikeSocialPost(userId: string, postId: string): Promise<boolean> {
    const result = await db.delete(socialPostLikes)
      .where(and(eq(socialPostLikes.userId, userId), eq(socialPostLikes.postId, postId)));
    if (result.rowCount && result.rowCount > 0) {
      await db.update(socialPosts).set({ likesCount: sql`GREATEST(${socialPosts.likesCount} - 1, 0)` }).where(eq(socialPosts.id, postId));
      return true;
    }
    return false;
  }

  async getSocialPostLikes(userId: string, postIds: string[]): Promise<string[]> {
    if (postIds.length === 0) return [];
    const likes = await db.select({ postId: socialPostLikes.postId }).from(socialPostLikes)
      .where(and(eq(socialPostLikes.userId, userId), sql`${socialPostLikes.postId} = ANY(${postIds})`));
    return likes.map(l => l.postId);
  }

  async createSocialPostComment(comment: InsertSocialPostComment): Promise<SocialPostComment> {
    const [created] = await db.insert(socialPostComments).values(comment).returning();
    await db.update(socialPosts).set({ commentsCount: sql`${socialPosts.commentsCount} + 1` }).where(eq(socialPosts.id, comment.postId));
    return created;
  }

  async getSocialPostComments(postId: string, limit: number = 50, offset: number = 0): Promise<SocialPostComment[]> {
    return db.select().from(socialPostComments)
      .where(eq(socialPostComments.postId, postId))
      .orderBy(desc(socialPostComments.createdAt))
      .limit(limit).offset(offset);
  }

  async deleteSocialPostComment(id: string, authorId: string): Promise<boolean> {
    const [comment] = await db.select().from(socialPostComments).where(eq(socialPostComments.id, id));
    if (!comment) return false;
    const result = await db.delete(socialPostComments)
      .where(and(eq(socialPostComments.id, id), eq(socialPostComments.authorId, authorId)));
    if (result.rowCount && result.rowCount > 0) {
      await db.update(socialPosts).set({ commentsCount: sql`GREATEST(${socialPosts.commentsCount} - 1, 0)` }).where(eq(socialPosts.id, comment.postId));
      return true;
    }
    return false;
  }

  async createClip(clip: InsertClip): Promise<Clip> {
    const [created] = await db.insert(clips).values(clip).returning();
    return created;
  }

  async getClips(limit: number = 50, offset: number = 0): Promise<Clip[]> {
    return db.select().from(clips).orderBy(desc(clips.createdAt)).limit(limit).offset(offset);
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    const [clip] = await db.select().from(clips).where(eq(clips.id, id));
    return clip;
  }

  async deleteClip(id: string, authorId: string): Promise<boolean> {
    const result = await db.delete(clips).where(and(eq(clips.id, id), eq(clips.authorId, authorId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async likeClip(userId: string, clipId: string): Promise<boolean> {
    const existing = await db.select().from(clipLikes)
      .where(and(eq(clipLikes.userId, userId), eq(clipLikes.clipId, clipId)));
    if (existing.length > 0) return false;
    await db.insert(clipLikes).values({ userId, clipId });
    await db.update(clips).set({ likesCount: sql`${clips.likesCount} + 1` }).where(eq(clips.id, clipId));
    return true;
  }

  async unlikeClip(userId: string, clipId: string): Promise<boolean> {
    const result = await db.delete(clipLikes)
      .where(and(eq(clipLikes.userId, userId), eq(clipLikes.clipId, clipId)));
    if (result.rowCount && result.rowCount > 0) {
      await db.update(clips).set({ likesCount: sql`GREATEST(${clips.likesCount} - 1, 0)` }).where(eq(clips.id, clipId));
      return true;
    }
    return false;
  }

  async getClipLikes(userId: string, clipIds: string[]): Promise<string[]> {
    if (clipIds.length === 0) return [];
    const likes = await db.select({ clipId: clipLikes.clipId }).from(clipLikes)
      .where(and(eq(clipLikes.userId, userId), sql`${clipLikes.clipId} = ANY(${clipIds})`));
    return likes.map(l => l.clipId);
  }
}

export const storage = new DatabaseStorage();
