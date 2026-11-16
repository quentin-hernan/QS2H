import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { hashPassword } from "../../src/lib/password";

const EMAIL = "client-e2e@qs2h.test";
const PASSWORD = "Une-Phrase-De-Passe-Longue-2026!";
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const db = new PrismaClient();

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("qs2h-consent-v1", JSON.stringify({ analytics: false, date: "2026-01-01" })));
});
test.afterAll(async () => { await db.client.deleteMany({ where: { email: { endsWith: "@qs2h.test" } } }); await db.$disconnect(); });

test("inscription : cases de consentement obligatoires, non précochées, réponse générique", async ({ page }) => {
  await page.goto("/compte/inscription");
  const cgu = page.getByLabel(/J'accepte les conditions/);
  const news = page.getByLabel(/recevoir les actualités/);
  await expect(cgu).not.toBeChecked();
  await expect(news).not.toBeChecked();
  await page.getByLabel(/^Prénom/).fill("Camille");
  await page.getByLabel(/^Nom/).fill("Test");
  await page.getByLabel(/Email professionnel/).fill("inscrit-e2e@qs2h.test");
  await page.getByLabel(/^Mot de passe/).fill("Une-Phrase-De-Passe-Longue-2026!");
  await page.getByLabel(/Confirmez/).fill("Une-Phrase-De-Passe-Longue-2026!");
  await cgu.check();
  await page.getByLabel(/majeur/).check();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("status")).toContainText("email de vérification");
  const c = await db.client.findUnique({ where: { email: "inscrit-e2e@qs2h.test" }, include: { consents: true } });
  expect(c?.emailVerifiedAt).toBeNull();
  expect(c?.passwordHash.startsWith("$argon2id")).toBe(true);
  expect(c?.consents.map((k) => k.kind).sort()).toEqual(["cgu", "confidentialite", "majorite"]);
});

test("connexion impossible tant que l'email n'est pas vérifié, message générique", async ({ page }) => {
  await page.goto("/compte/connexion");
  await page.getByLabel("Email").fill("inscrit-e2e@qs2h.test");
  await page.getByLabel("Mot de passe").fill("Une-Phrase-De-Passe-Longue-2026!");
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(page.locator("p.err")).toContainText("Identifiants incorrects");
});

test("espace client : connexion, export, déconnexion partout, suppression avec conservation des factures", async ({ page }) => {
  await db.client.deleteMany({ where: { email: EMAIL } });
  const c = await db.client.create({ data: { email: EMAIL, firstName: "Alix", lastName: "Test", passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: new Date() } });
  await db.clientProject.create({ data: { clientId: c.id, title: "Site vitrine", steps: JSON.stringify([{ name: "Maquette", status: "en-cours", note: "Première proposition" }]) } });
  await db.clientDocument.create({ data: { clientId: c.id, kind: "facture", title: "Facture 2026-001", file: "inexistant.pdf" } });

  await page.goto("/compte");
  await expect(page).toHaveURL(/\/compte\/connexion/);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Me connecter" }).click();
  await expect(page.getByRole("heading", { name: "Bonjour Alix" })).toBeVisible();
  await expect(page.getByText("Première proposition")).toBeVisible();

  // un client ne voit que ses documents : accès sans session refusé
  const noSession = await page.context().browser()!.newContext();
  expect((await noSession.request.get("/api/compte/export")).status()).toBe(401);
  await noSession.close();

  const res = await page.request.get("/api/compte/export?format=json");
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.profile.email).toBe(EMAIL);
  expect(JSON.stringify(data)).not.toContain("passwordHash");

  // suppression : l'email contient un lien à usage unique, un simple chargement ne supprime rien
  await page.goto("/compte/donnees");
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await page.getByRole("button", { name: "Oui, envoyer l'email" }).click();
  await expect(page.getByRole("status")).toContainText("email de confirmation");
  const t = "token-e2e-suppression";
  await db.client.update({ where: { id: c.id }, data: { deleteTokenHash: sha(t), deleteExpires: new Date(Date.now() + 3600e3) } });
  await page.goto(`/compte/suppression/${t}`);
  expect(await db.client.count({ where: { id: c.id } })).toBe(1);
  await page.getByRole("button", { name: "Supprimer définitivement mon compte" }).click();
  await expect(page.getByRole("heading", { name: "Compte supprimé" })).toBeVisible();
  expect(await db.client.count({ where: { id: c.id } })).toBe(0);
  const inv = await db.clientDocument.findFirst({ where: { title: { contains: "Facture 2026-001" } } });
  expect(inv?.clientId).toBeNull();
  expect(inv?.retainedUntil).not.toBeNull();
  await db.clientDocument.deleteMany({ where: { title: { contains: "Facture 2026-001" } } });
});

test("mot de passe oublié : réponse identique que le compte existe ou non", async ({ page }) => {
  for (const email of ["inexistant-e2e@qs2h.test", "inscrit-e2e@qs2h.test"]) {
    await page.goto("/compte/mot-de-passe-oublie");
    await page.getByLabel("Email du compte").fill(email);
    await page.getByRole("button", { name: "Recevoir un lien" }).click();
    await expect(page.getByRole("status")).toContainText("Si un compte existe");
  }
});
