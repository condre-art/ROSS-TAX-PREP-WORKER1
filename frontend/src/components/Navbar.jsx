import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import UserAvatar from "./UserAvatar";

function Navbar() {
  const [open, setOpen] = useState(false);
  // Dark mode toggle state is lifted to App.jsx, passed as props
  return (
    <header className="topbar" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--color-bg)', boxShadow: '0 2px 6px rgba(44,62,80,0.04)' }}>
      <div className="container topbar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img className="brand-logo" src="/rtb-logo.png" alt="Ross Tax & Bookkeeping" style={{ height: 40 }} onError={e => e.currentTarget.style.display = 'none'} />
          <div className="brand-text">
            <div className="brand-name" style={{ fontWeight: 700, fontSize: 20 }}>Ross Tax & Bookkeeping</div>
            <div className="brand-sub" style={{ fontSize: 12, color: 'var(--color-text)', opacity: 0.7 }}>Accurate. Compliant. Confident.</div>
          </div>
        </div>
        <nav className="nav" style={{ display: open ? 'block' : 'flex', gap: 24 }}>
          <NavLink to="/" end className={({ isActive }) => isActive ? "navlink active" : "navlink"} onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/services" className={({ isActive }) => isActive ? "navlink active" : "navlink"} onClick={() => setOpen(false)}>Services</NavLink>
          <NavLink to="/intake" className={({ isActive }) => isActive ? "navlink active" : "navlink"} onClick={() => setOpen(false)}>Intake</NavLink>
          <NavLink to="/crm" className={({ isActive }) => isActive ? "navlink active" : "navlink"} onClick={() => setOpen(false)}>CRM</NavLink>
          <NavLink to="/lms" className={({ isActive }) => isActive ? "navlink active" : "navlink"} onClick={() => setOpen(false)}>LMS</NavLink>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Dark mode toggle button, props: darkMode, setDarkMode */}
          {typeof window !== 'undefined' && window.setDarkMode && (
            <button
              aria-label="Toggle dark mode"
              onClick={() => window.setDarkMode(d => !d)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 22,
                cursor: 'pointer',
                color: 'var(--color-accent)',
                marginRight: 4
              }}
            >
              {window.darkMode ? '🌙' : '☀️'}
            </button>
          )}
          <UserAvatar name="Condre Ross" email="info@rosstaxprepandbookkeeping.com" />
          <button className="nav-toggle" aria-label="Menu" onClick={() => setOpen(o => !o)} style={{ display: 'none', background: 'none', border: 'none', fontSize: 28, cursor: 'pointer' }}>
            630
          </button>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .nav { display: ${open ? 'block' : 'none'}; position: absolute; top: 60px; left: 0; right: 0; background: var(--color-bg); box-shadow: 0 2px 6px rgba(44,62,80,0.08); padding: 16px 0; }
          .navlink { display: block; padding: 12px 24px; }
          .nav-toggle { display: block !important; }
        }

      `}</style>
    </header>
  );
}

export default Navbar;
