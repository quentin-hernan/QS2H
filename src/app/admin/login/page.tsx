import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/Misc";

export const metadata: Metadata = { title: "Connexion — administration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Login() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="dark-section flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border p-8 md:p-10" style={{ borderColor: "rgb(242 239 233 / .14)", background: "#14171C" }}>
        <Image src="/logo-light.png" alt="QS2H" width={720} height={227} sizes="160px" className="mb-8 h-12 w-auto" priority />
        <h1 className="mb-6 text-2xl font-medium">Administration</h1>
        <LoginForm />
      </div>
    </main>
  );
}
