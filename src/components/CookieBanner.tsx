"use client";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

const KEY = "qs2h-consent-v1";
type Consent = { analytics: boolean; date: string };

function read(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as Consent) : null;
  } catch {
    return null;
  }
}

export function ManageCookies() {
  return (
    <button type="button" className="link-u" onClick={() => window.dispatchEvent(new Event("qs2h:consent"))}>
      Gérer les cookies
    </button>
  );
}

/** Bannière conforme CNIL : refuser est aussi simple qu'accepter. Mesure d'audience chargée uniquement après accord. */
export function CookieBanner({ plausibleDomain }: { plausibleDomain: string }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const c = read();
    setConsent(c);
    setShow(!c);
    setReady(true);
    const reopen = () => setShow(true);
    window.addEventListener("qs2h:consent", reopen);
    return () => window.removeEventListener("qs2h:consent", reopen);
  }, []);

  // suivi des clics téléphone / email (uniquement si analytics accepté)
  useEffect(() => {
    if (!consent?.analytics) return;
    const h = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      const href = a?.getAttribute("href") || "";
      const w = window as unknown as { plausible?: (n: string) => void };
      if (href.startsWith("tel:")) w.plausible?.("Clic téléphone");
      else if (href.startsWith("mailto:")) w.plausible?.("Clic email");
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [consent]);

  function choose(analytics: boolean) {
    const c = { analytics, date: new Date().toISOString() };
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch {}
    setConsent(c);
    setShow(false);
  }

  return (
    <>
      {ready && consent?.analytics && plausibleDomain && (
        <Script src="https://plausible.io/js/script.tagged-events.js" data-domain={plausibleDomain} strategy="afterInteractive" />
      )}
      {show && (
        <div role="dialog" aria-label="Préférences de cookies" aria-live="polite" className="dark-section fixed inset-x-3 bottom-3 z-[80] max-w-[440px] chamfer border p-6 shadow-2xl md:inset-x-auto md:bottom-6 md:left-6" style={{ borderColor: "rgb(242 239 233 / .16)", background: "#14171C" }}>
          <p className="text-[1.05rem] font-medium">Cookies et mesure d&apos;audience</p>
          <p className="muted mt-2 text-[0.92rem] leading-relaxed">
            Nous utilisons un outil de mesure d&apos;audience pour comprendre quelles pages vous aident. Il n&apos;est activé qu&apos;avec votre accord. Détails dans la <Link href="/politique-de-cookies" className="link-u acc">politique de cookies</Link>.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => choose(false)} className="btn btn-ghost !px-4">Tout refuser</button>
            <button type="button" onClick={() => choose(true)} className="btn btn-ghost !px-4">Tout accepter</button>
          </div>
        </div>
      )}
    </>
  );
}
