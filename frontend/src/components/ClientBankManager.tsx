import React, { useState, useEffect } from 'react';
import './ClientBankManager.css';

interface LinkedBank {
  id: string;
  bank_name: string;
  account_type: 'checking' | 'savings';
  account_number_last4: string;
  routing_number: string;
  routing_verified: boolean;
  account_verified: boolean;
  is_primary: boolean;
  bank_product?: 'RA' | 'EPS' | 'SBTPG' | 'Refundo' | null;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  created_at: string;
}

interface BankProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  features: string[];
  fees: {
    refund_transfer?: number;
    refund_advance?: number;
    monthly?: number;
  };
  requirements: string[];
}

export const ClientBankManager: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [banks, setBanks] = useState<LinkedBank[]>([]);
  const [products, setProducts] = useState<BankProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bank_name: '',
    account_type: 'checking' as 'checking' | 'savings',
    account_number: '',
    confirm_account_number: '',
    routing_number: '',
    account_holder_name: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [routingValidation, setRoutingValidation] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchBanks();
    fetchProducts();
  }, [clientId]);

  const fetchBanks = async () => {
    try {
      const response = await fetch('/api/client/banks');
      if (!response.ok) throw new Error('Failed to fetch banks');
      const data = await response.json();
      setBanks(data.banks);
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/client/banks/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const validateRouting = async (routingNumber: string) => {
    if (routingNumber.length !== 9) return;

    try {
      const response = await fetch('/api/client/banks/validate-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routing_number: routingNumber }),
      });
      const data = await response.json();
      setRoutingValidation(data);
    } catch (error) {
      console.error('Error validating routing:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.bank_name) errors.bank_name = 'Bank name is required';
    if (!formData.account_number) errors.account_number = 'Account number is required';
    if (!formData.confirm_account_number) errors.confirm_account_number = 'Please confirm account number';
    if (formData.account_number !== formData.confirm_account_number) {
      errors.confirm_account_number = 'Account numbers do not match';
    }
    if (!formData.routing_number) errors.routing_number = 'Routing number is required';
    if (formData.routing_number.length !== 9) errors.routing_number = 'Routing number must be 9 digits';
    if (!formData.account_holder_name) errors.account_holder_name = 'Account holder name is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await fetch('/api/client/banks/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to link bank');

      // Reset form and refresh banks
      setFormData({
        bank_name: '',
        account_type: 'checking',
        account_number: '',
        confirm_account_number: '',
        routing_number: '',
        account_holder_name: '',
      });
      setShowAddForm(false);
      fetchBanks();
    } catch (error) {
      console.error('Error linking bank:', error);
    }
  };

  const handleSelectProduct = async (bankId: string, productCode: string) => {
    try {
      const response = await fetch(`/api/client/banks/${bankId}/product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_code: productCode }),
      });

      if (!response.ok) throw new Error('Failed to select product');
      fetchBanks();
    } catch (error) {
      console.error('Error selecting product:', error);
    }
  };

  const handleSetPrimary = async (bankId: string) => {
    try {
      const response = await fetch(`/api/client/banks/${bankId}/set-primary`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to set primary');
      fetchBanks();
    } catch (error) {
      console.error('Error setting primary:', error);
    }
  };

  const handleRemoveBank = async (bankId: string) => {
    if (!confirm('Are you sure you want to remove this bank account?')) return;

    try {
      const response = await fetch(`/api/client/banks/${bankId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove bank');
      fetchBanks();
    } catch (error) {
      console.error('Error removing bank:', error);
    }
  };

  if (loading) {
    return <div className="bank-manager-loading">Loading your banks...</div>;
  }

  return (
    <div className="client-bank-manager">
      <div className="bank-manager-header">
        <h2>Bank Accounts</h2>
        <button className="add-bank-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ Add Bank Account'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-bank-form">
          <h3>Link New Bank Account</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Bank Name *</label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="e.g., Chase, Bank of America"
              />
              {formErrors.bank_name && <span className="error">{formErrors.bank_name}</span>}
            </div>

            <div className="form-group">
              <label>Account Type *</label>
              <select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as 'checking' | 'savings' })}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>

            <div className="form-group">
              <label>Routing Number * (9 digits)</label>
              <input
                type="text"
                maxLength={9}
                value={formData.routing_number}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, routing_number: value });
                  if (value.length === 9) validateRouting(value);
                }}
                placeholder="000000000"
              />
              {routingValidation && (
                <span className={`validation ${routingValidation.valid ? 'valid' : 'invalid'}`}>
                  {routingValidation.message}
                </span>
              )}
              {formErrors.routing_number && <span className="error">{formErrors.routing_number}</span>}
            </div>

            <div className="form-group">
              <label>Account Number *</label>
              <input
                type="password"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="Enter account number"
              />
              {formErrors.account_number && <span className="error">{formErrors.account_number}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Account Number *</label>
              <input
                type="text"
                value={formData.confirm_account_number}
                onChange={(e) => setFormData({ ...formData, confirm_account_number: e.target.value })}
                placeholder="Re-enter account number"
              />
              {formErrors.confirm_account_number && <span className="error">{formErrors.confirm_account_number}</span>}
            </div>

            <div className="form-group">
              <label>Account Holder Name *</label>
              <input
                type="text"
                value={formData.account_holder_name}
                onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                placeholder="Full name on account"
              />
              {formErrors.account_holder_name && <span className="error">{formErrors.account_holder_name}</span>}
            </div>

            <button type="submit" className="submit-btn">
              Link Bank Account
            </button>
          </form>
        </div>
      )}

      <div className="banks-list">
        {banks.length === 0 ? (
          <div className="no-banks">
            <p>No bank accounts linked yet.</p>
            <p>Add your first bank account to get started with refund deposits and advances.</p>
          </div>
        ) : (
          banks.map((bank) => (
            <div key={bank.id} className={`bank-card ${bank.is_primary ? 'primary' : ''}`}>
              <div className="bank-card-header">
                <div className="bank-info">
                  <h4>{bank.bank_name}</h4>
                  <span className="account-type">{bank.account_type.toUpperCase()}</span>
                  {bank.is_primary && <span className="primary-badge">PRIMARY</span>}
                </div>
                <div className="bank-actions">
                  {!bank.is_primary && (
                    <button className="btn-secondary" onClick={() => handleSetPrimary(bank.id)}>
                      Set as Primary
                    </button>
                  )}
                  <button className="btn-danger" onClick={() => handleRemoveBank(bank.id)}>
                    ✕ Remove
                  </button>
                </div>
              </div>

              <div className="bank-details">
                <div className="detail-row">
                  <span className="label">Account Number:</span>
                  <span className="value">****{bank.account_number_last4}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Routing Number:</span>
                  <span className="value">{bank.routing_number}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${bank.status}`}>{bank.status}</span>
                </div>
                <div className="verification-status">
                  {bank.routing_verified && <span className="verified">✓ Routing Verified</span>}
                  {bank.account_verified && <span className="verified">✓ Account Verified</span>}
                </div>
              </div>

              {bank.bank_product && (
                <div className="selected-product">
                  <strong>Bank Product:</strong> {bank.bank_product}
                </div>
              )}

              {!bank.bank_product && bank.account_verified && (
                <div className="product-selection">
                  <h5>Select Bank Product:</h5>
                  <div className="products-grid">
                    {products.map((product) => (
                      <div key={product.id} className="product-card">
                        <h6>{product.name}</h6>
                        <p className="product-desc">{product.description}</p>
                        <div className="product-fee">
                          {product.fees.refund_transfer && <span>RT Fee: ${product.fees.refund_transfer}</span>}
                        </div>
                        <button
                          className="select-product-btn"
                          onClick={() => handleSelectProduct(bank.id, product.code)}
                        >
                          Select {product.code}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientBankManager;
