import { ImageResponse } from "next/og";

export const alt = "QS2H — Création de sites web pour entreprises";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0C0E11", color: "#F2EFE9", padding: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 56, height: 6, background: "#D96C82" }} />
          <div style={{ fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "#9A9A94" }}>Solutions digitales</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 700, letterSpacing: -6, lineHeight: 1 }}>
            <span>QS</span>
            <span style={{ color: "#D96C82" }}>2</span>
            <span>H</span>
          </div>
          <div style={{ fontSize: 46, marginTop: 24, color: "#cfcbc2" }}>Des sites web qui travaillent pour vous.</div>
        </div>
        <div style={{ fontSize: 28, color: "#9A9A94" }}>Création de sites web · Bordeaux et toute la France</div>
      </div>
    ),
    size,
  );
}
