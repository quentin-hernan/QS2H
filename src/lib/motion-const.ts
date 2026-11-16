/** Script bloquant : si le préchargeur a déjà été vu (ou si l'animation est réduite), il est masqué avant le premier rendu. */
export const PRELOADER_SKIP = `try{if(localStorage.getItem("qs2h-pl")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("pl-skip")}catch(e){}`;
