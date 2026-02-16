import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Lang = "en" | "fr";

const translations: Record<string, Record<Lang, string>> = {
  "nav.radio_tv": { en: "Radio & TV", fr: "Radio & TV" },
  "nav.live": { en: "Live", fr: "En direct" },
  "nav.social": { en: "Social", fr: "Social" },
  "nav.music": { en: "Music", fr: "Musique" },
  "nav.library": { en: "My Library", fr: "Ma Bibliothèque" },

  "search.placeholder": { en: "Search across the Afroverse...", fr: "Rechercher dans l'Afroverse..." },

  "social.title": { en: "Social", fr: "Social" },
  "social.desc": { en: "A simple public drop space for collaborators. Discover new sounds and works in progress.", fr: "Un espace public pour les collaborateurs. Découvrez de nouveaux sons et des travaux en cours." },
  "social.upload_track": { en: "Upload Track", fr: "Télécharger un morceau" },
  "social.posts": { en: "Posts", fr: "Publications" },
  "social.tracks": { en: "Tracks", fr: "Morceaux" },
  "social.my_submissions": { en: "My Submissions", fr: "Mes soumissions" },
  "social.post_placeholder": { en: "Drop a track, share an idea...", fr: "Partagez un morceau, une idée..." },
  "social.image": { en: "Image", fr: "Image" },
  "social.audio": { en: "Audio", fr: "Audio" },
  "social.video": { en: "Video", fr: "Vidéo" },
  "social.post_btn": { en: "POST", fr: "PUBLIER" },
  "social.posting": { en: "Posting...", fr: "Publication..." },
  "social.no_posts": { en: "No posts yet", fr: "Aucune publication" },
  "social.be_first": { en: "Be the first to share something!", fr: "Soyez le premier à partager quelque chose !" },
  "social.no_tracks": { en: "No tracks yet", fr: "Aucun morceau" },
  "social.share": { en: "Share", fr: "Partager" },
  "social.total_posts": { en: "posts", fr: "publications" },
  "social.total_tracks": { en: "tracks", fr: "morceaux" },
  "social.last_sync": { en: "Last Sync: Just now", fr: "Dernière sync : à l'instant" },
  "social.write_comment": { en: "Write a comment...", fr: "Écrire un commentaire..." },
  "social.no_comments": { en: "No comments yet. Be the first!", fr: "Aucun commentaire. Soyez le premier !" },
  "social.loading": { en: "Loading...", fr: "Chargement..." },
  "social.sign_in_required": { en: "Sign in required", fr: "Connexion requise" },
  "social.sign_in_comment": { en: "Please sign in to comment.", fr: "Veuillez vous connecter pour commenter." },
  "social.clips": { en: "Clips", fr: "Clips" },
  "social.no_clips": { en: "No clips yet", fr: "Aucun clip" },
  "social.record_clip": { en: "Record Clip", fr: "Enregistrer un clip" },
  "social.upload_clip": { en: "Upload Clip", fr: "Télécharger un clip" },
  "social.clip_desc": { en: "Record or upload a video clip (up to 10 minutes).", fr: "Enregistrez ou téléchargez un clip vidéo (jusqu'à 10 minutes)." },
  "social.recording": { en: "Recording...", fr: "Enregistrement..." },
  "social.stop_recording": { en: "Stop", fr: "Arrêter" },
  "social.start_recording": { en: "Start Recording", fr: "Démarrer l'enregistrement" },
  "social.or_upload": { en: "or upload a video file", fr: "ou télécharger un fichier vidéo" },
  "social.clip_uploaded": { en: "Clip uploaded!", fr: "Clip téléchargé !" },
  "social.total_clips": { en: "clips", fr: "clips" },

  "music.title": { en: "Music", fr: "Musique" },
  "music.desc": { en: "Discover and collect premium Afro-futurist sounds. Each track is just $1.", fr: "Découvrez et collectionnez des sons afro-futuristes premium. Chaque morceau est à 1$." },
  "music.all": { en: "All", fr: "Tout" },
  "music.favorites": { en: "Favorites", fr: "Favoris" },
  "music.total_tracks": { en: "tracks", fr: "morceaux" },

  "library.title": { en: "My Library", fr: "Ma Bibliothèque" },
  "library.desc": { en: "Your personal and private music collection. Purchases and uploads appear here.", fr: "Votre collection musicale personnelle et privée. Achats et téléchargements apparaissent ici." },
  "library.all": { en: "All", fr: "Tout" },
  "library.purchases": { en: "Purchases", fr: "Achats" },
  "library.free": { en: "Free", fr: "Gratuit" },
  "library.uploads": { en: "Uploads", fr: "Téléchargements" },
  "library.upload": { en: "Upload", fr: "Télécharger" },
  "library.storage_full": { en: "Storage full — upgrade to continue", fr: "Stockage plein — mettez à jour pour continuer" },
  "library.now_playing": { en: "Now Playing", fr: "En lecture" },
  "library.nothing_yet": { en: "Nothing yet", fr: "Rien pour l'instant" },
  "library.no_items": { en: "No items in your library", fr: "Aucun élément dans votre bibliothèque" },
  "library.your_collection": { en: "Your Personal Collection", fr: "Votre collection personnelle" },
  "library.title_artist": { en: "Title / Artist", fr: "Titre / Artiste" },
  "library.time": { en: "Time", fr: "Durée" },
  "library.genre": { en: "Genre", fr: "Genre" },
  "library.kind": { en: "Kind", fr: "Type" },
  "library.actions": { en: "Actions", fr: "Actions" },
  "library.purchased": { en: "Purchased", fr: "Acheté" },

  "radio.title": { en: "Radio & TV", fr: "Radio & TV" },
  "radio.channels": { en: "channels", fr: "chaînes" },

  "live.title": { en: "Live", fr: "En direct" },

  "common.sign_in": { en: "Sign in", fr: "Se connecter" },
  "common.profile": { en: "Profile", fr: "Profil" },
  "common.admin": { en: "Admin", fr: "Admin" },
  "common.settings": { en: "Settings", fr: "Paramètres" },
  "common.total": { en: "Total", fr: "Total" },
  "common.delete": { en: "Delete", fr: "Supprimer" },
  "common.cancel": { en: "Cancel", fr: "Annuler" },

  "profile.title": { en: "Profile", fr: "Profil" },
  "profile.back": { en: "Back to Explore", fr: "Retour à Explorer" },
  "profile.logout": { en: "Logout", fr: "Déconnexion" },
  "profile.your_handle": { en: "Your Handle", fr: "Votre pseudo" },
  "profile.save": { en: "Save", fr: "Enregistrer" },
  "profile.member_since": { en: "Member Since", fr: "Membre depuis" },
  "profile.auth_provider": { en: "Auth Provider", fr: "Fournisseur d'auth" },
  "profile.analytics": { en: "Analytics Snapshot", fr: "Aperçu analytique" },
  "profile.invite_friends": { en: "Invite Friends", fr: "Inviter des amis" },
  "profile.invite": { en: "Invite", fr: "Inviter" },
  "profile.your_invites": { en: "Your Invites", fr: "Vos invitations" },
  "profile.admin_controls": { en: "Admin Controls", fr: "Contrôles admin" },
  "profile.open_admin": { en: "Open Admin Studio", fr: "Ouvrir le Studio Admin" },

  "radio.select_channel": { en: "Select a TV channel or switch to Radio.", fr: "Sélectionnez une chaîne ou passez à la radio." },
  "radio.tv_channels": { en: "TV Channels", fr: "Chaînes TV" },
  "radio.country": { en: "Country", fr: "Pays" },
  "radio.content_type": { en: "Content Type", fr: "Type" },
  "radio.on_air": { en: "On Air", fr: "En direct" },
  "radio.loading": { en: "Loading channels from the sheet...", fr: "Chargement des chaînes..." },
  "radio.paste_embed": { en: "Paste Radiolise embed code", fr: "Coller le code Radiolise" },

  "live.desc": { en: "Featured live shows and podcast sessions — timed events with RSVP and ticketing.", fr: "Shows en direct et podcasts — événements avec RSVP et billetterie." },
  "live.get_notified": { en: "Get Notified", fr: "Être notifié" },
  "live.coming_soon": { en: "Coming Soon", fr: "Bientôt" },
  "live.coming_soon_desc": { en: "Live streaming events, artist premieres, and interactive sessions are on the way.", fr: "Événements en direct, premières et sessions interactives arrivent bientôt." },
  "live.upcoming": { en: "upcoming events", fr: "événements à venir" },
  "live.stay_tuned": { en: "Stay tuned", fr: "Restez à l'écoute" },
  "live.event_desc": { en: "Event / Description", fr: "Événement / Description" },
  "live.date": { en: "Date", fr: "Date" },
  "live.action": { en: "Action", fr: "Action" },
  "live.remind_me": { en: "Remind me", fr: "Me rappeler" },
  "live.diaspora_lounge": { en: "Diaspora Lounge Session", fr: "Session Diaspora Lounge" },
  "live.diaspora_desc": { en: "A weekly curated live stream.", fr: "Un live hebdomadaire." },
  "live.artist_drop": { en: "Artist Drop Premiere", fr: "Première Artist Drop" },
  "live.artist_desc": { en: "Timed releases with chat & replay.", fr: "Sorties avec chat et replay." },
  "live.afrobeats": { en: "Afrobeats Live Showcase", fr: "Afrobeats Live Showcase" },
  "live.afrobeats_desc": { en: "Live performances from top artists.", fr: "Performances live d'artistes." },

  "saved.title": { en: "Saved Items", fr: "Éléments sauvegardés" },
  "saved.empty": { en: "No saved items yet", fr: "Rien de sauvegardé" },

  "music.desc_full": { en: "Discover curated tracks from African artists. Preview any song for 60 seconds, then purchase for just $1 to keep it forever.", fr: "Découvrez des morceaux d'artistes africains. Écoutez 60s d'aperçu, puis achetez pour 1$ pour toujours." },
  "music.filter": { en: "Filter", fr: "Filtrer" },
  "music.favourites": { en: "Favourites", fr: "Favoris" },
  "music.upload_song": { en: "Upload Song", fr: "Ajouter un titre" },
  "music.now_playing": { en: "Now Playing", fr: "En lecture" },
  "music.purchase_keep": { en: "Purchase and keep forever", fr: "Achetez et gardez pour toujours" },
  "music.loading": { en: "Loading songs...", fr: "Chargement..." },
  "music.no_songs": { en: "No songs found", fr: "Aucun morceau trouvé" },
  "music.new": { en: "New", fr: "Nouveau" },
  "music.owned": { en: "Owned", fr: "Acquis" },
  "music.in_library": { en: "In Library", fr: "En bibliothèque" },
  "music.add_to_library": { en: "Add to Library", fr: "Ajouter" },

  "common.read_more": { en: "Read more", fr: "Lire la suite" },
  "common.show_less": { en: "Show less", fr: "Réduire" },
  "common.characters_left": { en: "characters left", fr: "caractères restants" },
  "common.all": { en: "All", fr: "Tout" },
  "common.admin_role": { en: "Admin", fr: "Admin" },
  "common.member_role": { en: "Member", fr: "Membre" },
  "common.no_results": { en: "No results found for", fr: "Aucun résultat pour" },

  "footer.radio_free": { en: "Radio and TV will always be free. It's Universal Culture.", fr: "La radio et la TV seront toujours gratuites. C'est la culture universelle." },
  "footer.live": { en: "Some events will be offered $10, many will be free.", fr: "Certains événements seront à 10$, beaucoup seront gratuits." },
  "footer.social": { en: "Sell Your Songs for $1, Request them to be added to the Music section.", fr: "Vendez vos morceaux à 1$, demandez leur ajout à la section Musique." },
  "footer.music": { en: "All Songs are $1 and stored in My Library.", fr: "Tous les morceaux sont à 1$ et stockés dans Ma Bibliothèque." },
  "footer.library": { en: "My Library 50GB storage — $5/mo or $50/yr.", fr: "Ma Bibliothèque 50 Go de stockage — 5$/mois ou 50$/an." },
};

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  toggleLang: () => void;
};

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
  toggleLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem("afrokaviar-lang");
      return (saved === "fr" ? "fr" : "en") as Lang;
    } catch {
      return "en";
    }
  });

  const handleSetLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    try { localStorage.setItem("afrokaviar-lang", newLang); } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    handleSetLang(lang === "en" ? "fr" : "en");
  }, [lang, handleSetLang]);

  const t = useCallback((key: string): string => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
