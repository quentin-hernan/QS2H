import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const E2E_EMAIL = "e2e-admin@qs2h.test";
export const E2E_PASSWORD = "E2e-Test-Password-2026";
export const E2E_TOTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"; // propriétaire : double authentification obligatoire

/** Crée un compte propriétaire jetable pour les tests (supprimé en fin de run). */
export default async function setup() {
  const db = new PrismaClient();
  await db.loginLog.deleteMany({ where: { email: E2E_EMAIL } });
  await db.user.deleteMany({ where: { email: E2E_EMAIL } });
  await db.user.create({ data: { email: E2E_EMAIL, name: "Test E2E", role: "owner", passwordHash: await bcrypt.hash(E2E_PASSWORD, 10), mustChangePassword: false, totpSecret: E2E_TOTP_SECRET, totpEnabled: true } });
  await db.$disconnect();
}
