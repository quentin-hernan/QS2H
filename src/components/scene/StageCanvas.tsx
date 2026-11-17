"use client";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { roundedBox, roundedPlane } from "./geometry";
import { displayFont, makeLayerTexture } from "./layerTextures";
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
      gr.addColorStop(0, "#242424");
      gr.addColorStop(1, "#1C1C1C");
      g.fillStyle = gr;
      g.fillRect(0, 0, 1280, 800);
      g.fillStyle = accent;
      g.fillRect(80, 360, 120, 6);
      g.fillStyle = "#F8F8F7";
      g.font = `800 84px ${displayFont()}`;
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
        g.fillStyle = "#1C1C1C";
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


/** MacBook fourni (public/models/macbook.fbx) : normalisé (écran de 2,9 unités de large, base posée sur y = 0),
 *  capot détaché sur une charnière, matière de l'écran remplacée par la texture temps réel. */
function buildLaptop(src: THREE.Group, screenTex: THREE.Texture) {
  src.updateMatrixWorld(true);
  const lid = src.getObjectByName("Cube016") as THREE.Mesh;
  const base = src.getObjectByName("Cylinder") as THREE.Mesh;
  const screenIdx = (lid.material as THREE.Material[]).findIndex((m) => m.name === "Material.008");
  // boîte englobante de l'écran (groupe de matière 008) en coordonnées monde du modèle
  const sb = new THREE.Box3(), v = new THREE.Vector3();
  const pos = lid.geometry.attributes.position, idx = lid.geometry.index;
  for (const gr of lid.geometry.groups) if (gr.materialIndex === screenIdx) for (let i = gr.start; i < gr.start + gr.count; i++) { v.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(lid.matrixWorld); sb.expandByPoint(v); }
  const sc = sb.getCenter(new THREE.Vector3());
  const k = 2.9 / sb.getSize(new THREE.Vector3()).x;
  const bb = new THREE.Box3().setFromObject(base);
  const lb = new THREE.Box3().setFromObject(lid);
  const origin = new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2);

  // matières : aluminium brossé, touches sombres, écran = texture temps réel
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); // devant la vitre coplanaire (évite le z-fighting)
  const tune = (m: THREE.MeshPhongMaterial): THREE.Material => {
    if (m.name === "Material.008") return screenMat;
    const alu = m.name === "Material.003";
    const behind = m.name === "Material.005" || m.name === "Material.006" || m.name === "Material.007"; // vitre et cadre du capot, derrière l'écran
    return new THREE.MeshStandardMaterial({ name: m.name, color: behind ? 0x050506 : alu ? 0xc9ccd2 : m.color, metalness: alu ? 1 : 0.25, roughness: alu ? 0.32 : 0.5, envMapIntensity: alu ? 1.25 : 0.8, polygonOffset: behind, polygonOffsetFactor: behind ? 3 : 0, polygonOffsetUnits: behind ? 3 : 0 });
  };
  src.traverse((o) => { const me = o as THREE.Mesh; if (me.isMesh) me.material = Array.isArray(me.material) ? me.material.map((m) => tune(m as THREE.MeshPhongMaterial)) : tune(me.material as THREE.MeshPhongMaterial); });

  // charnière : bord bas-arrière du capot
  const pivot = new THREE.Vector3((lb.min.x + lb.max.x) / 2, lb.min.y, lb.max.z);
  const hinge = new THREE.Group();
  hinge.position.copy(pivot);
  src.add(hinge);
  hinge.attach(lid);
  const root = new THREE.Group();
  const wrap = new THREE.Group();
  wrap.scale.setScalar(k);
  wrap.position.set(-origin.x * k, -origin.y * k, -origin.z * k);
  wrap.add(src);
  root.add(wrap);
  // centre de l'écran et inclinaison du capot ouvert (repère du rig)
  const screenCenter = sc.clone().sub(origin).multiplyScalar(k);
  const tilt = Math.atan2(lb.max.z - lb.min.z, lb.max.y - lb.min.y) * 0.9;
  const hingeRig = pivot.clone().sub(origin).multiplyScalar(k);
  return { root, hinge, screenMat, screenCenter, tilt, hingeRig, wrap };
}

function Rig({ layers, accent, lowPower, onReady }: Omit<Props, "running">) {
  const rig = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const lg = useRef<THREE.Group>(null!);
  const items = useRef<(THREE.Group | null)[]>([]);
  const frames = useRef(0);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const screen = useScreenTexture(accent);
  const fbx = useLoader(FBXLoader, "/models/macbook.fbx");
  const lap = useMemo(() => buildLaptop(fbx.clone(true) as THREE.Group, screen.tex), [fbx, screen]);

  const g = useMemo(
    () => ({
      slab: roundedBox(2.96, 1.85, 0.03, 0.045, 0.006),
      face: roundedPlane(2.9, 1.79, 0.04),
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
    lap.hinge.rotation.x = D.lerp(Math.PI / 2 + lap.tilt, 0, open);
    const opened = open > 0.995;
    lap.screenMat.visible = !opened;
    lg.current.visible = opened;

    // placement du rig
    // hero : portable à droite (texte à gauche) ; vue éclatée : décalée à droite du panneau de texte
    // Zone de l'objet : colonne de droite, texte limité à 46 % du conteneur, 80 px de respiration minimum.
    const W = size.width;
    const pad = W >= 1280 ? 64 : W >= 768 ? 40 : 20;
    const cw = Math.min(W, 1440) - 2 * pad;
    const left = (W - Math.min(W, 1440)) / 2 + pad;
    const regionL = left + cw * 0.46 + 80, regionR = left + cw;
    const dist = camera.position.length();
    const pxu = size.height / (2 * dist * Math.tan(THREE.MathUtils.degToRad(30 / 2))); // pixels par unité monde au niveau de l'objet
    const BASE_W = 3.9; // largeur apparente du portable à l'échelle 1 (lacet inclus)
    const heroS = THREE.MathUtils.clamp((regionR - regionL) / (BASE_W * pxu), 0.42, 0.7); // 0,7 = ~19 % de moins qu'avant
    const heroX = ((regionL + regionR) / 2 - W / 2) / pxu;
    const tx = portrait ? 0 : D.lerp(D.lerp(heroX, heroX * 0.4, ho), 1.75, e);
    const ty = portrait ? D.lerp(D.lerp(2.1, 0.35, ho), 1.3, e) : 0;
    const ts = (portrait ? D.lerp(0.4, 0.55, ho) : D.lerp(heroS, heroS + 0.04, ho)) * D.lerp(1, portrait ? 0.82 : 0.78, e);
    rig.current.position.x = D.damp(rig.current.position.x, tx, 3, dt);
    rig.current.position.y = D.damp(rig.current.position.y, ty + Math.sin(t * 0.7) * 0.03, 3, dt);
    rig.current.scale.setScalar(D.damp(rig.current.scale.x, ts, 3, dt));
    rig.current.rotation.y = D.damp(rig.current.rotation.y, (-0.3 + stage.mx * 0.22) * (1 - e * 0.5), 3, dt);
    rig.current.rotation.x = D.damp(rig.current.rotation.x, stage.my * 0.04, 3, dt);

    // le portable s'efface vers le bas pendant l'éclatement
    body.current.position.y = D.damp(body.current.position.y, (portrait ? -9 : -5.4) * e, 7, dt);
    body.current.rotation.y = D.damp(body.current.rotation.y, e * 0.6, 3, dt);

    // couches : position repliée (plan de l'écran) → vue éclatée
    lg.current.position.set(D.lerp(lap.screenCenter.x, -0.1, e), D.lerp(lap.screenCenter.y, 1.55, e), D.lerp(lap.screenCenter.z, 0.1, e));
    lg.current.rotation.set(D.lerp(-lap.tilt, -0.46, e), D.lerp(0, -0.62, e), D.lerp(0, 0.02, e));
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
    camera.position.z = D.damp(camera.position.z, D.lerp(8.2, 8.8, e) + (portrait ? 2.2 : 0) - ho * 0.5, 3, dt);
    camera.lookAt(0, D.lerp(1.0, 1.5, e), 0);
  });

  return (
    <group ref={rig}>
      <group ref={body}>
        <primitive object={lap.root} />
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
      <Suspense fallback={null}><Rig layers={layers} accent={accent} lowPower={lowPower} onReady={onReady} /></Suspense>
    </Canvas>
  );
}
