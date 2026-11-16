import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("qs2h-consent-v1", JSON.stringify({ analytics: false, date: "2026-01-01" })));
});

test("formulaire de devis : validation puis envoi en 4 étapes", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "networkidle" });
  const form = page.getByRole("form", { name: "Demande de devis" });
  const next = form.getByRole("button", { name: /Continuer/ });
  const step = (title: string) => expect(form.getByRole("heading", { level: 2 })).toHaveText(title);

  // étape 1 : blocage tant qu'aucun type n'est choisi
  await next.click();
  await expect(form.getByText("Choisissez un type de projet.")).toBeVisible();
  await form.getByText("Site vitrine", { exact: true }).click();
  await next.click();
  await step("Budget et délai");

  // étape 2
  await next.click();
  await expect(form.getByText("Indiquez une fourchette de budget.")).toBeVisible();
  await form.getByLabel("Budget envisagé").selectOption("1 000 – 2 500 €");
  await form.getByLabel("Délai souhaité").selectOption("Dans 1 à 2 mois");
  await next.click();
  await step("Parlez-nous de votre activité");

  // étape 3
  await form.getByLabel("Votre projet en quelques lignes").fill("court");
  await next.click();
  await expect(form.getByText(/10 caractères minimum/)).toBeVisible();
  await form.getByLabel("Votre projet en quelques lignes").fill("Menuisier en Gironde, je souhaite un site avec galerie de réalisations.");
  await next.click();
  await step("Comment vous joindre ?");

  // étape 4
  await form.getByLabel("Nom et prénom").fill("Testeur E2E");
  await form.getByLabel("Email professionnel").fill("lead@qs2h.test");
  const submit = form.getByRole("button", { name: "Envoyer ma demande" });
  await submit.click();
  await expect(form.getByText(/accepter le traitement de vos données/).first()).toBeVisible();
  await form.getByRole("checkbox").check();
  await submit.click();
  await page.waitForURL("**/contact/merci");
  await expect(page.getByRole("heading", { name: /c'est reçu/i })).toBeVisible();
});

test("anti-spam : honeypot ignoré, données invalides refusées", async ({ request }) => {
  const base = { projectType: "Site vitrine", budget: "Je ne sais pas", deadline: "Pas de date précise", message: "Un message suffisamment long.", name: "Bot", email: "bot@qs2h.test", consent: true };
  const hp = await request.post("/api/devis", { data: { ...base, website: "http://spam" } });
  expect((await hp.json()).ok).toBe(true);
  const bad = await request.post("/api/devis", { data: { ...base, email: "pas-un-email" } });
  expect(bad.status()).toBe(422);
});
