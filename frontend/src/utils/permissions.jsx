/**
 * Frontend Permission Utilities & Role-Based UI Components
 * Client-side permission checking and role management
 */

import { useState, useEffect, createContext, useContext } from 'react';

// ====================================================================
// PERMISSION CONTEXT
// ====================================================================

const PermissionContext = createContext({
  user: null,
  permissions: [],
  hasPermission: (permission) => false,
  hasAnyPermission: (permissions) => false,
  hasAllPermissions: (permissions) => false,
  isFeatureEnabled: (feature) => false,
  roleLevel: 0,
  isAuthenticated: false,
  loading: true
});

export const usePermissions = () => useContext(PermissionContext);

// ====================================================================
// ROLE LEVELS
// ====================================================================

export const ROLE_LEVELS = {
  client: 1,
  preparer: 2,
  ero: 3,
  admin: 4,
  owner: 5
};

export const ROLE_NAMES = {
  1: 'Client',
  2: 'Tax Preparer',
  3: 'ERO',
  4: 'Administrator',
  5: 'Owner'
};

// ====================================================================
// PERMISSION PROVIDER
// ====================================================================

export function PermissionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const loadUserPermissions = async () => {
    try {
      const token = localStorage.getItem('ross_auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setPermissions(data.permissions || []);
        setFeatures(data.features || {});
      } else {
        // Token invalid, clear storage
        localStorage.removeItem('ross_auth_token');
        localStorage.removeItem('ross_user_role');
        localStorage.removeItem('ross_permissions');
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    if (user.role === 'admin' && !permission.startsWith('system:database')) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms) => {
    return perms.some(p => hasPermission(p));
  };

  const hasAllPermissions = (perms) => {
    return perms.every(p => hasPermission(p));
  };

  const isFeatureEnabled = (feature) => {
    return features[feature] === true;
  };

  const value = {
    user,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isFeatureEnabled,
    roleLevel: user ? ROLE_LEVELS[user.role] || 0 : 0,
    isAuthenticated: !!user,
    loading
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// ====================================================================
// PERMISSION-GATED COMPONENTS
// ====================================================================

/**
 * Show content only if user has permission
 */
export function RequirePermission({ permission, children, fallback = null }) {
  const { hasPermission } = usePermissions();
  return hasPermission(permission) ? children : fallback;
}

/**
 * Show content only if user has ANY of the permissions
 */
export function RequireAnyPermission({ permissions, children, fallback = null }) {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissions) ? children : fallback;
}

/**
 * Show content only if user has ALL permissions
 */
export function RequireAllPermissions({ permissions, children, fallback = null }) {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissions) ? children : fallback;
}

/**
 * Show content only if user has minimum role level
 */
export function RequireRole({ minLevel, children, fallback = null }) {
  const { roleLevel } = usePermissions();
  return roleLevel >= minLevel ? children : fallback;
}

/**
 * Show content only if feature is enabled
 */
export function RequireFeature({ feature, children, fallback = null }) {
  const { isFeatureEnabled } = usePermissions();
  return isFeatureEnabled(feature) ? children : fallback;
}

/**
 * Show content based on authentication status
 */
export function RequireAuth({ children, fallback = null }) {
  const { isAuthenticated } = usePermissions();
  return isAuthenticated ? children : fallback;
}

// ====================================================================
// PERMISSION-AWARE BUTTON
// ====================================================================

export function PermissionButton({ 
  permission, 
  requiredRole,
  feature,
  onClick, 
  children,
  disabledMessage = 'You do not have permission to perform this action',
  ...props 
}) {
  const { hasPermission, roleLevel, isFeatureEnabled } = usePermissions();
  
  const isPermitted = permission ? hasPermission(permission) : true;
  const hasRole = requiredRole ? roleLevel >= requiredRole : true;
  const featureEnabled = feature ? isFeatureEnabled(feature) : true;
  
  const isAllowed = isPermitted && hasRole && featureEnabled;

  const handleClick = (e) => {
    if (!isAllowed) {
      e.preventDefault();
      alert(disabledMessage);
      return;
    }
    if (onClick) onClick(e);
  };

  return (
    <button 
      {...props}
      onClick={handleClick}
      disabled={!isAllowed}
      title={!isAllowed ? disabledMessage : props.title}
      style={{
        ...props.style,
        opacity: !isAllowed ? 0.5 : 1,
        cursor: !isAllowed ? 'not-allowed' : 'pointer'
      }}
    >
      {children}
    </button>
  );
}

// ====================================================================
// ROLE BADGE COMPONENT
// ====================================================================

export function RoleBadge({ role, size = 'md' }) {
  const roleColors = {
    client: '#3498db',
    preparer: '#2ecc71',
    ero: '#f39c12',
    admin: '#e74c3c',
    owner: '#9b59b6'
  };

  const sizes = {
    sm: { padding: '2px 6px', fontSize: 10 },
    md: { padding: '4px 10px', fontSize: 12 },
    lg: { padding: '6px 14px', fontSize: 14 }
  };

  return (
    <span style={{
      ...sizes[size],
      backgroundColor: roleColors[role] || '#95a5a6',
      color: 'white',
      borderRadius: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      display: 'inline-block'
    }}>
      {ROLE_NAMES[ROLE_LEVELS[role]] || role}
    </span>
  );
}

// ====================================================================
// PERMISSION TABLE COMPONENT
// ====================================================================

export function PermissionTable({ roleName }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, [roleName]);

  const loadPermissions = async () => {
    try {
      const response = await fetch(`/api/roles/${roleName}/permissions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ross_auth_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading permissions...</div>;

  // Group permissions by category
  const grouped = permissions.reduce((acc, perm) => {
    const group = perm.permission_group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  return (
    <div style={{ width: '100%' }}>
      <h3>Permissions for {ROLE_NAMES[ROLE_LEVELS[roleName]]}</h3>
      {Object.entries(grouped).map(([group, perms]) => (
        <div key={group} style={{ marginBottom: 24 }}>
          <h4 style={{ 
            color: '#003366', 
            borderBottom: '2px solid #F3A006',
            paddingBottom: 8,
            marginBottom: 12
          }}>
            {group}
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: 8, textAlign: 'left', border: '1px solid #ddd' }}>Permission</th>
                <th style={{ padding: 8, textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                <th style={{ padding: 8, textAlign: 'center', border: '1px solid #ddd' }}>MFA</th>
                <th style={{ padding: 8, textAlign: 'center', border: '1px solid #ddd' }}>Sensitive</th>
              </tr>
            </thead>
            <tbody>
              {perms.map((perm) => (
                <tr key={perm.permission_key}>
                  <td style={{ padding: 8, border: '1px solid #ddd', fontFamily: 'monospace', fontSize: 12 }}>
                    {perm.permission_key}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd', fontSize: 13 }}>
                    {perm.description}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                    {perm.requires_mfa ? '🔒' : '-'}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                    {perm.is_sensitive ? '⚠️' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ====================================================================
// FEATURE FLAG TOGGLE (Admin Only)
// ====================================================================

export function FeatureFlagToggle({ featureKey, featureName }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    loadFeatureStatus();
  }, [featureKey]);

  const loadFeatureStatus = async () => {
    try {
      const response = await fetch(`/api/features/${featureKey}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ross_auth_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.is_enabled);
      }
    } catch (error) {
      console.error('Failed to load feature status:', error);
    }
  };

  const toggleFeature = async () => {
    if (!hasPermission('system:settings')) {
      alert('You do not have permission to modify feature flags');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/features/${featureKey}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ross_auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_enabled: !enabled })
      });

      if (response.ok) {
        setEnabled(!enabled);
      } else {
        alert('Failed to toggle feature');
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: 12,
      border: '1px solid #ddd',
      borderRadius: 4,
      marginBottom: 8
    }}>
      <div>
        <strong>{featureName}</strong>
        <div style={{ fontSize: 12, color: '#666' }}>{featureKey}</div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={toggleFeature}
          disabled={loading || !hasPermission('system:settings')}
        />
        {enabled ? 'Enabled' : 'Disabled'}
      </label>
    </div>
  );
}

// ====================================================================
// EXPORTS
// ====================================================================

export default {
  PermissionProvider,
  usePermissions,
  RequirePermission,
  RequireAnyPermission,
  RequireAllPermissions,
  RequireRole,
  RequireFeature,
  RequireAuth,
  PermissionButton,
  RoleBadge,
  PermissionTable,
  FeatureFlagToggle,
  ROLE_LEVELS,
  ROLE_NAMES
};
