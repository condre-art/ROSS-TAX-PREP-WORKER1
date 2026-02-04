/**
 * Ross Tax & Bookkeeping Money Management Dashboard
 * Navy Federal Credit Union-inspired design
 */

import React, { useState, useEffect, useMemo } from 'react';
import './MoneyManagementDashboard.css';

interface MoneyAccount {
  id: string;
  account_number: string;
  routing_number: string;
  account_type: 'checking' | 'savings' | 'money_market';
  account_tier: 'basic' | 'premium' | 'business';
  account_name: string;
  balance: number;
  available_balance: number;
  pending_deposits: number;
  pending_withdrawals: number;
  daily_limit: number;
  monthly_limit: number;
  transaction_limit_per: number;
  status: string;
  interest_rate: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string;
  merchant_name?: string;
  created_at: string;
  status: string;
}

interface DebitCard {
  id: string;
  card_last4: string;
  card_type: 'virtual' | 'physical';
  status: string;
  daily_limit: number;
  exp_month: number;
  exp_year: number;
}

interface P2PTransfer {
  id: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

const MoneyManagementDashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<MoneyAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<MoneyAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debitCards, setDebitCards] = useState<DebitCard[]>([]);
  const [p2pTransfers, setP2PTransfers] = useState<P2PTransfer[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'cards' | 'transfer' | 'deposit'>('overview');
  const [loading, setLoading] = useState(true);
  
  // P2P Transfer form
  const [p2pRecipient, setP2pRecipient] = useState('');
  const [p2pAmount, setP2pAmount] = useState('');
  const [p2pDescription, setP2pDescription] = useState('');
  const [p2pStatus, setP2pStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  
  // Mobile deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [depositStatus, setDepositStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  
  // Card issuance
  const [cardType, setCardType] = useState<'virtual' | 'physical'>('virtual');
  const [cardStatus, setCardStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  
  useEffect(() => {
    fetchAccounts();
  }, []);
  
  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions(selectedAccount.id);
      fetchDebitCards(selectedAccount.id);
    }
  }, [selectedAccount]);
  
  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/money/accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
      if (data.accounts && data.accounts.length > 0) {
        setSelectedAccount(data.accounts[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setLoading(false);
    }
  };
  
  const fetchTransactions = async (accountId: string) => {
    try {
      const response = await fetch(`/api/money/accounts/${accountId}/transactions`);
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };
  
  const fetchDebitCards = async (accountId: string) => {
    try {
      const response = await fetch(`/api/money/cards?accountId=${accountId}`);
      const data = await response.json();
      setDebitCards(data.cards || []);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    }
  };
  
  const handleP2PTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setP2pStatus({ type: null, message: '' });
    
    if (!selectedAccount) return;
    
    try {
      const response = await fetch('/api/money/p2p/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedAccount.id,
          recipient: p2pRecipient,
          amount: parseFloat(p2pAmount),
          description: p2pDescription,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setP2pStatus({ type: 'success', message: `Transfer of $${p2pAmount} initiated successfully!` });
        setP2pRecipient('');
        setP2pAmount('');
        setP2pDescription('');
        fetchAccounts(); // Refresh balance
      } else {
        setP2pStatus({ type: 'error', message: data.error || 'Transfer failed' });
      }
    } catch (error: any) {
      setP2pStatus({ type: 'error', message: error.message });
    }
  };
  
  const handleMobileDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositStatus({ type: null, message: '' });
    
    if (!selectedAccount || !frontImage || !backImage) {
      setDepositStatus({ type: 'error', message: 'Please upload both front and back images' });
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('account_id', selectedAccount.id);
      formData.append('amount', depositAmount);
      formData.append('front_image', frontImage);
      formData.append('back_image', backImage);
      
      const response = await fetch('/api/money/mobile-deposit', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDepositStatus({ type: 'success', message: `Check deposit of $${depositAmount} is being processed!` });
        setDepositAmount('');
        setFrontImage(null);
        setBackImage(null);
        fetchAccounts();
      } else {
        setDepositStatus({ type: 'error', message: data.error || 'Deposit failed' });
      }
    } catch (error: any) {
      setDepositStatus({ type: 'error', message: error.message });
    }
  };
  
  const handleIssueCard = async () => {
    setCardStatus({ type: null, message: '' });
    
    if (!selectedAccount) return;
    
    try {
      const response = await fetch('/api/money/cards/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedAccount.id,
          card_type: cardType,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCardStatus({ type: 'success', message: `${cardType === 'virtual' ? 'Virtual' : 'Physical'} card issued successfully!` });
        fetchDebitCards(selectedAccount.id);
      } else {
        setCardStatus({ type: 'error', message: data.error || 'Card issuance failed' });
      }
    } catch (error: any) {
      setCardStatus({ type: 'error', message: error.message });
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }, [accounts]);
  
  if (loading) {
    return (
      <div className="money-dashboard">
        <div className="loading-spinner">Loading your accounts...</div>
      </div>
    );
  }
  
  return (
    <div className="money-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>Ross Tax & Bookkeeping</h1>
            <p>Digital Banking</p>
          </div>
          <div className="user-section">
            <button className="user-menu">Account Settings</button>
          </div>
        </div>
      </header>
      
      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card total-balance">
          <div className="stat-label">Total Balance</div>
          <div className="stat-value">{formatCurrency(totalBalance)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Accounts</div>
          <div className="stat-value">{accounts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cards</div>
          <div className="stat-value">{debitCards.length}</div>
        </div>
      </div>
      
      {/* Account Selector */}
      <div className="account-selector">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`account-card ${selectedAccount?.id === account.id ? 'selected' : ''}`}
            onClick={() => setSelectedAccount(account)}
          >
            <div className="account-header">
              <div className="account-type-icon">{account.account_type === 'checking' ? '💳' : '💰'}</div>
              <div className="account-info">
                <div className="account-name">{account.account_name}</div>
                <div className="account-number">••••{account.account_number.slice(-4)}</div>
              </div>
            </div>
            <div className="account-balance">
              <div className="balance-label">Available Balance</div>
              <div className="balance-amount">{formatCurrency(account.available_balance)}</div>
            </div>
            {account.pending_deposits > 0 && (
              <div className="pending-info">
                +{formatCurrency(account.pending_deposits)} pending
              </div>
            )}
          </div>
        ))}
        <div className="account-card add-account">
          <div className="add-icon">+</div>
          <div>Open New Account</div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <nav className="tab-navigation">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`tab ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          Cards
        </button>
        <button
          className={`tab ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          Send Money
        </button>
        <button
          className={`tab ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}
        >
          Mobile Deposit
        </button>
      </nav>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && selectedAccount && (
          <div className="overview-tab">
            <div className="account-details">
              <h2>Account Details</h2>
              <div className="detail-row">
                <span className="label">Account Type:</span>
                <span className="value">{selectedAccount.account_type.toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Account Number:</span>
                <span className="value">{selectedAccount.account_number}</span>
              </div>
              <div className="detail-row">
                <span className="label">Routing Number:</span>
                <span className="value">{selectedAccount.routing_number}</span>
              </div>
              <div className="detail-row">
                <span className="label">Account Tier:</span>
                <span className="value tier-badge">{selectedAccount.account_tier.toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Daily Limit:</span>
                <span className="value">{formatCurrency(selectedAccount.daily_limit)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Monthly Limit:</span>
                <span className="value">{formatCurrency(selectedAccount.monthly_limit)}</span>
              </div>
              {selectedAccount.account_type !== 'checking' && (
                <div className="detail-row">
                  <span className="label">Interest Rate:</span>
                  <span className="value interest-rate">{selectedAccount.interest_rate}% APY</span>
                </div>
              )}
            </div>
            
            <div className="recent-activity">
              <h2>Recent Activity</h2>
              {transactions.slice(0, 5).map((txn) => (
                <div key={txn.id} className="transaction-item">
                  <div className="transaction-icon">{txn.transaction_type === 'deposit' ? '↓' : '↑'}</div>
                  <div className="transaction-details">
                    <div className="transaction-description">{txn.description}</div>
                    <div className="transaction-date">{formatDate(txn.created_at)}</div>
                  </div>
                  <div className={`transaction-amount ${txn.transaction_type === 'deposit' ? 'positive' : 'negative'}`}>
                    {txn.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'transactions' && (
          <div className="transactions-tab">
            <h2>Transaction History</h2>
            <div className="transactions-list">
              {transactions.map((txn) => (
                <div key={txn.id} className="transaction-row">
                  <div className="transaction-type-icon">{txn.transaction_type}</div>
                  <div className="transaction-info">
                    <div className="transaction-description">{txn.description}</div>
                    {txn.merchant_name && <div className="merchant-name">{txn.merchant_name}</div>}
                    <div className="transaction-date">{formatDate(txn.created_at)}</div>
                  </div>
                  <div className="transaction-amount-column">
                    <div className={`amount ${txn.transaction_type === 'deposit' ? 'positive' : 'negative'}`}>
                      {txn.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </div>
                    <div className="balance-after">Balance: {formatCurrency(txn.balance_after)}</div>
                  </div>
                  <div className={`transaction-status ${txn.status}`}>{txn.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'cards' && (
          <div className="cards-tab">
            <h2>Debit Cards</h2>
            <div className="cards-grid">
              {debitCards.map((card) => (
                <div key={card.id} className={`debit-card ${card.card_type}`}>
                  <div className="card-network">VISA</div>
                  <div className="card-number">•••• •••• •••• {card.card_last4}</div>
                  <div className="card-footer">
                    <div className="card-expiry">{card.exp_month}/{card.exp_year.toString().slice(-2)}</div>
                    <div className={`card-status ${card.status}`}>{card.status}</div>
                  </div>
                  <div className="card-limits">
                    Daily Limit: {formatCurrency(card.daily_limit)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="issue-card-section">
              <h3>Issue New Card</h3>
              <div className="card-type-selector">
                <button
                  className={`card-type-btn ${cardType === 'virtual' ? 'selected' : ''}`}
                  onClick={() => setCardType('virtual')}
                >
                  Virtual Card (Instant)
                </button>
                <button
                  className={`card-type-btn ${cardType === 'physical' ? 'selected' : ''}`}
                  onClick={() => setCardType('physical')}
                >
                  Physical Card (5-7 days)
                </button>
              </div>
              <button className="issue-card-btn" onClick={handleIssueCard}>
                Issue {cardType} Card
              </button>
              {cardStatus.type && (
                <div className={`status-message ${cardStatus.type}`}>
                  {cardStatus.message}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'transfer' && (
          <div className="transfer-tab">
            <h2>Send Money (P2P Transfer)</h2>
            <form className="p2p-form" onSubmit={handleP2PTransfer}>
              <div className="form-group">
                <label>Recipient (Email, Phone, or Account Number)</label>
                <input
                  type="text"
                  value={p2pRecipient}
                  onChange={(e) => setP2pRecipient(e.target.value)}
                  placeholder="email@example.com or (555) 123-4567"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  value={p2pAmount}
                  onChange={(e) => setP2pAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={p2pDescription}
                  onChange={(e) => setP2pDescription(e.target.value)}
                  placeholder="What's this for?"
                />
              </div>
              
              <button type="submit" className="transfer-btn">Send Money</button>
              
              {p2pStatus.type && (
                <div className={`status-message ${p2pStatus.type}`}>
                  {p2pStatus.message}
                </div>
              )}
            </form>
          </div>
        )}
        
        {activeTab === 'deposit' && (
          <div className="deposit-tab">
            <h2>Mobile Check Deposit</h2>
            <form className="deposit-form" onSubmit={handleMobileDeposit}>
              <div className="form-group">
                <label>Check Amount</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Front of Check</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setFrontImage(e.target.files?.[0] || null)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Back of Check (Endorsed)</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setBackImage(e.target.files?.[0] || null)}
                  required
                />
              </div>
              
              <button type="submit" className="deposit-btn">Submit Deposit</button>
              
              {depositStatus.type && (
                <div className={`status-message ${depositStatus.type}`}>
                  {depositStatus.message}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyManagementDashboard;
