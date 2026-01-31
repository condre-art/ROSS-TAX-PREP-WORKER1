import React from "react";

export default function Alert({ type = "info", children, style }) {
  const colors = {
    error: { background: "#FDECEA", color: "#E74C3C" },
    info: { background: "#F4F8FB", color: "#2C3E50" },
    success: { background: "#E8F8F2", color: "#27AE60" },
  };
  return (
    <div
      style={{
        padding: "12px 18px",
        borderRadius: 6,
        margin: "12px 0",
        fontWeight: 500,
        ...colors[type],
        ...style,
      }}
      role={type === "error" ? "alert" : undefined}
    >
      {children}
    </div>
  );
}