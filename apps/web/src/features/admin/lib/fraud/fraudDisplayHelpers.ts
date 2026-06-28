/** Parse user-agent en libellé appareil lisible (heuristique légère, sans API externe). */
export function parseDeviceLabel(userAgent: string | null, platform: string): string {
  if (!userAgent) {
    if (platform === "web") return "Navigateur web";
    if (platform === "ios") return "iPhone / iPad";
    if (platform === "android") return "Appareil Android";
    return platform;
  }
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("android")) return "Android";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "Mac";
  if (ua.includes("linux")) return "Linux";
  if (ua.includes("mobile")) return "Mobile";
  return "Navigateur web";
}

export function countryLabel(code: string | null): string {
  if (!code) return "Non renseigné";
  const map: Record<string, string> = {
    GN: "Guinée",
    SN: "Sénégal",
    CI: "Côte d'Ivoire",
    ML: "Mali",
    FR: "France",
  };
  return map[code.toUpperCase()] ?? code.toUpperCase();
}
