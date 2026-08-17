import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  STUDYGAMES_ICON_SVG,
  FROSTED_ICON_SVG,
  CLASSROOM_FAVICON,
  DRIVE_FAVICON,
  DOCS_FAVICON,
  SLIDES_FAVICON,
  GOOGLE_FAVICON,
  CANVAS_FAVICON,
  SCHOOLOGY_FAVICON,
  CLEVER_FAVICON,
  EDPUZZLE_FAVICON,
  DESMOS_FAVICON,
  KHAN_FAVICON,
} from "./favicons";

export type Cloak = {
  id: string;
  label: string;
  title: string;
  icon: string;
};

export const CLOAKS: Cloak[] = [
  { id: "none", label: "None (lucide)", title: "lucide", icon: STUDYGAMES_ICON_SVG },
  {
    id: "classroom",
    label: "Google Classroom",
    title: "Home",
    icon: CLASSROOM_FAVICON,
  },
  {
    id: "drive",
    label: "Google Drive",
    title: "My Drive - Google Drive",
    icon: DRIVE_FAVICON,
  },
  {
    id: "docs",
    label: "Google Docs",
    title: "Untitled document - Google Docs",
    icon: DOCS_FAVICON,
  },
  {
    id: "slides",
    label: "Google Slides",
    title: "Untitled presentation - Google Slides",
    icon: SLIDES_FAVICON,
  },
  {
    id: "google",
    label: "Google Search",
    title: "Google",
    icon: GOOGLE_FAVICON,
  },
  {
    id: "canvas",
    label: "Canvas",
    title: "Dashboard",
    icon: CANVAS_FAVICON,
  },
  {
    id: "schoology",
    label: "Schoology",
    title: "Home | Schoology",
    icon: SCHOOLOGY_FAVICON,
  },
  {
    id: "clever",
    label: "Clever",
    title: "Clever | Portal",
    icon: CLEVER_FAVICON,
  },
  {
    id: "edpuzzle",
    label: "Edpuzzle",
    title: "Edpuzzle",
    icon: EDPUZZLE_FAVICON,
  },
  {
    id: "khan",
    label: "Khan Academy",
    title: "Dashboard | Khan Academy",
    icon: KHAN_FAVICON,
  },
  {
    id: "desmos",
    label: "Desmos",
    title: "Desmos | Graphing Calculator",
    icon: DESMOS_FAVICON,
  },
  { id: "custom", label: "Custom", title: "", icon: "" },
];

export type Settings = {
  cloakId: string;
  customTitle: string;
  customIcon: string;
  defaultEngine: "auto" | "ultraviolet" | "scramjet";
  closeProtection: boolean;
  panicKey: string;
  panicUrl: string;
  searchEngine: string;
  discreetMode: boolean;
};

const DEFAULTS: Settings = {
  cloakId: "none",
  customTitle: "",
  customIcon: "",
  defaultEngine: "auto",
  closeProtection: false,
  panicKey: "`",
  panicUrl: "https://classroom.google.com",
  searchEngine: "https://duckduckgo.com/?q=%s",
  discreetMode: false,
};

const STORAGE_KEY = "frosted.settings";

type Ctx = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  ready: boolean;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) });
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update, ready }), [settings, update, ready]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

export function resolveCloak(settings: Settings): { title: string; icon: string } {
  let activeCloakId = settings.cloakId;
  if (settings.discreetMode && activeCloakId === "none") {
    activeCloakId = "classroom";
  }
  if (activeCloakId === "custom") {
    return {
      title: settings.customTitle.trim() || "lucide",
      icon: settings.customIcon.trim() || STUDYGAMES_ICON_SVG,
    };
  }
  const cloak = CLOAKS.find((c) => c.id === activeCloakId);
  if (cloak && cloak.id !== "none") {
    return { title: cloak.title, icon: cloak.icon };
  }
  return { title: "lucide", icon: STUDYGAMES_ICON_SVG };
}

/** Updates the document favicon immediately across all browsers */
export function setDynamicFavicon(iconUrl: string) {
  if (typeof document === "undefined") return;
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) return;

  // Clean out any existing icon link elements to force browser tab redraw
  const existing = document.querySelectorAll<HTMLLinkElement>(
    "link[rel*='icon'], link[rel='apple-touch-icon']",
  );
  existing.forEach((el) => el.remove());

  const link = document.createElement("link");
  link.rel = "icon";
  link.href = iconUrl;
  if (iconUrl.startsWith("data:image/svg") || iconUrl.endsWith(".svg")) {
    link.type = "image/svg+xml";
  }
  link.dataset["frostedDynamic"] = "true";
  head.appendChild(link);

  const shortcut = document.createElement("link");
  shortcut.rel = "shortcut icon";
  shortcut.href = iconUrl;
  if (iconUrl.startsWith("data:image/svg") || iconUrl.endsWith(".svg")) {
    shortcut.type = "image/svg+xml";
  }
  shortcut.dataset["frostedDynamic"] = "true";
  head.appendChild(shortcut);
}

/** Applies tab title + favicon, close protection and the panic key. */
export function useBrowserChrome() {
  const { settings, ready } = useSettings();

  useEffect(() => {
    if (!ready) return;
    const { title, icon } = resolveCloak(settings);
    document.title = title;
    setDynamicFavicon(icon);
  }, [settings, ready]);

  useEffect(() => {
    if (!ready || !settings.closeProtection) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [ready, settings.closeProtection]);

  useEffect(() => {
    if (!ready || !settings.panicKey) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (event.key.toLowerCase() === settings.panicKey.toLowerCase()) {
        window.location.replace(settings.panicUrl || "https://google.com");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ready, settings.panicKey, settings.panicUrl]);
}
