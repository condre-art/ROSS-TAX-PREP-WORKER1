# 🔄 Data Migration Quick Start

## Your Old Software Data

Extracted from: `C:\Users\condr\Downloads\converson data.zip`

**18 files found:**
- Client reports (PDFs)
- Username reports (PDFs)
- Fee reports (PDFs)
- Mailing labels (Word docs)
- IRS acknowledgements (PDFs)

---

## ✅ Step 1: Export Data from Old Software

### Option A: Direct CSV Export (Recommended)
1. Open your old tax software
2. Go to **Reports** → **Export**
3. Export these reports as **CSV**:
   - **Client List** → Save as `clients.csv`
   - **User/Staff List** → Save as `staff.csv`
   - **Returns Filed** → Save as `returns.csv`
   - **Fees/Payments** → Save as `fees.csv`

4. Save all CSVs to: `migration-data/csv/`

### Option B: Manual Data Entry (If No CSV Export)
1. Open the PDF reports in `migration-data/`
2. Copy data from PDFs into the CSV templates in `migration-data/csv/`
3. Use templates:
   - `clients_TEMPLATE.csv` - Copy to `clients.csv`
   - `staff_TEMPLATE.csv` - Copy to `staff.csv`
   - `returns_TEMPLATE.csv` - Copy to `returns.csv`
   - `fees_TEMPLATE.csv` - Copy to `fees.csv`

---

## ✅ Step 2: Generate SQL Import File

Once your CSVs are ready:

```bash
cd migration-data
node import.js
```

This generates `import.sql` with all your data ready to import.

---

## ✅ Step 3: Import into D1 Database

```bash
npx wrangler d1 execute ross-tax-prep-db --file=migration-data/import.sql
```

This will:
- Import all clients
- Import all staff (temp password: `TempPassword123!`)
- Import all returns
- Import all fees

---

## 📊 What Gets Migrated

### Clients Table
- Name, email, phone
- SSN (encrypted)
- Address
- Account creation date

### Staff Table
- Name, email, role (admin/staff)
- Temporary password (must reset on first login)
- Account creation date

### Returns Table (if applicable)
- Client ID (linked)
- Tax year, return type (1040, 1120, etc.)
- Status (filed, pending, rejected)
- Date filed

### Fees Table (if applicable)
- Client ID (linked)
- Service description
- Amount, payment status
- Payment date

---

## 🔒 Security Notes

- **SSNs**: Stored with proper encryption
- **Passwords**: All imported staff get temporary password
- **Email**: All staff notified to reset password
- **Data**: Backed up before import

---

## 📋 CSV Format Examples

### clients.csv
```csv
name,email,phone,ssn,address
John Doe,john@example.com,555-1234,XXX-XX-1234,"123 Main St, City, ST 12345"
```

### staff.csv
```csv
name,email,role
Admin User,admin@rosstaxprep.com,admin
Tax Preparer,preparer@rosstaxprep.com,staff
```

### returns.csv
```csv
client_name,tax_year,return_type,status,date_filed
John Doe,2024,1040,filed,2025-04-10
```

### fees.csv
```csv
client_name,service,amount,paid,date
John Doe,Tax Preparation,350.00,yes,2025-04-10
```

---

## 🚨 Before You Import

1. ✅ Backup your current D1 database
2. ✅ Review generated `import.sql` file
3. ✅ Test import on staging environment first
4. ✅ Notify staff about password resets

---

## 🛠️ Troubleshooting

### "CSV file not found"
- Make sure CSVs are in `migration-data/csv/`
- Remove `_TEMPLATE` from filename

### "Client not found" for returns/fees
- Import clients.csv FIRST
- Check spelling of client names matches exactly

### Duplicate entries
- Script skips duplicates automatically
- Check import.sql for any errors

---

## 📞 Need Help?

If you have questions or need a custom import script for specific data formats, let me know!

**Current Status:** CSV templates ready in `migration-data/csv/`
