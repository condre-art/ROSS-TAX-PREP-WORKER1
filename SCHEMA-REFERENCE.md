# IRS MeF Schema Reference Guide

## Ross Tax Prep & Bookkeeping - E-File Integration

**Version:** TY2025/PY2026  
**Last Updated:** January 28, 2026  
**Based on:** IRS MeF BMF Schema Release 12/15/2025

---

## Overview

This document maps IRS tax forms to their MeF schema requirements for e-file transmission.

### Schema Sources

| Package | Contents | Forms Covered |
|---------|----------|---------------|
| BMF Schema | Business Master File schemas | 1120, 1120-S, 1120-H, 1065, 1041, 7004, 94x |
| IMF Schema | Individual Master File schemas | 1040, 1040-SR, 1040-NR, 1040-X |
| EO Schema | Exempt Organization schemas | 990, 990-EZ, 990-PF |

---

## Form Coverage

### Individual Returns (IMF)

| Form | Description | Schema Version | Status |
|------|-------------|----------------|--------|
| 1040 | U.S. Individual Income Tax Return | TY2025v1.0 | ✅ Supported |
| 1040-SR | U.S. Tax Return for Seniors | TY2025v1.0 | ✅ Supported |
| 1040-NR | U.S. Nonresident Alien Income Tax Return | TY2025v1.0 | ✅ Supported |
| 1040-X | Amended U.S. Individual Income Tax Return | TY2025v1.0 | ⚠️ Limited |

### Business Returns (BMF)

| Form | Description | Schema Version | Status |
|------|-------------|----------------|--------|
| 1120 | U.S. Corporation Income Tax Return | TY2025v5.0 | ✅ Supported |
| 1120-S | U.S. Income Tax Return for S Corporation | TY2025v5.0 | ✅ Supported |
| 1120-H | U.S. Income Tax Return for Homeowners Associations | TY2025v5.0 | ✅ Supported |
| 1065 | U.S. Return of Partnership Income | TY2025v5.0 | ✅ Supported |
| 1041 | U.S. Income Tax Return for Estates and Trusts | TY2025v5.0 | ✅ Supported |

### Extensions

| Form | Description | Schema Version | Status |
|------|-------------|----------------|--------|
| 7004 | Application for Automatic Extension | 2025v1.1 | ✅ Supported |
| 4868 | Individual Extension | TY2025v1.0 | ✅ Supported |

### Employment Returns (94x)

| Form | Description | Schema Version | Status |
|------|-------------|----------------|--------|
| 940 | Employer's Annual FUTA Tax Return | 2025v4.0 | ✅ Supported |
| 941 | Employer's QUARTERLY Federal Tax Return | 2026Q1v4.0 | ✅ Supported |
| 943 | Employer's Annual Tax Return for Agricultural Employees | 2025v4.0 | ✅ Supported |
| 944 | Employer's ANNUAL Federal Tax Return | 2025v4.0 | ✅ Supported |
| 945 | Annual Return of Withheld Federal Income Tax | 2025v4.0 | ✅ Supported |

---

## Required Elements by Form

### Form 1040 (Individual)

```xml
<Return>
  <ReturnHeader>
    <TaxYr>2025</TaxYr>                    <!-- Required -->
    <ReturnTypeCd>1040</ReturnTypeCd>       <!-- Required -->
    <Filer>
      <PrimarySSN>XXXXXXXXX</PrimarySSN>    <!-- Required, 9 digits -->
      <Name>                                 <!-- Required -->
        <FirstName>...</FirstName>
        <LastName>...</LastName>
      </Name>
      <Address>...</Address>                 <!-- Required -->
    </Filer>
    <FilingStatus>...</FilingStatus>         <!-- Required -->
  </ReturnHeader>
  <ReturnData>
    <IRS1040>...</IRS1040>                   <!-- Required -->
  </ReturnData>
</Return>
```

### Form 1120 (Corporation)

```xml
<Return>
  <ReturnHeader>
    <TaxYr>2025</TaxYr>                      <!-- Required -->
    <ReturnTypeCd>1120</ReturnTypeCd>         <!-- Required -->
    <TaxPeriodEndDt>2025-12-31</TaxPeriodEndDt> <!-- Required -->
    <Filer>
      <EIN>XX-XXXXXXX</EIN>                  <!-- Required, 9 digits -->
      <BusinessName>
        <BusinessNameLine1>...</BusinessNameLine1>
      </BusinessName>
      <Address>...</Address>
    </Filer>
  </ReturnHeader>
  <ReturnData>
    <IRS1120>...</IRS1120>                   <!-- Required -->
  </ReturnData>
</Return>
```

### Form 1120-S (S Corporation)

```xml
<Return>
  <ReturnHeader>
    <TaxYr>2025</TaxYr>
    <ReturnTypeCd>1120S</ReturnTypeCd>
    <TaxPeriodEndDt>2025-12-31</TaxPeriodEndDt>
    <Filer>
      <EIN>XX-XXXXXXX</EIN>
      <BusinessName>...</BusinessName>
    </Filer>
  </ReturnHeader>
  <ReturnData>
    <IRS1120S>
      <SElectionEffectiveDt>...</SElectionEffectiveDt> <!-- If applicable -->
      <!-- Schedule K-1 for each shareholder -->
    </IRS1120S>
  </ReturnData>
</Return>
```

### Form 1065 (Partnership)

```xml
<Return>
  <ReturnHeader>
    <TaxYr>2025</TaxYr>
    <ReturnTypeCd>1065</ReturnTypeCd>
    <TaxPeriodEndDt>2025-12-31</TaxPeriodEndDt>
    <Filer>
      <EIN>XX-XXXXXXX</EIN>
      <BusinessName>...</BusinessName>
    </Filer>
  </ReturnHeader>
  <ReturnData>
    <IRS1065>
      <!-- Schedule K-1 for each partner -->
    </IRS1065>
  </ReturnData>
</Return>
```

### Form 1041 (Estate/Trust)

```xml
<Return>
  <ReturnHeader>
    <TaxYr>2025</TaxYr>
    <ReturnTypeCd>1041</ReturnTypeCd>
    <TaxPeriodEndDt>2025-12-31</TaxPeriodEndDt>
    <Filer>
      <EIN>XX-XXXXXXX</EIN>
      <Name>...</Name>
      <TypeOfEntity>                         <!-- Required -->
        <SimpleTrust/> | <ComplexTrust/> | <DecedentEstate/>
      </TypeOfEntity>
    </Filer>
  </ReturnHeader>
  <ReturnData>
    <IRS1041>...</IRS1041>
  </ReturnData>
</Return>
```

### Form 941 (Quarterly Employment)

```xml
<Return>
  <ReturnHeader>
    <TaxYr>2026</TaxYr>
    <ReturnTypeCd>941</ReturnTypeCd>
    <Quarter>1</Quarter>                     <!-- Required: 1, 2, 3, or 4 -->
    <Filer>
      <EIN>XX-XXXXXXX</EIN>
      <BusinessName>...</BusinessName>
    </Filer>
  </ReturnHeader>
  <ReturnData>
    <IRS941>
      <NumberOfEmployees>...</NumberOfEmployees>
      <WagesAmt>...</WagesAmt>                <!-- Required -->
      <TaxableSSWagesAmt>...</TaxableSSWagesAmt>
      <TaxableMedicareWagesAmt>...</TaxableMedicareWagesAmt>
    </IRS941>
  </ReturnData>
</Return>
```

### Form 7004 (Extension)

```xml
<Return>
  <ReturnHeader>
    <TaxYr>2025</TaxYr>
    <ReturnTypeCd>7004</ReturnTypeCd>
    <Filer>
      <EIN>XX-XXXXXXX</EIN>
      <BusinessName>...</BusinessName>
    </Filer>
  </ReturnHeader>
  <ReturnData>
    <IRS7004>
      <FormCode>1120</FormCode>              <!-- Required: Form being extended -->
      <TentativeTax>...</TentativeTax>
      <TotalPayments>...</TotalPayments>
    </IRS7004>
  </ReturnData>
</Return>
```

---

## Validation Rules Summary

### Critical (Reject if Missing)

| Rule ID | Description | Forms |
|---------|-------------|-------|
| R0001 | XML Declaration Required | All |
| R0002 | Return Element Required | All |
| R0003 | ReturnHeader Required | All |
| R0004 | TaxYear Required | All |
| R0005 | TaxYear Valid Range | All |
| IND-001 | Primary SSN Required | 1040, 1040-SR, 1040-NR |
| IND-002 | SSN Format Valid | 1040, 1040-SR, 1040-NR |
| IND-003 | Filing Status Required | 1040, 1040-SR, 1040-NR |
| CORP-001 | EIN Required | 1120, 1120-S, 1120-H |
| CORP-002 | Business Name Required | 1120, 1120-S, 1120-H |
| CORP-003 | Tax Period End Date | 1120, 1120-S |
| EMP-001 | Quarter Indicator | 941, 943 |
| EMP-002 | Wages Reported | 940, 941, 943, 944, 945 |

### Warnings (Alert but Allow)

| Rule ID | Description | Forms |
|---------|-------------|-------|
| CORP-004 | S-Corp Election Date | 1120-S |
| PTNR-002 | Partner K-1 Information | 1065 |
| EXT-002 | Tentative Tax Amount | 7004 |
| EMP-003 | Employee Count | 941, 944 |

---

## ATS Test SSN Ranges

For ATS (Assurance Testing System) testing, use these SSN ranges:

| Range | Description |
|-------|-------------|
| 900-00-0001 to 999-99-9999 | Valid test SSNs |
| 987-65-4320 to 987-65-4329 | Reserved for specific test scenarios |

**Note:** Test SSNs starting with `9` will be **rejected** in Production.

---

## Schema File Locations

After downloading the full XSD schemas from IRS e-file:

```
schemas/
├── TY2025/
│   ├── Common/
│   │   ├── efileTypes.xsd
│   │   ├── efileCommon.xsd
│   │   └── ReturnHeader.xsd
│   ├── 1040/
│   │   ├── IRS1040.xsd
│   │   └── IRS1040Schedule*.xsd
│   ├── 1120/
│   │   ├── IRS1120.xsd
│   │   └── IRS1120Schedule*.xsd
│   └── ...
└── TY2026/
    └── ...
```

---

## Resources

- **IRS MeF Website:** https://www.irs.gov/e-file-providers/modernized-e-file-mef-internet-transmitter-provider
- **Publication 4164:** MeF Business Rules
- **Publication 4600:** MeF Schema Guide
- **ATS Website:** https://la.alt.www4.irs.gov/

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-28 | Initial schema reference |
