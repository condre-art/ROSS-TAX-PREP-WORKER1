# Ross Tax Academy LMS - Test Script
# Test enrollment flow end-to-end

Write-Host "=== Ross Tax Academy LMS Test Suite ===" -ForegroundColor Cyan

# Configuration
$WORKER_URL = "http://localhost:8787"
$TEST_EMAIL = "test-student@example.com"

Write-Host "`n1. Testing Course Catalog..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$WORKER_URL/lms/courses.json" -Method GET
    Write-Host "✓ Course catalog loaded: $($response.StatusCode)" -ForegroundColor Green
    $courses = $response.Content | ConvertFrom-Json
    Write-Host "  Found $($courses.courses.Length) courses" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to load courses: $_" -ForegroundColor Red
}

Write-Host "`n2. Testing Enrollment Submission..." -ForegroundColor Yellow
$enrollmentData = @{
    studentInfo = @{
        firstName = "Jane"
        lastName = "Doe"
        email = $TEST_EMAIL
        phone = "555-1234"
        dateOfBirth = "1990-01-15"
        address = @{
            street = "123 Test St"
            city = "TestCity"
            state = "CA"
            zip = "90210"
        }
    }
    courseSelection = @{
        programCode = "TP-101"
        programName = "Tax Professional Foundation"
        tuition = 599
    }
    paymentMethod = "full"
    paymentInfo = @{
        billingName = "Jane Doe"
        billingAddress = "123 Test St, TestCity, CA 90210"
    }
    agreements = @{
        enrollmentAgreement = $true
        refundPolicy = $true
        codeOfConduct = $true
        privacyConsent = $true
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "$WORKER_URL/api/lms/enroll" `
        -Method POST `
        -ContentType "application/json" `
        -Body $enrollmentData
    
    $enrollment = $response.Content | ConvertFrom-Json
    Write-Host "✓ Enrollment created: $($enrollment.enrollmentId)" -ForegroundColor Green
    Write-Host "  Status: $($enrollment.status)" -ForegroundColor Gray
    
    # Save enrollment ID for next tests
    $ENROLLMENT_ID = $enrollment.enrollmentId
} catch {
    Write-Host "✗ Enrollment failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Testing Get Enrollment Details..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$WORKER_URL/api/lms/enrollments/$ENROLLMENT_ID" -Method GET
    $details = $response.Content | ConvertFrom-Json
    Write-Host "✓ Enrollment details retrieved" -ForegroundColor Green
    Write-Host "  Student: $($details.studentName)" -ForegroundColor Gray
    Write-Host "  Program: $($details.programName)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to get enrollment: $_" -ForegroundColor Red
}

Write-Host "`n4. Testing Certificate Generation..." -ForegroundColor Yellow
$certData = @{
    enrollmentId = $ENROLLMENT_ID
    completionDate = (Get-Date).ToString("yyyy-MM-dd")
    issuedBy = "Test System"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$WORKER_URL/api/lms/certificates/generate" `
        -Method POST `
        -ContentType "application/json" `
        -Body $certData
    
    $certificate = $response.Content | ConvertFrom-Json
    Write-Host "✓ Certificate generated: $($certificate.certificateNumber)" -ForegroundColor Green
    Write-Host "  Verification code: $($certificate.verificationCode)" -ForegroundColor Gray
    
    # Save verification code for next test
    $VERIFICATION_CODE = $certificate.verificationCode
} catch {
    Write-Host "✗ Certificate generation failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n5. Testing Certificate Verification..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$WORKER_URL/api/lms/certificates/verify/$VERIFICATION_CODE" -Method GET
    $verification = $response.Content | ConvertFrom-Json
    Write-Host "✓ Certificate verified successfully" -ForegroundColor Green
    Write-Host "  Valid: $($verification.valid)" -ForegroundColor Gray
    Write-Host "  Student: $($verification.studentName)" -ForegroundColor Gray
    Write-Host "  Program: $($verification.programName)" -ForegroundColor Gray
    Write-Host "  Issue Date: $($verification.issueDate)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Verification failed: $_" -ForegroundColor Red
}

Write-Host "`n6. Testing Invalid Verification Code..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$WORKER_URL/api/lms/certificates/verify/INVALID-CODE" -Method GET
    Write-Host "✗ Should have failed but succeeded" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✓ Correctly rejected invalid code (404)" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Suite Complete ===" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npm run dev' to start worker locally" -ForegroundColor Gray
Write-Host "2. Execute this test: .\test-lms-flow.ps1" -ForegroundColor Gray
Write-Host "3. Check D1 database for created records" -ForegroundColor Gray
Write-Host "4. Deploy to Cloudflare: npm run deploy" -ForegroundColor Gray
