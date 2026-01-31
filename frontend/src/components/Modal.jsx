import React from "react";

export default function Modal({ children, open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(44,62,80,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', borderRadius: '6px', padding: '30px', boxShadow: '0 2px 12px rgba(44,62,80,0.18)', minWidth: '320px', maxWidth: '90vw', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#2C3E50' }}>×</button>
        {children}
      </div>
    </div>
  );
}
