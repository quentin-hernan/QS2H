"use client";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { roundedBox } from "./geometry";

const D = THREE.MathUtils;
export type GItem = { slug: string; title: string; sector: string; cover: string };
const SPACING = 4.1;

/** État du carrousel : drag, inertie, accroche sur le panneau le plus proche. */
function useCarousel(n: number, el: HTMLElement | null, api: { current: { jump: (d: number) => void } | null }) {
  const s = useRef({ target: 0, cur: 0, down: false, lastX: 0, v: 0, moved: 0 });
  useEffect(() => {
    if (!el) return;
    const max = (n - 1) * SPACING;
    const unit = () => (el.clientWidth / 7.4) * 0.9; // px par unité monde (approx.)
    const down = (e: PointerEvent) => { s.current.down = true; s.current.lastX = e.clientX; s.current.v = 0; s.current.moved = 0; el.setPointerCapture?.(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!s.current.down) return;
      const dx = e.clientX - s.current.lastX;
      s.current.lastX = e.clientX;
      s.current.moved += Math.abs(dx);
      s.current.v = dx / unit();
      s.current.target = D.clamp(s.current.target - dx / unit(), -0.5, max + 0.5);
    };
    const up = () => {
      if (!s.current.down) return;
      s.current.down = false;
      const snap = Math.round((s.current.target - s.current.v * 6) / SPACING);
      s.current.target = D.clamp(snap, 0, n - 1) * SPACING;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") jump(1);
      if (e.key === "ArrowLeft") jump(-1);
    };
    const jump = (d: number) => {
      const i = D.clamp(Math.round(s.current.target / SPACING) + d, 0, n - 1);
      s.current.target = i * SPACING;
    };
    api.current = { jump };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("keydown", key);
    };
  }, [el, n, api]);
  return s;
}

function Panel({ item, i, car, accent, onOpen }: { onOpen: (slug: string) => boolean; item: GItem; i: number; car: React.MutableRefObject<{ cur: number; moved: number }>; accent: string }) {
  const tex = useLoader(THREE.TextureLoader, item.cover);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const g = useRef<THREE.Group>(null!);
  const hov = useRef(0);
  const [hot, setHot] = useState(false);
  const router = useRouter();
  const pointer = useRef({ x: 0, y: 0 });
  const geo = useMemo(() => new THREE.PlaneGeometry(3.2, 2, 64, 40), []);
  // relief doux : la carte de déplacement est une version floutée de l'image (évite de déformer le texte)
  const relief = useMemo(() => {
    const im = tex.image as HTMLImageElement | undefined;
    if (!im || !im.width) return tex;
    const c = document.createElement("canvas");
    c.width = 256; c.height = 160;
    const g = c.getContext("2d")!;
    g.filter = "blur(7px)";
    g.drawImage(im, -20, -20, 296, 200);
    return new THREE.CanvasTexture(c);
  }, [tex]);
  const frame = useMemo(() => roundedBox(3.36, 2.16, 0.12, 0.08, 0.016), []);

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05);
    const dx = i * SPACING - car.current.cur;
    const k = D.clamp(1 - Math.abs(dx) / 6, 0, 1);
    hov.current = D.damp(hov.current, hot ? 1 : 0, 6, dt);
    g.current.position.x = dx;
    g.current.position.z = -Math.abs(dx) * 0.32 + hov.current * 0.5;
    g.current.position.y = Math.sin(performance.now() / 1000 * 0.8 + i) * 0.06;
    g.current.rotation.y = D.damp(g.current.rotation.y, -dx * 0.09 + pointer.current.x * 0.3 * hov.current, 5, dt);
    g.current.rotation.x = D.damp(g.current.rotation.x, -pointer.current.y * 0.22 * hov.current, 5, dt);
    g.current.scale.setScalar(0.82 + k * 0.18);
  });

  return (
    <group ref={g}>
      {/* fils de suspension */}
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 3.4, -0.05]}><cylinderGeometry args={[0.006, 0.006, 4.6, 6]} /><meshBasicMaterial color="#8a8d96" transparent opacity={0.5} /></mesh>
      ))}
      <mesh geometry={frame} position={[0, 0, -0.075]}><meshStandardMaterial color="#1a1d23" metalness={0.9} roughness={0.35} /></mesh>
      <mesh
        geometry={geo}
        onPointerOver={(e) => { e.stopPropagation(); setHot(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHot(false); document.body.style.cursor = ""; }}
        onPointerMove={(e) => { if (e.uv) pointer.current = { x: (e.uv.x - 0.5) * 2, y: (e.uv.y - 0.5) * 2 }; }}
        onClick={(e) => { e.stopPropagation(); if (car.current.moved < 6) { if (!onOpen(item.slug)) router.push(`/realisations/${item.slug}`); } }}
      >
        <meshStandardMaterial map={tex} displacementMap={relief} displacementScale={0.09} displacementBias={-0.045} roughness={0.55} metalness={0} emissive={accent} emissiveIntensity={hot ? 0.06 : 0} />
      </mesh>
    </group>
  );
}

function Lights() {
  const l = useRef<THREE.PointLight>(null!);
  const vp = useThree((s) => s.viewport);
  useFrame(({ pointer }, dt) => {
    l.current.position.x = D.damp(l.current.position.x, pointer.x * vp.width * 0.5, 4, dt);
    l.current.position.y = D.damp(l.current.position.y, pointer.y * vp.height * 0.5 + 1, 4, dt);
  });
  return (<><ambientLight intensity={0.8} /><pointLight ref={l} position={[0, 1, 3]} intensity={26} distance={14} color="#fff3e6" /></>);
}

function Loop({ car, state }: { car: React.MutableRefObject<{ cur: number }>; state: React.MutableRefObject<{ target: number; cur: number }> }) {
  useFrame((_, dt) => {
    state.current.cur = D.damp(state.current.cur, state.current.target, 4.5, Math.min(dt, 0.05));
    car.current.cur = state.current.cur;
  });
  return null;
}

export default function GalleryCanvas({ items, accent, running, host, apiRef, lowPower, onOpen }: { onOpen: (slug: string) => boolean; items: GItem[]; accent: string; running: boolean; host: HTMLElement | null; apiRef: React.MutableRefObject<{ jump: (d: number) => void } | null>; lowPower: boolean }) {
  const state = useCarousel(items.length, host, apiRef);
  const car = useRef({ cur: 0, moved: 0 });
  useEffect(() => { const id = setInterval(() => { car.current.moved = state.current.moved; }, 50); return () => clearInterval(id); }, [state]);
  return (
    <Canvas frameloop={running ? "always" : "never"} dpr={[1, lowPower ? 1.5 : 2]} gl={{ alpha: true, antialias: !lowPower }} camera={{ fov: 30, position: [0, 0.3, 9.5] }}>
      <Lights />
      <Loop car={car} state={state} />
      <Suspense fallback={null}>
        {items.map((it, i) => (<Panel key={it.slug} item={it} i={i} car={car} accent={accent} onOpen={onOpen} />))}
      </Suspense>
    </Canvas>
  );
}
