import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";
import { X, BookOpen, ArrowUpRight, Play } from "lucide-react";

export type Reading = { label: string; url: string };

export type Documentary = {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string;
  speaker: string;
  type: "Documentary" | "Feature";
  reading?: Reading;
};

export const DOCS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsnu0kTXGs4pwtEknN7LavL-ruGAracn-DI9tvazX0BjR1l3N91Lep0pJaoHMaZ8_Z2kS4yD_68YTY/pub?output=csv";

export const READING_BY_POSITION: Reading[] = [
  {
    label: "The African Origin of Civilization — Cheikh Anta Diop",
    url: "https://www.goodreads.com/book/show/406932.The_African_Origin_of_Civilization",
  },
  {
    label: "Civilization or Barbarism — Cheikh Anta Diop",
    url: "https://www.goodreads.com/book/show/406933.Civilization_or_Barbarism",
  },
  {
    label: "The Bad-Ass Librarians of Timbuktu — Joshua Hammer",
    url: "https://www.goodreads.com/book/show/26530342-the-bad-ass-librarians-of-timbuktu",
  },
];

export const RELATED_READING: Record<string, Reading> = {
  "1": READING_BY_POSITION[0],
  "2": READING_BY_POSITION[1],
  "3": READING_BY_POSITION[2],
};

export const FALLBACK_DOCS: Documentary[] = [
  { id: "1", title: "The African Origin of Civilization", description: "The scientific and linguistic legacy of Cheikh Anta Diop.", youtubeId: "D_SSHt74zdQ", category: "History", speaker: "Cheikh Anta Diop", type: "Documentary", reading: RELATED_READING["1"] },
  { id: "2", title: "Stone & Spirit", description: "Mathematical principles and stellar alignment of Kemet.", youtubeId: "2fI0E8B2tFw", category: "Architecture", speaker: "Various", type: "Documentary", reading: RELATED_READING["2"] },
  { id: "3", title: "The Golden Age of Timbuktu", description: "Restoration of the world's oldest African manuscripts.", youtubeId: "5X-M7LUM3vA", category: "Education", speaker: "Archive Scholars", type: "Documentary", reading: RELATED_READING["3"] },
  { id: "4", title: "I Am Not Your Negro", description: "James Baldwin’s unfinished manuscript on American race.", youtubeId: "TO2PsTnqgUE", category: "Philosophy", speaker: "James Baldwin", type: "Documentary" },
  { id: "5", title: "Concerning Violence", description: "Visual narrative of Fanon’s Wretched of the Earth.", youtubeId: "OOfmE6O8Sls", category: "Geopolitics", speaker: "Frantz Fanon", type: "Documentary" },
  { id: "6", title: "Summer of Soul", description: "The 1969 Harlem Cultural Festival: Music and Black joy.", youtubeId: "M07tV_WjLls", category: "Culture", speaker: "Questlove / Various", type: "Documentary" },
  { id: "7", title: "The Black Power Mixtape", description: "Found footage of the 1967-1975 Black Power Movement.", youtubeId: "vf1-Z24a_7I", category: "Sociology", speaker: "Stokely Carmichael", type: "Documentary" },
  { id: "8", title: "Mansa Musa: The Richest Man", description: "The wealth and pilgrimage of the Mali Empire’s leader.", youtubeId: "AZbM-gk965s", category: "Wealth", speaker: "Mansa Musa", type: "Documentary" },
  { id: "9", title: "Sankara's Ghost", description: "The revolutionary life and assassination of Thomas Sankara.", youtubeId: "cobVBgQKdlc", category: "Leadership", speaker: "Thomas Sankara", type: "Documentary" },
  { id: "10", title: "Great Zimbabwe: Lost Kingdoms", description: "Exploring the stone architectural genius of Southern Africa.", youtubeId: "U2JR2FVrDHM", category: "Architecture", speaker: "BBC/Various", type: "Documentary" },
  { id: "11", title: "Slavery by Another Name", description: "The re-enslavement of Black Americans from the Civil War.", youtubeId: "z9QS7SZVarY", category: "Justice", speaker: "Douglas Blackmon", type: "Documentary" },
  { id: "12", title: "The Kingdom of Aksum", description: "Ethiopia’s ancient civilization and the Ark of the Covenant.", youtubeId: "O-wAnx_5iTo", category: "Antiquity", speaker: "Various", type: "Documentary" },
  { id: "13", title: "1804: Hidden History of Haiti", description: "The untold story of the only successful slave revolution.", youtubeId: "9Z7yYp5W2y8", category: "Revolution", speaker: "Tariq Nasheed", type: "Documentary" },
  { id: "14", title: "L'Origine Africaine des Anciens Egyptiens", description: "Cheikh Anta Diop - Le Savant qui a prouvé l'Origine Africaine des Anciens Egyptiens - UNESCO - 1980", youtubeId: "D_SSHt74zdQ", category: "History", speaker: "Cheikh Anta Diop", type: "Documentary" },
];

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
      else if (ch === ',') { row.push(cell); cell = ""; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (ch === '\r') { /* skip */ }
      else cell += ch;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function fetchDocsFromApi(): Promise<Documentary[]> {
  const res = await fetch("/api/documentaries", { cache: "no-store" });
  if (!res.ok) throw new Error("api fetch failed");
  const json = await res.json() as { docs: Documentary[] };
  if (!Array.isArray(json.docs) || json.docs.length === 0) throw new Error("api returned no docs");
  return json.docs.map(d => ({ ...d, reading: d.reading ?? RELATED_READING[d.id] }));
}

async function fetchDocsFromCsv(): Promise<Documentary[]> {
  const url = `${DOCS_CSV_URL}&_=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("csv fetch failed");
  const text = await res.text();
  const rows = parseCsv(text).filter(r => r.length >= 6 && r[0] && r[0] !== "ID");
  return rows.map(r => {
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
      reading: RELATED_READING[r[0].trim()],
    };
  });
}

export async function fetchDocs(): Promise<Documentary[]> {
  try {
    return await fetchDocsFromApi();
  } catch (apiErr) {
    try {
      return await fetchDocsFromCsv();
    } catch (csvErr) {
      throw apiErr;
    }
  }
}

export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function CinemaModal({ doc, onClose }: { doc: Documentary; onClose: () => void }) {
  const { t } = useI18n();
  const [showReading, setShowReading] = useState(false);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const [thumbMissing, setThumbMissing] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    type YtMessage = { event?: string; info?: number | { playerState?: number } };
    const isYtMessage = (v: unknown): v is YtMessage =>
      typeof v === "object" && v !== null && "event" in (v as Record<string, unknown>);

    const onMsg = (e: MessageEvent) => {
      if (typeof e.origin === "string" && !e.origin.includes("youtube")) return;
      let data: unknown = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (!isYtMessage(data)) return;
      const info = data.info;
      const playerState =
        typeof info === "number" ? info : (info && typeof info === "object" ? info.playerState : undefined);
      const ended =
        (data.event === "onStateChange" && playerState === 0) ||
        (data.event === "infoDelivery" && playerState === 0);
      if (ended) setShowReading(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] overflow-y-auto flex items-start justify-center px-4 backdrop-blur-md animate-in fade-in duration-300"
      style={{ backgroundColor: "rgba(10,10,10,0.98)", paddingTop: 10, paddingBottom: 20 }}
      data-testid="modal-cinema"
    >
      <div className="w-full max-w-[1000px] animate-in zoom-in-95 duration-500">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] hover:opacity-80 transition-opacity"
            style={{ color: "#F4BE44" }}
            data-testid="button-close-cinema"
          >
            <X size={14} strokeWidth={2.5} />
            {t("docs.close")}
          </button>
          {doc.reading && !showReading && (
            <button
              onClick={() => setShowReading(true)}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-colors"
              style={{  }}
              data-testid="button-show-reading"
            >
              <BookOpen size={12} />
              {t("docs.related")}
            </button>
          )}
        </div>

        <div
          className="relative w-full"
          style={{
            paddingBottom: "56.25%",
            border: "1px solid #F4BE44",
            boxShadow: "0 0 50px rgba(244,190,68,0.25)",
          }}
        >
          {playerLoaded ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${doc.youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
              title={doc.title}
              frameBorder={0}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlayerLoaded(true)}
              className="absolute inset-0 w-full h-full group cursor-pointer"
              aria-label={`Play ${doc.title}`}
              data-testid="button-play-cinema"
            >
              <img
                src={`https://i.ytimg.com/vi/${doc.youtubeId}/maxresdefault.jpg`}
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.src.endsWith("hqdefault.jpg")) {
                    img.src = `https://i.ytimg.com/vi/${doc.youtubeId}/hqdefault.jpg`;
                  } else {
                    setThumbMissing(true);
                  }
                }}
                onLoad={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  setThumbMissing(img.naturalHeight > 0 && img.naturalHeight <= 120);
                }}
                alt={doc.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className={`absolute inset-0 transition-colors ${thumbMissing ? "bg-black/95 group-hover:bg-black/90" : "bg-black/40 group-hover:bg-black/30"}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: "rgba(244,190,68,0.95)",
                    boxShadow: "0 0 40px rgba(244,190,68,0.6)",
                  }}
                >
                  <Play size={32} fill="#000" style={{ color: "#000", marginLeft: 3 }} />
                </div>
              </div>
            </button>
          )}
        </div>

        <div className="mt-3" style={{  }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "#F4BE44" }}>
              {doc.category}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{doc.speaker}</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-wide mb-1.5"
            style={{
              color: "#F4BE44",
              letterSpacing: "0.02em",
            }}
            data-testid="text-cinema-title"
          >
            {doc.title}
          </h2>
          <p
            className="text-zinc-300 text-base md:text-lg leading-relaxed max-w-3xl"
            style={{  }}
            data-testid="text-cinema-desc"
          >
            {doc.description}
          </p>

          {showReading && doc.reading && (
            <div
              className="mt-6 pt-6 border-t animate-in fade-in slide-in-from-bottom-2 duration-700"
              style={{ borderColor: "rgba(244,190,68,0.3)" }}
              data-testid="panel-related-reading"
            >
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} style={{ color: "#F4BE44" }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "#F4BE44" }}>
                  {t("docs.related")}
                </span>
              </div>
              <a
                href={doc.reading.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-base text-zinc-200 hover:text-white transition-colors group"
                data-testid="link-related-reading"
              >
                <span className="border-b border-dotted border-zinc-500 group-hover:border-white">{doc.reading.label}</span>
                <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
