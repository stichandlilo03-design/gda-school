"use client";

import { useRef } from "react";

interface IDCardProps {
  type: "STUDENT" | "TEACHER";
  name: string;
  photo?: string | null;
  idNumber?: string | null;
  schoolName: string;
  schoolLogo?: string | null;
  grade?: string;
  subjects?: string[];
  email?: string;
  phone?: string;
  countryCode?: string;
  dateOfBirth?: string;
  enrolledDate?: string;
  isVerified?: boolean;
  primaryColor?: string;
}

export default function IDCard(props: IDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = cardRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>ID Card - ${props.name}</title><style>
      @media print { body { margin: 0; } }
      body { font-family: -apple-system, system-ui, sans-serif; display: flex; justify-content: center; padding: 20px; background: #f5f5f5; }
      .id-card { width: 340px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); background: white; }
      .id-header { background: linear-gradient(135deg, ${props.primaryColor || "#1B3A5C"}, ${props.primaryColor ? props.primaryColor + "cc" : "#2E75B6"}); color: white; padding: 16px; text-align: center; }
      .id-header h3 { margin: 0; font-size: 14px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
      .id-header h2 { margin: 4px 0 0; font-size: 13px; }
      .id-body { padding: 20px; text-align: center; }
      .photo { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; margin: 0 auto 12px; border: 3px solid #e5e7eb; }
      .photo-placeholder { width: 90px; height: 90px; border-radius: 50%; background: #f3f4f6; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #9ca3af; }
      .name { font-size: 18px; font-weight: 700; color: #1f2937; }
      .role { font-size: 11px; color: #6b7280; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
      .id-num { font-size: 13px; font-weight: 600; color: ${props.primaryColor || "#1B3A5C"}; margin-top: 8px; letter-spacing: 2px; }
      .details { margin-top: 12px; text-align: left; font-size: 11px; color: #4b5563; }
      .details div { padding: 4px 0; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; }
      .details span { font-weight: 600; color: #1f2937; }
      .id-footer { background: #f9fafb; padding: 10px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
      .verified { display: inline-block; background: #10b981; color: white; font-size: 9px; padding: 2px 8px; border-radius: 10px; margin-top: 4px; }
    </style></head><body>${el.outerHTML}<script>window.print();<\/script></body></html>`);
    w.document.close();
  };

  const handleDownload = async () => {
    // Use print as the download mechanism (no external dependency needed)
    handlePrint();
  };

  const color = props.primaryColor || "#1B3A5C";

  return (
    <div className="space-y-4">
      {/* The Card */}
      <div ref={cardRef} className="id-card" style={{ width: 340, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", background: "white" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: "white", padding: "14px 16px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {props.schoolLogo && <img src={props.schoolLogo} alt="" style={{ width: 28, height: 28, borderRadius: 6 }} />}
            <div>
              <h3 style={{ margin: 0, fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>{props.schoolName}</h3>
              <h2 style={{ margin: 0, fontSize: 10, opacity: 0.6 }}>{props.type === "STUDENT" ? "STUDENT IDENTITY CARD" : "TEACHER IDENTITY CARD"}</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", textAlign: "center" }}>
          {props.photo ? (
            <img src={props.photo} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px", border: "3px solid #e5e7eb", display: "block" }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f3f4f6", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: "bold", color: "#9ca3af" }}>
              {props.name?.charAt(0)}
            </div>
          )}
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1f2937" }}>{props.name}</div>
          <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{props.type}</div>
          {props.idNumber && (
            <div style={{ fontSize: 12, fontWeight: 600, color, marginTop: 6, letterSpacing: 2 }}>{props.idNumber}</div>
          )}
          {props.isVerified && (
            <span style={{ display: "inline-block", background: "#10b981", color: "white", fontSize: 8, padding: "2px 8px", borderRadius: 10, marginTop: 4 }}>✓ VERIFIED</span>
          )}

          {/* Details */}
          <div style={{ marginTop: 12, textAlign: "left", fontSize: 10, color: "#4b5563" }}>
            {props.grade && (
              <div style={{ padding: "3px 0", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>Grade</span><span style={{ fontWeight: 600, color: "#1f2937" }}>{props.grade}</span>
              </div>
            )}
            {props.subjects && props.subjects.length > 0 && (
              <div style={{ padding: "3px 0", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>Subjects</span><span style={{ fontWeight: 600, color: "#1f2937", textAlign: "right", maxWidth: 180 }}>{props.subjects.slice(0, 4).join(", ")}</span>
              </div>
            )}
            {props.email && (
              <div style={{ padding: "3px 0", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>Email</span><span style={{ fontWeight: 600, color: "#1f2937", fontSize: 9 }}>{props.email}</span>
              </div>
            )}
            {props.countryCode && (
              <div style={{ padding: "3px 0", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>Country</span><span style={{ fontWeight: 600, color: "#1f2937" }}>{props.countryCode}</span>
              </div>
            )}
            {props.enrolledDate && (
              <div style={{ padding: "3px 0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>Since</span><span style={{ fontWeight: 600, color: "#1f2937" }}>{props.enrolledDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#f9fafb", padding: "8px 16px", textAlign: "center", fontSize: 8, color: "#9ca3af", borderTop: "1px solid #e5e7eb" }}>
          This card is property of {props.schoolName} · Powered by GDA Schools
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handlePrint} className="btn-primary text-xs flex-1">🖨️ Print ID Card</button>
        <button onClick={handleDownload} className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex-1">📥 Download PNG</button>
      </div>
    </div>
  );
}
