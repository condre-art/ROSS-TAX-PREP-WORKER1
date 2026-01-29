# TAX SEASON LOAD & STRESS TEST PLAN
## Ross Tax Prep Worker1 - Production Resilience

**Test Schedule:** February 1-7, 2026 (Before peak season Jan-Apr)  
**Environment:** Production-like (staging with production-scale DB clone)  
**Owner:** DevOps / CTO

---

## 1. PEAK ASSUMPTIONS & TARGETS

### Historical Context
- Current capacity: ~50 concurrent users
- Planned capacity: **500+ concurrent users** (10x)
- Peak intake submissions: **5 per minute** (sustained)
- Peak auth sessions: **50 concurrent** (staff + clients)

### Worst-Case Scenario
- April 10, 2 PM EST (2 days before deadline)
- 500+ users active simultaneously
- 100+ intake submissions in progress
- IRS system at capacity (slower responses)
- Natural disaster conditions (home office closures)

---

## 2. TEST SCENARIOS

### Scenario A: Normal Load (Baseline)
**Objective:** Establish healthy performance metrics

```
Configuration:
─────────────
Concurrent users:     100
Ramp-up time:         10 minutes
Duration:             30 minutes
Intake submissions:   1 per 3 seconds

Success Criteria:
─────────────────
✓ API response time:  < 200ms (p95)
✓ Worker CPU:         < 30%
✓ DB query time:      < 50ms (p95)
✓ Error rate:         < 0.1%
✓ Throughput:         1000+ requests/second
```

### Scenario B: Peak Load (Expected)
**Objective:** Verify peak capacity handling

```
Configuration:
─────────────
Concurrent users:     500
Ramp-up time:         5 minutes
Duration:             60 minutes
Intake submissions:   5 per minute
Auth attempts:        20 per minute
Document uploads:     2 per minute

Success Criteria:
─────────────────
✓ API response time:  < 300ms (p95)
✓ Worker CPU:         < 50%
✓ DB query time:      < 100ms (p95)
✓ Error rate:         < 0.5%
✓ Queue depth:        < 1000 requests
```

### Scenario C: Stress Test (Beyond Capacity)
**Objective:** Find breaking point & understand degradation

```
Configuration:
─────────────
Concurrent users:     1000+
Ramp-up time:         2 minutes
Duration:             30 minutes
Intake submissions:   10+ per minute
Auth attempts:        50+ per minute

Expected Behavior:
──────────────────
- Response times degrade gracefully
- Non-critical operations queue
- Auth endpoints prioritized
- Error messages user-friendly
- No silent data loss

Success Criteria:
─────────────────
✓ Graceful degradation (no crashes)
✓ Data integrity maintained
✓ Recovery < 5 minutes after load drops
✓ Audit logs complete
```

---

## 3. ENDPOINT-SPECIFIC TESTING

### High-Priority Endpoints (Test First)

#### 1. Authentication (`/api/auth/login`)
```
Load Test Config:
─────────────────
Concurrent requests:   50
Rate:                  10 req/sec
Duration:              5 minutes
Payload:               JSON (email + password)

Verify:
───────
✓ Rate limiting works (max 5 per 60s)
✓ Failed attempts increment counter
✓ JWT tokens valid
✓ MFA challenge triggered correctly
✓ Session invalidation works

Expected Results:
────────────────
Response time:        < 100ms
Success rate:         95%+ (some expected failures)
Throughput:           10 req/sec sustained
```

#### 2. Intake Form (`/api/crm/intakes`)
```
Load Test Config:
─────────────────
Concurrent submissions:    50
Rate:                      5 req/sec
Duration:                  10 minutes
Payload:                   Large JSON (name, SSN, docs, etc.)

Verify:
───────
✓ File uploads don't block other requests
✓ Data validation speed
✓ Database write performance
✓ Encryption at rest working
✓ Audit logging doesn't slow down

Expected Results:
────────────────
Response time:        < 500ms (file upload included)
Success rate:         99.5%
Throughput:           5 req/sec sustained
DB write latency:     < 200ms
```

#### 3. Document Upload (`/api/crm/intakes/{id}/documents`)
```
Load Test Config:
─────────────────
Concurrent uploads:    20
File sizes:            1-5 MB each
Duration:              15 minutes
Upload rate:           2 files/sec

Verify:
───────
✓ R2 storage not bottlenecked
✓ Virus scanning doesn't timeout
✓ Concurrent uploads isolated
✓ Failed uploads don't corrupt storage
✓ Bandwidth limits respected

Expected Results:
────────────────
Upload time (1MB):     < 2 sec
Success rate:          99%
R2 throughput:         100+ MB/min
```

#### 4. IRS Submission (`/api/efile/transmit`)
```
Load Test Config:
─────────────────
Concurrent submissions:    5 (IRS API limited)
Duration:                  30 minutes
Payload:                   Complete return XML

Verify:
───────
✓ IRS API timeouts handled
✓ Retry logic works (exponential backoff)
✓ Submission IDs unique
✓ Client notified of status
✓ Failed submissions queued for retry

Expected Results:
────────────────
Response time:        < 5 seconds (IRS may be slow)
Success rate:         95%+ (some IRS rejections normal)
Retry mechanism:      < 3 total attempts
```

#### 5. Status Check (`/api/efile/status/{id}`)
```
Load Test Config:
─────────────────
Concurrent requests:    100
Rate:                   20 req/sec
Duration:               10 minutes

Verify:
───────
✓ Fast read from cache/DB
✓ No impact on write operations
✓ Stale data acceptable (5 min cache)
✓ Parallel requests isolated

Expected Results:
────────────────
Response time:         < 50ms
Cache hit rate:        > 90%
Database queries:      < 10 per request
```

---

## 4. DATABASE PERFORMANCE TESTING

### D1 SQLite Queries

```
Critical Queries to Stress Test:
─────────────────────────────────

1. Client Lookup (by email)
   Query:  SELECT * FROM clients WHERE email = ?
   Target: < 10ms
   Index:  ✓ email

2. Intake Fetch (with joins)
   Query:  SELECT i.*, c.name, c.email, d.* 
           FROM crm_intakes i
           LEFT JOIN clients c ON i.client_id = c.id
           LEFT JOIN documents d ON i.id = d.intake_id
           WHERE i.id = ?
   Target: < 50ms
   Index:  ✓ intake_id, created_at

3. Audit Log Write (high volume)
   Query:  INSERT INTO audit_log 
           (action, entity, entity_id, details, created_at)
           VALUES (?, ?, ?, ?, ?)
   Target: < 10ms (async acceptable)
   Index:  ✓ created_at, entity_id

4. Dashboard Stats (aggregation)
   Query:  SELECT COUNT(*), status, DATE(created_at)
           FROM crm_intakes
           GROUP BY status, DATE(created_at)
   Target: < 200ms (cached result)

Database Connection Pool:
─────────────────────────
Max connections:       20
Connection timeout:    30 seconds
Idle timeout:          5 minutes
Queue depth alert:     > 10 pending
```

### Data Integrity Checks

```
Before/After Test Validation:
──────────────────────────────

1. Row counts match input
   ✓ 100 intakes submitted = 100 rows in DB

2. Checksums validate
   ✓ SSN hashes match original data

3. Audit log completeness
   ✓ Every write has corresponding log entry

4. FK integrity
   ✓ No orphaned records
   ✓ All client_ids exist in clients table

5. Encryption integrity
   ✓ Encrypted fields decrypt correctly
   ✓ No data corruption
```

---

## 5. FAILURE INJECTION TESTING

### Simulate Real-World Failures

#### Test 1: Database Connection Loss
```
Action:
───────
Kill D1 connection after 5 minutes of load

Expected Behavior:
──────────────────
✓ Graceful error: "Database temporarily unavailable"
✓ Retry queue activated
✓ No silent data loss
✓ Client sees user-friendly error
✓ Recovery within 30 seconds

Success Criteria:
─────────────────
Error message: HTTP 503 with retry hint
No exceptions in logs
Data consistency maintained
```

#### Test 2: IRS API Timeout
```
Action:
───────
Simulate 10-second timeout on IRS transmission endpoint

Expected Behavior:
──────────────────
✓ Request times out after 10 seconds
✓ Client notified: "IRS system slow, retrying..."
✓ Automatic retry with backoff
✓ Manual retry option available
✓ No duplicate submissions

Success Criteria:
─────────────────
Timeout handling:     < 15 seconds total
Retry attempts:       Max 3
User communication:   Clear status message
```

#### Test 3: Worker CPU Throttle
```
Action:
───────
Limit Worker CPU to 25% of normal

Expected Behavior:
──────────────────
✓ Response times degrade predictably
✓ Priority requests (auth) still fast
✓ Non-critical operations queue
✓ No cascading failures
✓ Recovery immediate when CPU freed

Success Criteria:
─────────────────
Graceful degradation:  All requests eventually respond
Auth latency:          < 500ms
Intake latency:        < 2 seconds
Queue depth:           < 5000 requests
```

#### Test 4: Storage (R2) Unavailable
```
Action:
───────
Return 503 Service Unavailable for all R2 requests

Expected Behavior:
──────────────────
✓ File uploads queue for retry
✓ Intake progresses without documents (if allowed)
✓ User notified of upload status
✓ Auto-retry when storage recovers
✓ No data loss

Success Criteria:
─────────────────
Intake can complete:   Yes (docs async)
Retry mechanism:       Automatic after 1 minute
User notification:     "Documents uploading in background"
Data persistence:      100%
```

#### Test 5: DDoS-Like Traffic Spike
```
Action:
───────
10x normal traffic in 30 seconds (no ramp-up)

Expected Behavior:
──────────────────
✓ Rate limiting activates
✓ Bot protection engages
✓ Legitimate traffic prioritized
✓ Service remains available
✓ Attack logged/alerting triggered

Success Criteria:
─────────────────
Legitimate users: < 5% impact
Rate limit enforcement: Automatic
Alerts triggered: Within 1 minute
Service availability: > 99%
```

---

## 6. PERFORMANCE BENCHMARKS & ALERTS

### Target Metrics (Hard Limits)

```
ENDPOINT PERFORMANCE
─────────────────────
/api/auth/login             < 100ms (p95)    [ALERT: > 200ms]
/api/crm/intakes (POST)     < 500ms (p95)    [ALERT: > 1000ms]
/api/crm/intakes (GET)      < 100ms (p95)    [ALERT: > 250ms]
/api/documents/upload       < 2000ms (p95)   [ALERT: > 5000ms]
/api/efile/transmit         < 5000ms (p95)   [ALERT: > 10000ms]
/api/efile/status           < 50ms (p95)     [ALERT: > 100ms]

WORKER METRICS
──────────────
CPU usage                   < 50% (peak)     [ALERT: > 70%]
Memory usage                < 60%            [ALERT: > 80%]
Request queue depth         < 1000           [ALERT: > 2000]
Error rate                  < 0.5%           [ALERT: > 1%]
Worker timeout rate         < 0.1%           [ALERT: > 0.5%]

DATABASE METRICS
────────────────
Query latency (p95)         < 100ms          [ALERT: > 200ms]
Connection pool usage       < 80%            [ALERT: > 90%]
Transaction duration        < 500ms          [ALERT: > 1000ms]
Write latency (INSERT)      < 50ms           [ALERT: > 100ms]

BUSINESS METRICS
─────────────────
Intake success rate         > 99%            [ALERT: < 98%]
IRS submission success      > 95%            [ALERT: < 90%]
Document upload success     > 99%            [ALERT: < 98%]
Auth success rate           > 99%            [ALERT: < 98%]
Data integrity              100%             [ALERT: Losses]
```

### Automatic Scaling Triggers

```
If CPU > 60% for 5+ minutes:
  → Log alert
  → Consider rate limiting new intakes
  → Notify on-call engineer

If error rate > 1% for 5+ minutes:
  → Log critical alert
  → Page on-call engineer
  → Begin incident investigation

If queue depth > 2000:
  → Enable request queuing
  → Notify users of potential delays
  → Notify engineering team

If database latency > 200ms (p95):
  → Check for slow queries
  → Consider read replicas
  → Alert DBA team
```

---

## 7. RECOVERY TESTING

### Failover & Recovery Scenarios

```
Scenario 1: Worker Crash
──────────────────────────
Action:  Kill worker process
Expected: Cloudflare auto-redeploy
Time to recovery: < 2 minutes
Data loss: 0%

Scenario 2: Database Failure
──────────────────────────────
Action:  Shutdown D1 database
Expected: Restore from backup
Time to recovery: < 8 hours
Data loss: < 1 hour

Scenario 3: R2 Storage Failure
──────────────────────────────
Action:  Simulate R2 unavailable
Expected: Queue uploads, retry on recovery
Time to recovery: < 1 minute
Data loss: 0%

Scenario 4: Cascading Failure (Worker + DB)
────────────────────────────────────────────
Action:  Simulateneous critical failures
Expected: Graceful degradation, alert escalation
Time to restoration: < 4 hours
Data loss: 0%
```

---

## 8. FREEZE POLICY (TAX SEASON)

### Feb 1 - Apr 15 (Peak Season)

```
❄️ PRODUCTION FREEZE RULES
──────────────────────────

✅ ALLOWED:
  • Bug fixes (critical only)
  • Security patches (zero-day)
  • Configuration changes (low risk)
  • Database optimization (read-only)
  • Emergency incident response

❌ FROZEN:
  • New feature deployment
  • Authentication changes
  • Database schema changes
  • API endpoint modifications
  • Rate limit adjustments
  • Infrastructure migrations
  • Cloudflare rule changes

Exceptions require:
  • CTO approval
  • 24-hour notice
  • Full regression testing
  • Rollback plan documented
  • Deployment window: Off-peak only (night/weekend)

Non-Critical Changes:
  → Queue for April 16 deployment
  → Document in issue tracker
  → Schedule for post-season review
```

---

## 9. TEST EXECUTION SCHEDULE

### Week 1 of February 2026

```
Monday 2/1:      Load Test Planning + Tool Setup
Tuesday 2/2:     Baseline Test (Scenario A)
Wednesday 2/3:   Peak Load Test (Scenario B)
Thursday 2/4:    Failure Injection Tests
Friday 2/5:      Stress Test (Scenario C)
Saturday 2/6:    Recovery Testing + Analysis
Sunday 2/7:      Report Writing + Readiness Review
```

### Test Artifacts

```
Required Output:
────────────────
✓ Test report with metrics
✓ Performance graphs
✓ Failure scenarios documented
✓ Remediation plans for issues
✓ Go/No-Go decision
✓ Sign-off from CTO + Management
```

---

## 10. MONITORING & ALERTING (Ongoing)

### Real-Time Dashboard (During Tax Season)

```
Critical Metrics (Updated every 30 seconds):
─────────────────────────────────────────────
✓ Concurrent active users
✓ Request throughput (req/sec)
✓ API latency (p50, p95, p99)
✓ Error rate (%)
✓ Worker CPU & memory
✓ Database connection pool usage
✓ IRS submission success rate
✓ Revenue (daily)
```

### Alert Thresholds

- **CRITICAL:** Page on-call immediately (PagerDuty)
- **HIGH:** Email + Slack #incidents
- **MEDIUM:** Slack #tech-updates
- **LOW:** Slack #monitoring

---

## 11. GO/NO-GO DECISION CRITERIA

### Must Pass (Hard Gates)

```
✓ No production data loss in any scenario
✓ Auth endpoints respond < 200ms (p95) under peak load
✓ Intake submissions succeed > 99% of time
✓ Graceful degradation when overloaded (no crashes)
✓ Recovery < 5 minutes after failure
✓ All critical endpoints tested
✓ Failover/recovery procedures documented
✓ On-call procedures validated
✓ CTO + Management sign-off
```

### Decision Timeline

```
Friday 2/7: Load test report complete
Monday 2/10: Management review
Tuesday 2/11: Final go/no-go decision
Wednesday 2/12: Begin tax season (if GO)
```

---

**Test Lead:** [CTO Name]  
**Approval:** CEO / CTO / Operations Manager  
**Next Update:** January 31, 2026
