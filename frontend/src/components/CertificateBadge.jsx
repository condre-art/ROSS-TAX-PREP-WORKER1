import React from "react";

// CertificateBadge component for displaying IRS Authorized E-File Provider badge
export default function CertificateBadge() {
  return (
    <div style={{background:'#F7F7F7',borderRadius:8,padding:'1em 2em',marginBottom:'2em',boxShadow:'0 2px 8px #10274D22'}}>
      {/* IRS E-File Provider */}
      <h2 style={{color:'#4CAF50',fontFamily:'Georgia,serif'}}>IRS Authorized E-File Provider</h2>
      <img src="/assets/irs-authorized-badge.png" alt="IRS Authorized E-File Provider" style={{height:80,margin:'1em 0'}} />
      <div style={{fontSize:'1.1em',color:'#10274D',fontWeight:'bold'}}>Certificate #2026-RTB-IRS-001</div>
      <div style={{fontSize:'0.95em',color:'#9A9A9A',marginBottom:16}}>This site is certified as an IRS Authorized E-File Provider for the 2026 tax season.</div>

      {/* SSL/TLS Badge */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <img src="/assets/ssl-secure-badge.png" alt="SSL Secured" style={{height:48}} />
        <div>
          <div style={{fontWeight:'bold',color:'#256029'}}>SSL/TLS Secured</div>
          <div style={{fontSize:13,color:'#888'}}>All data encrypted in transit (HTTPS)</div>
        </div>
      </div>

      {/* CPA/Professional License Badge */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <img src="/assets/cpa-badge.png" alt="CPA Certified" style={{height:48}} />
        <div>
          <div style={{fontWeight:'bold',color:'#10274D'}}>CPA/Tax Professional</div>
          <div style={{fontSize:13,color:'#888'}}>Licensed & Registered Preparer (PTIN/EFIN)</div>
        </div>
      </div>

      {/* Data Privacy/Compliance Badge (SOC2/GDPR/HIPAA) */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
        <img src="/assets/compliance-badge.png" alt="Compliance Badge" style={{height:48}} />
        <div>
          <div style={{fontWeight:'bold',color:'#10274D'}}>Data Privacy & Compliance</div>
          <div style={{fontSize:13,color:'#888'}}>SOC 2, GDPR, or HIPAA (if applicable)</div>
        </div>
      </div>

      {/* Accessibility Statement */}
      <div style={{marginTop:12,fontSize:13,color:'#666'}}>
        <strong>Accessibility:</strong> This site is designed to meet WCAG/ADA accessibility standards.
      </div>
    </div>
  );
}
