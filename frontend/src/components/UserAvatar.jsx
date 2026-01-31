import React, { useState, useRef, useEffect } from "react";

export default function UserAvatar({ name = "User", email = "user@example.com", avatarUrl }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        aria-label="User menu"
        onClick={() => setOpen(o => !o)}
        style={{
          background: "none",
          border: "none",
          borderRadius: "50%",
          padding: 0,
          cursor: "pointer",
          width: 40,
          height: 40,
          overflow: "hidden",
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} style={{ width: 40, height: 40, borderRadius: "50%" }} />
        ) : (
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#27AE60",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 18,
          }}>{name[0]}</div>
        )}
      </button>
      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: 48,
          background: "#fff",
          boxShadow: "0 2px 8px rgba(44,62,80,0.12)",
          borderRadius: 8,
          minWidth: 180,
          zIndex: 100,
          padding: 12,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>{email}</div>
          <button style={{ background: "none", border: "none", color: "#E74C3C", fontWeight: 500, cursor: "pointer" }}>Sign Out</button>
        </div>
      )}
    </div>
  );
}
