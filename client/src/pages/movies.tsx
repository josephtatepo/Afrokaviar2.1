import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Play, Loader2 } from "lucide-react";

import {
  CinemaModal,
  FALLBACK_DOCS,
  fetchDocs,
  youtubeThumb,
  READING_BY_POSITION,
  type Documentary,
} from "@/lib/documentaries";

const GOLD = "#F4BE44";

function PrestigeFallback({
  title,
  description,
  category,
  transparent = false,
}: {
  title: string;
  description: string;
  category?: string;
  transparent?: boolean;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col justify-end overflow-hidden z-[3]"
      style={{
        background: transparent
          ? "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)"
          : "linear-gradient(135deg, #0a0a0a 0%, #1a1410 55%, rgba(244,190,68,0.18) 100%)",
        padding: "20px",
      }}
    >
      {!transparent && <div className="fallback-pattern absolute inset-0 pointer-events-none" />}
      <div className="relative z-[3]">
        <h3
          className="font-black tracking-tight leading-tight mb-2"
          style={{ color: GOLD, fontSize: "1.05rem" }}
        >
          {title}
        </h3>
        <div
          className="mb-3"
          style={{ width: 32, height: 2, backgroundColor: GOLD }}
        />
        <p
          className="text-[11px] leading-snug"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {description.length > 100 ? `${description.slice(0, 100)}…` : description}
        </p>
        <div
          className="fallback-play-pulse mt-3"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "rgba(244,190,68,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: "drop-shadow(0 0 10px rgba(244,190,68,0.4))",
          }}
        >
          <Play size={12} fill={GOLD} style={{ color: GOLD }} />
        </div>
      </div>
    </div>
  );
}

function FilmCard({ film, onOpen }: { film: Documentary; onOpen: (f: Documentary) => void }) {
  const [thumbMissing, setThumbMissing] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  return (
    <button
      onClick={() => onOpen(film)}
      className="group text-left transition-transform duration-500 hover:scale-[1.04] focus:outline-none"
      data-testid={`card-film-${film.id}`}
    >
      <div
        className="relative w-full overflow-hidden rounded-sm"
        style={{
          aspectRatio: "2 / 3",
          backgroundColor: thumbMissing ? "#1f1d18" : "#0a0a0a",
          border: thumbMissing ? `1px solid ${GOLD}33` : "1px solid #3f3f46",
          transition: "border-color 0.4s ease, box-shadow 0.4s ease, background-color 0.4s ease",
        }}
      >
        <PrestigeFallback
          title={film.title}
          description={film.description}
          category={film.category}
          transparent={thumbLoaded}
        />
        <img
          src={youtubeThumb(film.youtubeId)}
          alt={film.title}
          loading="lazy"
          onLoad={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.naturalHeight < 120) {
              img.style.display = "none";
              setThumbMissing(true);
            } else {
              setThumbLoaded(true);
            }
          }}
          onError={() => setThumbMissing(true)}
          className="absolute inset-0 h-full w-full object-cover z-[1]"
          style={{ transition: "transform 0.6s ease, filter 0.4s ease" }}
        />
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        <div
          className="absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.95) 100%)",
          }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", border: `1px solid ${GOLD}` }}
          >
            <Play size={20} style={{ color: GOLD }} fill={GOLD} />
          </div>
        </div>
        <div
          className="absolute inset-0 rounded-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: `0 0 30px rgba(244,190,68,0.45), inset 0 0 0 1px ${GOLD}` }}
        />
      </div>
      <div className="mt-3 px-0.5">
        <div
          className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {film.category}
        </div>
        <div className="text-xs text-zinc-500" data-testid={`text-film-speaker-${film.id}`}>{film.speaker}</div>
      </div>
    </button>
  );
}

export function MoviesContent({ searchQuery = "" }: { searchQuery?: string }) {
  const [openFilm, setOpenFilm] = useState<Documentary | null>(null);

  const { data, isLoading } = useQuery<Documentary[]>({
    queryKey: ["documentaries-csv"],
    queryFn: fetchDocs,
    retry: 1,
    staleTime: 1000 * 30,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const films = useMemo<Documentary[]>(() => {
    const list = data && data.length >= 3 ? data : FALLBACK_DOCS;
    return list.map((d, i) => ({
      ...d,
      reading: d.reading ?? READING_BY_POSITION[i],
    }));
  }, [data]);

  const q = searchQuery.trim().toLowerCase();
  const filteredFilms = useMemo(() => {
    if (!q) return films;
    return films.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.speaker.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q),
    );
  }, [films, q]);

  const features = filteredFilms.filter((f) => f.type === "Feature");
  const documentaries = filteredFilms.filter((f) => f.type !== "Feature");

  const hero = !q
    ? films.find((f) => f.title.toLowerCase().includes("i am not your negro")) ||
      films.filter((f) => f.type === "Feature")[0] ||
      films.filter((f) => f.type !== "Feature")[0] ||
      films[0]
    : null;

  return (
    <div className="text-white" data-testid="page-movies">
      <div className="mb-8 md:mb-10">
        <div
          className="text-[10px] font-bold uppercase tracking-[0.4em] mb-3"
          style={{ color: GOLD }}
        >
          Private Screening Room
        </div>
        <h1
          className="font-black tracking-tighter leading-none"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            color: "#fff",
          }}
          data-testid="text-movies-title"
        >
          MOVIES<span style={{ color: GOLD }}>+</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
          A curated library of cinema and documentary that shapes the diaspora's intellectual and visual canon.
        </p>
      </div>

      {hero && (
        <button
          onClick={() => setOpenFilm(hero)}
          className="group relative block w-full overflow-hidden rounded-lg mb-12 text-left"
          style={{
            border: "1px solid rgba(244,190,68,0.2)",
            minHeight: "50vh",
            background:
              "radial-gradient(ellipse at 70% 30%, rgba(244,190,68,0.18) 0%, rgba(0,0,0,1) 60%), linear-gradient(135deg, #1a1410 0%, #000 100%)",
          }}
          data-testid="button-featured-film"
        >
          <div className="fallback-pattern absolute inset-0 pointer-events-none" />
          <img
            src={`https://i.ytimg.com/vi/${hero.youtubeId}/maxresdefault.jpg`}
            onLoad={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.naturalHeight >= 120) return;
              if (img.src.includes("maxresdefault")) {
                img.src = `https://i.ytimg.com/vi/${hero.youtubeId}/sddefault.jpg`;
              } else if (img.src.includes("sddefault")) {
                img.src = `https://i.ytimg.com/vi/${hero.youtubeId}/hqdefault.jpg`;
              } else if (img.src.includes("hqdefault")) {
                img.src = `https://i.ytimg.com/vi/${hero.youtubeId}/mqdefault.jpg`;
              }
            }}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src.includes("maxresdefault")) {
                img.src = `https://i.ytimg.com/vi/${hero.youtubeId}/sddefault.jpg`;
              } else if (img.src.includes("sddefault")) {
                img.src = `https://i.ytimg.com/vi/${hero.youtubeId}/hqdefault.jpg`;
              } else if (img.src.includes("hqdefault")) {
                img.src = `https://i.ytimg.com/vi/${hero.youtubeId}/mqdefault.jpg`;
              } else {
                img.style.display = "none";
              }
            }}
            alt={hero.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ filter: "brightness(0.85) saturate(1.05)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.1) 100%)",
            }}
          />
          <div className="relative flex items-center min-h-[50vh] px-8 md:px-14 py-10 max-w-3xl">
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.4em] mb-3"
                style={{ color: GOLD }}
              >
                Featured · {hero.category}
              </div>
              <h2
                className="font-black tracking-tighter mb-4"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  color: "#fff",
                  lineHeight: 1.05,
                }}
                data-testid="text-featured-title"
              >
                {hero.title}
              </h2>
              <p className="text-zinc-300 text-base md:text-lg leading-relaxed mb-6 max-w-xl">
                {hero.description}
              </p>
              <div
                className="inline-flex items-center gap-3 px-6 py-3 rounded-sm transition-colors"
                style={{
                  backgroundColor: GOLD,
                  color: "#000",
                }}
              >
                <Play size={16} fill="#000" />
                <span className="text-xs font-bold uppercase tracking-[0.25em]">
                  Begin Screening
                </span>
              </div>
            </div>
          </div>
        </button>
      )}

      {isLoading && !data && (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {q && filteredFilms.length === 0 && (
        <div className="text-center text-zinc-500 text-sm py-16" data-testid="text-movies-empty">
          No films match “{searchQuery}”.
        </div>
      )}

      {documentaries.length > 0 && (
        <section className="mb-12" data-testid="section-documentaries">
          <div className="flex items-baseline justify-between mb-6">
            <h3
              className="text-2xl md:text-3xl font-black tracking-tighter"
              style={{ color: "#fff" }}
            >
              Documentaries
            </h3>
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              {documentaries.length} {documentaries.length === 1 ? "title" : "titles"}
            </span>
          </div>
          <div
            className="grid gap-x-6 gap-y-10"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
          >
            {documentaries.map((film) => (
              <FilmCard key={film.id} film={film} onOpen={setOpenFilm} />
            ))}
          </div>
        </section>
      )}

      {features.length > 0 && (
        <section className="mb-12" data-testid="section-features">
          <div className="flex items-baseline justify-between mb-6">
            <h3
              className="text-2xl md:text-3xl font-black tracking-tighter"
              style={{ color: "#fff" }}
            >
              Features
            </h3>
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              {features.length} {features.length === 1 ? "title" : "titles"}
            </span>
          </div>
          <div
            className="grid gap-x-6 gap-y-10"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
          >
            {features.map((film) => (
              <FilmCard key={film.id} film={film} onOpen={setOpenFilm} />
            ))}
          </div>
        </section>
      )}

      {openFilm && <CinemaModal doc={openFilm} onClose={() => setOpenFilm(null)} />}
    </div>
  );
}

export default function MoviesPage() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/explore", { replace: true });
  }, [navigate]);
  return null;
}
