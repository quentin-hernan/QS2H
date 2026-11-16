import { chromium } from "@playwright/test";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(m.type() + ": " + m.text().slice(0, 300)); });
p.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 300)));
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(5000);
await p.screenshot({ path: "shots/hero.png" });
// scroll through the pinned exploded section
const total = await p.evaluate(() => document.documentElement.scrollHeight);
console.log("height", total);
for (const [i, y] of [900, 1700, 2500, 3300, 4300].entries()) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `shots/scroll-${i}.png` });
}
console.log(errors.join("\n") || "no console errors");
await b.close();
