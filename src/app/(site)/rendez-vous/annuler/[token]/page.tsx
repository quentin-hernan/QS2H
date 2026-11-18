import Link from "next/link";
import { db } from "@/lib/db";
import { fmtLong } from "@/lib/booking";
import { cancelAppointment } from "../../actions";

export const metadata = { title: "Annuler un rendez-vous", robots: { index: false, follow: false } };

export default async function Cancel({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ ok?: string }> }) {
  const [{ token }, { ok }] = await Promise.all([params, searchParams]);
  const a = await db.appointment.findUnique({ where: { token } });
  return (
    <section className="dark-section min-h-screen pb-24 pt-40 md:pt-48">
      <div className="container max-w-xl">
        <h1 className="text-h2 font-medium">Votre rendez-vous</h1>
        {!a ? (
          <p className="mt-6">Ce lien n&apos;est pas valide. <Link href="/rendez-vous" className="underline">Prendre un nouveau rendez-vous</Link>.</p>
        ) : a.status === "annulé" || ok ? (
          <div className="mt-6 space-y-4" role="status"><p>Le rendez-vous du {fmtLong(a.startsAt)} est annulé.</p><Link href="/rendez-vous" className="btn btn-primary btn-fill"><span>Choisir un autre créneau</span></Link></div>
        ) : (
          <div className="mt-6 space-y-6">
            <p className="text-lg">{a.kind}, le <strong>{fmtLong(a.startsAt)}</strong> (heure de Paris).</p>
            <form action={cancelAppointment.bind(null, token)} className="flex flex-wrap gap-3">
              <button className="btn btn-primary btn-fill"><span>Annuler ce rendez-vous</span></button>
              <Link href="/rendez-vous" className="btn btn-outline">Prendre un autre créneau</Link>
            </form>
            <p className="muted text-sm">Pour déplacer le rendez-vous : réservez un nouveau créneau, puis annulez celui-ci.</p>
          </div>
        )}
      </div>
    </section>
  );
}
