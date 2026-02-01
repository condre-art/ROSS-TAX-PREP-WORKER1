import React, { useRef } from "react";

const COLORS = {
  primary: '#27AE60',
  accent: '#2C3E50',
  disabled: '#B0B0B0',
};

export default function Button({
  children,
  variant = "primary",
  style = {},
  disabled = false,
  as: Component = "button",
  type,
  ...props
}) {
  const btnRef = useRef();
  // Compose style for base, then add dynamic states via CSS-in-JS
  const baseStyle = {
    background: disabled ? COLORS.disabled : COLORS[variant] || COLORS.primary,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    boxShadow: disabled ? 'none' : '0 2px 8px rgba(44,62,80,0.10)',
    textTransform: 'uppercase',
    outline: 'none',
    transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
    position: 'relative',
    ...style,
  };

  // Inline style for focus/active/hover using a style tag (CSS-in-JS)
  // Generate a unique className for this instance
  const uniqueClass = React.useMemo(() => {
    return 'btn-' + Math.random().toString(36).slice(2, 10);
  }, []);

  // Accessibility: ARIA, keyboard, focus ring
  const ariaProps = {
    'aria-disabled': disabled,
    tabIndex: disabled ? -1 : 0,
    role: Component !== 'button' ? 'button' : undefined,
    type: Component === 'button' ? (type || 'button') : undefined,
  };

  // Dynamic style for focus/hover/active
  const dynamicCSS = `
    .${uniqueClass}:not([aria-disabled="true"]):hover {
      background: ${variant === 'accent' ? '#34495E' : '#219150'};
      box-shadow: 0 4px 16px rgba(44,62,80,0.16);
      transform: translateY(-1px) scale(1.03);
    }
    .${uniqueClass}:not([aria-disabled="true"]):active {
      background: ${variant === 'accent' ? '#22313A' : '#17643C'};
      box-shadow: 0 2px 6px rgba(44,62,80,0.10);
      transform: scale(0.98);
    }
    .${uniqueClass}:focus-visible {
      outline: 2px solid #FFD700;
      outline-offset: 2px;
      box-shadow: 0 0 0 3px rgba(255,215,0,0.25);
    }
    .${uniqueClass}[aria-disabled="true"] {
      pointer-events: none;
    }
  `;

  return (
    <>
      <style>{dynamicCSS}</style>
      <Component
        ref={btnRef}
        className={uniqueClass}
        style={baseStyle}
        disabled={Component === 'button' ? disabled : undefined}
        {...ariaProps}
        {...props}
      >
        {children}
      </Component>
    </>
  );
}
