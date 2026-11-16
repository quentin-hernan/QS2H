import { test } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD, E2E_TOTP_SECRET } from "./global-setup";
import { totpNow } from "./totp";

/** Captures d'écran de contrôle visuel (SHOTS=1 npx playwright test shots). Ignoré par défaut. */
test.skip(!process.env.SHOTS, "captures désactivées");

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("qs2h-consent-v1", JSON.stringify({ analytics: false, date: "2026-01-01" })));
});

test("mobile", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => localStorage.setItem("qs2h-consent-v1", JSON.stringify({ analytics: false, date: "2026-01-01" })));
  const p = await ctx.newPage();
  await p.goto("/", { waitUntil: "networkidle" });
  await p.waitForTimeout(4500);
  await p.screenshot({ path: "shots/m-hero.png" });
  await p.evaluate(() => window.scrollTo(0, 1700));
  await p.waitForTimeout(1800);
  await p.screenshot({ path: "shots/m-explode.png" });
  await p.goto("/contact", { waitUntil: "networkidle" });
  await p.screenshot({ path: "shots/m-contact.png" });
  await ctx.close();
});

test("pages publiques", async ({ page }) => {
  for (const [path, name] of [["/services", "services"], ["/realisations", "realisations"], ["/contact", "contact"], ["/tarifs", "tarifs"], ["/blog/site-vitrine-ou-sur-mesure", "article"]] as const) {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `shots/p-${name}.png` });
  }
});

test("admin", async ({ page }) => {
  await page.goto("/admin/login");
  await page.screenshot({ path: "shots/a-login.png" });
  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Mot de passe").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByLabel(/Code de vérification/).fill(totpNow(E2E_TOTP_SECRET));
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/admin");
  await page.screenshot({ path: "shots/a-dashboard.png" });
  await page.goto("/admin/realisations");
  await page.screenshot({ path: "shots/a-list.png" });
  await page.getByRole("link", { name: "Atelier Bois" }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: "shots/a-edit.png" });
  await page.goto("/admin/articles/new");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "shots/a-article.png" });
});
