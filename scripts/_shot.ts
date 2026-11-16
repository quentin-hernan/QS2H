import { chromium } from "playwright-core";
const sizes = [[1440, 900, "1440"], [1920, 1080, "1920"], [390, 844, "390"]] as const;
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const errs: string[] = [];
  for (const [w, h, n] of sizes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1, isMobile: w < 500, hasTouch: w < 500 });
    await ctx.addInitScript(() => localStorage.setItem("qs2h-consent-v1", JSON.stringify({ analytics: false, date: "2026-01-01" })));
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push(String(e)));
    for (const [path, name] of (process.argv.slice(2).length ? process.argv.slice(2).map((a) => a.split(":")) : [["/", "home"]]) as [string, string][]) {
      await p.goto("http://localhost:3000" + path, { waitUntil: "load" });
      await p.waitForTimeout(w < 500 ? 5000 : 4000);
      await p.screenshot({ path: `shots/p1-${name}-${n}.png` });
    }
    await ctx.close();
  }
  console.log("erreurs:", errs.length, errs.slice(0, 3));
  await b.close();
})();
