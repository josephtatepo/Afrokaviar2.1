import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  MonitorPlay,
  Radio,
  Globe,
  Music2,
  Library,
  Search,
  ArrowUpRight,
  Sparkles,
  Loader2,
  Play,
  Pause,
  Music,
} from "lucide-react";

type FeaturedSong = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  audioUrl: string;
  genre: string | null;
  price: number;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("live");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isGeneratingAura, setIsGeneratingAura] = useState(false);
  const [auraDescription, setAuraDescription] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: featuredData } = useQuery<{ song?: FeaturedSong }>({
    queryKey: ["/api/featured/homepage_hero"],
    retry: false,
  });
  const featuredSong = featuredData?.song;

  const togglePlay = () => {
    if (!audioRef.current || !featuredSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const generateRadioAura = async () => {
    setIsGeneratingAura(true);
    try {
      const response = await fetch("/api/oracle/aura", { method: "POST" });
      const data = await response.json();
      setAuraDescription(data.aura || "The oracle is recalibrating the diaspora frequency.");
    } catch (err) {
      setAuraDescription("The oracle is recalibrating the diaspora frequency.");
    } finally {
      setIsGeneratingAura(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#F4BE44]/30 overflow-x-hidden">
      
      {/* BACKGROUND ELEMENTS: Grid & Bokeh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[40%] bg-[#F4BE44]/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "py-4 bg-black/80 backdrop-blur-2xl border-b border-white/5" : "py-8"}`}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" data-testid="link-brand">
            <span className="text-[15px] tracking-[0.18em]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>AFRO<span className="text-[#22D3EE] mx-[7px]">•</span>KAVIAR</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/explore" data-testid="link-enter">
              <button className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5" data-testid="button-enter">
                Explore
              </button>
            </Link>
            <Link href="/auth" data-testid="link-join">
              <button className="px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-all flex items-center space-x-2" data-testid="button-join">
                <span>Join Afrokaviar</span>
                <ArrowUpRight size={12} strokeWidth={3} />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative pt-48 pb-20 px-6 md:px-10 z-10 max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          {/* Left side - Hero text */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center space-x-3 bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5" data-testid="badge-hero">
              <Sparkles size={12} className="text-[#F4BE44]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Watch • Listen • Attend</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] max-w-3xl" data-testid="text-hero-title">
              A premium Afro-<span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-zinc-600">lounge</span><br />for radio, TV, and drops.
            </h1>

            <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-xl leading-relaxed" data-testid="text-hero-subtitle">
              Afrokaviar is your culture operating system — a sleek, dark-mode-first streaming experience built for the diaspora.
            </p>
          </div>

          {/* Right side - Featured Song */}
          <div className="w-full lg:w-auto lg:min-w-[320px] lg:mt-12">
            <div className="group bg-gradient-to-br from-[#0d0d0f]/80 to-[#1a1a1f]/60 backdrop-blur-xl border border-[#F4BE44]/20 rounded-[2rem] p-6 hover:border-[#F4BE44]/40 transition-all relative overflow-hidden" data-testid="card-featured-song">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F4BE44]/10 to-transparent rounded-full blur-2xl" />
              <div className="relative z-10">
                <span className="text-[10px] font-black text-[#F4BE44] uppercase tracking-widest mb-3 block flex items-center gap-2">
                  <Music className="h-3 w-3" />
                  Featured Song
                </span>
                
                <div className="flex items-center gap-4 mb-4">
                  {featuredSong?.artworkUrl ? (
                    <button
                      onClick={togglePlay}
                      className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 group-hover:scale-105 transition-transform relative shrink-0 cursor-pointer"
                      data-testid="button-featured-play"
                    >
                      <img src={featuredSong.artworkUrl} alt={featuredSong.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPlaying ? <Pause className="h-5 w-5 text-white fill-white" /> : <Play className="h-5 w-5 text-white fill-white" />}
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={togglePlay}
                      className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#22D3EE]/20 to-[#F4BE44]/20 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform shrink-0 cursor-pointer"
                      data-testid="button-featured-play"
                    >
                      {isPlaying ? <Pause className="h-6 w-6 text-white fill-white" /> : <Play className="h-6 w-6 text-white fill-white" />}
                    </button>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-white" data-testid="text-featured-song-title">
                      {featuredSong?.title || "Coming Soon"}
                    </h4>
                    <p className="text-sm text-zinc-400" data-testid="text-featured-song-artist">
                      {featuredSong?.artist || "Stay tuned"}
                    </p>
                    {featuredSong?.genre && (
                      <p className="text-xs text-zinc-500 mt-0.5">{featuredSong.genre}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {featuredSong ? (
                    <>
                      <button
                        onClick={togglePlay}
                        className="bg-[#F4BE44] text-black px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
                        data-testid="button-featured-listen"
                      >
                        {isPlaying ? "Pause" : "Listen Now"}
                      </button>
                      <span className="text-xs text-zinc-500">${(featuredSong.price / 100).toFixed(0)}</span>
                    </>
                  ) : (
                    <Link href="/explore" data-testid="link-featured-song">
                      <button className="bg-[#F4BE44] text-black px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">
                        Explore
                      </button>
                    </Link>
                  )}
                </div>

                {featuredSong && (
                  <audio
                    ref={audioRef}
                    src={featuredSong.audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onError={() => setIsPlaying(false)}
                    preload="none"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          
          {/* Card 1: Featured Drop */}
          <div className="group bg-[#0d0d0f]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 hover:border-[#F4BE44]/30 transition-all relative overflow-hidden" data-testid="card-featured-drop">
            <div className="relative z-10">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 block" data-testid="text-featured-label">Featured Drop</span>
              <h3 className="text-2xl font-black mb-2" data-testid="text-featured-title">Paid Song Drop</h3>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed" data-testid="text-featured-desc">Preview 60s. Buy for $1 and keep it forever.</p>
              
              <div className="flex items-center space-x-2">
                <button className="bg-[#F4BE44] text-black px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all" data-testid="button-featured-play">
                  Play Preview
                </button>
                <button className="bg-white/5 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest border border-white/10 hover:bg-white/10 transition-all" data-testid="button-featured-buy">
                  Buy $1
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Continue */}
          <div className="group bg-[#0d0d0f]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 hover:border-zinc-700 transition-all" data-testid="card-continue">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 block" data-testid="text-continue-label">Continue</span>
            <h3 className="text-2xl font-black mb-2" data-testid="text-continue-title">Where you left off</h3>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed" data-testid="text-continue-desc">Your saved & recently played drops — all in one row.</p>
            
            <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all" data-testid="button-continue">
              View for you
            </button>
          </div>

          {/* Card 3: Unified Discovery */}
          <div className="group bg-[#0d0d0f]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 hover:border-cyan-500/30 transition-all relative overflow-hidden" data-testid="card-discovery">
            <div className="relative z-10">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 block" data-testid="text-discovery-label">Unified Discovery</span>
              <h3 className="text-2xl font-black mb-2" data-testid="text-discovery-title">One search. All verticals.</h3>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed" data-testid="text-discovery-desc">Search Radio, TV, Music, Social, and Library.</p>
              
              <Link href="/explore" data-testid="link-discovery">
                <button className="w-full py-3 bg-cyan-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/10" data-testid="button-discovery">
                  Open Explore
                </button>
              </Link>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Search size={160} />
            </div>
          </div>

        </div>

        {/* AI ORACLE SNIPPET */}
        <div className="mt-12 flex items-center justify-center">
          <div className="bg-[#0d0d0f]/40 border border-white/5 rounded-2xl px-6 py-4 flex items-center space-x-6 max-w-2xl w-full">
            <button 
              onClick={generateRadioAura}
              className="shrink-0 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#F4BE44] hover:bg-white/10 transition-all group"
              data-testid="button-oracle"
            >
              {isGeneratingAura ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="group-hover:scale-110 transition-transform" />}
            </button>
            <div className="flex-1">
              <div className="text-[9px] font-black text-[#F4BE44] uppercase tracking-widest mb-1">✨ Oracle Aura Decoder</div>
              <p className="text-xs text-zinc-500 italic font-medium" data-testid="text-oracle-aura">
                {auraDescription || "Tap the oracle to decode the current cultural frequency."}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER NAVIGATION PILL */}
      <footer className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-[720px] px-6">
        <div className="bg-[#0d0d0f]/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex items-center justify-between">
          {[
            { id: "radio", label: "Radio & TV", icon: MonitorPlay },
            { id: "live", label: "Live", icon: Radio },
            { id: "social", label: "Social", icon: Globe },
            { id: "music", label: "Music", icon: Music2 },
            { id: "library", label: "Library", icon: Library },
          ].map((item) => (
            <Link key={item.id} href="/explore" data-testid={`nav-${item.id}`}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-3 px-4 sm:px-6 py-3.5 rounded-full transition-all duration-300 relative group
                  ${activeTab === item.id ? "bg-[#F4BE44]/10" : "hover:bg-white/5"}
                `}
              >
                <item.icon size={18} className={activeTab === item.id ? "text-[#F4BE44]" : "text-zinc-500 group-hover:text-zinc-300"} />
                <span className={`text-[10px] font-black uppercase tracking-widest hidden lg:block
                  ${activeTab === item.id ? "text-white" : "text-zinc-500"}
                `}>
                  {item.label}
                </span>
                {activeTab === item.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#F4BE44] rounded-full shadow-[0_0_10px_#F4BE44]" />
                )}
              </button>
            </Link>
          ))}
        </div>
      </footer>

      {/* LEGAL & CREDITS */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 pb-32 pt-20 flex flex-col md:flex-row items-center justify-between text-[10px] font-black text-zinc-700 uppercase tracking-widest" data-testid="text-footer">
        <p>Dark mode by default. Neon Afro-tech highlights. Micro-interactions everywhere.</p>
        <div className="flex space-x-8 mt-4 md:mt-0">
          <Link href="/blueprint" className="text-[#22D3EE] hover:text-[#22D3EE]/80 transition-colors" data-testid="link-footer-blueprint">
            AFROKAVIAR BLUEPRINT
          </Link>
          <Link href="/privacy-policy" className="hover:text-zinc-400 transition-colors" data-testid="link-footer-privacy">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-zinc-400 transition-colors" data-testid="link-footer-terms">
            TERMS OF SERVICE
          </Link>
        </div>
      </div>

    </div>
  );
}
