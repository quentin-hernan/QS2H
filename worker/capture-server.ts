/**
 * Worker de capture autonome (à déployer en Docker sur Railway / Fly.io…).
 * Lancement : CAPTURE_WORKER_TOKEN=... npx tsx worker/capture-server.ts
 * Le site appelle POST /capture {url} avec l'en-tête Authorization: Bearer <token>.
 * Les mêmes protections SSRF que le site s'appliquent (src/lib/ssrf.ts).
 */
import http from "node:http";
import { captureSite } from "../src/lib/capture-core";

const TOKEN = process.env.CAPTURE_WORKER_TOKEN;
if (!TOKEN) throw new Error("CAPTURE_WORKER_TOKEN est obligatoire.");
let busy = false;

http.createServer(async (req, res) => {
  const send = (code: number, body: unknown) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  if (req.method !== "POST" || req.url !== "/capture") return send(404, { error: "not found" });
  if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(401, { error: "unauthorized" });
  if (busy) return send(429, { error: "busy" });
  let raw = "";
  for await (const c of req) { raw += c; if (raw.length > 5000) return send(413, { error: "too large" }); }
  try {
    busy = true;
    const { url } = JSON.parse(raw) as { url: string };
    const out = await captureSite(url);
    send(200, { meta: out.meta, planes: out.planes.map((p) => ({ ...p, png: p.png.toString("base64") })) });
  } catch (e) {
    send(422, { error: (e as Error).message });
  } finally { busy = false; }
}).listen(Number(process.env.PORT) || 8787, () => console.log("Capture worker prêt."));
