import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';

export default function Header() {
  const headerStyles = {
    header: {
      background: COLORS.navy[900],
      borderBottom: `2px solid ${COLORS.gold[500]}`,
      padding: `${SPACING.md} 0`,
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `0 ${SPACING.lg}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.xl
    },
    logoLink: {
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      transition: 'transform 0.2s ease'
    },
    logoLinkHover: {
      transform: 'scale(1.05)'
    },
    nav: {
      display: 'flex',
      gap: SPACING.lg,
      alignItems: 'center',
      marginLeft: 'auto',
      flexWrap: 'wrap'
    },
    navLink: {
      color: COLORS.white,
      textDecoration: 'none',
      fontSize: TYPOGRAPHY.fontSize.base,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      transition: 'color 0.2s ease',
      padding: `${SPACING.sm} ${SPACING.md}`,
      borderRadius: '4px'
    },
    navLinkActive: {
      color: COLORS.gold[500],
      background: 'rgba(243, 160, 6, 0.1)'
    }
  };

  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.container}>
        <Link to="/" style={headerStyles.logoLink}>
          <Logo size="default" />
        </Link>
        
        <nav style={headerStyles.nav}>
          <a href="/#services" style={headerStyles.navLink}>Services</a>
          <a href="/#about" style={headerStyles.navLink}>About</a>
          <a href="/#contact" style={headerStyles.navLink}>Contact</a>
          <a href="/intake" style={{ ...headerStyles.navLink, ...headerStyles.navLinkActive }}>
            Start Filing
          </a>
        </nav>
      </div>
    </header>
  );
}
