/**
 * Turns a browser's User-Agent (plus optional client hints from the page)
 * into plain labels for the admin "Site Visitors" page: phone / tablet /
 * desktop, the phone model when the browser shares it, the OS and the
 * browser. Best effort — browsers increasingly hide details (Chrome on
 * Android reports the model only through client hints, iPhones never
 * report their model).
 */

export type DeviceType = "phone" | "tablet" | "desktop" | "unknown";

export type ClientHints = {
  model?: string;
  platform?: string;
  platformVersion?: string;
  mobile?: boolean;
  /** navigator.maxTouchPoints — iPads report themselves as Macs. */
  touchPoints?: number;
};

export type DeviceInfo = {
  deviceType: DeviceType;
  deviceModel: string | null;
  os: string | null;
  browser: string | null;
};

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|node-fetch|axios/i;

/** Crawlers, link previews and scripts aren't visitors. */
export const isBot = (ua: string) => !ua || BOT.test(ua);

const major = (version: string | undefined) => version?.split(/[._]/)[0];

function detectBrowser(ua: string): string | null {
  // In-app browsers first: they also contain "Chrome" / "Safari".
  if (/FBAN\/MessengerForiOS|FB_IAB\/Orca|MessengerLite/i.test(ua)) return "Messenger app";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook app";
  if (/Instagram/i.test(ua)) return "Instagram app";
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return "TikTok app";
  if (/ Line\//i.test(ua)) return "LINE app";
  if (/Viber/i.test(ua)) return "Viber app";
  const checks: [RegExp, string][] = [
    [/SamsungBrowser\/([\d.]+)/, "Samsung Internet"],
    [/HuaweiBrowser\/([\d.]+)/, "Huawei Browser"],
    [/MiuiBrowser\/([\d.]+)/, "Mi Browser"],
    [/(?:OPR|Opera)\/([\d.]+)/, "Opera"],
    [/Edg(?:e|A|iOS)?\/([\d.]+)/, "Edge"],
    [/(?:Firefox|FxiOS)\/([\d.]+)/, "Firefox"],
    [/(?:Chrome|CriOS)\/([\d.]+)/, "Chrome"],
    [/Version\/([\d.]+).*Safari/, "Safari"],
  ];
  for (const [pattern, name] of checks) {
    const match = ua.match(pattern);
    if (match) return `${name} ${major(match[1])}`.trim();
  }
  return null;
}

function detectOs(ua: string, hints: ClientHints): string | null {
  if (/HarmonyOS|OpenHarmony/i.test(ua)) return "HarmonyOS";
  const android = ua.match(/Android ([\d.]+)/);
  if (android) return `Android ${major(android[1])}`;
  if (/Android/i.test(ua)) return "Android";
  const ios = ua.match(/(?:iPhone|CPU) OS ([\d_]+)/);
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && (hints.touchPoints ?? 0) > 1)) {
    return ios ? `iPadOS ${major(ios[1])}` : "iPadOS";
  }
  if (/iPhone|iPod/.test(ua)) return ios ? `iOS ${major(ios[1])}` : "iOS";
  if (/Windows NT 10/.test(ua)) {
    // Windows 11 still says "NT 10"; Chromium's client hints tell them apart.
    const v = Number(hints.platformVersion?.split(".")[0]);
    return v >= 13 ? "Windows 11" : v > 0 ? "Windows 10" : "Windows";
  }
  if (/Windows/.test(ua)) return "Windows";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Macintosh|Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return null;
}

function detectType(ua: string, hints: ClientHints): DeviceType {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Macintosh/.test(ua) && (hints.touchPoints ?? 0) > 1)) return "tablet";
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "tablet";
  if (hints.mobile || /Mobi|iPhone|iPod|Android.*Mobile|HarmonyOS/i.test(ua)) return "phone";
  if (/Windows|Macintosh|CrOS|X11|Linux/i.test(ua)) return "desktop";
  return "unknown";
}

/** Common phone model codes → brand, so "SM-A546E" reads "Samsung SM-A546E". */
const BRANDS: [RegExp, string][] = [
  [/^(SM-|Galaxy)/i, "Samsung"],
  [/^Pixel/i, "Google"],
  [/^(CPH|OPPO|PH[A-Z]M|PE[A-Z]M)/i, "OPPO"],
  [/^RMX/i, "realme"],
  [/^(V\d{4}|vivo)/i, "vivo"],
  [/^(Redmi|POCO|Mi |MI |Xiaomi|M\d{4}[A-Z]|2[0-4]\d{6,}[A-Z]?)/i, "Xiaomi"],
  [/^(Infinix|X6\d{2})/i, "Infinix"],
  [/^TECNO/i, "TECNO"],
  [/^itel/i, "itel"],
  [/^(HUAWEI|[A-Z]{3}-(?:L|LX|AL|TL|N)\d)/i, "Huawei"],
  [/^HONOR/i, "Honor"],
  [/^(moto|XT\d{4})/i, "Motorola"],
  [/^(Nokia|TA-\d)/i, "Nokia"],
  [/^(ONEPLUS|[A-Z]{2}\d{4})$/i, "OnePlus"],
];

function withBrand(model: string) {
  const brand = BRANDS.find(([pattern]) => pattern.test(model))?.[1];
  if (!brand || model.toLowerCase().startsWith(brand.toLowerCase())) return model;
  return `${brand} ${model}`;
}

function detectModel(ua: string, hints: ClientHints, type: DeviceType): string | null {
  const hinted = hints.model?.trim();
  if (hinted) return withBrand(hinted);
  // Old-style Android UA: "Android 13; SM-A546E Build/…)" — Chrome now sends "K".
  const android = ua.match(/Android [\d.]+; (?:[a-z]{2}-[a-z]{2}; )?([^;)]+?)(?: Build\/|\))/i);
  if (android && android[1] !== "K" && !/^(wv|Mobile|Linux)$/i.test(android[1])) return withBrand(android[1].trim());
  if (/iPhone/.test(ua)) return "iPhone";
  if (type === "tablet" && (/iPad/.test(ua) || /Macintosh/.test(ua))) return "iPad";
  // Huawei / HarmonyOS list the model code among other tokens: "…; HarmonyOS; ANE-LX2; HMSCore…".
  const huawei = ua.match(/;\s*([A-Z]{3}-[A-Z]{1,3}\d{1,3}[A-Z]?)\s*[;)]/);
  if (huawei) return withBrand(huawei[1]);
  if (/HUAWEI|HarmonyOS/i.test(ua)) return "Huawei";
  return null;
}

export function parseUserAgent(ua: string, hints: ClientHints = {}): DeviceInfo {
  const deviceType = detectType(ua, hints);
  return {
    deviceType,
    deviceModel: detectModel(ua, hints, deviceType)?.slice(0, 80) ?? null,
    os: detectOs(ua, hints)?.slice(0, 40) ?? null,
    browser: detectBrowser(ua)?.slice(0, 40) ?? null,
  };
}
