import {
  Clapperboard,
  Gamepad2,
  Globe,
  Music,
  Plus,
  Search,
  Sparkles,
  Tv,
  X,
  BookOpen,
  FileText,
  Video,
  Brain,
  Server,
  GraduationCap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { useSettings } from "@/lib/settings";
import { useBookmarks } from "@/lib/bookmarks";
import { getFaviconUrl } from "@/lib/favicons";

type Props = {
  onNavigate: (input: string) => void;
  onOpenGames: () => void;
  onOpenSettings?: () => void;
};

export function NewTabPage({ onNavigate, onOpenGames }: Props) {
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ label: "", url: "" });
  const [isFocused, setIsFocused] = useState(false);
  const { settings, update } = useSettings();
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-background bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:52px_52px] text-foreground font-sans px-4 py-8 select-none overflow-y-auto">
      {/* Center content container */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl py-8">
        {/* Large wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center select-none mb-10 cursor-default"
        >
          <span
            className={`text-[76px] font-normal leading-none font-sans ${
              settings.discreetMode
                ? "text-muted-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.05)] text-[64px]"
                : "text-foreground drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]"
            }`}
          >
            lucide
          </span>
          <div
            className="h-[4px] w-[320px] bg-foreground relative mt-3 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          />
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="w-full max-w-[580px] mb-8"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (value.trim()) onNavigate(value);
            }}
            className={`flex items-center gap-3 rounded-xl border bg-background/90 px-4 py-3 transition-all ${
              isFocused
                ? "border-neutral-600/70 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                : "border-border/60 hover:border-border/80"
            }`}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={value}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search or type a URL"
              spellCheck={false}
              autoFocus
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground font-light"
            />
          </form>
        </motion.div>

        {/* Dynamic Quick Access Bookmarks Grid */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 max-w-lg w-full">
          {bookmarks.map((b) => {
            const lowerTitle = b.title.toLowerCase();
            const lowerUrl = b.url.toLowerCase();

            const isGames =
              b.url === "frosted://games" ||
              lowerTitle === "games" ||
              lowerTitle === "study modules" ||
              lowerTitle === "interactive modules";
            const isGoogle = lowerTitle.includes("google") || lowerUrl.includes("google.com");
            const isYouTube = lowerTitle.includes("youtube") || lowerUrl.includes("youtube.com");

            let displayTitle = b.title;
            let renderIcon;

            if (isGames) {
              displayTitle = "Lessons";
              renderIcon = <Gamepad2 className="h-6 w-6 text-foreground" />;
            } else if (isGoogle) {
              displayTitle = "Google";
              renderIcon = (
                <img
                  src={getFaviconUrl(b.url || "https://google.com")}
                  alt="Google"
                  className="h-7 w-7 object-contain rounded-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              );
            } else if (isYouTube) {
              displayTitle = "YouTube";
              renderIcon = (
                <img
                  src={getFaviconUrl(b.url || "https://youtube.com")}
                  alt="YouTube"
                  className="h-7 w-7 object-contain rounded-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              );
            } else {
              renderIcon = (
                <>
                  <img
                    src={getFaviconUrl(b.url)}
                    alt=""
                    className="h-7 w-7 object-contain rounded-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                      if (sibling) sibling.style.display = "block";
                    }}
                  />
                  <Globe className="h-6 w-6 text-muted-foreground hidden" />
                </>
              );
            }

            return (
              <div key={b.id} className="group relative flex flex-col items-center w-16">
                <button
                  onClick={() => {
                    if (isGames) {
                      onOpenGames();
                    } else {
                      onNavigate(b.url);
                    }
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-border/80 bg-background hover:bg-secondary/80 hover:border-neutral-700 transition-all cursor-pointer relative shadow-sm"
                >
                  {renderIcon}
                </button>
                <span className="mt-2 text-xs text-secondary-foreground font-normal group-hover:text-foreground transition-colors truncate max-w-full text-center">
                  {displayTitle}
                </span>

                {/* Delete button on hover */}
                {!isGames && (
                  <button
                    aria-label={`Delete ${b.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(b.id);
                    }}
                    className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-secondary border border-neutral-700 text-muted-foreground hover:text-foreground shadow-sm transition-colors cursor-pointer z-10"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add custom bookmark button */}
          <div className="flex flex-col items-center w-16">
            <button
              onClick={() => setAdding(!adding)}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-border/80 bg-background hover:bg-secondary/80 hover:border-neutral-700 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="h-6 w-6 text-neutral-200" />
            </button>
            <span className="mt-2 text-xs text-secondary-foreground font-normal">Add</span>
          </div>
        </div>

        {/* Add Bookmark form overlay */}
        {adding && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.label.trim() || !draft.url.trim()) return;
              addBookmark(draft.label.trim(), draft.url.trim());
              setDraft({ label: "", url: "" });
              setAdding(false);
            }}
            className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-[#0d0d0d] p-3 shadow-md"
          >
            <input
              autoFocus
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Name (e.g. Wiki)"
              className="w-32 rounded bg-background border border-border px-3 py-1.5 text-xs text-foreground outline-none focus:border-neutral-600"
            />
            <input
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              placeholder="URL (e.g. wikipedia.org)"
              className="w-48 rounded bg-background border border-border px-3 py-1.5 text-xs text-foreground outline-none focus:border-neutral-600"
            />
            <button
              type="submit"
              className="rounded bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:opacity-90 transition-opacity"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
