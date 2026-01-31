import React from "react";

export default function CalloutBox({ children, type = "info" }) {
  const color = type === "gold" ? "#C9A24D" : type === "error" ? "#E74C3C" : "#0B1E3B";
  const bg = type === "gold" ? "#F5F1E8" : type === "error" ? "#fef2f2" : "#eef2ff";
  return (
    <div style={{
      background: bg,
      borderLeft: `6px solid ${color}`,
      borderRadius: 10,
      padding: "16px 20px",
      margin: "18px 0",
      color: color,
      fontWeight: 600,
      fontSize: 15,
      boxShadow: "0 2px 8px rgba(44,62,80,0.06)"
    }}>
      {children}
    </div>
  );
}
