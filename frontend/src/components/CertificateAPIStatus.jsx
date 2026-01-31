import React, { useEffect, useState } from "react";

// CertificateAPIStatus fetches and displays certificate info from the backend
export default function CertificateAPIStatus() {
  const [cert, setCert] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/certificates")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setCert(data[0]);
        else setError("No certificate found");
      })
      .catch(() => setError("Could not load certificate info"));
  }, []);

  if (error) return <div style={{color:'#B00020',marginBottom:12}}>Certificate API: {error}</div>;
  if (!cert) return <div style={{color:'#888',marginBottom:12}}>Loading certificate status…</div>;

  return (
    <div style={{background:'#E8F5E9',borderRadius:8,padding:'0.5em 1em',marginBottom:'1em',color:'#256029'}}>
      <strong>IRS E-File Certificate:</strong> {cert.name || cert.id} <br/>
      <span>Status: {cert.status || 'Active'}</span>
      {cert.issued_at && <span> &middot; Issued: {new Date(cert.issued_at).toLocaleDateString()}</span>}
    </div>
  );
}
