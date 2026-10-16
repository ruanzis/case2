import coverAsset from "@/assets/og-cover-case2.png.asset.json";

// Absolute host of the published site: social apps (WhatsApp, Telegram) need a
// full URL for og:image, a relative "/__l5e/..." path is not picked up.
const SITE = "https://case2.lovable.app";

export const OG_COVER = `${SITE}${coverAsset.url}`;
