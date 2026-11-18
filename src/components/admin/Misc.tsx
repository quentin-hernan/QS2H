"use client";
import { MediaPicker } from "./MediaPicker";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PageSchema } from "@/lib/defaults";
import { LEAD_STATUSES } from "@/lib/admin-resources";
import {
  acceptInvite, changePassword, confirm2fa, deleteLead, deleteMedia, deleteResource, deleteUser, disable2fa, duplicateResource,
  inviteUser, loginAction, moveResource, restorePageVersion, savePage, saveSettings, setUserRole, start2fa, updateLead, updateMediaAlt, type LoginState,
} from "@/app/admin/actions";

const ring = { borderColor: "rgb(242 239 233 / .16)" } as const;

/* ------------------------------------------------------------ connexion */
export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form action={action} className="space-y-5" noValidate>
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><label className="label" htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" autoComplete="current-password" required className="field" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {state?.totp && <div><label className="label" htmlFor="code">Code de vérification (application d&apos;authentification)</label><input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} autoFocus className="field" /></div>}
      {state?.error && <p role="alert" className="err">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</button>
    </form>
  );
}

export function InviteAcceptForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvite.bind(null, token), undefined);
  return (
    <form action={action} className="space-y-5">
      <div><label className="label" htmlFor="password">Nouveau mot de passe</label><input id="password" name="password" type="password" autoComplete="new-password" required className="field" /><p className="muted mt-1.5 text-xs">12 caractères minimum, avec majuscules, minuscules et chiffres.</p></div>
      <div><label className="label" htmlFor="confirm">Confirmation</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" /></div>
      {state?.error && <p role="alert" className="err">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>Créer mon mot de passe</button>
    </form>
  );
}

/* ------------------------------------------------------------ actions de liste */
export function ConfirmButton({ label, confirm, onConfirm, className = "" }: { label: string; confirm: string; onConfirm: () => Promise<unknown> | void; className?: string }) {
  const [pending, start] = useTransition();
  return (<button type="button" disabled={pending} className={className || "err underline"} onClick={() => { if (window.confirm(confirm)) start(async () => { await onConfirm(); }); }}>{pending ? "…" : label}</button>);
}

export function RowActions({ resourceKey, id, orderable, duplicable, first, last }: { resourceKey: string; id: string; orderable: boolean; duplicable: boolean; first: boolean; last: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-end gap-4 text-sm">
      {orderable && (<span className="flex gap-1"><button type="button" aria-label="Monter" disabled={first || pending} className="muted h-9 w-9 rounded-lg hover:bg-white/10 disabled:opacity-30" onClick={() => start(async () => { await moveResource(resourceKey, id, -1); router.refresh(); })}>↑</button><button type="button" aria-label="Descendre" disabled={last || pending} className="muted h-9 w-9 rounded-lg hover:bg-white/10 disabled:opacity-30" onClick={() => start(async () => { await moveResource(resourceKey, id, 1); router.refresh(); })}>↓</button></span>)}
      {duplicable && <button type="button" className="muted underline" disabled={pending} onClick={() => start(async () => { await duplicateResource(resourceKey, id); })}>Dupliquer</button>}
      <ConfirmButton label="Supprimer" confirm="Supprimer définitivement cet élément ?" onConfirm={async () => { await deleteResource(resourceKey, id); router.refresh(); }} />
    </div>
  );
}

/* ------------------------------------------------------------ pages et textes */
type PageVal = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
/** Champ média : image (tout format courant) ou vidéo, choisi dans la médiathèque ou importé. */
export function MediaField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (url: string, alt?: string) => void }) {
  const [open, setOpen] = useState(false);
  const isVideo = /\.(mp4|webm|mov|ogv)(\?|$)/i.test(value);
  return (
    <div>
      <span className="label" id={id}>{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        {value ? (isVideo ? <video src={value} muted preload="metadata" className="aspect-video w-48 rounded-lg object-cover" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" className="aspect-video w-48 rounded-lg object-cover" />) : <span className="muted text-sm">Aucun média choisi.</span>}
        <button type="button" aria-labelledby={id} className="btn btn-ghost !min-h-[44px] !px-4 !py-2.5 text-sm" onClick={() => setOpen(true)}>{value ? "Changer" : "Choisir une image ou une vidéo"}</button>
        {value && <button type="button" className="err text-sm underline" onClick={() => onChange("")}>Retirer</button>}
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(m) => { onChange(m.url, m.alt); setOpen(false); }} />
    </div>
  );
}

export function PageEditor({ schema, initial, versions }: { schema: PageSchema; initial: PageVal; versions: { id: string; author: string; createdAt: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState<PageVal>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string, x: unknown) => setV((p) => ({ ...p, [k]: x }));
  return (
    <div className="grid gap-10 xl:grid-cols-[1fr_300px]">
      <form onSubmit={(e) => { e.preventDefault(); setMsg(null); start(async () => { const r = await savePage(schema.key, v); setMsg({ ok: r.ok, text: r.ok ? "Enregistré. Le site public est mis à jour." : r.error || "Erreur" }); router.refresh(); }); }} className="space-y-6">
        {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-xl border p-4 ${msg.ok ? "acc acc-border" : "err"}`}>{msg.text}</p>}
        {schema.fields.map((f) => (
          <div key={f.name}>
            {f.type === "list" ? (
              <fieldset><legend className="label">{f.label}</legend>
                <ul className="space-y-3">{(v[f.name] as Record<string, string>[]).map((row, i) => (
                  <li key={i} className="rounded-xl border p-4" style={ring}>
                    <div className="grid gap-3">{f.itemFields!.map((it) => it.type === "media" ? (<MediaField key={it.name} id={`${f.name}-${i}-${it.name}`} label={it.label} value={row[it.name] ?? ""} onChange={(url, alt) => set(f.name, (v[f.name] as Record<string, string>[]).map((r, n) => (n === i ? { ...r, [it.name]: url, ...(alt && !r.alt ? { alt } : {}) } : r)))} />) : (<div key={it.name}><label className="label" htmlFor={`${f.name}-${i}-${it.name}`}>{it.label}</label>{it.type === "textarea" ? <textarea id={`${f.name}-${i}-${it.name}`} rows={3} className="field" value={row[it.name] ?? ""} onChange={(e) => set(f.name, (v[f.name] as Record<string, string>[]).map((r, n) => (n === i ? { ...r, [it.name]: e.target.value } : r)))} /> : <input id={`${f.name}-${i}-${it.name}`} className="field" value={row[it.name] ?? ""} onChange={(e) => set(f.name, (v[f.name] as Record<string, string>[]).map((r, n) => (n === i ? { ...r, [it.name]: e.target.value } : r)))} />}</div>))}</div>
                    <button type="button" className="err mt-3 text-sm underline" onClick={() => set(f.name, (v[f.name] as unknown[]).filter((_, n) => n !== i))}>Supprimer</button>
                  </li>))}</ul>
                <button type="button" className="btn btn-ghost mt-3 !min-h-[44px] !px-4 !py-2.5 text-sm" onClick={() => set(f.name, [...(v[f.name] as unknown[]), Object.fromEntries(f.itemFields!.map((i) => [i.name, ""]))])}>+ Ajouter</button>
              </fieldset>
            ) : f.type === "media" ? (
              <MediaField id={f.name} label={f.label} value={(v[f.name] as string) ?? ""} onChange={(url) => set(f.name, url)} />
            ) : f.type === "textarea" ? (
              <div><label className="label" htmlFor={f.name}>{f.label}</label><textarea id={f.name} rows={f.name === "story" ? 10 : 4} className="field" value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} /></div>
            ) : (
              <div><label className="label" htmlFor={f.name}>{f.label}</label><input id={f.name} className="field" value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} /></div>
            )}
          </div>
        ))}
        <div className="sticky bottom-4 rounded-2xl border p-4 backdrop-blur" style={{ ...ring, background: "rgb(20 23 28 / .92)" }}><button className="btn btn-primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button></div>
      </form>
      <aside aria-label="Historique des versions">
        <p className="eyebrow mb-4">Historique</p>
        {versions.length === 0 ? <p className="muted text-sm">Aucune version précédente. Chaque enregistrement crée un point de restauration.</p> : (
          <ul className="space-y-2">{versions.map((ver) => (
            <li key={ver.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm" style={ring}>
              <span><span className="block">{new Date(ver.createdAt).toLocaleString("fr-FR")}</span><span className="muted text-xs">{ver.author}</span></span>
              <ConfirmButton label="Restaurer" className="acc underline" confirm="Restaurer cette version ? La version actuelle sera conservée dans l'historique." onConfirm={async () => { await restorePageVersion(ver.id); router.refresh(); window.location.reload(); }} />
            </li>))}</ul>
        )}
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------ paramètres */
export function SettingsSection({ section, title, children, initial, fields }: { section: string; title: string; children?: React.ReactNode; initial: Record<string, any>; fields: { name: string; label: string; type?: "text" | "textarea" | "color"; hint?: string }[] }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const [v, setV] = useState<Record<string, string>>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); setMsg(null); start(async () => { const r = await saveSettings(section, section === "footerText" ? v.footerText : v); setMsg({ ok: r.ok, text: r.ok ? "Enregistré." : r.error || "Erreur" }); }); }} className="rounded-2xl border p-6 md:p-8" style={ring}>
      <h2 className="mb-1 text-xl font-medium">{title}</h2>{children}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <label className="label" htmlFor={`${section}-${f.name}`}>{f.label}</label>
            {f.type === "textarea" ? <textarea id={`${section}-${f.name}`} rows={3} className="field" value={v[f.name] ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />
              : f.type === "color" ? (<div className="flex gap-3"><input id={`${section}-${f.name}`} type="color" className="h-12 w-16 cursor-pointer rounded-lg border bg-transparent p-1" style={ring} value={v[f.name] || "#2A5587"} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} /><input aria-label={f.label} className="field" value={v[f.name] ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} /></div>)
              : <input id={`${section}-${f.name}`} className="field" value={v[f.name] ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />}
            {f.hint && <p className="muted mt-1.5 text-xs">{f.hint}</p>}
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4"><button className="btn btn-primary" disabled={pending}>{pending ? "…" : "Enregistrer"}</button>{msg && <p role="status" className={msg.ok ? "acc" : "err"}>{msg.text}</p>}</div>
    </form>
  );
}

export function TrustEditor({ initial }: { initial: { value: string; label: string }[] }) {
  const [rows, setRows] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveSettings("trust", rows); setMsg({ ok: r.ok, text: r.ok ? "Enregistré." : r.error || "Erreur" }); }); }} className="rounded-2xl border p-6 md:p-8" style={ring}>
      <h2 className="mb-1 text-xl font-medium">Bandeau de confiance (accueil)</h2>
      <p className="muted text-sm">Chiffres et engagements affichés sous le hero. Utilisez des chiffres réels uniquement. La partie numérique s&apos;anime à l&apos;affichage.</p>
      <ul className="mt-5 space-y-3">{rows.map((r, i) => (
        <li key={i} className="grid gap-3 sm:grid-cols-[160px_1fr_auto]"><input aria-label={`Valeur ${i + 1}`} className="field" value={r.value} onChange={(e) => setRows(rows.map((x, n) => (n === i ? { ...x, value: e.target.value } : x)))} /><input aria-label={`Intitulé ${i + 1}`} className="field" value={r.label} onChange={(e) => setRows(rows.map((x, n) => (n === i ? { ...x, label: e.target.value } : x)))} /><button type="button" className="err underline" onClick={() => setRows(rows.filter((_, n) => n !== i))}>Retirer</button></li>))}</ul>
      <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" className="btn btn-ghost !min-h-[44px] !px-4 !py-2.5 text-sm" disabled={rows.length >= 6} onClick={() => setRows([...rows, { value: "", label: "" }])}>+ Ajouter</button><button className="btn btn-primary" disabled={pending}>Enregistrer</button>{msg && <p role="status" className={msg.ok ? "acc" : "err"}>{msg.text}</p>}</div>
    </form>
  );
}

/* ------------------------------------------------------------ demandes */
export function LeadForm({ id, status, notes }: { id: string; status: string; notes: string }) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [n, setN] = useState(notes);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await updateLead(id, s, n); setMsg(r.ok ? "Enregistré." : r.error || "Erreur"); router.refresh(); }); }} className="space-y-5">
      <div><label className="label" htmlFor="st">Statut</label><select id="st" className="field" value={s} onChange={(e) => setS(e.target.value)}>{LEAD_STATUSES.map((x) => (<option key={x} className="text-black">{x}</option>))}</select></div>
      <div><label className="label" htmlFor="nt">Notes internes</label><textarea id="nt" rows={6} className="field" value={n} onChange={(e) => setN(e.target.value)} /></div>
      <div className="flex flex-wrap items-center gap-4"><button className="btn btn-primary" disabled={pending}>Enregistrer</button>{msg && <span role="status" className="acc">{msg}</span>}<ConfirmButton className="err ml-auto underline" label="Supprimer (droit à l'effacement)" confirm="Supprimer définitivement cette demande et les données personnelles associées ?" onConfirm={() => deleteLead(id)} /></div>
    </form>
  );
}

/* ------------------------------------------------------------ médiathèque */
export function MediaCard({ m }: { m: { id: string; url: string; alt: string; width: number; height: number; size: number } }) {
  const router = useRouter();
  const [alt, setAlt] = useState(m.alt);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <li className="overflow-hidden rounded-2xl border" style={ring}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.url} alt={m.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      <div className="space-y-3 p-4">
        <label className="label" htmlFor={`alt-${m.id}`}>Texte alternatif</label>
        <input id={`alt-${m.id}`} className="field" value={alt} onChange={(e) => setAlt(e.target.value)} />
        <p className="muted text-xs">{m.width}×{m.height} · {Math.round(m.size / 1024)} Ko · <code>{m.url}</code></p>
        <div className="flex items-center gap-4 text-sm"><button type="button" className="acc underline" disabled={pending} onClick={() => start(async () => { const r = await updateMediaAlt(m.id, alt); setMsg(r.ok ? "Enregistré" : r.error || "Erreur"); router.refresh(); })}>Enregistrer</button>
          <ConfirmButton label="Supprimer" confirm="Supprimer cette image ? Les contenus qui l'utilisent afficheront un espace vide." onConfirm={async () => { await deleteMedia(m.id); router.refresh(); }} />{msg && <span role="status" className="muted">{msg}</span>}</div>
      </div>
    </li>
  );
}
export function MediaUpload() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(""); const form = e.currentTarget; const r = await fetch("/api/admin/upload", { method: "POST", body: new FormData(form) }); const j = await r.json().catch(() => ({ ok: false, error: "Erreur réseau." })); setBusy(false); if (!j.ok) return setErr(j.error); form.reset(); router.refresh(); }} className="grid gap-4 rounded-2xl border p-6 md:grid-cols-[1fr_1fr_auto] md:items-end" style={ring}>
      <div><label className="label" htmlFor="up-file">Image</label><input id="up-file" name="file" type="file" accept="image/*" required className="field" /></div>
      <div><label className="label" htmlFor="up-alt">Texte alternatif (obligatoire)</label><input id="up-alt" name="alt" required className="field" /></div>
      <button className="btn btn-primary" disabled={busy}>{busy ? "Import…" : "Importer"}</button>
      {err && <p role="alert" className="err md:col-span-3">{err}</p>}
    </form>
  );
}

/* ------------------------------------------------------------ utilisateurs & compte */
export function InviteForm() {
  const [state, action, pending] = useActionState(inviteUser, undefined);
  return (
    <form action={action} className="grid gap-4 rounded-2xl border p-6 md:grid-cols-[1fr_1fr_160px_auto] md:items-end" style={ring}>
      <div><label className="label" htmlFor="iv-name">Nom</label><input id="iv-name" name="name" required className="field" /></div>
      <div><label className="label" htmlFor="iv-email">Email</label><input id="iv-email" name="email" type="email" required className="field" /></div>
      <div><label className="label" htmlFor="iv-role">Rôle</label><select id="iv-role" name="role" className="field" defaultValue="editor"><option value="editor" className="text-black">Éditeur</option><option value="owner" className="text-black">Propriétaire</option></select></div>
      <button className="btn btn-primary" disabled={pending}>Inviter</button>
      {state?.error && <p role="alert" className="err md:col-span-4">{state.error}</p>}
      {state?.ok && <p role="status" className="acc break-all md:col-span-4">{state.ok}</p>}
    </form>
  );
}
export function UserRow({ u, self }: { u: { id: string; name: string; email: string; role: string; pending: boolean }; self: boolean }) {
  const router = useRouter();
  return (
    <tr className="border-t" style={ring}>
      <td className="py-4 pr-4"><span className="font-medium">{u.name}</span>{self && <span className="muted"> (vous)</span>}{u.pending && <span className="acc ml-2 text-xs">invitation en attente</span>}<br /><span className="muted text-sm">{u.email}</span></td>
      <td className="py-4 pr-4"><select aria-label={`Rôle de ${u.name}`} disabled={self} className="field !w-auto !py-2" defaultValue={u.role} onChange={async (e) => { await setUserRole(u.id, e.target.value as "owner" | "editor"); router.refresh(); }}><option value="owner" className="text-black">Propriétaire</option><option value="editor" className="text-black">Éditeur</option></select></td>
      <td className="py-4 text-right">{!self && <ConfirmButton label="Supprimer" confirm={`Supprimer l'accès de ${u.name} ?`} onConfirm={async () => { await deleteUser(u.id); router.refresh(); }} />}</td>
    </tr>
  );
}
export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="space-y-4 rounded-2xl border p-6 md:p-8" style={ring}>
      <h2 className="text-xl font-medium">Changer de mot de passe</h2>
      <div><label className="label" htmlFor="pw-c">Mot de passe actuel</label><input id="pw-c" name="current" type="password" autoComplete="current-password" required className="field" /></div>
      <div><label className="label" htmlFor="pw-n">Nouveau mot de passe</label><input id="pw-n" name="next" type="password" autoComplete="new-password" required className="field" /><p className="muted mt-1.5 text-xs">12 caractères minimum, avec majuscules, minuscules et chiffres.</p></div>
      <div><label className="label" htmlFor="pw-k">Confirmation</label><input id="pw-k" name="confirm" type="password" autoComplete="new-password" required className="field" /></div>
      {state?.error && <p role="alert" className="err">{state.error}</p>}{state?.ok && <p role="status" className="acc">Mot de passe modifié. Si la double authentification n'est pas encore activée, activez-la plus bas pour débloquer le reste de l'administration.</p>}
      <button className="btn btn-primary" disabled={pending}>Modifier</button>
    </form>
  );
}
export function TwoFactor({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <section className="space-y-4 rounded-2xl border p-6 md:p-8" style={ring}>
      <h2 className="text-xl font-medium">Double authentification (2FA)</h2>
      <p className="muted text-sm">Ajoute un code à 6 chiffres à la connexion, généré par une application (Google Authenticator, 1Password, Authy…).</p>
      <p>Statut : <strong className={enabled ? "acc" : ""}>{enabled ? "activée" : "désactivée"}</strong></p>
      {!enabled && !setup && <button type="button" className="btn btn-ghost" onClick={async () => setSetup(await start2fa())}>Activer la 2FA</button>}
      {!enabled && setup && (
        <div className="space-y-4">
          <p className="text-sm">1. Dans votre application, ajoutez un compte avec cette clé (saisie manuelle) :</p>
          <code className="block break-all rounded-lg bg-black/40 p-3 text-lg tracking-widest">{setup.secret}</code>
          <p className="muted break-all text-xs">Ou ouvrez ce lien depuis votre téléphone : {setup.uri}</p>
          <div><label className="label" htmlFor="tf-code">2. Saisissez le code affiché</label><input id="tf-code" inputMode="numeric" maxLength={7} className="field max-w-[200px]" value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <button type="button" className="btn btn-primary" onClick={async () => { const r = await confirm2fa(code); setMsg({ ok: r.ok, text: r.ok ? "2FA activée." : r.error || "Erreur" }); if (r.ok) { setSetup(null); router.push("/admin"); router.refresh(); } }}>Confirmer</button>
        </div>
      )}
      {enabled && (
        <div className="flex flex-wrap items-end gap-3"><div><label className="label" htmlFor="tf-pw">Mot de passe pour désactiver</label><input id="tf-pw" type="password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} /></div><button type="button" className="btn btn-ghost" onClick={async () => { const r = await disable2fa(pw); setMsg({ ok: r.ok, text: r.ok ? "2FA désactivée." : r.error || "Erreur" }); if (r.ok) router.refresh(); }}>Désactiver</button></div>
      )}
      {msg && <p role="status" className={msg.ok ? "acc" : "err"}>{msg.text}</p>}
    </section>
  );
}
