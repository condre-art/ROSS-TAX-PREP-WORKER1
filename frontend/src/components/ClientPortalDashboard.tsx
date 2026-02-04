import React, { useState, useEffect } from 'react';
import './ClientPortalDashboard.css';

interface TaxReturn {
  return_id: string;
  tax_year: number;
  filing_status: string;
  status: string;
  submitted_at?: string;
}

interface Task {
  task_id: string;
  task_type: string;
  description: string;
  due_date?: string;
  status: string;
}

interface Notification {
  notification_id: string;
  type: string;
  message: string;
  is_read: number;
  created_at: string;
}

interface RefundStatus {
  transfer_id: string;
  amount: number;
  fee: number;
  status: string;
  expected_date?: string;
}

export default function ClientPortalDashboard() {
  const [returns, setReturns] = useState<TaxReturn[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refundStatus, setRefundStatus] = useState<RefundStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const response = await fetch('/api/portal/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load dashboard');

      const data = await response.json();
      setReturns(data.returns || []);
      setTasks(data.tasks || []);
      setNotifications(data.notifications || []);
      setRefundStatus(data.refund_status || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': 'status-draft',
      'in_progress': 'status-progress',
      'pending_review': 'status-pending',
      'submitted': 'status-submitted',
      'accepted': 'status-accepted',
      'rejected': 'status-rejected'
    };
    return statusMap[status] || 'status-default';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Client Portal Dashboard</h1>
        <p className="subtitle">Ross Tax Prep & Bookkeeping</p>
      </header>

      {/* Notifications Banner */}
      {notifications.filter(n => !n.is_read).length > 0 && (
        <div className="notifications-banner">
          <div className="notification-icon">🔔</div>
          <div className="notification-content">
            <strong>{notifications.filter(n => !n.is_read).length} New Notifications</strong>
            <button className="btn-link">View All</button>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Tax Returns Card */}
        <div className="card">
          <div className="card-header">
            <h2>📄 Tax Returns</h2>
            <span className="badge">{returns.length} Total</span>
          </div>
          <div className="card-body">
            {returns.length === 0 ? (
              <p className="empty-state">No tax returns found</p>
            ) : (
              <div className="returns-list">
                {returns.map(ret => (
                  <div key={ret.return_id} className="return-item">
                    <div className="return-info">
                      <strong>Tax Year {ret.tax_year}</strong>
                      <span className="filing-status">{ret.filing_status.replace('_', ' ')}</span>
                    </div>
                    <span className={`status-badge ${getStatusBadge(ret.status)}`}>
                      {ret.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Tasks Card */}
        <div className="card">
          <div className="card-header">
            <h2>✅ Pending Tasks</h2>
            <span className="badge badge-urgent">{tasks.length} Tasks</span>
          </div>
          <div className="card-body">
            {tasks.length === 0 ? (
              <p className="empty-state">No pending tasks</p>
            ) : (
              <div className="tasks-list">
                {tasks.map(task => (
                  <div key={task.task_id} className="task-item">
                    <div className="task-info">
                      <div className="task-icon">
                        {task.task_type === 'document_upload' && '📎'}
                        {task.task_type === 'signature_required' && '✍️'}
                        {task.task_type === 'information_needed' && 'ℹ️'}
                        {task.task_type === 'schedule_appointment' && '📅'}
                        {task.task_type === 'payment_due' && '💳'}
                      </div>
                      <div>
                        <strong>{task.description}</strong>
                        {task.due_date && (
                          <span className="due-date">Due: {formatDate(task.due_date)}</span>
                        )}
                      </div>
                    </div>
                    <button className="btn-action">Complete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Refund Status Card */}
        {refundStatus && (
          <div className="card card-highlight">
            <div className="card-header">
              <h2>💸 Refund Transfer Status</h2>
            </div>
            <div className="card-body">
              <div className="refund-summary">
                <div className="refund-amount">
                  <span className="label">Refund Amount</span>
                  <span className="amount">{formatCurrency(refundStatus.amount)}</span>
                </div>
                <div className="refund-fee">
                  <span className="label">Processing Fee</span>
                  <span className="fee">-{formatCurrency(refundStatus.fee)}</span>
                </div>
                <div className="refund-net">
                  <span className="label">Net Deposit</span>
                  <span className="net">{formatCurrency(refundStatus.amount - refundStatus.fee)}</span>
                </div>
              </div>
              <div className="refund-status">
                <span className={`status-badge status-${refundStatus.status.toLowerCase()}`}>
                  {refundStatus.status.replace(/_/g, ' ')}
                </span>
                {refundStatus.expected_date && (
                  <span className="expected-date">
                    Expected: {formatDate(refundStatus.expected_date)}
                  </span>
                )}
              </div>
              <div className="disclaimer">
                <small>
                  ⚖️ Ross Tax & Bookkeeping is not a bank. Refund transfers are processed through partner financial institutions.
                </small>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Card */}
        <div className="card">
          <div className="card-header">
            <h2>⚡ Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="quick-actions">
              <button className="action-btn">
                <span className="icon">📎</span>
                Upload Documents
              </button>
              <button className="action-btn">
                <span className="icon">💬</span>
                Send Message
              </button>
              <button className="action-btn">
                <span className="icon">📊</span>
                View Activity
              </button>
              <button className="action-btn">
                <span className="icon">💰</span>
                Refund Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
