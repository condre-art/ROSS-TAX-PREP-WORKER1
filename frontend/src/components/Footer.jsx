import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';

export default function Footer() {
  const footerStyles = {
    footer: {
      background: COLORS.navy[900],
      borderTop: `2px solid ${COLORS.gold[500]}`,
      padding: `${SPACING.xl} ${SPACING.lg}`,
      marginTop: SPACING['3xl']
    },
    topSection: {
      maxWidth: '1200px',
      margin: '0 auto',
      paddingBottom: SPACING.lg,
      borderBottom: `1px solid ${COLORS.grey[700]}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: SPACING.lg
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: SPACING.xl,
      marginTop: SPACING.lg,
      marginBottom: SPACING.lg
    },
    section: {
      color: COLORS.white
    },
    heading: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.md,
      color: COLORS.gold[500]
    },
    link: {
      color: COLORS.grey[300],
      textDecoration: 'none',
      display: 'block',
      marginBottom: SPACING.sm,
      transition: 'color 0.2s ease'
    },
    linkHover: {
      color: COLORS.gold[500]
    },
    divider: {
      borderTop: `1px solid ${COLORS.grey[700]}`,
      paddingTop: SPACING.lg,
      marginTop: SPACING.lg,
      textAlign: 'center',
      color: COLORS.grey[400],
      fontSize: TYPOGRAPHY.fontSize.sm
    }
  };

  return (
    <footer style={footerStyles.footer}>
      {/* Logo Section */}
      <div style={footerStyles.topSection}>
        <div style={footerStyles.logoContainer}>
          <Link to="/">
            <Logo size="small" />
          </Link>
        </div>
        <div style={{ color: COLORS.grey[300], fontSize: TYPOGRAPHY.fontSize.sm }}>
          Professional Tax & Bookkeeping Services
        </div>
      </div>

      <div style={footerStyles.container}>
        <div style={footerStyles.section}>
          <h4 style={footerStyles.heading}>About Us</h4>
          <p style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.grey[300] }}>
            Ross Tax & Bookkeeping is your trusted partner for professional tax preparation and bookkeeping services. 
            Proudly LGBTQ owned and operated since 2021.
          </p>
        </div>
        
        <div style={footerStyles.section}>
          <h4 style={footerStyles.heading}>Services</h4>
          <a href="/#services" style={footerStyles.link}>Tax Preparation</a>
          <a href="/#services" style={footerStyles.link}>Bookkeeping</a>
          <a href="/#services" style={footerStyles.link}>E-File Services</a>
          <a href="/#services" style={footerStyles.link}>Business Accounting</a>
          <a href="/#services" style={footerStyles.link}>Tax Education</a>
        </div>
        
        <div style={footerStyles.section}>
          <h4 style={footerStyles.heading}>Company</h4>
          <a href="/#about" style={footerStyles.link}>About</a>
          <a href="/#services" style={footerStyles.link}>Services</a>
          <a href="/#contact" style={footerStyles.link}>Contact</a>
          <a href="/faq" style={footerStyles.link}>FAQ</a>
          <a href="/privacy" style={footerStyles.link}>Privacy Policy</a>
        </div>
        
        <div style={footerStyles.section}>
          <h4 style={footerStyles.heading}>Contact Us</h4>
          <p style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.grey[300], marginBottom: SPACING.sm }}>
            📍 <strong>Killeen, Texas 76549</strong>
          </p>
          <p style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.grey[300], marginBottom: SPACING.sm }}>
            📞 <strong>(512) 489-6749</strong>
          </p>
          <p style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.grey[300] }}>
            📧 <strong>info@rosstaxprepandbookkeeping.com</strong>
          </p>
        </div>
      </div>
      
      <div style={footerStyles.divider}>
        <p style={{ marginBottom: SPACING.sm }}>
          © 2021-2026 Ross Tax & Bookkeeping LLC. All rights reserved.
        </p>
        <p style={{ marginBottom: SPACING.sm }}>
          Independently Owned &amp; Operated by a Proud LGBTQ Member
        </p>
        <p style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.grey[500], marginTop: SPACING.md }}>
          <strong>Disclaimer:</strong> All services rendered are non-refundable. Ross Tax &amp; Bookkeeping is not a law firm or CPA firm. 
          Client-provided information relied upon. No guaranteed outcomes.
        </p>
      </div>
    </footer>
  );
}
