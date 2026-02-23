import { ImageResponse } from "next/og";

export const alt = "GDA Schools — The Smartest Way to Run a School";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div style={{ background: "linear-gradient(135deg, #1B3A5C 0%, #2E75B6 50%, #1B3A5C 100%)", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 30 }}>
          <div style={{ width: 90, height: 90, borderRadius: 22, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900, color: "white" }}>G</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 52, fontWeight: 900, color: "white", lineHeight: 1 }}>GDA Schools</span>
            <span style={{ fontSize: 20, color: "#FFD700", fontWeight: 600, marginTop: 4 }}>Global Digital Academy</span>
          </div>
        </div>
        <div style={{ fontSize: 36, color: "white", fontWeight: 700, textAlign: "center", maxWidth: 800 }}>The Smartest Way to Run a School</div>
        <div style={{ display: "flex", gap: 30, marginTop: 35 }}>
          {["Live Classes", "Auto Payroll", "14 Countries", "Fee Tracking"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FFD700", display: "flex" }} />
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.9)" }}>{f}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 30, fontSize: 22, color: "rgba(255,215,0,0.8)", fontWeight: 700, display: "flex" }}>gdaschools.sbs</div>
      </div>
    ),
    { ...size }
  );
}
