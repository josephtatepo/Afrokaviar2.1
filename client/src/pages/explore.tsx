import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  CirclePlay,
  Clock,
  Globe,
  Headphones,
  Heart,
  Library,
  MonitorPlay,
  MoreHorizontal,
  Music,
  Music2,
  PictureInPicture2,
  Play,
  Plus,
  Radio as RadioIcon,
  RotateCcw,
  Search,
  Shield,
  Signal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Tv,
  Upload,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

type TvChannel = {
  id: string;
  name: string;
  country: string;
  channelGroup: string;
  iptvUrl: string;
  isOnline?: boolean;
  lastChecked?: string;
};

type Song = {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  genre?: string | null;
  artworkUrl?: string | null;
  audioUrl: string;
  duration?: number | null;  // seconds
  price: number;  // cents
  uploadedBy: string;
  createdAt: string;  // ISO date
  updatedAt: string;  // ISO date
};

type SocialTrack = {
  id: string;
  title: string;
  audioUrl: string;
  artworkUrl?: string | null;
  duration?: number | null;
  uploadedBy: string;
  uploaderHandle?: string;
  approved: boolean;
  status: string;
  featuredInCatalogue?: string | null;
  createdAt: string;
  updatedAt: string;
};

type LibraryItem = {
  id: string;
  title: string;
  artist?: string;
  kind: "upload" | "purchase" | "free";
};

const ADMIN_ROOT_EMAIL = "josephtatepo@gmail.com";

function formatAge(ts: number) {
  const delta = Date.now() - ts;
  const hours = Math.floor(delta / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isNew(createdAt: string) {
  const delta = Date.now() - new Date(createdAt).getTime();
  return delta < 48 * 60 * 60 * 1000;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function fetchCsvText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch CSV (${res.status})`);
  return await res.text();
}

function parseCsv(text: string): string[][] {
  // Minimal CSV parser (handles quotes). Good enough for Sheets export.
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        const next = text[i + 1];
        if (next === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }

    if (c === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (c === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += c;
  }

  row.push(cell.replace(/\r$/, ""));
  rows.push(row);

  return rows.filter((r) => r.some((v) => (v ?? "").trim().length));
}

function normalize(s: string) {
  return (s ?? "").trim();
}

function slugId(seed: string) {
  return seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function pickHeaderIndex(headers: string[], names: string[]) {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const n of names) {
    const idx = lower.indexOf(n.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

// Default TV channels - from user's XLSX file
const DEFAULT_TV_CHANNELS: TvChannel[] = [
  { id: "ch-1", name: "Addis TV", country: "Ethiopia", channelGroup: "General", iptvUrl: "https://rrsatrtmp.tulix.tv/addis1/addis1multi.smil/playlist.m3u8" },
  { id: "ch-2", name: "Adinkra TV", country: "Ghana", channelGroup: "Music", iptvUrl: "https://59d39900ebfb8.streamlock.net/adinkratvny/adinkratvny/playlist.m3u8" },
  { id: "ch-3", name: "ADO TV", country: "Nigeria", channelGroup: "Kids", iptvUrl: "https://strhls.streamakaci.tv/ortb/ortb2-multi/playlist.m3u8" },
  { id: "ch-4", name: "Africa 24 English", country: "Pan-African", channelGroup: "News", iptvUrl: "https://edge17.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8" },
  { id: "ch-5", name: "Afrokiddos", country: "Pan-African", channelGroup: "Kids", iptvUrl: "https://weyyak-live.akamaized.net/weyyak_afrokiddos/index.m3u8" },
  { id: "ch-6", name: "AfroSport Nigeria", country: "Nigeria", channelGroup: "Sports", iptvUrl: "https://newproxy3.vidivu.tv/vidivu_afrosport/index.m3u8" },
  { id: "ch-7", name: "Alpha Digital", country: "Uganda", channelGroup: "Religious", iptvUrl: "https://streamfi-alphatvdgtl1.zettawiseroutes.com:8181/hls/stream.m3u8" },
  { id: "ch-8", name: "Amani TV", country: "Tanzania", channelGroup: "Culture", iptvUrl: "https://goccn.cloud/hls/amanitv/index.m3u8" },
  { id: "ch-9", name: "B+ TV", country: "Rwanda", channelGroup: "Entertainment", iptvUrl: "https://tv.btnrwanda.com:3432/live/bpluslive.m3u8" },
  { id: "ch-10", name: "BTV", country: "Botswana", channelGroup: "Entertainment", iptvUrl: "https://streamfi-alphadgtl1.zettawiseroutes.com:8181/hls/stream.m3u8" },
  { id: "ch-11", name: "Bukedde TV 1", country: "Uganda", channelGroup: "General", iptvUrl: "https://stream.hydeinnovations.com/bukedde1flussonic/index.m3u8" },
  { id: "ch-12", name: "Business 24 Africa", country: "Pan-African", channelGroup: "Business", iptvUrl: "https://cdn-globecast.akamaized.net/live/eds/business24_tv/hls_video/index.m3u8" },
  { id: "ch-13", name: "Canal 3 Bénin", country: "Benin", channelGroup: "General", iptvUrl: "https://live.creacast.com/bluediamond/stream/playlist.m3u8" },
  { id: "ch-14", name: "Cape Town TV", country: "South Africa", channelGroup: "General", iptvUrl: "https://cdn.freevisiontv.co.za/sttv/smil:ctv.stream.smil/playlist.m3u8" },
  { id: "ch-15", name: "CBC TV", country: "Kenya", channelGroup: "General", iptvUrl: "https://stream.berosat.live:19360/cbc-tv/cbc-tv.m3u8" },
  { id: "ch-16", name: "CEN Télévision", country: "Senegal", channelGroup: "General", iptvUrl: "https://strhlslb01.streamakaci.tv/cen/cen-multi/playlist.m3u8" },
  { id: "ch-17", name: "Chabiba TV", country: "Algeria", channelGroup: "Religious", iptvUrl: "https://endour.net/hls/RUgLAPCbPdF5oPSTX2Hvl/index.m3u8" },
  { id: "ch-18", name: "Citizen Extra", country: "Kenya", channelGroup: "General", iptvUrl: "https://74937.global.ssl.fastly.net/5ea49827ff3b5d7b22708777/live_40c5808063f711ec89a87b62db2ecab5/index.m3u8" },
  { id: "ch-19", name: "CTV Afrique", country: "Ivory Coast", channelGroup: "General", iptvUrl: "https://stream.it-innov.com/ctv/index.m3u8" },
  { id: "ch-20", name: "Dabanga TV", country: "Sudan", channelGroup: "News", iptvUrl: "https://hls.dabangasudan.org/hls/stream.m3u8" },
  { id: "ch-21", name: "Dodoma TV", country: "Tanzania", channelGroup: "General", iptvUrl: "https://goliveafrica.media:9998/live/625965017ed69/index.m3u8" },
  { id: "ch-22", name: "Dream TV", country: "Kenya", channelGroup: "Religious", iptvUrl: "https://streamfi-dreamtv1.zettawiseroutes.com:8181/hls/stream.m3u8" },
  { id: "ch-23", name: "EVI TV", country: "Ghana", channelGroup: "Entertainment", iptvUrl: "https://stream.berosat.live:19360/evi-tv/evi-tv.m3u8" },
  { id: "ch-24", name: "Faculty TV", country: "Kenya", channelGroup: "Education", iptvUrl: "https://stream-server9-jupiter.muxlive.com/hls/facultytv/index.m3u8" },
  { id: "ch-25", name: "Fresh", country: "Nigeria", channelGroup: "Entertainment", iptvUrl: "https://origin3.afxp.telemedia.co.za/PremiumFree/freshtv/playlist.m3u8" },
  { id: "ch-26", name: "Galaxy TV", country: "Nigeria", channelGroup: "News", iptvUrl: "https://5d846bfda90fc.streamlock.net:1935/live/galaxytv/playlist.m3u8" },
  { id: "ch-27", name: "Géopolis TV", country: "DR. Congo", channelGroup: "News", iptvUrl: "https://tnt-television.com/Geopolis_tv/index.m3u8" },
  { id: "ch-28", name: "Glory Christ Channel", country: "Nigeria", channelGroup: "Religious", iptvUrl: "https://stream.it-innov.com/gcc/index.m3u8" },
  { id: "ch-29", name: "His Grace TV", country: "Nigeria", channelGroup: "Religious", iptvUrl: "https://goliveafrica.media:9998/live/6593c35f9c090/index.m3u8" },
  { id: "ch-30", name: "Huda TV", country: "Egypt", channelGroup: "Religious", iptvUrl: "https://cdn.bestream.io:19360/elfaro1/elfaro1.m3u8" },
  { id: "ch-31", name: "Islam TV Sénégal", country: "Senegal", channelGroup: "Religious", iptvUrl: "https://tv.imediasn.com/hls/live.m3u8" },
  { id: "ch-32", name: "Kaback TV", country: "Senegal", channelGroup: "General", iptvUrl: "https://guineetvdirect.online:3842/live/kabacktvlive.m3u8" },
  { id: "ch-33", name: "KK TV Angola", country: "Angola", channelGroup: "Religious", iptvUrl: "https://w1.manasat.com/ktv-angola/smil:ktv-angola.smil/playlist.m3u8" },
  { id: "ch-34", name: "LBFD RTV", country: "Liberia", channelGroup: "Religious", iptvUrl: "https://tnt-television.com/LBFD_RTV/index.m3u8" },
  { id: "ch-35", name: "Libya Al Wataniya", country: "Libya", channelGroup: "General", iptvUrl: "https://cdn-globecast.akamaized.net/live/eds/libya_al_watanya/hls_roku/index.m3u8" },
  { id: "ch-36", name: "Life TV", country: "Ivory Coast", channelGroup: "General", iptvUrl: "https://strhls.streamakaci.tv/str_lifetv_lifetv/str_lifetv_multi/playlist.m3u8" },
  { id: "ch-37", name: "Louga TV", country: "Senegal", channelGroup: "General", iptvUrl: "https://stream.sen-gt.com/Mbacke/myStream/playlist.m3u8" },
  { id: "ch-38", name: "Medi 1 TV Afrique", country: "Morocco", channelGroup: "News", iptvUrl: "https://streaming1.medi1tv.com/live/smil:medi1fr.smil/playlist.m3u8" },
  { id: "ch-39", name: "Metanoia TV", country: "Kenya", channelGroup: "Religious", iptvUrl: "https://tnt-television.com/METANOIA-STREAM1/index.m3u8" },
  { id: "ch-40", name: "Mishapi Voice TV", country: "DR. Congo", channelGroup: "Religious", iptvUrl: "https://tnt-television.com/MISHAPI-STREAM1/index.m3u8" },
  { id: "ch-41", name: "NTV", country: "Namibia", channelGroup: "Kids", iptvUrl: "https://s-pl-01.mediatool.tv/playout/ntv-abr/index.m3u8" },
  { id: "ch-42", name: "Numerica TV", country: "DR. Congo", channelGroup: "General", iptvUrl: "https://tnt-television.com/NUMERICA/index.m3u8" },
  { id: "ch-43", name: "NW Economie", country: "Cameroon", channelGroup: "Business", iptvUrl: "https://hls.newworldtv.com/nw-economie/video/live.m3u8" },
  { id: "ch-44", name: "NW Info 2 EN", country: "Cameroon", channelGroup: "News", iptvUrl: "https://hls.newworldtv.com/nw-info-2/video/live.m3u8" },
  { id: "ch-45", name: "NW Info FR", country: "Cameroon", channelGroup: "News", iptvUrl: "https://hls.newworldtv.com/nw-info/video/live.m3u8" },
  { id: "ch-46", name: "NW Magazine", country: "Cameroon", channelGroup: "Entertainment", iptvUrl: "https://hls.newworldtv.com/nw-magazine/video/live.m3u8" },
  { id: "ch-47", name: "ORTB TV", country: "Benin", channelGroup: "General", iptvUrl: "https://strhls.streamakaci.tv/ortb/ortb1-multi/playlist.m3u8" },
  { id: "ch-48", name: "Power TV", country: "Zambia", channelGroup: "Religious", iptvUrl: "https://stream.it-innov.com/powertv/index.fmp4.m3u8" },
  { id: "ch-49", name: "QTV Gambia", country: "Gambia", channelGroup: "General", iptvUrl: "https://player.qtv.gm/hls/live.stream.m3u8" },
  { id: "ch-50", name: "Qwest TV", country: "Pan-African", channelGroup: "Music", iptvUrl: "https://qwestjazz-rakuten.amagi.tv/hls/amagi_hls_data_rakutenAA-qwestjazz-rakuten/CDN/master.m3u8" },
  { id: "ch-51", name: "RT JVA", country: "Liberia", channelGroup: "Religious", iptvUrl: "https://cdn140m.panaccess.com/HLS/RTVJA/index.m3u8" },
  { id: "ch-52", name: "RTB", country: "Burkina Faso", channelGroup: "News", iptvUrl: "https://edge12.vedge.infomaniak.com/livecast/ik:rtblive1_8/manifest.m3u8" },
  { id: "ch-53", name: "RTNC", country: "DR. Congo", channelGroup: "General", iptvUrl: "https://tnt-television.com/rtnc_HD/index.m3u8" },
  { id: "ch-54", name: "SenJeunes TV", country: "Senegal", channelGroup: "General", iptvUrl: "https://stream.sen-gt.com/senjeunestv/myStream/playlist.m3u8" },
  { id: "ch-55", name: "SNTV Daljir", country: "Somalia", channelGroup: "General", iptvUrl: "https://ap02.iqplay.tv:8082/iqb8002/s2tve/playlist.m3u8" },
  { id: "ch-56", name: "SOS Docteur TV", country: "Ivory Coast", channelGroup: "Lifestyle", iptvUrl: "https://wmoy82n4y2a7-hls-live.5centscdn.com/sostv/live.stream/playlist.m3u8" },
  { id: "ch-57", name: "Soweto TV", country: "South Africa", channelGroup: "Family", iptvUrl: "https://cdn.freevisiontv.co.za/sttv/smil:soweto.stream.smil/playlist.m3u8" },
  { id: "ch-58", name: "Somali National TV", country: "Somalia", channelGroup: "General", iptvUrl: "https://ap02.iqplay.tv:8082/iqb8002/s4ne/playlist.m3u8" },
  { id: "ch-59", name: "Sudan TV", country: "Sudan", channelGroup: "General", iptvUrl: "https://tgn.bozztv.com/trn03/gin-sudantv/index.m3u8" },
  { id: "ch-60", name: "Superscreen TV", country: "Nigeria", channelGroup: "Family", iptvUrl: "https://video1.getstreamhosting.com:1936/8398/8398/playlist.m3u8" },
  { id: "ch-61", name: "Tele Tchad", country: "Chad", channelGroup: "General", iptvUrl: "https://strhlslb01.streamakaci.tv/str_tchad_tchad/str_tchad_multi/playlist.m3u8" },
  { id: "ch-62", name: "Tempo Afric TV", country: "Ivory Coast", channelGroup: "News", iptvUrl: "https://streamspace.live/hls/tempoafrictv/livestream.m3u8" },
  { id: "ch-63", name: "TR24", country: "Tanzania", channelGroup: "Entertainment", iptvUrl: "https://stream.it-innov.com/tr24/index.m3u8" },
  { id: "ch-64", name: "True African", country: "Nigeria", channelGroup: "Entertainment", iptvUrl: "https://origin3.afxp.telemedia.co.za/PremiumFree/trueafrican/playlist.m3u8" },
  { id: "ch-65", name: "TV BRICS Africa", country: "South Africa", channelGroup: "General", iptvUrl: "https://cdn.freevisiontv.co.za/sttv/smil:brics.stream.smil/playlist.m3u8" },
  { id: "ch-66", name: "TV Zimbo", country: "Zimbabwe", channelGroup: "General", iptvUrl: "https://sgn-cdn-video.vods2africa.com/Tv-Zimbo/index.fmp4.m3u8" },
  { id: "ch-67", name: "Wap TV", country: "Nigeria", channelGroup: "Entertainment", iptvUrl: "https://newproxy3.vidivu.tv/waptv/index.m3u8" },
  { id: "ch-68", name: "Wazobia Max TV Nigeria", country: "Nigeria", channelGroup: "Entertainment", iptvUrl: "https://wazobia.live:8333/channel/wmax.m3u8" },
  { id: "ch-69", name: "Yeglé TV", country: "Senegal", channelGroup: "Culture", iptvUrl: "https://endour.net/hls/Yegle-tv/index.m3u8" },
];

async function loadTvChannelsFromApi(): Promise<TvChannel[]> {
  try {
    const response = await fetch("/api/channels");
    if (!response.ok) {
      console.warn("Failed to fetch channels from API, using fallback");
      return DEFAULT_TV_CHANNELS.map(ch => ({ ...ch, isOnline: true }));
    }
    const data = await response.json();
    return data.map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      country: ch.country,
      channelGroup: ch.channelGroup,
      iptvUrl: ch.iptvUrl,
      isOnline: ch.isOnline ?? true,
      lastChecked: ch.lastChecked,
    }));
  } catch (error) {
    console.warn("Error fetching channels:", error);
    return DEFAULT_TV_CHANNELS.map(ch => ({ ...ch, isOnline: true }));
  }
}

function TabIcon({ name }: { name: string }) {
  const cls = "h-4 w-4";
  const musicCls = "h-[21px] w-[21px]";
  switch (name) {
    case "radio-tv":
      return <Signal className={cls} />;
    case "live":
      return <CirclePlay className={cls} />;
    case "music":
      return <Headphones className={musicCls} />;
    case "social":
      return <Sparkles className={cls} />;
    case "library":
      return <Library className={cls} />;
    default:
      return <Signal className={cls} />;
  }
}

export default function ExplorePage() {
  const [tab, setTab] = useState("radio-tv");
  const [query, setQuery] = useState("");
  const queryClient = useQueryClient();

  // Auth
  const { user, isAuthenticated } = useAuth();
  
  // Admin check based on root admin email
  const userEmail = user?.email ?? "member@afrokaviar.com";
  const isAdmin = userEmail === ADMIN_ROOT_EMAIL;
  const role = isAdmin ? "admin" : "member";

  // TV
  const [tvChannels, setTvChannels] = useState<TvChannel[]>([]);
  const [tvLoading, setTvLoading] = useState(false);
  const [tvError, setTvError] = useState<string | null>(null);
  const [tvCountry, setTvCountry] = useState<string>("all");
  const [tvGroup, setTvGroup] = useState<string>("all");
  const [playingChannelId, setPlayingChannelId] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Radio embed
  const [radioEmbedCode, setRadioEmbedCode] = useState<string>(
    "<iframe src=\"https://s93.radiolize.com/public/appsumo__g2ceqo_lcw1ry/embed?theme=dark\" frameborder=\"0\" allowtransparency=\"true\" style=\"width: 100%; min-height: 120px; border: 0;\"></iframe>",
  );

  // Music - Real API data
  const { data: songs = [], isLoading: songsLoading } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
    enabled: tab === "music",
  });

  const { data: favoritesData = [] } = useQuery<{ songId: string }[]>({
    queryKey: ["/api/me/favorites"],
    enabled: tab === "music" && isAuthenticated,
  });

  const favorites = useMemo(() => {
    return favoritesData.reduce((acc, fav) => {
      acc[fav.songId] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }, [favoritesData]);

  const [reactions, setReactions] = useState<Record<string, "up" | "down" | null>>({});
  const [musicFilter, setMusicFilter] = useState<string>("all");

  // User's own submissions with status
  type UserSubmission = {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    reviewedAt: string | null;
  };
  const { data: mySubmissions = [] } = useQuery<UserSubmission[]>({
    queryKey: ["/api/me/submissions"],
    enabled: (tab === "social" || tab === "music") && isAuthenticated,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ songId, isFavorited }: { songId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        await fetch(`/api/songs/${songId}/favorite`, {
          method: "DELETE",
          credentials: "include",
        });
      } else {
        await fetch(`/api/songs/${songId}/favorite`, {
          method: "POST",
          credentials: "include",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/favorites"] });
    },
  });

  const toggleReactionMutation = useMutation({
    mutationFn: async ({ songId, type, currentType }: { songId: string; type: "up" | "down"; currentType: "up" | "down" | null }) => {
      if (currentType === type) {
        await fetch(`/api/songs/${songId}/react`, {
          method: "DELETE",
          credentials: "include",
        });
      } else {
        await fetch(`/api/songs/${songId}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ type }),
        });
      }
    },
    onMutate: ({ songId, type, currentType }) => {
      setReactions((prev) => ({
        ...prev,
        [songId]: currentType === type ? null : type,
      }));
    },
  });

  const { data: entitlementsData = [] } = useQuery<{ songId: string; song?: { id: string; title: string; artist: string } }[]>({
    queryKey: ["/api/me/entitlements"],
    enabled: (tab === "music" || tab === "library") && isAuthenticated,
  });

  const ownedSongs = useMemo(() => {
    return entitlementsData.reduce((acc, ent) => {
      acc[ent.songId] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }, [entitlementsData]);

  const purchaseSongMutation = useMutation({
    mutationFn: async (songId: string) => {
      const res = await fetch("/api/checkout/song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ songId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create checkout");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch social tracks from API
  const { data: socialTracksData = [], refetch: refetchSocialTracks } = useQuery<SocialTrack[]>({
    queryKey: ["/api/social-tracks"],
    enabled: tab === "social",
  });
  const [socialSaved, setSocialSaved] = useState<Record<string, boolean>>({});

  // Fetch library uploads from API
  type ApiLibraryItem = {
    id: string;
    type: string;
    referenceId?: string | null;
    objectPath?: string | null;
    metadata?: { title?: string; artist?: string } | null;
    createdAt: string;
  };
  const { data: libraryUploadsData = [], refetch: refetchLibraryUploads } = useQuery<ApiLibraryItem[]>({
    queryKey: ["/api/me/library", { type: "upload" }],
    queryFn: async () => {
      const res = await fetch("/api/me/library?type=upload", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: tab === "library" && isAuthenticated,
  });

  const { data: libraryFreeData = [], refetch: refetchLibraryFree } = useQuery<ApiLibraryItem[]>({
    queryKey: ["/api/me/library", { type: "free" }],
    queryFn: async () => {
      const res = await fetch("/api/me/library?type=free", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: (tab === "library" || tab === "music") && isAuthenticated,
  });

  // Track which free songs are already in library
  const freeSongsInLibrary = useMemo(() => {
    return libraryFreeData.reduce((acc, item) => {
      if (item.type === "free" && item.referenceId) {
        acc[item.referenceId] = true;
      }
      return acc;
    }, {} as Record<string, boolean>);
  }, [libraryFreeData]);

  // Add free song to library mutation
  const addFreeSongMutation = useMutation({
    mutationFn: async (song: { id: string; title: string; artist: string }) => {
      const res = await fetch("/api/me/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "free",
          referenceId: song.id,
          metadata: { title: song.title, artist: song.artist },
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add to library");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Added to library!", description: "This free song is now in your library." });
      refetchLibraryFree();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Subscription status check
  const { data: subscriptionData } = useQuery<{ subscription: { status: string } | null }>({
    queryKey: ["/api/me/subscription"],
    enabled: tab === "library" && isAuthenticated,
  });
  const hasActiveSubscription = subscriptionData?.subscription?.status === "active";
  const canUploadToLibrary = hasActiveSubscription || isAdmin; // Admins get free access

  // Storage stats query
  const { data: storageData, refetch: refetchStorage } = useQuery<{ usedBytes: number; limitBytes: number }>({
    queryKey: ["/api/me/storage"],
    enabled: tab === "library" && isAuthenticated,
  });
  const storagePercent = storageData ? Math.round((storageData.usedBytes / storageData.limitBytes) * 100) : 0;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Upload dialog states
  const [showSocialUploadDialog, setShowSocialUploadDialog] = useState(false);
  const [showLibraryUploadDialog, setShowLibraryUploadDialog] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [submitForSale, setSubmitForSale] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<"all" | "purchases" | "uploads" | "free">("all");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [radioVolume, setRadioVolume] = useState(80);
  const [isPiPActive, setIsPiPActive] = useState(false);

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  useEffect(() => {
    if (tab !== "radio-tv") return;
    setTvLoading(true);
    setTvError(null);

    loadTvChannelsFromApi()
      .then((chs) => {
        setTvChannels(chs);
        setTvLoading(false);
      })
      .catch((e: unknown) => {
        setTvLoading(false);
        setTvError(e instanceof Error ? e.message : "Failed to load channels");
      });
  }, [tab]);

  const tvCountries = useMemo(() => {
    const set = new Set(tvChannels.map((c) => c.country).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [tvChannels]);

  const tvGroups = useMemo(() => {
    const set = new Set(tvChannels.map((c) => c.channelGroup).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [tvChannels]);

  const filteredTv = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tvChannels
      .filter((c) => (tvCountry === "all" ? true : c.country === tvCountry))
      .filter((c) => (tvGroup === "all" ? true : c.channelGroup === tvGroup))
      .filter((c) => (q ? c.name.toLowerCase().includes(q) : true));
  }, [tvChannels, tvCountry, tvGroup, query]);

  const activeChannel = useMemo(() => {
    return filteredTv.find((c) => c.id === playingChannelId) ?? null;
  }, [filteredTv, playingChannelId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleEnterPiP = () => setIsPiPActive(true);
    const handleLeavePiP = () => setIsPiPActive(false);
    
    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);
    
    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [activeChannel]);

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs
      .filter((s) => (musicFilter === "favorites" ? !!favorites[s.id] : true))
      .filter((s) => (q ? `${s.title} ${s.artist} ${s.album ?? ""}`.toLowerCase().includes(q) : true));
  }, [songs, favorites, musicFilter, query]);

  const filteredSocial = useMemo(() => {
    const q = query.trim().toLowerCase();
    return socialTracksData.filter((t: SocialTrack) =>
      q ? `${t.title} ${t.uploaderHandle ?? t.uploadedBy}`.toLowerCase().includes(q) : true,
    );
  }, [socialTracksData, query]);

  // Merge purchased songs from entitlements with uploaded items from API
  const allLibraryItems = useMemo(() => {
    const purchasedItems: LibraryItem[] = entitlementsData
      .filter(ent => ent.song)
      .map(ent => ({
        id: `purchase-${ent.songId}`,
        title: ent.song!.title,
        artist: ent.song!.artist,
        kind: "purchase" as const,
      }));
    
    // Convert API library uploads to LibraryItem format
    const uploadedItems: LibraryItem[] = libraryUploadsData.map(item => ({
      id: item.id,
      title: (item.metadata as any)?.title || "Untitled Upload",
      artist: (item.metadata as any)?.artist || "You",
      kind: "upload" as const,
    }));

    // Convert free library items to LibraryItem format
    const freeItems: LibraryItem[] = libraryFreeData.map(item => ({
      id: item.id,
      title: (item.metadata as any)?.title || "Free Song",
      artist: (item.metadata as any)?.artist || "Unknown",
      kind: "free" as const,
    }));
    
    return [...purchasedItems, ...freeItems, ...uploadedItems];
  }, [entitlementsData, libraryUploadsData, libraryFreeData]);

  const filteredLibrary = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allLibraryItems
      .filter((i) => {
        if (libraryFilter === "all") return true;
        if (libraryFilter === "purchases") return i.kind === "purchase";
        if (libraryFilter === "free") return i.kind === "free";
        if (libraryFilter === "uploads") return i.kind === "upload";
        return true;
      })
      .filter((i) => (q ? `${i.title} ${i.artist ?? ""}`.toLowerCase().includes(q) : true));
  }, [allLibraryItems, libraryFilter, query]);

  function togglePlayMock(title: string) {
    // Plays a tiny silent audio (just to simulate player controls) 
    // Without backend uploads, we keep it simple.
    setNowPlaying(title);
    setIsPlaying((p) => !p);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 opacity-[0.14] [background-image:radial-gradient(900px_500px_at_20%_0%,rgba(34,211,238,.22),transparent),radial-gradient(900px_500px_at_80%_10%,rgba(245,158,11,.16),transparent)]" />
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {user ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[15px] tracking-[0.18em] cursor-default" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }} data-testid="img-explore-logo">
                    AFRO<span className="text-[#22D3EE] mx-[7px]">•</span>KAVIAR
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cultural Operating System</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link href="/" data-testid="link-explore-home">
                <span className="text-[15px] tracking-[0.18em]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }} data-testid="img-explore-logo">
                  AFRO<span className="text-[#22D3EE] mx-[7px]">•</span>KAVIAR
                </span>
              </Link>
            )}

            <div className="flex items-center gap-3">
              {user ? (
                <Link href="/profile" data-testid="link-profile">
                  <Button
                    size="sm"
                    className="h-9 px-4 bg-white/10 text-white hover:bg-white/20 border border-white/10"
                    data-testid="button-profile"
                  >
                    {user.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="" 
                        className="w-5 h-5 rounded-full mr-2"
                      />
                    ) : (
                      <User className="mr-2 h-4 w-4" />
                    )}
                    Profile
                  </Button>
                </Link>
              ) : (
                <Link href="/auth" data-testid="link-signin">
                  <Button
                    size="sm"
                    className="h-9 px-5 bg-cyan-500 text-black font-bold hover:bg-cyan-400"
                    data-testid="button-signin"
                  >
                    Sign in
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" data-testid="link-admin">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-3 text-[#22D3EE]/70 bg-[#22D3EE]/10 hover:text-white hover:bg-[#22D3EE]"
                    data-testid="button-admin"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search in Music, Social, My Library..."
                    className="h-10 w-[min(520px,80vw)] pl-9 bg-black/30 border-white/10 text-white placeholder:text-white/35"
                    data-testid="input-global-search"
                  />
                </div>
              </div>
              <span className="text-xs text-white/45" data-testid="text-discovery">
                Unified Discovery
              </span>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <nav className="w-full mb-0 select-none" data-testid="tabs-main">
                <div className="bg-[#0d0d0f]/80 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-2 flex items-center justify-between">
                  {[
                    { id: 'radio-tv', label: 'Radio & TV', icon: MonitorPlay },
                    { id: 'live', label: 'Live', icon: RadioIcon },
                    { id: 'social', label: 'Social', icon: Globe },
                    { id: 'music', label: 'Music', icon: Music2 },
                    { id: 'library', label: 'My Library', icon: Library },
                  ].map((item) => {
                    const isActive = tab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        data-testid={`tab-${item.id}`}
                        className={`
                          relative flex items-center sm:space-x-2.5 px-3 sm:px-4 py-2.5 rounded-2xl transition-all duration-300 group
                          ${isActive ? 'bg-[#F4BE44]/10' : 'hover:bg-zinc-800/40'}
                        `}
                      >
                        <Icon 
                          size={18} 
                          className={`
                            transition-colors duration-300
                            ${isActive ? 'text-[#F4BE44]' : 'text-zinc-500 group-hover:text-zinc-300'}
                          `} 
                        />
                        <span className={`
                          text-xs font-bold tracking-tight transition-colors duration-300
                          ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}
                          hidden sm:inline-block
                        `}>
                          {item.label}
                        </span>
                        {item.id === 'live' && isActive && (
                          <span className="absolute top-2 right-2 flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F4BE44] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F4BE44]"></span>
                          </span>
                        )}
                        {isActive && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#F4BE44] rounded-full shadow-[0_0_8px_#F4BE44]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="pt-5">
                <TabsContent value="radio-tv" className="mt-0">
                  <div className="grid gap-6 lg:grid-cols-5">
                    <div className="lg:col-span-3 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-display text-lg text-white" data-testid="text-player-title">
                            {activeChannel ? activeChannel.name : "Radio & TV"}
                          </div>
                          <div className="text-xs text-white/55" data-testid="text-player-subtitle">
                            {activeChannel
                              ? `${activeChannel.country} • ${activeChannel.channelGroup}`
                              : "Select a TV channel or switch to Radio."}
                          </div>
                        </div>
{activeChannel && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const video = videoRef.current;
                                if (video) {
                                  video.currentTime = Math.max(0, video.currentTime - 20);
                                }
                              }}
                              className="p-2 rounded-lg transition-all bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                              title="Rewind 20 seconds"
                              data-testid="button-rewind-20"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={togglePiP}
                              className={`p-2 rounded-lg transition-all ${isPiPActive ? 'bg-[#22D3EE]/20 text-[#22D3EE]' : 'bg-white/5 text-white/55 hover:bg-white/10 hover:text-white'}`}
                              title={isPiPActive ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
                              data-testid="button-pip"
                            >
                              <PictureInPicture2 className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-white/55" data-testid="text-player-status">
                              TV
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-[12px] overflow-hidden rounded-xl bg-black" data-testid="panel-player">
                        <div className="aspect-video">
                          {activeChannel ? (
                            streamError ? (
                              <div className="flex h-full items-center justify-center bg-[#0A0D15]">
                                <div className="grid gap-3 text-center p-6">
                                  <div className="mx-auto h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <AlertCircle className="h-6 w-6 text-red-400" />
                                  </div>
                                  <div className="text-sm text-white/70" data-testid="text-stream-error">
                                    This channel is currently unavailable
                                  </div>
                                  <div className="text-xs text-white/45">
                                    {activeChannel.name} may be offline or blocked by your network
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 mx-auto bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                    onClick={() => {
                                      setStreamError(null);
                                      setPlayingChannelId(activeChannel.id);
                                    }}
                                    data-testid="button-retry-stream"
                                  >
                                    Try Again
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full w-full">
                                <video
                                  ref={videoRef}
                                  key={activeChannel.id + "-" + playingChannelId}
                                  className="h-full w-full"
                                  controls
                                  autoPlay
                                  playsInline
                                  data-testid="video-tv"
                                  onError={() => setStreamError("Stream failed to load")}
                                >
                                  <source src={activeChannel.iptvUrl} />
                                </video>
                              </div>
                            )
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <div className="grid gap-2 text-center">
                                <Tv className="mx-auto h-8 w-8 text-white/60" />
                                <div className="text-sm text-white/70" data-testid="text-player-empty">
                                  Choose a channel on the right.
                                </div>
                                <div className="text-xs text-white/45" data-testid="text-player-empty-sub">
                                  We’ll validate streams as you play them.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="rounded-xl border border-white/10 p-3" data-testid="panel-radio">
                          {/* Enhanced Radio Player */}
                          <div className="w-full select-none">
                            {/* Label Header */}
                            <div className="flex items-center space-x-3 mb-5 px-2">
                              <div className="p-1.5 bg-[#F4BE44]/10 rounded-lg">
                                <RadioIcon className="w-4 h-4 text-[#F4BE44]" />
                              </div>
                              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500" data-testid="text-radio-title">
                                Live Radio
                              </h2>
                            </div>
                            
                            {/* Main Player Pill */}
                            <div className="relative bg-[#0d0d0f] rounded-2xl border border-zinc-800/60 p-6 md:p-10 flex items-center overflow-hidden group transition-all duration-300 min-h-[163px]">
                              
                              {/* Radio Embed for actual audio - with padding for controls */}
                              <div 
                                className="absolute top-6 bottom-2 left-[26px] right-[26px] overflow-hidden rounded-xl"
                                style={{ zIndex: 1 }}
                                dangerouslySetInnerHTML={{ __html: radioEmbedCode }}
                              />
                              
                              {/* Ambient background glow */}
                              <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#F4BE44]/5 blur-[80px] pointer-events-none group-hover:bg-[#F4BE44]/10 transition-colors duration-1000" />
                              
                              {/* ON AIR indicator - positioned at top right */}
                              <div className="absolute top-6 right-4 z-10 flex items-center space-x-2">
                                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">On Air</span>
                              </div>
                            </div>
                          </div>

                          {isAdmin && (
                            <div className="mt-3 grid gap-2">
                              <Label className="text-xs text-white/55" data-testid="label-radio-embed">
                                Paste Radiolise embed code
                              </Label>
                              <textarea
                                value={radioEmbedCode}
                                onChange={(e) => setRadioEmbedCode(e.target.value)}
                                className="min-h-[86px] w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/75 outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                placeholder="<iframe ...></iframe>"
                                data-testid="textarea-radio-embed"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 text-white/80">
                      <div>
                        <div className="font-display text-lg text-white" data-testid="text-tv-list-title">
                          TV Channels
                        </div>
                        <div className="text-xs text-white/55" data-testid="text-tv-count">
                          {tvLoading ? "Loading..." : `${filteredTv.length} channels`}
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-white/10 overflow-hidden flex flex-col" style={{ height: '612px' }}>
                        <div className="p-3 border-b border-white/10">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-white/55" data-testid="label-tv-country">
                                Country
                              </Label>
                              <Select value={tvCountry} onValueChange={setTvCountry}>
                                <SelectTrigger className="mt-1 h-10 bg-[#101116] border-0 text-white hover:bg-[#101116]" data-testid="select-tv-country">
                                  <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-white/10 text-white">
                                  {tvCountries.map((c) => (
                                    <SelectItem key={c} value={c} data-testid={`option-tv-country-${slugId(c)}`}>
                                      {c === "all" ? "All" : c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-white/55" data-testid="label-tv-group">
                                Content Type
                              </Label>
                              <Select value={tvGroup} onValueChange={setTvGroup}>
                                <SelectTrigger className="mt-1 h-10 bg-[#101116] border-0 text-white hover:bg-[#101116]" data-testid="select-tv-group">
                                  <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-white/10 text-white">
                                  {tvGroups.map((g) => (
                                    <SelectItem key={g} value={g} data-testid={`option-tv-group-${slugId(g)}`}>
                                      {g === "all" ? "All" : g}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {tvError ? (
                          <div className="p-3 border-b border-white/10 text-sm text-white/70" data-testid="status-tv-error">
                            {tvError}
                          </div>
                        ) : null}

                        <div className="flex-1 overflow-y-auto scrollbar-custom" style={{ scrollbarColor: '#161820 transparent', scrollbarWidth: 'thin' }} data-testid="list-tv">
                        {tvLoading ? (
                          <div className="p-4 text-sm text-white/60" data-testid="status-tv-loading">
                            Loading channels from the sheet...
                          </div>
                        ) : (
                          <div className="divide-y divide-white/10">
                            {filteredTv.map((c) => {
                              const active = c.id === playingChannelId;
                              return (
                                <button
                                  key={c.id}
                                  className={
                                    "w-full text-left px-3 py-3 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] " +
                                    (active ? "bg-white/5" : "")
                                  }
                                  onClick={() => { setStreamError(null); setPlayingChannelId(c.id); }}
                                  data-testid={`row-tv-channel-${c.id}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm text-white" data-testid={`text-tv-name-${c.id}`}>
                                        {c.name}
                                      </div>
                                      <div className="mt-1 text-xs text-white/55" data-testid={`text-tv-meta-${c.id}`}>
                                        {c.country} • {c.channelGroup}
                                      </div>
                                    </div>
                                    <Badge
                                      className={
                                        "mt-0.5 border border-white/10 bg-black/30 text-white/70 " +
                                        (active ? "" : "")
                                      }
                                      data-testid={`badge-tv-active-${c.id}`}
                                    >
                                      {active ? "Playing" : "Play"}
                                    </Badge>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                        </div>

                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="live" className="mt-0">
                  <div className="w-full text-zinc-100" data-testid="panel-live">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white" data-testid="text-live-title">
                          Live
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium max-w-md leading-relaxed" data-testid="text-live-desc">
                          Featured live shows and podcast sessions — timed events with RSVP and ticketing.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full font-bold text-sm transition-all transform active:scale-95"
                          data-testid="button-live-notify"
                        >
                          <Bell className="w-4 h-4" />
                          <span>Get Notified</span>
                        </button>
                      </div>
                    </div>

                    {/* Coming Soon Banner */}
                    <div className="bg-[#121214] rounded-3xl border border-zinc-800/60 overflow-hidden mb-6">
                      <div className="px-6 py-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#22D3EE]/10 rounded-full mb-4">
                          <RadioIcon className="w-8 h-8 text-[#22D3EE]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
                        <p className="text-zinc-400 text-sm max-w-md mx-auto">
                          Live streaming events, artist premieres, and interactive sessions are on the way.
                        </p>
                      </div>
                    </div>

                    {/* Stats Info */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">
                      <div className="flex items-center space-x-6">
                        <span className="text-zinc-600">Total: 3 upcoming events</span>
                      </div>
                      <div className="flex items-center space-x-2 text-zinc-600">
                        <span>Stay tuned</span>
                      </div>
                    </div>

                    {/* Event Cards Container */}
                    <div className="bg-[#121214] rounded-3xl border border-zinc-800/60 overflow-hidden">
                      {/* List Header */}
                      <div className="grid grid-cols-[60px_1fr_100px_100px] items-center px-6 py-4 border-b border-zinc-800/80 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-black/20">
                        <div className="text-center">#</div>
                        <div>Event / Description</div>
                        <div className="hidden sm:block px-4">Date</div>
                        <div className="text-right pr-2">Action</div>
                      </div>

                      {/* List Rows */}
                      <div className="divide-y divide-zinc-800/40">
                        {[
                          { title: "Diaspora Lounge Session", date: "Coming Soon", desc: "A weekly curated live stream." },
                          { title: "Artist Drop Premiere", date: "Coming Soon", desc: "Timed releases with chat & replay." },
                          { title: "Afrobeats Live Showcase", date: "Coming Soon", desc: "Live performances from top artists." },
                        ].map((e, idx) => (
                          <div 
                            key={idx}
                            className="group grid grid-cols-[60px_1fr_100px_100px] items-center px-6 py-5 hover:bg-white/[0.04] transition-all duration-200 cursor-default"
                            data-testid={`row-live-${idx}`}
                          >
                            {/* Index */}
                            <div className="flex justify-center">
                              <div className="relative w-9 h-9 flex items-center justify-center">
                                <span className="text-zinc-500 font-bold font-mono text-sm">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div className="flex items-center space-x-5 overflow-hidden">
                              <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700/50 group-hover:border-[#22D3EE]/30 transition-all relative overflow-hidden" data-testid={`img-live-thumb-${idx}`}>
                                <RadioIcon className="w-5 h-5 text-zinc-500 group-hover:text-[#22D3EE] transition-colors" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-white text-base truncate group-hover:text-[#22D3EE]/90 transition-colors" data-testid={`text-live-card-title-${idx}`}>
                                  {e.title}
                                </span>
                                <span className="text-sm text-zinc-400 font-medium truncate group-hover:text-zinc-300" data-testid={`text-live-card-desc-${idx}`}>
                                  {e.desc}
                                </span>
                              </div>
                            </div>

                            {/* Date Column */}
                            <div className="hidden sm:block px-2 text-sm text-zinc-500 group-hover:text-zinc-300" data-testid={`text-live-date-${idx}`}>
                              {e.date}
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center justify-end">
                              <button
                                className="px-4 py-2 text-xs font-bold bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-all border border-zinc-700"
                                data-testid={`button-live-remind-${idx}`}
                              >
                                Remind me
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </TabsContent>

                <TabsContent value="music" className="mt-0">
                  <div className="w-full text-zinc-100" data-testid="panel-music">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white" data-testid="text-music-title">
                          Music
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium max-w-md leading-relaxed" data-testid="text-music-desc">
                          Discover curated tracks from African artists. Preview any song for 60 seconds, then purchase for just $1 to keep it forever.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select value={musicFilter} onValueChange={setMusicFilter}>
                          <SelectTrigger className="h-11 bg-zinc-900 border-zinc-700 text-white rounded-full px-5" data-testid="select-music-filter">
                            <SelectValue placeholder="Filter" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                            <SelectItem value="all" data-testid="option-music-filter-all">All</SelectItem>
                            <SelectItem value="favorites" data-testid="option-music-filter-favorites">Favourites</SelectItem>
                          </SelectContent>
                        </Select>
                        {isAdmin && (
                          <button 
                            className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full font-bold text-sm transition-all transform active:scale-95 whitespace-nowrap"
                            data-testid="button-music-add"
                            onClick={() => {
                              toast({
                                title: "Coming soon",
                                description: "File upload feature for music will be added soon.",
                              });
                            }}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Add Music</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats Info */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">
                      <div className="flex items-center space-x-6">
                        <span className="text-zinc-600">Total: {filteredSongs.length} tracks</span>
                      </div>
                      <div className="flex items-center space-x-2 text-zinc-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Purchase and keep forever</span>
                      </div>
                    </div>

                    {/* Track List Container */}
                    <div className="bg-[#121214] rounded-3xl border border-zinc-800/60 overflow-hidden ">
                      {/* List Header */}
                      <div className="grid grid-cols-[60px_1fr_80px_100px_140px] items-center px-6 py-4 border-b border-zinc-800/80 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-black/20">
                        <div className="text-center">#</div>
                        <div>Title / Artist</div>
                        <div className="hidden sm:block px-2">Time</div>
                        <div className="hidden md:block px-2">Genre</div>
                        <div className="text-right pr-2">Actions</div>
                      </div>
                      {/* List Rows */}
                      <div className="divide-y divide-zinc-800/40">
                        {songsLoading ? (
                          <div className="px-6 py-8 text-sm text-zinc-400" data-testid="status-music-loading">
                            Loading songs...
                          </div>
                        ) : filteredSongs.length === 0 ? (
                          <div className="px-6 py-8 text-sm text-zinc-400" data-testid="status-music-empty">
                            No songs found
                          </div>
                        ) : (
                          filteredSongs.map((s, index) => {
                            const fav = !!favorites[s.id];
                            const reaction = reactions[s.id] ?? null;
                            const isPaid = s.price > 0;
                            return (
                              <div
                                key={s.id}
                                className="group grid grid-cols-[60px_1fr_80px_100px_140px] items-center px-6 py-5 hover:bg-white/[0.04] transition-all duration-200 cursor-default"
                                data-testid={`row-song-${s.id}`}
                              >
                                {/* Play Button / Index Toggle */}
                                <div className="flex justify-center">
                                  <div className="relative w-9 h-9 flex items-center justify-center">
                                    <span className="absolute text-zinc-500 group-hover:opacity-0 transition-opacity font-bold font-mono text-sm">
                                      {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <button 
                                      className="absolute opacity-0 group-hover:opacity-100 bg-[#22D3EE] rounded-full text-black p-2 transition-all transform scale-50 group-hover:scale-100  hover:bg-[#06B6D4]"
                                      onClick={() => togglePlayMock(s.title)}
                                      data-testid={`button-song-play-${s.id}`}
                                    >
                                      <Play className="w-4 h-4 fill-current ml-0.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Title & Artist */}
                                <div className="flex items-center space-x-5 overflow-hidden">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700/50 group-hover:border-[#22D3EE]/30 transition-all  relative overflow-hidden" data-testid={`img-song-thumb-${s.id}`}>
                                    {s.artworkUrl ? (
                                      <img src={s.artworkUrl} alt={s.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <Music className="w-5 h-5 text-zinc-500 group-hover:text-[#22D3EE] transition-colors" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white text-base truncate group-hover:text-[#22D3EE]/90 transition-colors" data-testid={`text-song-title-${s.id}`}>
                                        {s.title}
                                      </span>
                                      {isNew(s.createdAt) && (
                                        <Badge className="bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30 text-[10px]" data-testid={`badge-song-new-${s.id}`}>
                                          New
                                        </Badge>
                                      )}
                                      {ownedSongs[s.id] && (
                                        <Badge className="bg-primary/20 text-primary border border-primary/30 text-[10px]" data-testid={`badge-song-owned-${s.id}`}>
                                          Owned
                                        </Badge>
                                      )}
                                      {!ownedSongs[s.id] && isPaid && (
                                        <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px]" data-testid={`badge-song-paid-${s.id}`}>
                                          ${(s.price / 100).toFixed(2)}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-sm text-zinc-400 font-medium truncate group-hover:text-zinc-300" data-testid={`text-song-artist-${s.id}`}>
                                      {s.artist}
                                    </span>
                                  </div>
                                </div>

                                {/* Duration Column */}
                                <div className="hidden sm:block px-2 text-sm text-zinc-400 group-hover:text-zinc-200 font-mono tracking-tighter" data-testid={`text-song-duration-${s.id}`}>
                                  {formatDuration(s.duration)}
                                </div>

                                {/* Genre Column */}
                                <div className="hidden md:block px-2 text-sm text-zinc-500 group-hover:text-zinc-300" data-testid={`text-song-genre-${s.id}`}>
                                  {s.genre ?? "—"}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-2 justify-end pr-2">
                                  <button 
                                    className={`p-2.5 rounded-full transition-all hover:scale-110 ${reaction === "up" ? 'text-[#22D3EE]' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                    aria-label={reaction === "up" ? "Remove thumbs up" : "Thumbs up"}
                                    onClick={() => {
                                      if (!isAuthenticated) {
                                        toast({ title: "Please log in", description: "You need to be logged in to react to songs" });
                                        return;
                                      }
                                      toggleReactionMutation.mutate({ songId: s.id, type: "up", currentType: reaction });
                                    }}
                                    data-testid={`button-song-thumbsup-${s.id}`}
                                  >
                                    <ThumbsUp className={`w-4 h-4 ${reaction === "up" ? 'fill-current' : ''}`} />
                                  </button>
                                  <button 
                                    className={`p-2.5 rounded-full transition-all hover:scale-110 ${reaction === "down" ? 'text-amber-500' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                    aria-label={reaction === "down" ? "Remove thumbs down" : "Thumbs down"}
                                    onClick={() => {
                                      if (!isAuthenticated) {
                                        toast({ title: "Please log in", description: "You need to be logged in to react to songs" });
                                        return;
                                      }
                                      toggleReactionMutation.mutate({ songId: s.id, type: "down", currentType: reaction });
                                    }}
                                    data-testid={`button-song-thumbsdown-${s.id}`}
                                  >
                                    <ThumbsDown className={`w-4 h-4 ${reaction === "down" ? 'fill-current' : ''}`} />
                                  </button>
                                  <button 
                                    className={`p-2.5 rounded-full transition-all hover:scale-110 ${fav ? 'text-[#22D3EE]' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                    aria-label={fav ? "Remove from favourites" : "Add to favourites"}
                                    onClick={() => {
                                      if (!isAuthenticated) {
                                        toast({ title: "Please log in", description: "You need to be logged in to favorite songs" });
                                        return;
                                      }
                                      toggleFavoriteMutation.mutate({ songId: s.id, isFavorited: fav });
                                    }}
                                    data-testid={`button-song-favourite-${s.id}`}
                                  >
                                    <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
                                  </button>
                                  {ownedSongs[s.id] ? (
                                    <button
                                      className="px-3 py-1.5 text-xs font-bold rounded-full bg-primary/20 text-primary cursor-default"
                                      disabled
                                      data-testid={`button-song-owned-${s.id}`}
                                    >
                                      Owned
                                    </button>
                                  ) : isPaid ? (
                                    <button
                                      className="px-3 py-1.5 text-xs font-bold rounded-full bg-[#22D3EE] text-black hover:bg-[#06B6D4] transition-all transform active:scale-95"
                                      data-testid={`button-song-buy-${s.id}`}
                                      disabled={purchaseSongMutation.isPending}
                                      onClick={() => {
                                        if (!isAuthenticated) {
                                          toast({ title: "Please log in", description: "You need to be logged in to purchase songs" });
                                          return;
                                        }
                                        purchaseSongMutation.mutate(s.id);
                                      }}
                                    >
                                      {purchaseSongMutation.isPending ? "..." : `$${(s.price / 100).toFixed(2)}`}
                                    </button>
                                  ) : freeSongsInLibrary[s.id] ? (
                                    <button
                                      className="px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-600/20 text-emerald-400 cursor-default"
                                      disabled
                                      data-testid={`button-song-inlibrary-${s.id}`}
                                    >
                                      In Library
                                    </button>
                                  ) : (
                                    <button
                                      className="px-3 py-1.5 text-xs font-bold rounded-full bg-zinc-700 text-white hover:bg-zinc-600 transition-all transform active:scale-95"
                                      data-testid={`button-song-addlibrary-${s.id}`}
                                      disabled={addFreeSongMutation.isPending}
                                      onClick={() => {
                                        if (!isAuthenticated) {
                                          toast({ title: "Please log in", description: "You need to be logged in to add songs to your library" });
                                          return;
                                        }
                                        addFreeSongMutation.mutate({ id: s.id, title: s.title, artist: s.artist });
                                      }}
                                    >
                                      {addFreeSongMutation.isPending ? "..." : "Add to Library"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>
                </TabsContent>

                <TabsContent value="social" className="mt-0">
                  <div className="w-full text-zinc-100" data-testid="panel-social">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white" data-testid="text-social-title">
                          Social
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium max-w-md leading-relaxed" data-testid="text-social-desc">
                          A simple public drop space for collaborators. Discover new sounds and works in progress.
                        </p>
                      </div>
                      <button 
                        className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full font-bold text-sm transition-all transform active:scale-95 "
                        data-testid="button-social-upload"
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast({ title: "Sign in required", description: "Please sign in to upload tracks.", variant: "destructive" });
                            return;
                          }
                          setUploadTitle("");
                          setSubmitForSale(false);
                          setUploadFile(null);
                          setShowSocialUploadDialog(true);
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Track</span>
                      </button>
                    </div>

                    {/* My Submissions Section */}
                    {isAuthenticated && mySubmissions.length > 0 && (
                      <div className="mb-6 bg-[#121214] rounded-2xl border border-zinc-800/60 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Upload className="w-4 h-4 text-[#22D3EE]" />
                          <span className="text-sm font-bold text-white">My Submissions</span>
                        </div>
                        <div className="space-y-2">
                          {mySubmissions.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/30 border border-zinc-800/40" data-testid={`row-submission-${sub.id}`}>
                              <div>
                                <span className="text-sm text-white font-medium">{sub.title}</span>
                                <span className="text-xs text-zinc-500 ml-2">
                                  {new Date(sub.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                sub.status === "approved" ? "bg-green-500/20 text-green-400" :
                                sub.status === "rejected" ? "bg-red-500/20 text-red-400" :
                                "bg-yellow-500/20 text-yellow-400"
                              }`} data-testid={`badge-status-${sub.id}`}>
                                {sub.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats Info */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">
                      <div className="flex items-center space-x-6">
                        <span className="text-zinc-600">Total: {filteredSocial.length} tracks</span>
                      </div>
                      <div className="flex items-center space-x-2 text-zinc-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Last Sync: Just now</span>
                      </div>
                    </div>

                    {/* Track List Container */}
                    <div className="bg-[#121214] rounded-3xl border border-zinc-800/60 overflow-hidden ">
                      {/* List Header */}
                      <div className="grid grid-cols-[60px_1fr_100px_120px_120px] items-center px-6 py-4 border-b border-zinc-800/80 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-black/20">
                        <div className="text-center">#</div>
                        <div>Title / Artist</div>
                        <div className="hidden sm:block px-4">Time</div>
                        <div className="hidden md:block px-4">Posted</div>
                        <div className="text-right pr-6">Actions</div>
                      </div>

                      {/* List Rows */}
                      <div className="divide-y divide-zinc-800/40">
                        {filteredSocial.map((t, index) => {
                          const saved = !!socialSaved[t.id];
                          return (
                            <div 
                              key={t.id}
                              className="group grid grid-cols-[60px_1fr_100px_120px_120px] items-center px-6 py-5 hover:bg-white/[0.04] transition-all duration-200 cursor-default"
                              data-testid={`card-social-${t.id}`}
                            >
                              {/* Play Button / Index Toggle */}
                              <div className="flex justify-center">
                                <div className="relative w-9 h-9 flex items-center justify-center">
                                  <span className="absolute text-zinc-500 group-hover:opacity-0 transition-opacity font-bold font-mono text-sm">
                                    {String(index + 1).padStart(2, '0')}
                                  </span>
                                  <button 
                                    className="absolute opacity-0 group-hover:opacity-100 bg-[#22D3EE] rounded-full text-black p-2 transition-all transform scale-50 group-hover:scale-100  hover:bg-[#06B6D4]"
                                    onClick={() => togglePlayMock(t.title)}
                                    data-testid={`button-social-play-${t.id}`}
                                  >
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Title & Artist */}
                              <div className="flex items-center space-x-5 overflow-hidden">
                                <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700/50 group-hover:border-[#22D3EE]/30 transition-all  relative overflow-hidden" data-testid={`img-social-thumb-${t.id}`}>
                                  <Music className="w-5 h-5 text-zinc-500 group-hover:text-[#22D3EE] transition-colors" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-white text-base truncate group-hover:text-[#22D3EE]/90 transition-colors" data-testid={`text-social-title-${t.id}`}>
                                    {t.title}
                                  </span>
                                  <span className="text-sm text-zinc-400 font-medium truncate group-hover:text-zinc-300" data-testid={`text-social-meta-${t.id}`}>
                                    @{t.uploaderHandle || "user"}
                                  </span>
                                </div>
                              </div>

                              {/* Duration Column */}
                              <div className="hidden sm:block px-4 text-sm text-zinc-400 group-hover:text-zinc-200 font-mono tracking-tighter">
                                {t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}` : "—"}
                              </div>

                              {/* Timestamp Column */}
                              <div className="hidden md:block px-4 text-sm text-zinc-500 group-hover:text-zinc-300">
                                {formatAge(new Date(t.createdAt).getTime())}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2 justify-end pr-2">
                                <button 
                                  className={`p-2.5 rounded-full transition-all hover:scale-110 ${saved ? 'text-[#22D3EE]' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                  aria-label="Like track"
                                  onClick={() => setSocialSaved((p) => ({ ...p, [t.id]: !p[t.id] }))}
                                  data-testid={`button-social-save-${t.id}`}
                                >
                                  <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                                </button>
                                {role === "admin" && (
                                  <button 
                                    className="p-2.5 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800 transition-all hover:scale-110" 
                                    aria-label="Add to catalogue"
                                    onClick={() => {
                                      toast({
                                        title: "Coming soon",
                                        description: "Social to catalogue promotion will be available soon.",
                                      });
                                    }}
                                    data-testid={`button-social-promote-${t.id}`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  className="p-2.5 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800 transition-all hidden md:block" 
                                  aria-label="More options"
                                  data-testid={`button-social-more-${t.id}`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </TabsContent>

                <TabsContent value="library" className="mt-0">
                  <div className="w-full text-zinc-100" data-testid="panel-library">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white" data-testid="text-library-title">
                          My Library
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium max-w-md leading-relaxed" data-testid="text-library-desc">
                          Your personal and private music collection. Purchases and uploads appear here.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select value={libraryFilter} onValueChange={(v) => setLibraryFilter(v as any)}>
                          <SelectTrigger className="h-11 bg-zinc-900 border-zinc-700 text-white rounded-full px-5" data-testid="select-library-filter">
                            <SelectValue placeholder="Filter" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                            <SelectItem value="all" data-testid="option-library-all">All</SelectItem>
                            <SelectItem value="purchases" data-testid="option-library-purchases">Purchases</SelectItem>
                            <SelectItem value="free" data-testid="option-library-free">Free</SelectItem>
                            <SelectItem value="uploads" data-testid="option-library-uploads">Uploads</SelectItem>
                          </SelectContent>
                        </Select>
                        <button 
                          className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all transform active:scale-95 ${
                            canUploadToLibrary && isAuthenticated
                              ? "bg-white hover:bg-zinc-200 text-black" 
                              : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                          }`}
                          disabled={!isAuthenticated || !canUploadToLibrary}
                          data-testid="button-library-upload"
                          onClick={() => {
                            setUploadTitle("");
                            setUploadFile(null);
                            setShowLibraryUploadDialog(true);
                          }}
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload</span>
                        </button>
                        {!canUploadToLibrary && isAuthenticated && (
                          <span className="text-xs text-zinc-500">Subscribe to upload</span>
                        )}
                      </div>
                    </div>

                    {/* Stats Info */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">
                      <div className="flex items-center space-x-6">
                        <span className="text-zinc-600">Total: {filteredLibrary.length} items</span>
                        {storageData && (
                          <span className="text-zinc-600" data-testid="text-storage-used">
                            Storage: {formatBytes(storageData.usedBytes)} / 50GB ({storagePercent}%)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-zinc-600">
                        <Library className="w-3.5 h-3.5" />
                        <span>Your Personal Collection</span>
                      </div>
                    </div>

                    {/* Now Playing Mini-player */}
                    <div className="bg-[#121214] rounded-2xl border border-zinc-800/60 p-5 mb-6 " data-testid="panel-library-player">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700/50 ">
                            <Music className="w-6 h-6 text-[#22D3EE]" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500" data-testid="text-library-nowplaying-label">
                              Now Playing
                            </div>
                            <div className="font-bold text-white text-lg" data-testid="text-library-nowplaying">
                              {nowPlaying ?? "Nothing yet"}
                            </div>
                          </div>
                        </div>
                        <button
                          className={`p-3 rounded-full transition-all transform hover:scale-110 ${isPlaying ? 'bg-[#22D3EE] text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                          data-testid="button-library-toggleplay"
                          onClick={() => togglePlayMock(nowPlaying ?? "Sample")}
                        >
                          <Play className={`w-5 h-5 ${isPlaying ? '' : ''}`} />
                        </button>
                      </div>
                      <audio ref={audioRef} />
                    </div>

                    {/* Track List Container */}
                    <div className="bg-[#121214] rounded-3xl border border-zinc-800/60 overflow-hidden ">
                      {/* List Header */}
                      <div className="grid grid-cols-[60px_1fr_80px_100px_100px_100px] items-center px-6 py-4 border-b border-zinc-800/80 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-black/20">
                        <div className="text-center">#</div>
                        <div>Title / Artist</div>
                        <div className="hidden sm:block">Time</div>
                        <div className="hidden md:block">Genre</div>
                        <div className="hidden md:block px-4">Kind</div>
                        <div className="text-right pr-6">Actions</div>
                      </div>

                      {/* List Rows */}
                      <div className="divide-y divide-zinc-800/40">
                        {filteredLibrary.length === 0 ? (
                          <div className="px-6 py-8 text-sm text-zinc-400" data-testid="status-library-empty">
                            No items in your library
                          </div>
                        ) : (
                          filteredLibrary.map((item, index) => (
                            <div 
                              key={item.id}
                              className="group grid grid-cols-[60px_1fr_80px_100px_100px_100px] items-center px-6 py-5 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
                              data-testid={`row-library-${item.id}`}
                              onClick={() => {
                                setNowPlaying(item.title);
                                setIsPlaying(true);
                              }}
                            >
                              {/* Play Button / Index Toggle */}
                              <div className="flex justify-center">
                                <div className="relative w-9 h-9 flex items-center justify-center">
                                  <span className="absolute text-zinc-500 group-hover:opacity-0 transition-opacity font-bold font-mono text-sm">
                                    {String(index + 1).padStart(2, '0')}
                                  </span>
                                  <button 
                                    className="absolute opacity-0 group-hover:opacity-100 bg-[#22D3EE] rounded-full text-black p-2 transition-all transform scale-50 group-hover:scale-100  hover:bg-[#06B6D4]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNowPlaying(item.title);
                                      setIsPlaying(true);
                                    }}
                                    data-testid={`button-library-play-${item.id}`}
                                  >
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Title & Artist */}
                              <div className="flex items-center space-x-5 overflow-hidden">
                                <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700/50 group-hover:border-[#22D3EE]/30 transition-all  relative overflow-hidden" data-testid={`img-library-thumb-${item.id}`}>
                                  <Music className="w-5 h-5 text-zinc-500 group-hover:text-[#22D3EE] transition-colors" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-white text-base truncate group-hover:text-[#22D3EE]/90 transition-colors" data-testid={`text-library-title-${item.id}`}>
                                    {item.title}
                                  </span>
                                  <span className="text-sm text-zinc-400 font-medium truncate group-hover:text-zinc-300" data-testid={`text-library-artist-${item.id}`}>
                                    {item.artist ?? "Unknown"}
                                  </span>
                                </div>
                              </div>

                              {/* Time Column */}
                              <div className="hidden sm:block text-sm text-zinc-400 group-hover:text-zinc-200 font-mono tracking-tighter" data-testid={`text-library-duration-${item.id}`}>
                                3:45
                              </div>

                              {/* Genre Column */}
                              <div className="hidden md:block text-sm text-zinc-500 group-hover:text-zinc-300" data-testid={`text-library-genre-${item.id}`}>
                                —
                              </div>

                              {/* Kind Column */}
                              <div className="hidden md:block px-4">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.kind === 'purchase' ? 'bg-[#22D3EE]/20 text-[#22D3EE]' : 'bg-zinc-800 text-zinc-400'}`} data-testid={`text-library-kind-${item.id}`}>
                                  {item.kind === 'purchase' ? 'Purchased' : 'Upload'}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2 justify-end pr-2">
                                <button 
                                  className="p-2.5 text-zinc-500 hover:text-[#22D3EE] rounded-full hover:bg-zinc-800 transition-all hover:scale-110"
                                  aria-label="Like"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`button-library-like-${item.id}`}
                                >
                                  <Heart className="w-4 h-4" />
                                </button>
                                <button 
                                  className="p-2.5 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800 transition-all hidden md:block" 
                                  aria-label="More options"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`button-library-more-${item.id}`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </header>
      </div>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-xs text-white/45" data-testid="text-explore-footer">
        {tab === "radio-tv" && (
          <span className="text-[#22D3EE]">Radio and TV will always be free. It's Universal Culture.</span>
        )}
        {tab === "live" && (
          <>Payments processed securely via Stripe. <span className="text-[#22D3EE]">Some events will be offered $10, many will be free.</span></>
        )}
        {tab === "social" && (
          <>Payments processed securely via Stripe. <span className="text-[#22D3EE]">Sell Your Songs for $1, Request them to be added to the Music section.</span></>
        )}
        {tab === "music" && (
          <>Payments processed securely via Stripe. <span className="text-[#22D3EE]">All Songs are $1 and stored in My Library.</span></>
        )}
        {tab === "library" && (
          <>Payments processed securely via Stripe. <span className="text-[#22D3EE]">My Library 50GB storage — $5/mo or $50/yr.</span></>
        )}
      </footer>

      {/* Social Upload Dialog */}
      <Dialog open={showSocialUploadDialog} onOpenChange={setShowSocialUploadDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Upload to Social</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Share your track with the community. Optionally submit it for admin review to be listed in the Music catalogue for sale at $1.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="social-upload-title" className="text-sm text-zinc-300">Track Title</Label>
              <Input
                id="social-upload-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Give your track a title..."
                className="bg-zinc-800 border-zinc-700 text-white"
                data-testid="input-social-upload-title"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-zinc-300">Audio File</Label>
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-zinc-600 transition-colors cursor-pointer"
                onClick={() => document.getElementById('social-file-input')?.click()}>
                {uploadFile ? (
                  <div className="text-sm text-[#22D3EE] font-medium">{uploadFile.name}</div>
                ) : (
                  <div className="text-sm text-zinc-500">Click to select audio file (MP3, WAV, FLAC)</div>
                )}
              </div>
              <input 
                type="file" 
                id="social-file-input"
                accept="audio/*" 
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="submit-for-sale"
                checked={submitForSale}
                onCheckedChange={(checked) => setSubmitForSale(checked === true)}
                className="border-zinc-600 data-[state=checked]:bg-[#22D3EE] data-[state=checked]:border-[#22D3EE]"
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="submit-for-sale" className="text-sm font-medium text-white cursor-pointer">
                  Submit for sale in Music catalogue
                </label>
                <p className="text-xs text-zinc-500">
                  If approved by admins, your track will appear in the Music section for $1. You'll earn revenue from sales.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowSocialUploadDialog(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              disabled={!uploadTitle.trim() || !uploadFile || isUploading}
              onClick={async () => {
                if (!uploadTitle.trim() || !uploadFile) return;
                setIsUploading(true);
                try {
                  // Step 1: Get presigned URL
                  const urlRes = await fetch("/api/uploads/request-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      name: uploadFile.name,
                      size: uploadFile.size,
                      contentType: uploadFile.type,
                    }),
                  });
                  
                  if (!urlRes.ok) {
                    throw new Error("Failed to get upload URL");
                  }
                  
                  const { uploadURL, objectPath } = await urlRes.json();
                  
                  // Step 2: Upload file directly to storage
                  const uploadRes = await fetch(uploadURL, {
                    method: "PUT",
                    body: uploadFile,
                    headers: { "Content-Type": uploadFile.type },
                  });
                  
                  if (!uploadRes.ok) {
                    throw new Error("Failed to upload file");
                  }
                  
                  // Step 3: Create social track record
                  const trackRes = await fetch("/api/social-tracks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      title: uploadTitle,
                      audioUrl: objectPath,
                      submitForSale,
                    }),
                  });
                  
                  if (!trackRes.ok) {
                    throw new Error("Failed to create track");
                  }
                  
                  toast({ 
                    title: "Track uploaded!", 
                    description: submitForSale 
                      ? "Your track has been submitted for admin review."
                      : "Your track is now live in Social."
                  });
                  setShowSocialUploadDialog(false);
                  refetchSocialTracks();
                } catch (error: any) {
                  toast({ 
                    title: "Upload failed", 
                    description: error.message || "Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsUploading(false);
                }
              }}
              className="bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90 font-bold"
              data-testid="button-social-upload-submit"
            >
              {isUploading ? "Uploading..." : "Upload Track"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Library Upload Dialog */}
      <Dialog open={showLibraryUploadDialog} onOpenChange={setShowLibraryUploadDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Upload to My Library</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Store private files in your personal library. These are only visible to you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="library-upload-title" className="text-sm text-zinc-300">File Name</Label>
              <Input
                id="library-upload-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Give your file a name..."
                className="bg-zinc-800 border-zinc-700 text-white"
                data-testid="input-library-upload-title"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-zinc-300">File</Label>
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-zinc-600 transition-colors cursor-pointer"
                onClick={() => document.getElementById('library-file-input')?.click()}>
                {uploadFile ? (
                  <div className="text-sm text-[#22D3EE] font-medium">{uploadFile.name}</div>
                ) : (
                  <div className="text-sm text-zinc-500">Click to select file (audio, video, documents)</div>
                )}
              </div>
              <input 
                type="file" 
                id="library-file-input"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowLibraryUploadDialog(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              disabled={!uploadTitle.trim() || !uploadFile || isUploading}
              onClick={async () => {
                if (!uploadTitle.trim() || !uploadFile) return;
                setIsUploading(true);
                try {
                  // Step 1: Get presigned URL
                  const urlRes = await fetch("/api/uploads/request-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      name: uploadFile.name,
                      size: uploadFile.size,
                      contentType: uploadFile.type,
                    }),
                  });
                  
                  if (!urlRes.ok) {
                    throw new Error("Failed to get upload URL");
                  }
                  
                  const { uploadURL, objectPath } = await urlRes.json();
                  
                  // Step 2: Upload file directly to storage
                  const uploadRes = await fetch(uploadURL, {
                    method: "PUT",
                    body: uploadFile,
                    headers: { "Content-Type": uploadFile.type },
                  });
                  
                  if (!uploadRes.ok) {
                    throw new Error("Failed to upload file");
                  }
                  
                  // Step 3: Create library item record
                  const itemRes = await fetch("/api/me/library", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      type: "upload",
                      objectPath,
                      fileSize: uploadFile.size,
                      metadata: { title: uploadTitle, artist: "You" },
                    }),
                  });
                  
                  if (!itemRes.ok) {
                    const error = await itemRes.json();
                    throw new Error(error.message || "Failed to create library item");
                  }
                  
                  refetchStorage();
                  
                  toast({ title: "File uploaded!", description: "Your file has been added to your library." });
                  setShowLibraryUploadDialog(false);
                  refetchLibraryUploads();
                } catch (error: any) {
                  toast({ 
                    title: "Upload failed", 
                    description: error.message || "Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsUploading(false);
                }
              }}
              className="bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90 font-bold"
              data-testid="button-library-upload-submit"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
