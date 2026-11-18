"use client";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { roundedBox, roundedPlane } from "./geometry";
import { displayFont, makeLayerTexture } from "./layerTextures";
import { smooth, stage } from "./store";

const D = THREE.MathUtils;
type Props = { layers: { title: string }[]; accent: string; lowPower: boolean; running: boolean; onReady: () => void };

/** Écran du portable : chaque « site » (une capture de page entière, ou plusieurs captures empilées) défile
 *  doucement de haut en bas comme si on le parcourait, puis un fondu passe au site suivant. */
function useScreenTexture(accent: string) {
  return useMemo(() => {
    const W = 1280, H = 800;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const pages: HTMLCanvasElement[] = []; // une page longue par site, pré-rendue à 1280 px de large
    let lastKey = "";
    const glare = () => {
      const gr = g.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, "rgba(255,255,255,0.09)"); gr.addColorStop(0.35, "rgba(255,255,255,0.025)"); gr.addColorStop(0.36, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    };
    const placeholder = () => {
      const gr = g.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, "#242424"); gr.addColorStop(1, "#1C1C1C");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = accent; g.fillRect(80, 360, 120, 6);
      g.fillStyle = "#F8F8F7"; g.font = `800 84px ${displayFont()}`; g.fillText("Votre site ici.", 80, 330);
    };
    const build = (stack: HTMLImageElement[]) => {
      const hs = stack.map((im) => Math.round(im.height * (W / im.width)));
      const total = Math.min(6000, Math.max(H, hs.reduce((x, y) => x + y, 0)));
      const p = document.createElement("canvas");
      p.width = W; p.height = total;
      const pg = p.getContext("2d")!;
      pg.fillStyle = "#F8F8F7"; pg.fillRect(0, 0, W, total);
      let y = 0;
      stack.forEach((im, i) => { if (y < total) pg.drawImage(im, 0, y, W, hs[i]); y += hs[i]; });
      pages.push(p);
      lastKey = "";
    };
    const load = (entries: string[]) => {
      entries.forEach((entry) => {
        const urls = entry.split("|").filter(Boolean);
        const stack: HTMLImageElement[] = [];
        let left = urls.length;
        const done = () => { if (--left === 0 && stack.some(Boolean)) build(stack.filter(Boolean)); };
        urls.forEach((u, i) => {
          const im = new Image();
          im.crossOrigin = "anonymous";
          im.onload = () => { stack[i] = im; done(); };
          im.onerror = done;
          im.src = u;
        });
      });
    };
    // durée passée sur un site : 1,2 s d'arrêt en haut, défilement à 110 px/s, 1 s d'arrêt en bas (4 s au minimum)
    const SPEED = 110, HOLD = 1.2, FADE = 0.9;
    const span = (p: HTMLCanvasElement) => Math.max(4, HOLD + (p.height - H) / SPEED + 1);
    const offset = (p: HTMLCanvasElement, local: number) => Math.min(p.height - H, Math.max(0, (local - HOLD) * SPEED));
    const draw = (p: HTMLCanvasElement, local: number, alpha = 1) => { g.globalAlpha = alpha; g.drawImage(p, 0, offset(p, local), W, H, 0, 0, W, H); g.globalAlpha = 1; };
    let cur = 0, start = -1;
    const update = (t: number) => {
      if (!pages.length) { if (lastKey !== "ph") { placeholder(); tex.needsUpdate = true; lastKey = "ph"; } return; }
      if (start < 0) start = t;
      let local = t - start;
      let p = pages[cur % pages.length];
      if (local > span(p) + FADE) { cur++; start = t - FADE; local = FADE; p = pages[cur % pages.length]; }
      const prev = pages[(cur - 1 + pages.length) % pages.length];
      if (cur > 0 && local < FADE && pages.length > 1) {
        draw(prev, span(prev), 1);
        draw(p, 0, D.smootherstep(local / FADE, 0, 1));
      } else {
        const key = `${cur}:${Math.round(offset(p, local))}`;
        if (key === lastKey) return;
        lastKey = key;
        g.fillStyle = "#F8F8F7"; g.fillRect(0, 0, W, H);
        draw(p, local);
      }
      glare();
      tex.needsUpdate = true;
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
  lid.geometry = lid.geometry.clone();
  const uv = lid.geometry.attributes.uv as THREE.BufferAttribute | undefined;
  if (uv) {
    const ids = new Set<number>();
    for (const gr of lid.geometry.groups) if (gr.materialIndex === screenIdx) for (let i = gr.start; i < gr.start + gr.count; i++) ids.add(idx ? idx.getX(i) : i);
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    ids.forEach((i) => { const u = uv.getX(i), w = uv.getY(i); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, w); v1 = Math.max(v1, w); });
    if (u1 - u0 > 1e-4 && v1 - v0 > 1e-4) { ids.forEach((i) => uv.setXY(i, (uv.getX(i) - u0) / (u1 - u0), (uv.getY(i) - v0) / (v1 - v0))); uv.needsUpdate = true; }
  }
  const k = 2.9 / sb.getSize(new THREE.Vector3()).x;
  const bb = new THREE.Box3().setFromObject(base);
  const lb = new THREE.Box3().setFromObject(lid);
  const origin = new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2);

  // matières : aluminium brossé, touches sombres, écran = texture temps réel
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false }); // dessiné par-dessus la vitre coplanaire du modèle (évite le z-fighting) ; fondu piloté par l'opacité
  const tune = (m: THREE.MeshPhongMaterial): THREE.Material => {
    if (m.name === "Material.008") return screenMat;
    const alu = m.name === "Material.003";
    const behind = m.name === "Material.005" || m.name === "Material.006" || m.name === "Material.007"; // vitre et cadre du capot, derrière l'écran
    return new THREE.MeshStandardMaterial({ name: m.name, color: behind ? 0x050506 : alu ? 0x8e8f94 : m.color, metalness: alu ? 1 : 0.25, roughness: alu ? 0.4 : 0.5, envMapIntensity: alu ? 1.25 : 0.8, polygonOffset: behind, polygonOffsetFactor: behind ? 3 : 0, polygonOffsetUnits: behind ? 3 : 0 });
  };
  src.traverse((o) => { const me = o as THREE.Mesh; if (me.isMesh) me.material = Array.isArray(me.material) ? me.material.map((m) => tune(m as THREE.MeshPhongMaterial)) : tune(me.material as THREE.MeshPhongMaterial); });
  const bodyMats: THREE.Material[] = [];
  src.traverse((o) => { const me = o as THREE.Mesh; if (me.isMesh) (Array.isArray(me.material) ? me.material : [me.material]).forEach((m) => { if (m !== screenMat && !bodyMats.includes(m)) bodyMats.push(m); }); });

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
  return { root, hinge, screenMat, screenCenter, tilt, hingeRig, wrap, bodyMats };
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
  const camBase = useRef(new THREE.Vector3(0, 1.55, 9));
  const fadeOn = useRef(false);
  const shadow = useRef<THREE.Mesh>(null);
  const shadowTex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(128, 128, 8, 128, 128, 128);
    gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(0.5, "rgba(0,0,0,0.22)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  const [scrC, scrN, camZ, lookBase, lookTmp] = useMemo(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], []);
  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    if (born.current === null) born.current = t;
    if (++frames.current === 3) onReady();
    screen.update(t);

    const e = smooth(0.06, 0.2, stage.progress); // les pages restent déployées jusqu'à la fin (la scène s'efface en fondu lent)
    const mx = stage.auto ? Math.sin(t * 0.4) * 0.6 : stage.mx, my = stage.auto ? Math.cos(t * 0.33) * 0.4 : stage.my; // mobile : léger mouvement automatique
    const ho = stage.heroOut;
    const portrait = size.width < size.height * 0.95;

    // ouverture du capot à l'arrivée
    const age = t - born.current;
    const arrive = smooth(0, 0.6, age); // arrivée : monte légèrement depuis le bas
    const open = smooth(0.05, 0.6, age); // et s'ouvre
    const z = 0;
    // « Sous le capot » : les pages sortent de l'écran pendant que l'ordinateur part vers la gauche en fondu (lent)
    const out = smooth(0.02, 0.42, stage.progress);
    lap.hinge.rotation.x = D.lerp((Math.PI / 2 + lap.tilt) * 0.2, 0, open); // jamais complètement fermé : on ne voit pas « que le dessus »
    const opened = open > 0.995;
    // écran réel du portable tant que les couches ne sont pas déployées ; les couches apparaissent / disparaissent en fondu
    const lf = smooth(0.1, 0.4, e);
    lap.screenMat.opacity = opened ? 1 - lf : 1; // fondu entre l'écran réel et les couches
    lg.current.visible = opened && lf > 0.01;

    // placement du rig
    // hero : portable à droite (texte à gauche) ; vue éclatée : décalée à droite du panneau de texte
    // Zone de l'objet : colonne de droite, texte limité à 46 % du conteneur, 80 px de respiration minimum.
    const W = size.width;
    const pad = W >= 1280 ? 64 : W >= 768 ? 40 : 20;
    const cw = Math.min(W, 1440) - 2 * pad;
    const left = (W - Math.min(W, 1440)) / 2 + pad;
    const regionL = left + cw * 0.43 + 30, regionR = left + cw;
    const dist = camBase.current.length();
    const pxu = size.height / (2 * dist * Math.tan(THREE.MathUtils.degToRad(30 / 2))); // pixels par unité monde au niveau de l'objet
    const BASE_W = 3.9; // largeur apparente du portable à l'échelle 1 (lacet inclus)
    const heroS = THREE.MathUtils.clamp((regionR - regionL) / (BASE_W * pxu), 0.5, 0.95);
    const heroX = ((regionL + regionR) / 2 - W / 2) / pxu;
    const tx = portrait ? 0 : D.lerp(D.lerp(heroX, heroX * 0.4, ho), 1.75, e);
    const ty = portrait ? D.lerp(D.lerp(2.1, 0.35, ho), 1.3, e) : 0;
    const ts = (portrait ? D.lerp(0.4, 0.55, ho) : D.lerp(heroS, heroS + 0.04, ho)) * D.lerp(1, portrait ? 0.82 : 0.78, e);
    rig.current.position.x = D.damp(rig.current.position.x, tx, 3, dt);
    rig.current.position.y = D.damp(rig.current.position.y, ty + Math.sin(t * 0.7) * 0.03 * (1 - z) - (1 - arrive) * (portrait ? 0.5 : 0.6), 4, dt);
    rig.current.scale.setScalar(D.damp(rig.current.scale.x, ts * (0.9 + 0.1 * arrive), 3, dt));
    // repos : inclinaison qui suit la souris (±8° en lacet, ±5° en tangage), lissée ; ramenée de face pendant le zoom
    rig.current.rotation.y = D.damp(rig.current.rotation.y, (-0.3 + mx * 0.14 + Math.sin(t * 0.45) * 0.015) * (1 - e * 0.5) * (1 - z), 3, dt);
    rig.current.rotation.x = D.damp(rig.current.rotation.x, my * 0.087 * (1 - z), 3, dt);

    // le portable s'efface vers le bas pendant l'éclatement
    body.current.position.x = D.damp(body.current.position.x, (portrait ? -6 : -8.5) * out, 4, dt);
    body.current.position.y = D.damp(body.current.position.y, -0.6 * out, 4, dt);
    body.current.rotation.y = D.damp(body.current.rotation.y, out * 0.5, 3, dt);
    const op = 1 - smooth(0.15, 0.85, out);
    const fading = op < 0.995;
    if (fading !== fadeOn.current) { fadeOn.current = fading; lap.bodyMats.forEach((m) => { m.transparent = fading; m.needsUpdate = true; }); }
    lap.bodyMats.forEach((m) => { m.opacity = op; });
    if (shadow.current) { // ombre douce : elle naît avec l'ordinateur (jamais avant) et disparaît dès qu'il s'en va
      const m = shadow.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.42 * smooth(0.25, 1, arrive) * (1 - smooth(0, 0.05, Math.max(out, e)));
      shadow.current.visible = m.opacity > 0.01;
    }

    // couches : position repliée (plan de l'écran) → vue éclatée
    lg.current.position.set(D.lerp(lap.screenCenter.x, -0.1, e), D.lerp(lap.screenCenter.y, 1.55, e), D.lerp(lap.screenCenter.z, 0.1, e));
    lg.current.rotation.set(D.lerp(-lap.tilt, -0.46, e), D.lerp(0, -0.62, e), D.lerp(0, 0.02, e));
    const gap = D.lerp(0.004, 0.92, e);
    layerMats.forEach((lm, i) => {
      const it = items.current[i];
      if (!it) return;
      const act = stage.active === i && e > 0.5;
      lm.lift = D.damp(lm.lift, act ? 0.42 : 0, 5, dt);
      // les pages devant la couche active s'effacent progressivement pour ne pas la cacher ; celles derrière restent en retrait
      const target = stage.active === -1 || e < 0.5 || act ? 1 : i < stage.active ? 0 : 0.3;
      lm.op = D.damp(lm.op, target, 10, dt);
      it.position.z = -i * gap + 2 * gap * e + lm.lift;
      if (lm.face) lm.face.opacity = lm.op * lf;
      lm.slab.opacity = lm.op * lf;
      it.visible = lm.op * lf > 0.02;
    });

    // caméra
    const cb = camBase.current;
    cb.x = D.damp(cb.x, mx * 0.3 * (1 - e), 3, dt);
    cb.y = D.damp(cb.y, D.lerp(1.55, 1.95, e) - my * 0.12, 3, dt);
    cb.z = D.damp(cb.z, D.lerp(8.2, 8.8, e) + (portrait ? 2.2 : 0) - ho * 0.5, 3, dt);
    lookBase.set(0, D.lerp(1.0, 1.5, e), 0);
    if (z > 0.001) {
      // la caméra avance face à l'écran jusqu'à ce qu'il remplisse la fenêtre
      rig.current.updateMatrixWorld(true);
      const c = scrC.copy(lap.screenCenter); body.current.localToWorld(c);
      const n = scrN.set(0, Math.sin(lap.tilt), Math.cos(lap.tilt)).transformDirection(body.current.matrixWorld);
      const s = rig.current.scale.x;
      const vf = Math.tan(THREE.MathUtils.degToRad(30 / 2));
      const aspect = size.width / size.height;
      const d = Math.min((1.45 * s) / (vf * aspect), (0.9 * s) / vf) * 0.96;
      camZ.copy(c).addScaledVector(n, d);
      camera.position.lerpVectors(cb, camZ, z);
      lookTmp.lerpVectors(lookBase, c, z);
      camera.lookAt(lookTmp);
    } else {
      camera.position.copy(cb);
      camera.lookAt(lookBase);
    }
  });

  return (
    <group ref={rig}>
      <group ref={body}>
        <primitive object={lap.root} />
        <mesh ref={shadow} position={[0, 0.004, 0.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[4.6, 2.6, 1]} renderOrder={-1}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={shadowTex} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
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
      dpr={[1, lowPower ? 1.5 : 2]} /* plafonné à 2 */
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
