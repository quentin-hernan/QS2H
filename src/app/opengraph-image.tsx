import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";

export const alt = "QS2H — Création de sites web pour entreprises";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image Open Graph : logo sur fond blanc cassé, avec les cadres d'angle bleus du logo. */
export default async function OG() {
  const logo = (await fs.readFile(path.join(process.cwd(), "public", "logo.png"))).toString("base64");
  const blue = "#2A5587";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F8F7", position: "relative" }}>
        <div style={{ position: "absolute", left: 56, top: 56, width: 120, height: 120, borderLeft: `8px solid ${blue}`, borderTop: `8px solid ${blue}`, display: "flex" }} />
        <div style={{ position: "absolute", right: 56, bottom: 56, width: 120, height: 120, borderRight: `8px solid ${blue}`, borderBottom: `8px solid ${blue}`, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={`data:image/png;base64,${logo}`} width={620} height={195} />
          <div style={{ display: "flex", marginTop: 48, fontSize: 38, color: "#5A5F66" }}>Des sites web qui travaillent pour vous.</div>
          <div style={{ display: "flex", marginTop: 14, fontSize: 26, color: "#5A5F66" }}>Création de sites web · Bordeaux et toute la France</div>
        </div>
      </div>
    ),
    size,
  );
}
