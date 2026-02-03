import { useState, useMemo } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Alert from "../components/Alert";
import { calculateInvoiceTotal, PRICING } from "../utils/pricing";
import { PAYMENT_METHODS, calculatePaymentWithFees } from "../utils/paymentGateway";

export default function Invoice() {
  const [invoiceData, setInvoiceData] = useState({
    baseForm: "1040",
    dependents: 1,
    w2Count: 1,
    additionalForms: [],
    bankProducts: [],
    applyRetentionFee: true,
    includeTransmissionFee: true,
    includeAdminFee: true,
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("stripe");
  const [step, setStep] = useState(1);

  // Calculate invoice total
  const invoiceTotal = useMemo(() => {
    return calculateInvoiceTotal(invoiceData);
  }, [invoiceData]);

  // Calculate payment with fees
  const paymentTotal = useMemo(() => {
    return calculatePaymentWithFees(invoiceTotal.total, selectedPaymentMethod);
  }, [invoiceTotal.total, selectedPaymentMethod]);

  const handleFormChange = (field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleAdditionalForm = (form) => {
    setInvoiceData(prev => ({
      ...prev,
      additionalForms: prev.additionalForms.includes(form)
        ? prev.additionalForms.filter(f => f !== form)
        : [...prev.additionalForms, form]
    }));
  };

  const toggleBankProduct = (product) => {
    setInvoiceData(prev => ({
      ...prev,
      bankProducts: prev.bankProducts.includes(product)
        ? prev.bankProducts.filter(p => p !== product)
        : [...prev.bankProducts, product]
    }));
  };

  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <h1>Invoice Calculator & Payment</h1>
          <p style={{ fontSize: 16, color: "#666", marginBottom: 24 }}>
            Build your tax service invoice and select your payment method
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
          {/* Left: Service Selection */}
          <div>
            <Card style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ marginTop: 0 }}>1. Select Return Type</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(PRICING.BASE_RETURN).map(([formKey, price]) => (
                  <label key={formKey} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="baseForm"
                      value={formKey}
                      checked={invoiceData.baseForm === formKey}
                      onChange={(e) => handleFormChange("baseForm", e.target.value)}
                    />
                    <span>
                      <strong>{formKey}</strong> - ${price.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </Card>

            <Card style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ marginTop: 0 }}>2. Income Sources</h3>
              <label className="field" style={{ marginBottom: 16 }}>
                <span>Number of W-2s</span>
                <input
                  type="number"
                  min="1"
                  value={invoiceData.w2Count}
                  onChange={(e) => handleFormChange("w2Count", parseInt(e.target.value))}
                />
                <small style={{ color: "#666" }}>Additional W-2s: ${((invoiceData.w2Count - 1) * PRICING.ADDITIONAL_FORM_FEE).toFixed(2)}</small>
              </label>

              <label className="field">
                <span>Number of Dependents</span>
                <input
                  type="number"
                  min="0"
                  value={invoiceData.dependents}
                  onChange={(e) => handleFormChange("dependents", parseInt(e.target.value))}
                />
                <small style={{ color: "#666" }}>Additional dependents: ${((invoiceData.dependents - 1) * 25).toFixed(2)}</small>
              </label>
            </Card>

            <Card style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ marginTop: 0 }}>3. Additional Forms</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(PRICING.ADDONS).map(([formKey, price]) => (
                  <label key={formKey} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={invoiceData.additionalForms.includes(formKey)}
                      onChange={() => toggleAdditionalForm(formKey)}
                    />
                    <span>
                      {formKey.replace(/_/g, " ")} - ${price.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </Card>

            <Card style={{ padding: 24 }}>
              <h3 style={{ marginTop: 0 }}>4. Bank Products & Services</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(PRICING.BANK_PRODUCTS)
                  .filter(([key]) => key !== "MAX_TOTAL")
                  .map(([productKey, price]) => (
                    <label key={productKey} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={invoiceData.bankProducts.includes(productKey)}
                        onChange={() => toggleBankProduct(productKey)}
                      />
                      <span>
                        {productKey.replace(/_/g, " ")} - ${price.toFixed(2)}
                      </span>
                    </label>
                  ))}
              </div>
              <small style={{ color: "#E74C3C", marginTop: 12, display: "block" }}>
                ⚠️ Bank product fees capped at ${PRICING.BANK_PRODUCTS.MAX_TOTAL.toFixed(2)}
              </small>
            </Card>
          </div>

          {/* Right: Invoice Summary */}
          <div>
            <Card style={{ padding: 24, backgroundColor: "#F4F8FB", position: "sticky", top: 20 }}>
              <h3 style={{ marginTop: 0, color: "#003366" }}>Invoice Summary</h3>
              
              <div style={{ borderBottom: "2px solid #ddd", paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                  <span>Base Return ({invoiceData.baseForm})</span>
                  <strong>${invoiceTotal.basePrice.toFixed(2)}</strong>
                </div>

                {invoiceTotal.additionalForms > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                    <span>Additional W-2s ({invoiceData.w2Count - 1})</span>
                    <strong>${invoiceTotal.additionalForms.toFixed(2)}</strong>
                  </div>
                )}

                {invoiceTotal.additionalDependents > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                    <span>Additional Dependents</span>
                    <strong>${invoiceTotal.additionalDependents.toFixed(2)}</strong>
                  </div>
                )}

                {invoiceTotal.addOns > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                    <span>Add-On Forms</span>
                    <strong>${invoiceTotal.addOns.toFixed(2)}</strong>
                  </div>
                )}

                {invoiceTotal.bankProducts > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                    <span>Bank Products</span>
                    <strong>${invoiceTotal.bankProducts.toFixed(2)}</strong>
                  </div>
                )}

                {invoiceTotal.transmissionFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                    <span>IRS Transmission Fee</span>
                    <strong>${invoiceTotal.transmissionFee.toFixed(2)}</strong>
                  </div>
                )}

                {invoiceTotal.adminFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                    <span>Admin Fee</span>
                    <strong>${invoiceTotal.adminFee.toFixed(2)}</strong>
                  </div>
                )}

                {invoiceTotal.retentionFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                    <span>7-Year Retention Fee</span>
                    <strong>${invoiceTotal.retentionFee.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: "white", padding: 12, borderRadius: 6, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>Subtotal</span>
                  <strong>${invoiceTotal.subtotal.toFixed(2)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 14 }}>Sales Tax (8.9%)</span>
                  <strong>${invoiceTotal.salesTax.toFixed(2)}</strong>
                </div>
                <div style={{ borderTop: "2px solid #ddd", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 18, fontWeight: "bold" }}>Service Total</span>
                  <strong style={{ fontSize: 20, color: "#003366" }}>${invoiceTotal.total.toFixed(2)}</strong>
                </div>
              </div>

              <div style={{ backgroundColor: "#E8F8F5", padding: 12, borderRadius: 6 }}>
                <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "#666" }}>
                  <strong>Selected Payment Method:</strong> {PAYMENT_METHODS[selectedPaymentMethod.toUpperCase()]?.name}
                </p>
                {paymentTotal.fee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span>Payment Processing Fee</span>
                    <strong>${paymentTotal.fee.toFixed(2)}</strong>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: "bold", color: "#27AE60" }}>
                  <span>Total Due</span>
                  <span>${paymentTotal.total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Payment Method Selection */}
        <Card style={{ padding: 24, marginBottom: 32 }}>
          <h3 style={{ marginTop: 0 }}>5. Select Payment Method</h3>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Choose how you'd like to pay. ACH, EFT, and Zelle are free. Credit cards have processing fees.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {Object.entries(PAYMENT_METHODS).map(([methodKey, method]) => (
              <label
                key={methodKey}
                style={{
                  border: selectedPaymentMethod === methodKey ? "2px solid #003366" : "2px solid #ddd",
                  borderRadius: 8,
                  padding: 16,
                  cursor: "pointer",
                  backgroundColor: selectedPaymentMethod === methodKey ? "#F4F8FB" : "white",
                  transition: "all 0.2s ease"
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={methodKey}
                  checked={selectedPaymentMethod === methodKey}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                <span style={{ fontSize: 20 }}>{method.icon}</span>
                <div style={{ marginTop: 8 }}>
                  <strong>{method.name}</strong>
                  <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#666" }}>
                    {method.fee === 0 ? "Free" : `Fee: ${(method.fee * 100).toFixed(1)}%`}
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#999" }}>
                    {method.processingTime}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Button variant="secondary" style={{ minWidth: 200 }}>
            Save Invoice Draft
          </Button>
          <Button style={{ minWidth: 200, backgroundColor: "#27AE60" }}>
            Proceed to Payment (${paymentTotal.total.toFixed(2)})
          </Button>
        </div>
      </div>
    </section>
  );
}
