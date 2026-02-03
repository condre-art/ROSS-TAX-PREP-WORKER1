


import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';

export default function Home() {
  const styles = {
    // Watermark in center
    watermark: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '120px',
      fontWeight: 'bold',
      color: 'rgba(64, 120, 180, 0.05)',
      pointerEvents: 'none',
      zIndex: 0,
      whiteSpace: 'nowrap',
      textShadow: '0 0 20px rgba(64, 120, 180, 0.1)'
    },
    mainContent: {
      position: 'relative',
      zIndex: 1
    },
    heroSection: {
      background: `linear-gradient(135deg, ${COLORS.navy[900]} 0%, ${COLORS.navy[800]} 100%)`,
      padding: `${SPACING['3xl']} ${SPACING.lg}`,
      color: COLORS.white,
      textAlign: 'center'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `0 ${SPACING.lg}`
    },
    heroTitle: {
      fontSize: TYPOGRAPHY.fontSize['4xl'],
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.lg,
      color: COLORS.gold[500]
    },
    heroSubtitle: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      color: COLORS.grey[200],
      marginBottom: SPACING['2xl'],
      maxWidth: '800px',
      margin: `0 auto ${SPACING['2xl']}`
    },
    buttonGroup: {
      display: 'flex',
      gap: SPACING.lg,
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginBottom: SPACING['2xl']
    },
    badges: {
      display: 'flex',
      gap: SPACING.md,
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: SPACING.lg
    },
    badge: {
      background: 'rgba(243, 160, 6, 0.2)',
      border: `1px solid ${COLORS.gold[500]}`,
      color: COLORS.gold[500],
      padding: `${SPACING.sm} ${SPACING.md}`,
      borderRadius: '20px',
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: TYPOGRAPHY.fontWeight.medium
    },
    section: {
      padding: `${SPACING['3xl']} ${SPACING.lg}`,
      borderBottom: `1px solid ${COLORS.grey[200]}`
    },
    sectionTitle: {
      fontSize: TYPOGRAPHY.fontSize['3xl'],
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: COLORS.navy[900],
      marginBottom: SPACING['2xl'],
      textAlign: 'center'
    },
    sectionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: SPACING['2xl'],
      maxWidth: '1200px',
      margin: '0 auto'
    },
    card: {
      background: COLORS.white,
      border: `1px solid ${COLORS.grey[200]}`,
      borderRadius: '12px',
      padding: SPACING.lg,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    },
    cardTitle: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: COLORS.navy[900],
      marginBottom: SPACING.md
    },
    cardContent: {
      fontSize: TYPOGRAPHY.fontSize.base,
      color: COLORS.grey[700],
      lineHeight: '1.6'
    },
    ctaSection: {
      background: `linear-gradient(135deg, ${COLORS.gold[500]} 0%, ${COLORS.gold[600]} 100%)`,
      padding: `${SPACING['3xl']} ${SPACING.lg}`,
      textAlign: 'center',
      color: COLORS.navy[900]
    },
    ctaTitle: {
      fontSize: TYPOGRAPHY.fontSize['2xl'],
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.lg
    },
    disclaimer: {
      background: COLORS.grey[100],
      border: `2px solid ${COLORS.gold[500]}`,
      borderRadius: '8px',
      padding: SPACING.lg,
      marginTop: SPACING['2xl'],
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.navy[900],
      fontStyle: 'italic'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: SPACING.lg,
      marginBottom: SPACING['2xl']
    },
    feature: {
      textAlign: 'center',
      padding: SPACING.lg
    },
    featureIcon: {
      fontSize: '48px',
      marginBottom: SPACING.md
    },
    featureTitle: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: COLORS.navy[900],
      marginBottom: SPACING.sm
    }
  };

  return (
    <div>
      {/* Watermark in background */}
      <div style={styles.watermark}>ROSS</div>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.container}>
          <h1 style={styles.heroTitle}>Professional Tax & Bookkeeping Services</h1>
          <p style={styles.heroSubtitle}>
            Expert tax preparation, bookkeeping, and business services for individuals and small businesses.
            From filing to planning, we handle the numbers so you can focus on growth.
          </p>
          
          <div style={styles.buttonGroup}>
            <Button as={Link} to="/intake">
              Start Your Tax Filing
            </Button>
            <Button as={Link} to="/efile" variant="outline">
              File with E-File
            </Button>
          </div>

          <div style={styles.badges}>
            <div style={styles.badge}>✓ IRS Approved E-File Partner</div>
            <div style={styles.badge}>✓ Secure Data Protection</div>
            <div style={styles.badge}>✓ Fast Refund Processing</div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section style={styles.section} id="services">
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Our Services</h2>
          
          <div style={styles.sectionGrid}>
            <div style={styles.card}>
              <div style={styles.featureIcon}>📋</div>
              <h3 style={styles.cardTitle}>Tax Preparation</h3>
              <p style={styles.cardContent}>
                Professional preparation of individual and business tax returns with expert guidance on deductions, credits, and compliance.
              </p>
            </div>

            <div style={styles.card}>
              <div style={styles.featureIcon}>📊</div>
              <h3 style={styles.cardTitle}>Bookkeeping Services</h3>
              <p style={styles.cardContent}>
                Complete bookkeeping solutions including expense tracking, payroll management, and financial reporting.
              </p>
            </div>

            <div style={styles.card}>
              <div style={styles.featureIcon}>🚀</div>
              <h3 style={styles.cardTitle}>E-File Transmission</h3>
              <p style={styles.cardContent}>
                Fast, secure electronic filing with IRS approval. Get your refund faster with our e-file services.
              </p>
            </div>

            <div style={styles.card}>
              <div style={styles.featureIcon}>💼</div>
              <h3 style={styles.cardTitle}>Business Accounting</h3>
              <p style={styles.cardContent}>
                Small business accounting, quarterly tax planning, and year-end closure support for growth.
              </p>
            </div>

            <div style={styles.card}>
              <div style={styles.featureIcon}>🎓</div>
              <h3 style={styles.cardTitle}>Tax Education</h3>
              <p style={styles.cardContent}>
                Learn tax planning strategies and compliance requirements through our training courses and resources.
              </p>
            </div>

            <div style={styles.card}>
              <div style={styles.featureIcon}>💰</div>
              <h3 style={styles.cardTitle}>Refund Services</h3>
              <p style={styles.cardContent}>
                Fast refund processing, payment plan options, and refund advance services. Where's my refund tracking included.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Where's My Refund Section */}
      <section style={{ ...styles.section, background: COLORS.grey[50] }}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Track Your Refund</h2>
          <p style={{ textAlign: 'center', fontSize: TYPOGRAPHY.fontSize.lg, marginBottom: SPACING['2xl'] }}>
            Check your federal tax refund status directly with the IRS.
          </p>
          <div style={{ textAlign: 'center' }}>
            <Button 
              as="a"
              href="https://www.irs.gov/refunds"
              target="_blank"
              rel="noopener noreferrer"
            >
              Where's My Refund? (IRS.gov)
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section style={styles.section}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Why Choose Ross Tax & Bookkeeping?</h2>
          
          <div style={styles.featuresGrid}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>👨‍💼</div>
              <h3 style={styles.featureTitle}>Expert Team</h3>
              <p style={styles.cardContent}>PTIN certified professionals with years of tax experience</p>
            </div>

            <div style={styles.feature}>
              <div style={styles.featureIcon}>🔒</div>
              <h3 style={styles.featureTitle}>Secure & Private</h3>
              <p style={styles.cardContent}>Bank-level encryption for all your sensitive information</p>
            </div>

            <div style={styles.feature}>
              <div style={styles.featureIcon}>⚡</div>
              <h3 style={styles.featureTitle}>Fast Service</h3>
              <p style={styles.cardContent}>Quick turnaround times and prompt refund processing</p>
            </div>

            <div style={styles.feature}>
              <div style={styles.featureIcon}>🌈</div>
              <h3 style={styles.featureTitle}>Inclusive Community</h3>
              <p style={styles.cardContent}>Proudly LGBTQ owned and operated business</p>
            </div>

            <div style={styles.feature}>
              <div style={styles.featureIcon}>💻</div>
              <h3 style={styles.featureTitle}>Modern Technology</h3>
              <p style={styles.cardContent}>Latest software and e-file capabilities for accuracy</p>
            </div>

            <div style={styles.feature}>
              <div style={styles.featureIcon}>📞</div>
              <h3 style={styles.featureTitle}>Responsive Support</h3>
              <p style={styles.cardContent}>Available to answer questions and provide guidance</p>
            </div>
          </div>
        </div>
      </section>

      {/* DIY E-File Wizard Section */}
      <section style={{ ...styles.section, backgroundColor: '#F4F8FB' }}>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', marginBottom: SPACING['2xl'] }}>
            <h2 style={{ ...styles.sectionTitle, color: COLORS.navy[900] }}>
              🚀 DIY E-File Wizard
            </h2>
            <p style={{ ...styles.sectionSubtitle, marginBottom: SPACING.lg }}>
              Maximum Refund Guarantee | State & Federal | IRS Compliant
            </p>
            <p style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.grey[700], lineHeight: '1.7', maxWidth: '600px', margin: '0 auto' }}>
              Our AI-powered DIY wizard guides you through your tax return with real IRS form population (1040, 1041, 1040-X), 
              complete deduction & credit optimization, and direct MeF e-file transmission to the IRS.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: SPACING.lg, marginBottom: SPACING['2xl'] }}>
            <div style={{ ...styles.card, textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: SPACING.md }}>📋</div>
              <h4 style={styles.cardTitle}>Complete Form Population</h4>
              <p style={styles.cardContent}>Auto-populated 1040, 1041, & 1040-X forms with your data</p>
            </div>

            <div style={{ ...styles.card, textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: SPACING.md }}>🎯</div>
              <h4 style={styles.cardTitle}>Maximum Refund AI</h4>
              <p style={styles.cardContent}>Identifies every deduction and credit you qualify for</p>
            </div>

            <div style={{ ...styles.card, textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: SPACING.md }}>🔐</div>
              <h4 style={styles.cardTitle}>IRS MeF Integration</h4>
              <p style={styles.cardContent}>Direct transmission with real-time acknowledgment tracking</p>
            </div>

            <div style={{ ...styles.card, textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: SPACING.md }}>⚡</div>
              <h4 style={styles.cardTitle}>Fast & Secure</h4>
              <p style={styles.cardContent}>Your data encrypted. Refund within 21 days via direct deposit</p>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button as={Link} to="/diy-efile" style={{ minWidth: 240, fontSize: 16, padding: '12px 24px' }}>
              Start DIY E-File Wizard Now
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <h2 style={styles.ctaTitle}>Ready to Get Started?</h2>
          <p style={{ fontSize: TYPOGRAPHY.fontSize.lg, marginBottom: SPACING['2xl'] }}>
            Let us handle your taxes while you focus on what matters most.
          </p>
          <Button as={Link} to="/intake">
            Start Your Tax Return Today
          </Button>
        </div>
      </section>

      {/* Disclaimer */}
      <section style={styles.section}>
        <div style={{ ...styles.container, maxWidth: '800px' }}>
          <div style={styles.disclaimer}>
            <strong>Important Disclaimer:</strong><br /><br />
            All services rendered are non-refundable. Ross Tax & Bookkeeping is not a law firm or CPA firm. 
            We rely on client-provided information for accuracy. No guaranteed outcomes. Consult with a qualified 
            tax professional or attorney for specific legal or tax advice.
          </div>
        </div>
      </section>
    </div>
  );
}
