import { z } from "zod";

export const PROJECT_TYPES = ["Site vitrine", "Site sur mesure / application", "Refonte de site", "Boutique en ligne", "Référencement SEO", "Maintenance", "Autre / je ne sais pas encore"] as const;
export const BUDGETS = ["Moins de 1 000 €", "1 000 – 2 500 €", "2 500 – 5 000 €", "5 000 – 10 000 €", "Plus de 10 000 €", "Je ne sais pas"] as const;
export const DEADLINES = ["Dès que possible", "Dans 1 à 2 mois", "Dans 3 à 6 mois", "Pas de date précise"] as const;

export const quoteSchema = z.object({
  projectType: z.enum(PROJECT_TYPES, { errorMap: () => ({ message: "Choisissez un type de projet." }) }),
  budget: z.enum(BUDGETS, { errorMap: () => ({ message: "Indiquez une fourchette de budget." }) }),
  deadline: z.enum(DEADLINES, { errorMap: () => ({ message: "Indiquez un délai." }) }),
  message: z.string().trim().min(10, "Décrivez votre projet en quelques mots (10 caractères minimum).").max(4000, "4 000 caractères maximum."),
  name: z.string().trim().min(2, "Indiquez votre nom.").max(120),
  email: z.string().trim().toLowerCase().email("Adresse email invalide.").max(200),
  phone: z.string().trim().max(30).regex(/^[0-9+().\s-]*$/, "Numéro invalide.").optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter le traitement de vos données pour envoyer la demande." }) }),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
  turnstileToken: z.string().optional().or(z.literal("")),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

export const stepFields: (keyof QuoteInput)[][] = [["projectType"], ["budget", "deadline"], ["message"], ["name", "email", "phone", "company", "consent"]];
