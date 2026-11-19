import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { logoutAction } from "../actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NoticeBell } from "@/components/NoticeBell";

export const metadata: Metadata = { title: { default: "Administration", template: "%s — administration" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  const [newLeads, newOrders] = await Promise.all([db.lead.count({ where: { status: "nouveau" } }), db.shopOrder.count({ where: { status: "nouvelle" } })]);
  return (
    <div className="site-shell admin-shell">
    <div className="dark-section min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="border-b p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r" style={{ borderColor: "rgb(242 239 233 / .12)" }}>
        <div className="flex items-center justify-between lg:block">
          <Link href="/admin" aria-label="Tableau de bord"><Image src="/logo-light.png" alt="QS2H" width={720} height={227} sizes="160px" className="admin-logo-d h-10 w-auto lg:mb-8" /><Image src="/logo.png" alt="QS2H" width={720} height={227} sizes="160px" className="admin-logo-l h-10 w-auto lg:mb-8" /></Link>
          <div className="flex items-center gap-3 lg:mb-6"><NoticeBell endpoint="/api/admin/notices" label="Notifications" /><Link href="/" target="_blank" className="muted text-sm underline lg:hidden">Voir le site ↗</Link></div>
        </div>
        <AdminNav owner={s.role === "owner"} newLeads={newLeads} newOrders={newOrders} />
        <div className="mt-6 border-t pt-5 text-sm lg:mt-auto" style={{ borderColor: "rgb(242 239 233 / .12)" }}>
          <p className="font-medium">{s.name}</p><p className="muted">{s.email} · {s.role === "owner" ? "Propriétaire" : "Éditeur"}</p>
          <div className="mt-3 flex items-center gap-4"><ThemeToggle /><Link href="/" target="_blank" className="muted hidden underline lg:inline">Voir le site ↗</Link>
            <form action={logoutAction}><button className="underline">Se déconnecter</button></form></div>
        </div>
      </aside>
      <main id="contenu" className="min-w-0 p-5 md:p-10 xl:p-14"><div className="mx-auto max-w-6xl">{children}</div></main>
    </div>
    </div>
  );
}
