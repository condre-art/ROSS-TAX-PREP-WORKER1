

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Alert from "../components/Alert";
import { generateServicesPricingPDF } from "../utils/generateServicesPricingPDF";
import CertificateBadge from "../components/CertificateBadge";

export default function Services() {
  // Auth & Role State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'client', 'preparer', 'ero', 'admin'
  const [permissions, setPermissions] = useState([]);
  const [clientId, setClientId] = useState(null);
  
  // Service Request State
  const [selectedServices, setSelectedServices] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestStatus, setRequestStatus] = useState({ type: '', message: '' });
  const [documents, setDocuments] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  
  // Load auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('ross_auth_token');
    const role = localStorage.getItem('ross_user_role');
    const perms = localStorage.getItem('ross_permissions');
    const id = localStorage.getItem('ross_client_id');
    
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      setPermissions(perms ? JSON.parse(perms) : []);
      setClientId(id);
      loadServiceHistory(id);
    }
  }, []);
  
  const loadServiceHistory = async (id) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/services/history/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ross_auth_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setServiceHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load service history:', error);
    }
  };
  
  const hasPermission = (permission) => {
    return permissions.includes(permission) || userRole === 'admin' || userRole === 'ero';
  };
  
  const handleServiceSelect = (service, category) => {
    const serviceItem = {
      id: `${category.title}-${service.name}-${Date.now()}`,
      category: category.title,
      form: service.form || '',
      name: service.name,
      price: service.price,
      description: service.description || '',
      timestamp: new Date().toISOString()
    };
    
    setSelectedServices([...selectedServices, serviceItem]);
    setRequestStatus({ type: 'success', message: `Added ${service.name} to your request` });
    setTimeout(() => setRequestStatus({ type: '', message: '' }), 3000);
  };
  
  const handleRemoveService = (serviceId) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };
  
  const handleSubmitRequest = async () => {
    if (!isAuthenticated) {
      setRequestStatus({ type: 'error', message: 'Please log in to submit a service request' });
      return;
    }
    
    if (selectedServices.length === 0) {
      setRequestStatus({ type: 'error', message: 'Please select at least one service' });
      return;
    }
    
    try {
      const response = await fetch('/api/services/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ross_auth_token')}`
        },
        body: JSON.stringify({
          client_id: clientId,
          services: selectedServices,
          documents: documents,
          status: 'pending_approval',
          submitted_at: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequestStatus({ type: 'success', message: 'Service request submitted successfully! We will contact you within 24 hours.' });
        setSelectedServices([]);
        setShowRequestModal(false);
        loadServiceHistory(clientId);
      } else {
        setRequestStatus({ type: 'error', message: 'Failed to submit request. Please try again.' });
      }
    } catch (error) {
      setRequestStatus({ type: 'error', message: 'Network error. Please try again.' });
    }
  };
  
  const handleDocumentUpload = async (event) => {
    const files = Array.from(event.target.files);
    const uploadedDocs = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('client_id', clientId);
      formData.append('category', 'service_request');
      
      try {
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('ross_auth_token')}` },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          uploadedDocs.push({ name: file.name, url: data.url, uploaded_at: new Date().toISOString() });
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    
    setDocuments([...documents, ...uploadedDocs]);
    setRequestStatus({ type: 'success', message: `${uploadedDocs.length} document(s) uploaded` });
  };

  const handleTextbookPurchase = (volumeName) => {
    // Redirect to LMS API for textbook sales
    window.location.href = `/api/lms/textbooks/${volumeName}`;
  };

  const serviceCategories = [
    {
      title: "🧾 Individual Tax Services (IRS Form 1040 Series)",
      description: "All pricing reflects complexity, compliance risk, and advisory involvement.",
      services: [
        { form: "1040", name: "Federal Individual Tax Return", price: "$355" },
        { form: "1040 + State", name: "Federal + State Filing", price: "$415" },
        { form: "Schedule A", name: "Itemized Deductions", price: "$475" },
        { form: "Schedule B", name: "Interest & Dividends", price: "$415" },
        { form: "Schedule C", name: "Sole Proprietor / 1099 Business", price: "$780" },
        { form: "Schedule D", name: "Capital Gains & Losses", price: "$475" },
        { form: "Schedule E", name: "Rental / Pass-Through Income", price: "$900" },
        { form: "Schedule F", name: "Farm Income", price: "$900" },
        { form: "Form 2106", name: "Employee Business Expenses", price: "$355" },
        { form: "Form 2441", name: "Child & Dependent Care", price: "$355" },
        { form: "Form 8863", name: "Education Credits", price: "$355" },
        { form: "Form 8962", name: "Premium Tax Credit Reconciliation", price: "$420" },
        { form: "Multi-State", name: "Additional State Return", price: "$300 / state" }
      ]
    },
    {
      title: "🧠 Prior-Year & Amended Returns",
      services: [
        { form: "1040 (Prior Year)", name: "Each Prior Year Filed", price: "$420 / year" },
        { form: "1040-X", name: "Amended Return", price: "$540" },
        { form: "Transcript Review", name: "IRS Transcript Analysis", price: "$300" }
      ]
    },
    {
      title: "🏢 Business Tax Services (LLCs, Partnerships, Corporations)",
      services: [
        { form: "Schedule C", name: "Single-Member LLC", price: "$900" },
        { form: "1065", name: "Partnership Return", price: "$1,450" },
        { form: "1120-S", name: "S-Corporation", price: "$1,800" },
        { form: "1120", name: "C-Corporation", price: "$2,150" },
        { form: "7004", name: "Business Extension", price: "$300" },
        { form: "K-1", name: "Additional K-1 (each)", price: "$180" }
      ]
    },
    {
      title: "🏛️ State & Business Compliance",
      services: [
        { form: "TX Franchise Tax", name: "Texas Franchise Filing", price: "$300" },
        { form: "Sales & Use Tax", name: "Monthly / Quarterly Filing", price: "$180 / filing" },
        { form: "Annual Reports", name: "State Compliance Filings", price: "$240" },
        { form: "Business Extensions", name: "State Extensions", price: "$240" }
      ]
    },
    {
      title: "🧠 IRS Resolution & Compliance Services",
      services: [
        { form: "CP Notices", name: "IRS Letters & Notices", price: "$300" },
        { form: "Form 9465", name: "Installment Agreement", price: "$900" },
        { form: "Form 843", name: "Penalty Abatement", price: "$780" },
        { form: "Form 2848", name: "Power of Attorney", price: "$240" },
        { form: "Form 433-A/B", name: "Financial Disclosure", price: "$1,450" },
        { form: "Audit Support", name: "IRS Audit Representation", price: "$300 / hour" },
        { form: "Identity Theft", name: "IRS Fraud Resolution", price: "$600" }
      ]
    },
    {
      title: "📊 Bookkeeping Services (Monthly Retainers)",
      description: "Includes reconciliations, financial statements, and tax-ready books.",
      services: [
        { name: "≤50 Transactions", price: "$540 / month" },
        { name: "51–150 Transactions", price: "$900 / month" },
        { name: "151–300 Transactions", price: "$1,450 / month" },
        { name: "Catch-Up Bookkeeping", price: "$720 / month" },
        { name: "Cleanup Projects", price: "$1,800+ (one-time)" }
      ]
    },
    {
      title: "💰 Payroll & Employer Filings",
      services: [
        { form: "Payroll Setup", name: "Employer Configuration", price: "$300" },
        { form: "Form 941", name: "Quarterly Payroll Filing", price: "$180 / quarter" },
        { form: "Form 940", name: "Federal Unemployment", price: "$180" },
        { form: "W-2", name: "Employee Wage Statements", price: "$180" },
        { form: "1099-NEC", name: "Contractor Filings", price: "$180" },
        { form: "State Payroll", name: "State Payroll Filings", price: "$180 / filing" }
      ]
    },
    {
      title: "🏛️ Notary Services (TX • LA • AR)",
      services: [
        { name: "Standard Notarization", price: "$30 / signature" },
        { name: "Mobile Notary", price: "$105 + mileage" },
        { name: "Loan Signing", price: "$240" },
        { name: "Business Documents", price: "$42 / signature" },
        { name: "After-Hours / Emergency", price: "+$60" }
      ]
    },
    {
      title: "🧠 Consulting & Strategy (Non-Preparation)",
      services: [
        { name: "New Business Consultation", price: "$360" },
        { name: "Tax Strategy Intensive", price: "$540" },
        { name: "Entity Structure Review", price: "$420" },
        { name: "Business Credit Education", price: "$420" },
        { name: "Bookkeeping Training (1:1)", price: "$600" }
      ]
    },
    {
      title: "💎 Tiered Packages (Annual Core Products)",
      services: [
        { name: "✨ Signature Package", price: "$1,200 / year", description: "Individual tax preparation with limited advisory support" },
        { name: "👑 Elite Package", price: "$3,000 / year", description: "Business + personal tax services with planning" },
        { name: "💎 Platinum Package", price: "$6,000 / year", description: "Concierge tax, advisory & compliance with priority queue" }
      ]
    },
    {
      title: "🔐 VIP Annual Retainers (Private Client Services)",
      description: "Auto-renewing subscription-based retainers for exclusive service tiers.",
      services: [
        { name: "VIP Essential", price: "$3,600 / year", description: "Priority access, strategic tax planning, quarterly reviews" },
        { name: "VIP Executive", price: "$6,000 / year", description: "Dedicated account manager, entity structuring, advanced compliance" },
        { name: "VIP Private Client", price: "$12,000 / year", description: "White-glove service, unlimited consultations, audit insurance (application required)" }
      ]
    }
  ];

  const textbooks = [
    {
      id: "vol1",
      name: "Student Textbook – Volume 1",
      price: "$129.99",
      description: "Foundational federal tax education covering individual tax preparation, ethics, credits, deductions, and real-world practice scenarios.",
      required: true
    },
    {
      id: "vol2",
      name: "Student Textbook – Volume 2",
      price: "$79.99",
      description: "Advanced individual taxation, Schedule C, business income, depreciation, and applied tax planning.",
      required: true
    },
    {
      id: "instructor",
      name: "Instructor Edition (Volumes 1–4)",
      price: "$399.99",
      description: "Complete instructional system including all student volumes, answer keys, lesson plans, and comprehensive syllabus.",
      restricted: true
    }
  ];

  return (
    <>
      <CertificateBadge />
      <section className="section">
        <div className="container">
          <div className="section-head" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2>Luxury Tax • Compliance • Advisory</h2>
            <p className="section-sub">Serving Texas • Louisiana • Arkansas</p>
            <p style={{ fontSize: 16, marginTop: 12, color: '#2C3E50', lineHeight: 1.6 }}>
              <strong>All pricing reflects complexity, compliance risk, and advisory involvement.</strong> We operate on an application-only, retainer-forward model. This firm does not offer discount pricing or volume-based services.
            </p>
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              backgroundColor: '#FFF8E1', 
              borderLeft: '4px solid #F3A006',
              borderRadius: 4
            }}>
              <p style={{ margin: 0, fontSize: 14, color: '#333' }}>
                <strong>⚠️ Official Pricing Statement:</strong> All prices shown are <strong>starting rates</strong> and subject to complexity, compliance exposure, and documentation quality. Final pricing is determined after intake review. No refunds once work begins.
              </p>
            </div>
            <Button variant="accent" onClick={generateServicesPricingPDF} style={{ alignSelf: 'flex-start', marginTop: 20 }}>
              Download Complete Services & Pricing Guide (PDF)
            </Button>
          </div>

          {/* Authentication Status & Client Tools */}
          {requestStatus.message && (
            <Alert type={requestStatus.type} style={{ marginTop: 24 }}>
              {requestStatus.message}
            </Alert>
          )}
          
          {isAuthenticated ? (
            <div style={{ marginTop: 32, padding: 24, backgroundColor: '#E8F4F8', borderRadius: 8, borderLeft: '4px solid #003366' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#003366' }}>
                    Welcome back, {userRole === 'client' ? 'Client' : userRole === 'preparer' ? 'Tax Preparer' : userRole === 'ero' ? 'ERO' : 'User'}! 
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#555' }}>
                    Role: <strong>{userRole?.toUpperCase()}</strong> | Permissions: {permissions.join(', ') || 'Standard Access'}
                  </p>
                </div>
                {selectedServices.length > 0 && (
                  <Button variant="accent" onClick={() => setShowRequestModal(true)}>
                    Review Request ({selectedServices.length})
                  </Button>
                )}
              </div>
              
              {/* Client Portal Tools */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
                {hasPermission('services:request') && (
                  <Card style={{ padding: 16, textAlign: 'center', cursor: 'pointer', backgroundColor: '#fff' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                    <strong>Request Services</strong>
                    <p style={{ fontSize: 12, margin: '4px 0 0 0', color: '#666' }}>Select services below</p>
                  </Card>
                )}
                <Card style={{ padding: 16, textAlign: 'center', cursor: 'pointer', backgroundColor: '#fff' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
                  <strong>Upload Documents</strong>
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleDocumentUpload}
                    style={{ fontSize: 11, marginTop: 8 }}
                  />
                </Card>
                {hasPermission('portal:access') && (
                  <Card style={{ padding: 16, textAlign: 'center', cursor: 'pointer', backgroundColor: '#fff' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                    <strong>Service History</strong>
                    <p style={{ fontSize: 12, margin: '4px 0 0 0', color: '#666' }}>{serviceHistory.length} requests</p>
                  </Card>
                )}
                {(userRole === 'preparer' || userRole === 'ero') && (
                  <Card style={{ padding: 16, textAlign: 'center', cursor: 'pointer', backgroundColor: '#fff' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
                    <strong>Manage Clients</strong>
                    <p style={{ fontSize: 12, margin: '4px 0 0 0', color: '#666' }}>View client requests</p>
                  </Card>
                )}
              </div>
              
              {documents.length > 0 && (
                <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff', borderRadius: 4 }}>
                  <strong style={{ fontSize: 14 }}>Uploaded Documents ({documents.length}):</strong>
                  <ul style={{ margin: '8px 0 0 0', padding: '0 0 0 20px', fontSize: 13 }}>
                    {documents.map((doc, idx) => (
                      <li key={idx}>{doc.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 32, padding: 24, backgroundColor: '#FFF8E1', borderRadius: 8, textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: '#003366' }}>🔐 Client Portal Access</h3>
              <p style={{ margin: '12px 0', color: '#555' }}>
                Log in to request services, upload documents, and track your service history.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <Button as={Link} to="/diy-efile" variant="accent">
                  Create Account
                </Button>
                <Button as={Link} to="/intake" variant="secondary">
                  Submit Intake Form
                </Button>
              </div>
            </div>
          )}

          {/* Service Request Modal */}
          {showRequestModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <Card style={{ 
                maxWidth: 600, 
                width: '90%', 
                maxHeight: '80vh', 
                overflow: 'auto',
                padding: 32 
              }}>
                <h2 style={{ margin: '0 0 16px 0', color: '#003366' }}>Service Request Summary</h2>
                
                {selectedServices.length === 0 ? (
                  <p style={{ color: '#666' }}>No services selected</p>
                ) : (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      {selectedServices.map((service) => (
                        <Card key={service.id} style={{ padding: 16, marginBottom: 12, backgroundColor: '#f9f9f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              {service.form && (
                                <span style={{ 
                                  fontSize: 11, 
                                  fontWeight: 'bold', 
                                  color: '#003366',
                                  backgroundColor: '#E8F4F8',
                                  padding: '2px 6px',
                                  borderRadius: 3,
                                  marginRight: 8
                                }}>
                                  {service.form}
                                </span>
                              )}
                              <strong style={{ fontSize: 14 }}>{service.name}</strong>
                              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#666' }}>{service.category}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', color: '#F3A006' }}>{service.price}</span>
                              <button 
                                onClick={() => handleRemoveService(service.id)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#E74C3C', 
                                  cursor: 'pointer',
                                  fontSize: 18
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    <div style={{ marginTop: 24, padding: 16, backgroundColor: '#E8F4F8', borderRadius: 4 }}>
                      <p style={{ margin: 0, fontSize: 14, color: '#555' }}>
                        <strong>Next Steps:</strong> Our team will review your request and contact you within 24 hours with a detailed quote and engagement letter.
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                      <Button variant="accent" onClick={handleSubmitRequest} style={{ flex: 1 }}>
                        Submit Request
                      </Button>
                      <Button variant="secondary" onClick={() => setShowRequestModal(false)} style={{ flex: 1 }}>
                        Continue Shopping
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </div>
          )}

          {/* Service Categories */}
          {serviceCategories.map((category, idx) => (
            <div key={idx} style={{ marginTop: 48, marginBottom: 32 }}>
              <h3 style={{ color: '#003366', marginBottom: 8 }}>{category.title}</h3>
              {category.description && (
                <p style={{ fontSize: 14, color: '#666', marginBottom: 20, fontStyle: 'italic' }}>
                  {category.description}
                </p>
              )}
              <div className="grid" style={{ display: "flex", gap: 16, flexWrap: "wrap", flexDirection: "column" }}>
                {category.services.map((service, sidx) => (
                  <Card key={sidx} style={{ padding: 20, borderLeft: '4px solid #F3A006' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        {service.form && (
                          <span style={{ 
                            fontSize: 12, 
                            fontWeight: 'bold', 
                            color: '#003366', 
                            backgroundColor: '#E8F4F8',
                            padding: '2px 8px',
                            borderRadius: 4,
                            marginRight: 8,
                            display: 'inline-block',
                            marginBottom: 6
                          }}>
                            {service.form}
                          </span>
                        )}
                        <h4 style={{ margin: 0, color: '#003366', fontSize: 16 }}>{service.name}</h4>
                        {service.description && (
                          <p style={{ margin: '8px 0 0 0', color: '#555', lineHeight: 1.5, fontSize: 14 }}>
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#F3A006', whiteSpace: 'nowrap' }}>
                          {service.price}
                        </span>
                        {isAuthenticated && hasPermission('services:request') && (
                          <Button 
                            variant="accent" 
                            onClick={() => handleServiceSelect(service, category)}
                            style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                          >
                            + Add to Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Ross Tax Academy Textbooks */}
          <div style={{ marginTop: 56, marginBottom: 32, paddingTop: 32, borderTop: '2px solid #e0e0e0' }}>
            <h3 style={{ color: '#003366', marginBottom: 12 }}>🎓 Ross Tax Academy – Required Course Materials</h3>
            <p style={{ fontSize: 15, color: '#555', marginBottom: 24, lineHeight: 1.6 }}>
              All Ross Tax Academy programs require the purchase of official proprietary textbooks developed exclusively for Ross Tax Academy curricula. These materials are mandatory and aligned with instructional content, assessments, and certification requirements.
            </p>
            <div className="grid" style={{ display: "flex", gap: 20, flexWrap: "wrap", flexDirection: "column" }}>
              {textbooks.map((textbook) => (
                <Card key={textbook.id} style={{ padding: 24, borderLeft: '4px solid #27AE60' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#003366' }}>{textbook.name}</h4>
                      {textbook.required && <span style={{ fontSize: 12, color: '#E74C3C', fontWeight: 'bold' }}>REQUIRED</span>}
                      {textbook.restricted && <span style={{ fontSize: 12, color: '#F3A006', fontWeight: 'bold' }}>INSTRUCTOR ONLY</span>}
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 'bold', color: '#27AE60', whiteSpace: 'nowrap', marginLeft: 16 }}>
                      {textbook.price}
                    </span>
                  </div>
                  <p style={{ margin: '12px 0 16px 0', color: '#555', lineHeight: 1.6 }}>
                    {textbook.description}
                  </p>
                  <Button 
                    variant="accent" 
                    style={{ padding: '8px 16px', fontSize: 14 }}
                    onClick={() => handleTextbookPurchase(textbook.id)}
                  >
                    Purchase Textbook
                  </Button>
                </Card>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 16, backgroundColor: '#F4F8FB', borderRadius: 6 }}>
              <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                <strong>📌 Important:</strong> Textbooks are separate from tuition unless stated otherwise. All textbook sales are non-refundable once accessed. Ross Tax Academy materials are proprietary educational content. Unauthorized reproduction or distribution is prohibited.
              </p>
            </div>
          </div>

          {/* Policies Section */}
          <div style={{ marginTop: 56, paddingTop: 32, borderTop: '2px solid #e0e0e0' }}>
            <h3 style={{ color: '#003366', marginBottom: 12 }}>⚖️ Important Service Policies & Disclosures</h3>
            <p style={{ fontSize: 15, color: '#555', marginBottom: 24, lineHeight: 1.6 }}>
              <strong>ROSS Tax & Bookkeeping operates on an application-only, retainer-forward model.</strong> We do not compete on price. We compete on expertise, protection, and long-term strategy.
            </p>
            <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>🚫 Non-Refundable Services</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  <b>All services are non-refundable.</b> Once work begins, fees cannot be refunded due to the nature of professional services and regulatory compliance. This includes tax preparation, bookkeeping, IRS resolution, and notary services.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>💳 Payment Required Before Delivery</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  <b>Full payment required before delivery.</b> No returns are filed, services delivered, or documents released until payment is received in full. All invoices are due within 30 days. Retainers auto-renew annually.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>📋 Client Responsibility</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  You must provide accurate, complete, and timely information. Ross Tax & Bookkeeping is not responsible for penalties or interest due to client omissions, errors, or late submissions.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>⚠️ Scope of Services</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  Ross Tax & Bookkeeping is not a law firm or CPA firm. We do not offer legal advice, representation, or formal CPA opinions. Consult a licensed attorney or CPA for legal matters.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>🔐 Data Protection & Privacy</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  All data is encrypted in transit and at rest. We comply with IRS Publication 1075, SOC2, and state privacy requirements. Your information is never shared without consent or legal requirement.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>📞 Audit Support Included</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  All returns include basic audit support for notices and correspondence related to our work. Extended representation and audit defense rates apply for IRS examinations.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>🎯 No Discounts Policy</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  <b>We do not discount professional services.</b> No price matching, no volume discounts, no "friend rates." Our pricing reflects expertise, risk management, and concierge-level service.
                </p>
              </Card>
              <Card style={{ padding: 20 }}>
                <h4 style={{ color: '#003366', marginTop: 0 }}>✅ Application Required</h4>
                <p style={{ fontSize: 14, color: '#555' }}>
                  <b>Approval-based onboarding.</b> Not all applications are accepted. Our application process ensures alignment and allows us to provide exceptional service without overextending capacity.
                </p>
              </Card>
            </div>
          </div>

          {/* Legal / Arbitration */}
          <div style={{ marginTop: 32, padding: 24, backgroundColor: '#F9F9F9', borderRadius: 6, borderLeft: '4px solid #003366' }}>
            <h3 style={{ color: '#003366', marginTop: 0 }}>⚔️ Legal & Client Protection</h3>
            <p style={{ color: '#555', lineHeight: 1.7 }}>
              All services are governed by Texas law and include a mandatory arbitration agreement. This protects both client and firm while ensuring professional standards. 
              Disputes are resolved through binding arbitration, not litigation. No class actions are permitted. By engaging our services, you agree to these terms.
            </p>
          </div>

          {/* CTA Section */}
          <div className="cta-row" style={{ marginTop: 48, textAlign: "center", padding: 32, backgroundColor: '#F4F8FB', borderRadius: 6 }}>
            <h3 style={{ marginTop: 0, color: '#003366' }}>Ready to Work With Us?</h3>
            <p style={{ fontSize: 16, color: '#555', marginBottom: 24 }}>
              Submit your intake form or contact us directly for a consultation.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button as={Link} to="/intake" style={{ minWidth: 200 }}>
                Submit Client Intake
              </Button>
              <Button variant="secondary" style={{ minWidth: 200 }}>
                📧 CondreR@outlook.com
              </Button>
              <Button variant="secondary" style={{ minWidth: 200 }}>
                📞 254-394-7438
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
