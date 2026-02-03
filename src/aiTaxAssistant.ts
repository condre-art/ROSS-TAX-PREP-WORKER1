/**
 * AI TAX ASSISTANT - E-FILE FLOW GUIDANCE
 * Provides intelligent, context-aware assistance during tax return preparation and transmission
 * Supports all IRS forms for 2025 tax year
 */

import { v4 as uuid } from 'uuid';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AIAssistantContext {
  user_id: number;
  return_id?: number;
  current_form?: string;
  current_step?: string;
  return_data?: any;
  session_id: string;
  created_at: string;
}

export interface AIAssistantMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  form_context?: string;
  suggestions?: string[];
  created_at: string;
}

export interface AIAssistantResponse {
  message: string;
  suggestions: string[];
  next_step?: string;
  validation_errors?: string[];
  tax_tip?: string;
  form_help?: string;
}

export interface FormGuidance {
  form_name: string;
  description: string;
  when_to_use: string;
  common_errors: string[];
  tips: string[];
  related_forms: string[];
}

// ============================================================================
// AI TAX ASSISTANT CLASS
// ============================================================================

export class AITaxAssistant {
  private env: any;
  private context: AIAssistantContext;

  constructor(env: any, context: AIAssistantContext) {
    this.env = env;
    this.context = context;
  }

  /**
   * Process user question and provide intelligent response
   */
  async ask(question: string): Promise<AIAssistantResponse> {
    console.log(`[AI Assistant] Processing question for session ${this.context.session_id}`);

    // Store user message
    await this.storeMessage('user', question);

    // Analyze question intent
    const intent = this.analyzeIntent(question);

    // Generate response based on intent
    let response: AIAssistantResponse;

    switch (intent.type) {
      case 'form_help':
        response = await this.provideFormHelp(intent.form || this.context.current_form);
        break;
      case 'calculation':
        response = await this.helpWithCalculation(intent.field);
        break;
      case 'deduction':
        response = await this.explainDeduction(intent.deduction);
        break;
      case 'credit':
        response = await this.explainCredit(intent.credit);
        break;
      case 'income_reporting':
        response = await this.helpWithIncome(intent.income_type);
        break;
      case 'efile_status':
        response = await this.checkEFileStatus();
        break;
      case 'general':
      default:
        response = await this.provideGeneralHelp(question);
    }

    // Store assistant response
    await this.storeMessage('assistant', response.message, response.suggestions);

    return response;
  }

  /**
   * Provide guidance for specific form
   */
  async provideFormHelp(formName?: string): Promise<AIAssistantResponse> {
    if (!formName) {
      return {
        message: "Which form do you need help with? I can assist with Form 1040, W-2, 1099s, Schedules 1-3, and many more.",
        suggestions: [
          "Help with Form 1040",
          "Help with Schedule 1",
          "Help with W-2 income",
          "Help with 1099-NEC income"
        ]
      };
    }

    const guidance = this.getFormGuidance(formName);
    
    return {
      message: `**${guidance.form_name}**\n\n${guidance.description}\n\n**When to use:** ${guidance.when_to_use}`,
      suggestions: guidance.tips.slice(0, 3),
      form_help: guidance.tips.join('\n'),
      tax_tip: guidance.common_errors[0]
    };
  }

  /**
   * Help with tax calculations
   */
  async helpWithCalculation(field?: string): Promise<AIAssistantResponse> {
    const currentForm = this.context.current_form || '1040';
    
    if (currentForm === '1040') {
      return {
        message: "I can help you calculate:\n• Total Income (Line 9)\n• Adjusted Gross Income (Line 11)\n• Taxable Income (Line 15)\n• Total Tax (Line 24)\n• Refund or Amount Owed",
        suggestions: [
          "Calculate my total income",
          "Calculate my AGI",
          "Calculate my taxable income",
          "What's my tax bracket?"
        ],
        tax_tip: "Pro tip: Maximize deductions on Schedule 1 to reduce your AGI"
      };
    }

    return {
      message: `Let me help you with calculations for ${currentForm}. What would you like to calculate?`,
      suggestions: ["Show calculation steps", "Explain this line item", "Why this amount?"]
    };
  }

  /**
   * Explain deductions
   */
  async explainDeduction(deductionType?: string): Promise<AIAssistantResponse> {
    const deductions: Record<string, any> = {
      'standard': {
        description: 'Standard Deduction for 2025',
        amounts: {
          'single': '$15,000',
          'married_filing_jointly': '$30,000',
          'head_of_household': '$22,500'
        },
        tip: 'Most taxpayers benefit from the standard deduction'
      },
      'student_loan_interest': {
        description: 'Student Loan Interest Deduction (Form 1040 Schedule 1 Line 21)',
        max_amount: '$2,500',
        tip: 'You can deduct up to $2,500 of interest paid on qualified student loans'
      },
      'hsa': {
        description: 'Health Savings Account (HSA) Deduction (Form 1040 Schedule 1 Line 13)',
        limits_2025: {
          'self_only': '$4,300',
          'family': '$8,550'
        },
        tip: 'HSA contributions are pre-tax and grow tax-free'
      },
      'ira': {
        description: 'IRA Deduction (Form 1040 Schedule 1 Line 20)',
        limits_2025: '$7,000 ($8,000 if age 50+)',
        tip: 'Traditional IRA contributions may be tax-deductible'
      }
    };

    const deduction = deductions[deductionType || 'standard'];

    return {
      message: `**${deduction.description}**\n\n${JSON.stringify(deduction.amounts || deduction.limits_2025 || deduction.max_amount, null, 2)}`,
      suggestions: [
        "Am I eligible for this deduction?",
        "How do I claim this?",
        "Show me other deductions"
      ],
      tax_tip: deduction.tip
    };
  }

  /**
   * Explain tax credits
   */
  async explainCredit(creditType?: string): Promise<AIAssistantResponse> {
    const credits: Record<string, any> = {
      'eitc': {
        name: 'Earned Income Tax Credit (EITC)',
        max_2025: '$8,046 (3+ children)',
        schedule: 'Schedule EIC',
        tip: 'EITC is refundable - you can get money back even if you owe no tax'
      },
      'ctc': {
        name: 'Child Tax Credit (CTC)',
        amount_2025: '$2,000 per qualifying child',
        refundable_portion: '$1,700',
        tip: 'Children must be under age 17 at end of tax year'
      },
      'education': {
        name: 'Education Credits (Form 8863)',
        types: ['American Opportunity Credit: $2,500', 'Lifetime Learning Credit: $2,000'],
        tip: 'You can claim education credits for college expenses'
      },
      'saver': {
        name: "Saver's Credit (Form 8880)",
        amount: 'Up to $1,000 ($2,000 married)',
        tip: 'Credit for low to moderate income taxpayers who save for retirement'
      }
    };

    const credit = credits[creditType || 'eitc'];

    return {
      message: `**${credit.name}**\n\nMax Credit: ${credit.max_2025 || credit.amount_2025 || credit.amount}\n\n${credit.tip}`,
      suggestions: [
        "Check if I qualify",
        "How to claim this credit",
        "Show me other credits"
      ],
      tax_tip: credit.tip
    };
  }

  /**
   * Help with income reporting
   */
  async helpWithIncome(incomeType?: string): Promise<AIAssistantResponse> {
    const incomeGuides: Record<string, any> = {
      'w2': {
        form: 'Form W-2',
        where_to_enter: 'Form 1040 Line 1',
        boxes_needed: 'Boxes 1, 2, 16, 17, 19',
        tip: 'Enter wages from Box 1 of all W-2 forms'
      },
      '1099nec': {
        form: 'Form 1099-NEC',
        where_to_enter: 'Schedule C (if self-employed)',
        boxes_needed: 'Box 1 - Nonemployee compensation',
        tip: '1099-NEC is for independent contractor income - you may owe self-employment tax'
      },
      '1099int': {
        form: 'Form 1099-INT',
        where_to_enter: 'Form 1040 Schedule B (if over $1,500)',
        boxes_needed: 'Box 1 - Interest income',
        tip: 'Report all interest income, even if under $1,500'
      },
      '1099div': {
        form: 'Form 1099-DIV',
        where_to_enter: 'Form 1040 Schedule B',
        boxes_needed: 'Box 1a - Ordinary dividends, Box 1b - Qualified dividends',
        tip: 'Qualified dividends get preferential tax rates'
      },
      '1098': {
        form: 'Form 1098',
        where_to_enter: 'Schedule A (if itemizing)',
        boxes_needed: 'Box 1 - Mortgage interest',
        tip: 'Mortgage interest is deductible if you itemize'
      },
      '1098t': {
        form: 'Form 1098-T',
        where_to_enter: 'Form 8863 (for education credits)',
        boxes_needed: 'Box 1 - Payments received',
        tip: 'Use 1098-T to claim education credits'
      }
    };

    const guide = incomeGuides[incomeType || 'w2'];

    return {
      message: `**${guide.form}**\n\n📍 **Where to enter:** ${guide.where_to_enter}\n📋 **Boxes needed:** ${guide.boxes_needed}\n\n💡 **Tip:** ${guide.tip}`,
      suggestions: [
        "How to enter this income",
        "Do I need to report this?",
        "What if I don't have this form?"
      ],
      tax_tip: guide.tip
    };
  }

  /**
   * Check e-file status
   */
  async checkEFileStatus(): Promise<AIAssistantResponse> {
    if (!this.context.return_id) {
      return {
        message: "You haven't started a tax return yet. Would you like to begin?",
        suggestions: ["Start new return", "Import prior year", "Get help choosing"]
      };
    }

    // Query return status
    const returnStatus = await this.env.DB.prepare(
      'SELECT status, irs_submission_id, ack_code FROM efile_transmissions WHERE return_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(this.context.return_id).first();

    if (!returnStatus) {
      return {
        message: "Your return is in progress but hasn't been transmitted yet.",
        suggestions: [
          "Review return before filing",
          "Check for errors",
          "Ready to e-file"
        ],
        next_step: "review"
      };
    }

    const statusMessages: Record<string, string> = {
      'pending': '⏳ Your return is queued for transmission',
      'transmitting': '📤 Your return is being transmitted to the IRS',
      'accepted': '✅ Your return was accepted by the IRS!',
      'rejected': '❌ Your return was rejected. Let me help you fix it.',
      'error': '⚠️ There was an error. Let me help troubleshoot.',
      'completed': '🎉 Your return is complete!'
    };

    return {
      message: statusMessages[returnStatus.status] || 'Checking status...',
      suggestions: [
        returnStatus.status === 'accepted' ? "When will I get my refund?" : "What do I do next?",
        "View return details",
        "Contact support"
      ],
      next_step: returnStatus.status === 'rejected' ? 'fix_errors' : returnStatus.status === 'accepted' ? 'track_refund' : 'wait'
    };
  }

  /**
   * Provide general help
   */
  async provideGeneralHelp(question: string): Promise<AIAssistantResponse> {
    const lowerQuestion = question.toLowerCase();

    // Pattern matching for common questions
    if (lowerQuestion.includes('refund')) {
      return {
        message: "💰 **Refund Status**\n\nAfter the IRS accepts your return:\n• E-file with direct deposit: 21 days\n• Paper return: 6-8 weeks\n• Check 'Where's My Refund' on IRS.gov",
        suggestions: [
          "Estimate my refund",
          "Why is my refund delayed?",
          "Add direct deposit"
        ],
        tax_tip: "E-file with direct deposit is the fastest way to get your refund"
      };
    }

    if (lowerQuestion.includes('deadline') || lowerQuestion.includes('due date')) {
      return {
        message: "📅 **2025 Tax Deadlines**\n\n• April 15, 2026: Individual returns (Form 1040)\n• March 15, 2026: S-Corps & Partnerships\n• October 15, 2026: Extended deadline",
        suggestions: [
          "File extension (Form 4868)",
          "What if I can't pay?",
          "Late filing penalties"
        ],
        tax_tip: "File on time even if you can't pay to avoid late filing penalties"
      };
    }

    if (lowerQuestion.includes('amend')) {
      return {
        message: "📝 **Amending Your Return (Form 1040-X)**\n\nYou can file an amended return if you need to correct:\n• Income amounts\n• Filing status\n• Deductions or credits\n\nMust file within 3 years of original return",
        suggestions: [
          "Start amended return",
          "What can I amend?",
          "How long does it take?"
        ]
      };
    }

    // Default general response
    return {
      message: "I'm your AI Tax Assistant! I can help you with:\n\n📋 Form guidance (1040, W-2, 1099s, etc.)\n💰 Income & deduction questions\n🧮 Tax calculations\n📤 E-file status\n💡 Tax tips & strategies",
      suggestions: [
        "Help with Form 1040",
        "Maximize my refund",
        "Check e-file status",
        "Common tax deductions"
      ],
      tax_tip: "Ask me anything about your tax return - I'm here to help!"
    };
  }

  /**
   * Analyze question intent
   */
  private analyzeIntent(question: string): any {
    const lower = question.toLowerCase();

    // Form-specific questions
    if (lower.includes('form') || lower.includes('1040') || lower.includes('schedule')) {
      const formMatch = question.match(/\b(1040|1099|w-?2|1098|schedule [1-3a-z]|8863|8880)\b/i);
      return { type: 'form_help', form: formMatch ? formMatch[0] : null };
    }

    // Calculation questions
    if (lower.includes('calculate') || lower.includes('how much') || lower.includes('total')) {
      return { type: 'calculation', field: lower };
    }

    // Deduction questions
    if (lower.includes('deduction') || lower.includes('deduct')) {
      return { type: 'deduction', deduction: this.extractDeductionType(lower) };
    }

    // Credit questions
    if (lower.includes('credit') || lower.includes('eitc') || lower.includes('ctc')) {
      return { type: 'credit', credit: this.extractCreditType(lower) };
    }

    // Income questions
    if (lower.includes('income') || lower.includes('w-2') || lower.includes('1099')) {
      return { type: 'income_reporting', income_type: this.extractIncomeType(lower) };
    }

    // E-file status
    if (lower.includes('status') || lower.includes('accepted') || lower.includes('rejected')) {
      return { type: 'efile_status' };
    }

    return { type: 'general' };
  }

  private extractDeductionType(text: string): string {
    if (text.includes('student loan')) return 'student_loan_interest';
    if (text.includes('hsa') || text.includes('health savings')) return 'hsa';
    if (text.includes('ira') || text.includes('retirement')) return 'ira';
    return 'standard';
  }

  private extractCreditType(text: string): string {
    if (text.includes('eitc') || text.includes('earned income')) return 'eitc';
    if (text.includes('ctc') || text.includes('child tax')) return 'ctc';
    if (text.includes('education') || text.includes('college')) return 'education';
    if (text.includes('saver')) return 'saver';
    return 'eitc';
  }

  private extractIncomeType(text: string): string {
    if (text.includes('w-2') || text.includes('w2') || text.includes('wages')) return 'w2';
    if (text.includes('1099-nec') || text.includes('1099nec')) return '1099nec';
    if (text.includes('1099-int') || text.includes('interest')) return '1099int';
    if (text.includes('1099-div') || text.includes('dividend')) return '1099div';
    if (text.includes('1098') && !text.includes('t')) return '1098';
    if (text.includes('1098-t') || text.includes('1098t')) return '1098t';
    return 'w2';
  }

  /**
   * Get form-specific guidance
   */
  private getFormGuidance(formName: string): FormGuidance {
    const guides: Record<string, FormGuidance> = {
      '1040': {
        form_name: 'Form 1040 - U.S. Individual Income Tax Return',
        description: 'The main form for reporting personal income and calculating federal income tax.',
        when_to_use: 'All U.S. citizens and residents file Form 1040 annually.',
        common_errors: [
          'Math errors on income calculations',
          'Missing signature',
          'Wrong filing status',
          'Forgetting to attach W-2s'
        ],
        tips: [
          'Double-check all Social Security numbers',
          'Review all income sources',
          'Choose correct filing status',
          'Sign and date the return'
        ],
        related_forms: ['Schedule 1', 'Schedule 2', 'Schedule 3', 'W-2', '1099']
      },
      'schedule1': {
        form_name: 'Schedule 1 - Additional Income and Adjustments to Income',
        description: 'Report additional income and claim adjustments (above-the-line deductions).',
        when_to_use: 'When you have income beyond W-2 wages or qualify for adjustments like IRA deductions or student loan interest.',
        common_errors: [
          'Forgetting self-employment income',
          'Not claiming eligible deductions',
          'Incorrect HSA deduction amounts'
        ],
        tips: [
          'Part I: Report ALL additional income',
          'Part II: Claim all eligible adjustments',
          'Keep receipts for HSA and IRA contributions',
          'Report unemployment compensation'
        ],
        related_forms: ['Schedule C', 'Schedule E', 'Form 8889 (HSA)']
      },
      'w2': {
        form_name: 'Form W-2 - Wage and Tax Statement',
        description: 'Reports wages paid and taxes withheld by your employer.',
        when_to_use: 'Issued by your employer if you earned $600 or more.',
        common_errors: [
          'Not waiting for all W-2s before filing',
          'Entering Box 1 (wages) incorrectly',
          'Missing state/local income'
        ],
        tips: [
          'Box 1 = Federal wages (goes to 1040 Line 1)',
          'Box 2 = Federal tax withheld',
          'Box 16/17/18/19 = State wages and withholding',
          'Attach Copy B to your return'
        ],
        related_forms: ['Form 1040', 'Schedule 1']
      },
      '1099nec': {
        form_name: 'Form 1099-NEC - Nonemployee Compensation',
        description: 'Reports income paid to independent contractors and freelancers.',
        when_to_use: 'If you received $600+ as a non-employee (freelancer, contractor, gig worker).',
        common_errors: [
          'Not reporting 1099-NEC income',
          'Forgetting self-employment tax',
          'Not claiming business expenses'
        ],
        tips: [
          'Report Box 1 income on Schedule C',
          'You may owe self-employment tax (Schedule SE)',
          'Deduct business expenses on Schedule C',
          'Set aside 25-30% for taxes'
        ],
        related_forms: ['Schedule C', 'Schedule SE', 'Form 1040']
      }
    };

    return guides[formName.toLowerCase()] || guides['1040'];
  }

  /**
   * Store conversation message
   */
  private async storeMessage(role: 'user' | 'assistant', content: string, suggestions?: string[]): Promise<void> {
    if (!this.env.DB) return;

    try {
      await this.env.DB.prepare(`
        INSERT INTO ai_assistant_messages (id, session_id, role, content, form_context, suggestions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        uuid(),
        this.context.session_id,
        role,
        content,
        this.context.current_form || null,
        suggestions ? JSON.stringify(suggestions) : null
      ).run();
    } catch (error) {
      console.error('[AI Assistant] Failed to store message:', error);
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(limit: number = 20): Promise<AIAssistantMessage[]> {
    const rows = await this.env.DB.prepare(
      'SELECT * FROM ai_assistant_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(this.context.session_id, limit).all();

    return rows.results as AIAssistantMessage[];
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createAITaxAssistant(env: any, userId: number, sessionId?: string, returnId?: number): AITaxAssistant {
  const context: AIAssistantContext = {
    user_id: userId,
    return_id: returnId,
    session_id: sessionId || uuid(),
    created_at: new Date().toISOString()
  };

  return new AITaxAssistant(env, context);
}
