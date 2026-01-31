import React from "react";

export default function Card({ children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '6px',
      boxShadow: '0 2px 6px rgba(44,62,80,0.08)',
      padding: '20px',
      margin: '10px 0',
    }}>
      {children}
    </div>
  );
}
