# Ross Tax Prep & Bookkeeping - Complete System Architecture

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Account Creation Workflow](#account-creation-workflow)
4. [Complete Feature Set](#complete-feature-set)
5. [Database (D1) Configuration](#database-d1-configuration)
6. [Storage (R2) Configuration](#storage-r2-configuration)
7. [Security & Guardrails](#security--guardrails)
8. [Design System & Branding](#design-system--branding)
9. [Workflows & Processes](#workflows--processes)
10. [Logo & Browser Icon Updates](#logo--browser-icon-updates)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Cloudflare Pages)               │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Public   │ Client   │ Staff    │ Instructor│ Student  │  │
│  │ Website  │ Portal   │ Portal   │ Portal    │ Portal   │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Cloudflare Worker)                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ CRM      │ E-file   │ LMS      │ Auth     │ Payments │  │
│  │ Routes   │ Routes   │ Routes   │ Mgmt     │ Gateway  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────┐
    │ D1 Database  │ │ R2 Bucket│ │ KV Store │
    │ (SQL)        │ │ (Files)  │ │ (Cache)  │
    └──────────────┘ └──────────┘ └──────────┘
```

### Technology Stack

- **Frontend**: React, Vite, TypeScript
- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Cache**: Cloudflare KV
- **Authentication**: JWT + Session tokens
- **Payments**: Stripe, Square, PayPal
- **E-file**: IRS MeF A2A Protocol
- **Email**: MailChannels
- **Security**: Turnstile CAPTCHA, Rate Limiting

### Key Ports & Endpoints

**Development:**
- Worker: `http://localhost:8787`
- Frontend (Vite): `http://localhost:5173`
- D1 Local: SQLite database in `.wrangler/state`

**Production:**
- Worker: `https://api.rosstaxprep.com`
- Frontend: `https://rosstaxprep.com`
- D1: Cloudflare's distributed edge database
- R2: `https://rosstaxprep.com/documents/*`

---

## User Roles & Permissions

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                         ADMIN                            │
│  Full system access, user management, configuration     │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MANAGER    │  │   TEACHER    │  │   STUDENT    │
│ Supervise    │  │ Teach courses│  │ Take courses │
│ staff/ops    │  │ Grade/attend │  │ View grades  │
└──────────────┘  └──────────────┘  └──────────────┘
        │                                   │
        ▼                                   ▼
┌──────────────┐                  ┌──────────────┐
│  TAX_PREP    │                  │    GUEST     │
│ Prepare      │                  │ Public info  │
│ returns      │                  │ No login     │
└──────────────┘                  └──────────────┘
```

## 📋 Database Schema

### `service_requests` Table
```sql
- request_id: Unique identifier (REQ-timestamp-random)
- client_id: Foreign key to clients table
- services_json: JSON array of selected services
- documents_json: JSON array of uploaded documents
- status: pending_approval | approved | in_progress | completed | rejected
- submitted_at: Timestamp
- assigned_to: Staff member ID
- notes: Internal staff notes
- estimated_total: Quoted price
- engagement_letter_url: DocuSign envelope URL
- payment_status: pending | paid | partial
```

### `service_permissions` Table
Role-based permission matrix:
- **client**: services:request, services:view_own, documents:upload, portal:access
- **preparer**: services:view_all, services:assign_self, clients:manage
- **ero**: services:approve, services:assign, staff:manage, pricing:override
- **admin**: services:*, system:*

### `service_request_activity` Table
Audit trail for all request activities (comments, status changes, assignments)

### `documents` Table
All uploaded documents with R2 bucket keys, metadata, and categorization

## 🔌 API Endpoints

### Client Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/services/request` | Submit service request | ✅ Client |
| GET | `/api/services/history/:clientId` | Get service history | ✅ Client |
| POST | `/api/documents/upload` | Upload document | ✅ Client |

### Staff Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| PATCH | `/api/services/request/:requestId` | Update request status | ✅ Preparer/ERO |
| GET | `/api/services/requests/all` | View all requests | ✅ Preparer/ERO |

## 💼 Service Categories (with IRS Forms)

1. **Individual Tax Services (1040 Series)**
   - 13 services from basic 1040 ($355) to complex schedules ($900)
   
2. **Business Tax Services**
   - LLC, Partnership (1065), S-Corp (1120-S), C-Corp (1120)
   - Pricing: $900 - $2,150

3. **IRS Resolution & Compliance**
   - Audit support, installment agreements, penalty abatement
   - $240 - $1,450 (hourly audit rep at $300/hr)

4. **Bookkeeping Services**
   - Monthly retainers from $540 - $1,450 based on transaction volume

5. **VIP Retainer Packages**
   - VIP Essential: $3,600/year
   - VIP Executive: $6,000/year
   - VIP Private Client: $12,000/year (application required)

## 🔒 Permission Checks

### Frontend (Services.jsx)
```javascript
const hasPermission = (permission) => {
  return permissions.includes(permission) || 
         userRole === 'admin' || 
         userRole === 'ero';
};

// Usage
{hasPermission('services:request') && (
  <Button onClick={() => handleServiceSelect(service, category)}>
    + Add to Request
  </Button>
)}
```

### Backend (serviceRequests.ts)
```typescript
// Validate role in route handler
const authHeader = request.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
const user = await verifyToken(token, env);

if (!user || user.role !== 'client') {
  return new Response('Forbidden', { status: 403 });
}
```

## 🎨 UI Components

### Client Portal Dashboard (when authenticated)
- Welcome banner with role display
- Quick action cards: Request Services, Upload Documents, Service History, Manage Clients (staff only)
- Document list with upload count
- Request cart with review modal

### Service Request Modal
- Summary of selected services with IRS form badges
- Price breakdown
- Remove items functionality
- "Next Steps" explanation
- Submit/Continue Shopping buttons

### Service Cards
- IRS form badge (when applicable)
- Service name and description
- Starting price display
- "+ Add to Request" button (authenticated clients only)

## 🔔 Notifications

### Email Notifications (to implement)
- **Client → Staff**: New service request submitted
- **Staff → Client**: Request approved/rejected, quote ready, engagement letter sent
- **System → Both**: Document uploaded, status change

### In-App Alerts
- Success: Service added, request submitted, document uploaded
- Error: Authentication required, validation failed, network error
- Info: Next steps, processing time

## 📊 Service Request Lifecycle

### Status Flow
1. **pending_approval** (initial) → Client submits request
2. **approved** → Staff reviews and approves within 24 hours
3. **in_progress** → Engagement letter signed, work begins
4. **completed** → Service delivered, documents filed
5. **rejected** → Request declined (rare, with explanation)

### Staff Workflow
1. New request email alert
2. Review services + documents in admin panel
3. Assign to preparer/self
4. Generate quote + engagement letter
5. Track payment status
6. Mark completed when delivered

## 🚀 Deployment Steps

1. **Apply database migration:**
   ```bash
   npx wrangler d1 execute DB --file=schema/service-requests-workflow.sql --local
   npx wrangler d1 execute DB --file=schema/service-requests-workflow.sql --remote
   ```

2. **Deploy worker with new routes:**
   ```bash
   npm run deploy
   ```

3. **Deploy frontend:**
   ```bash
   cd frontend && npm run deploy
   ```

4. **Test the flow:**
   - Create account at /diy-efile
   - Navigate to /services
   - Select services and submit request
   - Check backend logs for request ID

## 🛡️ Security Considerations

### Authentication
- JWT tokens stored in localStorage (keys: `ross_auth_token`, `ross_user_role`, `ross_permissions`, `ross_client_id`)
- Bearer token sent in Authorization header for all API calls
- Token expiration: 24 hours (configurable)

### Authorization
- Permission checks on every backend endpoint
- Role hierarchy: admin > ero > preparer > client
- Sensitive operations (pricing override, staff management) restricted to ERO+

### Data Protection
- All PII encrypted before storage (SSN, ID numbers)
- Document uploads to R2 bucket with access controls
- Audit logging for all service request actions
- HTTPS/TLS for all transmissions

## 📈 Future Enhancements

1. **Real-time Status Updates**: WebSocket notifications
2. **Stripe Integration**: Direct payment processing
3. **DocuSign Integration**: Automated engagement letters
4. **AI Pricing**: Machine learning for complexity-based quotes
5. **Client Portal Expansion**: Tax calendar, refund tracker
6. **Mobile App**: Native iOS/Android service request app
7. **Multi-language**: Spanish language support

## 🧪 Testing Checklist

- [ ] Client registration with role assignment
- [ ] Service selection and cart management
- [ ] Document upload (single and multiple files)
- [ ] Service request submission
- [ ] Service history retrieval
- [ ] Permission checks (try accessing admin features as client)
- [ ] Request status updates (staff workflow)
- [ ] Modal open/close behavior
- [ ] Error handling (network failures, validation errors)
- [ ] Mobile responsiveness

## 📞 Support

For issues or questions:
- **Technical**: Check audit logs in D1 database
- **Business**: Review service_requests table for client data
- **Permissions**: Verify service_permissions table for role matrix

---

**Last Updated**: February 3, 2026
**Version**: 1.0
**Maintained By**: GitHub Copilot AI Agent
