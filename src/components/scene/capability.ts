/** Décide si la scène 3D peut tourner : WebGL dispo, appareil correct, pas de préférence pour moins d'animation. */
export function detect3D(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  if ((nav.deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
