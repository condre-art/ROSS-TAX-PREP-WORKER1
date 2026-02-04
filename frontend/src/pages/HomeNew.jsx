import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';

export default function Home() {
  const styles = {
    // Hero Section
    hero: {
      background: `linear-gradient(135deg, ${COLORS.navy[900]} 0%, ${COLORS.navy[800]} 100%)`,
      padding: `${SPACING['4xl']} ${SPACING.lg}`,
      textAlign: 'center',
      color: COLORS.white
    },
    heroHeadline: {
      fontSize: TYPOGRAPHY.fontSize['4xl'],
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.lg,
      color: COLORS.gold[500]
    },
    heroSubheadline: {
      fontSize: TYPOGRAPHY.fontSize.xl,
      marginBottom: SPACING['2xl'],
      lineHeight: 1.6,
      maxWidth: '800px',
      margin: `0 auto ${SPACING['2xl']}`
    },
    heroCTAs: {
      display: 'flex',
      gap: SPACING.lg,
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginBottom: SPACING['2xl']
    },
    trustBadges: {
      display: 'flex',
      gap: SPACING.xl,
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: SPACING['2xl']
    },
    trustBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.white,
      padding: `${SPACING.sm} ${SPACING.md}`,
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '8px'
    },

    // Section Wrapper
    section: {
      padding: `${SPACING['3xl']} ${SPACING.lg}`,
      maxWidth: '1200px',
      margin: '0 auto'
    },
    sectionTitle: {
      fontSize: TYPOGRAPHY.fontSize['3xl'],
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      textAlign: 'center',
      marginBottom: SPACING.xl,
      color: COLORS.navy[900]
    },
    sectionSubtitle: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      textAlign: 'center',
      marginBottom: SPACING['2xl'],
      color: COLORS.gray[600],
      maxWidth: '700px',
      margin: `0 auto ${SPACING['2xl']}`
    },

    // Service Cards Grid
    servicesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: SPACING.xl,
      marginBottom: SPACING['2xl']
    },
    serviceCard: {
      padding: SPACING.xl,
      background: COLORS.white,
      border: `2px solid ${COLORS.gray[200]}`,
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    serviceTitle: {
      fontSize: TYPOGRAPHY.fontSize.xl,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.md,
      color: COLORS.navy[900]
    },
    serviceDescription: {
      fontSize: TYPOGRAPHY.fontSize.base,
      color: COLORS.gray[600],
      lineHeight: 1.6
    },

    // How It Works
    howItWorksSteps: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: SPACING.xl
    },
    step: {
      textAlign: 'center'
    },
    stepNumber: {
      fontSize: TYPOGRAPHY.fontSize['3xl'],
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: COLORS.gold[500],
      marginBottom: SPACING.md
    },
    stepTitle: {
      fontSize: TYPOGRAPHY.fontSize.xl,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.sm,
      color: COLORS.navy[900]
    },

    // Pricing Tiers
    pricingGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: SPACING.xl,
      marginBottom: SPACING['2xl']
    },
    pricingCard: {
      padding: SPACING['2xl'],
      background: COLORS.white,
      border: `2px solid ${COLORS.gray[200]}`,
      borderRadius: '12px',
      textAlign: 'center'
    },
    pricingTier: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: COLORS.gold[500],
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: SPACING.sm
    },
    pricingTitle: {
      fontSize: TYPOGRAPHY.fontSize['2xl'],
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.md,
      color: COLORS.navy[900]
    },
    pricingPrice: {
      fontSize: TYPOGRAPHY.fontSize['3xl'],
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.lg,
      color: COLORS.navy[900]
    },
    pricingFeatures: {
      listStyle: 'none',
      padding: 0,
      marginBottom: SPACING.lg,
      textAlign: 'left'
    },
    pricingFeature: {
      padding: `${SPACING.sm} 0`,
      borderBottom: `1px solid ${COLORS.gray[200]}`,
      fontSize: TYPOGRAPHY.fontSize.base
    },

    // Trust Section
    trustGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: SPACING.lg
    },
    trustItem: {
      padding: SPACING.xl,
      background: COLORS.white,
      border: `2px solid ${COLORS.navy[100]}`,
      borderRadius: '8px',
      textAlign: 'center'
    },
    trustIcon: {
      fontSize: '3rem',
      marginBottom: SPACING.md
    },
    trustTitle: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.sm,
      color: COLORS.navy[900]
    },

    // FAQ
    faqItem: {
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      background: COLORS.white,
      border: `1px solid ${COLORS.gray[200]}`,
      borderRadius: '8px'
    },
    faqQuestion: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.sm,
      color: COLORS.navy[900]
    },
    faqAnswer: {
      fontSize: TYPOGRAPHY.fontSize.base,
      color: COLORS.gray[600],
      lineHeight: 1.6
    },

    // Footer
    footer: {
      background: COLORS.navy[900],
      color: COLORS.white,
      padding: `${SPACING['3xl']} ${SPACING.lg}`,
      textAlign: 'center'
    },
    footerGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: SPACING.xl,
      maxWidth: '1200px',
      margin: `0 auto ${SPACING['2xl']}`
    },
    footerSection: {
      textAlign: 'left'
    },
    footerTitle: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      marginBottom: SPACING.md,
      color: COLORS.gold[500]
    },
    footerLink: {
      display: 'block',
      color: COLORS.white,
      textDecoration: 'none',
      marginBottom: SPACING.sm,
      transition: 'color 0.2s ease'
    },
    disclaimer: {
      background: COLORS.red[50],
      border: `2px solid ${COLORS.red[500]}`,
      borderRadius: '8px',
      padding: SPACING.xl,
      marginTop: SPACING.xl,
      fontSize: TYPOGRAPHY.fontSize.sm,
      lineHeight: 1.6,
      color: COLORS.gray[800]
    }
  };

  const services = [
    {
      title: "Tax Preparation",
      description: "Accurate individual & business filing with deduction optimization and clean documentation."
    },
    {
      title: "Bookkeeping Services",
      description: "Monthly reconciliations, reports, and cleanup—books you can actually trust."
    },
    {
      title: "E-File Transmission",
      description: "IRS-compliant e-file workflow with secure submission tracking."
    },
    {
      title: "Business Accounting",
      description: "Quarterly planning, year-end readiness, and business financial clarity."
    },
    {
      title: "Tax Education",
      description: "Coaching and courses for tax pros and business owners who want control."
    },
    {
      title: "Refund Services",
      description: "Guidance, notice support, and refund tracking with real answers."
    }
  ];

  const pricingTiers = [
    {
      tier: "Signature",
      title: "Signature Package",
      price: "$1,200/year",
      features: [
        "Individual tax preparation",
        "Limited advisory support",
        "Standard deduction optimization",
        "Email support",
        "Basic document storage"
      ]
    },
    {
      tier: "Elite",
      title: "Elite Package",
      price: "$3,000/year",
      features: [
        "Business + personal tax services",
        "Tax planning included",
        "1 business entity",
        "Priority support",
        "Quarterly check-ins",
        "Advanced document management"
      ],
      featured: true
    },
    {
      tier: "Platinum",
      title: "Platinum Package",
      price: "$6,000/year",
      features: [
        "Concierge tax & advisory",
        "Full compliance support",
        "Multiple entities",
        "24/7 priority access",
        "Monthly strategy sessions",
        "Dedicated tax professional"
      ]
    }
  ];

  const faqs = [
    {
      question: "What makes your pricing different?",
      answer: "We use transparent, luxury-level service pricing without luxury-level confusion. All prices are starting rates based on complexity."
    },
    {
      question: "Do you offer refunds?",
      answer: "All services rendered are non-refundable. We rely on client-provided information for accuracy."
    },
    {
      question: "How long does tax preparation take?",
      answer: "Most returns are completed within 5-7 business days once all documents are received. Fast turnaround options are available."
    },
    {
      question: "Is my data secure?",
      answer: "Yes. We use bank-level encryption, multi-factor authentication, and secure document upload portals protected by Cloudflare."
    },
    {
      question: "What states do you serve?",
      answer: "We primarily serve TX, LA, and AR, but can assist clients in other states depending on complexity."
    }
  ];

  return (
    <div>
      {/* HERO SECTION */}
      <section style={styles.hero}>
        <h1 style={styles.heroHeadline}>
          Professional Tax & Bookkeeping Services—Premium Care, Clear Pricing.
        </h1>
        <p style={styles.heroSubheadline}>
          Tax prep, bookkeeping, and business support for individuals and small businesses. 
          From filing to planning, we keep you compliant, confident, and covered.
        </p>

        <div style={styles.heroCTAs}>
          <Link to="/intake">
            <Button size="large" variant="primary">START YOUR TAX FILING</Button>
          </Link>
          <Link to="/diy-efile">
            <Button size="large" variant="secondary">DIY E-FILE WIZARD</Button>
          </Link>
          <Link to="/portal">
            <Button size="large" variant="outline">CLIENT PORTAL LOGIN</Button>
          </Link>
        </div>

        <div style={styles.trustBadges}>
          <div style={styles.trustBadge}>✅ IRS e-file workflow</div>
          <div style={styles.trustBadge}>🔒 Encrypted document upload + MFA</div>
          <div style={styles.trustBadge}>⚡ Fast turnaround options</div>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section id="services" style={styles.section}>
        <h2 style={styles.sectionTitle}>Our Services</h2>
        <p style={styles.sectionSubtitle}>
          Comprehensive tax and bookkeeping solutions for individuals and businesses
        </p>

        <div style={styles.servicesGrid}>
          {services.map((service, index) => (
            <div key={index} style={styles.serviceCard}>
              <h3 style={styles.serviceTitle}>{service.title}</h3>
              <p style={styles.serviceDescription}>{service.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/services">
            <Button size="large">View All Services & Pricing</Button>
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ ...styles.section, background: COLORS.gray[50] }}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <p style={styles.sectionSubtitle}>
          Simple, secure, and stress-free tax filing in three easy steps
        </p>

        <div style={styles.howItWorksSteps}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Upload Documents</h3>
            <p style={styles.serviceDescription}>
              Securely upload your tax documents through our encrypted client portal
            </p>
          </div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>We Prepare Your Return</h3>
            <p style={styles.serviceDescription}>
              Our tax professionals review, prepare, and optimize your return
            </p>
          </div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>E-File & Track</h3>
            <p style={styles.serviceDescription}>
              We transmit to the IRS and you track your refund status in real-time
            </p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={styles.section}>
        <h2 style={styles.sectionTitle}>Transparent Pricing</h2>
        <p style={styles.sectionSubtitle}>
          Luxury-level service without luxury-level confusion. Transparent rates, premium support.
        </p>

        <div style={styles.pricingGrid}>
          {pricingTiers.map((tier, index) => (
            <div 
              key={index} 
              style={{
                ...styles.pricingCard,
                ...(tier.featured ? { 
                  border: `3px solid ${COLORS.gold[500]}`,
                  transform: 'scale(1.05)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                } : {})
              }}
            >
              <div style={styles.pricingTier}>{tier.tier}</div>
              <h3 style={styles.pricingTitle}>{tier.title}</h3>
              <div style={styles.pricingPrice}>{tier.price}</div>
              <ul style={styles.pricingFeatures}>
                {tier.features.map((feature, i) => (
                  <li key={i} style={styles.pricingFeature}>✓ {feature}</li>
                ))}
              </ul>
              <Button fullWidth size="large">Get Started</Button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: SPACING.xl }}>
          <Link to="/services">
            <Button variant="outline" size="large">View Complete Price List</Button>
          </Link>
        </div>
      </section>

      {/* DIY E-FILE WIZARD */}
      <section style={{ ...styles.section, background: COLORS.navy[900], color: COLORS.white }}>
        <h2 style={{ ...styles.sectionTitle, color: COLORS.gold[500] }}>DIY E-File Wizard</h2>
        <p style={{ ...styles.sectionSubtitle, color: COLORS.white }}>
          File your own taxes with our step-by-step guided wizard
        </p>

        <div style={styles.trustGrid}>
          <div style={{ ...styles.trustItem, background: COLORS.navy[800], borderColor: COLORS.gold[500] }}>
            <div style={styles.trustIcon}>📝</div>
            <div style={{ ...styles.trustTitle, color: COLORS.white }}>Step-by-Step Guidance</div>
            <p style={{ color: COLORS.gray[300] }}>Easy interview-style questions</p>
          </div>
          <div style={{ ...styles.trustItem, background: COLORS.navy[800], borderColor: COLORS.gold[500] }}>
            <div style={styles.trustIcon}>💰</div>
            <div style={{ ...styles.trustTitle, color: COLORS.white }}>Maximum Refund</div>
            <p style={{ color: COLORS.gray[300] }}>Automated deduction finder</p>
          </div>
          <div style={{ ...styles.trustItem, background: COLORS.navy[800], borderColor: COLORS.gold[500] }}>
            <div style={styles.trustIcon}>🔐</div>
            <div style={{ ...styles.trustTitle, color: COLORS.white }}>IRS Compliant</div>
            <p style={{ color: COLORS.gray[300] }}>Direct e-file transmission</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: SPACING['2xl'] }}>
          <Link to="/diy-efile">
            <Button size="large" variant="secondary">Start DIY E-File Wizard Now</Button>
          </Link>
        </div>
      </section>

      {/* TRUST & SECURITY */}
      <section id="about" style={styles.section}>
        <h2 style={styles.sectionTitle}>Trust & Security</h2>
        <p style={styles.sectionSubtitle}>
          Your data is protected with enterprise-grade security
        </p>

        <div style={styles.trustGrid}>
          <div style={styles.trustItem}>
            <div style={styles.trustIcon}>🛡️</div>
            <div style={styles.trustTitle}>Cloudflare Protection</div>
            <p style={{ color: COLORS.gray[600] }}>DDoS protection, WAF, and bot filtering</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIcon}>🔐</div>
            <div style={styles.trustTitle}>Multi-Factor Auth</div>
            <p style={{ color: COLORS.gray[600] }}>2FA on all client logins</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIcon}>🔒</div>
            <div style={styles.trustTitle}>Bank-Level Encryption</div>
            <p style={{ color: COLORS.gray[600] }}>Data encrypted in transit and at rest</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIcon}>📋</div>
            <div style={styles.trustTitle}>Audit Logs</div>
            <p style={{ color: COLORS.gray[600] }}>Complete access tracking</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIcon}>✍️</div>
            <div style={styles.trustTitle}>E-Signatures</div>
            <p style={{ color: COLORS.gray[600] }}>Secure digital document signing</p>
          </div>
          <div style={styles.trustItem}>
            <div style={styles.trustIcon}>🗂️</div>
            <div style={styles.trustTitle}>Secure Storage</div>
            <p style={{ color: COLORS.gray[600] }}>R2 cloud document management</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ ...styles.section, background: COLORS.gray[50] }}>
        <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {faqs.map((faq, index) => (
            <div key={index} style={styles.faqItem}>
              <div style={styles.faqQuestion}>{faq.question}</div>
              <div style={styles.faqAnswer}>{faq.answer}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" style={styles.footer}>
        <div style={styles.footerGrid}>
          <div style={styles.footerSection}>
            <div style={styles.footerTitle}>Locations</div>
            <p>Texas • Louisiana • Arkansas</p>
            <p style={{ marginTop: SPACING.md }}>
              <a href="tel:+1234567890" style={styles.footerLink}>📞 (123) 456-7890</a>
              <a href="mailto:info@rosstaxprep.com" style={styles.footerLink}>✉️ info@rosstaxprep.com</a>
            </p>
          </div>

          <div style={styles.footerSection}>
            <div style={styles.footerTitle}>Quick Links</div>
            <Link to="/services" style={styles.footerLink}>Services & Pricing</Link>
            <Link to="/portal" style={styles.footerLink}>Client Portal</Link>
            <Link to="/diy-efile" style={styles.footerLink}>DIY E-File Wizard</Link>
            <Link to="/lms" style={styles.footerLink}>Tax Education</Link>
          </div>

          <div style={styles.footerSection}>
            <div style={styles.footerTitle}>Resources</div>
            <a href="/#faq" style={styles.footerLink}>FAQs</a>
            <a href="https://www.irs.gov/refunds" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Track Your Refund</a>
            <a href="https://www.irs.gov" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>IRS Resources</a>
          </div>

          <div style={styles.footerSection}>
            <div style={styles.footerTitle}>Legal</div>
            <Link to="/privacy" style={styles.footerLink}>Privacy Policy</Link>
            <Link to="/terms" style={styles.footerLink}>Terms of Service</Link>
            <Link to="/disclaimer" style={styles.footerLink}>Disclaimer</Link>
          </div>
        </div>

        <div style={styles.disclaimer}>
          <strong>Important Disclaimer:</strong><br />
          All services rendered are non-refundable. ROSS Tax & Bookkeeping is not a law firm or CPA firm. 
          We rely on client-provided information for accuracy. Results vary and are not guaranteed. 
          Consult a qualified tax professional or attorney for legal advice.
        </div>

        <div style={{ marginTop: SPACING.xl, fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.gray[400] }}>
          © {new Date().getFullYear()} ROSS Tax Prep & Bookkeeping. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
