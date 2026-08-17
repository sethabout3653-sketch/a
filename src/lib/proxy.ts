/**
 * Proxy Engine & Transport Layer.
 * Supports both Ultraviolet (UV) and Scramjet, backed by BareMux, Epoxy, and Wisp relays.
 */

export type ProxyEngine = "ultraviolet" | "scramjet";
export type ProxyTransport = "epoxy" | "libcurl" | "bare";

export const UV_PREFIX = "/~/uv/";
export const SCRAMJET_PREFIX = "/~/scramjet/";

/** Extended list of public Wisp relays for dynamic fallback based on domain hash */
export const WISP_SERVERS = [
  { name: "Self-Hosted Local (Fastest)", url: "" },
  { name: "Mercury Workshop Primary", url: "wss://wisp.mercurywork.shop/" },
  { name: "TitaniumNetwork", url: "wss://wisp.terbiumon.top/wisp/" },
  { name: "Nebula Public", url: "wss://anura.pro/" },
  { name: "PyDodge Relay", url: "wss://wisp.pydodge.com/" },
  { name: "Radon Relay", url: "wss://radon.games/wisp/" },
];

export function getAvailableWispServers(): { name: string; url: string }[] {
  const isBrowser = typeof window !== "undefined";
  const localWisp = isBrowser
    ? `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/wisp/`
    : "";

  const list: { name: string; url: string }[] = [];
  if (localWisp) {
    list.push({ name: "Self-Hosted Local (Fastest)", url: localWisp });
  }

  WISP_SERVERS.forEach((s) => {
    if (s.url && s.url !== localWisp) {
      list.push(s);
    }
  });

  return list;
}

/** Determines optimal Wisp server dynamically based on target URL */
export function getOptimalWisp(url?: string): string {
  const servers = getAvailableWispServers();
  if (servers.length === 0) return "wss://wisp.mercurywork.shop/";

  // Always prefer local self-hosted Wisp relay first for 100% reliability and lowest latency
  const local = servers.find((s) => s.name.includes("Self-Hosted"));
  if (local) return local.url;

  return servers[0]?.url || "wss://wisp.mercurywork.shop/";
}

/**
 * Dynamically selects transport (libcurl, epoxy, bare) based on target URL requirements
 */
export function chooseProxyTransport(inputUrl: string): ProxyTransport {
  try {
    const parsed = new URL(inputUrl.startsWith("http") ? inputUrl : `https://${inputUrl}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    // libcurl transport excels at sites requiring strict HTTP/2, custom TLS fingerprinting, or streaming media
    const libcurlDomains = [
      "youtube.com",
      "youtu.be",
      "googlevideo.com",
      "spotify.com",
      "twitch.tv",
      "discord.com",
      "cloudflare.com",
      "pornhub.com",
      "xvideos.com",
      "xhamster.com",
      "xnxx.com",
      "redtube.com",
      "youporn.com",
      "spankbang.com",
      "stripchat.com",
      "chaturbate.com",
      "onlyfans.com",
    ];

    if (libcurlDomains.some((d) => host === d || host.endsWith(`.${d}`))) {
      return "libcurl";
    }

    // Default to WebAssembly Epoxy TLS for general web apps & WebGL games
    return "epoxy";
  } catch {
    return "epoxy";
  }
}

/**
 * Ultraviolet XOR codec implementation
 */
export function encodeXor(str: string): string {
  if (!str) return "";
  let fullUrl = str.trim();
  if (
    !/^https?:\/\//i.test(fullUrl) &&
    !fullUrl.startsWith("data:") &&
    !fullUrl.startsWith("blob:")
  ) {
    fullUrl = `https://${fullUrl}`;
  }
  return encodeURIComponent(
    fullUrl
      .toString()
      .split("")
      .map((char, ind) => (ind % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char))
      .join(""),
  );
}

export function decodeXor(str: string): string {
  if (!str) return "";
  const [input, ...search] = str.split("?");
  try {
    const decodedInput = decodeURIComponent(input || "");
    const unmasked = decodedInput
      .split("")
      .map((char, ind) => (ind % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char))
      .join("");
    const result = unmasked + (search.length ? "?" + search.join("?") : "");
    if (
      result &&
      !/^https?:\/\//i.test(result) &&
      !result.startsWith("data:") &&
      !result.startsWith("blob:") &&
      !result.startsWith("about:")
    ) {
      return `https://${result}`;
    }
    return result;
  } catch {
    return str;
  }
}

/**
 * Automatically chooses the best proxy engine based on target site architecture
 */
export function chooseProxyEngine(_inputUrl: string): ProxyEngine {
  // Default to Ultraviolet for rock-solid stability and universal site compatibility
  return "ultraviolet";
}

/**
 * Encodes a URL for the specified proxy engine
 */
export function getProxyUrl(url: string, engine: ProxyEngine): string {
  if (!url) return "";
  let fullUrl = url.trim();
  if (
    !/^https?:\/\//i.test(fullUrl) &&
    !fullUrl.startsWith("data:") &&
    !fullUrl.startsWith("blob:")
  ) {
    fullUrl = `https://${fullUrl}`;
  }
  if (engine === "ultraviolet") {
    return `${UV_PREFIX}${encodeXor(fullUrl)}`;
  }
  return `${SCRAMJET_PREFIX}${encodeURIComponent(fullUrl)}`;
}

/**
 * Strips proxy prefixes to return the clean user-facing URL
 */
export function cleanProxyUrl(raw: string): string {
  if (!raw) return "";
  if (raw.includes(UV_PREFIX)) {
    const part = raw.split(UV_PREFIX)[1] || "";
    return decodeXor(part);
  }
  if (raw.includes(SCRAMJET_PREFIX)) {
    const part = raw.split(SCRAMJET_PREFIX)[1] || "";
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  }
  return raw;
}

/**
 * Removes https:// or http:// protocol prefix for cleaner address bar display
 */
export function stripProtocol(url: string): string {
  if (!url) return "";
  if (url.startsWith("frosted://") || url.startsWith("chrome://") || url.startsWith("about:")) {
    return url;
  }
  return url.replace(/^https?:\/\//i, "");
}

type AnyRecord = Record<string, unknown>;

const scriptPromises: Record<string, Promise<void>> = {};
let controllerPromise: Promise<AnyRecord> | null = null;
let currentWisp = "";
let currentTransport = "";
let connection: AnyRecord | null = null;

function loadScript(src: string): Promise<void> {
  if (scriptPromises[src]) return scriptPromises[src];

  scriptPromises[src] = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.dataset["src"] = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(el);
  });

  return scriptPromises[src];
}

async function ensureScripts() {
  await loadScript("/uv/uv.bundle.js");
  await Promise.all([
    loadScript("/uv/uv.config.js"),
    loadScript("/proxy/scramjet/scramjet.all.js"),
  ]);
}

function withTimeout<T>(promise: Promise<T>, ms: number, message = "Timeout"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function ensureTransport(wisp: string, targetUrl?: string) {
  const preferredTransport = targetUrl ? chooseProxyTransport(targetUrl) : "epoxy";

  if (currentWisp === wisp && currentTransport === preferredTransport && connection) return;

  const dynamicImport = new Function("p", "return import(p)") as (p: string) => Promise<AnyRecord>;
  const mod = await dynamicImport(`${location.origin}/proxy/baremux.mjs`);
  const BareMuxConnection = mod["BareMuxConnection"] as new (worker: string) => AnyRecord;
  if (!connection) {
    connection = new BareMuxConnection(`${location.origin}/proxy/baremux-worker.js`);
  }
  const setTransport = connection["setTransport"] as (
    path: string,
    options: unknown[],
  ) => Promise<void>;

  const localWisp =
    typeof window !== "undefined"
      ? `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/wisp/`
      : "";

  const allServers = getAvailableWispServers().map((s) => s.url);
  // Put requested wisp, local wisp, and primary wisp first
  const candidates = Array.from(
    new Set([wisp, localWisp, "wss://wisp.mercurywork.shop/", ...allServers]),
  ).filter(Boolean);

  let lastError: unknown = null;

  // Order transport paths based on preference
  const transportSequence =
    preferredTransport === "libcurl"
      ? [
          `${location.origin}/proxy/libcurl.mjs`,
          `${location.origin}/proxy/epoxy.mjs`,
          `${location.origin}/proxy/bare-transport.mjs`,
        ]
      : [
          `${location.origin}/proxy/epoxy.mjs`,
          `${location.origin}/proxy/libcurl.mjs`,
          `${location.origin}/proxy/bare-transport.mjs`,
        ];

  for (const targetWisp of candidates) {
    for (const transportPath of transportSequence) {
      try {
        await withTimeout(
          setTransport.call(connection, transportPath, [{ wisp: targetWisp }]),
          2500,
          `Transport setup timeout for ${transportPath}`,
        );
        currentWisp = targetWisp;
        currentTransport = transportPath.includes("libcurl")
          ? "libcurl"
          : transportPath.includes("epoxy")
            ? "epoxy"
            : "bare";
        return;
      } catch (err) {
        lastError = err;
      }
    }
  }

  if (lastError) console.warn("[Frosted Proxy] Transport fallback warning:", lastError);
}

/** Boots both Ultraviolet & Scramjet, registers the Service Worker, and sets Wisp transport. */
export async function initProxy(wisp: string, targetUrl?: string): Promise<AnyRecord> {
  await ensureScripts();

  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          navigator.serviceWorker.removeEventListener("controllerchange", handler);
          resolve();
        };
        navigator.serviceWorker.addEventListener("controllerchange", handler);
        setTimeout(resolve, 800);
      });
    }
  }

  await ensureTransport(wisp, targetUrl);

  if (!controllerPromise) {
    controllerPromise = (async () => {
      try {
        const loader = (window as unknown as AnyRecord)["$scramjetLoadController"] as
          (() => { ScramjetController: new (config: AnyRecord) => AnyRecord }) | undefined;
        if (loader) {
          const { ScramjetController } = loader();
          const controller = new ScramjetController({
            prefix: SCRAMJET_PREFIX,
            files: {
              wasm: "/proxy/scramjet/scramjet.wasm.wasm",
              all: "/proxy/scramjet/scramjet.all.js",
              sync: "/proxy/scramjet/scramjet.sync.js",
            },
          });
          await (controller["init"] as () => Promise<void>).call(controller);
          return controller;
        }
        return {};
      } catch (err) {
        console.warn("[Scramjet controller init warn]:", err);
        return {};
      }
    })();
  }

  const controller = await controllerPromise;
  return controller;
}

/** Turns whatever the user typed into a real URL. */
export function toUrl(input: string, searchEngineTemplate?: string): string {
  const value = input.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const looksLikeHost =
    /^[^\s./]+(\.[^\s./]+)+(\/.*)?$/.test(value) || value.startsWith("localhost");
  if (looksLikeHost) return `https://${value}`;

  const template = searchEngineTemplate || "https://duckduckgo.com/?q=%s";
  if (template.includes("%s")) {
    return template.replace("%s", encodeURIComponent(value));
  }
  return template + encodeURIComponent(value);
}
