import React, { useState, useEffect } from 'react';
import './HomePageBadgeShowcase.css';

interface Badge {
  id: string;
  type: string;
  label: string;
  icon: string;
  color: string;
  status: 'active' | 'inactive' | 'expired';
}

interface BadgeDashboard {
  clientId: string;
  totalBadges: number;
  completedBadges: number;
  completionPercentage: number;
  badges: Badge[];
  requiredActions: string[];
  categoryProgress: Record<string, { completed: number; total: number; percentage: number }>;
}

export const HomePageBadgeShowcase: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [dashboard, setDashboard] = useState<BadgeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch(`/api/badges/dashboard/${clientId}`);
        if (!response.ok) throw new Error('Failed to fetch badge dashboard');
        const data = await response.json();
        setDashboard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading badges');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchDashboard();
    }
  }, [clientId]);

  if (loading) {
    return <div className="badge-showcase loading">Loading your badges...</div>;
  }

  if (error) {
    return <div className="badge-showcase error">Error: {error}</div>;
  }

  if (!dashboard) {
    return null;
  }

  const displayedBadges = showAllBadges ? dashboard.badges : dashboard.badges.slice(0, 6);
  const hasMoreBadges = dashboard.badges.length > 6;

  return (
    <div className="badge-showcase-container">
      {/* Progress Ring and Stats */}
      <div className="badge-progress-section">
        <div className="progress-ring-wrapper">
          <svg className="progress-ring" width="200" height="200">
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#DAA520" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="90" className="progress-ring-bg" />
            <circle
              cx="100"
              cy="100"
              r="90"
              className="progress-ring-fill"
              style={{
                strokeDasharray: `${2 * Math.PI * 90}`,
                strokeDashoffset: `${2 * Math.PI * 90 * (1 - dashboard.completionPercentage / 100)}`,
              }}
            />
            <text x="100" y="105" className="progress-text" textAnchor="middle">
              {dashboard.completionPercentage}%
            </text>
          </svg>
        </div>
        <div className="progress-stats">
          <h3>Your Progress</h3>
          <p className="stat-line">
            <span className="stat-number">{dashboard.completedBadges}</span>
            <span className="stat-label">of {dashboard.totalBadges} badges earned</span>
          </p>
          <div className="category-breakdown">
            {Object.entries(dashboard.categoryProgress).map(([category, progress]) => (
              <div key={category} className="category-item">
                <span className="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                <div className="mini-progress-bar">
                  <div
                    className="mini-progress-fill"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span className="category-count">
                  {progress.completed}/{progress.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="badges-section">
        <h3>Your Badges</h3>
        <div className="badges-grid">
          {displayedBadges.map((badge) => (
            <div
              key={badge.id}
              className={`badge-card ${badge.status}`}
              style={{ borderColor: badge.color }}
            >
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-label">{badge.label}</div>
              <div className="badge-status">
                {badge.status === 'active' && <span className="status-badge complete">✓ Completed</span>}
                {badge.status === 'inactive' && <span className="status-badge pending">○ Pending</span>}
                {badge.status === 'expired' && <span className="status-badge expired">⟳ Expired</span>}
              </div>
            </div>
          ))}
        </div>

        {hasMoreBadges && !showAllBadges && (
          <button className="view-all-btn" onClick={() => setShowAllBadges(true)}>
            View All Badges ({dashboard.badges.length})
          </button>
        )}

        {showAllBadges && (
          <button className="view-all-btn" onClick={() => setShowAllBadges(false)}>
            Show Less
          </button>
        )}
      </div>

      {/* Required Actions */}
      {dashboard.requiredActions.length > 0 && (
        <div className="required-actions-section">
          <h3>Required Next Steps</h3>
          <ul className="actions-list">
            {dashboard.requiredActions.map((action, idx) => (
              <li key={idx} className="action-item">
                <span className="action-icon">→</span>
                <span className="action-text">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HomePageBadgeShowcase;
