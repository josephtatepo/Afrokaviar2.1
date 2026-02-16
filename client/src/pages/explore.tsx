import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bell,
  CirclePlay,
  Clock,
  Eye,
  FileText,
  Globe,
  Headphones,
  Heart,
  Library,
  MessageCircle,
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
  Settings,
  Share2,
  Shield,
  Signal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Tv,
  Upload,
  User,
  Video,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Pause,
  Link2,
  Moon,
  Palette,
  Send,
  Sun,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useTheme, THEME_PREVIEW, type ColorTheme } from "@/lib/theme";

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

function extractYouTubeId(text: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractInstagramId(url: string): string | null {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function isYouTubeUrl(url: string): boolean {
  return !!extractYouTubeId(url);
}

function isInstagramUrl(url: string): boolean {
  return !!extractInstagramId(url);
}

type TvChannel = {
  id: string;
  name: string;
  country: string;
  channelGroup: string;
  iptvUrl: string;
  isOnline?: boolean;
  lastChecked?: string;
  validated?: boolean;
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

type SocialPost = {
  id: string;
  textContent: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  audioTitle: string | null;
  audioDuration: number | null;
  videoUrl: string | null;
  linkUrl: string | null;
  authorId: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  authorHandle: string;
  authorName: string;
  authorImage: string | null;
};

type SocialPostComment = {
  id: string;
  postId: string;
  authorId: string;
  textContent: string;
  createdAt: string;
  authorHandle: string;
  authorName: string;
  authorImage: string | null;
};

type LibraryItem = {
  id: string;
  title: string;
  artist?: string;
  kind: "upload" | "purchase" | "free";
  contentType?: string;
  objectPath?: string;
  fileSize?: number;
};

type FileCategory = "audio" | "image" | "video" | "pdf" | "unknown";

function getFileCategory(contentType?: string): FileCategory {
  if (!contentType) return "unknown";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType === "application/pdf") return "pdf";
  return "unknown";
}

function FileCategoryIcon({ category, className }: { category: FileCategory; className?: string }) {
  const cls = className || "w-5 h-5";
  switch (category) {
    case "audio": return <Music className={cls} />;
    case "image": return <ImageIcon className={cls} />;
    case "video": return <Video className={cls} />;
    case "pdf": return <FileText className={cls} />;
    default: return <Music className={cls} />;
  }
}

const ACCEPTED_FILE_TYPES = ".mp3,.m4a,.wav,.flac,.jpg,.jpeg,.png,.webp,.mp4,.webm,.pdf";
const ACCEPTED_AUDIO = ".mp3,.m4a,.wav,.flac";

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
      validated: ch.validated ?? false,
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

const NAV_ITEMS = [
  { id: 'radio-tv', label: 'Radio & TV', icon: MonitorPlay },
  { id: 'live', label: 'Live', icon: RadioIcon },
  { id: 'social', label: 'Social', icon: Globe },
  { id: 'music', label: 'Music', icon: Music2 },
  { id: 'library', label: 'My Library', icon: Library },
] as const;

export default function ExplorePage() {
  const [tab, setTab] = useState("radio-tv");
  const [query, setQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const queryClient = useQueryClient();
  const [socialView, setSocialView] = useState<"posts" | "tracks" | "clips">("posts");
  const [socialPlayingId, setSocialPlayingId] = useState<string | null>(null);

  const [fabPosition, setFabPosition] = useState({ x: -1, y: -1 });
  const fabRef = useRef<HTMLButtonElement>(null);
  const fabDragRef = useRef({ isDragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  type LastTappedContent = { tab: string; contentId: string; contentType: string; title: string; timestamp: number } | null;
  const [lastTappedContent, setLastTappedContent] = useState<LastTappedContent>(null);
  const FAB_EXPIRY_MS = 15 * 60 * 1000;

  const recordTap = (tapTab: string, contentId: string, contentType: string, title: string) => {
    setLastTappedContent({ tab: tapTab, contentId, contentType, title, timestamp: Date.now() });
  };

  const isFabValid = lastTappedContent && (Date.now() - lastTappedContent.timestamp < FAB_EXPIRY_MS);

  // Auth
  const { user, isAuthenticated } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const { colorTheme, mode, setColorTheme, toggleMode } = useTheme();
  const [showThemePanel, setShowThemePanel] = useState(false);
  const themePanelRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themePanelRef.current && !themePanelRef.current.contains(e.target as Node)) {
        setShowThemePanel(false);
      }
    }
    if (showThemePanel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showThemePanel]);

  const userEmail = user?.email ?? "member@afrokaviar.com";
  const isAdmin = !!user?.adminRole;
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
  const { data: songs = [], isLoading: songsLoading, refetch: refetchSongs } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
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

  const toggleChannelValidationMutation = useMutation({
    mutationFn: async ({ channelId, validated }: { channelId: string; validated: boolean }) => {
      const res = await fetch(`/api/admin/channels/${channelId}/validate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ validated }),
      });
      if (!res.ok) throw new Error("Failed to toggle validation");
      return res.json();
    },
    onMutate: ({ channelId, validated }) => {
      setTvChannels((prev) =>
        prev.map((ch) => (ch.id === channelId ? { ...ch, validated } : ch))
      );
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
  });
  const { data: socialPostsData = [], refetch: refetchSocialPosts } = useQuery<SocialPost[]>({
    queryKey: ["/api/social-posts"],
  });
  type ClipWithAuthor = {
    id: string;
    title: string;
    description: string | null;
    videoUrl: string;
    thumbnailUrl: string | null;
    duration: number | null;
    authorId: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    author: { id: string; handle: string | null; profileImageUrl: string | null; firstName: string | null } | null;
  };
  const { data: clipsData = [], refetch: refetchClips } = useQuery<ClipWithAuthor[]>({
    queryKey: ["/api/clips"],
    enabled: tab === "social",
  });
  const [socialSaved, setSocialSaved] = useState<Record<string, boolean>>({});

  type SavedItem = { id: string; contentType: string; contentId: string; title: string; metadata: any; savedAt: string };
  const { data: savedItemsData = [], refetch: refetchSavedItems } = useQuery<SavedItem[]>({
    queryKey: ["/api/me/saved"],
    enabled: isAuthenticated,
  });
  const savedItemsSet = useMemo(() => {
    const s = new Set<string>();
    savedItemsData.forEach((item) => s.add(`${item.contentType}:${item.contentId}`));
    return s;
  }, [savedItemsData]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkSearch, setBookmarkSearch] = useState("");
  const [bookmarkSort, setBookmarkSort] = useState<"newest" | "oldest" | "type">("newest");

  const filteredSavedItems = useMemo(() => {
    let items = [...savedItemsData];
    if (bookmarkSearch.trim()) {
      const q = bookmarkSearch.toLowerCase();
      items = items.filter((i) => i.title.toLowerCase().includes(q) || i.contentType.toLowerCase().includes(q));
    }
    if (bookmarkSort === "oldest") items.reverse();
    if (bookmarkSort === "type") items.sort((a, b) => a.contentType.localeCompare(b.contentType));
    return items;
  }, [savedItemsData, bookmarkSearch, bookmarkSort]);

  const toggleSaveItem = async (contentType: string, contentId: string, title: string) => {
    if (!isAuthenticated) {
      toast({ title: t("common.sign_in_required") || "Sign in required", variant: "destructive" });
      return;
    }
    const key = `${contentType}:${contentId}`;
    if (savedItemsSet.has(key)) {
      await fetch(`/api/me/saved/${contentType}/${contentId}`, { method: "DELETE", credentials: "include" });
    } else {
      await fetch("/api/me/saved", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ contentType, contentId, title }) });
    }
    refetchSavedItems();
  };

  // Fetch library uploads from API
  type ApiLibraryItem = {
    id: string;
    type: string;
    referenceId?: string | null;
    objectPath?: string | null;
    fileSize?: number | null;
    metadata?: { title?: string; artist?: string; contentType?: string } | null;
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
  const canUploadToLibrary = true;
  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  // Storage stats query
  const { data: storageData, refetch: refetchStorage } = useQuery<{ usedBytes: number; limitBytes: number; isAdmin: boolean }>({
    queryKey: ["/api/me/storage"],
    enabled: tab === "library" && isAuthenticated,
  });
  const storagePercent = storageData ? Math.min(Math.round((storageData.usedBytes / storageData.limitBytes) * 100), 100) : 0;
  const isStorageFull = storageData ? storageData.usedBytes >= storageData.limitBytes : false;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Music upload dialog states (admin only)
  const [showMusicUploadDialog, setShowMusicUploadDialog] = useState(false);
  const [musicUploadTitle, setMusicUploadTitle] = useState("");
  const [musicUploadArtist, setMusicUploadArtist] = useState("");
  const [musicUploadAlbum, setMusicUploadAlbum] = useState("");
  const [musicUploadGenre, setMusicUploadGenre] = useState("");
  const [musicUploadFile, setMusicUploadFile] = useState<File | null>(null);
  const [isMusicUploading, setIsMusicUploading] = useState(false);

  // Upload dialog states
  const [showSocialUploadDialog, setShowSocialUploadDialog] = useState(false);
  const [showClipUploadDialog, setShowClipUploadDialog] = useState(false);
  const [clipTitle, setClipTitle] = useState("");
  const [clipFile, setClipFile] = useState<File | null>(null);
  const [clipVideoPreview, setClipVideoPreview] = useState<string | null>(null);
  const [isClipUploading, setIsClipUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [clipLikes, setClipLikes] = useState<Record<string, boolean>>({});
  const [showLibraryUploadDialog, setShowLibraryUploadDialog] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [submitForSale, setSubmitForSale] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<"all" | "purchases" | "uploads" | "free">("all");
  const [viewingItem, setViewingItem] = useState<LibraryItem | null>(null);
  const [postText, setPostText] = useState("");
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [postAudioFile, setPostAudioFile] = useState<File | null>(null);
  const [postVideoFile, setPostVideoFile] = useState<File | null>(null);
  const [postLinkUrl, setPostLinkUrl] = useState("");
  const [isPostSubmitting, setIsPostSubmitting] = useState(false);
  const [postLikes, setPostLikes] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, SocialPostComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const postAudioInputRef = useRef<HTMLInputElement>(null);
  const postVideoInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const tvPlayerRef = useRef<HTMLDivElement | null>(null);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [radioVolume, setRadioVolume] = useState(80);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const theaterVideoRef = useRef<HTMLVideoElement | null>(null);

  const exitTheaterMode = () => {
    setIsTheaterMode(false);
    if (videoRef.current) { videoRef.current.muted = false; }
  };

  useEffect(() => {
    if (isTheaterMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isTheaterMode]);

  useEffect(() => {
    if (!isTheaterMode) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitTheaterMode();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isTheaterMode]);

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
  }, []);

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
    const hasAnyValidated = tvChannels.some((c) => c.validated === true);
    return tvChannels
      .filter((c) => isAdmin ? true : (!hasAnyValidated || c.validated === true))
      .filter((c) => (tvCountry === "all" ? true : c.country === tvCountry))
      .filter((c) => (tvGroup === "all" ? true : c.channelGroup === tvGroup))
      .filter((c) => (q ? c.name.toLowerCase().includes(q) : true));
  }, [tvChannels, tvCountry, tvGroup, query, isAdmin]);

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

  useEffect(() => {
    if (!isAuthenticated || socialPostsData.length === 0) return;
    const postIds = socialPostsData.map((p) => p.id).join(",");
    fetch(`/api/social-posts/likes?postIds=${postIds}`, { credentials: "include" })
      .then((res) => res.json())
      .then((likedIds: string[]) => {
        const likes: Record<string, boolean> = {};
        likedIds.forEach((id) => { likes[id] = true; });
        setPostLikes(likes);
      })
      .catch(() => {});
  }, [socialPostsData, isAuthenticated]);

  const fetchComments = async (postId: string) => {
    setLoadingComments((p) => ({ ...p, [postId]: true }));
    try {
      const res = await fetch(`/api/social-posts/${postId}/comments`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPostComments((p) => ({ ...p, [postId]: data }));
      }
    } catch {}
    setLoadingComments((p) => ({ ...p, [postId]: false }));
  };

  const toggleComments = (postId: string) => {
    const isExpanded = expandedComments[postId];
    setExpandedComments((p) => ({ ...p, [postId]: !isExpanded }));
    if (!isExpanded && !postComments[postId]) {
      fetchComments(postId);
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    if (!isAuthenticated) {
      toast({ title: t("social.sign_in_required") || "Sign in required", description: t("social.sign_in_comment") || "Please sign in to comment.", variant: "destructive" });
      return;
    }
    setSubmittingComment((p) => ({ ...p, [postId]: true }));
    try {
      const res = await fetch(`/api/social-posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ textContent: text }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setPostComments((p) => ({ ...p, [postId]: [newComment, ...(p[postId] || [])] }));
        setCommentTexts((p) => ({ ...p, [postId]: "" }));
        refetchSocialPosts();
      }
    } catch {
      toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
    }
    setSubmittingComment((p) => ({ ...p, [postId]: false }));
  };

  const deleteComment = async (commentId: string, postId: string) => {
    try {
      const res = await fetch(`/api/social-posts/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setPostComments((p) => ({ ...p, [postId]: (p[postId] || []).filter((c) => c.id !== commentId) }));
        refetchSocialPosts();
      }
    } catch {}
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play();
      }
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `clip-${Date.now()}.webm`, { type: 'video/webm' });
        setClipFile(file);
        setClipVideoPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 599) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            return 600;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      toast({ title: "Camera access denied", description: "Please allow camera access to record clips.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const resetClipDialog = () => {
    setClipTitle("");
    setClipFile(null);
    if (clipVideoPreview) URL.revokeObjectURL(clipVideoPreview);
    setClipVideoPreview(null);
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
  };

  const uploadClip = async () => {
    if (!clipFile || !clipTitle.trim()) return;
    if (clipFile.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 50MB.", variant: "destructive" });
      return;
    }
    setIsClipUploading(true);
    try {
      const urlRes = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: clipFile.name, size: clipFile.size, contentType: clipFile.type }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();
      const uploadRes = await fetch(uploadURL, { method: "PUT", body: clipFile, headers: { "Content-Type": clipFile.type } });
      if (!uploadRes.ok) throw new Error("Failed to upload file");
      const clipRes = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: clipTitle, videoUrl: objectPath, duration: recordingTime || null }),
      });
      if (!clipRes.ok) throw new Error("Failed to create clip");
      toast({ title: t("social.clip_uploaded") });
      setShowClipUploadDialog(false);
      resetClipDialog();
      refetchClips();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsClipUploading(false);
    }
  };

  // Merge purchased songs from entitlements with uploaded items from API
  const allLibraryItems = useMemo(() => {
    const purchasedItems: LibraryItem[] = entitlementsData
      .filter(ent => ent.song)
      .map(ent => ({
        id: `purchase-${ent.songId}`,
        title: ent.song!.title,
        artist: ent.song!.artist,
        kind: "purchase" as const,
        contentType: "audio/mpeg",
      }));
    
    const uploadedItems: LibraryItem[] = libraryUploadsData.map(item => ({
      id: item.id,
      title: (item.metadata as any)?.title || "Untitled Upload",
      artist: (item.metadata as any)?.artist || "You",
      kind: "upload" as const,
      contentType: (item.metadata as any)?.contentType || "",
      objectPath: item.objectPath || undefined,
      fileSize: item.fileSize || undefined,
    }));

    const freeItems: LibraryItem[] = libraryFreeData.map(item => ({
      id: item.id,
      title: (item.metadata as any)?.title || "Free Song",
      artist: (item.metadata as any)?.artist || "Unknown",
      kind: "free" as const,
      contentType: "audio/mpeg",
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

  function togglePlaySong(songId: string, title: string, audioUrl: string) {
    if (nowPlayingId === songId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      setNowPlaying(title);
      setNowPlayingId(songId);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => {});
      }
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-64 border-r border-zinc-800/50 hidden md:flex flex-col flex-shrink-0 bg-[#0a0a0b]">
        <div className="p-6 pb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              {user ? (
                <span className="text-[15px] tracking-[0.18em] cursor-default block" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }} data-testid="img-explore-logo">
                  AFRO<span className="text-primary mx-[4px]">•</span>KAVIAR
                </span>
              ) : (
                <Link href="/" data-testid="link-explore-home">
                  <span className="text-[15px] tracking-[0.18em]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }} data-testid="img-explore-logo">
                    AFRO<span className="text-primary mx-[4px]">•</span>KAVIAR
                  </span>
                </Link>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>Cultural Operating System</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4" data-testid="tabs-main">
          {NAV_ITEMS.map((item) => {
            const isActive = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                data-testid={`tab-${item.id}`}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative ${
                  isActive ? 'bg-accent/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors duration-200 ${isActive ? 'text-accent' : 'group-hover:text-zinc-300'}`}
                />
                <span className="text-sm font-bold tracking-tight">{item.label}</span>
                {item.id === 'live' && isActive && (
                  <span className="absolute top-2 right-3 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/50 space-y-3">
          <Link href="/profile">
            <button className="flex items-center space-x-3 text-zinc-400 hover:text-white transition-colors w-full px-3 py-2 rounded-xl hover:bg-zinc-800/30" data-testid="button-sidebar-settings">
              <Settings className="w-5 h-5" />
              <span className="text-sm font-bold">{t("common.settings")}</span>
            </button>
          </Link>
          {user && (
            <div className="flex items-center space-x-3 px-3 py-2">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User className="w-4 h-4 text-zinc-500" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">{user.firstName || user.handle || 'User'}</span>
                <span className="text-[10px] text-zinc-500 truncate">{isAdmin ? t("common.admin_role") : t("common.member_role")}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Action Button - Mobile only, navigates to last tapped content */}
      {isFabValid && (
        <div className="md:hidden">
          <button
            ref={fabRef}
            className="fixed z-[55] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-shadow active:shadow-lg touch-none select-none"
            style={{
              left: fabPosition.x === -1 ? undefined : fabPosition.x,
              bottom: fabPosition.y === -1 ? undefined : fabPosition.y,
              right: fabPosition.x === -1 ? '1rem' : undefined,
              ...(fabPosition.y === -1 ? { bottom: '5.5rem' } : {}),
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
            }}
            data-testid="fab-navigate-back"
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const rect = fabRef.current?.getBoundingClientRect();
              if (!rect) return;
              fabDragRef.current = {
                isDragging: false,
                startX: touch.clientX,
                startY: touch.clientY,
                startPosX: rect.left,
                startPosY: window.innerHeight - rect.bottom,
              };
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              const dx = touch.clientX - fabDragRef.current.startX;
              const dy = touch.clientY - fabDragRef.current.startY;
              if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                fabDragRef.current.isDragging = true;
              }
              if (fabDragRef.current.isDragging) {
                e.preventDefault();
                const newX = Math.max(0, Math.min(window.innerWidth - 56, fabDragRef.current.startPosX + dx));
                const newY = Math.max(64, Math.min(window.innerHeight - 120, fabDragRef.current.startPosY - dy));
                setFabPosition({ x: newX, y: newY });
              }
            }}
            onTouchEnd={() => {
              if (!fabDragRef.current.isDragging && lastTappedContent) {
                setTab(lastTappedContent.tab);
                setTimeout(() => {
                  const el = document.querySelector(`[data-content-id="${lastTappedContent.contentId}"]`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 150);
              }
              fabDragRef.current.isDragging = false;
            }}
            onClick={() => {
              if (lastTappedContent) {
                setTab(lastTappedContent.tab);
                setTimeout(() => {
                  const el = document.querySelector(`[data-content-id="${lastTappedContent.contentId}"]`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 150);
              }
            }}
          >
            <ArrowUp className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0b]/95 backdrop-blur-xl border-t border-zinc-800/60">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                data-testid={`tab-mobile-${item.id}`}
                className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-accent' : 'text-zinc-500'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-bold mt-0.5">{item.label.replace(' & ', '/')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/30 bg-[#0a0a0b]/80 backdrop-blur-md shrink-0">
          <div className="md:hidden">
            <span className="text-[13px] tracking-[0.18em]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }} data-testid="img-explore-logo-mobile">
              AFRO<span className="text-primary mx-[3px]">•</span>KAVIAR
            </span>
          </div>
          <div className="relative flex-1 max-w-xl mx-auto hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="h-10 w-full pl-9 bg-zinc-900/50 border-zinc-800/80 text-white placeholder:text-white/35 rounded-full"
              data-testid="input-global-search"
            />
          </div>
          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden h-9 w-9 rounded-full flex items-center justify-center bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10 transition-all"
              data-testid="button-mobile-search"
            >
              <Search size={15} />
            </button>
            <div className="relative" ref={themePanelRef}>
              <button
                onClick={() => setShowThemePanel(!showThemePanel)}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10 transition-all"
                data-testid="button-theme-toggle"
              >
                <Palette size={15} />
              </button>
              {showThemePanel && (
                <div className="absolute right-0 top-12 z-50 w-48 bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-2xl p-3 space-y-3">
                  <div className="space-y-1.5">
                    {(["cyan-gold", "ember-warm", "sage-earth"] as ColorTheme[]).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => { setColorTheme(theme); setShowThemePanel(false); }}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                          colorTheme === theme ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                        data-testid={`button-header-theme-${theme}`}
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_PREVIEW[theme].primary }} />
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_PREVIEW[theme].accent }} />
                        </div>
                        <span>{theme.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" & ")}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-zinc-700/40 pt-2">
                    <button
                      onClick={() => { toggleMode(); setShowThemePanel(false); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                      data-testid="button-header-mode-toggle"
                    >
                      {mode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                      <span>{mode === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowBookmarks(!showBookmarks)}
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm transition-all border ${showBookmarks ? 'bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/30' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border-white/10'}`}
                data-testid="button-bookmarks-toggle"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleLang}
              className="h-9 px-3 rounded-full text-xs font-bold bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10 transition-all"
              data-testid="button-lang-toggle"
            >
              {lang === "en" ? "FR" : "EN"}
            </button>
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
                  <span className="hidden sm:inline">{t("common.profile")}</span>
                </Button>
              </Link>
            ) : (
              <Link href="/auth" data-testid="link-signin">
                <Button
                  size="sm"
                  className="h-9 px-5 bg-cyan-500 text-black font-bold hover:bg-cyan-400"
                  data-testid="button-signin"
                >
                  {t("common.sign_in")}
                </Button>
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" data-testid="link-admin">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-3 text-primary/70 bg-primary/10 hover:text-white hover:bg-primary"
                  data-testid="button-admin"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{t("common.admin")}</span>
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="fixed inset-0 z-50 md:hidden" data-testid="overlay-mobile-search">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => { setMobileSearchOpen(false); }}
            />
            <div className="relative z-10 flex flex-col h-full px-4 pt-4 pb-6 pointer-events-none">
              <div className="pointer-events-auto">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                    <Input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("search.placeholder")}
                      className="h-11 w-full pl-9 bg-zinc-900/80 border-zinc-700/60 text-white placeholder:text-white/35 rounded-full"
                      data-testid="input-mobile-search"
                    />
                  </div>
                  <button
                    onClick={() => { setMobileSearchOpen(false); setQuery(""); }}
                    className="h-9 w-9 rounded-full flex items-center justify-center bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10 transition-all shrink-0"
                    data-testid="button-close-mobile-search"
                  >
                    <X size={16} />
                  </button>
                </div>

                {query.trim().length > 0 && (
                  <div className="bg-zinc-900/90 border border-zinc-700/50 rounded-2xl p-3 max-h-[70vh] overflow-y-auto space-y-1">
                    {(() => {
                      const q = query.trim().toLowerCase();
                      const results: { type: string; icon: React.ReactNode; label: string; action: () => void }[] = [];

                      filteredTv.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5).forEach(c => {
                        results.push({
                          type: "tv",
                          icon: <Tv className="w-4 h-4 text-cyan-400 shrink-0" />,
                          label: c.name,
                          action: () => { setTab("radio-tv"); setPlayingChannelId(c.id); setMobileSearchOpen(false); setQuery(""); },
                        });
                      });

                      filteredSongs.filter(s => `${s.title} ${s.artist}`.toLowerCase().includes(q)).slice(0, 5).forEach(s => {
                        results.push({
                          type: "music",
                          icon: <Music className="w-4 h-4 text-amber-400 shrink-0" />,
                          label: `${s.title} — ${s.artist}`,
                          action: () => { setTab("music"); setMobileSearchOpen(false); },
                        });
                      });

                      filteredSocial.filter((t: any) => t.title.toLowerCase().includes(q)).slice(0, 3).forEach((t: any) => {
                        results.push({
                          type: "social",
                          icon: <Headphones className="w-4 h-4 text-purple-400 shrink-0" />,
                          label: t.title,
                          action: () => { setTab("social"); setMobileSearchOpen(false); },
                        });
                      });

                      const libQ = allLibraryItems.filter((item: any) => {
                        const meta = item.metadata as any;
                        const name = meta?.name || meta?.title || item.type || "";
                        return name.toLowerCase().includes(q);
                      }).slice(0, 5);
                      libQ.forEach((item: any) => {
                        const meta = item.metadata as any;
                        const name = meta?.name || meta?.title || item.type || "File";
                        const ct = (meta?.contentType || "") as string;
                        let icon = <FileText className="w-4 h-4 text-zinc-400 shrink-0" />;
                        if (ct.startsWith("audio")) icon = <Music className="w-4 h-4 text-amber-400 shrink-0" />;
                        else if (ct.startsWith("video")) icon = <Video className="w-4 h-4 text-rose-400 shrink-0" />;
                        else if (ct.startsWith("image")) icon = <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />;
                        else if (ct.includes("pdf")) icon = <FileText className="w-4 h-4 text-orange-400 shrink-0" />;
                        results.push({
                          type: "library",
                          icon,
                          label: name,
                          action: () => { setTab("library"); setMobileSearchOpen(false); },
                        });
                      });

                      if (results.length === 0) {
                        return (
                          <div className="text-center py-6 text-white/30 text-sm">
                            {t("common.no_results")} "{query}"
                          </div>
                        );
                      }

                      return results.map((r, i) => (
                        <button
                          key={`${r.type}-${i}`}
                          onClick={r.action}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/10 transition-colors"
                          data-testid={`search-result-${r.type}-${i}`}
                        >
                          {r.icon}
                          <span className="text-sm text-white truncate">{r.label}</span>
                          <span className="ml-auto text-[10px] uppercase tracking-wider text-white/30 shrink-0">{r.type}</span>
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showBookmarks && (
          <div className="border-b border-zinc-800/60 bg-[#0a0a0b]/95 backdrop-blur-xl">
            <div className="mx-auto w-full max-w-6xl px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2" data-testid="text-bookmarks-title">
                  <Bookmark className="w-4 h-4 text-[hsl(var(--primary))]" />
                  {t("saved.title") || "Saved Items"}
                  <span className="text-xs text-zinc-500 font-normal">({savedItemsData.length}/100)</span>
                </h3>
                <button onClick={() => setShowBookmarks(false)} className="text-zinc-500 hover:text-white p-1" data-testid="button-bookmarks-close">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {savedItemsData.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      value={bookmarkSearch}
                      onChange={(e) => setBookmarkSearch(e.target.value)}
                      placeholder={lang === "fr" ? "Rechercher..." : "Search saved..."}
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-700/50 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[hsl(var(--primary))]/50"
                      data-testid="input-bookmarks-search"
                    />
                  </div>
                  <select
                    value={bookmarkSort}
                    onChange={(e) => setBookmarkSort(e.target.value as "newest" | "oldest" | "type")}
                    className="bg-zinc-900 border border-zinc-700/50 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none"
                    data-testid="select-bookmarks-sort"
                  >
                    <option value="newest">{lang === "fr" ? "Récent" : "Newest"}</option>
                    <option value="oldest">{lang === "fr" ? "Ancien" : "Oldest"}</option>
                    <option value="type">Type</option>
                  </select>
                </div>
              )}
              {savedItemsData.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center" data-testid="text-bookmarks-empty">{t("saved.empty") || "No saved items yet"}</p>
              ) : filteredSavedItems.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center" data-testid="text-bookmarks-no-results">{lang === "fr" ? "Aucun résultat" : "No results"}</p>
              ) : (
                <div className="space-y-1.5 max-h-[40vh] overflow-y-auto scrollbar-custom" data-testid="list-bookmarks">
                  {filteredSavedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all group" data-testid={`row-bookmark-${item.id}`}>
                      <button
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        data-testid={`button-bookmark-navigate-${item.id}`}
                        onClick={() => {
                          const targetTab = item.contentType === "channel" ? "radio-tv" : item.contentType === "song" ? "music" : "social";
                          setTab(targetTab);
                          setShowBookmarks(false);
                          setTimeout(() => {
                            const contentId = item.contentType === "channel" ? item.contentId : `${item.contentType}-${item.contentId}`;
                            const el = document.querySelector(`[data-content-id="${contentId}"]`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 200);
                        }}
                      >
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          {item.contentType === "post" && <MessageCircle className="w-3.5 h-3.5 text-zinc-400" />}
                          {item.contentType === "track" && <Music className="w-3.5 h-3.5 text-zinc-400" />}
                          {item.contentType === "clip" && <Video className="w-3.5 h-3.5 text-zinc-400" />}
                          {item.contentType === "channel" && <Tv className="w-3.5 h-3.5 text-zinc-400" />}
                          {item.contentType === "song" && <Music2 className="w-3.5 h-3.5 text-zinc-400" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm text-white truncate block">{item.title}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.contentType}</span>
                        </div>
                      </button>
                      <button
                        className="p-1.5 rounded-full text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => toggleSaveItem(item.contentType, item.contentId, item.title)}
                        data-testid={`button-bookmark-remove-${item.id}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="mx-auto w-full max-w-6xl px-6 py-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="hidden">
                {NAV_ITEMS.map((item) => (
                  <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>
                ))}
              </TabsList>

                <TabsContent value="radio-tv" className="mt-0">
                  <div className="grid gap-6 lg:grid-cols-5">
                    <div className="lg:col-span-3 text-white" ref={tvPlayerRef}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-display text-lg text-white" data-testid="text-player-title">
                            {activeChannel ? activeChannel.name : "Radio & TV"}
                          </div>
                          <div className="text-xs text-white/55" data-testid="text-player-subtitle">
                            {activeChannel
                              ? `${activeChannel.country} • ${activeChannel.channelGroup}`
                              : t("radio.select_channel")}
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
                              onClick={() => {
                                if (videoRef.current) { videoRef.current.pause(); videoRef.current.muted = true; }
                                setIsTheaterMode(true);
                              }}
                              className="p-2 rounded-lg transition-all bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                              title="Theater Mode"
                              data-testid="button-theater"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={togglePiP}
                              className={`p-2 rounded-lg transition-all ${isPiPActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/55 hover:bg-white/10 hover:text-white'}`}
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
                                  We'll validate streams as you play them.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="rounded-xl border border-white/10 p-3" data-testid="panel-radio">
                          <div className="w-full select-none">
                            <div className="flex items-center space-x-3 mb-5 px-2">
                              <div className="p-1.5 bg-accent/10 rounded-lg">
                                <RadioIcon className="w-4 h-4 text-accent" />
                              </div>
                              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500" data-testid="text-radio-title">
                                Live Radio
                              </h2>
                            </div>
                            
                            <div className="relative bg-[#0d0d0f] rounded-2xl border border-zinc-800/60 p-6 md:p-10 flex items-center overflow-hidden group transition-all duration-300 min-h-[163px]">
                              <div 
                                className="absolute top-6 bottom-2 left-[26px] right-[26px] overflow-hidden rounded-xl"
                                style={{ zIndex: 1 }}
                                dangerouslySetInnerHTML={{ __html: radioEmbedCode }}
                              />
                              <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent/5 blur-[80px] pointer-events-none group-hover:bg-accent/10 transition-colors duration-1000" />
                              <div className="absolute top-6 right-4 z-10 flex items-center space-x-2">
                                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t("radio.on_air")}</span>
                              </div>
                            </div>
                          </div>

                          {isAdmin && (
                            <div className="mt-3 grid gap-2">
                              <Label className="text-xs text-white/55" data-testid="label-radio-embed">
                                {t("radio.paste_embed")}
                              </Label>
                              <textarea
                                value={radioEmbedCode}
                                onChange={(e) => setRadioEmbedCode(e.target.value)}
                                className="rounded-md bg-black/30 p-2 text-xs text-white/80 border border-white/10 h-20"
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
                          {t("radio.tv_channels")}
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
                                {t("radio.country")}
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
                                {t("radio.content_type")}
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
                            {t("radio.loading")}
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
                                  onClick={() => { setStreamError(null); setPlayingChannelId(c.id); recordTap("radio-tv", c.id, "channel", c.name); setTimeout(() => { const el = tvPlayerRef.current; if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); } }, 150); }}
                                  data-testid={`row-tv-channel-${c.id}`}
                                  data-content-id={c.id}
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
                                    <div className="flex items-center gap-2">
                                      {isAdmin && (
                                        <span
                                          role="button"
                                          className="cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleChannelValidationMutation.mutate({ channelId: c.id, validated: !c.validated });
                                          }}
                                          data-testid={`button-tv-validate-${c.id}`}
                                        >
                                          <Heart
                                            className={
                                              "h-4 w-4 transition " +
                                              (c.validated ? "fill-red-500 text-red-500" : "text-white/40 hover:text-red-400")
                                            }
                                          />
                                        </span>
                                      )}
                                      <div
                                        className={
                                          "flex items-center justify-center w-9 h-9 rounded-full transition-all " +
                                          (active
                                            ? "bg-accent text-black shadow-[0_0_12px_rgba(244,190,68,0.4)]"
                                            : "bg-white/10 text-white hover:bg-accent hover:text-black hover:shadow-[0_0_12px_rgba(244,190,68,0.3)]")
                                        }
                                        data-testid={`badge-tv-active-${c.id}`}
                                      >
                                        {active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                      </div>
                                    </div>
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
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white" data-testid="text-live-title">
                          {t("live.title")}
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium max-w-md leading-relaxed" data-testid="text-live-desc">
                          {t("live.desc")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full font-bold text-sm transition-all transform active:scale-95"
                          data-testid="button-live-notify"
                        >
                          <Bell className="w-4 h-4" />
                          <span>{t("live.get_notified")}</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#121214] rounded-3xl border border-zinc-800/60 overflow-hidden mb-6">
                      <div className="px-6 py-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                          <RadioIcon className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t("live.coming_soon")}</h2>
                        <p className="text-zinc-400 text-sm max-w-md mx-auto">
                          {t("live.coming_soon_desc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">
                      <div className="flex items-center space-x-6">
                        <span className="text-zinc-600">{t("common.total")}: 3 {t("live.upcoming")}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-zinc-600">
                        <span>{t("live.stay_tuned")}</span>
                      </div>
                    </div>

                    <div className="bg-[#121214] rounded-3xl border border-zinc-800/60 overflow-hidden">
                      <div className="grid grid-cols-[60px_1fr_100px_100px] items-center px-6 py-4 border-b border-zinc-800/80 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-black/20">
                        <div className="text-center">#</div>
                        <div>{t("live.event_desc")}</div>
                        <div className="hidden sm:block px-4">{t("live.date")}</div>
                        <div className="text-right pr-2">{t("live.action")}</div>
                      </div>

                      <div className="divide-y divide-zinc-800/40">
                        {[
                          { title: t("live.diaspora_lounge"), date: t("live.coming_soon"), desc: t("live.diaspora_desc") },
                          { title: t("live.artist_drop"), date: t("live.coming_soon"), desc: t("live.artist_desc") },
                          { title: t("live.afrobeats"), date: t("live.coming_soon"), desc: t("live.afrobeats_desc") },
                        ].map((e, idx) => (
                          <div 
                            key={idx}
                            className="group grid grid-cols-[60px_1fr_100px_100px] items-center px-6 py-5 hover:bg-white/[0.04] transition-all duration-200 cursor-default"
                            data-testid={`row-live-${idx}`}
                          >
                            <div className="flex justify-center">
                              <div className="relative w-9 h-9 flex items-center justify-center">
                                <span className="text-zinc-500 font-bold font-mono text-sm">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-5 overflow-hidden">
                              <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700/50 group-hover:border-primary/30 transition-all relative overflow-hidden" data-testid={`img-live-thumb-${idx}`}>
                                <RadioIcon className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-white text-base truncate group-hover:text-primary/90 transition-colors" data-testid={`text-live-card-title-${idx}`}>
                                  {e.title}
                                </span>
                                <span className="text-sm text-zinc-400 font-medium truncate group-hover:text-zinc-300" data-testid={`text-live-card-desc-${idx}`}>
                                  {e.desc}
                                </span>
                              </div>
                            </div>

                            <div className="hidden sm:block px-2 text-sm text-zinc-500 group-hover:text-zinc-300" data-testid={`text-live-date-${idx}`}>
                              {e.date}
                            </div>

                            <div className="flex items-center justify-end">
                              <button
                                className="px-4 py-2 text-xs font-bold bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-all border border-zinc-700"
                                data-testid={`button-live-remind-${idx}`}
                              >
                                {t("live.remind_me")}
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
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white" data-testid="text-music-title">
                          {t("music.title")}
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium max-w-md leading-relaxed" data-testid="text-music-desc">
                          {t("music.desc_full")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select value={musicFilter} onValueChange={setMusicFilter}>
                          <SelectTrigger className="h-11 bg-zinc-900 border-zinc-700 text-white rounded-full px-5" data-testid="select-music-filter">
                            <SelectValue placeholder="Filter" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                            <SelectItem value="all" data-testid="option-music-filter-all">{t("common.all")}</SelectItem>
                            <SelectItem value="favorites" data-testid="option-music-filter-favorites">{t("music.favourites")}</SelectItem>
                          </SelectContent>
                        </Select>
                        {isAdmin && (
                          <button 
                            className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full font-bold text-sm transition-all transform active:scale-95 whitespace-nowrap"
                            data-testid="button-music-add"
                            onClick={() => setShowMusicUploadDialog(true)}
                          >
                            <Upload className="w-4 h-4" />
                            <span>{t("music.upload_song")}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {nowPlaying && (
                      <div className="bg-[#121214] rounded-2xl border border-zinc-800/60 p-4 mb-4 flex items-center justify-between" data-testid="panel-music-player">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700/50">
                            <Music className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">{t("music.now_playing")}</div>
                            <div className="font-bold text-white text-sm truncate max-w-[250px]">{nowPlaying}</div>
                          </div>
                        </div>
                        <button
                          className={`p-2.5 rounded-full transition-all transform hover:scale-110 ${isPlaying ? 'bg-primary text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                          data-testid="button-music-toggleplay"
                          onClick={() => {
                            if (audioRef.current) {
                              if (isPlaying) {
                                audioRef.current.pause();
                                setIsPlaying(false);
                              } else {
                                audioRef.current.play().catch(() => {});
                                setIsPlaying(true);
                              }
                            }
                          }}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">
                      <div className="flex items-center space-x-6">
                        <span className="text-zinc-600">{t("common.total")}: {filteredSongs.length} {t("music.total_tracks")}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-zinc-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t("music.purchase_keep")}</span>
                      </div>
                    </div>

                    <div className="bg-[#121214] rounded-3xl border border-zinc-800/60 overflow-hidden ">
                      <div className="grid grid-cols-[60px_1fr_80px_100px_140px] items-center px-6 py-4 border-b border-zinc-800/80 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-black/20">
                        <div className="text-center">#</div>
                        <div>{t("library.title_artist")}</div>
                        <div className="hidden sm:block px-2">{t("library.time")}</div>
                        <div className="hidden md:block px-2">{t("library.genre")}</div>
                        <div className="text-right pr-2">{t("library.actions")}</div>
                      </div>
                      <div className="divide-y divide-zinc-800/40">
                        {songsLoading ? (
                          <div className="px-6 py-8 text-sm text-zinc-400" data-testid="status-music-loading">
                            {t("music.loading")}
                          </div>
                        ) : filteredSongs.length === 0 ? (
                          <div className="px-6 py-8 text-sm text-zinc-400" data-testid="status-music-empty">
                            {t("music.no_songs")}
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
                                data-content-id={`song-${s.id}`}
                              >
                                <div className="flex justify-center">
                                  <div className="relative w-9 h-9 flex items-center justify-center">
                                    <span className="absolute text-zinc-500 group-hover:opacity-0 transition-opacity font-bold font-mono text-sm">
                                      {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <button 
                                      className="absolute opacity-0 group-hover:opacity-100 bg-primary rounded-full text-black p-2 transition-all transform scale-50 group-hover:scale-100  hover:bg-primary/90"
                                      onClick={() => { togglePlaySong(s.id, `${s.title} — ${s.artist}`, s.audioUrl); recordTap("music", `song-${s.id}`, "song", s.title); }}
                                      data-testid={`button-song-play-${s.id}`}
                                    >
                                      {nowPlayingId === s.id && isPlaying ? (
                                        <Pause className="w-4 h-4 fill-current" />
                                      ) : (
                                        <Play className="w-4 h-4 fill-current ml-0.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-5 overflow-hidden">
                                  <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700/50 group-hover:border-primary/30 transition-all  relative overflow-hidden" data-testid={`img-song-thumb-${s.id}`}>
                                    {s.artworkUrl ? (
                                      <img src={s.artworkUrl} alt={s.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <Music className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white text-base truncate group-hover:text-primary/90 transition-colors" data-testid={`text-song-title-${s.id}`}>
                                        {s.title}
                                      </span>
                                      {isNew(s.createdAt) && (
                                        <Badge className="bg-primary/20 text-primary border border-primary/30 text-[10px]" data-testid={`badge-song-new-${s.id}`}>
                                          {t("music.new")}
                                        </Badge>
                                      )}
                                      {ownedSongs[s.id] && (
                                        <Badge className="bg-primary/20 text-primary border border-primary/30 text-[10px]" data-testid={`badge-song-owned-${s.id}`}>
                                          {t("music.owned")}
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

                                <div className="hidden sm:block px-2 text-sm text-zinc-400 group-hover:text-zinc-200 font-mono tracking-tighter" data-testid={`text-song-duration-${s.id}`}>
                                  {formatDuration(s.duration)}
                                </div>

                                <div className="hidden md:block px-2 text-sm text-zinc-500 group-hover:text-zinc-300" data-testid={`text-song-genre-${s.id}`}>
                                  {s.genre ?? "—"}
                                </div>

                                <div className="flex items-center space-x-2 justify-end pr-2">
                                  <button 
                                    className={`p-2.5 rounded-full transition-all hover:scale-110 ${reaction === "up" ? 'text-primary' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
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
                                    className={`p-2.5 rounded-full transition-all hover:scale-110 ${fav ? 'text-primary' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
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
                                      {t("music.owned")}
                                    </button>
                                  ) : isPaid ? (
                                    <button
                                      className="px-3 py-1.5 text-xs font-bold rounded-full bg-primary text-black hover:bg-primary/90 transition-all transform active:scale-95"
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
                                      {t("music.in_library")}
                                    </button>
                                  ) : (
                                    <button
                                      className="px-3 py-1.5 text-xs font-bold rounded-full bg-accent text-black hover:bg-accent/80 transition-all transform active:scale-95"
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
                                      {addFreeSongMutation.isPending ? "..." : t("music.add_to_library")}
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <button
                                      className="p-1.5 rounded-full text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-all hover:scale-110"
                                      data-testid={`button-song-delete-${s.id}`}
                                      onClick={async () => {
                                        if (!confirm("Delete this song from the Music section?")) return;
                                        try {
                                          const res = await fetch(`/api/songs/${s.id}`, { method: "DELETE", credentials: "include" });
                                          if (!res.ok) throw new Error();
                                          toast({ title: "Song deleted" });
                                          refetchSongs();
                                        } catch {
                                          toast({ title: "Failed to delete song", variant: "destructive" });
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                      <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white" data-testid="text-social-title">
                          {t("social.title")}
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium max-w-md leading-relaxed" data-testid="text-social-desc">
                          {t("social.desc")}
                        </p>
                      </div>
                      <button 
                        className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-full font-bold text-sm transition-all transform active:scale-95"
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
                        <span>{t("social.upload_track")}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-6" data-testid="social-view-toggle">
                      <button
                        onClick={() => setSocialView("posts")}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                          socialView === "posts"
                            ? "bg-accent text-black"
                            : "bg-zinc-800/60 text-zinc-200 hover:text-white hover:bg-zinc-700/60"
                        }`}
                        data-testid="button-social-posts"
                      >
                        {t("social.posts")}
                      </button>
                      <button
                        onClick={() => setSocialView("tracks")}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                          socialView === "tracks"
                            ? "bg-accent text-black"
                            : "bg-zinc-800/60 text-zinc-200 hover:text-white hover:bg-zinc-700/60"
                        }`}
                        data-testid="button-social-tracks"
                      >
                        {t("social.tracks")}
                      </button>
                      <button
                        onClick={() => setSocialView("clips")}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                          socialView === "clips"
                            ? "bg-accent text-black"
                            : "bg-zinc-800/60 text-zinc-200 hover:text-white hover:bg-zinc-700/60"
                        }`}
                        data-testid="button-social-clips"
                      >
                        {t("social.clips")}
                      </button>
                    </div>

                    {isAuthenticated && mySubmissions.length > 0 && (
                      <div className="mb-6 bg-[#121214] rounded-2xl border border-zinc-800/60 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Upload className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-white">{t("social.my_submissions")}</span>
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
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                  sub.status === "approved" ? "bg-green-500/20 text-green-400" :
                                  sub.status === "rejected" ? "bg-red-500/20 text-red-400" :
                                  "bg-yellow-500/20 text-yellow-400"
                                }`} data-testid={`badge-status-${sub.id}`}>
                                  {sub.status}
                                </span>
                                {sub.status === "pending" && (
                                  <button
                                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                                    data-testid={`button-cancel-submission-${sub.id}`}
                                    onClick={async () => {
                                      if (!confirm("Cancel this submission?")) return;
                                      try {
                                        const res = await fetch(`/api/social-tracks/${sub.id}`, { method: "DELETE", credentials: "include" });
                                        if (!res.ok) throw new Error();
                                        toast({ title: "Submission cancelled" });
                                        refetchSocialTracks();
                                      } catch {
                                        toast({ title: "Failed to cancel", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {socialView === "posts" && (
                      <div className="max-w-3xl mx-auto space-y-8">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">
                          <span className="text-zinc-600">Total: {socialPostsData.length} posts</span>
                          <div className="flex items-center space-x-2 text-zinc-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Last Sync: Just now</span>
                          </div>
                        </div>
                        {isAuthenticated && (
                          <div className="bg-[#121214] border border-zinc-800/80 rounded-[2rem] p-6 shadow-2xl" data-testid="social-post-composer">
                            <p className="text-xs text-zinc-500 font-medium mb-3 uppercase tracking-widest">{t("social.posts")} · {t("social.audio")} · {t("social.image")} · {t("social.video")}</p>
                            <div className="flex space-x-4">
                              <div className="w-12 h-12 rounded-2xl bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                                {user?.profileImageUrl ? (
                                  <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-zinc-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <textarea 
                                  placeholder={t("social.post_placeholder")}
                                  className="w-full bg-transparent border-none resize-none focus:ring-0 text-sm text-foreground placeholder:text-zinc-500 pt-2 h-24 outline-none leading-snug"
                                  value={postText}
                                  onChange={(e) => { if (e.target.value.length <= 3600) setPostText(e.target.value); }}
                                  maxLength={3600}
                                  data-testid="input-social-post-text"
                                />
                                {postText.length > 0 && (
                                  <div className={`text-right text-[11px] font-mono mt-0.5 ${postText.length > 3400 ? 'text-red-400' : postText.length > 3000 ? 'text-amber-400' : 'text-zinc-500'}`} data-testid="text-post-char-count">
                                    {3600 - postText.length} {t("common.characters_left")}
                                  </div>
                                )}
                                {postImagePreview && (
                                  <div className="relative mt-2 rounded-xl overflow-hidden border border-zinc-800/50">
                                    <img src={postImagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
                                    <button
                                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 hover:bg-black/90 transition-colors"
                                      onClick={() => { setPostImageFile(null); setPostImagePreview(null); }}
                                      data-testid="button-post-image-remove"
                                    >
                                      <Plus className="w-4 h-4 rotate-45" />
                                    </button>
                                  </div>
                                )}
                                {postAudioFile && (
                                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800/50">
                                    <Music className="w-4 h-4 text-accent" />
                                    <span className="text-sm text-zinc-300 truncate flex-1">{postAudioFile.name}</span>
                                    <button
                                      className="text-zinc-500 hover:text-white transition-colors"
                                      onClick={() => setPostAudioFile(null)}
                                      data-testid="button-post-audio-remove"
                                    >
                                      <Plus className="w-4 h-4 rotate-45" />
                                    </button>
                                  </div>
                                )}
                                {postVideoFile && (
                                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800/50">
                                    <Video className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm text-zinc-300 truncate flex-1">{postVideoFile.name}</span>
                                    <button
                                      className="text-zinc-500 hover:text-white transition-colors"
                                      onClick={() => setPostVideoFile(null)}
                                      data-testid="button-post-video-remove"
                                    >
                                      <Plus className="w-4 h-4 rotate-45" />
                                    </button>
                                  </div>
                                )}
                                {postLinkUrl && (
                                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-xl border border-zinc-800/50">
                                    <Link2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-zinc-300 truncate flex-1">{postLinkUrl}</span>
                                    <button
                                      className="text-zinc-500 hover:text-white transition-colors"
                                      onClick={() => setPostLinkUrl("")}
                                      data-testid="button-post-link-remove"
                                    >
                                      <Plus className="w-4 h-4 rotate-45" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <input
                              ref={postImageInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setPostImageFile(file);
                                  setPostImagePreview(URL.createObjectURL(file));
                                }
                                e.target.value = "";
                              }}
                              data-testid="input-post-image-file"
                            />
                            <input
                              ref={postAudioInputRef}
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setPostAudioFile(file);
                                e.target.value = "";
                              }}
                              data-testid="input-post-audio-file"
                            />
                            <input
                              ref={postVideoInputRef}
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setPostVideoFile(file);
                                e.target.value = "";
                              }}
                              data-testid="input-post-video-file"
                            />
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
                              <div className="flex items-center space-x-2">
                                <button 
                                  className="flex items-center md:space-x-2 px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors text-purple-400"
                                  onClick={() => postVideoInputRef.current?.click()}
                                  data-testid="button-post-video"
                                >
                                  <Video className="w-4 h-4" />
                                  <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-zinc-400">{t("social.video")}</span>
                                </button>
                                <button
                                  className="flex items-center md:space-x-2 px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors text-blue-400"
                                  onClick={() => postImageInputRef.current?.click()}
                                  data-testid="button-post-image"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-zinc-400">{t("social.image")}</span>
                                </button>
                                <button 
                                  className="flex items-center md:space-x-2 px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors text-accent"
                                  onClick={() => postAudioInputRef.current?.click()}
                                  data-testid="button-post-audio"
                                >
                                  <Play className="w-4 h-4" />
                                  <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-zinc-400">{t("social.audio")}</span>
                                </button>
                                <div className="h-5 w-px bg-zinc-700/50" />
                                <div className="relative group/link">
                                  <button 
                                    className="flex items-center md:space-x-2 px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors text-emerald-400"
                                    onClick={() => {
                                      const url = prompt("Paste a link (YouTube, Instagram, or any URL):");
                                      if (url && url.trim()) setPostLinkUrl(url.trim());
                                    }}
                                    data-testid="button-post-link"
                                  >
                                    <Link2 className="w-4 h-4" />
                                    <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest text-zinc-400">Link</span>
                                  </button>
                                </div>
                              </div>
                              <button 
                                className="bg-accent hover:bg-accent/80 text-black px-4 md:px-8 py-2.5 rounded-full font-black text-sm transition-all transform active:scale-95 shadow-lg shadow-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                data-testid="button-post-submit"
                                disabled={isPostSubmitting || (!postText.trim() && !postImageFile && !postAudioFile && !postVideoFile && !postLinkUrl)}
                                onClick={async () => {
                                  if (!postText.trim() && !postImageFile && !postAudioFile && !postVideoFile && !postLinkUrl) return;
                                  setIsPostSubmitting(true);
                                  try {
                                    let imageUrl: string | null = null;
                                    let audioUrl: string | null = null;
                                    let audioTitle: string | null = null;
                                    let audioDuration: number | null = null;

                                    if (postImageFile) {
                                      const urlRes = await fetch("/api/uploads/request-url", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({ name: postImageFile.name, size: postImageFile.size, contentType: postImageFile.type }),
                                      });
                                      const urlData = await urlRes.json();
                                      await fetch(urlData.uploadURL, { method: "PUT", body: postImageFile });
                                      imageUrl = urlData.objectPath;
                                    }

                                    if (postAudioFile) {
                                      const urlRes = await fetch("/api/uploads/request-url", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({ name: postAudioFile.name, size: postAudioFile.size, contentType: postAudioFile.type }),
                                      });
                                      const urlData = await urlRes.json();
                                      await fetch(urlData.uploadURL, { method: "PUT", body: postAudioFile });
                                      audioUrl = urlData.objectPath;
                                      audioTitle = postAudioFile.name.replace(/\.[^/.]+$/, "");
                                    }

                                    let videoUrl: string | null = null;
                                    if (postVideoFile) {
                                      const urlRes = await fetch("/api/uploads/request-url", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({ name: postVideoFile.name, size: postVideoFile.size, contentType: postVideoFile.type }),
                                      });
                                      const urlData = await urlRes.json();
                                      await fetch(urlData.uploadURL, { method: "PUT", body: postVideoFile });
                                      videoUrl = urlData.objectPath;
                                    }

                                    const res = await fetch("/api/social-posts", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      credentials: "include",
                                      body: JSON.stringify({ textContent: postText.trim() || null, imageUrl, audioUrl, audioTitle, audioDuration, videoUrl, linkUrl: postLinkUrl || null }),
                                    });
                                    if (!res.ok) throw new Error("Failed to create post");

                                    setPostText("");
                                    setPostImageFile(null);
                                    setPostImagePreview(null);
                                    setPostAudioFile(null);
                                    setPostVideoFile(null);
                                    setPostLinkUrl("");
                                    refetchSocialPosts();
                                    toast({ title: "Posted!", description: "Your post is now live." });
                                  } catch (err) {
                                    toast({ title: "Error", description: "Failed to create post. Please try again.", variant: "destructive" });
                                  } finally {
                                    setIsPostSubmitting(false);
                                  }
                                }}
                              >
                                {isPostSubmitting ? t("social.posting") : t("social.post_btn")}
                              </button>
                            </div>
                          </div>
                        )}

                        {socialPostsData.map((post) => {
                          const liked = !!postLikes[post.id];
                          const isSocialPlaying = socialPlayingId === post.id;
                          return (
                            <article key={post.id} className="bg-[#121214] border border-zinc-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-zinc-700/50" data-testid={`card-social-post-${post.id}`} data-content-id={`post-${post.id}`}>
                              <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                  <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/50 overflow-hidden flex items-center justify-center">
                                      {post.authorImage ? (
                                        <img src={post.authorImage} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <User className="w-5 h-5 text-zinc-500" />
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-black text-white leading-tight" data-testid={`text-post-author-${post.id}`}>
                                        {post.authorName}
                                      </h4>
                                      <p className="text-xs font-bold text-zinc-500" data-testid={`text-post-meta-${post.id}`}>
                                        @{post.authorHandle} · {formatAge(new Date(post.createdAt).getTime())}
                                      </p>
                                    </div>
                                  </div>
                                  {user && user.id === post.authorId && (
                                    <button 
                                      className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                                      data-testid={`button-post-delete-${post.id}`}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm("Delete this post?")) return;
                                        try {
                                          const res = await fetch(`/api/social-posts/${post.id}`, { method: "DELETE", credentials: "include" });
                                          if (!res.ok) throw new Error();
                                          toast({ title: "Post deleted" });
                                          refetchSocialPosts();
                                        } catch {
                                          toast({ title: "Failed to delete post", variant: "destructive" });
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>

                                {post.textContent && (() => {
                                  const MAX_LINES = 5;
                                  const lines = post.textContent.split('\n');
                                  const isLong = lines.length > MAX_LINES || post.textContent.length > 400;
                                  const isExpanded = expandedPosts[post.id];
                                  return (
                                    <div className="mb-4" data-testid={`text-post-content-${post.id}`}>
                                      <p className={`text-zinc-200 text-sm leading-snug font-medium whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-5' : ''}`}>
                                        {post.textContent}
                                      </p>
                                      {isLong && !isExpanded && (
                                        <button
                                          className="mt-1.5 flex items-center gap-1 text-xs font-bold text-[var(--color-accent)] hover:opacity-80 transition-opacity"
                                          onClick={() => setExpandedPosts(prev => ({ ...prev, [post.id]: true }))}
                                          data-testid={`button-expand-post-${post.id}`}
                                        >
                                          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                                          <span>{t("common.read_more")}</span>
                                        </button>
                                      )}
                                      {isLong && isExpanded && (
                                        <button
                                          className="mt-1.5 flex items-center gap-1 text-xs font-bold text-[var(--color-accent)] hover:opacity-80 transition-opacity"
                                          onClick={() => setExpandedPosts(prev => ({ ...prev, [post.id]: false }))}
                                          data-testid={`button-collapse-post-${post.id}`}
                                        >
                                          <ChevronUp className="w-3.5 h-3.5" />
                                          <span>{t("common.show_less")}</span>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}

                                {post.textContent && extractYouTubeId(post.textContent) && (
                                  <div className="mb-6 rounded-2xl overflow-hidden border border-zinc-800/50">
                                    <div className="aspect-video">
                                      <iframe
                                        src={`https://www.youtube.com/embed/${extractYouTubeId(post.textContent!)}?rel=0`}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        data-testid={`youtube-embed-${post.id}`}
                                      />
                                    </div>
                                  </div>
                                )}

                                {post.imageUrl && (
                                  <div className="mb-6 rounded-2xl overflow-hidden border border-zinc-800/50 cursor-pointer" onClick={() => setLightboxImage(post.imageUrl!)}>
                                    <img src={post.imageUrl} alt="" className="w-full max-h-[500px] object-cover" data-testid={`img-post-image-${post.id}`} />
                                  </div>
                                )}

                                {post.videoUrl && (
                                  <div className="mb-6 rounded-2xl overflow-hidden border border-zinc-800/50">
                                    <video 
                                      src={post.videoUrl} 
                                      controls 
                                      className="w-full max-h-[500px]"
                                      data-testid={`video-post-${post.id}`}
                                    />
                                  </div>
                                )}

                                {post.linkUrl && (
                                  <div className="mb-6" data-testid={`link-embed-${post.id}`}>
                                    {extractYouTubeId(post.linkUrl) ? (
                                      <div className="rounded-2xl overflow-hidden border border-zinc-800/50">
                                        <div className="aspect-video">
                                          <iframe
                                            src={`https://www.youtube.com/embed/${extractYouTubeId(post.linkUrl)}?rel=0`}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        </div>
                                      </div>
                                    ) : isInstagramUrl(post.linkUrl) ? (
                                      <div className="rounded-2xl overflow-hidden border border-zinc-800/50">
                                        <div className="aspect-square max-h-[500px]">
                                          <iframe
                                            src={`https://www.instagram.com/p/${extractInstagramId(post.linkUrl)}/embed`}
                                            className="w-full h-full"
                                            allowTransparency
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <a
                                        href={post.linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-4 py-3 bg-zinc-900/80 rounded-2xl border border-zinc-800/50 hover:border-primary/30 hover:bg-zinc-800/60 transition-all group"
                                      >
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                          <Globe className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-bold text-white group-hover:text-primary truncate">{post.linkUrl}</p>
                                          <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">External Link</p>
                                        </div>
                                        <Link2 className="w-4 h-4 text-zinc-500 group-hover:text-primary shrink-0" />
                                      </a>
                                    )}
                                  </div>
                                )}

                                {post.audioUrl && (
                                  <div className="bg-black/40 rounded-3xl p-6 border border-zinc-800/50 flex items-center justify-between group mb-6">
                                    <div className="flex items-center space-x-5">
                                      <button 
                                        onClick={() => {
                                          setSocialPlayingId(isSocialPlaying ? null : post.id);
                                          if (!isSocialPlaying && audioRef.current) {
                                            audioRef.current.src = post.audioUrl!;
                                            audioRef.current.play().catch(() => {});
                                          } else if (audioRef.current) {
                                            audioRef.current.pause();
                                          }
                                        }}
                                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black shadow-xl hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                                        data-testid={`button-post-play-${post.id}`}
                                      >
                                        {isSocialPlaying ? (
                                          <div className="flex space-x-0.5 items-end h-5">
                                            <div className="w-1 h-full bg-black animate-bounce" />
                                            <div className="w-1 h-3 bg-black animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1 h-4 bg-black animate-bounce [animation-delay:0.4s]" />
                                          </div>
                                        ) : (
                                          <Play className="w-6 h-6 fill-current ml-0.5" />
                                        )}
                                      </button>
                                      <div>
                                        <p className="font-black text-white text-base tracking-tight">{post.audioTitle || "Audio"}</p>
                                        <div className="flex items-center space-x-2 text-xs font-bold text-zinc-500">
                                          <span className="text-accent">Audio</span>
                                          {post.audioDuration && (
                                            <>
                                              <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                              <span>{formatDuration(post.audioDuration)}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <Volume2 className="w-4 h-4 text-zinc-600" />
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between mt-2 pt-6 border-t border-zinc-800/30">
                                  <div className="flex space-x-6">
                                    <button 
                                      className={`flex items-center space-x-2 font-bold text-sm transition-colors ${liked ? 'text-red-500' : 'text-zinc-500 hover:text-white'}`}
                                      onClick={async () => {
                                        recordTap("social", `post-${post.id}`, "post", post.text?.slice(0, 40) || "Post");
                                        if (!isAuthenticated) {
                                          toast({ title: "Sign in required", description: "Please sign in to like posts.", variant: "destructive" });
                                          return;
                                        }
                                        const wasLiked = liked;
                                        setPostLikes((p) => ({ ...p, [post.id]: !wasLiked }));
                                        try {
                                          await fetch(`/api/social-posts/${post.id}/like`, {
                                            method: wasLiked ? "DELETE" : "POST",
                                            credentials: "include",
                                          });
                                          refetchSocialPosts();
                                        } catch {
                                          setPostLikes((p) => ({ ...p, [post.id]: wasLiked }));
                                        }
                                      }}
                                      data-testid={`button-post-like-${post.id}`}
                                    >
                                      <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                                      <span>{post.likesCount}</span>
                                    </button>
                                    <button 
                                      className={`flex items-center space-x-2 font-bold text-sm transition-colors ${expandedComments[post.id] ? 'text-[var(--color-accent)]' : 'text-zinc-500 hover:text-white'}`}
                                      onClick={() => toggleComments(post.id)}
                                      data-testid={`button-post-comment-${post.id}`}
                                    >
                                      <MessageCircle className="w-5 h-5" ref={(el: SVGSVGElement | null) => {
                                        if (!el) return;
                                        const observer = new IntersectionObserver(([entry]) => {
                                          if (entry.isIntersecting) {
                                            el.classList.remove("comment-wiggle-active");
                                            void (el as unknown as HTMLElement).offsetHeight;
                                            el.classList.add("comment-wiggle-active");
                                          }
                                        }, { threshold: 0.5 });
                                        observer.observe(el);
                                      }} />
                                      <span>{post.commentsCount}</span>
                                    </button>
                                    <button 
                                      className="flex items-center space-x-2 text-zinc-500 hover:text-white font-bold text-sm transition-colors"
                                      onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast({ title: "Link copied", description: "Post link copied to clipboard." });
                                      }}
                                      data-testid={`button-post-share-${post.id}`}
                                    >
                                      <Share2 className="w-5 h-5" />
                                      <span>{t("social.share")}</span>
                                    </button>
                                  </div>
                                  <button
                                    className={`text-sm transition-colors ${savedItemsSet.has(`post:${post.id}`) ? 'text-[hsl(var(--primary))]' : 'text-zinc-500 hover:text-white'}`}
                                    onClick={() => toggleSaveItem("post", post.id, post.text?.slice(0, 60) || "Post")}
                                    data-testid={`button-post-bookmark-${post.id}`}
                                  >
                                    {savedItemsSet.has(`post:${post.id}`) ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
                                  </button>
                                </div>
                              </div>

                              {expandedComments[post.id] && (
                                <div className="border-t border-zinc-800/60 px-6 md:px-8 py-4" data-testid={`comments-section-${post.id}`}>
                                  <div className="flex items-center space-x-3 mb-4">
                                    <input
                                      type="text"
                                      className="flex-1 bg-white/5 border border-zinc-800/60 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors"
                                      placeholder={t("social.write_comment") || "Write a comment..."}
                                      value={commentTexts[post.id] || ""}
                                      onChange={(e) => setCommentTexts((p) => ({ ...p, [post.id]: e.target.value }))}
                                      onKeyDown={(e) => { if (e.key === "Enter") submitComment(post.id); }}
                                      data-testid={`input-comment-${post.id}`}
                                    />
                                    <button
                                      className="p-2.5 rounded-full bg-[var(--color-accent)] text-black hover:opacity-90 transition-opacity disabled:opacity-40"
                                      onClick={() => submitComment(post.id)}
                                      disabled={submittingComment[post.id] || !commentTexts[post.id]?.trim()}
                                      data-testid={`button-submit-comment-${post.id}`}
                                    >
                                      <Send className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {loadingComments[post.id] ? (
                                    <div className="text-center py-4 text-zinc-500 text-sm">{t("social.loading") || "Loading..."}</div>
                                  ) : (postComments[post.id] || []).length === 0 ? (
                                    <div className="text-center py-4 text-zinc-500 text-sm">{t("social.no_comments") || "No comments yet. Be the first!"}</div>
                                  ) : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-custom">
                                      {(postComments[post.id] || []).map((comment) => (
                                        <div key={comment.id} className="flex items-start space-x-3 group" data-testid={`comment-${comment.id}`}>
                                          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0 overflow-hidden">
                                            {comment.authorImage ? (
                                              <img src={comment.authorImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                              comment.authorName?.charAt(0)?.toUpperCase() || "?"
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                              <span className="text-xs font-bold text-white/80">@{comment.authorHandle}</span>
                                              <span className="text-[10px] text-zinc-600">
                                                {new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                              </span>
                                              {comment.authorId === user?.id && (
                                                <button
                                                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                                                  onClick={() => deleteComment(comment.id, post.id)}
                                                  data-testid={`button-delete-comment-${comment.id}`}
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                            <p className="text-sm text-white/70 mt-0.5 break-words">{comment.textContent}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </article>
                          );
                        })}

                        {socialPostsData.length === 0 && (
                          <div className="text-center py-16 text-zinc-500">
                            <Globe className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                            <p className="text-sm font-medium">{t("social.no_posts")}</p>
                            <p className="text-xs text-zinc-600 mt-1">{t("social.be_first")}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {socialView === "tracks" && (
                      <div className="max-w-3xl mx-auto space-y-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">
                          <span className="text-zinc-600">Total: {filteredSocial.length} tracks</span>
                          <div className="flex items-center space-x-2 text-zinc-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Last Sync: Just now</span>
                          </div>
                        </div>

                        {filteredSocial.map((t) => {
                          const saved = !!socialSaved[t.id];
                          const isSocialPlaying = socialPlayingId === t.id;
                          return (
                            <div key={t.id} className="bg-black/40 rounded-3xl p-5 border border-zinc-800/50 flex items-center justify-between group hover:border-zinc-700/50 transition-all" data-testid={`card-social-track-${t.id}`} data-content-id={`track-${t.id}`}>
                              <div className="flex items-center space-x-5 flex-1 min-w-0">
                                <button 
                                  onClick={() => {
                                    recordTap("social", `track-${t.id}`, "track", t.title);
                                    if (isSocialPlaying) {
                                      setSocialPlayingId(null);
                                      if (audioRef.current) audioRef.current.pause();
                                    } else {
                                      setSocialPlayingId(t.id);
                                      if (audioRef.current) {
                                        audioRef.current.src = t.audioUrl;
                                        audioRef.current.play().catch(() => {});
                                      }
                                    }
                                  }}
                                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-lg hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                                  data-testid={`button-social-track-play-${t.id}`}
                                >
                                  {isSocialPlaying ? (
                                    <div className="flex space-x-0.5 items-end h-4">
                                      <div className="w-1 h-full bg-black animate-bounce" />
                                      <div className="w-1 h-2.5 bg-black animate-bounce [animation-delay:0.2s]" />
                                      <div className="w-1 h-3 bg-black animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                  ) : (
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                  )}
                                </button>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-white text-base truncate" data-testid={`text-social-track-title-${t.id}`}>
                                    {t.title}
                                  </span>
                                  <span className="text-sm text-zinc-400 font-medium truncate">
                                    @{t.uploaderHandle || "user"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
                                <span className="text-sm text-zinc-500 font-mono">
                                  {t.duration ? formatDuration(t.duration) : "—"}
                                </span>
                                <button 
                                  className={`p-2.5 rounded-full transition-all hover:scale-110 ${saved ? 'text-red-500' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                  onClick={() => setSocialSaved((p) => ({ ...p, [t.id]: !p[t.id] }))}
                                  data-testid={`button-social-track-save-${t.id}`}
                                >
                                  <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  className={`p-2.5 rounded-full transition-all hover:scale-110 ${savedItemsSet.has(`track:${t.id}`) ? 'text-[hsl(var(--primary))]' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                  onClick={() => toggleSaveItem("track", t.id, t.title)}
                                  data-testid={`button-social-track-bookmark-${t.id}`}
                                >
                                  {savedItemsSet.has(`track:${t.id}`) ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
                                </button>
                                {(user && (user.id === t.uploadedBy || isAdmin)) && (
                                  <button
                                    className="p-2.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all hover:scale-110"
                                    data-testid={`button-social-track-delete-${t.id}`}
                                    onClick={async () => {
                                      if (!confirm("Delete this track?")) return;
                                      try {
                                        const res = await fetch(`/api/social-tracks/${t.id}`, { method: "DELETE", credentials: "include" });
                                        if (!res.ok) throw new Error();
                                        toast({ title: "Track deleted" });
                                        refetchSocialTracks();
                                      } catch {
                                        toast({ title: "Failed to delete track", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {filteredSocial.length === 0 && (
                          <div className="text-center py-16 text-zinc-500">
                            <Music2 className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                            <p className="text-sm font-medium">{t("social.no_tracks")}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {socialView === "clips" && (
                      <div className="max-w-3xl mx-auto space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                            <span className="text-zinc-600">Total: {clipsData.length} {t("social.total_clips")}</span>
                          </div>
                          <button
                            className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-full font-bold text-sm transition-all active:scale-95"
                            onClick={() => {
                              if (!isAuthenticated) {
                                toast({ title: t("social.sign_in_required"), description: "Please sign in to upload clips.", variant: "destructive" });
                                return;
                              }
                              resetClipDialog();
                              setShowClipUploadDialog(true);
                            }}
                            data-testid="button-upload-clip"
                          >
                            <Video className="w-4 h-4" />
                            <span>{t("social.upload_clip")}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {clipsData.map((clip) => (
                            <div key={clip.id} className="bg-black/40 rounded-2xl border border-zinc-800/50 overflow-hidden group hover:border-zinc-700/50 transition-all" data-testid={`card-clip-${clip.id}`} data-content-id={`clip-${clip.id}`}>
                              <div className="aspect-video bg-black relative">
                                <video
                                  src={clip.videoUrl}
                                  className="w-full h-full object-cover"
                                  controls
                                  playsInline
                                  preload="metadata"
                                  data-testid={`video-clip-${clip.id}`}
                                />
                                {clip.duration && (
                                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full font-mono">
                                    {Math.floor(clip.duration / 60)}:{String(clip.duration % 60).padStart(2, '0')}
                                  </span>
                                )}
                              </div>
                              <div className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-white text-sm truncate" data-testid={`text-clip-title-${clip.id}`}>{clip.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      {clip.author?.profileImageUrl ? (
                                        <img src={clip.author.profileImageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                                          <User className="w-3 h-3 text-zinc-500" />
                                        </div>
                                      )}
                                      <span className="text-xs text-zinc-400">@{clip.author?.handle || "user"}</span>
                                      <span className="text-xs text-zinc-600">&bull;</span>
                                      <span className="text-xs text-zinc-500">{formatAge(new Date(clip.createdAt).getTime())}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      className={`p-1.5 rounded-full transition-all ${clipLikes[clip.id] ? 'text-red-500' : 'text-zinc-500 hover:text-white'}`}
                                      onClick={async () => {
                                        if (!isAuthenticated) return;
                                        const liked = clipLikes[clip.id];
                                        setClipLikes(p => ({ ...p, [clip.id]: !liked }));
                                        try {
                                          await fetch(`/api/clips/${clip.id}/like`, { method: liked ? "DELETE" : "POST", credentials: "include" });
                                          refetchClips();
                                        } catch { setClipLikes(p => ({ ...p, [clip.id]: liked })); }
                                      }}
                                      data-testid={`button-clip-like-${clip.id}`}
                                    >
                                      <Heart className={`w-4 h-4 ${clipLikes[clip.id] ? 'fill-current' : ''}`} />
                                    </button>
                                    <span className="text-xs text-zinc-500">{clip.likesCount}</span>
                                    <button
                                      className={`p-1.5 rounded-full transition-all ${savedItemsSet.has(`clip:${clip.id}`) ? 'text-[hsl(var(--primary))]' : 'text-zinc-500 hover:text-white'}`}
                                      onClick={() => toggleSaveItem("clip", clip.id, clip.title)}
                                      data-testid={`button-clip-bookmark-${clip.id}`}
                                    >
                                      {savedItemsSet.has(`clip:${clip.id}`) ? <BookmarkCheck className="w-3.5 h-3.5 fill-current" /> : <Bookmark className="w-3.5 h-3.5" />}
                                    </button>
                                    {user && user.id === clip.authorId && (
                                      <button
                                        className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 transition-all ml-1"
                                        onClick={async () => {
                                          if (!confirm("Delete this clip?")) return;
                                          try {
                                            await fetch(`/api/clips/${clip.id}`, { method: "DELETE", credentials: "include" });
                                            toast({ title: "Clip deleted" });
                                            refetchClips();
                                          } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
                                        }}
                                        data-testid={`button-clip-delete-${clip.id}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {clipsData.length === 0 && (
                          <div className="text-center py-16 text-zinc-500">
                            <Video className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                            <p className="text-sm font-medium">{t("social.no_clips")}</p>
                            <p className="text-xs text-zinc-600 mt-1">{t("social.clip_desc")}</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </TabsContent>

                <TabsContent value="library" className="mt-0">
                  <div className="w-full text-zinc-100" data-testid="panel-library">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                      <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tighter text-white" data-testid="text-library-title">
                          {t("library.title")}
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium max-w-md leading-relaxed" data-testid="text-library-desc">
                          {t("library.desc")}
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
                            isAuthenticated && (!isStorageFull || isAdmin)
                              ? "bg-white hover:bg-zinc-200 text-black" 
                              : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                          }`}
                          disabled={!isAuthenticated || (isStorageFull && !isAdmin)}
                          data-testid="button-library-upload"
                          onClick={() => {
                            setUploadTitle("");
                            setUploadFile(null);
                            setShowLibraryUploadDialog(true);
                          }}
                        >
                          <Upload className="w-4 h-4" />
                          <span>{t("library.upload")}</span>
                        </button>
                        {isStorageFull && !isAdmin && isAuthenticated && (
                          <span className="text-xs text-red-400">{t("library.storage_full")}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">
                      <div className="flex items-center space-x-6">
                        <span className="text-zinc-600">Total: {filteredLibrary.length} items</span>
                        {storageData && (
                          <span className={`${isStorageFull && !isAdmin ? 'text-red-400' : 'text-zinc-600'}`} data-testid="text-storage-used">
                            Storage: {formatBytes(storageData.usedBytes)} / {isAdmin ? '∞' : '200MB'} ({isAdmin ? '∞' : <span className="text-accent">{storagePercent}%</span>})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-zinc-600">
                        <Library className="w-3.5 h-3.5" />
                        <span>{t("library.your_collection")}</span>
                      </div>
                    </div>

                    <div className="bg-[#121214] rounded-2xl border border-zinc-800/60 p-5 mb-6 " data-testid="panel-library-player">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700/50 ">
                            <Music className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500" data-testid="text-library-nowplaying-label">
                              {t("library.now_playing")}
                            </div>
                            <div className="font-bold text-white text-lg" data-testid="text-library-nowplaying">
                              {nowPlaying ?? t("library.nothing_yet")}
                            </div>
                          </div>
                        </div>
                        <button
                          className={`p-3 rounded-full transition-all transform hover:scale-110 ${isPlaying ? 'bg-primary text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                          data-testid="button-library-toggleplay"
                          onClick={() => {
                            if (audioRef.current) {
                              if (isPlaying) {
                                audioRef.current.pause();
                                setIsPlaying(false);
                              } else {
                                audioRef.current.play().catch(() => {});
                                setIsPlaying(true);
                              }
                            }
                          }}
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#121214] rounded-3xl border border-zinc-800/60 overflow-hidden ">
                      <div className="grid grid-cols-[60px_1fr_80px_100px_100px_100px] items-center px-6 py-4 border-b border-zinc-800/80 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-black/20">
                        <div className="text-center">#</div>
                        <div>Title / Artist</div>
                        <div className="hidden sm:block">Time</div>
                        <div className="hidden md:block">Genre</div>
                        <div className="hidden md:block px-4">Kind</div>
                        <div className="text-right pr-6">Actions</div>
                      </div>

                      <div className="divide-y divide-zinc-800/40">
                        {filteredLibrary.length === 0 ? (
                          <div className="px-6 py-8 text-sm text-zinc-400" data-testid="status-library-empty">
                            {t("library.no_items")}
                          </div>
                        ) : (
                          filteredLibrary.map((item, index) => (
                            <div 
                              key={item.id}
                              className="group grid grid-cols-[60px_1fr_80px_100px_100px_100px] items-center px-6 py-5 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
                              data-testid={`row-library-${item.id}`}
                              onClick={() => {
                                const cat = getFileCategory(item.contentType);
                                if (cat === "audio" || !item.objectPath) {
                                  setNowPlaying(item.title);
                                  setNowPlayingId(item.id);
                                  setIsPlaying(true);
                                  if (item.objectPath && audioRef.current) {
                                    audioRef.current.src = item.objectPath;
                                    audioRef.current.play().catch(() => {});
                                  }
                                } else {
                                  setViewingItem(item);
                                }
                              }}
                            >
                              <div className="flex justify-center">
                                <button
                                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent/10 transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const isThisPlaying = nowPlayingId === item.id && isPlaying;
                                    if (isThisPlaying) {
                                      audioRef.current?.pause();
                                      setIsPlaying(false);
                                    } else {
                                      setNowPlaying(item.title);
                                      setNowPlayingId(item.id);
                                      setIsPlaying(true);
                                      if (audioRef.current && item.objectPath) {
                                        audioRef.current.src = item.objectPath;
                                        audioRef.current.play().catch(() => {});
                                      }
                                    }
                                  }}
                                  data-testid={`button-library-play-${item.id}`}
                                >
                                  {nowPlayingId === item.id && isPlaying ? (
                                    <Pause className="w-4 h-4 text-accent transition-all duration-300" />
                                  ) : (
                                    <Music className={`w-4 h-4 transition-all duration-300 ${nowPlayingId === item.id ? 'text-accent' : 'text-zinc-500 group-hover:text-accent'}`} style={{ animation: nowPlayingId === item.id ? 'pulse 2s ease-in-out infinite' : 'none' }} />
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center space-x-5 overflow-hidden">
                                <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-700/50 group-hover:border-primary/30 transition-all  relative overflow-hidden" data-testid={`img-library-thumb-${item.id}`}>
                                  <FileCategoryIcon category={getFileCategory(item.contentType)} className="w-5 h-5 text-zinc-500 group-hover:text-primary transition-colors" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-white text-base truncate group-hover:text-primary/90 transition-colors" data-testid={`text-library-title-${item.id}`}>
                                    {item.title}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-zinc-400 font-medium truncate group-hover:text-zinc-300" data-testid={`text-library-artist-${item.id}`}>
                                      {item.artist ?? "Unknown"}
                                    </span>
                                    {item.fileSize && (
                                      <span className="text-[10px] text-zinc-600 font-mono">{formatBytes(item.fileSize)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="hidden sm:block text-sm text-zinc-400 group-hover:text-zinc-200 font-mono tracking-tighter" data-testid={`text-library-duration-${item.id}`}>
                                3:45
                              </div>

                              <div className="hidden md:block text-sm text-zinc-500 group-hover:text-zinc-300" data-testid={`text-library-genre-${item.id}`}>
                                —
                              </div>

                              <div className="hidden md:block px-4">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                  item.kind === 'purchase' ? 'bg-primary/20 text-primary' : 
                                  item.kind === 'free' ? 'bg-green-500/20 text-green-400' :
                                  'bg-zinc-800 text-zinc-400'
                                }`} data-testid={`text-library-kind-${item.id}`}>
                                  {item.kind === 'purchase' ? 'Purchased' : item.kind === 'free' ? 'Free' : getFileCategory(item.contentType).toUpperCase()}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 justify-end pr-2">
                                {item.objectPath && getFileCategory(item.contentType) !== "audio" && (
                                  <button 
                                    className="p-2.5 text-zinc-500 hover:text-primary rounded-full hover:bg-zinc-800 transition-all hover:scale-110"
                                    aria-label="Open"
                                    onClick={(e) => { e.stopPropagation(); setViewingItem(item); }}
                                    data-testid={`button-library-view-${item.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                                <button 
                                  className="p-2.5 text-zinc-500 hover:text-primary rounded-full hover:bg-zinc-800 transition-all hover:scale-110"
                                  aria-label="Like"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`button-library-like-${item.id}`}
                                >
                                  <Heart className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </TabsContent>
            </Tabs>
          </div>

          <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-xs text-white/45" data-testid="text-explore-footer">
            {tab === "radio-tv" && (
              <span className="text-primary">Radio and TV will always be free. It's Universal Culture.</span>
            )}
            {tab === "live" && (
              <>Payments processed securely via Stripe. <span className="text-primary">Some events will be offered $10, many will be free.</span></>
            )}
            {tab === "social" && (
              <>Payments processed securely via Stripe. <span className="text-primary">Sell Your Songs for $1, Request them to be added to the Music section.</span></>
            )}
            {tab === "music" && (
              <>Payments processed securely via Stripe. <span className="text-primary">All Songs are $1 and stored in My Library.</span></>
            )}
            {tab === "library" && (
              <>Payments processed securely via Stripe. <span className="text-primary">200MB free storage. Upgrade for more storage — $5/mo or $50/yr.</span></>
            )}
          </footer>
        </div>
      </main>

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
                  <div className="text-sm text-primary font-medium">{uploadFile.name}</div>
                ) : (
                  <div className="text-sm text-zinc-500">Click to select an audio file (MP3, WAV, etc.)</div>
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
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="submit-for-sale" 
                checked={submitForSale} 
                onCheckedChange={(checked) => setSubmitForSale(checked === true)}
                data-testid="checkbox-submit-for-sale"
              />
              <Label htmlFor="submit-for-sale" className="text-sm text-zinc-300">
                Submit for Music catalogue review ($1 listing)
              </Label>
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
                  
                  const uploadRes = await fetch(uploadURL, {
                    method: "PUT",
                    body: uploadFile,
                    headers: { "Content-Type": uploadFile.type },
                  });
                  
                  if (!uploadRes.ok) {
                    throw new Error("Failed to upload file");
                  }
                  
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
                    const error = await trackRes.json();
                    throw new Error(error.message || "Failed to create social track");
                  }
                  
                  toast({ title: "Track uploaded!", description: submitForSale ? "Your track has been submitted for review." : "Your track is now live on Social." });
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
              className="bg-primary text-black hover:bg-primary/90 font-bold"
              data-testid="button-social-upload-submit"
            >
              {isUploading ? "Uploading..." : "Upload Track"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clip Upload Dialog */}
      <Dialog open={showClipUploadDialog} onOpenChange={(open) => { if (!open) { resetClipDialog(); } setShowClipUploadDialog(open); }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t("social.upload_clip")}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {t("social.clip_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clip-title" className="text-sm text-zinc-300">Title</Label>
              <Input
                id="clip-title"
                value={clipTitle}
                onChange={(e) => setClipTitle(e.target.value)}
                placeholder="Name your clip..."
                className="bg-zinc-800 border-zinc-700 text-white"
                data-testid="input-clip-title"
              />
            </div>

            {clipVideoPreview ? (
              <div className="space-y-2">
                <Label className="text-sm text-zinc-300">Preview</Label>
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video src={clipVideoPreview} controls playsInline className="w-full aspect-video object-contain" data-testid="clip-preview-video" />
                  <button
                    onClick={() => { setClipFile(null); if (clipVideoPreview) URL.revokeObjectURL(clipVideoPreview); setClipVideoPreview(null); setRecordingTime(0); }}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                    data-testid="button-clip-remove-preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : isRecording ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video ref={cameraVideoRef} autoPlay playsInline muted className="w-full aspect-video object-cover" data-testid="clip-camera-preview" />
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-sm font-mono font-bold">{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
                    <span className="text-white/60 text-xs">/ 10:00</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                    <div className="h-full bg-red-500 transition-all" style={{ width: `${(recordingTime / 600) * 100}%` }} />
                  </div>
                </div>
                <Button onClick={stopRecording} variant="destructive" className="w-full font-bold" data-testid="button-clip-stop-recording">
                  <Pause className="w-4 h-4 mr-2" />
                  {t("social.stop_recording")} ({Math.floor((600 - recordingTime) / 60)}:{String((600 - recordingTime) % 60).padStart(2, '0')} left)
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button onClick={startRecording} variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800 py-6" data-testid="button-clip-start-recording">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-1">
                      <div className="w-4 h-4 rounded-full bg-red-500" />
                    </div>
                    <span className="font-bold">{t("social.start_recording")}</span>
                    <span className="text-xs text-zinc-500">Max 10 minutes</span>
                  </div>
                </Button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-xs text-zinc-500">{t("social.or_upload")}</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>
                <div
                  className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center hover:border-zinc-600 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('clip-file-input')?.click()}
                >
                  <Upload className="w-5 h-5 mx-auto mb-1 text-zinc-500" />
                  <div className="text-sm text-zinc-500">Select a video file (MP4, WebM)</div>
                  <div className="text-xs text-zinc-600 mt-1">Max 50MB, up to 10 minutes</div>
                </div>
                <input
                  type="file"
                  id="clip-file-input"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 50 * 1024 * 1024) {
                        toast({ title: "File too large", description: "Max file size is 50MB.", variant: "destructive" });
                        return;
                      }
                      setClipFile(f);
                      setClipVideoPreview(URL.createObjectURL(f));
                    }
                  }}
                  data-testid="input-clip-file"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { resetClipDialog(); setShowClipUploadDialog(false); }} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              Cancel
            </Button>
            <Button
              disabled={!clipTitle.trim() || !clipFile || isClipUploading}
              onClick={uploadClip}
              className="bg-primary text-black hover:bg-primary/90 font-bold"
              data-testid="button-clip-upload-submit"
            >
              {isClipUploading ? "Uploading..." : t("social.upload_clip")}
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
              Store private files in your personal library. 200MB free storage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {storageData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Storage: {formatBytes(storageData.usedBytes)} / {isAdmin ? '∞' : '200MB'}</span>
                  {!isAdmin && <span>{storagePercent}% used</span>}
                </div>
                {!isAdmin && (
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${storagePercent > 90 ? 'bg-red-400' : storagePercent > 70 ? 'bg-yellow-400' : 'bg-primary'}`} style={{ width: `${Math.min(storagePercent, 100)}%` }} />
                  </div>
                )}
              </div>
            )}
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
                  <div className="flex items-center justify-center space-x-2">
                    <FileCategoryIcon category={getFileCategory(uploadFile.type)} className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary font-medium">{uploadFile.name}</span>
                    <span className="text-xs text-zinc-500">({formatBytes(uploadFile.size)})</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-8 h-8 mx-auto text-zinc-600" />
                    <div className="text-sm text-zinc-500">Click to select a file</div>
                    <div className="text-[10px] text-zinc-600">
                      Audio (MP3, M4A, WAV, FLAC) · Images (JPG, PNG, WEBP) · Video (MP4, WEBM) · PDF
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">Max 50MB per file</div>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                id="library-file-input"
                className="hidden"
                accept={ACCEPTED_FILE_TYPES}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    if (file.size > MAX_FILE_SIZE) {
                      toast({ title: "File too large", description: "Max file size is 50MB.", variant: "destructive" });
                      return;
                    }
                    setUploadFile(file);
                    if (!uploadTitle.trim()) {
                      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
                    }
                  }
                }}
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
                  
                  const uploadRes = await fetch(uploadURL, {
                    method: "PUT",
                    body: uploadFile,
                    headers: { "Content-Type": uploadFile.type },
                  });
                  
                  if (!uploadRes.ok) {
                    throw new Error("Failed to upload file");
                  }
                  
                  const itemRes = await fetch("/api/me/library", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      type: "upload",
                      objectPath,
                      fileSize: uploadFile.size,
                      metadata: { title: uploadTitle, artist: "You", contentType: uploadFile.type },
                    }),
                  });
                  
                  if (!itemRes.ok) {
                    const error = await itemRes.json();
                    throw new Error(error.message || "Failed to create library item");
                  }
                  
                  refetchStorage();
                  
                  toast({ title: "File uploaded!", description: "Your file has been added to your library." });
                  setShowLibraryUploadDialog(false);
                  setUploadFile(null);
                  setUploadTitle("");
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
              className="bg-primary text-black hover:bg-primary/90 font-bold"
              data-testid="button-library-upload-submit"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMusicUploadDialog} onOpenChange={setShowMusicUploadDialog}>
        <DialogContent className="bg-zinc-900 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload Song</DialogTitle>
            <DialogDescription className="text-white/60">
              Add a new song to the Music catalogue. Price is set to $1 by default.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="music-title">Title *</Label>
              <Input
                id="music-title"
                value={musicUploadTitle}
                onChange={(e) => setMusicUploadTitle(e.target.value)}
                placeholder="Song title"
                className="bg-black/30 border-white/10"
                data-testid="input-music-upload-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="music-artist">Artist *</Label>
              <Input
                id="music-artist"
                value={musicUploadArtist}
                onChange={(e) => setMusicUploadArtist(e.target.value)}
                placeholder="Artist name"
                className="bg-black/30 border-white/10"
                data-testid="input-music-upload-artist"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="music-album">Album (optional)</Label>
              <Input
                id="music-album"
                value={musicUploadAlbum}
                onChange={(e) => setMusicUploadAlbum(e.target.value)}
                placeholder="Album name"
                className="bg-black/30 border-white/10"
                data-testid="input-music-upload-album"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="music-genre">Genre (optional)</Label>
              <Input
                id="music-genre"
                value={musicUploadGenre}
                onChange={(e) => setMusicUploadGenre(e.target.value)}
                placeholder="e.g. Afrobeats, Highlife, Amapiano"
                className="bg-black/30 border-white/10"
                data-testid="input-music-upload-genre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="music-file">Audio File *</Label>
              <Input
                id="music-file"
                type="file"
                accept="audio/*"
                onChange={(e) => setMusicUploadFile(e.target.files?.[0] || null)}
                className="bg-black/30 border-white/10 file:text-white/70 file:bg-white/10 file:border-0 file:rounded file:px-3 file:py-1 file:mr-3"
                data-testid="input-music-upload-file"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowMusicUploadDialog(false);
                setMusicUploadTitle("");
                setMusicUploadArtist("");
                setMusicUploadAlbum("");
                setMusicUploadGenre("");
                setMusicUploadFile(null);
              }}
              className="bg-white/10 text-white hover:bg-white/15 border border-white/10"
              data-testid="button-music-upload-cancel"
            >
              Cancel
            </Button>
            <Button
              disabled={!musicUploadTitle || !musicUploadArtist || !musicUploadFile || isMusicUploading}
              onClick={async () => {
                if (!musicUploadFile || !musicUploadTitle || !musicUploadArtist) return;
                setIsMusicUploading(true);
                try {
                  const urlRes = await fetch("/api/uploads/request-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      fileName: musicUploadFile.name,
                      contentType: musicUploadFile.type,
                    }),
                  });
                  if (!urlRes.ok) throw new Error("Failed to get upload URL");
                  const { uploadURL, objectPath } = await urlRes.json();

                  const uploadRes = await fetch(uploadURL, {
                    method: "PUT",
                    body: musicUploadFile,
                    headers: { "Content-Type": musicUploadFile.type },
                  });
                  if (!uploadRes.ok) throw new Error("Failed to upload file");

                  const songRes = await fetch("/api/songs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      title: musicUploadTitle,
                      artist: musicUploadArtist,
                      album: musicUploadAlbum || null,
                      genre: musicUploadGenre || null,
                      audioUrl: objectPath,
                      price: 100,
                    }),
                  });
                  if (!songRes.ok) {
                    const err = await songRes.json();
                    throw new Error(err.message || "Failed to create song");
                  }

                  toast({ title: "Song uploaded!", description: `${musicUploadTitle} has been added to the catalogue.` });
                  setShowMusicUploadDialog(false);
                  setMusicUploadTitle("");
                  setMusicUploadArtist("");
                  setMusicUploadAlbum("");
                  setMusicUploadGenre("");
                  setMusicUploadFile(null);
                  queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
                } catch (error: any) {
                  toast({
                    title: "Upload failed",
                    description: error.message || "Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsMusicUploading(false);
                }
              }}
              className="bg-primary text-black hover:bg-primary/90 font-bold"
              data-testid="button-music-upload-submit"
            >
              {isMusicUploading ? "Uploading..." : "Upload Song"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewingItem && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col" data-testid="panel-file-viewer">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center space-x-3">
              <FileCategoryIcon category={getFileCategory(viewingItem.contentType)} className="w-5 h-5 text-primary" />
              <span className="text-white font-bold text-lg">{viewingItem.title}</span>
              <span className="text-xs text-zinc-500 uppercase font-bold">{getFileCategory(viewingItem.contentType)}</span>
            </div>
            <button 
              onClick={() => setViewingItem(null)} 
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-all"
              data-testid="button-viewer-close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            {getFileCategory(viewingItem.contentType) === "image" && viewingItem.objectPath && (
              <img 
                src={viewingItem.objectPath} 
                alt={viewingItem.title}
                className="max-w-full max-h-full object-contain rounded-lg"
                data-testid="viewer-image"
              />
            )}
            {getFileCategory(viewingItem.contentType) === "video" && viewingItem.objectPath && (
              <video 
                src={viewingItem.objectPath}
                controls 
                autoPlay
                className="max-w-full max-h-full rounded-lg"
                data-testid="viewer-video"
              />
            )}
            {getFileCategory(viewingItem.contentType) === "pdf" && viewingItem.objectPath && (
              <iframe 
                src={viewingItem.objectPath}
                className="w-full h-full rounded-lg bg-white"
                title={viewingItem.title}
                data-testid="viewer-pdf"
              />
            )}
          </div>
        </div>
      )}
      <AnimatePresence>
        {isTheaterMode && activeChannel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) exitTheaterMode(); }}
            data-testid="theater-overlay"
          >
            <div className="absolute inset-0 bg-black/92 backdrop-blur-md" />

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20 blur-[120px] rounded-full"
                style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.3) 0%, transparent 70%)' }} />
              <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10"
                style={{ background: 'linear-gradient(to top, hsl(var(--primary) / 0.2), transparent)' }} />
            </div>

            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
              className="relative z-10 w-full max-w-4xl mx-4"
              data-testid="theater-container"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-white/80 tracking-wide uppercase">Live</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white" data-testid="theater-channel-name">{activeChannel.name}</div>
                    <div className="text-xs text-white/50">{activeChannel.country} &bull; {activeChannel.channelGroup}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const v = theaterVideoRef.current;
                      if (v) v.currentTime = Math.max(0, v.currentTime - 20);
                    }}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                    title="Rewind 20s"
                    data-testid="theater-rewind"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exitTheaterMode()}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                    title="Exit Theater (Esc)"
                    data-testid="theater-close"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => theaterVideoRef.current?.requestFullscreen?.()}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                    title="Fullscreen"
                    data-testid="theater-fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                style={{ boxShadow: '0 0 80px 10px hsl(var(--primary) / 0.08), 0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <div className="aspect-video bg-black">
                  {streamError ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="grid gap-3 text-center p-6">
                        <div className="mx-auto h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-red-400" />
                        </div>
                        <div className="text-sm text-white/70">This channel is currently unavailable</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 mx-auto bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          onClick={() => { setStreamError(null); setPlayingChannelId(activeChannel.id); }}
                          data-testid="theater-retry"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <video
                      ref={theaterVideoRef}
                      key={"theater-" + activeChannel.id + "-" + playingChannelId}
                      className="h-full w-full"
                      controls
                      autoPlay
                      playsInline
                      onError={() => setStreamError("Stream failed to load")}
                      data-testid="theater-video"
                    >
                      <source src={activeChannel.iptvUrl} />
                    </video>
                  )}
                </div>
              </div>

              <div className="mt-3 flex justify-center">
                <span className="text-[11px] text-white/30 tracking-wide">Press ESC or click outside to exit</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          data-testid="lightbox-overlay"
        >
          <button
            className="absolute top-4 right-4 z-[101] bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
            onClick={() => setLightboxImage(null)}
            data-testid="button-lightbox-close"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={lightboxImage} 
            alt="" 
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            data-testid="img-lightbox-full"
          />
        </div>
      )}
      <audio ref={audioRef} onEnded={() => { setIsPlaying(false); setNowPlayingId(null); }} />
    </div>
  );
}
