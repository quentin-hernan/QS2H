/** Migration de l'accent bordeaux (#7A0020 / #7A0A22) vers le bleu QS2H (#2A5587) dans les paramètres enregistrés en base. Idempotent. */
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
(async () => {
  const row = await db.setting.findUnique({ where: { key: "theme" } });
  if (!row) return console.log("Aucun thème enregistré : la valeur par défaut (#2A5587) s'applique.");
  const v = JSON.parse(row.value) as { accent?: string };
  if (v.accent && /^#7a0(0|a)2(0|2)$/i.test(v.accent)) { await db.setting.update({ where: { key: "theme" }, data: { value: JSON.stringify({ ...v, accent: "#2A5587" }) } }); console.log("Accent migré vers #2A5587."); }
  else console.log("Accent déjà personnalisé ou à jour :", v.accent);
})().finally(() => db.$disconnect());
