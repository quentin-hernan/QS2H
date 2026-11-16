import { PrismaClient } from "@prisma/client";

export default async function teardown() {
  const db = new PrismaClient();
  await db.lead.deleteMany({ where: { email: { endsWith: "@qs2h.test" } } });
  await db.user.deleteMany({ where: { email: { endsWith: "@qs2h.test" } } });
  await db.loginLog.deleteMany({ where: { email: { endsWith: "@qs2h.test" } } });
  await db.post.deleteMany({ where: { slug: "article-e2e" } });
  await db.project.deleteMany({ where: { slug: "projet-e2e-autorisation" } });
  await db.media.deleteMany({ where: { alt: "Image de test e2e" } });
  await db.$disconnect();
}
