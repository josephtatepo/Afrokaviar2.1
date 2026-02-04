import { storage } from "./storage";
import { validateStreamWithFallback } from "./streamValidator";

const DEFAULT_TV_CHANNELS = [
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

let healthCheckInterval: NodeJS.Timeout | null = null;
let isCheckingHealth = false;

export async function initializeChannels(): Promise<void> {
  console.log("[ChannelHealth] Initializing channels in database...");
  
  for (const channel of DEFAULT_TV_CHANNELS) {
    await storage.upsertChannel({
      id: channel.id,
      name: channel.name,
      country: channel.country,
      channelGroup: channel.channelGroup,
      iptvUrl: channel.iptvUrl,
      isOnline: true,
      consecutiveFailures: 0,
    });
  }
  
  console.log(`[ChannelHealth] Initialized ${DEFAULT_TV_CHANNELS.length} channels`);
}

export async function checkChannelHealth(channelId: string): Promise<boolean> {
  const channel = await storage.getChannelById(channelId);
  if (!channel) return false;

  const result = await validateStreamWithFallback(channel.iptvUrl);
  
  const currentFailures = channel.consecutiveFailures ?? 0;
  const newFailures = result.isOnline ? 0 : currentFailures + 1;
  const isOnline = result.isOnline || newFailures < 3;

  await storage.updateChannelStatus(channelId, isOnline, newFailures);
  
  return result.isOnline;
}

export async function runHealthCheck(): Promise<{ checked: number; online: number; offline: number }> {
  if (isCheckingHealth) {
    console.log("[ChannelHealth] Health check already in progress, skipping...");
    return { checked: 0, online: 0, offline: 0 };
  }

  isCheckingHealth = true;
  console.log("[ChannelHealth] Starting health check...");
  
  try {
    const channels = await storage.getChannelsNeedingCheck(2);
    
    if (channels.length === 0) {
      console.log("[ChannelHealth] No channels need checking");
      return { checked: 0, online: 0, offline: 0 };
    }

    let online = 0;
    let offline = 0;

    const batchSize = 5;
    for (let i = 0; i < channels.length; i += batchSize) {
      const batch = channels.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (ch) => {
          const result = await validateStreamWithFallback(ch.iptvUrl);
          return { channel: ch, result };
        })
      );

      for (const { channel, result } of results) {
        const currentFailures = channel.consecutiveFailures ?? 0;
        const newFailures = result.isOnline ? 0 : currentFailures + 1;
        const isOnline = result.isOnline || newFailures < 3;

        await storage.updateChannelStatus(channel.id, isOnline, newFailures);

        if (isOnline) {
          online++;
        } else {
          offline++;
        }
      }

      if (i + batchSize < channels.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`[ChannelHealth] Check complete: ${online} online, ${offline} offline out of ${channels.length}`);
    return { checked: channels.length, online, offline };
  } finally {
    isCheckingHealth = false;
  }
}

export function startPeriodicHealthCheck(intervalHours: number = 2): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  setTimeout(() => {
    runHealthCheck().catch(console.error);
  }, 30000);

  healthCheckInterval = setInterval(() => {
    runHealthCheck().catch(console.error);
  }, intervalMs);

  console.log(`[ChannelHealth] Periodic health check started (every ${intervalHours} hours)`);
}

export function stopPeriodicHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log("[ChannelHealth] Periodic health check stopped");
  }
}
