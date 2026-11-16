import { chromium } from "@playwright/test";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => localStorage.setItem("qs2h-consent-v1", JSON.stringify({ analytics: false, date: "x" })));
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
p.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 300)));
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(4500);
await p.screenshot({ path: "shots/hero.png" });
const ys = [1500, 2300, 3300, 4400, 5200, 6200, 7400, 8600, 9800, 11000];
for (const [i, y] of ys.entries()) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(1700);
  await p.screenshot({ path: `shots/h${i}.png` });
}
console.log(errors.join("\n") || "no console errors");
await b.close();
