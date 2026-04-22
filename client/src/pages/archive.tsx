import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Search, X } from "lucide-react";
import {
  CinemaModal,
  FALLBACK_DOCS,
  READING_BY_POSITION,
  fetchDocs,
  type Documentary,
} from "@/lib/documentaries";

const ALL = "All";
const CACHE_KEY = "afrokaviar-archive-cache-v1";

function loadCachedDocs(): Documentary[] | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Documentary[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export default function Archive() {
  const [openDoc, setOpenDoc] = useState<Documentary | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const { data: docsData, isLoading, isError } = useQuery<Documentary[]>({
    queryKey: ["documentaries-csv"],
    queryFn: fetchDocs,
    retry: 1,
    staleTime: 1000 * 30,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    initialData: loadCachedDocs,
  });

  useEffect(() => {
    if (docsData && docsData.length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(docsData));
      } catch {}
    }
  }, [docsData]);

  const docs = useMemo(() => {
    const source = docsData && docsData.length > 0 ? docsData : FALLBACK_DOCS;
    return source.map((d, i) => ({
      ...d,
      reading: d.reading ?? READING_BY_POSITION[i % READING_BY_POSITION.length],
    }));
  }, [docsData]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    docs.forEach((d) => { if (d.category) set.add(d.category); });
    return [ALL, ...Array.from(set).sort()];
  }, [docs]);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => {
      if (activeCategory !== ALL && d.category !== activeCategory) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.speaker.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    });
  }, [docs, activeCategory, query]);

  const usingCachedFallback = !isOnline || (isError && !docsData);
  const usingFallbackDocs = !docsData || docsData.length === 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-accent/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <header className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-10">
        <Link href="/" data-testid="link-back-home">
          <button
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] hover:opacity-80 transition-opacity"
            style={{ color: "#F4BE44" }}
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back to Home
          </button>
        </Link>
      </header>

      <main className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pt-12 pb-32">
        <section data-testid="section-archive">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8" style={{ backgroundColor: "#F4BE44" }} />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.4em]"
                style={{ color: "#F4BE44" }}
                data-testid="text-archive-eyebrow"
              >
                The Intellectual Archive
              </span>
              <span className="h-px w-8" style={{ backgroundColor: "#F4BE44" }} />
            </div>
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
              style={{  }}
              data-testid="text-archive-heading"
            >
              Full Documentary Archive
            </h1>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              Every film in the collection — curated, contextualised, archived.
            </p>
          </div>

          {(usingCachedFallback || usingFallbackDocs) && (
            <div
              className="max-w-xl mx-auto mb-8 px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{
                color: "#F4BE44",
                border: "1px solid rgba(244,190,68,0.35)",
                backgroundColor: "rgba(244,190,68,0.06)",
              }}
              data-testid="banner-offline"
            >
              {!isOnline
                ? "Offline mode — showing cached archive"
                : "Live archive unavailable — showing cached collection"}
            </div>
          )}

          <div className="max-w-xl mx-auto mb-6 relative">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#F4BE44" }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, speaker, or topic…"
              data-testid="input-archive-search"
              className="w-full pl-11 pr-10 py-3 text-sm bg-transparent border outline-none transition-colors placeholder:text-zinc-600 focus:border-[#F4BE44]"
              style={{
                borderColor: "rgba(244,190,68,0.3)",
                color: "#fff",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                data-testid="button-clear-search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div
            className="flex flex-wrap justify-center gap-2 mb-6"
            data-testid="filter-categories"
          >
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] border transition-all duration-300"
                  style={{
                    color: isActive ? "#000" : "#F4BE44",
                    borderColor: "#F4BE44",
                    backgroundColor: isActive ? "#F4BE44" : "transparent",
                  }}
                  data-testid={`chip-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div
            className="text-center text-[11px] uppercase tracking-[0.25em] text-zinc-600 mb-8"
            data-testid="text-archive-count"
          >
            {filteredDocs.length} {filteredDocs.length === 1 ? "film" : "films"}
            {query && ` matching “${query}”`}
          </div>

          {isLoading && !docsData ? (
            <div className="text-center text-zinc-500 text-sm" data-testid="text-archive-loading">
              Loading archive…
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center text-zinc-500 text-sm" data-testid="text-archive-empty">
              {query
                ? `No films match “${query}”.`
                : "No documentaries in this category yet."}
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px] mx-auto"
              data-testid="grid-archive"
            >
              {filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setOpenDoc(doc)}
                  className="group relative text-left p-6 border bg-[rgba(244,190,68,0.02)] hover:bg-[rgba(244,190,68,0.06)] transition-all duration-500 flex flex-col"
                  style={{ borderColor: "rgba(244,190,68,0.25)", minHeight: "260px" }}
                  data-testid={`card-archive-${doc.id}`}
                >
                  <div className="relative w-full mb-4 overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                    <img
                      src={`https://i.ytimg.com/vi/${doc.youtubeId}/hqdefault.jpg`}
                      alt={doc.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                      loading="lazy"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ boxShadow: "inset 0 0 0 1px rgba(244,190,68,0.4)" }}
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.3em]"
                      style={{ color: "#F4BE44" }}
                      data-testid={`text-archive-category-${doc.id}`}
                    >
                      {doc.category}
                    </span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                      {doc.speaker}
                    </span>
                  </div>

                  <h3
                    className="text-lg md:text-xl font-bold mb-2 tracking-tight"
                    style={{  }}
                    data-testid={`text-archive-title-${doc.id}`}
                  >
                    {doc.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                    {doc.description}
                  </p>

                  <span
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] mt-auto"
                    style={{ color: "#F4BE44" }}
                  >
                    <Play size={11} strokeWidth={2.5} />
                    Watch Preview
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {openDoc && <CinemaModal doc={openDoc} onClose={() => setOpenDoc(null)} />}
    </div>
  );
}
