"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { changeClientPassword, forgotPassword, loginClient, registerAction, requestDeletion, resetPassword, reviewMockup, sendClientMessage, createClientRequest, setNewsletter, updateProfile, logoutEverywhere, type S } from "@/app/(site)/compte/actions";

function Msg({ s }: { s: S }) {
  if (!s) return null;
  return s.error ? <p role="alert" className="err border p-3" style={{ borderColor: "currentColor" }}>{s.error}</p> : s.ok ? <p role="status" className="acc acc-border border p-3">{s.ok}</p> : null;
}
function F({ id, label, type = "text", autoComplete, required = true, defaultValue, hint }: { id: string; label: string; type?: string; autoComplete?: string; required?: boolean; defaultValue?: string; hint?: string }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}{required ? " *" : ""}</label>
      <input id={id} name={id} type={type} className="field" autoComplete={autoComplete} required={required} defaultValue={defaultValue} aria-describedby={hint ? `${id}-h` : undefined} />
      {hint && <p id={`${id}-h`} className="muted mt-1.5 text-[0.8rem]">{hint}</p>}
    </div>
  );
}
const Btn = ({ pending, children }: { pending: boolean; children: React.ReactNode }) => <button className="btn btn-primary" disabled={pending}>{pending ? "Veuillez patienter…" : children}</button>;
const Check = ({ name, children, required }: { name: string; children: React.ReactNode; required?: boolean }) => (
  <label className="flex cursor-pointer items-start gap-3 text-[0.95rem]"><input type="checkbox" name={name} required={required} className="mt-1 h-5 w-5 shrink-0 accent-[rgb(42,85,135)]" /><span>{children}</span></label>
);

export function RegisterForm({ next }: { next?: string }) {
  const [s, act, pending] = useActionState(registerAction, undefined);
  if (s?.ok) return <Msg s={s} />;
  return (
    <form action={act} className="space-y-5" noValidate={false}>
      {next && <input type="hidden" name="next" value={next} />}
      <Msg s={s} />
      <div className="grid gap-5 sm:grid-cols-2"><F id="firstName" label="Prénom" autoComplete="given-name" /><F id="lastName" label="Nom" autoComplete="family-name" /></div>
      <F id="email" label="Email professionnel" type="email" autoComplete="email" />
      <F id="company" label="Entreprise" autoComplete="organization" required={false} />
      <F id="password" label="Mot de passe" type="password" autoComplete="new-password" hint="12 caractères minimum. Une phrase de passe longue est idéale." />
      <F id="confirm" label="Confirmez le mot de passe" type="password" autoComplete="new-password" />
      <div className="hidden" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      <fieldset className="space-y-3 border-t hair pt-5">
        <legend className="sr-only">Consentements</legend>
        <Check name="cgu" required>J&apos;accepte les <Link href="/cgu" className="acc underline" target="_blank">conditions d&apos;utilisation</Link> et la <Link href="/politique-de-confidentialite" className="acc underline" target="_blank">politique de confidentialité</Link>. *</Check>
        <Check name="majorite" required>Je déclare être majeur(e) et utiliser ce service à titre professionnel. *</Check>
        <Check name="newsletter">Je souhaite recevoir les actualités de QS2H (facultatif, désinscription en un clic ; un email de confirmation vous sera envoyé).</Check>
      </fieldset>
      <Btn pending={pending}>Créer mon compte</Btn>
    </form>
  );
}

export function LoginForm({ reset, next }: { reset?: boolean; next?: string }) {
  const [s, act, pending] = useActionState(loginClient, undefined);
  return (
    <form action={act} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      {reset && <p role="status" className="acc acc-border border p-3">Mot de passe modifié. Vous pouvez vous connecter.</p>}
      <Msg s={s} />
      <F id="email" label="Email" type="email" autoComplete="email" />
      <F id="password" label="Mot de passe" type="password" autoComplete="current-password" />
      <Btn pending={pending}>Me connecter</Btn>
      <p className="text-[0.92rem]"><Link href="/compte/mot-de-passe-oublie" className="link-u">Mot de passe oublié ?</Link> · <Link href={next ? `/compte/inscription?next=${encodeURIComponent(next)}` : "/compte/inscription"} className="link-u">Créer un compte</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [s, act, pending] = useActionState(forgotPassword, undefined);
  return (<form action={act} className="space-y-5"><Msg s={s} /><F id="email" label="Email du compte" type="email" autoComplete="email" /><Btn pending={pending}>Recevoir un lien</Btn></form>);
}

export function ResetForm({ token }: { token: string }) {
  const [s, act, pending] = useActionState(resetPassword.bind(null, token), undefined);
  return (<form action={act} className="space-y-5"><Msg s={s} /><F id="password" label="Nouveau mot de passe" type="password" autoComplete="new-password" hint="12 caractères minimum." /><F id="confirm" label="Confirmation" type="password" autoComplete="new-password" /><Btn pending={pending}>Enregistrer</Btn></form>);
}

export function ProfileForm({ c }: { c: { firstName: string; lastName: string; company: string; email: string } }) {
  const [s, act, pending] = useActionState(updateProfile, undefined);
  return (
    <form action={act} className="space-y-5">
      <Msg s={s} />
      <div className="grid gap-5 sm:grid-cols-2"><F id="firstName" label="Prénom" defaultValue={c.firstName} autoComplete="given-name" /><F id="lastName" label="Nom" defaultValue={c.lastName} autoComplete="family-name" /></div>
      <F id="company" label="Entreprise" defaultValue={c.company} required={false} />
      <p className="muted text-[0.9rem]">Email : {c.email} (pour le modifier, écrivez-nous depuis la messagerie).</p>
      <Btn pending={pending}>Enregistrer</Btn>
    </form>
  );
}

export function PasswordForm() {
  const [s, act, pending] = useActionState(changeClientPassword, undefined);
  return (<form action={act} className="space-y-5"><Msg s={s} /><F id="current" label="Mot de passe actuel" type="password" autoComplete="current-password" /><F id="next" label="Nouveau mot de passe" type="password" autoComplete="new-password" /><F id="confirm" label="Confirmation" type="password" autoComplete="new-password" /><Btn pending={pending}>Changer le mot de passe</Btn></form>);
}

export function RequestForm({ projects, preset }: { projects: { id: string; title: string }[]; preset?: string }) {
  const [s, act, pending] = useActionState(createClientRequest, undefined);
  return (
    <form action={act} className="grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2"><Msg s={s} /></div>
      <div className="md:col-span-2"><label className="label" htmlFor="rq-title">Objet</label><input id="rq-title" name="title" required maxLength={120} className="field" placeholder="Ex. Changer la photo de la page À propos" /></div>
      {projects.length > 0 && <div><label className="label" htmlFor="rq-p">Projet concerné</label><select id="rq-p" name="projectId" defaultValue={preset ?? projects[0]?.id} className="field">{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}<option value="">Autre / général</option></select></div>}
      <div><label className="label" htmlFor="rq-pr">Priorité</label><select id="rq-pr" name="priority" defaultValue="normale" className="field"><option value="basse">Basse</option><option value="normale">Normale</option><option value="urgente">Urgente</option></select></div>
      <div className="md:col-span-2"><label className="label" htmlFor="rq-d">Détails</label><textarea id="rq-d" name="details" rows={5} required maxLength={4000} className="field" placeholder="Page, texte actuel, texte souhaité, lien vers une image…" /></div>
      <div className="md:col-span-2"><Btn pending={pending}>Envoyer la demande</Btn></div>
    </form>
  );
}

export function MessageForm() {
  const [s, act, pending] = useActionState(sendClientMessage, undefined);
  return (<form action={act} className="space-y-4"><Msg s={s} /><div><label className="label" htmlFor="body">Votre message</label><textarea id="body" name="body" rows={4} maxLength={4000} required className="field" /></div><Btn pending={pending}>Envoyer</Btn></form>);
}

export function MockupButtons({ id, status }: { id: string; status: string }) {
  const [p, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={p} className="btn btn-primary !min-h-[44px] !px-5 text-sm" onClick={() => start(() => reviewMockup(id, "validée"))}>Valider la maquette</button>
      <button type="button" disabled={p} className="btn btn-ghost !min-h-[44px] !px-5 text-sm" onClick={() => start(() => reviewMockup(id, "modifications demandées"))}>Demander des modifications</button>
      {status && <span className="muted text-sm">État : {status}</span>}
    </div>
  );
}

export function RightsPanel({ newsletter }: { newsletter: boolean }) {
  const [msg, setMsg] = useState<S>();
  const [p, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-10">
      <Msg s={msg} />
      <section>
        <h2 className="eyebrow mb-3">Communications</h2>
        <p className="muted mb-4 max-w-prose">Actualités QS2H : {newsletter ? "vous y êtes inscrit(e)." : "vous n'y êtes pas inscrit(e)."} Vous pouvez changer d&apos;avis à tout moment, aussi simplement qu&apos;au moment de l&apos;inscription.</p>
        <button type="button" disabled={p} className="btn btn-ghost" onClick={() => start(async () => setMsg(await setNewsletter(!newsletter)))}>{newsletter ? "Me désinscrire des actualités" : "M'inscrire aux actualités"}</button>
      </section>
      <section>
        <h2 className="eyebrow mb-3">Accès et portabilité</h2>
        <p className="muted mb-4 max-w-prose">Téléchargez l&apos;ensemble des données que nous détenons sur vous.</p>
        <div className="flex flex-wrap gap-3"><a className="btn btn-ghost" href="/api/compte/export?format=json" download>Exporter en JSON</a><a className="btn btn-ghost" href="/api/compte/export?format=csv" download>Exporter en CSV</a></div>
      </section>
      <section>
        <h2 className="eyebrow mb-3">Sessions</h2>
        <p className="muted mb-4 max-w-prose">Vous pensez qu&apos;un autre appareil est connecté à votre compte ?</p>
        <button type="button" className="btn btn-ghost" onClick={() => start(() => logoutEverywhere())}>Me déconnecter partout</button>
      </section>
      <section>
        <h2 className="eyebrow mb-3">Effacement</h2>
        <p className="muted mb-4 max-w-prose">Suppression définitive de votre compte, de vos messages et de vos demandes, après confirmation par email. Les factures sont conservées 10 ans (obligation légale) sans lien avec votre compte.</p>
        {!confirm ? <button type="button" className="btn btn-ghost" onClick={() => setConfirm(true)}>Supprimer mon compte</button> : (
          <div className="space-y-3 border p-5" style={{ borderColor: "rgb(var(--accent))" }}>
            <p>Un email de confirmation sera envoyé. Continuer ?</p>
            <div className="flex gap-3"><button type="button" disabled={p} className="btn btn-primary" onClick={() => start(async () => { setMsg(await requestDeletion()); setConfirm(false); })}>Oui, envoyer l&apos;email</button><button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>Annuler</button></div>
          </div>
        )}
      </section>
    </div>
  );
}
