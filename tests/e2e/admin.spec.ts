import { expect, test, type Page } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD, E2E_TOTP_SECRET } from "./global-setup";
import { totpNow } from "./totp";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Mot de passe").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByLabel(/Code de vérification/).fill(totpNow(E2E_TOTP_SECRET));
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/admin");
}

test("l'administration est protégée", async ({ page, request }) => {
  await page.goto("/admin/realisations");
  await expect(page).toHaveURL(/\/admin\/login/);
  const r = await request.get("/api/admin/export", { maxRedirects: 0 });
  expect(r.status()).toBe(403);
  const up = await request.post("/api/admin/upload", { multipart: { alt: "x" } });
  expect(up.status()).toBe(401);
});

test("connexion refusée avec un mauvais mot de passe", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.locator("p.err")).toContainText("Identifiants incorrects");
});

test("parcours propriétaire : édition, publication et mise à jour du site", async ({ page, context }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // 1. modifier un service -> visible sur le site public
  await page.goto("/admin/services");
  await page.getByRole("link", { name: "Site vitrine" }).first().click();
  const tagline = page.locator("#f-tagline");
  const original = await tagline.inputValue();
  await tagline.fill(original + " [e2e]");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("status")).toContainText("Enregistré");
  const pub = await context.newPage();
  await pub.goto("/services/site-vitrine");
  await expect(pub.getByText("[e2e]").first()).toBeVisible();
  await pub.close();
  await tagline.fill(original);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("status")).toContainText("Enregistré");

  // 2. créer un article avec l'éditeur riche, publier, vérifier la page publique
  await page.goto("/admin/articles/new");
  await page.locator("#f-title").fill("Article e2e");
  await expect(page.locator("#f-slug")).toHaveValue("article-e2e");
  await page.locator("#f-category").fill("Test");
  await page.locator("#f-status").selectOption("published");
  await page.locator("#f-excerpt").fill("Un extrait de test.");
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("Contenu de l'article de test.");
  await page.getByRole("button", { name: "Créer" }).click();
  await page.waitForURL(/\/admin\/articles\/(?!new)/);
  const pub2 = await context.newPage();
  await pub2.goto("/blog/article-e2e");
  await expect(pub2.getByRole("heading", { level: 1 })).toHaveText("Article e2e");
  await expect(pub2.getByText("Contenu de l'article de test.")).toBeVisible();
  await pub2.close();

  // 3. médiathèque : texte alternatif obligatoire
  await page.goto("/admin/mediatheque");
  await page.locator("#up-file").setInputFiles({ name: "t.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") });
  await page.locator("#up-alt").fill("Image de test e2e");
  await page.getByRole("button", { name: "Importer" }).click();
  await expect(page.getByLabel("Texte alternatif").first()).toHaveValue("Image de test e2e");

  // 4. les autres écrans se chargent
  for (const [path, h] of [["/admin/parametres", /Paramètres/], ["/admin/demandes", /Demandes/], ["/admin/utilisateurs", /Utilisateurs/], ["/admin/pages/home", /Accueil/], ["/admin/seo", /SEO/], ["/admin/sauvegarde", /Sauvegardes/]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(h);
  }
  expect(errors).toEqual([]);
});

test("réalisation : un projet client ne se publie pas sans autorisation du client", async ({ page }) => {
  await login(page);
  await page.goto("/admin/realisations/new");
  await page.locator("#f-title").fill("Projet e2e autorisation");
  await page.locator("#f-slug").fill("projet-e2e-autorisation");
  await page.locator("#f-client").fill("Client e2e");
  await page.locator("#f-sector").fill("Artisan");
  await page.locator("#f-summary").fill("Résumé de test.");
  await page.locator("#f-status").selectOption("published");
  await page.getByRole("button", { name: "Créer" }).click();
  await expect(page.locator("p[role=alert]").first()).toContainText("autorisation");
  await page.getByLabel(/J'ai l'autorisation du client/).check();
  await page.getByRole("button", { name: "Créer" }).click();
  await page.waitForURL(/\/admin\/realisations\/(?!new)[a-z0-9]+$/); // la création redirige vers la fiche
  await page.goto("/realisations/projet-e2e-autorisation");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Projet e2e autorisation");
});
