# Data Migration from Old Tax Software

## Overview
Converting data from old tax preparation software PDFs to Ross Tax Prep system.

## Source Files
Located in: `migration-data/`

### Client & User Data
- `Username Report-Print.pdf` - User accounts
- `Client Retention Report-Print.pdf` - Client list
- `mailinglabels.docx` - Client contact info

### Financial Data
- `Fees Charged-Print (14).pdf` - Fee schedule
- `Fees Charged-Print (15).pdf` - Additional fees
- `Old Fee Deposits-Print (2).pdf` - Payment history

### Returns & Filing Data
- `1_28_2026 -- Federal Returns Transmitted with No State-Print.pdf` - E-file transmissions
- `1_28_2026 -- Inventory Report-Print.pdf` - Returns inventory
- `Old IRS Acknowledgements-Print.pdf` - IRS acks

### Compliance Data
- `EIN Report-Print.pdf` - Business EINs
- `IP PIN Report-Print.pdf` - Identity Protection PINs
- `Dependents_Qualifying Child report-Print.pdf` - Dependent data

### Other Reports
- `Marketing Report-Print.pdf` - Marketing data
- `Review Report-Print.pdf` - Review status
- `akn.pdf` - Acknowledgements

---

## Migration Strategy

### Phase 1: Manual Data Export
Since source data is in PDF format, you have two options:

**Option A: Export from Old Software (Recommended)**
1. Open old tax software
2. Export to CSV/Excel format:
   - Clients list (name, email, phone, SSN)
   - User accounts (username, role, email)
   - Returns filed (client, year, type, status)
   - Fees/payments (client, amount, date, method)
3. Save CSV files to `migration-data/csv/`

**Option B: PDF Parsing (Complex)**
Use Python with pdfplumber or similar to extract tables from PDFs

### Phase 2: Database Import
Once CSV files are available, import into D1:

```sql
-- Import clients
INSERT INTO clients (name, email, phone, ssn, created_at)
SELECT name, email, phone, ssn, NOW() FROM csv_clients;

-- Import staff/users
INSERT INTO staff (name, email, role, password_hash, created_at)
SELECT name, email, 'preparer', 'TEMP_PASSWORD', NOW() FROM csv_users;

-- Import returns
INSERT INTO returns (client_id, tax_year, return_type, status, created_at)
SELECT client_id, year, type, status, NOW() FROM csv_returns;

-- Import fees
INSERT INTO fees (client_id, return_id, amount, status, created_at)
SELECT client_id, return_id, amount, 'paid', NOW() FROM csv_fees;
```

---

## Quick Start: Manual CSV Creation

If old software doesn't export, create CSVs manually from PDFs:

### 1. Create `clients.csv`
```csv
name,email,phone,ssn,address
John Doe,john@example.com,555-1234,XXX-XX-1234,123 Main St
Jane Smith,jane@example.com,555-5678,XXX-XX-5678,456 Oak Ave
```

### 2. Create `staff.csv`
```csv
name,email,role
Admin User,admin@rosstaxprep.com,admin
Tax Preparer,preparer@rosstaxprep.com,staff
```

### 3. Create `returns.csv`
```csv
client_name,tax_year,return_type,status,date_filed
John Doe,2024,1040,filed,2025-04-10
Jane Smith,2024,1040,pending,2025-04-12
```

### 4. Create `fees.csv`
```csv
client_name,service,amount,paid,date
John Doe,Tax Preparation,350.00,yes,2025-04-10
Jane Smith,Tax Preparation,275.00,no,2025-04-12
```

---

## Import Tool (Once CSVs Ready)

I'll create a Node.js script to import CSVs into D1:

```bash
node migration-data/import.js
```

This will:
1. Parse CSVs
2. Validate data
3. Insert into D1 database
4. Generate report of imported records
5. Handle duplicates/errors

---

## Next Steps

1. **Extract data from old software** (CSV export if possible)
2. **Place CSVs in** `migration-data/csv/`
3. **Run import script** `node migration-data/import.js`
4. **Verify imported data** in CRM at `/crm`

---

## Need Help?

If you can provide:
- Screenshots of the PDF data
- Or CSV exports from old software
- Or database access to old system

I can create a custom automated migration script.
