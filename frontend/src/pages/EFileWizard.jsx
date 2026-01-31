import React, { useState } from "react";
import Button from "../components/Button";

const steps = [
  "Welcome",
  "Filing Status",
  "Personal Info",
  "Income",
  "Deductions & Credits",
  "Review",
  "E-File"
];

export default function EFileWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    filingStatus: "Single",
    personal: {},
    income: {},
    deductions: {},
    review: {},
  });

  function next() { setStep(s => Math.min(s + 1, steps.length - 1)); }
  function prev() { setStep(s => Math.max(s - 1, 0)); }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 600, margin: "0 auto" }}>
        <div className="section-head">
          <h2>DIY E-File Wizard</h2>
          <p className="section-sub">State & Federal | Maximum Refund Guarantee | IRS Compliant</p>
        </div>
        <div style={{ margin: "24px 0" }}>
          <b>Step {step + 1} of {steps.length}:</b> {steps[step]}
        </div>
        {/* Step content (simplified for demo) */}
        {step === 0 && (
          <div>
            <p>Welcome! This wizard will guide you through your state and federal tax return. Click Next to begin.</p>
          </div>
        )}
        {step === 1 && (
          <div>
            <label>
              Filing Status:
              <select value={form.filingStatus} onChange={e => setForm(f => ({ ...f, filingStatus: e.target.value }))}>
                <option>Single</option>
                <option>Married Filing Jointly</option>
                <option>Married Filing Separately</option>
                <option>Head of Household</option>
                <option>Qualifying Widow(er)</option>
              </select>
            </label>
          </div>
        )}
        {step === 2 && (
          <div>
            <p>Personal Info (Name, SSN, Address, etc.)</p>
            {/* Add fields as needed */}
          </div>
        )}
        {step === 3 && (
          <div>
            <p>Income (W-2, 1099, etc.)</p>
            {/* Add fields as needed */}
          </div>
        )}
        {step === 4 && (
          <div>
            <p>Deductions & Credits</p>
            {/* Add fields as needed */}
          </div>
        )}
        {step === 5 && (
          <div>
            <p>Review your entries and check for errors or missing info.</p>
            {/* Add review logic */}
          </div>
        )}
        {step === 6 && (
          <div>
            <p>Ready to e-file! Your return will be validated and transmitted securely.</p>
            <Button style={{ marginTop: 16 }}>Transmit E-File</Button>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <Button onClick={prev} disabled={step === 0}>Back</Button>
          <Button onClick={next} disabled={step === steps.length - 1}>Next</Button>
        </div>
      </div>
    </section>
  );
}
