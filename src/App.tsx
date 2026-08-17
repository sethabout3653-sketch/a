import { SettingsProvider } from "./lib/settings";
import { BrowserShell } from "./components/browser/BrowserShell";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  // Prevent duplicate browser UI if nested in a sub-frame or loaded on proxy paths
  const isProxyPath =
    typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/~/uv/") ||
      window.location.pathname.startsWith("/~/scramjet/") ||
      window.location.pathname.startsWith("/proxy/"));

  const isDeepNested =
    typeof window !== "undefined" && window.self !== window.top && window.parent !== window.top;

  if (isProxyPath || isDeepNested) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
          <span>Routing through secure Browser...</span>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <BrowserShell />
        {/* Invisible static image overlay over everything */}
        <img
          src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          alt=""
          className="fixed inset-0 z-[999999] h-full w-full object-cover pointer-events-none opacity-0 select-none"
          referrerPolicy="no-referrer"
        />
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
