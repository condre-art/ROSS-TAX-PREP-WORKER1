import React, { useRef } from "react";

const COLORS = {
  primary: 'linear-gradient(90deg, #002147 0%, #ffd700 100%)',
  accent: 'linear-gradient(90deg, #ffd700 0%, #002147 100%)',
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
    color: variant === 'accent' ? '#002147' : '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 28px',
    fontWeight: 900,
    fontSize: 17,
    letterSpacing: 0.5,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    boxShadow: disabled ? 'none' : '0 4px 18px rgba(44,62,80,0.13)',
    textTransform: 'uppercase',
    outline: 'none',
    transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
    position: 'relative',
    borderBottom: '3px solid #ffd700',
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
      background: linear-gradient(90deg, #ffd700 0%, #002147 100%);
      color: #002147;
      box-shadow: 0 6px 24px rgba(202,162,74,0.18);
      transform: translateY(-2px) scale(1.04);
    }
    .${uniqueClass}:not([aria-disabled="true"]):active {
      background: linear-gradient(90deg, #002147 0%, #ffd700 100%);
      color: #ffd700;
      box-shadow: 0 2px 8px rgba(44,62,80,0.10);
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
