import { ImageResponse } from "next/og";

export const alt = "GDA Schools - The Smartest Way to Run a School";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div style={{ background: "linear-gradient(135deg, #1B3A5C 0%, #2E75B6 50%, #1B3A5C 100%)", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", position: "relative" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: 40, left: 60, width: 80, height: 80, borderRadius: 40, background: "rgba(255,215,0,0.15)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 60, right: 80, width: 120, height: 120, borderRadius: 60, background: "rgba(255,215,0,0.1)", display: "flex" }} />
        <div style={{ position: "absolute", top: 100, right: 200, width: 50, height: 50, borderRadius: 25, background: "rgba(255,255,255,0.08)", display: "flex" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 30 }}>
          <div style={{ width: 90, height: 90, borderRadius: 22, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900, color: "white" }}>
            G
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 52, fontWeight: 900, color: "white", lineHeight: 1 }}>GDA Schools</span>
            <span style={{ fontSize: 20, color: "#FFD700", fontWeight: 600, marginTop: 4 }}>Global Digital Academy</span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 36, color: "white", fontWeight: 700, textAlign: "center", maxWidth: 800, lineHeight: 1.3 }}>
          The Smartest Way to Run a School
        </div>

        {/* Features */}
        <div style={{ display: "flex", gap: 30, marginTop: 35 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FFD700", display: "flex" }} />
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.9)" }}>Live Classes</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FFD700", display: "flex" }} />
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.9)" }}>Auto Payroll</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FFD700", display: "flex" }} />
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.9)" }}>14 Countries</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FFD700", display: "flex" }} />
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.9)" }}>Fee Tracking</span>
          </div>
        </div>

        {/* URL */}
        <div style={{ position: "absolute", bottom: 30, fontSize: 22, color: "rgba(255,215,0,0.8)", fontWeight: 700 }}>
          gdaschools.sbs
        </div>
      </div>
    ),
    { ...size }
  );
}
