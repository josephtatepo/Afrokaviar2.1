import fs from "fs";
import path from "path";
import { DOCUMENTARIES_SNAPSHOT, type DocumentarySnapshot } from "./documentariesSnapshot";

export type Documentary = DocumentarySnapshot;

const DOCS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsnu0kTXGs4pwtEknN7LavL-ruGAracn-DI9tvazX0BjR1l3N91Lep0pJaoHMaZ8_Z2kS4yD_68YTY/pub?output=csv";

const SNAPSHOT_FILE = path.join(process.cwd(), "server", "documentariesSnapshot.json");

type DiskSnapshot = { docs: Documentary[]; updatedAt: number };

function loadDiskSnapshot(): DiskSnapshot | null {
  try {
    if (!fs.existsSync(SNAPSHOT_FILE)) return null;
    const raw = fs.readFileSync(SNAPSHOT_FILE, "utf8");
    const parsed = JSON.parse(raw) as DiskSnapshot;
    if (!parsed?.docs?.length) return null;
    return parsed;
  } catch (err) {
    console.warn("[documentaries] Failed to read snapshot file:", (err as Error)?.message || err);
    return null;
  }
}

function writeDiskSnapshot(docs: Documentary[], updatedAt: number): boolean {
  try {
    const tmp = `${SNAPSHOT_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ docs, updatedAt }, null, 2), "utf8");
    fs.renameSync(tmp, SNAPSHOT_FILE);
    return true;
  } catch (err) {
    console.warn("[documentaries] Failed to persist snapshot file:", (err as Error)?.message || err);
    return false;
  }
}

let lastPersistedOk = true;

const initialDisk = loadDiskSnapshot();

export type DocumentariesSource = "bundled" | "disk" | "live";

let cache: { docs: Documentary[]; updatedAt: number; source: DocumentariesSource } = initialDisk
  ? { docs: initialDisk.docs, updatedAt: initialDisk.updatedAt, source: "disk" }
  : { docs: [...DOCUMENTARIES_SNAPSHOT], updatedAt: 0, source: "bundled" };

let inflight: Promise<Documentary[]> | null = null;
let lastAttemptAt = 0;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const FAILURE_BACKOFF_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (ch === "\r") { /* skip */ }
      else cell += ch;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function fetchLive(): Promise<Documentary[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${DOCS_CSV_URL}&_=${Date.now()}`, {
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`csv fetch failed: ${res.status}`);
    const text = await res.text();
    const rows = parseCsv(text).filter(r => r.length >= 6 && r[0] && r[0] !== "ID");
    const docs: Documentary[] = rows.map(r => {
      const rawType = (r[6] || "").trim().toLowerCase();
      const type: "Documentary" | "Feature" = rawType === "feature" ? "Feature" : "Documentary";
      return {
        id: r[0].trim(),
        title: r[1].trim(),
        description: r[2].trim(),
        youtubeId: r[3].trim(),
        category: r[4].trim(),
        speaker: r[5].trim(),
        type,
      };
    });
    if (docs.length === 0) throw new Error("csv produced no rows");
    return docs;
  } finally {
    clearTimeout(timer);
  }
}

function startRefresh(): Promise<Documentary[]> {
  if (inflight) return inflight;
  lastAttemptAt = Date.now();
  inflight = fetchLive()
    .then(docs => {
      const updatedAt = Date.now();
      cache = { docs, updatedAt, source: "live" };
      lastPersistedOk = writeDiskSnapshot(docs, updatedAt);
      return docs;
    })
    .catch(err => {
      console.warn("[documentaries] Live refresh failed:", err?.message || err);
      throw err;
    })
    .finally(() => { inflight = null; });
  return inflight;
}

function refreshInBackground(): void {
  if (inflight) return;
  startRefresh().catch(() => { /* swallowed; logged in startRefresh */ });
}

export function getDocumentaries(): { docs: Documentary[]; updatedAt: number; source: DocumentariesSource } {
  const now = Date.now();
  const stale = now - cache.updatedAt > REFRESH_INTERVAL_MS;
  const backoffElapsed = now - lastAttemptAt > FAILURE_BACKOFF_MS;
  if (stale && backoffElapsed) refreshInBackground();
  if (!cache.docs || cache.docs.length === 0) {
    return { docs: [...DOCUMENTARIES_SNAPSHOT], updatedAt: cache.updatedAt, source: "bundled" };
  }
  return cache;
}

export async function forceRefreshDocumentaries(): Promise<{ docs: Documentary[]; updatedAt: number; source: "live"; persisted: boolean }> {
  const docs = await startRefresh();
  return { docs, updatedAt: cache.updatedAt, source: "live", persisted: lastPersistedOk };
}

refreshInBackground();
