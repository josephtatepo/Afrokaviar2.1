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

  "live.title": { en: "Live Events", fr: "Événements en direct" },

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
