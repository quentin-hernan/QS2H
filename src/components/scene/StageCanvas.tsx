"use client";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { roundedBox, roundedPlane } from "./geometry";
import { makeLayerTexture } from "./layerTextures";
import { smooth, stage } from "./store";

const D = THREE.MathUtils;
type Props = { layers: { title: string }[]; accent: string; lowPower: boolean; running: boolean; onReady: () => void };

/** Texture temps réel de l'écran : défile les captures des réalisations (fondu de profondeur). */
function useScreenTexture(accent: string) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1280;
    c.height = 800;
    const g = c.getContext("2d")!;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const imgs: HTMLImageElement[] = [];
    let lastKey = "";
    const cover = (im: HTMLImageElement, scale: number, alpha: number) => {
      const r = Math.max(1280 / im.width, 800 / im.height) * scale;
      const w = im.width * r, h = im.height * r;
      g.globalAlpha = alpha;
      g.drawImage(im, (1280 - w) / 2, (800 - h) / 2, w, h);
      g.globalAlpha = 1;
    };
    const placeholder = () => {
      const gr = g.createLinearGradient(0, 0, 1280, 800);
      gr.addColorStop(0, "#14171C");
      gr.addColorStop(1, "#0C0E11");
      g.fillStyle = gr;
      g.fillRect(0, 0, 1280, 800);
      g.fillStyle = accent;
      g.fillRect(80, 360, 120, 6);
      g.fillStyle = "#F2EFE9";
      g.font = "italic 90px Georgia, serif";
      g.fillText("Votre site ici.", 80, 330);
    };
    const load = (urls: string[]) => {
      urls.forEach((u) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => {
          imgs.push(im);
          lastKey = "";
        };
        im.src = u;
      });
    };
    const update = (t: number) => {
      const n = imgs.length;
      if (!n) {
        if (lastKey !== "ph") { placeholder(); tex.needsUpdate = true; lastKey = "ph"; }
        return;
      }
      const period = 5, trans = 1.2;
      const cycle = Math.floor(t / period);
      const local = t - cycle * period;
      const cur = imgs[cycle % n];
      if (n > 1 && local < trans && cycle > 0) {
        const k = D.smootherstep(local / trans, 0, 1);
        g.fillStyle = "#0C0E11";
        g.fillRect(0, 0, 1280, 800);
        cover(imgs[(cycle - 1) % n], 1 - 0.07 * k, 1 - k);
        cover(cur, 1.09 - 0.09 * k, k);
        tex.needsUpdate = true;
        lastKey = "x";
      } else {
        const key = `c${cycle % n}`;
        if (lastKey !== key) { cover(cur, 1, 1); tex.needsUpdate = true; lastKey = key; }
      }
    };
    return { tex, load, update };
  }, [accent]);
}

function Rig({ layers, accent, lowPower, onReady }: Omit<Props, "running">) {
  const rig = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const hinge = useRef<THREE.Group>(null!);
  const lg = useRef<THREE.Group>(null!);
  const lidScreen = useRef<THREE.Mesh>(null!);
  const keys = useRef<THREE.InstancedMesh>(null!);
  const items = useRef<(THREE.Group | null)[]>([]);
  const frames = useRef(0);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const screen = useScreenTexture(accent);

  const g = useMemo(
    () => ({
      base: roundedBox(3.2, 2.2, 0.09, 0.12, 0.012).rotateX(-Math.PI / 2),
      lid: roundedBox(3.2, 2.1, 0.06, 0.1, 0.012),
      pad: roundedBox(1.15, 0.68, 0.012, 0.05, 0.004).rotateX(-Math.PI / 2),
      slab: roundedBox(2.96, 1.85, 0.03, 0.045, 0.006),
      face: roundedPlane(2.9, 1.79, 0.04),
    }),
    [],
  );

  const mats = useMemo(
    () => ({
      alu: new THREE.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 1, roughness: 0.3, envMapIntensity: 1.25 }),
      pad: new THREE.MeshStandardMaterial({ color: 0xb0b3ba, metalness: 1, roughness: 0.2, envMapIntensity: 1.3 }),
      key: new THREE.MeshStandardMaterial({ color: 0x0f1014, metalness: 0.4, roughness: 0.5 }),
      black: new THREE.MeshStandardMaterial({ color: 0x030304, metalness: 0.2, roughness: 0.25 }),
    }),
    [],
  );
  const layerMats = useMemo(
    () =>
      layers.map((l, i) => ({
        tex: i === 0 ? screen.tex : makeLayerTexture(l.title, i, layers.length, accent, ["Maquette", "Textes", "Code", "Recherche", "Vitesse"][i] ?? ""),
        face: null as THREE.MeshBasicMaterial | null,
        slab: new THREE.MeshStandardMaterial({ color: 0x232830, metalness: 0.8, roughness: 0.35, transparent: true }),
        lift: 0,
        op: 1,
      })),
    [layers, accent, screen],
  );

  useEffect(() => { screen.load(stage.covers); }, [screen]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) { m.setPosition((c - 6.5) * 0.196, 0.104, -0.82 + r * 0.18); keys.current.setMatrixAt(i++, m); }
    keys.current.instanceMatrix.needsUpdate = true;
  }, []);

  const born = useRef<number | null>(null);
  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    if (born.current === null) born.current = t;
    if (++frames.current === 3) onReady();
    screen.update(t);

    const e = smooth(0.06, 0.2, stage.progress) * (1 - smooth(0.9, 1, stage.progress));
    const ho = stage.heroOut;
    const portrait = size.width < size.height * 0.95;

    // ouverture du capot à l'arrivée
    const open = smooth(0.3, 2.1, t - born.current);
    hinge.current.rotation.x = D.lerp(Math.PI / 2 - 0.02, -0.2, open);
    const opened = open > 0.995;
    lidScreen.current.visible = !opened;
    lg.current.visible = opened;

    // placement du rig
    // hero : portable à droite (texte à gauche) ; vue éclatée : décalée à droite du panneau de texte
    const tx = portrait ? 0 : D.lerp(D.lerp(0.55, 0.2, ho), 1.75, e);
    const ty = portrait ? D.lerp(D.lerp(1.95, 0.35, ho), 1.3, e) : 0;
    const ts = (portrait ? D.lerp(0.54, 0.62, ho) : D.lerp(0.86, 0.9, ho)) * D.lerp(1, portrait ? 0.82 : 0.72, e);
    rig.current.position.x = D.damp(rig.current.position.x, tx, 3, dt);
    rig.current.position.y = D.damp(rig.current.position.y, ty + Math.sin(t * 0.7) * 0.03, 3, dt);
    rig.current.scale.setScalar(D.damp(rig.current.scale.x, ts, 3, dt));
    rig.current.rotation.y = D.damp(rig.current.rotation.y, (-0.3 + stage.mx * 0.22) * (1 - e * 0.5), 3, dt);
    rig.current.rotation.x = D.damp(rig.current.rotation.x, stage.my * 0.04, 3, dt);

    // le portable s'efface vers le bas pendant l'éclatement
    body.current.position.y = D.damp(body.current.position.y, (portrait ? -9 : -5.4) * e, 7, dt);
    body.current.rotation.y = D.damp(body.current.rotation.y, e * 0.6, 3, dt);

    // couches : position repliée (plan de l'écran) → vue éclatée
    lg.current.position.set(D.lerp(0, -0.1, e), D.lerp(1.1212, 1.55, e), D.lerp(-1.2783, 0.1, e));
    lg.current.rotation.set(D.lerp(-0.2, -0.46, e), D.lerp(0, -0.62, e), D.lerp(0, 0.02, e));
    const gap = D.lerp(0.004, 0.92, e);
    layerMats.forEach((lm, i) => {
      const it = items.current[i];
      if (!it) return;
      const act = stage.active === i && e > 0.5;
      lm.lift = D.damp(lm.lift, act ? 0.42 : 0, 5, dt);
      lm.op = D.damp(lm.op, stage.active === -1 || act || e < 0.5 ? 1 : 0.26, 5, dt);
      it.position.z = -i * gap + 2 * gap * e + lm.lift;
      if (lm.face) lm.face.opacity = lm.op;
      lm.slab.opacity = lm.op;
    });

    // caméra
    camera.position.x = D.damp(camera.position.x, stage.mx * 0.5 * (1 - e), 3, dt);
    camera.position.y = D.damp(camera.position.y, D.lerp(1.55, 1.95, e) - stage.my * 0.2, 3, dt);
    camera.position.z = D.damp(camera.position.z, D.lerp(7.2, 7.9, e) + (portrait ? 2.2 : 0) - ho * 0.5, 3, dt);
    camera.lookAt(0, D.lerp(1.0, 1.5, e), 0);
  });

  return (
    <group ref={rig}>
      <group ref={body}>
        {/* base */}
        <mesh geometry={g.base} material={mats.alu} position={[0, 0.045, 0]} />
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.0915, -0.38]} material={mats.black}><planeGeometry args={[2.86, 1.14]} /></mesh>
        <instancedMesh ref={keys} args={[undefined, undefined, 84]} material={mats.key}><boxGeometry args={[0.165, 0.03, 0.15]} /></instancedMesh>
        <mesh geometry={g.pad} material={mats.pad} position={[0, 0.093, 0.62]} />
        {/* capot */}
        <group ref={hinge} position={[0, 0.09, -1.08]}>
          <mesh geometry={g.lid} material={mats.alu} position={[0, 1.05, -0.035]}>
            <mesh material={mats.black} position={[0, 0, 0.0305]}><planeGeometry args={[3.08, 1.98]} /></mesh>
            <mesh ref={lidScreen} position={[0, 0, 0.0312]}>
              <planeGeometry args={[2.96, 1.85]} />
              <meshBasicMaterial map={screen.tex} toneMapped={false} />
            </mesh>
          </mesh>
        </group>
        <ContactShadows position={[0, 0.002, 0]} opacity={0.55} scale={12} blur={2.6} far={3.5} resolution={lowPower ? 256 : 512} frames={lowPower ? 1 : Infinity} color="#000000" />
      </group>

      {/* couches détachables (vue éclatée) */}
      <group ref={lg}>
        {layerMats.map((lm, i) => (
          <group key={i} ref={(el) => { items.current[i] = el; }}>
            <mesh geometry={g.slab} material={lm.slab} />
            <mesh geometry={g.face} position={[0, 0, 0.0155]}>
              <meshBasicMaterial ref={(m) => { lm.face = m; }} map={lm.tex} transparent toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export default function StageCanvas({ layers, accent, lowPower, running, onReady }: Props) {
  return (
    <Canvas
      frameloop={running ? "always" : "never"}
      dpr={[1, lowPower ? 1.5 : 2]}
      gl={{ alpha: true, antialias: !lowPower, powerPreference: "high-performance" }}
      camera={{ fov: 30, position: [0, 1.55, 9], near: 0.1, far: 60 }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 6, 5]} intensity={0.9} color="#fff1e4" />
      <directionalLight position={[-5, 3, -4]} intensity={0.6} color="#a9c1ff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[14, 8, 1]} />
        <Lightformer form="rect" intensity={3} color="#ffb59a" position={[-8, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 6, 1]} />
        <Lightformer form="rect" intensity={3} color="#b5ccff" position={[8, 2, -2]} rotation-y={-Math.PI / 2} scale={[8, 6, 1]} />
        <Lightformer form="rect" intensity={2} position={[0, 3, -10]} scale={[16, 3, 1]} />
      </Environment>
      <Rig layers={layers} accent={accent} lowPower={lowPower} onReady={onReady} />
    </Canvas>
  );
}
