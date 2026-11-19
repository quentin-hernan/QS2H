import { BookingForm } from "@/components/BookingForm";
import { RdvScene } from "@/components/Scenes";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSettings } from "@/lib/content";
import { KINDS } from "@/lib/booking";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Prendre rendez-vous : appel, visio ou sur place",
  description: "Réservez un créneau avec QS2H : appel découverte de 20 minutes, visio ou rendez-vous à La Rochelle. Confirmation par email avec fichier agenda.",
  path: "/rendez-vous",
});

export default async function Rdv() {
  const s = await getSettings();
  return (
    <section className="dark-section min-h-screen pb-24 pt-40 md:pt-48">
      <div className="container grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-4">
          <Breadcrumbs items={[{ name: "Prendre rendez-vous", path: "/rendez-vous" }]} />
          <p className="eyebrow mb-7">Rendez-vous</p>
          <h1 className="text-h1 font-medium">Choisissez <span className="serif-it">votre créneau.</span></h1>
          <p className="muted mt-7 max-w-md text-[1.1rem] leading-relaxed">Un échange gratuit et sans engagement pour parler de votre projet. Les horaires sont en heure de Paris. Votre créneau est réservé aussitôt ; nous le validons rapidement et vous recevez la confirmation avec un fichier agenda, puis un rappel la veille.</p>
          <p className="muted mt-6 text-sm">Horaires de l&apos;agence : {s.company.hours}</p>
          <div className="mt-12 hidden max-w-sm lg:block"><RdvScene /></div>
        </div>
        <div className="min-w-0 lg:col-span-8"><BookingForm kinds={KINDS.map((k) => ({ id: k.id, label: k.label, minutes: k.minutes, text: k.text }))} /></div>
      </div>
    </section>
  );
}
