"use client";
import { useEffect, useState } from "react";

const KEY = "qs2h-theme";
const media = () => matchMedia("(prefers-color-scheme: dark)");
const resolve = () => { try { const v = localStorage.getItem(KEY); if (v === "light" || v === "dark") return v; } catch { /* stockage indisponible */ } return media().matches ? "dark" : "light"; };

/** Bascule clair / sombre. Sans choix du visiteur, le thème suit celui de son navigateur (y compris s'il change en cours de visite). */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const apply = () => { const t = resolve(); document.documentElement.dataset.theme = t; setTheme(t); };
    apply();
    const mq = media();
    const onChange = () => { try { if (localStorage.getItem(KEY)) return; } catch { /* */ } apply(); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" className={`theme-toggle ${className}`} aria-label={next === "dark" ? "Passer au thème sombre" : "Passer au thème clair"} title={next === "dark" ? "Thème sombre" : "Thème clair"}
      onClick={() => { try { localStorage.setItem(KEY, next); } catch { /* */ } document.documentElement.dataset.theme = next; setTheme(next); window.dispatchEvent(new Event("qs2h:theme")); }}>
      <svg className="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      <svg className="sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    </button>
  );
}
