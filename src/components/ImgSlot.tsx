"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { saveSlot } from "@/app/admin/section-actions";

const MediaPicker = dynamic(() => import("./admin/MediaPicker").then((m) => m.MediaPicker), { ssr: false });
const Ctx = createContext<Record<string, string>>({});

/** Images remplaçables depuis l'éditeur d'apparence : fournit à toute la page la table « emplacement → image ». */
export function SlotsProvider({ slots, children }: { slots: Record<string, string>; children: ReactNode }) {
  return <Ctx.Provider value={slots}>{children}</Ctx.Provider>;
}

/** Emplacement d'image (photo d'équipe, pastille d'avis, visuel de formule…).
 *  Public : affiche l'image choisie, sinon `src`, sinon `children` (ex. l'initiale). Éditeur d'apparence ouvert : un clic ouvre la médiathèque. */
export function ImgSlot({ id, src = "", alt = "", className = "", children, ghost = false }: { id: string; src?: string; alt?: string; className?: string; children?: ReactNode; ghost?: boolean }) {
  const slots = useContext(Ctx);
  const router = useRouter();
  const [local, setLocal] = useState<string | null>(null);
  const [pick, setPick] = useState(false);
  const url = local ?? slots[id] ?? src;
  const editing = () => document.documentElement.classList.contains("sx-editing");
  const open = (e: React.SyntheticEvent) => { if (!editing()) return; e.preventDefault(); e.stopPropagation(); setPick(true); };
  if (!url && !children && !ghost) return null;
  return (
    <>
      <span data-slot={id} className={`slot ${url ? "" : ghost && !children ? "slot-empty" : ""} ${className}`} role={undefined} onClickCapture={open}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (children ?? <span className="slot-hint">+ Image</span>)}
        <i className="slot-badge" aria-hidden="true">Changer l&apos;image</i>
      </span>
      {pick && (
        <MediaPicker
          open
          onClose={() => setPick(false)}
          onPick={async (m) => { setPick(false); setLocal(m.url); await saveSlot(id, m.url); router.refresh(); }}
        />
      )}
    </>
  );
}
