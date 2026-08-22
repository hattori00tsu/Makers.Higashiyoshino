const reserved = new Set(["p", "reel", "reels", "tv", "stories", "explore", "accounts", "direct"]);

function parseInstagram(url?: string | null) {
  const value = (url ?? "").trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!/(^|\.)instagram\.com$/i.test(parsed.hostname)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function instagramPostPermalink(url?: string | null) {
  const parsed = parseInstagram(url);
  if (!parsed) return "";
  const match = parsed.pathname.match(/^\/(p|reel|reels|tv)\/([^/]+)/i);
  if (!match) return "";
  const kind = match[1].toLowerCase() === "p" ? "p" : match[1].toLowerCase() === "tv" ? "tv" : "reel";
  return `https://www.instagram.com/${kind}/${match[2]}/`;
}

export function instagramProfileUrl(url?: string | null) {
  const parsed = parseInstagram(url);
  if (!parsed) return "";
  const [handle] = parsed.pathname.split("/").filter(Boolean);
  if (!handle || reserved.has(handle.toLowerCase())) return "";
  return `https://www.instagram.com/${handle}/`;
}

export function instagramEmbedPermalink(instagram?: string, permalink?: string) {
  return (
    instagramPostPermalink(permalink) ||
    instagramPostPermalink(instagram) ||
    instagramProfileUrl(instagram)
  );
}
