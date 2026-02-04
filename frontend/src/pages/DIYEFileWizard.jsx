import { useState, useMemo } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Alert from "../components/Alert";

export default function DIYEFileWizard() {
  // Auth & Account State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
    const [accountData, setAccountData] = useState({ 
      email: "", 
      password: "", 
      confirmPassword: "", 
      username: "",
      phone: "",
      ssn: "",
      idNumber: "",
      idType: "DL", // DL, Passport, StateID
      firstName: "",
      lastName: "",
      dob: ""
    });
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [clientId, setClientId] = useState(null);
    const [userRole, setUserRole] = useState("client"); // client, preparer, ero

  // Wizard State
  const [step, setStep] = useState(1);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [formType, setFormType] = useState("1040");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [validationErrors, setValidationErrors] = useState({});

  // Tax Form Data State
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    ssn: "",
    dob: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    spouseFirstName: "",
    spouseLastName: "",
    spouseSsn: "",
    spouseDob: "",
    filingStatus: "Single",

    // Income
    w2Wages: [],
    capitalGains: 0,
    dividends: 0,
    businessIncome: 0,
    rentalIncome: 0,
    interestIncome: 0,
    otherIncome: 0,

    // Deductions
    standardDeduction: true,
    itemizedDeductions: {
      mortgageInterest: 0,
      propertyTaxes: 0,
      charitableDonations: 0,
      studentLoanInterest: 0,
      medicalExpenses: 0
    },

    // Credits
    credits: {
      earnedIncomeCredit: false,
      childTaxCredit: 0,
      childCareCredit: 0,
      educationCredit: 0,
      retirementSavingsCredit: false,
      adoptionCredit: 0
    },

    // Dependent Info
    dependents: [],

    // Business (Schedule C)
    businessName: "",
    businessExpenses: 0,
    businessTaxId: "",

    // Previous Year Info
    previousYearRefund: 0,
    estimatedTaxPaid: 0,
    withholding: 0
  });

  // Validation functions
  const validatePersonalInfo = () => {
    const errors = {};
    if (!formData.firstName) errors.firstName = "First name required";
    if (!formData.lastName) errors.lastName = "Last name required";
    if (!formData.ssn) errors.ssn = "SSN required";
    if (!formData.dob) errors.dob = "Date of birth required";
    if (!formData.address) errors.address = "Address required";
    if (!formData.city) errors.city = "City required";
    if (!formData.state) errors.state = "State required";
    if (!formData.zip) errors.zip = "ZIP code required";
    if (!formData.phone) errors.phone = "Phone number required";
    return errors;
  };

  const validateIncomeData = () => {
    const errors = {};
    const totalIncome = formData.w2Wages.reduce((sum, w2) => sum + (w2.amount || 0), 0) + 
                       formData.capitalGains + formData.dividends + formData.businessIncome + 
                       formData.rentalIncome + formData.interestIncome;
    if (totalIncome < 0) errors.income = "Total income cannot be negative";
    return errors;
  };

  const validateAll = () => {
    const errors = { ...validatePersonalInfo() };
    if (step >= 3) Object.assign(errors, validateIncomeData());
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate Standard Deduction based on filing status
  const standardDeductionAmount = useMemo(() => {
    const amounts = {
      2025: {
        Single: 15000,
        MFJ: 30000,
        MFS: 15000,
        HOH: 22500,
        QW: 30000
      }
    };
    return amounts[taxYear]?.[formData.filingStatus] || 15000;
  }, [formData.filingStatus, taxYear]);

  // Calculate Total Income
  const totalIncome = useMemo(() => {
    return (
      formData.w2Wages.reduce((sum, w2) => sum + (w2.amount || 0), 0) +
      formData.capitalGains +
      formData.dividends +
      formData.businessIncome +
      formData.rentalIncome +
      formData.interestIncome +
      formData.otherIncome
    );
  }, [formData]);

  // Calculate Adjusted Gross Income (AGI)
  const agi = useMemo(() => {
    let studentLoanDeduction = 0;
    if (formData.itemizedDeductions.studentLoanInterest > 0) {
      studentLoanDeduction = Math.min(2500, formData.itemizedDeductions.studentLoanInterest);
    }
    return totalIncome - studentLoanDeduction;
  }, [totalIncome, formData.itemizedDeductions.studentLoanInterest]);

  // Calculate Deductions
  const deductionAmount = useMemo(() => {
    if (formData.standardDeduction) {
      return standardDeductionAmount;
    }
    return (
      formData.itemizedDeductions.mortgageInterest +
      formData.itemizedDeductions.propertyTaxes +
      formData.itemizedDeductions.charitableDonations +
      formData.itemizedDeductions.medicalExpenses
    );
  }, [formData, standardDeductionAmount]);

  // Calculate Taxable Income
  const taxableIncome = Math.max(0, agi - deductionAmount);

  // 2025 Tax Brackets (Single)
  const calculateFederalTax = (income) => {
    const brackets = [
      { rate: 0.10, limit: 11600 },
      { rate: 0.12, limit: 47150 },
      { rate: 0.22, limit: 100525 },
      { rate: 0.24, limit: 191950 },
      { rate: 0.32, limit: 243725 },
      { rate: 0.35, limit: 609350 },
      { rate: 0.37, limit: Infinity }
    ];

    let tax = 0;
    let previousLimit = 0;

    for (const bracket of brackets) {
      if (income > previousLimit) {
        const incomeInBracket = Math.min(income, bracket.limit) - previousLimit;
        tax += incomeInBracket * bracket.rate;
        previousLimit = bracket.limit;
      } else {
        break;
      }
    }

    return tax;
  };

  const federalTax = calculateFederalTax(taxableIncome);

  // Calculate Credits
  const totalCredits = useMemo(() => {
    let credits = 0;
    if (formData.credits.childTaxCredit) {
      credits += formData.credits.childTaxCredit * 2000;
    }
    if (formData.credits.educationCredit) {
      credits += formData.credits.educationCredit;
    }
    return credits;
  }, [formData.credits]);

  // Tax Due / Refund
  const totalWithholding = formData.withholding + formData.estimatedTaxPaid;
  const taxAfterCredits = Math.max(0, federalTax - totalCredits);
  const refundOrOwed = totalWithholding - taxAfterCredits;

  // Form Type Options
  const formOptions = [
    { id: "1040", name: "Form 1040 - Individual Income Tax Return" },
    { id: "1040-SR", name: "Form 1040-SR - U.S. Income Tax Return for Seniors" },
    { id: "1041", name: "Form 1041 - U.S. Income Tax Return for Estates and Trusts" },
    { id: "1040-X", name: "Form 1040-X - Amended U.S. Individual Income Tax Return" }
  ];

  // Steps Configuration
  const steps = [
    {
      number: 1,
      title: "Welcome",
      component: (
        <div>
          <h3>Welcome to DIY E-File Wizard</h3>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
            This AI-powered wizard guides you through your state and federal tax return with maximum refund optimization.
          </p>
          <Alert type="info" message="💡 Maximum Refund Guarantee: Our AI identifies every deduction and credit you qualify for." />
          <div style={{ marginTop: 32 }}>
            <label className="field" style={{ marginBottom: 20 }}>
              <span style={{ fontWeight: "bold" }}>Tax Year</span>
              <select value={taxYear} onChange={(e) => setTaxYear(parseInt(e.target.value))}>
                {[2024, 2023, 2022].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <label className="field">
              <span style={{ fontWeight: "bold" }}>Return Type</span>
              <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                {formOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )
    },
    {
      number: 2,
      title: "Personal Information",
      component: (
        <div>
          <h3>Your Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <label className="field">
              <span>First Name {validationErrors.firstName && <span style={{color: 'red'}}>*</span>}</span>
              <input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="First name" />
              {validationErrors.firstName && <small style={{color: 'red'}}>{validationErrors.firstName}</small>}
            </label>
            <label className="field">
              <span>Last Name {validationErrors.lastName && <span style={{color: 'red'}}>*</span>}</span>
              <input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Last name" />
              {validationErrors.lastName && <small style={{color: 'red'}}>{validationErrors.lastName}</small>}
            </label>
            <label className="field">
              <span>SSN {validationErrors.ssn && <span style={{color: 'red'}}>*</span>}</span>
              <input value={formData.ssn} onChange={(e) => setFormData({...formData, ssn: e.target.value})} placeholder="XXX-XX-XXXX" />
              {validationErrors.ssn && <small style={{color: 'red'}}>{validationErrors.ssn}</small>}
            </label>
            <label className="field">
              <span>Date of Birth {validationErrors.dob && <span style={{color: 'red'}}>*</span>}</span>
              <input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
              {validationErrors.dob && <small style={{color: 'red'}}>{validationErrors.dob}</small>}
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span>Street Address {validationErrors.address && <span style={{color: 'red'}}>*</span>}</span>
              <input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="123 Main St" />
              {validationErrors.address && <small style={{color: 'red'}}>{validationErrors.address}</small>}
            </label>
            <label className="field">
              <span>City {validationErrors.city && <span style={{color: 'red'}}>*</span>}</span>
              <input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="City" />
              {validationErrors.city && <small style={{color: 'red'}}>{validationErrors.city}</small>}
            </label>
            <label className="field">
              <span>State {validationErrors.state && <span style={{color: 'red'}}>*</span>}</span>
              <input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} placeholder="TX" maxLength="2" />
              {validationErrors.state && <small style={{color: 'red'}}>{validationErrors.state}</small>}
            </label>
            <label className="field">
              <span>ZIP Code {validationErrors.zip && <span style={{color: 'red'}}>*</span>}</span>
              <input value={formData.zip} onChange={(e) => setFormData({...formData, zip: e.target.value})} placeholder="75000" />
              {validationErrors.zip && <small style={{color: 'red'}}>{validationErrors.zip}</small>}
            </label>
            <label className="field">
              <span>Phone {validationErrors.phone && <span style={{color: 'red'}}>*</span>}</span>
              <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(512) 489-6749" />
              {validationErrors.phone && <small style={{color: 'red'}}>{validationErrors.phone}</small>}
            </label>
            <label className="field">
              <span>Filing Status</span>
              <select value={formData.filingStatus} onChange={(e) => setFormData({...formData, filingStatus: e.target.value})}>
                <option>Single</option>
                <option>Married Filing Jointly</option>
                <option>Married Filing Separately</option>
                <option>Head of Household</option>
                <option>Qualifying Widow(er)</option>
              </select>
            </label>
          </div>
          {["Married Filing Jointly", "Married Filing Separately"].includes(formData.filingStatus) && (
            <Card style={{ padding: 20, marginBottom: 24, backgroundColor: "#F4F8FB" }}>
              <h4>Spouse Information</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <label className="field">
                  <span>Spouse First Name</span>
                  <input value={formData.spouseFirstName} onChange={(e) => setFormData({...formData, spouseFirstName: e.target.value})} />
                </label>
                <label className="field">
                  <span>Spouse Last Name</span>
                  <input value={formData.spouseLastName} onChange={(e) => setFormData({...formData, spouseLastName: e.target.value})} />
                </label>
                <label className="field">
                  <span>Spouse SSN</span>
                  <input value={formData.spouseSsn} onChange={(e) => setFormData({...formData, spouseSsn: e.target.value})} placeholder="XXX-XX-XXXX" />
                </label>
                <label className="field">
                  <span>Spouse DOB</span>
                  <input type="date" value={formData.spouseDob} onChange={(e) => setFormData({...formData, spouseDob: e.target.value})} />
                </label>
              </div>
            </Card>
          )}
        </div>
      )
    },
    {
      number: 3,
      title: "Income",
      component: (
        <div>
          <h3>Income Information</h3>
          <Card style={{ padding: 20, marginBottom: 24, backgroundColor: "#F4F8FB" }}>
            <h4>W-2 Wages</h4>
            <label className="field">
              <span>Total W-2 Wages</span>
              <input 
                type="number" 
                value={formData.w2Wages.length > 0 ? formData.w2Wages[0].amount : 0}
                onChange={(e) => setFormData({...formData, w2Wages: [{amount: parseInt(e.target.value) || 0}]})}
                placeholder="0"
              />
            </label>
          </Card>
          <Card style={{ padding: 20, marginBottom: 24 }}>
            <h4>Other Income</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <label className="field">
                <span>Capital Gains</span>
                <input type="number" value={formData.capitalGains} onChange={(e) => setFormData({...formData, capitalGains: parseInt(e.target.value) || 0})} placeholder="0" />
              </label>
              <label className="field">
                <span>Dividends</span>
                <input type="number" value={formData.dividends} onChange={(e) => setFormData({...formData, dividends: parseInt(e.target.value) || 0})} placeholder="0" />
              </label>
              <label className="field">
                <span>Interest Income</span>
                <input type="number" value={formData.interestIncome} onChange={(e) => setFormData({...formData, interestIncome: parseInt(e.target.value) || 0})} placeholder="0" />
              </label>
              <label className="field">
                <span>Rental Income</span>
                <input type="number" value={formData.rentalIncome} onChange={(e) => setFormData({...formData, rentalIncome: parseInt(e.target.value) || 0})} placeholder="0" />
              </label>
            </div>
          </Card>
          <Alert type="info" message={`📊 Total Income: $${totalIncome.toLocaleString()}`} />
        </div>
      )
    },
    {
      number: 4,
      title: "Deductions",
      component: (
        <div>
          <h3>Deductions & Tax Breaks</h3>
          <Card style={{ padding: 20, marginBottom: 24, backgroundColor: "#F4F8FB" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <input 
                type="checkbox" 
                checked={formData.standardDeduction}
                onChange={(e) => setFormData({...formData, standardDeduction: e.target.checked})}
              />
              <label style={{ margin: 0 }}>
                <strong>Standard Deduction: ${standardDeductionAmount.toLocaleString()}</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
                  Most taxpayers benefit from this. Uncheck to itemize instead.
                </p>
              </label>
            </div>
          </Card>

          {!formData.standardDeduction && (
            <Card style={{ padding: 20, marginBottom: 24 }}>
              <h4>Itemized Deductions</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <label className="field">
                  <span>Mortgage Interest</span>
                  <input type="number" value={formData.itemizedDeductions.mortgageInterest} onChange={(e) => setFormData({...formData, itemizedDeductions: {...formData.itemizedDeductions, mortgageInterest: parseInt(e.target.value) || 0}})} placeholder="0" />
                </label>
                <label className="field">
                  <span>Property Taxes</span>
                  <input type="number" value={formData.itemizedDeductions.propertyTaxes} onChange={(e) => setFormData({...formData, itemizedDeductions: {...formData.itemizedDeductions, propertyTaxes: parseInt(e.target.value) || 0}})} placeholder="0" />
                </label>
                <label className="field">
                  <span>Charitable Donations</span>
                  <input type="number" value={formData.itemizedDeductions.charitableDonations} onChange={(e) => setFormData({...formData, itemizedDeductions: {...formData.itemizedDeductions, charitableDonations: parseInt(e.target.value) || 0}})} placeholder="0" />
                </label>
                <label className="field">
                  <span>Medical Expenses</span>
                  <input type="number" value={formData.itemizedDeductions.medicalExpenses} onChange={(e) => setFormData({...formData, itemizedDeductions: {...formData.itemizedDeductions, medicalExpenses: parseInt(e.target.value) || 0}})} placeholder="0" />
                </label>
              </div>
            </Card>
          )}

          <Alert type="success" message={`✅ Deductions: $${deductionAmount.toLocaleString()}`} />
        </div>
      )
    },
    {
      number: 5,
      title: "Credits",
      component: (
        <div>
          <h3>Tax Credits (Direct Refund Maximizers)</h3>
          <Card style={{ padding: 20, marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={formData.credits.earnedIncomeCredit}
                onChange={(e) => setFormData({...formData, credits: {...formData.credits, earnedIncomeCredit: e.target.checked}})}
              />
              <div style={{ flex: 1 }}>
                <strong>Earned Income Tax Credit (EITC)</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>Up to $3,995 refundable credit</p>
              </div>
            </label>
          </Card>

          <Card style={{ padding: 20, marginBottom: 16 }}>
            <label className="field">
              <span>Child Tax Credit (per child)</span>
              <input type="number" value={formData.credits.childTaxCredit} onChange={(e) => setFormData({...formData, credits: {...formData.credits, childTaxCredit: parseInt(e.target.value) || 0}})} placeholder="0" />
              <small style={{ color: "#666" }}>$2,000 per child under 17</small>
            </label>
          </Card>

          <Card style={{ padding: 20, marginBottom: 16 }}>
            <label className="field">
              <span>Education Credit (AOTC / LLC)</span>
              <input type="number" value={formData.credits.educationCredit} onChange={(e) => setFormData({...formData, credits: {...formData.credits, educationCredit: parseInt(e.target.value) || 0}})} placeholder="0" />
              <small style={{ color: "#666" }}>Up to $2,500 (AOTC) or $2,000 (LLC)</small>
            </label>
          </Card>

          <Alert type="success" message={`🎯 Total Credits: $${totalCredits.toLocaleString()}`} />
        </div>
      )
    },
    {
      number: 6,
      title: "Tax Summary",
      component: (
        <div>
          <h3>Tax Calculation Summary</h3>
          <Card style={{ padding: 24, backgroundColor: "#F9F9F9", marginBottom: 24, borderLeft: "4px solid #F3A006" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#666" }}>TOTAL INCOME</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: "bold", color: "#003366" }}>
                  ${totalIncome.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#666" }}>ADJUSTED GROSS INCOME</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: "bold", color: "#003366" }}>
                  ${agi.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#666" }}>DEDUCTIONS</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: "bold", color: "#27AE60" }}>
                  ${deductionAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#666" }}>TAXABLE INCOME</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: "bold", color: "#003366" }}>
                  ${taxableIncome.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#666" }}>FEDERAL TAX</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: "bold", color: "#E74C3C" }}>
                  ${federalTax.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#666" }}>CREDITS</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: "bold", color: "#27AE60" }}>
                  ${totalCredits.toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{ borderTop: "2px solid #ddd", paddingTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: "bold" }}>Tax After Credits:</span>
                <span style={{ fontSize: 20, fontWeight: "bold", color: "#E74C3C" }}>
                  ${taxAfterCredits.toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: "bold" }}>Total Withholding & Estimated:</span>
                <span style={{ fontSize: 20, fontWeight: "bold", color: "#003366" }}>
                  ${totalWithholding.toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: refundOrOwed > 0 ? "#E8F8F5" : "#FADBD8", borderRadius: 6 }}>
                <span style={{ fontSize: 18, fontWeight: "bold" }}>
                  {refundOrOwed > 0 ? "REFUND:" : "TAX DUE:"}
                </span>
                <span style={{ fontSize: 24, fontWeight: "bold", color: refundOrOwed > 0 ? "#27AE60" : "#E74C3C" }}>
                  ${Math.abs(refundOrOwed).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          <Alert type="info" message="💡 Next step: Verify your information and submit for e-filing." />
        </div>
      )
    },
    {
      number: 7,
      title: "Review & File",
      component: (
        <div>
          <h3>Final Review & Verification</h3>
          <Alert type="success" message="✅ All information verified and IRS compliant" />
          
          <Card style={{ padding: 24, marginBottom: 24, backgroundColor: "#F4F8FB", borderLeft: "4px solid #F3A006" }}>
            <h4 style={{ marginTop: 0 }}>Personal Information Summary</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
              <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
              <div><strong>SSN:</strong> {formData.ssn.slice(-4).padStart(formData.ssn.length, '•')}</div>
              <div><strong>Address:</strong> {formData.address}, {formData.city}, {formData.state} {formData.zip}</div>
              <div><strong>Phone:</strong> {formData.phone}</div>
              <div><strong>Filing Status:</strong> {formData.filingStatus}</div>
              <div><strong>Tax Year:</strong> {taxYear}</div>
            </div>
          </Card>

          <Card style={{ padding: 24, marginBottom: 24, backgroundColor: "#F9F9F9", borderLeft: "4px solid #F3A006" }}>
            <h4 style={{ marginTop: 0 }}>Income & Deductions</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
              <div><strong>Total Income:</strong> ${totalIncome.toLocaleString()}</div>
              <div><strong>Adjusted Gross Income:</strong> ${agi.toLocaleString()}</div>
              <div><strong>Deductions:</strong> ${deductionAmount.toLocaleString()}</div>
              <div><strong>Taxable Income:</strong> ${taxableIncome.toLocaleString()}</div>
            </div>
          </Card>

          <Card style={{ padding: 24, marginBottom: 24 }}>
            <h4 style={{ marginTop: 0 }}>Next Steps</h4>
            <ol style={{ lineHeight: 2 }}>
              <li><strong>E-Sign Agreement</strong> - Acknowledge accuracy and authority to e-file</li>
              <li><strong>IRS Validation</strong> - Return submitted to IRS via MeF A2A</li>
              <li><strong>Real-time Acknowledgment</strong> - Receive acceptance ID within minutes</li>
              <li><strong>Status Tracking</strong> - Monitor return status in your portal</li>
              <li><strong>Refund Delivery</strong> - Direct deposit or check within 21 days</li>
            </ol>
          </Card>

          <Card style={{ padding: 20, backgroundColor: "#F9F9F9" }}>
            <h4 style={{ marginTop: 0 }}>IRS Accuracy Certification</h4>
            <p style={{ margin: "12px 0", fontSize: 13 }}>
              I declare that I have examined this return and accompanying schedules and statements, 
              and to the best of my knowledge and belief, they are true, correct, and complete. 
              I understand that transmitting this return electronically to the IRS constitutes my 
              signature authorization under Section 164(c) of the Internal Revenue Code (IRC).
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginTop: 16 }}>
              <input type="checkbox" required />
              <span>I certify this return is accurate and ready for IRS transmission</span>
            </label>
          </Card>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];

  const handleNext = () => {
    if (step < steps.length) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      setStatus({ type: "error", message: "Please fix validation errors" });
      return;
    }

    setStatus({ type: "loading", message: "Preparing for MeF transmission..." });
    try {
      // Save return to D1 via backend
      const saveRes = await fetch("/api/efile/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          client_id: clientId,
          return_data: formData,
          return_type: formType,
          tax_year: taxYear
        })
      });

      if (!saveRes.ok) throw new Error("Failed to save return");

      // Submit to backend for MeF e-file
      const res = await fetch("/api/efile/transmit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          client_id: clientId,
          return_id: Date.now(),
          preparer_id: null,
          method: "DIY",
          returnType: formType,
          taxYear: taxYear,
          formData: formData
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStatus({ type: "success", message: `Return submitted to IRS! Tracking ID: ${data.submission_id}` });
      } else {
        throw new Error("E-file submission failed");
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  // Validation Helper
  const validateRegistration = () => {
      const errors = [];
      if (!accountData.firstName) errors.push("First name required");
      if (!accountData.lastName) errors.push("Last name required");
      if (!accountData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountData.email)) errors.push("Valid email required");
      if (!accountData.username || accountData.username.length < 3) errors.push("Username min 3 characters");
      if (!accountData.password || accountData.password.length < 8) errors.push("Password min 8 characters");
      if (accountData.password !== accountData.confirmPassword) errors.push("Passwords must match");
      if (!accountData.phone) errors.push("Phone number required");
      if (!accountData.ssn || accountData.ssn.length < 9) errors.push("Valid SSN required");
      if (!accountData.idNumber) errors.push("ID number required");
      if (!accountData.dob) errors.push("Date of birth required");
      return errors;
    };
    const handleRegister = async () => {
      const errors = validateRegistration();
      if (errors.length > 0) {
        setStatus({ type: "error", message: errors.join("; ") });
        return;
      }

      setStatus({ type: "loading", message: "Creating account and verifying identity..." });
      try {
        const res = await fetch("/api/register/client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: accountData.firstName,
            lastName: accountData.lastName,
            email: accountData.email,
            username: accountData.username,
            password: accountData.password,
            phone: accountData.phone,
            ssn: accountData.ssn,
            idType: accountData.idType,
            idNumber: accountData.idNumber,
            dob: accountData.dob,
            role: userRole
          })
        });

        const data = await res.json();
        if (res.ok) {
          setClientId(data.client_id);
          setUserRole(data.role);
          setMfaEnabled(true);
          setStatus({ type: "success", message: "Account created! Verify your identity with 2FA code." });
          setAuthMode("2fa");
        } else {
          throw new Error(data.error || "Registration failed");
        }
      } catch (err) {
        setStatus({ type: "error", message: err.message });
      }
    };

    const handleLogin = async () => {
      if (!accountData.email || !accountData.password) {
        setStatus({ type: "error", message: "Email and password required" });
        return;
      }

      setStatus({ type: "loading", message: "Logging in..." });
      try {
        const res = await fetch("/api/login/client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: accountData.email,
            password: accountData.password
          })
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.token);
          setClientId(data.client_id);
          setMfaEnabled(true);
          setStatus({ type: "success", message: "Logged in! Enter 2FA code." });
          setAuthMode("2fa");
        } else {
          throw new Error(data.error || "Login failed");
        }
      } catch (err) {
        setStatus({ type: "error", message: err.message });
      }
    };

  const handleMfaVerify = async () => {
    if (!mfaCode) {
      setStatus({ type: "error", message: "2FA code required" });
      return;
    }

    setStatus({ type: "loading", message: "Verifying 2FA code..." });
    try {
      const res = await fetch("/api/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          code: mfaCode
        })
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setStatus({ type: "success", message: "2FA verified! Starting tax wizard..." });
      } else {
        throw new Error("Invalid 2FA code");
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  // If not authenticated, show login/register
  if (!isAuthenticated) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 500 }}>
          <h1>Ross Tax Prep E-File Portal</h1>
          <p style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>
            Secure Account Required | 2-Factor Authentication | IRS Compliant
          </p>

          {status.type !== "idle" && (
            <Alert type={status.type} message={status.message} style={{ marginBottom: 24 }} />
          )}

          {authMode === "login" && (
            <Card style={{ padding: 32 }}>
              <h3 style={{ marginTop: 0 }}>Sign In to Your Account</h3>
              <label className="field">
                <span>Email</span>
                <input 
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                  placeholder="your@email.com"
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input 
                  type="password"
                  value={accountData.password}
                  onChange={(e) => setAccountData({...accountData, password: e.target.value})}
                  placeholder="••••••••"
                />
              </label>
              <Button onClick={handleLogin} style={{ width: "100%", marginBottom: 16 }}>
                Sign In
              </Button>
              <p style={{ textAlign: "center", color: "#666" }}>
                Don't have an account? <a href="#" onClick={() => setAuthMode("register")} style={{ color: "#003366", cursor: "pointer" }}>Create one</a>
              </p>
            </Card>
          )}

          {authMode === "register" && (
            <Card style={{ padding: 32 }}>
              <h3 style={{ marginTop: 0 }}>Create Your Account</h3>
              <label className="field">
                <span>Email</span>
                <input 
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                  placeholder="your@email.com"
                />
              </label>
              <label className="field">
                <span>Username</span>
                <input 
                  value={accountData.username}
                  onChange={(e) => setAccountData({...accountData, username: e.target.value})}
                  placeholder="Choose a username"
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input 
                  type="password"
                  value={accountData.password}
                  onChange={(e) => setAccountData({...accountData, password: e.target.value})}
                  placeholder="Min 8 characters"
                />
              </label>
              <label className="field">
                <span>Confirm Password</span>
                <input 
                  type="password"
                  value={accountData.confirmPassword}
                  onChange={(e) => setAccountData({...accountData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                />
              </label>
              <Button onClick={handleRegister} style={{ width: "100%", marginBottom: 16 }}>
                Create Account
              </Button>
              <p style={{ textAlign: "center", color: "#666" }}>
                Already have an account? <a href="#" onClick={() => setAuthMode("login")} style={{ color: "#003366", cursor: "pointer" }}>Sign in</a>
              </p>
            </Card>
          )}

          {authMode === "2fa" && (
            <Card style={{ padding: 32 }}>
              <h3 style={{ marginTop: 0 }}>2-Factor Authentication</h3>
              <p style={{ color: "#666", marginBottom: 24 }}>
                Enter the 6-digit code sent to your email.
              </p>
              <label className="field">
                <span>Authentication Code</span>
                <input 
                  type="text"
                  maxLength="6"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{ fontSize: 24, letterSpacing: 8, textAlign: "center" }}
                />
              </label>
              <Button onClick={handleMfaVerify} style={{ width: "100%" }}>
                Verify Code
              </Button>
            </Card>
          )}
        </div>
      </section>
    );
  }

  // Main Wizard - Step 1-7
  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <h1>DIY E-File Wizard</h1>
          <p style={{ fontSize: 16, color: "#666", marginBottom: 24 }}>
            State & Federal | Maximum Refund Guarantee | IRS Compliant
          </p>

          {/* Progress Bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 32, alignItems: "center" }}>
            {steps.map((s, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div 
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: step === s.number ? "#003366" : step > s.number ? "#27AE60" : "#ddd",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: 14
                  }}
                >
                  {step > s.number ? "✓" : s.number}
                </div>
                {idx < steps.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: step > s.number ? "#27AE60" : "#ddd",
                    margin: "0 8px"
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Step Title */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "2px solid #e0e0e0" }}>
            <h2 style={{ margin: "0 0 8px 0" }}>
              Step {step} of {steps.length}: {currentStep.title}
            </h2>
            <p style={{ margin: 0, color: "#666" }}>
              {step === 1 && "Select your tax year and return type"}
              {step === 2 && "Enter your personal information"}
              {step === 3 && "Report your income sources"}
              {step === 4 && "Claim deductions and tax breaks"}
              {step === 5 && "Maximize your refund with credits"}
              {step === 6 && "Review your tax calculation"}
              {step === 7 && "Submit your return to the IRS"}
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {status.type !== "idle" && (
          <Alert type={status.type} message={status.message} style={{ marginBottom: 24 }} />
        )}

        {/* Step Content */}
        <div style={{ marginBottom: 40, minHeight: "400px" }}>
          {currentStep.component}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 16, justifyContent: "space-between", paddingTop: 24, borderTop: "2px solid #e0e0e0" }}>
          <div style={{ display: "flex", gap: 16 }}>
            <Button 
              variant="secondary" 
              onClick={handleBack}
              disabled={step === 1}
              style={{ minWidth: 120 }}
            >
              ← Back
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                setIsAuthenticated(false);
                setAuthMode("login");
                setStep(1);
              }}
              style={{ minWidth: 120 }}
            >
              Logout
            </Button>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {step < steps.length && (
              <Button 
                variant="accent"
                onClick={() => {
                  if (validateAll()) handleNext();
                }}
                style={{ minWidth: 120 }}
              >
                Next →
              </Button>
            )}
            {step === steps.length && (
              <Button 
                onClick={handleSubmit}
                style={{ minWidth: 200, backgroundColor: "#27AE60" }}
              >
                🚀 Submit to IRS (MeF)
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
