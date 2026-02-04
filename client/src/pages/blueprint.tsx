import { Link } from "wouter";

export default function Blueprint() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 opacity-[0.14] [background-image:radial-gradient(900px_500px_at_20%_0%,rgba(34,211,238,.22),transparent),radial-gradient(900px_500px_at_80%_10%,rgba(245,158,11,.16),transparent)]" />
      
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <Link href="/" data-testid="link-blueprint-back">
          <span className="text-[15px] tracking-[0.18em]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            AFRO<span className="text-[#22D3EE] mx-[7px]">•</span>KAVIAR
          </span>
        </Link>
        
        <h1 className="font-display text-4xl tracking-[-0.02em] text-[#22D3EE] mt-8 mb-4" data-testid="text-blueprint-title">
          The Afrokaviar Blueprint
        </h1>
        <p className="text-white/60 text-lg mb-12">
          A Cultural Operating System for the African Diaspora
        </p>

        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="text-[#22D3EE]">01</span> Radio & TV
            </h2>
            <p className="text-white/70 leading-relaxed text-lg">
              Where culture lives and breathes. Stream 70+ African channels connecting you to the heartbeat of the continent—news, entertainment, music, and stories from home. This is your window to Africa, always on, always connected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="text-[#22D3EE]">02</span> Live Events
            </h2>
            <p className="text-white/70 leading-relaxed text-lg">
              Where the diaspora gathers. Experience concerts, festivals, and cultural moments in real-time with your community. These aren't just events—they're digital homecomings where distance disappears and culture comes alive together.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="text-[#22D3EE]">03</span> Social
            </h2>
            <p className="text-white/70 leading-relaxed text-lg">
              Where artists get heard. Upload your sound, share your vision, connect with the community. This is the expression layer—fast, informal, creative. Every track you share is a seed. The best ones grow into something bigger.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="text-[#22D3EE]">04</span> Music
            </h2>
            <p className="text-white/70 leading-relaxed text-lg">
              Where value is created. The official catalogue—curated, quality-assured, ready for the world. When we add your track to Music, we're saying: <em className="text-[#22D3EE]">"We vouch for this."</em> This is where artists thrive and culture gains institutional legitimacy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="text-[#22D3EE]">05</span> My Library
            </h2>
            <p className="text-white/70 leading-relaxed text-lg">
              Where culture is preserved. Your purchases, your uploads, your personal archive—forever yours. This is the ownership layer. No expiration, no re-payment, just permanence. Because your collection is your legacy.
            </p>
          </section>

          <section className="border-t border-white/10 pt-12">
            <h2 className="text-2xl font-semibold text-white mb-4">The Flow</h2>
            <div className="flex flex-wrap items-center gap-4 text-lg">
              <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80">Social</span>
              <span className="text-[#22D3EE]">→</span>
              <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80">Music</span>
              <span className="text-[#22D3EE]">→</span>
              <span className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80">My Library</span>
            </div>
            <p className="text-white/60 mt-6 leading-relaxed">
              Expression becomes curation. Curation becomes ownership. Each step adds legitimacy, value, and control. This is how culture moves forward—intentionally, together.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <Link href="/explore">
            <button className="px-8 py-3 bg-[#22D3EE] text-black font-semibold rounded-lg hover:bg-[#22D3EE]/90 transition-colors" data-testid="button-explore-platform">
              Explore the Platform
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
