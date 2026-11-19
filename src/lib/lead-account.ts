import "server-only";
import { getClient } from "./client-auth";
import { db } from "./db";

type Contact = { name?: string; email?: string; phone?: string; company?: string };

/**
 * Client connecté : ses coordonnées de compte priment (l'email est toujours celui du compte, pour rattacher la demande à son espace),
 * le téléphone et l'entreprise du compte complètent ce qui manque, et ce que le client vient de saisir et qui manquait au compte y est enregistré.
 * Sans compte : les données saisies sont utilisées telles quelles.
 */
export async function withAccount<T extends Contact>(d: T): Promise<{ d: T; clientId: string | null }> {
  const c = await getClient();
  if (!c) return { d, clientId: null };
  const merged = { ...d, name: d.name?.trim() || `${c.firstName} ${c.lastName}`.trim(), email: c.email, phone: d.phone || c.phone || "", company: d.company || c.company || "" };
  const patch: { phone?: string; company?: string } = {};
  if (!c.phone && d.phone) patch.phone = d.phone;
  if (!c.company && d.company) patch.company = d.company;
  if (Object.keys(patch).length) await db.client.update({ where: { id: c.id }, data: patch }).catch(() => null);
  return { d: merged, clientId: c.id };
}
