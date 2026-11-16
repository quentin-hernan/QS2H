"use client";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OC } from "three-stdlib";
import { roundedBox } from "./geometry";

export type VPlane = { id: string; name: string; kind: string; image: string; caption: string };
export type SceneApi = { zoom: (f: number) => void; reset: () => void };

const W = 4.2; // largeur d'un plan
const MAX_H = 2.7;

/** Rectangle dont deux angles opposés (haut-gauche, bas-droite) sont biseautés, comme les cadres du logo. */
function chamfer(w: number, h: number, c: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x, y);
  s.lineTo(x + w - c, y);
  s.lineTo(x + w, y + c);
  s.lineTo(x + w, y + h);
  s.lineTo(x + c, y + h);
  s.lineTo(x, y + h - c);
  s.closePath();
  return s;
}
function chamferFace(w: number, h: number, c: number) {
  const g = new THREE.ShapeGeometry(chamfer(w, h, c));
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}

type Item = { p: VPlane; tex: THREE.Texture; h: number; naturalH: number; baseY: number };

function Stack({ planes, explode, selected, onSelect, hover, setHover }: { planes: VPlane[]; explode: MutableRefObject<number>; selected: string | null; onSelect: (id: string | null) => void; hover: string | null; setHover: (id: string | null) => void }) {
  const desk = planes.filter((p) => p.kind !== "mobile" && p.kind !== "tablet");
  const phone = planes.find((p) => p.kind === "mobile");
  const urls = [...desk.map((p) => p.image), ...(phone ? [phone.image] : [])];
  const texs = useTexture(urls) as THREE.Texture[];
  const { gl } = useThree();

  const items: Item[] = useMemo(() => {
    let y = 0;
    const raw = desk.map((p, i) => {
      const t = texs[i];
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      const img = t.image as { width: number; height: number };
      const naturalH = (W * img.height) / img.width;
      const h = Math.min(MAX_H, Math.max(0.5, naturalH));
      if (naturalH > MAX_H) { t.repeat.set(1, MAX_H / naturalH); t.offset.set(0, 1 - MAX_H / naturalH); } // on montre le haut de la section
      t.needsUpdate = true;
      const it = { p, tex: t, h, naturalH, baseY: 0 };
      y -= h / 2; it.baseY = y; y -= h / 2 + 0.04;
      return it;
    });
    const total = -y;
    return raw.map((r) => ({ ...r, baseY: r.baseY + total / 2 }));
  }, [desk, texs, gl]);

  const total = items.reduce((a, i) => a + i.h + 0.04, 0);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const group = useRef<THREE.Group>(null);
  const phoneRef = useRef<THREE.Group>(null);
  const cur = useRef(0);
  const n = items.length;

  const phoneTex = phone ? texs[desk.length] : null;
  const phoneAspect = phoneTex ? ((phoneTex.image as { height: number }).height / (phoneTex.image as { width: number }).width) : 2.1;
  const phoneW = 1.05, phoneH = Math.min(2.4, phoneW * phoneAspect + 0.2);
  const phoneBody = useMemo(() => roundedBox(phoneW + 0.14, phoneH + 0.14, 0.08, 0.16), [phoneH]);
  const phoneScreen = useMemo(() => chamferFace(phoneW, phoneH, 0.0001), [phoneH]);

  useFrame((_, dt) => {
    const e = explode.current;
    cur.current += (e - cur.current) * Math.min(1, dt * 6);
    const k = cur.current;
    const gap = THREE.MathUtils.lerp(0.012, 1.0, k);
    const squash = THREE.MathUtils.lerp(1, 0.42, k);
    const fit = THREE.MathUtils.clamp(4.2 / (total * squash + gap * n * 0.2), 0.32, 1.0);
    if (group.current) group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, fit, 6, dt));
    items.forEach((it, i) => {
      const g = refs.current[i];
      if (!g) return;
      const z = (i - (n - 1) / 2) * gap;
      const isSel = selected === it.p.id, isHov = hover === it.p.id;
      const tx = isSel ? 0.45 : isHov ? 0.18 : 0;
      g.position.x = THREE.MathUtils.damp(g.position.x, tx, 8, dt);
      g.position.y = it.baseY * squash;
      g.position.z = z;
    });
    if (phoneRef.current) {
      phoneRef.current.position.set(THREE.MathUtils.lerp(0.4, 2.6, k), THREE.MathUtils.lerp(-1.4, -0.9, k) - (total * squash) / 2 + total * squash * 0.18, THREE.MathUtils.lerp(0.25, ((n - 1) / 2) * gap + 0.9, k));
    }
  });

  return (
    <group ref={group} position={[0, 0.25, 0]}>
      {items.map((it, i) => {
        const sel = selected === it.p.id;
        return (
          <group key={it.p.id} ref={(el) => { refs.current[i] = el; }}>
            <mesh
              geometry={faceGeom(W, it.h)}
              onClick={(e) => { e.stopPropagation(); onSelect(sel ? null : it.p.id); }}
              onPointerOver={(e) => { e.stopPropagation(); setHover(it.p.id); document.body.style.cursor = "pointer"; }}
              onPointerOut={() => { setHover(null); document.body.style.cursor = ""; }}
              position={[0, 0, 0.022]}
            >
              <meshBasicMaterial map={it.tex} toneMapped={false} />
            </mesh>
            <mesh geometry={bodyGeom(W, it.h)}>
              <meshStandardMaterial color={sel ? "#7A0020" : "#16181c"} roughness={0.5} metalness={0.2} />
            </mesh>
          </group>
        );
      })}
      {phone && phoneTex && (
        <group ref={phoneRef} scale={0.9}>
          <mesh geometry={phoneBody}><meshStandardMaterial color="#101215" roughness={0.35} metalness={0.5} /></mesh>
          <mesh geometry={phoneScreen} position={[0, 0, 0.045]}><meshBasicMaterial map={(() => { phoneTex.colorSpace = THREE.SRGBColorSpace; return phoneTex; })()} toneMapped={false} /></mesh>
        </group>
      )}
    </group>
  );
}

const faceCache = new Map<string, THREE.BufferGeometry>();
function faceGeom(w: number, h: number) {
  const k = `f${w}-${h}`;
  if (!faceCache.has(k)) faceCache.set(k, chamferFace(w, h, 0.16));
  return faceCache.get(k)!;
}
function bodyGeom(w: number, h: number) {
  const k = `b${w}-${h}`;
  if (!faceCache.has(k)) faceCache.set(k, new THREE.ExtrudeGeometry(chamfer(w + 0.04, h + 0.04, 0.17), { depth: 0.02, bevelEnabled: false }));
  return faceCache.get(k)!;
}

function Rig({ apiRef, controls }: { apiRef: MutableRefObject<SceneApi | null>; controls: MutableRefObject<OC | null> }) {
  const { camera } = useThree();
  useEffect(() => {
    apiRef.current = {
      zoom: (f) => { const c = controls.current; if (!c) return; const d = camera.position.clone().sub(c.target).multiplyScalar(f); const len = THREE.MathUtils.clamp(d.length(), 4.5, 15); camera.position.copy(c.target).add(d.setLength(len)); c.update(); },
      reset: () => { camera.position.set(4.6, 1.8, 9); controls.current?.target.set(0, 0, 0); controls.current?.update(); },
    };
  }, [apiRef, camera, controls]);
  return null;
}

export default function ExplodeScene({ planes, explode, selected, onSelect, apiRef, running, lowPower }: { planes: VPlane[]; explode: MutableRefObject<number>; selected: string | null; onSelect: (id: string | null) => void; apiRef: MutableRefObject<SceneApi | null>; running: boolean; lowPower: boolean }) {
  const controls = useRef<OC | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  return (
    <Canvas
      dpr={[1, lowPower ? 1.25 : 1.75]}
      camera={{ position: [4.6, 1.8, 9], fov: 34, near: 0.1, far: 60 }}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: "high-performance" }}
      frameloop={running ? "always" : "never"}
      onPointerMissed={() => onSelect(null)}
      aria-hidden="true"
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 6]} intensity={1.4} />
      <Suspense fallback={null}>
        <Stack planes={planes} explode={explode} selected={selected} onSelect={onSelect} hover={hover} setHover={setHover} />
        <ContactShadows position={[0, -3.4, 0]} opacity={0.28} scale={14} blur={2.6} far={5} resolution={512} color="#2a2118" />
      </Suspense>
      <OrbitControls ref={controls as never} enablePan={false} enableDamping dampingFactor={0.08} minDistance={4.5} maxDistance={15} minPolarAngle={0.9} maxPolarAngle={2.1} minAzimuthAngle={-1.25} maxAzimuthAngle={1.25} rotateSpeed={0.7} />
      <Rig apiRef={apiRef} controls={controls} />
    </Canvas>
  );
}
