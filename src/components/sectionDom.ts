import { isVideoUrl, type SectionStyle } from "@/lib/section-style";

/** Sections de premier niveau de la page courante (hors scènes épinglées marquées data-nostyle). */
export function listSections(): { el: HTMLElement; label: string }[] {
  const all = Array.from(document.querySelectorAll<HTMLElement>("#contenu section"));
  return all
    .filter((el) => !el.parentElement?.closest("section") && !el.closest("[data-nostyle]") && !el.hasAttribute("data-nostyle"))
    .map((el) => ({ el, label: (el.getAttribute("aria-label") || el.querySelector("h1,h2,h3")?.textContent || "Section").trim().slice(0, 60) }));
}

type Saved = { className: string; style: string };
const saved = new WeakMap<HTMLElement, Saved>();
const observers = new WeakMap<HTMLElement, IntersectionObserver>();

function clear(el: HTMLElement) {
  el.querySelectorAll(":scope > .sx-bg").forEach((n) => n.remove());
  observers.get(el)?.disconnect();
  observers.delete(el);
  const s = saved.get(el);
  if (s) {
    el.className = s.className;
    if (s.style) el.setAttribute("style", s.style); else el.removeAttribute("style");
    saved.delete(el);
  }
  el.removeAttribute("data-sx-par");
}

/** Applique (ou retire) les réglages d'une section directement sur le DOM : sert au site public et à l'aperçu en direct de l'éditeur. */
export function applyStyle(el: HTMLElement, style: SectionStyle | null, opts: { replay?: boolean } = {}) {
  clear(el);
  if (!style || !Object.keys(style).length) return;
  saved.set(el, { className: el.className, style: el.getAttribute("style") || "" });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (style.hidden) { el.style.display = "none"; return; }
  if (style.tone) {
    const was = el.classList.contains("dark-section") ? "dark-section" : el.classList.contains("light-section") ? "light-section" : "";
    const now = style.tone === "dark" ? "dark-section" : "light-section";
    if (was !== now) { el.classList.remove("dark-section", "light-section"); el.classList.add(now); }
  }
  if (style.padTop != null) el.style.paddingTop = `${style.padTop}px`;
  if (style.padBottom != null) el.style.paddingBottom = `${style.padBottom}px`;
  if (style.minH) { el.style.minHeight = `${style.minH}vh`; }
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  el.style.isolation = "isolate";
  el.classList.add("sx-on");

  const b = style.bg;
  if (b && b.type !== "none") {
    const layer = document.createElement("div");
    layer.className = "sx-bg";
    layer.setAttribute("aria-hidden", "true");
    const z = b.zone ?? "full", size = b.size ?? 100;
    Object.assign(layer.style, { top: "0", bottom: "0", left: "0", right: "0" } as Partial<CSSStyleDeclaration>);
    if (z === "left") layer.style.right = `${100 - size}%`;
    if (z === "right") layer.style.left = `${100 - size}%`;
    if (z === "top") layer.style.bottom = `${100 - size}%`;
    if (z === "bottom") layer.style.top = `${100 - size}%`;
    if (z !== "full" && b.radius) layer.style.borderRadius = `${b.radius}px`;
    layer.style.opacity = String((b.alpha ?? 100) / 100);

    if (b.type === "color") layer.style.background = b.color || "#1C1C1C";
    if (b.type === "gradient") {
      layer.style.background = `linear-gradient(${b.angle ?? 135}deg, ${b.color || "#1C1C1C"}, ${b.color2 || "#2A5587"})`;
      if (b.anim === "gradient" && !reduce) layer.classList.add("sx-grad");
    }
    if ((b.type === "image" || b.type === "video") && b.src) {
      const pos = b.pos ?? "center";
      if (b.type === "image" && b.anim === "fixed") {
        layer.style.backgroundImage = `url("${b.src}")`;
        layer.style.backgroundSize = b.fit ?? "cover";
        layer.style.backgroundPosition = pos;
        layer.style.backgroundAttachment = "fixed";
        layer.style.backgroundRepeat = "no-repeat";
      } else {
        const media: HTMLElement = isVideoUrl(b.src) || b.type === "video" ? Object.assign(document.createElement("video"), { src: b.src, muted: true, loop: true, playsInline: true, autoplay: !reduce, preload: "metadata" }) : Object.assign(document.createElement("img"), { src: b.src, alt: "", decoding: "async" });
        media.className = "sx-media";
        media.style.objectFit = b.fit ?? "cover";
        media.style.objectPosition = pos;
        if (b.blur) media.style.filter = `blur(${b.blur}px)`;
        if (!reduce) {
          if (b.anim === "zoom") media.classList.add("sx-zoom");
          if (b.anim === "pan") media.classList.add("sx-pan");
          if (b.anim === "parallax") layer.setAttribute("data-sx-par", "1");
        }
        layer.appendChild(media);
        if (media instanceof HTMLVideoElement && !reduce) media.play().catch(() => {});
      }
    }
    if (b.overlay) {
      const ov = document.createElement("div");
      ov.className = "sx-ov";
      ov.style.background = b.overlayColor === "white" ? `rgba(255,255,255,${b.overlay / 100})` : `rgba(0,0,0,${b.overlay / 100})`;
      layer.appendChild(ov);
    }
    if (b.anim === "parallax" && !reduce) el.setAttribute("data-sx-par", "1");
    el.insertBefore(layer, el.firstChild);
  }

  const e = style.enter;
  if (e && e.type !== "none" && !reduce) {
    el.classList.add("sx-a", `sx-t-${e.type}`);
    el.style.setProperty("--sxd", `${e.duration ?? 800}ms`);
    el.style.setProperty("--sxl", `${e.delay ?? 0}ms`);
    const inView = () => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 0.9 && r.bottom > 0; };
    if (opts.replay || !inView()) {
      el.classList.add("sx-pre");
      if (opts.replay) { void el.offsetWidth; setTimeout(() => el.classList.remove("sx-pre"), 60); }
      else {
        const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { el.classList.remove("sx-pre"); io.disconnect(); } }, { threshold: 0.12 });
        io.observe(el);
        observers.set(el, io);
      }
    }
  }
}

/** Parallaxe : un seul écouteur de défilement pour toutes les sections concernées. */
export function startParallax() {
  let raf = 0;
  const tick = () => {
    raf = 0;
    document.querySelectorAll<HTMLElement>("[data-sx-par] > .sx-bg").forEach((layer) => {
      const m = layer.querySelector<HTMLElement>(".sx-media");
      if (!m) return;
      const r = layer.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      m.style.transform = `translate3d(0, ${(-p * 70).toFixed(1)}px, 0) scale(1.22)`;
    });
  };
  const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener("scroll", on, { passive: true });
  addEventListener("resize", on);
  on();
  return () => { removeEventListener("scroll", on); removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
}
