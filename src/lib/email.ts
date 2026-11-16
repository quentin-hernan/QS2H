import "server-only";
import { Resend } from "resend";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Envoie un email via Resend. Sans RESEND_API_KEY (dev), le contenu est simplement journalisé. Ne lève jamais. */
export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[mail:dev] → ${opts.to} | ${opts.subject}`);
    return false;
  }
  try {
    const r = await new Resend(key).emails.send({ from: process.env.MAIL_FROM || "QS2H <noreply@qs2h.fr>", to: opts.to, subject: opts.subject, html: opts.html, replyTo: opts.replyTo });
    if (r.error) console.error("[mail] erreur Resend", r.error);
    return !r.error;
  } catch (e) {
    console.error("[mail] échec", e);
    return false;
  }
}

export const layout = (title: string, body: string) => `<!doctype html><html lang="fr"><body style="margin:0;background:#F8F8F7;font-family:Helvetica,Arial,sans-serif;color:#1C1C1C"><div style="max-width:560px;margin:0 auto;padding:32px 24px"><p style="font-size:22px;font-weight:700;margin:0 0 24px">QS2H</p><h1 style="font-size:22px;margin:0 0 16px">${esc(title)}</h1>${body}<hr style="border:none;border-top:1px solid #E3E3E0;margin:32px 0 16px"><p style="font-size:12px;color:#5A5F66">QS2H — Solutions digitales · Bordeaux</p></div></body></html>`;
