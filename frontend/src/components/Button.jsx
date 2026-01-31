import React from "react";

export default function Button({ children, variant = "primary", ...props }) {
  const colors = {
    primary: '#27AE60',
    accent: '#2C3E50',
    disabled: '#B0B0B0',
  };
  return (
    <button
      style={{
        background: colors[variant],
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        fontWeight: 'bold',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        boxShadow: '0 2px 6px rgba(44,62,80,0.08)',
        textTransform: 'uppercase',
      }}
      {...props}
    >
      {children}
    </button>
  );
}
