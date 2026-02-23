import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ fontSize: 80, background: "linear-gradient(135deg, #1B3A5C, #2E75B6)", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, borderRadius: 36, fontFamily: "sans-serif" }}>
        <span style={{ fontSize: 80, lineHeight: 1 }}>G</span>
        <span style={{ fontSize: 36, color: "#FFD700", lineHeight: 1, marginTop: -5 }}>DA</span>
      </div>
    ),
    { ...size }
  );
}
