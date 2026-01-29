# INCIDENT RESPONSE & SECURITY PLAYBOOK

**Document Version:** 1.0  
**Last Updated:** January 28, 2026  
**Owner:** Ross Tax Prep & Bookkeeping LLC - Security Team  
**Effective Date:** January 28, 2026

---

## 1. INCIDENT CLASSIFICATION

### Severity Levels

| Level | Definition | Response Time | Escalation |
|-------|-----------|----------------|-----------|
| **CRITICAL** | Data breach, IRS integration failure, complete system outage | 15 minutes | CEO + Legal |
| **HIGH** | Auth bypass, failed e-file submissions (bulk), compliance violation | 1 hour | Management + Legal |
| **MEDIUM** | Degraded performance, single client data issue, MFA failure | 4 hours | Manager + Tech Lead |
| **LOW** | Minor bugs, documentation gaps, non-urgent improvements | 24 hours | Tech Lead |

---

## 2. MONITORING & ALERTING

### Real-Time Alerts

```plaintext
✓ Failed login spike (>10 failures in 5 min)
  → Trigger: Rate limiter blocks, notify SOC
  → Action: Review login logs, check for brute force

✓ IRS transmission failure
  → Trigger: /api/efile/transmit returns error
  → Action: Retry queue, notify preparer, log to audit

✓ D1 Database error rate >5%
  → Trigger: DB query errors spike
  → Action: Check D1 status, switch to failover if available

✓ Worker CPU >80% for 5+ minutes
  → Trigger: Wrangler metrics
  → Action: Investigate slow queries, consider rate limiting

✓ Unauthorized access attempts
  → Trigger: Permission denied (403) spike
  → Action: Review access logs, check for privilege escalation attempts
```

### Alert Channels

- **Critical:** PagerDuty + SMS + Slack #critical-incidents
- **High:** Email + Slack #incidents
- **Medium:** Slack #tech-updates
- **Low:** GitHub Issues + Slack #backlog

---

## 3. BREACH RESPONSE PROTOCOL

### If Data Breach Suspected

**Immediate (0-30 minutes):**
1. **STOP** - Isolate affected systems (disable access)
2. **ASSESS** - What data? How many clients? Encryption status?
3. **NOTIFY** - CEO, Legal counsel, Security team
4. **PRESERVE** - Capture logs, database snapshots, audit trails

**First Hour:**
1. **SCOPE** - Determine breach boundaries
2. **CONTAIN** - Revoke compromised credentials
3. **NOTIFY CLIENTS** - Encrypted email to affected clients
4. **NOTIFY IRS** - If tax data compromised (required within 30 days)
5. **DOCUMENT** - Timeline, actions taken, impact assessment

**Within 24 Hours:**
1. **INVESTIGATION** - Root cause analysis
2. **REMEDIATION** - Patch vulnerabilities, force password resets
3. **NOTIFICATION** - Public statement (if >500 clients affected)
4. **INSURANCE** - Contact cyber liability insurance provider

**Within 30 Days:**
1. **IRS REPORT** - File breach notice if tax data compromised
2. **STATE REPORT** - Some states require notification
3. **FORENSICS** - Full forensic investigation report
4. **CONTROL REVIEW** - Implement additional safeguards

### Client Notification Template

```
Subject: Security Notice - Immediate Action Required

Dear [Client],

We are writing to inform you that we have detected a potential security 
incident affecting your tax preparation account. Out of an abundance of 
caution, we are:

1. Resetting your account password
2. Enabling mandatory MFA
3. Monitoring your credit (if SSN compromised)

Your temporary new password: [TEMP_PASSWORD]

Please:
- Log in immediately and change your password
- Enable MFA
- Monitor your credit report

We apologize for any inconvenience. Your security is our top priority.

Support Contact: security@rosstaxprepandbookkeeping.com
Incident Hotline: 512-SECURITY

Ross Tax Prep & Bookkeeping
```

---

## 4. IRS SUBMISSION FAILURE PROTOCOL

### When IRS Submission Fails

1. **Immediate:**
   - Capture error details (response code, message, timestamp)
   - Notify affected preparer + client
   - Log to immutable audit log

2. **Investigation (1 hour):**
   - Check IRS system status (irsonline.gov)
   - Verify client data completeness
   - Review transmission logs

3. **Resolution:**
   - **Fixable error (bad data):** Correct and resubmit
   - **IRS timeout:** Retry with exponential backoff
   - **IRS rejection:** Contact IRS support, document resolution

4. **Communication:**
   - Update client: "We're working on resubmitting your return"
   - Provide status link: `/api/efile/status/{transmission_id}`
   - ETA for resolution

---

## 5. DATABASE EMERGENCY RECOVERY

### If D1 Database Compromised/Corrupted

1. **Immediate:**
   - Fail over to read-only backup
   - Block all writes
   - Preserve transaction logs

2. **Recovery:**
   - Restore from latest clean backup
   - Verify data integrity (checksums)
   - Rebuild indices

3. **Verification:**
   - Audit log consistency check
   - Client data spot checks (random sample)
   - IRS submission reconciliation

---

## 6. AUTHENTICATION EMERGENCY

### Account Compromise

1. **User Reports Account Takeover:**
   - Immediately revoke all sessions
   - Force password reset
   - Enable mandatory MFA
   - Review audit log for unauthorized actions
   - Contact affected clients if data was accessed

2. **Prevent Further Compromise:**
   - Block old password from reuse (12 password history)
   - Require security questions verification
   - Send confirmation email for 72 hours

---

## 7. COMPLIANCE VIOLATION

### If Regulatory Issue Detected

1. **Assess Violation:**
   - What regulation (IRS, GDPR, state privacy)?
   - How many clients/records affected?
   - Intentional or negligent?

2. **Notify Authorities:**
   - IRS: Data security breach notification
   - State: Consumer protection divisions (if applicable)
   - CPA Board: Professional misconduct (if applicable)

3. **Remediation:**
   - Implement corrective controls
   - Audit all similar processes
   - Document remediation efforts

---

## 8. COMMUNICATION & ESCALATION

### Escalation Matrix

```
Level      Authority              Contact Method        Timeline
─────────────────────────────────────────────────────────────
Critical   CEO + Legal Counsel     Phone + Slack         Immediate
High       CFO + COO               Email + Phone          30 mins
Medium     Department Manager      Slack + Email          2 hours
Low        Tech Lead               Slack                 Next day
```

### External Notifications

| Party | Trigger | Timeline | Contact |
|-------|---------|----------|---------|
| Clients | Data access | 72 hours | Email + Portal notice |
| IRS | Breach + Tax data | 30 days | IRS Cybersecurity Office |
| Insurance | Breach + Loss | ASAP | Cyber Liability Insurer |
| Regulators | Compliance violation | Per regulation | State AG / Professional Boards |

---

## 9. ANNUAL PENETRATION TESTING

### Scope

- External network penetration test
- Internal network security assessment
- Social engineering test
- Vulnerability scanning (OWASP Top 10)
- Authentication mechanism testing
- Data encryption verification

### Schedule

- **Q1 2026:** Initial baseline assessment
- **Q4 2026:** Full annual penetration test
- **Ongoing:** Monthly vulnerability scans

### Vendor Requirements

- NIST Cybersecurity Framework certified
- SOC 2 Type II auditor
- Must provide remediation recommendations

---

## 10. RECOVERY TIME OBJECTIVES (RTO)

| System | RTO | Notes |
|--------|-----|-------|
| Web Frontend | 4 hours | Redeploy from git |
| API Worker | 4 hours | Redeploy from git |
| Database | 8 hours | Restore from backup |
| Full System | 24 hours | Complete recovery + verification |

---

## 11. INCIDENT DOCUMENTATION

### For Every Incident, Document:

```
Incident Report Template
─────────────────────────
Incident ID: [YYYY-MM-DD-XXX]
Severity: [CRITICAL/HIGH/MEDIUM/LOW]
Reported By: [Name]
Date/Time Detected: [Timestamp]
Date/Time Reported: [Timestamp]

DESCRIPTION:
[What happened?]

SCOPE:
- Systems affected: [List]
- Data affected: [SSN/DOB/Bank/etc.]
- Clients impacted: [#]

ROOT CAUSE:
[Why did this happen?]

RESPONSE TIMELINE:
[When was each action taken?]

ACTIONS TAKEN:
[What was done to resolve?]

PREVENTIVE MEASURES:
[What changed to prevent recurrence?]

Status: [RESOLVED/IN_PROGRESS/PENDING]
```

---

## 12. TRAINING & READINESS

- **Monthly:** Security awareness emails
- **Quarterly:** Team security training
- **Annually:** Incident response tabletop exercise
- **Ongoing:** Staff security certification requirements

---

**Approval:**

- [ ] CEO: _________________ Date: _______
- [ ] Legal Counsel: _________________ Date: _______
- [ ] CTO: _________________ Date: _______

---

**Next Review Date:** January 28, 2027
