import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { isAuthenticated } from "../../auth/socialAuth";
import { storage } from "../../storage";
import { stripeService } from "../../stripeService";

const ALLOWED_CONTENT_TYPES = [
  "audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/x-wav", "audio/flac",
  "image/jpeg", "image/png", "image/webp",
  "video/mp4", "video/webm",
  "application/pdf",
];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  app.post("/api/uploads/request-url", isAuthenticated, async (req: any, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Missing required field: name" });
      }

      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (contentType && !ALLOWED_CONTENT_TYPES.includes(contentType)) {
        return res.status(400).json({ error: "Unsupported file type." });
      }

      const adminUser = await storage.getAdminUser(userId);
      const isAdminUser = !!adminUser;

      if (!isAdminUser && contentType && VIDEO_TYPES.includes(contentType)) {
        const user = await storage.getUser(userId);
        if (!user?.stripeSubscriptionId) {
          return res.status(403).json({ error: "Subscription required to upload videos." });
        }
        const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
        if (subscription?.status !== "active") {
          return res.status(403).json({ error: "Active subscription required to upload videos." });
        }
      }

      if (!isAdminUser && size) {
        const storageStats = await storage.getUserStorageStats(userId);
        if (storageStats.usedBytes + size > storageStats.limitBytes) {
          return res.status(403).json({ error: "Storage limit reached (200MB free)." });
        }
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:path+
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get(/^\/objects\/(.+)$/, async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

