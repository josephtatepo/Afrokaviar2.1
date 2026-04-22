import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { isAuthenticated } from "../../auth/socialAuth";
import { storage } from "../../storage";

const ALLOWED_CONTENT_TYPES = [
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/x-wav", "audio/flac",
  "image/jpeg", "image/png", "image/webp",
  "video/mp4", "video/webm",
  "application/pdf",
];

// Normalize content types: some OS/browsers send non-standard variants
function normalizeContentType(ct: string): string {
  if (ct === "audio/mp3") return "audio/mpeg";
  if (ct === "audio/x-mp3") return "audio/mpeg";
  if (ct === "audio/x-mpeg") return "audio/mpeg";
  return ct;
}

export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  app.post("/api/uploads/request-url", isAuthenticated, async (req: any, res) => {
    try {
      const { name, size } = req.body;
      const contentType = req.body.contentType ? normalizeContentType(req.body.contentType) : undefined;

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

      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (!isAdminUser && size && size > MAX_FILE_SIZE) {
        return res.status(400).json({ error: "File size exceeds 50MB limit." });
      }

      if (!isAdminUser && size) {
        const storageStats = await storage.getUserStorageStats(userId);
        if (storageStats.usedBytes + size > storageStats.limitBytes) {
          return res.status(403).json({ error: "Storage limit reached. Upgrade for more storage." });
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
   * Serve uploaded objects with HTTP range request support.
   * Range requests are required by Safari/iOS for audio/video playback.
   *
   * GET /objects/:path+
   */
  app.get(/^\/objects\/(.+)$/, async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res, req);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
