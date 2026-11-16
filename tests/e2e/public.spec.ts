import { expect, test } from "@playwright/test";

const pages = ["/", "/services", "/services/site-vitrine", "/realisations", "/realisations/atelier-bois", "/tarifs", "/methode", "/a-propos", "/blog", "/blog/site-vitrine-ou-sur-mesure", "/faq", "/contact", "/mentions-legales", "/politique-de-confidentialite", "/cgv", "/cgu", "/politique-de-cookies", "/compte/connexion", "/compte/inscription", "/compte/mot-de-passe-oublie"];

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("qs2h-consent-v1", JSON.stringify({ analytics: false, date: "2026-01-01" })));
});

for (const path of pages) {
  test(`page ${path} : rendu, un seul H1, aucune erreur console`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    const r = await page.goto(path, { waitUntil: "networkidle" });
    expect(r?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    expect((await page.title()).length).toBeGreaterThan(10);
    expect(errors).toEqual([]);
  });
}

test("404 personnalisée", async ({ page }) => {
  const r = await page.goto("/cette-page-nexiste-pas");
  expect(r?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /introuvable/i })).toBeVisible();
});

test("sitemap, robots et données structurées", async ({ page, request }) => {
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/services/site-vitrine");
  expect(sm).toContain("/blog/combien-coute-un-site-web-entreprise");
  const rb = await (await request.get("/robots.txt")).text();
  expect(rb).toContain("Disallow: /admin");
  await page.goto("/");
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.join(" ")).toContain("ProfessionalService");
  expect(ld.join(" ")).toContain("FAQPage");
});

test("pas de défilement horizontal à 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const p of ["/", "/tarifs", "/contact"]) {
    await page.goto(p, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `débordement sur ${p}`).toBeLessThanOrEqual(1);
  }
});

test("bannière cookies : refuser est aussi simple qu'accepter", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/");
  const dlg = page.getByRole("dialog", { name: /cookies/i });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole("button", { name: "Tout refuser" })).toBeVisible();
  await expect(dlg.getByRole("button", { name: "Tout accepter" })).toBeVisible();
  await dlg.getByRole("button", { name: "Tout refuser" }).click();
  await expect(dlg).toBeHidden();
  await ctx.close();
});

test("vue éclatée : ouverture, curseur assembler/éclater, vue classique, fermeture au clavier", async ({ page, isMobile }) => {
  test.skip(!!isMobile, "scénario desktop");
  await page.goto("/realisations/atelier-bois", { waitUntil: "networkidle" });
  const open = page.getByRole("button", { name: "Ouvrir la vue éclatée" });
  await open.click();
  const dlg = page.getByRole("dialog", { name: /Vue éclatée/ });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByText("Projet concept")).toBeVisible();
  const slider = dlg.getByRole("slider", { name: /Assembler ou éclater/ });
  await expect(slider).toBeVisible();
  await slider.fill("1");
  await dlg.getByRole("button", { name: "Vue classique" }).click();
  await expect(dlg.getByRole("img", { name: /Navigation — Atelier Bois/ })).toBeVisible();
  await expect(dlg.getByRole("link", { name: /Fiche complète/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dlg).toBeHidden();
  await expect(open).toBeFocused();
});

test("galerie : un projet concept porte le badge et aucun faux avis n'est affiché", async ({ page }) => {
  await page.goto("/realisations", { waitUntil: "networkidle" });
  await expect(page.getByText("Projet concept").first()).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Avis clients")).toHaveCount(0);
});
