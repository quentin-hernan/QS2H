/** État partagé entre le DOM (GSAP ScrollTrigger, souris) et la scène 3D (useFrame). Mutable à dessein : zéro re-render. */
export const stage = {
  heroOut: 0, // 0 → 1 : le hero sort de l'écran
  progress: 0, // 0 → 1 : avancement de la vue éclatée (section épinglée)
  active: -1, // couche mise en avant
  mx: 0, // pointeur normalisé -1..1
  my: 0,
  covers: [] as string[],
};

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
