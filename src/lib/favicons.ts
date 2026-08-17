// Embedded high-fidelity vector icons as SVG data URIs and official CDN URLs for cloaking

export const STUDYGAMES_ICON_SVG = `data:image/svg+xml,${encodeURIComponent(
  `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#f8fafc"/>
  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" stroke="#3b82f6" stroke-width="1.5" stroke-opacity="0.6"/>
  <path d="M32 10C32 10 20 25 20 37C20 44.18 25.37 50 32 50C38.63 50 44 44.18 44 37C44 25 32 10 32 10Z" fill="url(#blue_grad)"/>
  <path d="M32 22C32 22 25 31 25 38C25 41.87 28.13 45 32 45C35.87 45 39 41.87 39 38C39 31 32 22 32 22Z" fill="#1d4ed8"/>
  <defs>
    <linearGradient id="blue_grad" x1="32" y1="10" x2="32" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
</svg>
`.trim(),
)}`;

export const FROSTED_ICON_SVG = STUDYGAMES_ICON_SVG;

export const CLASSROOM_FAVICON = "https://ssl.gstatic.com/classroom/favicon.png";
export const DRIVE_FAVICON =
  "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png";
export const DOCS_FAVICON =
  "https://ssl.gstatic.com/images/branding/product/1x/docs_2020q4_32dp.png";
export const SLIDES_FAVICON =
  "https://ssl.gstatic.com/images/branding/product/1x/slides_2020q4_32dp.png";
export const GOOGLE_FAVICON = "https://www.google.com/s2/favicons?domain=google.com&sz=128";
export const YOUTUBE_FAVICON = "https://www.google.com/s2/favicons?domain=youtube.com&sz=128";
export const CANVAS_FAVICON = "https://www.google.com/s2/favicons?domain=instructure.com&sz=128";
export const SCHOOLOGY_FAVICON = "https://www.google.com/s2/favicons?domain=schoology.com&sz=128";
export const CLEVER_FAVICON = "https://www.google.com/s2/favicons?domain=clever.com&sz=128";
export const EDPUZZLE_FAVICON = "https://www.google.com/s2/favicons?domain=edpuzzle.com&sz=128";
export const DESMOS_FAVICON = "https://www.google.com/s2/favicons?domain=desmos.com&sz=128";
export const KHAN_FAVICON = "https://www.google.com/s2/favicons?domain=khanacademy.org&sz=128";

/**
 * Returns a high-res real favicon URL for any domain or full URL using Google's Favicon CDN
 */
export function getFaviconUrl(target: string): string {
  if (!target) return FROSTED_ICON_SVG;
  try {
    let hostname: string | undefined = target.trim();
    if (hostname.startsWith("http://") || hostname.startsWith("https://")) {
      hostname = new URL(hostname).hostname;
    } else if (hostname.includes("/")) {
      hostname = hostname.split("/")[0];
    }

    if (!hostname) return FROSTED_ICON_SVG;
    hostname = hostname.replace(/^www\./, "").toLowerCase();

    if (!hostname || hostname === "localhost" || hostname.startsWith("frosted:")) {
      return FROSTED_ICON_SVG;
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
  } catch {
    return FROSTED_ICON_SVG;
  }
}
