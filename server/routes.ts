import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSocialAuth, registerSocialAuthRoutes, isAuthenticated } from "./auth/socialAuth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { stripeService } from "./stripeService";
import { getStripePublishableKey, getUncachableStripeClient } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { initializeChannels, runHealthCheck, checkChannelHealth, startPeriodicHealthCheck } from "./channelHealthChecker";
import { sendInviteEmail } from "./email";
import { syncToGitHub } from "./githubSync";

const ADMIN_ROOT_EMAIL = "josephtatepo@gmail.com";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupSocialAuth(app);
  registerSocialAuthRoutes(app);
  registerObjectStorageRoutes(app);
  const { insertSongSchema, insertSongReactionSchema, insertSongFavoriteSchema } = await import("@shared/schema");

  const isAdmin = async (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const admin = await storage.getAdminUser(userId);
    if (!admin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
  };

  app.get("/api/songs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const songs = await storage.getSongs(limit, offset);
      res.json(songs);
    } catch (error) {
      console.error("Error fetching songs:", error);
      res.status(500).json({ message: "Failed to fetch songs" });
    }
  });

  app.get("/api/songs/:id", async (req, res) => {
    try {
      const song = await storage.getSongById(req.params.id);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      console.error("Error fetching song:", error);
      res.status(500).json({ message: "Failed to fetch song" });
    }
  });

  app.post("/api/songs", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const songData = insertSongSchema.parse({ ...req.body, uploadedBy: userId });
      const song = await storage.createSong(songData);
      res.status(201).json(song);
    } catch (error) {
      console.error("Error creating song:", error);
      res.status(400).json({ message: "Failed to create song" });
    }
  });

  app.put("/api/songs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const song = await storage.updateSong(id, req.body);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      console.error("Error updating song:", error);
      res.status(500).json({ message: "Failed to update song" });
    }
  });

  app.delete("/api/songs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await storage.deleteSong(id);
      if (!deleted) {
        return res.status(404).json({ message: "Song not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting song:", error);
      res.status(500).json({ message: "Failed to delete song" });
    }
  });

  app.post("/api/songs/:id/react", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reactionData = insertSongReactionSchema.parse({
        userId,
        songId: req.params.id,
        type: req.body.type,
      });
      const reaction = await storage.createSongReaction(reactionData);
      res.json(reaction);
    } catch (error) {
      console.error("Error creating reaction:", error);
      res.status(400).json({ message: "Failed to create reaction" });
    }
  });

  app.delete("/api/songs/:id/react", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deleted = await storage.deleteSongReaction(userId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Reaction not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting reaction:", error);
      res.status(500).json({ message: "Failed to delete reaction" });
    }
  });

  app.post("/api/songs/:id/favorite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const favoriteData = insertSongFavoriteSchema.parse({
        userId,
        songId: req.params.id,
      });
      const favorite = await storage.createSongFavorite(favoriteData);
      res.json(favorite);
    } catch (error) {
      console.error("Error creating favorite:", error);
      res.status(400).json({ message: "Failed to create favorite" });
    }
  });

  app.delete("/api/songs/:id/favorite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deleted = await storage.deleteSongFavorite(userId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting favorite:", error);
      res.status(500).json({ message: "Failed to delete favorite" });
    }
  });

  app.get("/api/songs/:id/reactions", async (req, res) => {
    try {
      const reactions = await storage.getSongReactions(req.params.id);
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ message: "Failed to fetch reactions" });
    }
  });

  app.get("/api/me/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const favorites = await storage.getSongFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ message: "Failed to get Stripe config" });
    }
  });

  app.get("/api/stripe/products", async (_req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }
      res.json({ products: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/checkout/song", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { songId } = req.body;
      
      const song = await storage.getSongById(songId);
      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }

      const hasEntitlement = await storage.hasEntitlement(userId, songId);
      if (hasEntitlement) {
        return res.status(400).json({ message: "You already own this song" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email || '', userId);
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const priceResult = await db.execute(
        sql`SELECT id FROM stripe.prices WHERE active = true AND unit_amount = 100 AND metadata->>'type' = 'song_purchase' LIMIT 1`
      );
      const priceId = (priceResult.rows[0] as any)?.id;
      
      if (!priceId) {
        return res.status(500).json({ message: "Song price not configured" });
      }

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        'payment',
        `${req.protocol}://${req.get('host')}/checkout/success?songId=${songId}`,
        `${req.protocol}://${req.get('host')}/music`,
        { userId, songId, type: 'song_purchase' }
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/checkout/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        return res.status(400).json({ message: "You already have an active subscription" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email || '', userId);
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const priceResult = await db.execute(
        sql`SELECT id FROM stripe.prices WHERE active = true AND recurring IS NOT NULL AND metadata->>'type' = 'library_subscription' LIMIT 1`
      );
      const priceId = (priceResult.rows[0] as any)?.id;
      
      if (!priceId) {
        return res.status(500).json({ message: "Subscription price not configured" });
      }

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        'subscription',
        `${req.protocol}://${req.get('host')}/checkout/success?type=subscription`,
        `${req.protocol}://${req.get('host')}/library`,
        { userId, type: 'library_subscription' }
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating subscription checkout:", error);
      res.status(500).json({ message: "Failed to create subscription checkout" });
    }
  });

  app.get("/api/me/entitlements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const entitlements = await storage.getUserEntitlements(userId);
      
      // Fetch song details for each entitlement
      const entitlementsWithSongs = await Promise.all(
        entitlements.map(async (ent) => {
          const song = await storage.getSongById(ent.songId);
          return {
            ...ent,
            song: song ? { id: song.id, title: song.title, artist: song.artist, artworkUrl: song.artworkUrl } : null,
          };
        })
      );
      
      res.json(entitlementsWithSongs);
    } catch (error) {
      console.error("Error fetching entitlements:", error);
      res.status(500).json({ message: "Failed to fetch entitlements" });
    }
  });

  app.get("/api/me/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
      res.json({ subscription });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Library items
  app.get("/api/me/library", isAuthenticated, async (req: any, res) => {
    try {
      const type = req.query.type as string | undefined;
      const items = await storage.getUserLibraryItems(req.user.id, type);
      res.json(items);
    } catch (error) {
      console.error("Error fetching library items:", error);
      res.status(500).json({ message: "Failed to fetch library items" });
    }
  });

  app.get("/api/me/storage", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getUserStorageStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching storage stats:", error);
      res.status(500).json({ message: "Failed to fetch storage stats" });
    }
  });

  app.post("/api/me/library", isAuthenticated, async (req: any, res) => {
    try {
      const { type, referenceId, objectPath, metadata, fileSize } = req.body;
      
      if (!type) {
        return res.status(400).json({ message: "Type is required" });
      }
      
      // Check subscription for upload type (admins get free access)
      if (type === "upload") {
        const user = await storage.getUser(req.user.id);
        const adminUser = await storage.getAdminUser(req.user.id);
        const isRootAdmin = req.user.email === ADMIN_ROOT_EMAIL;
        
        // Admins bypass subscription check
        if (!adminUser && !isRootAdmin) {
          if (!user?.stripeSubscriptionId) {
            return res.status(403).json({ message: "Subscription required for library uploads" });
          }
          const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
          if (subscription?.status !== "active") {
            return res.status(403).json({ message: "Active subscription required for library uploads" });
          }
        }
      }
      
      const item = await storage.createLibraryItem({
        userId: req.user.id,
        type,
        referenceId: referenceId || null,
        objectPath: objectPath || null,
        fileSize: fileSize || null,
        metadata: metadata || null,
      });
      
      res.json(item);
    } catch (error) {
      console.error("Error creating library item:", error);
      res.status(500).json({ message: "Failed to create library item" });
    }
  });

  app.get("/api/channels", async (req, res) => {
    try {
      const onlineOnly = req.query.online === "true";
      const channels = onlineOnly 
        ? await storage.getOnlineChannels() 
        : await storage.getAllChannels();
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  app.get("/api/channels/:id", async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const channel = await storage.getChannelById(id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).json({ message: "Failed to fetch channel" });
    }
  });

  app.post("/api/channels/:id/check", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const isOnline = await checkChannelHealth(id);
      const channel = await storage.getChannelById(id);
      res.json({ isOnline, channel });
    } catch (error) {
      console.error("Error checking channel:", error);
      res.status(500).json({ message: "Failed to check channel" });
    }
  });

  app.post("/api/channels/health-check", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await runHealthCheck();
      res.json(result);
    } catch (error) {
      console.error("Error running health check:", error);
      res.status(500).json({ message: "Failed to run health check" });
    }
  });

  // User profile endpoints
  app.get("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        handle: user.handle,
        handleChangesThisMonth: user.handleChangesThisMonth || "0",
        profileImageUrl: user.profileImageUrl,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/user/handle", isAuthenticated, async (req: any, res) => {
    try {
      const { handle } = req.body;
      const userId = req.user.id;

      // Check if user is admin (admins can have 3+ char handles, regular users need 7+)
      const adminUser = await storage.getAdminUser(userId);
      const isRootAdmin = req.user.email === ADMIN_ROOT_EMAIL;
      const minLength = (adminUser || isRootAdmin) ? 3 : 7;

      // Validate handle
      if (!handle || handle.length < minLength) {
        return res.status(400).json({ message: `Handle must be at least ${minLength} characters` });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
        return res.status(400).json({ message: "Handle can only contain letters, numbers, and underscores" });
      }

      // Check if handle is taken
      const existingUser = await storage.getUserByHandle(handle);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "This handle is already taken" });
      }

      // Check change limit (max 2 per month)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const changesThisMonth = parseInt(user.handleChangesThisMonth || "0");
      const lastChanged = user.handleLastChanged ? new Date(user.handleLastChanged) : null;
      const now = new Date();
      
      // Reset counter if it's a new month (check both month and year)
      let currentChanges = changesThisMonth;
      if (lastChanged && 
          (lastChanged.getMonth() !== now.getMonth() || lastChanged.getFullYear() !== now.getFullYear())) {
        currentChanges = 0;
      }

      if (currentChanges >= 2) {
        return res.status(400).json({ message: "You can only change your handle 2 times per month" });
      }

      // Update handle
      await storage.updateUserHandle(userId, handle, currentChanges + 1);
      
      res.json({ success: true, handle });
    } catch (error) {
      console.error("Error updating handle:", error);
      res.status(500).json({ message: "Failed to update handle" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    });
  });

  // Admin analytics endpoint
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin review queue
  app.get("/api/admin/review-queue", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pendingTracks = await storage.getPendingSocialTracks();
      res.json(pendingTracks);
    } catch (error) {
      console.error("Error fetching review queue:", error);
      res.status(500).json({ message: "Failed to fetch review queue" });
    }
  });

  // Approve/reject social track
  app.put("/api/admin/social-tracks/:id/review", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.body; // "approved" or "rejected"
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const track = await storage.updateSocialTrackStatus(req.params.id, status, req.user.id);
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      console.error("Error reviewing track:", error);
      res.status(500).json({ message: "Failed to review track" });
    }
  });

  // Get user's own submissions with status
  app.get("/api/me/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const tracks = await storage.getSocialTracksByUser(req.user.id);
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Get approved social tracks for explore page
  app.get("/api/social-tracks", async (req, res) => {
    try {
      const tracks = await storage.getApprovedSocialTracks();
      
      // Enrich with user handles
      const tracksWithHandles = await Promise.all(
        tracks.map(async (track) => {
          const user = await storage.getUser(track.uploadedBy);
          return {
            ...track,
            uploaderHandle: user?.handle || user?.firstName || "user",
          };
        })
      );
      
      res.json(tracksWithHandles);
    } catch (error) {
      console.error("Error fetching social tracks:", error);
      res.status(500).json({ message: "Failed to fetch social tracks" });
    }
  });

  // Create a new social track
  app.post("/api/social-tracks", isAuthenticated, async (req: any, res) => {
    try {
      const { title, audioUrl, duration, submitForSale } = req.body;
      
      if (!title || !audioUrl) {
        return res.status(400).json({ message: "Title and audio URL are required" });
      }
      
      const track = await storage.createSocialTrack({
        title,
        audioUrl,
        duration: duration || null,
        uploadedBy: req.user.id,
        status: submitForSale ? "pending_sale" : "approved", // If submitting for sale, needs admin review
      });
      
      res.json(track);
    } catch (error) {
      console.error("Error creating social track:", error);
      res.status(500).json({ message: "Failed to create social track" });
    }
  });

  // Submit track for sale (user requests promotion to Music)
  app.post("/api/social-tracks/:id/submit-for-sale", isAuthenticated, async (req: any, res) => {
    try {
      const track = await storage.getSocialTrackById(req.params.id);
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      if (track.uploadedBy !== req.user.id) {
        return res.status(403).json({ message: "You can only submit your own tracks" });
      }
      if (track.featuredInCatalogue) {
        return res.status(400).json({ message: "Track is already in the Music catalogue" });
      }
      const updated = await storage.submitTrackForSale(req.params.id);
      res.json(updated);
    } catch (error) {
      console.error("Error submitting track:", error);
      res.status(500).json({ message: "Failed to submit track" });
    }
  });

  // Admin: Promote social track to Music catalogue
  app.post("/api/admin/social-tracks/:id/promote", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { title, artist, album, genre } = req.body;
      const track = await storage.getSocialTrackById(req.params.id);
      
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      if (track.featuredInCatalogue) {
        return res.status(400).json({ message: "Track is already promoted to Music" });
      }

      // Create song from social track with $1 price
      const song = await storage.createSong({
        title: title || track.title,
        artist: artist || "Unknown Artist",
        album: album || null,
        genre: genre || null,
        artworkUrl: track.artworkUrl,
        audioUrl: track.audioUrl,
        duration: track.duration,
        price: 100, // $1 in cents
        uploadedBy: track.uploadedBy,
      });

      // Link social track to the song
      await storage.promoteSocialTrackToSong(track.id, song.id);
      
      // Mark as approved
      await storage.updateSocialTrackStatus(track.id, "approved", req.user.id);

      res.json({ song, message: "Track promoted to Music catalogue" });
    } catch (error) {
      console.error("Error promoting track:", error);
      res.status(500).json({ message: "Failed to promote track" });
    }
  });

  // Create invite
  app.post("/api/invites", isAuthenticated, async (req: any, res) => {
    try {
      const { email, role } = req.body;
      
      // Only root admin can invite other admins
      const inviterAdmin = await storage.getAdminUser(req.user.id);
      const isRootAdmin = inviterAdmin?.role === "root_admin";
      
      if (role === "admin" || role === "root_admin") {
        if (!isRootAdmin) {
          return res.status(403).json({ message: "Only root admin can invite admins" });
        }
      }
      
      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const invite = await storage.createInvite({
        email,
        inviteCode,
        role: role || "user",
        invitedBy: req.user.id,
        expiresAt,
      });
      
      // Send invite email if email is provided
      if (email) {
        const inviterName = req.user.handle || req.user.firstName || "Someone";
        const emailSent = await sendInviteEmail(email, inviteCode, inviterName);
        if (!emailSent) {
          console.warn("Failed to send invite email to:", email);
        }
      }
      
      res.status(201).json(invite);
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ message: "Failed to create invite" });
    }
  });

  // Get user's sent invites
  app.get("/api/me/invites", isAuthenticated, async (req: any, res) => {
    try {
      const invites = await storage.getInvitesByUser(req.user.id);
      res.json(invites);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ message: "Failed to fetch invites" });
    }
  });

  // Accept invite (during signup/login)
  app.post("/api/invites/:code/accept", isAuthenticated, async (req: any, res) => {
    try {
      const invite = await storage.getInviteByCode(req.params.code);
      if (!invite) {
        return res.status(404).json({ message: "Invite not found" });
      }
      if (invite.acceptedBy) {
        return res.status(400).json({ message: "Invite already accepted" });
      }
      if (new Date() > new Date(invite.expiresAt)) {
        return res.status(400).json({ message: "Invite has expired" });
      }
      
      const updated = await storage.acceptInvite(req.params.code, req.user.id);
      
      // If invite was for admin, grant admin access
      if (invite.role === "admin" || invite.role === "root_admin") {
        await storage.createAdminUser({
          userId: req.user.id,
          role: invite.role,
          invitedBy: invite.invitedBy,
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error accepting invite:", error);
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });

  // Get featured content for homepage
  app.get("/api/featured/:position", async (req, res) => {
    try {
      const content = await storage.getFeaturedContent(req.params.position);
      if (!content) {
        return res.status(404).json({ message: "No featured content" });
      }
      
      // If it's a song, fetch the song details
      if (content.songId) {
        const song = await storage.getSongById(content.songId);
        return res.json({ ...content, song });
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching featured content:", error);
      res.status(500).json({ message: "Failed to fetch featured content" });
    }
  });

  // Set featured content (admin only)
  app.post("/api/admin/featured", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { contentType, contentId, songId, position } = req.body;
      
      const content = await storage.setFeaturedContent({
        contentType,
        contentId,
        songId,
        position,
        isActive: true,
        setBy: req.user.id,
      });
      
      res.status(201).json(content);
    } catch (error) {
      console.error("Error setting featured content:", error);
      res.status(500).json({ message: "Failed to set featured content" });
    }
  });

  app.post("/api/admin/github-sync", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const repoUrl = await syncToGitHub();
      res.json({ message: "Sync complete", repoUrl });
    } catch (error: any) {
      console.error("GitHub sync error:", error);
      res.status(500).json({ message: "GitHub sync failed: " + error.message });
    }
  });

  initializeChannels().then(() => {
    startPeriodicHealthCheck(2);
  }).catch(console.error);

  return httpServer;
}
