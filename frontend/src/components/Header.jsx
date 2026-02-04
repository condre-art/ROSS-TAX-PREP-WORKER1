import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';

export default function Header() {
  const headerStyles = {
    topBar: {
      background: COLORS.navy[800],
      padding: `${SPACING.sm} 0`,
      borderBottom: '1px solid rgba(243, 160, 6, 0.3)'
    },
    topBarContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `0 ${SPACING.lg}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: SPACING.lg,
      fontSize: TYPOGRAPHY.fontSize.sm
    },
    topBarLink: {
      color: COLORS.white,
      textDecoration: 'none',
      transition: 'color 0.2s ease',
      fontSize: TYPOGRAPHY.fontSize.sm
    },
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
      color: COLORS.white,
      background: COLORS.gold[500],
      fontWeight: TYPOGRAPHY.fontWeight.bold
    }
  };

  return (
    <>
      {/* Top Bar */}
      <div style={headerStyles.topBar}>
        <div style={headerStyles.topBarContainer}>
          <a href="tel:+1234567890" style={headerStyles.topBarLink}>📞 Phone</a>
          <a href="mailto:info@rosstaxprep.com" style={headerStyles.topBarLink}>✉️ Email</a>
          <Link to="/portal" style={headerStyles.topBarLink}>🔐 Client Portal</Link>
          <a href="https://www.irs.gov/refunds" target="_blank" rel="noopener noreferrer" style={headerStyles.topBarLink}>💵 Track Refund</a>
        </div>
      </div>

      {/* Main Header */}
      <header style={headerStyles.header}>
        <div style={headerStyles.container}>
          <Link to="/" style={headerStyles.logoLink}>
            <Logo size="default" />
          </Link>
          
          <nav style={headerStyles.nav}>
            <a href="/#services" style={headerStyles.navLink}>Services</a>
            <a href="/#pricing" style={headerStyles.navLink}>Pricing</a>
            <Link to="/portal" style={headerStyles.navLink}>Portal</Link>
            <a href="/#about" style={headerStyles.navLink}>About</a>
            <a href="/#faq" style={headerStyles.navLink}>FAQs</a>
            <a href="/#contact" style={headerStyles.navLink}>Contact</a>
            <Link to="/intake" style={{ ...headerStyles.navLink, ...headerStyles.navLinkActive }}>
              Start Filing
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
