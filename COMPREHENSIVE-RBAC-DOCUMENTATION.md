# COMPREHENSIVE RBAC SYSTEM
## Complete Role-Based Access Control for ROSS Tax & Bookkeeping

---

## 🎯 SYSTEM OVERVIEW

This document describes the **complete role-based access control (RBAC) system** that governs every feature, tool, button, setting, platform extension, port, API integration, calculation engine, and transmission capability in the ROSS Tax & Bookkeeping application.

### **Coverage Areas**
✅ E-File & Tax Transmission (IRS MeF)  
✅ Avalon Tax Calculations  
✅ Client Management & CRM  
✅ Document Management (R2 Bucket)  
✅ Service Requests & Workflows  
✅ Bookkeeping & Financial Reports  
✅ Invoicing & Payments  
✅ Learning Management System (LMS)  
✅ Compliance & Certifications  
✅ API Integrations (DocuSign, Stripe, Plaid, etc.)  
✅ System Administration  
✅ Feature Flags & Gradual Rollouts  

---

## 📊 ROLE HIERARCHY

### **Level 5: Owner**
- **Condre Ross** (Business Owner)
- **Unrestricted access to everything**
- Can transfer ownership
- Can modify system-critical settings
- Database-level access

### **Level 4: Administrator**
- **System administrators**
- Full access except ownership transfer
- Can manage all users and roles
- Can configure integrations
- Access to system logs and backups

### **Level 3: ERO (Electronic Return Originator)**
- **Authorized e-file originators**
- Can transmit returns to IRS
- Can approve tax returns
- Can manage staff assignments
- Can override pricing

### **Level 2: Tax Preparer**
- **Tax professionals (PTIN holders)**
- Can prepare tax returns
- Can manage clients
- Can use bookkeeping tools
- Cannot transmit to IRS without ERO approval

### **Level 1: Client**
- **End users / taxpayers**
- Can file own taxes (DIY)
- Can request services
- Can upload documents
- Read-only access to own data

---

## 🔐 PERMISSION CATEGORIES (200+ Permissions)

### **1. Authentication & Account (12 permissions)**
```
auth:login                    - Log into system
auth:logout                   - Log out
auth:mfa_setup                - Configure MFA
auth:mfa_verify               - Verify MFA codes
auth:password_change          - Change own password
auth:password_reset           - Reset others' passwords (admin)
account:view_own              - View own account
account:edit_own              - Edit own account
account:delete_own            - Delete own account
account:view_all              - View all accounts (staff)
account:edit_all              - Edit any account (admin)
account:delete_all            - Delete any account (admin)
```

### **2. E-File & Tax Transmission (16 permissions)**
```
efile:create_own              - Create own tax returns
efile:view_own                - View own returns
efile:edit_own                - Edit own returns
efile:delete_own              - Delete own returns
efile:create                  - Create returns for clients
efile:view_all                - View all returns
efile:edit_all                - Edit any return
efile:delete_all              - Delete any return
efile:submit                  - Submit to preparer/ERO
efile:approve                 - Approve for transmission
efile:transmit                - Transmit to IRS MeF
efile:acknowledge             - Process IRS acknowledgments
efile:reject_handling         - Handle rejected returns
efile:amend                   - File 1040-X amendments
efile:extension               - File extensions
efile:status_check            - Check e-file status
```

### **3. IRS MeF & Transmission (8 permissions)**
```
mef:configure                 - Configure MeF settings
mef:credentials               - Manage certificates/credentials
mef:test_mode                 - Use IRS test environment
mef:production_mode           - Use IRS production (ERO+)
mef:bulk_transmit             - Bulk transmission
mef:ack_download              - Download acknowledgments
mef:error_logs                - View MeF error logs
mef:schema_update             - Update IRS schemas
```

### **4. Clients & CRM (10 permissions)**
```
clients:view_own              - View own client data
clients:create                - Create client accounts
clients:view_all              - View all clients
clients:edit                  - Edit client information
clients:delete                - Delete clients (admin)
clients:export                - Export client database
clients:merge                 - Merge duplicate records
crm:intakes                   - Manage intake forms
crm:notes                     - Add client notes
crm:communications            - View communication history
```

### **5. Documents & File Management (9 permissions)**
```
documents:upload_own          - Upload own documents
documents:view_own            - View own documents
documents:delete_own          - Delete own documents
documents:upload_all          - Upload for any client
documents:view_all            - View all documents
documents:delete_all          - Delete any document
documents:download            - Download documents
documents:share               - Share externally
documents:r2_access           - Direct R2 bucket access
```

### **6. Services & Requests (9 permissions)**
```
services:view                 - View service catalog
services:request              - Submit service requests
services:view_own             - View own requests
services:view_all             - View all requests
services:approve              - Approve requests
services:reject               - Reject requests
services:assign               - Assign to staff
services:pricing              - Manage pricing
services:pricing_override     - Override quoted prices
```

### **7. Bookkeeping (7 permissions)**
```
bookkeeping:view_own          - View own books
bookkeeping:create            - Create entries
bookkeeping:edit              - Edit entries
bookkeeping:delete            - Delete entries
bookkeeping:reconcile         - Reconcile accounts
bookkeeping:reports           - Generate reports
bookkeeping:export            - Export data
```

### **8. Invoicing & Payments (10 permissions)**
```
invoicing:view_own            - View own invoices
invoicing:create              - Create invoices
invoicing:edit                - Edit invoices
invoicing:delete              - Delete invoices
invoicing:send                - Send to clients
invoicing:view_all            - View all invoices
payments:process              - Process payments
payments:refund               - Issue refunds
payments:view_all             - View all payments
payments:configure            - Configure processors
```

### **9. Refund Tracking (4 permissions)**
```
refunds:track_own             - Track own refund
refunds:track_all             - Track all refunds
refunds:update_status         - Update status
refunds:bank_products         - Manage bank products
```

### **10. LMS & Education (10 permissions)**
```
lms:view_catalog              - View courses
lms:enroll                    - Enroll in courses
lms:view_own                  - View own courses
lms:complete                  - Mark complete
lms:create_courses            - Create courses
lms:edit_courses              - Edit course content
lms:delete_courses            - Delete courses
lms:certificates              - Issue certificates
lms:analytics                 - View analytics
lms:purchase_textbooks        - Purchase textbooks
```

### **11. Staff & Team Management (7 permissions)**
```
staff:view                    - View staff directory
staff:create                  - Create staff accounts
staff:edit                    - Edit staff info
staff:delete                  - Delete staff
staff:roles                   - Assign roles
staff:permissions             - Grant/revoke permissions
staff:schedule                - Manage schedules
```

### **12. Compliance & Certifications (6 permissions)**
```
compliance:view               - View compliance status
compliance:certificates       - Manage certificates
compliance:ptin               - PTIN management
compliance:efin               - EFIN credentials
compliance:ce_credits         - Track CE credits
compliance:audits             - Compliance audits
```

### **13. Reporting & Analytics (7 permissions)**
```
reports:view_own              - View own reports
reports:generate              - Generate reports
reports:custom                - Custom reports
reports:export                - Export data
reports:financial             - Financial reports
analytics:view                - View dashboards
analytics:advanced            - Advanced analytics
```

### **14. System Administration (9 permissions)**
```
system:settings               - System settings
system:backup                 - Create backups
system:restore                - Restore from backup
system:logs                   - View system logs
system:audit                  - Audit logs
system:database               - Direct DB access (owner)
system:api_keys               - Manage API keys
system:environment            - Environment variables
system:maintenance            - Maintenance mode
```

### **15. Integrations & APIs (9 permissions)**
```
integration:docusign          - DocuSign integration
integration:mailchannels      - Email service
integration:stripe            - Stripe payments
integration:plaid             - Plaid banking
integration:social_media      - Social media posting
integration:google_business   - Google Business
api:create_key                - Create API keys
api:revoke_key                - Revoke API keys
api:view_usage                - View API stats
```

### **16. Notifications & Communications (6 permissions)**
```
notifications:receive         - Receive notifications
notifications:send            - Send notifications
notifications:broadcast       - Broadcast to all
email:send_client             - Email clients
email:send_all                - Email all users
sms:send                      - Send SMS
```

### **17. Avalon Tax Calculations (5 permissions)**
```
avalon:calculate              - Calculate taxes
avalon:advanced               - Advanced features
avalon:override               - Override calculations
avalon:multistate             - Multi-state taxes
avalon:credits                - Tax credits engine
```

### **18. Portal & UI Features (5 permissions)**
```
portal:access                 - Portal access
portal:dashboard              - Dashboard view
portal:settings               - Portal settings
ui:admin_panel                - Admin panel
ui:advanced_features          - Advanced UI
```

---

## 🎛️ FEATURE FLAGS

Feature flags allow gradual rollout and environment-specific feature control.

### **Production Features (100% rollout)**
- `efile_transmission` - E-File transmission (Level 2+)
- `mef_production` - MeF production mode (Level 3+)
- `diy_efile` - DIY E-File Wizard (Level 1+)
- `lms_platform` - Learning Management System (Level 1+)
- `bookkeeping_module` - Bookkeeping (Level 2+)
- `payment_processing` - Payments (Level 1+)
- `docusign_integration` - DocuSign (Level 2+)
- `social_media` - Social posting (Level 3+)
- `advanced_reporting` - Advanced reports (Level 2+)
- `multi_state_filing` - Multi-state filing (Level 2+)

### **Staging Features (50% rollout)**
- `bulk_operations` - Bulk operations (Level 3+)

### **Beta Features (25% rollout)**
- `ai_assistant` - AI tax assistant (Level 1+)

---

## 💻 IMPLEMENTATION GUIDE

### **Backend Middleware Usage**

```typescript
import { requirePermission, requireRole, isFeatureEnabled } from './utils/permissions';

// Require specific permission
app.post('/api/efile/transmit', 
  requirePermission('efile:transmit', env),
  async (request, env) => {
    // Handler code
  }
);

// Require minimum role level
app.get('/api/admin/reports',
  requireRole(3, env), // ERO minimum
  async (request, env) => {
    // Handler code
  }
);

// Check feature flag
if (await isFeatureEnabled(env, 'bulk_operations', user)) {
  // Feature-specific code
}
```

### **Frontend Component Usage**

```jsx
import { RequirePermission, RequireRole, PermissionButton } from './utils/permissions';

// Conditional rendering
<RequirePermission permission="efile:transmit">
  <button>Transmit to IRS</button>
</RequirePermission>

// Role-based UI
<RequireRole minLevel={3}>
  <AdminPanel />
</RequireRole>

// Permission-aware button
<PermissionButton 
  permission="services:pricing_override"
  onClick={handleOverride}
  disabledMessage="Only EROs can override pricing"
>
  Override Price
</PermissionButton>

// Role badge
<RoleBadge role={user.role} size="md" />

// Feature flag
<RequireFeature feature="ai_assistant">
  <AIAssistantChat />
</RequireFeature>
```

---

## 🔍 PERMISSION CHECKING LOGIC

### **Permission Hierarchy**
1. **Owner** → All permissions automatically
2. **Admin** → All except `system:database` and `system:restore`
3. **ERO** → All `efile:*` and `mef:*` permissions automatically
4. **Preparer** → Explicit permissions only
5. **Client** → Explicit permissions only

### **MFA Requirements**
Certain sensitive operations require multi-factor authentication:
- Password resets for others
- Account deletion
- E-file approval and transmission
- Payment refunds
- Permission/role management
- System configuration
- API key management

### **Audit Logging**
All sensitive actions are logged:
- Permission grants/revokes
- Role assignments
- E-file transmissions
- Document access
- Payment processing
- System setting changes

---

## 📋 DATABASE TABLES

### **roles**
Defines role hierarchy (1=client → 5=owner)

### **permissions**
All 200+ permissions with metadata (MFA required, sensitive, audit)

### **role_permissions**
Maps permissions to roles

### **user_roles**
Assigns roles to users with effective dates

### **feature_flags**
Controls feature availability and rollout

### **audit_logs**
Records all sensitive operations

---

## 🚀 DEPLOYMENT

### **1. Apply RBAC Schema**
```bash
npx wrangler d1 execute DB --file=schema/comprehensive-rbac-system.sql --local
npx wrangler d1 execute DB --file=schema/comprehensive-rbac-system.sql --remote
```

### **2. Deploy Backend**
```bash
npm run deploy
```

### **3. Deploy Frontend**
```bash
cd frontend && npm run deploy
```

### **4. Assign Initial Roles**
```sql
-- Assign owner role to Condre
INSERT INTO user_roles (user_id, user_type, role_name, effective_from, assigned_by, assignment_reason, created_at)
VALUES ('condre_user_id', 'staff', 'owner', datetime('now'), 'system', 'Initial setup', datetime('now'));
```

---

## 🛡️ SECURITY BEST PRACTICES

1. **Always check permissions** on both frontend and backend
2. **Use MFA** for sensitive operations
3. **Log all sensitive actions** in audit_logs
4. **Never bypass** permission checks in production
5. **Rotate API keys** regularly
6. **Review audit logs** weekly
7. **Update schemas** when adding new features
8. **Test permission** enforcement before deployment

---

## 📞 SUPPORT & TROUBLESHOOTING

### **User Can't Access Feature**
1. Check user's assigned role in `user_roles`
2. Verify role has permission in `role_permissions`
3. Check if feature flag is enabled in `feature_flags`
4. Verify JWT token is valid and not expired

### **Permission Denied Errors**
1. Check audit logs for denied attempt
2. Verify user's effective role (time-based)
3. Check if MFA is required but not verified
4. Ensure feature is enabled for user's environment

---

**Last Updated**: February 3, 2026  
**Version**: 1.0  
**Maintained By**: GitHub Copilot AI Agent
