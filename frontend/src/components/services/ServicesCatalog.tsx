import React, { useState, useMemo } from 'react';
import {
  FileText,
  DollarSign,
  Search,
  Filter,
  Check,
  Star,
  ShoppingCart,
  Tag,
  ChevronDown
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  popular: boolean;
  included_in?: string[];
  features: string[];
  estimated_time: string;
  availability: 'in_stock' | 'limited' | 'on_demand';
}

// 89 Ross Tax Prep Services & Products
const SERVICES_CATALOG: Service[] = [
  // ==================== INDIVIDUAL TAX RETURNS (20 services) ====================
  { id: '1', name: 'Form 1040 - Basic Federal Return', category: 'Individual Tax Returns', description: 'Simple tax return filing for individuals with basic income sources', price: 49.99, popular: true, features: ['W-2 income', 'Standard deduction', 'Basic credits'], estimated_time: '1-2 days', availability: 'in_stock' },
  { id: '2', name: 'Form 1040 - With Itemized Deductions', category: 'Individual Tax Returns', description: 'Federal return with itemized deductions (mortgage, charity, medical)', price: 79.99, popular: true, features: ['Itemized deductions', 'Mortgage interest', 'Charitable donations'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '3', name: 'Form 1040 - Self-Employment Income', category: 'Individual Tax Returns', description: 'Returns for freelancers, contractors, and small business owners', price: 99.99, popular: true, features: ['Schedule C', 'Self-employment tax', 'Quarterly ES tax planning'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '4', name: 'Form 1040 - Investment Income', category: 'Individual Tax Returns', description: 'Returns with capital gains, dividends, and investment income', price: 89.99, popular: false, features: ['Schedule D (capital gains)', 'Dividend reporting', 'Investment loss carryforwards'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '5', name: 'Form 1040 - Rental Property Income', category: 'Individual Tax Returns', description: 'Filing for landlords with rental property income and expenses', price: 109.99, popular: false, features: ['Schedule E (rental)', 'Depreciation tracking', 'Passive loss limitations'], estimated_time: '3 days', availability: 'in_stock' },
  { id: '6', name: 'Form 1040 - Multiple Dependents', category: 'Individual Tax Returns', description: 'Returns claiming multiple dependents with child credits', price: 69.99, popular: true, features: ['Child tax credit', 'CTC optimization', 'Multiple dependent calculations'], estimated_time: '2 days', availability: 'in_stock' },
  { id: '7', name: 'Form 1040-SR - Senior Citizen Return', category: 'Individual Tax Returns', description: 'Simplified return for seniors 65+ with enhanced standard deduction', price: 59.99, popular: false, features: ['Higher standard deduction', 'Senior-specific credits', 'Medicare planning'], estimated_time: '1-2 days', availability: 'in_stock' },
  { id: '8', name: 'Form 1040-NR - Nonresident Alien Return', category: 'Individual Tax Returns', description: 'Filing for non-US residents with US income', price: 149.99, popular: false, features: ['ITIN application', 'Foreign income exclusion', 'FIRPTA compliance'], estimated_time: '3-5 days', availability: 'on_demand' },
  { id: '9', name: 'Form 1040-X - Amended Return (Single Year)', category: 'Individual Tax Returns', description: 'Amending a previously filed individual tax return', price: 79.99, popular: false, features: ['Error correction', 'Omitted income reporting', 'Refund calculation'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '10', name: 'Form 1040-X - Amended Return (Multiple Years)', category: 'Individual Tax Returns', description: 'Amending multiple prior-year tax returns', price: 199.99, popular: false, features: ['Multi-year amendments', 'Statute of limitations review', 'Coordinated refunds'], estimated_time: '5-7 days', availability: 'in_stock' },

  // ==================== BUSINESS TAX RETURNS (15 services) ====================
  { id: '11', name: 'Form 1120 - C Corporation Return', category: 'Business Tax Returns', description: 'Federal income tax return for C corporations', price: 199.99, popular: true, features: ['Corporate tax calculation', 'Estimated payments', 'K-1 distributions'], estimated_time: '3-5 days', availability: 'in_stock' },
  { id: '12', name: 'Form 1120-S - S Corporation Return', category: 'Business Tax Returns', description: 'Return for S corporations with pass-through taxation', price: 179.99, popular: true, features: ['Schedule K-1 preparation', 'Shareholder reporting', 'Built-in gains tax'], estimated_time: '3-5 days', availability: 'in_stock' },
  { id: '13', name: 'Form 1065 - Partnership Return', category: 'Business Tax Returns', description: 'Tax return for general and limited partnerships', price: 189.99, popular: false, features: ['Schedule K-1 for partners', 'Loss limitation rules', 'Guaranteed payments'], estimated_time: '3-5 days', availability: 'in_stock' },
  { id: '14', name: 'Form 1065-B - Check-the-Box Entity Return', category: 'Business Tax Returns', description: 'Return for LLC and other check-the-box entities', price: 169.99, popular: true, features: ['Entity classification', 'Pass-through taxation', 'Partner K-1s'], estimated_time: '3 days', availability: 'in_stock' },
  { id: '15', name: 'Form 1041 - Estate & Trust Return', category: 'Business Tax Returns', description: 'Federal income tax return for estates and trusts', price: 219.99, popular: false, features: ['Fiduciary accounting', 'K-1 distribution schedule', 'Charitable deductions'], estimated_time: '4-6 days', availability: 'in_stock' },
  { id: '16', name: 'Form 1120H - Cooperative Association Return', category: 'Business Tax Returns', description: 'Return for agricultural and farmers cooperatives', price: 179.99, popular: false, features: ['Patronage dividends', 'Per-unit retain allocations', 'Cooperative tax rules'], estimated_time: '4 days', availability: 'on_demand' },
  { id: '17', name: 'Multi-State Business Tax Return Filing', category: 'Business Tax Returns', description: 'Filing in 2+ states with nexus and apportionment', price: 249.99, popular: false, features: ['Nexus analysis', 'Apportionment calculation', 'State-specific forms'], estimated_time: '5-7 days', availability: 'in_stock' },
  { id: '18', name: 'Franchise Tax Return Filing', category: 'Business Tax Returns', description: 'State franchise/privilege tax return preparation', price: 99.99, popular: false, features: ['State franchise calculation', 'Minimum tax analysis', 'Multi-state franchise planning'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '19', name: 'Business Estimated Quarterly Tax Planning', category: 'Business Tax Returns', description: 'Calculate and set up quarterly ES tax payments', price: 129.99, popular: true, features: ['Q1-Q4 calculation', 'Penalty avoidance analysis', 'Payment schedule'], estimated_time: '1-2 days', availability: 'in_stock' },
  { id: '20', name: 'Business Tax Planning & Optimization', category: 'Business Tax Returns', description: 'Strategic tax planning to minimize business tax liability', price: 299.99, popular: true, features: ['Entity structure review', 'Income timing strategies', 'Deduction optimization'], estimated_time: '2-3 days', availability: 'in_stock' },

  // ==================== PAYROLL & EMPLOYMENT TAX (12 services) ====================
  { id: '21', name: 'Form 941 - Quarterly Payroll Tax Return', category: 'Payroll & Employment Tax', description: 'Quarterly federal payroll tax return filing', price: 99.99, popular: true, features: ['Wage calculations', 'FICA/Medicare', 'Tax deposit liability'], estimated_time: '1 day', availability: 'in_stock' },
  { id: '22', name: 'Form 940 - Annual Unemployment Tax Return', category: 'Payroll & Employment Tax', description: 'Annual FUTA (Federal Unemployment Tax Act) return', price: 79.99, popular: true, features: ['FUTA tax calculation', 'State experience rates', 'Annual reconciliation'], estimated_time: '1 day', availability: 'in_stock' },
  { id: '23', name: 'Form 943 - Agricultural Payroll Return', category: 'Payroll & Employment Tax', description: 'Annual payroll return for agricultural employers', price: 89.99, popular: false, features: ['Agricultural wage reporting', 'FICA exemptions', 'Special rules'], estimated_time: '1 day', availability: 'on_demand' },
  { id: '24', name: 'Form 944 - Small Employer Payroll Return', category: 'Payroll & Employment Tax', description: 'Annual payroll return for employers under $1,000 FICA annually', price: 69.99, popular: false, features: ['Annual filing option', 'Payroll reconciliation', 'Amended 941-X'], estimated_time: '1 day', availability: 'in_stock' },
  { id: '25', name: 'Form 945 - Nonemployee Compensation Return', category: 'Payroll & Employment Tax', description: 'Annual return for backup withholding on nonemployee income', price: 59.99, popular: false, features: ['Backup withholding', '1099 reconciliation', 'Nonemployee reporting'], estimated_time: '1 day', availability: 'on_demand' },
  { id: '26', name: 'W-2 / 1099 Annual Filing (All Employees)', category: 'Payroll & Employment Tax', description: 'Federal and state W-2 and 1099 form preparation and filing', price: 149.99, popular: true, features: ['W-2 production', '1099 preparation', 'SSA filing', 'State filing'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '27', name: 'Payroll Setup & Processing (Per Month)', category: 'Payroll & Employment Tax', description: 'Monthly payroll processing service including calculations', price: 149.99, popular: false, features: ['Salary/wage calculation', 'Tax withholding', 'Direct deposit setup'], estimated_time: 'Monthly', availability: 'in_stock' },
  { id: '28', name: 'Year-End Payroll Reconciliation', category: 'Payroll & Employment Tax', description: 'Complete year-end payroll verification and reconciliation', price: 199.99, popular: true, features: ['Reconciliation review', 'Adjustment analysis', 'W-2 prep coordination'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '29', name: 'State Unemployment Insurance (SUI) Filing', category: 'Payroll & Employment Tax', description: 'State unemployment insurance return and quarterly reporting', price: 79.99, popular: true, features: ['State SUI filing', 'Quarterly reporting', 'Rate calculation'], estimated_time: '1 day', availability: 'in_stock' },
  { id: '30', name: 'Employee Classification Audit & Review', category: 'Payroll & Employment Tax', description: 'Audit of employee vs independent contractor classification', price: 179.99, popular: false, features: ['ABC test analysis', 'Reclassification planning', 'Wage & hour compliance'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '31', name: 'Payroll Tax Notice & Penalty Resolution', category: 'Payroll & Employment Tax', description: 'Professional response to IRS/state payroll tax notices', price: 249.99, popular: false, features: ['Notice analysis', 'Penalty abatement', 'Payment arrangements'], estimated_time: '3-5 days', availability: 'in_stock' },
  { id: '32', name: 'ERC Tax Credit Claim & Documentation', category: 'Payroll & Employment Tax', description: 'Employee Retention Credit calculation and IRS Form 3115 filing', price: 399.99, popular: true, features: ['ERC qualification analysis', 'Credit calculation', 'Payroll documentation', 'IRS filing'], estimated_time: '5 days', availability: 'in_stock' },

  // ==================== BOOKKEEPING & ACCOUNTING (18 services) ====================
  { id: '33', name: 'Monthly Bookkeeping Service', category: 'Bookkeeping & Accounting', description: 'Complete monthly bookkeeping and financial record maintenance', price: 199.99, popular: true, features: ['Transaction recording', 'Bank reconciliation', 'P&L statements'], estimated_time: 'Monthly', availability: 'in_stock' },
  { id: '34', name: 'Quarterly Financial Statements & Reports', category: 'Bookkeeping & Accounting', description: 'Prepare quarterly financial statements and analysis reports', price: 249.99, popular: true, features: ['Balance sheet', 'Income statement', 'Cash flow analysis'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '35', name: 'Annual Financial Statements (Reviewed)', category: 'Bookkeeping & Accounting', description: 'Annual compiled financial statements for lending/reporting', price: 349.99, popular: true, features: ['Compilation review', 'Balance sheet', 'Income statement', 'Notes to statements'], estimated_time: '4-5 days', availability: 'in_stock' },
  { id: '36', name: 'Accounts Payable Management', category: 'Bookkeeping & Accounting', description: 'Management of vendor invoices, payments, and aging reports', price: 149.99, popular: false, features: ['Invoice processing', 'Payment scheduling', 'Vendor management'], estimated_time: 'Ongoing', availability: 'in_stock' },
  { id: '37', name: 'Accounts Receivable Management', category: 'Bookkeeping & Accounting', description: 'Invoice tracking, collections, and aging analysis', price: 149.99, popular: false, features: ['Invoice management', 'Collection tracking', 'Aging reports'], estimated_time: 'Ongoing', availability: 'in_stock' },
  { id: '38', name: 'QuickBooks Setup & Configuration', category: 'Bookkeeping & Accounting', description: 'Complete QuickBooks setup, chart of accounts, and training', price: 199.99, popular: true, features: ['Account setup', 'Chart of accounts', 'User access', 'Training'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '39', name: 'QuickBooks Migration (From Other Software)', category: 'Bookkeeping & Accounting', description: 'Migrate existing accounting data to QuickBooks', price: 249.99, popular: false, features: ['Data import', 'Account mapping', 'Reconciliation'], estimated_time: '3-5 days', availability: 'in_stock' },
  { id: '40', name: 'QuickBooks Reconciliation & Cleanup', category: 'Bookkeeping & Accounting', description: 'Fix QuickBooks errors and reconcile all accounts', price: 279.99, popular: true, features: ['Error correction', 'Account reconciliation', 'Report accuracy'], estimated_time: '3-5 days', availability: 'in_stock' },
  { id: '41', name: 'Bank & Credit Card Reconciliation', category: 'Bookkeeping & Accounting', description: 'Monthly reconciliation of all bank and credit accounts', price: 79.99, popular: true, features: ['Bank matching', 'Outstanding transactions', 'Monthly verification'], estimated_time: '1 day', availability: 'in_stock' },
  { id: '42', name: 'Expense Categorization & Analysis', category: 'Bookkeeping & Accounting', description: 'Review and proper categorization of business expenses', price: 149.99, popular: false, features: ['Expense analysis', 'Category optimization', 'Deduction identification'], estimated_time: '2 days', availability: 'in_stock' },
  { id: '43', name: 'Payroll Integration & Processing', category: 'Bookkeeping & Accounting', description: 'Integration of payroll data with accounting software', price: 179.99, popular: true, features: ['Payroll posting', 'Expense allocation', 'Tax withholding'], estimated_time: 'Ongoing', availability: 'in_stock' },
  { id: '44', name: 'Inventory Tracking & Valuation', category: 'Bookkeeping & Accounting', description: 'Setup and maintenance of inventory records and valuation', price: 199.99, popular: false, features: ['Inventory setup', 'Cost tracking', 'Valuation methods'], estimated_time: 'Ongoing', availability: 'in_stock' },
  { id: '45', name: 'Cost of Goods Sold (COGS) Analysis', category: 'Bookkeeping & Accounting', description: 'Calculate and analyze COGS for gross margin reporting', price: 129.99, popular: true, features: ['COGS calculation', 'Margin analysis', 'Pricing insights'], estimated_time: '1-2 days', availability: 'in_stock' },
  { id: '46', name: 'Annual Accounting Close & Adjustments', category: 'Bookkeeping & Accounting', description: 'Year-end closing process with accruals and adjustments', price: 249.99, popular: true, features: ['Accrual entries', 'Depreciation', 'Closing entries'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '47', name: 'Fixed Asset Management & Tracking', category: 'Bookkeeping & Accounting', description: 'Depreciation schedules and fixed asset tracking', price: 179.99, popular: false, features: ['Asset schedule', 'Depreciation calculation', 'Disposal tracking'], estimated_time: '2 days', availability: 'in_stock' },
  { id: '48', name: 'Multi-Location Accounting Setup', category: 'Bookkeeping & Accounting', description: 'Setup accounting for multiple business locations', price: 299.99, popular: false, features: ['Multi-entity setup', 'Consolidation', 'Location reporting'], estimated_time: '3-5 days', availability: 'in_stock' },
  { id: '49', name: 'Cloud Accounting Software Training', category: 'Bookkeeping & Accounting', description: 'Training on cloud accounting software (QBO, Xero, Freshbooks)', price: 149.99, popular: false, features: ['Software training', 'Best practices', 'User guides'], estimated_time: '2-3 hours', availability: 'in_stock' },
  { id: '50', name: 'Month-End Financial Review Call', category: 'Bookkeeping & Accounting', description: 'Monthly consultation to review financial performance', price: 99.99, popular: true, features: ['Financial review', 'Performance analysis', 'Recommendations'], estimated_time: '1 hour', availability: 'in_stock' },

  // ==================== TAX STRATEGY & PLANNING (12 services) ====================
  { id: '51', name: 'Personal Tax Planning Consultation', category: 'Tax Strategy & Planning', description: 'Strategic consultation to minimize personal income tax', price: 199.99, popular: true, features: ['Tax analysis', 'Strategy recommendations', 'Action plan'], estimated_time: '1-2 hours', availability: 'in_stock' },
  { id: '52', name: 'Business Tax Planning & Strategy Session', category: 'Tax Strategy & Planning', description: 'Comprehensive business tax planning and optimization', price: 299.99, popular: true, features: ['Entity structure review', 'Income timing', 'Deduction optimization'], estimated_time: '2-3 hours', availability: 'in_stock' },
  { id: '53', name: 'Entity Structure Analysis (LLC vs S-Corp vs C-Corp)', category: 'Tax Strategy & Planning', description: 'Determine optimal business entity structure for tax purposes', price: 249.99, popular: true, features: ['Structure comparison', 'Tax projection', 'Recommendation'], estimated_time: '2 hours', availability: 'in_stock' },
  { id: '54', name: 'S-Corp Election Planning & Implementation', category: 'Tax Strategy & Planning', description: 'Evaluate and implement S-Corp election for tax savings', price: 199.99, popular: true, features: ['Savings analysis', 'Form 2553 filing', 'W-2 wage guidance'], estimated_time: '2 days', availability: 'in_stock' },
  { id: '55', name: 'Retirement Planning with Tax Efficiency', category: 'Tax Strategy & Planning', description: 'Retirement account strategy to minimize taxes', price: 199.99, popular: true, features: ['Contribution optimization', 'Distribution planning', 'Tax-advantaged accounts'], estimated_time: '1-2 hours', availability: 'in_stock' },
  { id: '56', name: 'Capital Gains Tax Planning', category: 'Tax Strategy & Planning', description: 'Strategy to minimize capital gains tax on investments', price: 179.99, popular: true, features: ['Gain/loss timing', 'Wash sale analysis', 'Long-term strategy'], estimated_time: '1.5 hours', availability: 'in_stock' },
  { id: '57', name: 'Charitable Giving Strategy', category: 'Tax Strategy & Planning', description: 'Tax-efficient charitable donation strategies', price: 149.99, popular: false, features: ['Donation optimization', 'DAF analysis', 'Deduction maximization'], estimated_time: '1 hour', availability: 'in_stock' },
  { id: '58', name: 'Home Office Deduction Analysis', category: 'Tax Strategy & Planning', description: 'Determine best home office deduction method', price: 99.99, popular: true, features: ['Regular vs simplified', 'Deduction calculation', 'Documentation guide'], estimated_time: '1 hour', availability: 'in_stock' },
  { id: '59', name: 'Estimated Quarterly Tax Planning (1 Year)', category: 'Tax Strategy & Planning', description: 'Plan and set quarterly estimated tax payments', price: 129.99, popular: true, features: ['Projection', 'Payment schedule', 'Penalty avoidance'], estimated_time: '1-2 days', availability: 'in_stock' },
  { id: '60', name: 'Multi-Year Tax Strategy Planning', category: 'Tax Strategy & Planning', description: '3-5 year tax minimization roadmap', price: 499.99, popular: false, features: ['Multi-year analysis', 'Strategy roadmap', 'Annual reviews'], estimated_time: '3-4 hours', availability: 'in_stock' },
  { id: '61', name: 'Tax Loss Harvesting Strategy', category: 'Tax Strategy & Planning', description: 'Strategy to realize investment losses for tax benefits', price: 149.99, popular: true, features: ['Loss identification', 'Wash sale guidance', 'Timing strategy'], estimated_time: '1 hour', availability: 'in_stock' },
  { id: '62', name: 'Passive Activity Loss (PAL) Analysis', category: 'Tax Strategy & Planning', description: 'Analysis and planning for passive activity losses', price: 179.99, popular: false, features: ['PAL calculation', 'Grouping analysis', 'Deduction planning'], estimated_time: '1.5 hours', availability: 'in_stock' },

  // ==================== IRS REPRESENTATION & RESOLUTION (8 services) ====================
  { id: '63', name: 'IRS Notice Response & Representation', category: 'IRS Representation & Resolution', description: 'Professional response to IRS notices and correspondence', price: 249.99, popular: true, features: ['Notice analysis', 'IRS response', 'Representation'], estimated_time: '3-5 days', availability: 'in_stock' },
  { id: '64', name: 'Audit Representation (Full Service)', category: 'IRS Representation & Resolution', description: 'Full representation before IRS for audit examination', price: 499.99, popular: true, features: ['Audit defense', 'IRS meetings', 'Documentation', 'Resolution'], estimated_time: 'Varies', availability: 'in_stock' },
  { id: '65', name: 'Amended Return & Refund Claim (1040-X)', category: 'IRS Representation & Resolution', description: 'Professional amended return filing for refunds', price: 149.99, popular: true, features: ['Error correction', 'Refund optimization', 'IRS filing'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '66', name: 'Tax Penalty Abatement & Appeals', category: 'IRS Representation & Resolution', description: 'Penalty reduction and IRS appeals representation', price: 299.99, popular: true, features: ['Penalty analysis', 'Abatement request', 'Appeal preparation'], estimated_time: '3-5 days', availability: 'in_stock' },
  { id: '67', name: 'Back Tax Return Preparation (10 Years)', category: 'IRS Representation & Resolution', description: 'Prepare unfiled back tax returns up to 10 years', price: 199.99, popular: false, features: ['Back return prep', 'Late filing protection', 'Penalty reduction'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '68', name: 'IRS Payment Arrangement (Installment Agreement)', category: 'IRS Representation & Resolution', description: 'Negotiate and setup IRS payment plan', price: 199.99, popular: true, features: ['Arrangement negotiation', 'Payment setup', 'Ongoing monitoring'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '69', name: 'Offer in Compromise (IRS Settlement)', category: 'IRS Representation & Resolution', description: 'Negotiate settlement of large IRS tax debt', price: 799.99, popular: false, features: ['Offer preparation', 'Documentation', 'IRS negotiation'], estimated_time: '4-8 weeks', availability: 'on_demand' },
  { id: '70', name: 'Tax Debt Resolution Consultation', category: 'IRS Representation & Resolution', description: '1-hour consultation on IRS tax debt resolution options', price: 99.99, popular: true, features: ['Debt analysis', 'Option review', 'Action plan'], estimated_time: '1 hour', availability: 'in_stock' },

  // ==================== NOTARY & AUTHENTICATION SERVICES (8 services) ====================
  { id: '71', name: 'Notary Public - Single Document (Texas)', category: 'Notary Public Services', description: 'Texas notary public certification for one document', price: 15.00, popular: true, features: ['Signature notarization', 'Identity verification', 'Seal & signature'], estimated_time: '15 min', availability: 'in_stock' },
  { id: '72', name: 'Notary Public - Multiple Documents (Texas)', category: 'Notary Public Services', description: 'Texas notary for 2+ documents (discounted per document)', price: 45.00, popular: false, features: ['Multiple signatures', 'Bulk discounts', 'Same-day service'], estimated_time: '30-45 min', availability: 'in_stock' },
  { id: '73', name: 'Notary Public - Single Document (Arkansas)', category: 'Notary Public Services', description: 'Arkansas notary public certification for one document', price: 15.00, popular: true, features: ['AR notarization', 'Witness certification', 'Seal & signature'], estimated_time: '15 min', availability: 'in_stock' },
  { id: '74', name: 'Notary Public - Multiple Documents (Arkansas)', category: 'Notary Public Services', description: 'Arkansas notary for 2+ documents (discounted rate)', price: 45.00, popular: false, features: ['Multiple AR documents', 'Volume discounts', 'Expedited'], estimated_time: '30-45 min', availability: 'in_stock' },
  { id: '75', name: 'Notary Public - Single Document (Louisiana)', category: 'Notary Public Services', description: 'Louisiana notary certification with civil law requirements', price: 20.00, popular: true, features: ['LA notarization', 'Civil law compliance', 'Official seal'], estimated_time: '20 min', availability: 'in_stock' },
  { id: '76', name: 'Notary Public - Multiple Documents (Louisiana)', category: 'Notary Public Services', description: 'Louisiana notary for multiple documents', price: 55.00, popular: false, features: ['LA bulk service', 'Civil law expertise', 'Fast turnaround'], estimated_time: '45 min - 1 hour', availability: 'in_stock' },
  { id: '77', name: 'Remote Video Notary (eNotary) Service', category: 'Notary Public Services', description: 'Remote notarization via secure video for all states', price: 25.00, popular: true, features: ['Video conference', 'Identity verification', 'eNotary seal'], estimated_time: '20 min', availability: 'in_stock' },
  { id: '78', name: 'Mobile Notary Service (In-Home/Office)', category: 'Notary Public Services', description: 'Notary travels to client location', price: 50.00, popular: false, features: ['Travel service', 'Flexible hours', 'Multiple documents'], estimated_time: '1 hour + travel', availability: 'in_stock' },

  // ==================== TAX EDUCATION & TEXTBOOKS (6 services) ====================
  { id: '79', name: 'Individual Income Tax Course Textbook (Student Edition)', category: 'Tax Education & Textbooks', description: 'Comprehensive individual income tax study guide - student pricing', price: 29.99, popular: true, features: ['Course materials', 'Study guide', 'Practice problems'], estimated_time: 'Self-paced', availability: 'in_stock' },
  { id: '80', name: 'Individual Income Tax Course Textbook (Teacher Edition)', category: 'Tax Education & Textbooks', description: 'Teacher edition with solutions and answer keys', price: 49.99, popular: false, features: ['Full solutions', 'Answer keys', 'Teaching guides'], estimated_time: 'Self-paced', availability: 'in_stock' },
  { id: '81', name: 'Business Tax Fundamentals Textbook (Student Edition)', category: 'Tax Education & Textbooks', description: 'Business tax and entity taxation student textbook', price: 34.99, popular: true, features: ['Business tax topics', 'Case studies', 'Worksheets'], estimated_time: 'Self-paced', availability: 'in_stock' },
  { id: '82', name: 'Business Tax Fundamentals Textbook (Teacher Edition)', category: 'Tax Education & Textbooks', description: 'Teacher edition with teaching materials', price: 54.99, popular: false, features: ['Solutions manual', 'Lecture notes', 'Test materials'], estimated_time: 'Self-paced', availability: 'in_stock' },
  { id: '83', name: 'Tax Professional Reference Guide 2025', category: 'Tax Education & Textbooks', description: 'Comprehensive tax reference for professionals', price: 69.99, popular: true, features: ['Complete reference', 'Forms reference', 'IRS rules summary'], estimated_time: 'Reference', availability: 'in_stock' },
  { id: '84', name: 'Digital Tax Course Bundle (Student License)', category: 'Tax Education & Textbooks', description: '3-course bundle (individual, business, payroll) digital access', price: 79.99, popular: true, features: ['3 courses', 'Digital access', '6-month license'], estimated_time: 'Self-paced', availability: 'in_stock' },

  // ==================== PROFESSIONAL SERVICES & MISC (5 services) ====================
  { id: '85', name: 'PTIN Renewal & Registration Support', category: 'Professional Services', description: 'Assistance with PTIN renewal and preparer registration', price: 79.99, popular: true, features: ['PTIN application', 'Form 8949-D prep', 'IRS submission'], estimated_time: '1-2 days', availability: 'in_stock' },
  { id: '86', name: 'ERO Software Consulting & Setup', category: 'Professional Services', description: 'Setup and training for Electronic Return Originator software', price: 199.99, popular: false, features: ['Software setup', 'Test transmission', 'E-file training'], estimated_time: '2-3 days', availability: 'in_stock' },
  { id: '87', name: 'Tax Return Review & Quality Control (Per Return)', category: 'Professional Services', description: 'Peer review of tax returns for accuracy and compliance', price: 99.99, popular: true, features: ['Detailed review', 'Error identification', 'Compliance check'], estimated_time: '1-2 hours', availability: 'in_stock' },
  { id: '88', name: 'Extended Appointment/Document Retention Services', category: 'Professional Services', description: 'Secure storage and retrieval of tax documents up to 10 years', price: 99.99, popular: false, features: ['Secure storage', '10-year retention', 'Retrieval service'], estimated_time: 'Annual', availability: 'in_stock' },
  { id: '89', name: 'Tax Software Comparison & Recommendation Consultation', category: 'Professional Services', description: '1-hour consultation on selecting optimal tax software', price: 79.99, popular: false, features: ['Software review', 'Cost analysis', 'Recommendation'], estimated_time: '1 hour', availability: 'in_stock' }
];

export const ServicesCatalog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'popular'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = Array.from(new Set(SERVICES_CATALOG.map(s => s.category)));

  const filteredServices = useMemo(() => {
    let result = SERVICES_CATALOG;

    if (searchQuery) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      result = result.filter(s => s.category === selectedCategory);
    }

    // Sort
    if (sortBy === 'price') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Tax Preparation Services Catalog</h1>
          </div>
          <p className="text-emerald-100 text-lg">89 comprehensive tax, bookkeeping, and professional services</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Services</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory || ''}
                onChange={e => setSelectedCategory(e.target.value || null)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort & View */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value="popular">Popular</option>
                <option value="name">A-Z</option>
                <option value="price">Price</option>
              </select>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
              >
                {viewMode === 'grid' ? '≡ List' : '⊞ Grid'}
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing <strong>{filteredServices.length}</strong> of <strong>{SERVICES_CATALOG.length}</strong> services
          </div>
        </div>

        {/* Services Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => (
              <div key={service.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 border-b-2 border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {service.category}
                    </span>
                    {service.popular && (
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{service.name}</h3>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  <p className="text-sm text-gray-600">{service.description}</p>

                  {/* Features */}
                  <div className="space-y-1">
                    {service.features.slice(0, 2).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>{feat}</span>
                      </div>
                    ))}
                    {service.features.length > 2 && (
                      <p className="text-xs text-gray-500 italic">+{service.features.length - 2} more features</p>
                    )}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Starting at</p>
                      <p className="text-2xl font-bold text-emerald-600">${service.price.toFixed(2)}</p>
                    </div>
                    <button className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors group-hover:shadow-lg">
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Availability */}
                  <div className="text-xs text-gray-600">
                    {service.availability === 'in_stock' && (
                      <span className="text-green-600 font-semibold">✓ In Stock</span>
                    )}
                    {service.availability === 'limited' && (
                      <span className="text-yellow-600 font-semibold">⚠ Limited Availability</span>
                    )}
                    {service.availability === 'on_demand' && (
                      <span className="text-blue-600 font-semibold">→ On-Demand</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold">Service Name</th>
                  <th className="px-6 py-4 text-left font-bold">Category</th>
                  <th className="px-6 py-4 text-right font-bold">Price</th>
                  <th className="px-6 py-4 text-center font-bold">Popular</th>
                  <th className="px-6 py-4 text-center font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service, idx) => (
                  <tr key={service.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{service.category}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">${service.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      {service.popular && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-emerald-400">89</p>
            <p className="text-gray-400 mt-2">Total Services</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-emerald-400">10+</p>
            <p className="text-gray-400 mt-2">Categories</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-emerald-400">$15</p>
            <p className="text-gray-400 mt-2">Starting Price</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-emerald-400">24/7</p>
            <p className="text-gray-400 mt-2">Support</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesCatalog;
