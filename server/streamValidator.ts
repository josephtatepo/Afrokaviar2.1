import https from "https";
import http from "http";

export interface ValidationResult {
  isOnline: boolean;
  responseTime?: number;
  error?: string;
}

export async function validateStreamUrl(url: string, timeoutMs: number = 8000): Promise<ValidationResult> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === "https:" ? https : http;
      
      const req = protocol.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: "HEAD",
          timeout: timeoutMs,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "*/*",
          },
        },
        (res) => {
          const responseTime = Date.now() - startTime;
          req.destroy();
          
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
            resolve({ isOnline: true, responseTime });
          } else {
            resolve({ isOnline: false, error: `HTTP ${res.statusCode}`, responseTime });
          }
        }
      );

      req.on("timeout", () => {
        req.destroy();
        resolve({ isOnline: false, error: "Timeout" });
      });

      req.on("error", (err) => {
        req.destroy();
        resolve({ isOnline: false, error: err.message });
      });

      req.end();
    } catch (err) {
      resolve({ isOnline: false, error: err instanceof Error ? err.message : "Invalid URL" });
    }
  });
}

export async function validateStreamWithFallback(url: string): Promise<ValidationResult> {
  const headResult = await validateStreamUrl(url, 8000);
  
  if (headResult.isOnline) {
    return headResult;
  }
  
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === "https:" ? https : http;
      
      const req = protocol.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: "GET",
          timeout: 10000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "*/*",
            "Range": "bytes=0-1024",
          },
        },
        (res) => {
          let dataReceived = false;
          
          res.on("data", () => {
            if (!dataReceived) {
              dataReceived = true;
              req.destroy();
              resolve({ isOnline: true });
            }
          });
          
          res.on("end", () => {
            if (!dataReceived) {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
                resolve({ isOnline: true });
              } else {
                resolve({ isOnline: false, error: `HTTP ${res.statusCode}` });
              }
            }
          });
        }
      );

      req.on("timeout", () => {
        req.destroy();
        resolve({ isOnline: false, error: "Timeout" });
      });

      req.on("error", (err) => {
        req.destroy();
        resolve({ isOnline: false, error: err.message });
      });

      req.end();
    } catch (err) {
      resolve({ isOnline: false, error: err instanceof Error ? err.message : "Invalid URL" });
    }
  });
}
