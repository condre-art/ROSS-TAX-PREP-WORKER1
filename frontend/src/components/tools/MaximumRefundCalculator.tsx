import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Zap,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-react';

interface DeductionItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  supported: boolean;
}

interface RefundCalculation {
  gross_income: number;
  filing_status: string;
  dependents: number;
  standard_deduction: number;
  itemized_deductions: number;
  capital_gains: number;
  capital_losses: number;
  qualified_dividends: number;
  education_credits: number;
  child_tax_credit: number;
  eitc: number;
  other_credits: number;
  federal_withheld: number;
  estimated_payments: number;
  state_local_taxes: number;
  mortgage_interest: number;
  charitable_contributions: number;
  medical_expenses: number;
  student_loan_interest: number;
}

const STANDARD_DEDUCTIONS: Record<string, number> = {
  'single': 14600,
  'married_joint': 29200,
  'married_separate': 14600,
  'head_of_household': 21900,
  'qualifying_widow': 29200
};

const ESTIMATED_TAX_BRACKETS: Record<string, any[]> = {
  'single': [
    { min: 0, max: 11000, rate: 0.10 },
    { min: 11000, max: 44725, rate: 0.12 },
    { min: 44725, max: 95375, rate: 0.22 },
    { min: 95375, max: 182100, rate: 0.24 },
    { min: 182100, max: 231250, rate: 0.32 },
    { min: 231250, max: 578125, rate: 0.35 },
    { min: 578125, max: Infinity, rate: 0.37 }
  ],
  'married_joint': [
    { min: 0, max: 22000, rate: 0.10 },
    { min: 22000, max: 89075, rate: 0.12 },
    { min: 89075, max: 190750, rate: 0.22 },
    { min: 190750, max: 364200, rate: 0.24 },
    { min: 364200, max: 462500, rate: 0.32 },
    { min: 462500, max: 693750, rate: 0.35 },
    { min: 693750, max: Infinity, rate: 0.37 }
  ]
};

export const MaximumRefundCalculator: React.FC = () => {
  const [filingStatus, setFilingStatus] = useState<'single' | 'married_joint' | 'head_of_household'>('single');
  const [grossIncome, setGrossIncome] = useState(50000);
  const [dependents, setDependents] = useState(0);
  const [federalWithheld, setFederalWithheld] = useState(5000);
  const [estimatedPayments, setEstimatedPayments] = useState(0);
  const [deductions, setDeductions] = useState<DeductionItem[]>([
    { id: '1', category: 'Mortgage Interest', description: 'Home loan interest', amount: 0, supported: true },
    { id: '2', category: 'Charitable', description: 'Donations', amount: 0, supported: true },
    { id: '3', category: 'State/Local Taxes', description: 'Property & income taxes', amount: 0, supported: true }
  ]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['summary']);
  const [selectedDeduction, setSelectedDeduction] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const addDeduction = () => {
    const newDeduction: DeductionItem = {
      id: Date.now().toString(),
      category: 'Other',
      description: 'New deduction',
      amount: 0,
      supported: true
    };
    setDeductions([...deductions, newDeduction]);
  };

  const removeDeduction = (id: string) => {
    setDeductions(deductions.filter(d => d.id !== id));
  };

  const updateDeduction = (id: string, field: string, value: any) => {
    setDeductions(deductions.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  // Calculate maximum refund
  const calculation = useMemo(() => {
    const standardDed = STANDARD_DEDUCTIONS[filingStatus];
    const totalItemized = deductions.reduce((sum, d) => sum + (d.supported ? d.amount : 0), 0);
    const deductionToUse = Math.max(standardDed, totalItemized);

    // Taxable income
    const taxableIncome = Math.max(0, grossIncome - deductionToUse);

    // Estimate federal tax (simplified)
    let federalTax = 0;
    const brackets = ESTIMATED_TAX_BRACKETS[filingStatus] || ESTIMATED_TAX_BRACKETS['single'];
    let remaining = taxableIncome;
    
    for (const bracket of brackets) {
      const taxableInBracket = Math.min(remaining, Math.max(0, bracket.max - bracket.min));
      federalTax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
      if (remaining <= 0) break;
    }

    // Child Tax Credit (2024: $2,000 per child)
    const childCredit = dependents * 2000;

    // EITC estimation (simplified for demonstration)
    let eitc = 0;
    if (grossIncome < 40000 && dependents > 0) {
      eitc = Math.min(3733, grossIncome * 0.40);
    } else if (grossIncome < 25000) {
      eitc = Math.min(560, grossIncome * 0.076);
    }

    // Total credits
    const totalCredits = childCredit + eitc;

    // Net tax liability
    const taxLiability = Math.max(0, federalTax - totalCredits);

    // Total payments
    const totalPaid = federalWithheld + estimatedPayments;

    // Calculate refund or amount owed
    const refund = Math.max(0, totalPaid - taxLiability);
    const amountOwed = Math.max(0, taxLiability - totalPaid);

    return {
      grossIncome,
      standardDed,
      itemizedDed: totalItemized,
      deductionToUse,
      taxableIncome,
      federalTax,
      childCredit,
      eitc,
      totalCredits,
      taxLiability,
      totalPaid,
      refund,
      amountOwed,
      effectiveRate: taxLiability > 0 ? (taxLiability / grossIncome * 100) : 0
    };
  }, [filingStatus, grossIncome, dependents, federalWithheld, estimatedPayments, deductions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4">
              <Calculator className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Maximum Refund Calculator</h1>
          <p className="text-gray-600 text-lg">State-of-the-art tax optimization & refund estimation</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Information</h2>

            {/* Filing Status */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filing Status
              </label>
              <select
                value={filingStatus}
                onChange={e => setFilingStatus(e.target.value as any)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                <option value="single">Single</option>
                <option value="married_joint">Married Filing Jointly</option>
                <option value="head_of_household">Head of Household</option>
              </select>
            </div>

            {/* Gross Income */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gross Income
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={grossIncome}
                  onChange={e => setGrossIncome(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Dependents */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Dependents
              </label>
              <input
                type="number"
                min="0"
                value={dependents}
                onChange={e => setDependents(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Federal Withholding */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Federal Withheld (from paychecks)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={federalWithheld}
                  onChange={e => setFederalWithheld(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Estimated Payments */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estimated Tax Payments
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={estimatedPayments}
                  onChange={e => setEstimatedPayments(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="border-t-2 border-gray-200 pt-4">
              <p className="text-xs text-gray-600 text-center">
                💡 Adjust values above to see refund changes
              </p>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Refund Summary Card */}
          <div className={`rounded-xl shadow-lg p-8 ${
            calculation.refund > 0
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
              : calculation.amountOwed > 0
              ? 'bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200'
              : 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200'
          }`}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                {calculation.refund > 0 ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <p className="text-gray-700 font-semibold">Estimated Refund</p>
                  </>
                ) : calculation.amountOwed > 0 ? (
                  <>
                    <AlertCircle className="w-8 h-8 text-orange-600" />
                    <p className="text-gray-700 font-semibold">Amount Owed</p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-8 h-8 text-blue-600" />
                    <p className="text-gray-700 font-semibold">No Refund/Amount Due</p>
                  </>
                )}
              </div>
              <p className={`text-5xl font-bold ${
                calculation.refund > 0
                  ? 'text-green-600'
                  : calculation.amountOwed > 0
                  ? 'text-orange-600'
                  : 'text-blue-600'
              }`}>
                ${calculation.refund > 0 ? calculation.refund : calculation.amountOwed}
              </p>
            </div>
          </div>

          {/* Deductions Section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('deductions')}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold flex items-center justify-between hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              <span className="flex items-center gap-2">
                📊 Deductions & Credits
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform ${
                expandedSections.includes('deductions') ? 'rotate-180' : ''
              }`} />
            </button>

            {expandedSections.includes('deductions') && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase font-semibold">Standard Deduction</p>
                    <p className="text-2xl font-bold text-blue-600">${calculation.standardDed.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase font-semibold">Your Itemized</p>
                    <p className="text-2xl font-bold text-green-600">${calculation.itemizedDed.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Using:</p>
                  <p className="text-3xl font-bold text-purple-600">
                    ${calculation.deductionToUse.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {calculation.itemizedDed > calculation.standardDed ? '✓ Itemized is better!' : '✓ Standard deduction is better'}
                  </p>
                </div>

                {/* User Deductions */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Adjust Your Deductions</h4>
                  {deductions.map(ded => (
                    <div key={ded.id} className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={ded.amount}
                        onChange={e => updateDeduction(ded.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={ded.description}
                        onChange={e => updateDeduction(ded.id, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => removeDeduction(ded.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addDeduction}
                    className="w-full mt-2 border-2 border-dashed border-gray-300 rounded-lg py-2 text-gray-600 font-semibold hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Add Deduction
                  </button>
                </div>

                {/* Credits */}
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200 space-y-2">
                  <p className="font-semibold text-gray-900">Credits Calculated</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Child Tax Credit</p>
                      <p className="font-bold text-green-600">${calculation.childCredit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">EITC</p>
                      <p className="font-bold text-green-600">${calculation.eitc.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tax Calculation Breakdown */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('breakdown')}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold flex items-center justify-between hover:from-indigo-700 hover:to-indigo-800 transition-all"
            >
              <span className="flex items-center gap-2">
                📈 Tax Calculation
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform ${
                expandedSections.includes('breakdown') ? 'rotate-180' : ''
              }`} />
            </button>

            {expandedSections.includes('breakdown') && (
              <div className="p-6 space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Gross Income</span>
                  <span className="font-semibold">${calculation.grossIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Deduction</span>
                  <span className="font-semibold">-${calculation.deductionToUse.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-gray-300 bg-gray-50 px-3 rounded">
                  <span className="text-gray-700 font-semibold">Taxable Income</span>
                  <span className="font-bold">${calculation.taxableIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Estimated Tax</span>
                  <span className="font-semibold">${calculation.federalTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Total Credits</span>
                  <span className="font-semibold text-green-600">-${calculation.totalCredits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 bg-red-50 px-3 rounded border border-red-200">
                  <span className="text-gray-700 font-semibold">Tax Liability</span>
                  <span className="font-bold text-red-600">${calculation.taxLiability.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Total Paid (Withholding + Est.)</span>
                  <span className="font-semibold">${calculation.totalPaid.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between py-3 px-3 rounded font-bold text-lg ${
                  calculation.refund > 0
                    ? 'bg-green-50 border-2 border-green-300 text-green-700'
                    : 'bg-orange-50 border-2 border-orange-300 text-orange-700'
                }`}>
                  <span>{calculation.refund > 0 ? 'YOUR REFUND' : 'AMOUNT OWED'}</span>
                  <span>${(calculation.refund || calculation.amountOwed).toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-600 pt-2">
                  <p>Effective Tax Rate: <strong>{calculation.effectiveRate.toFixed(2)}%</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Tips */}
      <div className="max-w-6xl mx-auto mt-8 bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <Zap className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900">Deduction Strategy</h3>
              <p className="text-sm text-gray-600 mt-1">Compare standard vs. itemized deductions to maximize your refund</p>
            </div>
          </div>
          <div className="flex gap-3">
            <TrendingUp className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900">Optimize Credits</h3>
              <p className="text-sm text-gray-600 mt-1">Utilize all eligible credits including child tax credit and EITC</p>
            </div>
          </div>
          <div className="flex gap-3">
            <HelpCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900">Expert Guidance</h3>
              <p className="text-sm text-gray-600 mt-1">Connect with our tax professionals for personalized advice</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-6xl mx-auto mt-8 text-center text-sm text-gray-600">
        <p>This calculator provides estimates based on 2024 tax rules. Consult a tax professional for accurate filing.</p>
      </div>
    </div>
  );
};

export default MaximumRefundCalculator;
