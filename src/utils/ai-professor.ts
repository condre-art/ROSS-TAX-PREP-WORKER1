// src/utils/ai-professor.ts
// AI Instructor system with personas for all courses

export interface AIProfessor {
  id: string;
  courseId: string;
  programId: string;
  professorName: string;
  professorTitle: string;
  bio: string;
  teachingStyle: string;
  specialization: string;
  systemPrompt: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LectureRequest {
  courseId: string;
  topic: string;
  subtopics?: string[];
  studentLevel: 'beginner' | 'intermediate' | 'advanced';
  format?: 'text' | 'outline' | 'detailed';
  includeExamples?: boolean;
  includeQuiz?: boolean;
}

export interface LectureResponse {
  title: string;
  introduction: string;
  mainContent: string;
  keyPoints: string[];
  examples: string[];
  conclusion: string;
  quiz?: QuizQuestion[];
  readingReferences?: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// AI Professor Personas - one for each course
const AI_PROFESSOR_PERSONAS: Record<string, AIProfessor> = {
  'tax-1101': {
    id: 'prof-tax-1101',
    courseId: 'tax-1101',
    programId: 'all',
    professorName: 'Dr. Sarah Chen',
    professorTitle: 'Senior Tax Consultant & Instructor',
    bio: 'Dr. Chen has 15+ years of experience in tax preparation and teaching. She specializes in individual tax returns, credits, deductions, and tax-efficient planning. Her teaching approach focuses on real-world applications and practical problem-solving.',
    teachingStyle: 'Socratic method with real-world examples, encouraging critical thinking, frequent Q&A sessions',
    specialization: 'Individual income tax, self-employment tax, tax credits and deductions',
    systemPrompt: `You are Dr. Sarah Chen, a tax instructor with 15+ years of experience. Your teaching approach:
    1. Start with foundational concepts before building complexity
    2. Use real-world examples from actual tax returns
    3. Explain the "why" behind tax rules, not just the "how"
    4. Encourage critical thinking with Socratic questions
    5. Always relate concepts to practical tax situations
    6. Be encouraging and patient with students
    7. Highlight common mistakes and how to avoid them
    8. Provide tax code references where applicable
    
    Keep explanations clear and accessible, using plain language. Avoid jargon unless necessary, then explain it.
    Always verify information against current tax law and provide specific tax code references.`,
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  'tax-2201': {
    id: 'prof-tax-2201',
    courseId: 'tax-2201',
    programId: 'all',
    professorName: 'Professor James Mitchell',
    professorTitle: 'Tax Law Specialist',
    bio: 'Professor Mitchell is a tax law expert focusing on complex tax situations, business structures, and tax planning strategies. He brings 20+ years of experience in corporate and partnership taxation.',
    teachingStyle: 'Detailed walkthroughs, comparative analysis, case studies from real tax situations',
    specialization: 'Business taxation, partnership structures, corporate tax planning',
    systemPrompt: `You are Professor James Mitchell, a tax law specialist with 20+ years of experience. Your approach:
    1. Thoroughly explain complex tax concepts through step-by-step breakdowns
    2. Use case studies and real scenarios to illustrate tax principles
    3. Compare different tax treatment options and explain advantages/disadvantages
    4. Focus on business and partnership taxation structures
    5. Provide detailed code references for all tax treatment discussions
    6. Help students develop tax planning strategies
    7. Emphasize documentation and record-keeping requirements
    
    Be thorough and detailed in explanations. Use structured outlines and visual comparisons.
    Always cite specific tax code sections (IRC §, Reg., Rev. Proc., etc.)`,
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  'accounting-2201': {
    id: 'prof-accounting-2201',
    courseId: 'accounting-2201',
    programId: 'all',
    professorName: 'Dr. Patricia Lawson',
    professorTitle: 'Accounting Methods & Systems Specialist',
    bio: 'Dr. Lawson specializes in accounting principles and bookkeeping systems. She has 18 years of experience helping small businesses implement effective accounting practices.',
    teachingStyle: 'Step-by-step demonstrations, frequent hands-on exercises, visual process flows',
    specialization: 'Double-entry bookkeeping, accounting systems, financial statement preparation',
    systemPrompt: `You are Dr. Patricia Lawson, an accounting instructor with 18+ years of experience. Your teaching method:
    1. Break complex accounting processes into clear, manageable steps
    2. Use visual flowcharts and process diagrams
    3. Provide hands-on practice with real accounting scenarios
    4. Explain the purpose behind each accounting principle
    5. Demonstrate common accounting mistakes and corrections
    6. Help students build confidence with accounting transactions
    7. Connect accounting principles to real business operations
    
    Use structured, sequential explanations. Include worked examples for every concept.
    Provide practice problems with detailed solutions.`,
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  'ethics-3301': {
    id: 'prof-ethics-3301',
    courseId: 'ethics-3301',
    programId: 'all',
    professorName: 'Professor Michael Torres',
    professorTitle: 'Ethics & Professional Standards Instructor',
    bio: 'Professor Torres brings 12+ years of experience in tax practice and professional ethics. He specializes in AICPA Code of Professional Conduct and ethical decision-making.',
    teachingStyle: 'Case study analysis, ethics scenarios, Socratic discussion, real-world dilemma exploration',
    specialization: 'Professional ethics, AICPA standards, ethical decision-making frameworks',
    systemPrompt: `You are Professor Michael Torres, an ethics instructor with 12+ years of tax practice experience. Your approach:
    1. Present realistic ethical dilemmas and scenarios
    2. Guide analysis through established ethics frameworks
    3. Reference AICPA Code of Professional Conduct and IRS Circular 230
    4. Explain the reasoning behind ethical standards
    5. Encourage students to think through consequences of actions
    6. Make ethics relevant to actual tax practice
    7. Help students develop ethical decision-making skills
    
    Present scenarios in a balanced way. Help students analyze multiple perspectives.
    Always reference specific AICPA and IRS ethical guidelines.`,
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  'ea-prep-4401': {
    id: 'prof-ea-prep-4401',
    courseId: 'ea-prep-4401',
    programId: 'ea-prep',
    professorName: 'Dr. Linda Rodriguez',
    professorTitle: 'Enrolled Agent Exam Specialist',
    bio: 'Dr. Rodriguez specializes in Enrolled Agent exam preparation. She has helped hundreds of candidates pass the IRS EA exam with her strategic study approach and detailed tax knowledge.',
    teachingStyle: 'Exam-focused instruction, practice questions, test-taking strategies, targeted review',
    specialization: 'IRS Enrolled Agent examination, comprehensive tax knowledge, exam strategy',
    systemPrompt: `You are Dr. Linda Rodriguez, an Enrolled Agent exam specialist. Your teaching focus:
    1. Cover all three EA exam parts comprehensively: Individuals, Businesses, Representation
    2. Emphasize high-yield topics that appear frequently on the exam
    3. Provide practice questions similar to actual EA exam questions
    4. Explain test-taking strategies and time management
    5. Help students understand why certain answers are correct
    6. Build confidence for the actual exam
    7. Target weak areas with additional practice
    
    Be exam-focused and strategic. Provide practice questions with detailed explanations.
    Reference the IRS tax code and guidance documents used in the EA exam.`,
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  'audit-5501': {
    id: 'prof-audit-5501',
    courseId: 'audit-5501',
    programId: 'audit-prep',
    professorName: 'Professor Robert Washington',
    professorTitle: 'Tax Audit & Defense Specialist',
    bio: 'Professor Washington has 22+ years in tax audit defense and representation. He brings real-world experience representing clients before the IRS in audits and appeals.',
    teachingStyle: 'Case-based learning, audit scenario analysis, defense strategy development',
    specialization: 'Tax audit procedures, defense strategies, IRS regulations and appeals',
    systemPrompt: `You are Professor Robert Washington, a tax audit specialist with 22+ years of experience. Your focus:
    1. Explain IRS audit procedures and protocols
    2. Help students understand audit defense strategies
    3. Use real audit scenarios and case examples
    4. Teach documentation and substantiation requirements
    5. Explain appeal processes and procedures
    6. Build client representation skills
    7. Prepare students for potential audits they may encounter
    
    Use case-based examples from actual audit experiences. Explain the strategic thinking behind defense choices.
    Reference IRS procedures and regulations throughout.`,
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
};

/**
 * Get AI professor for a course
 */
export function getAIProfessor(courseId: string): AIProfessor | undefined {
  return AI_PROFESSOR_PERSONAS[courseId];
}

/**
 * Generate lecture using AI professor persona
 */
export async function generateLecture(
  env: any,
  courseId: string,
  request: LectureRequest
): Promise<LectureResponse | null> {
  try {
    const professor = getAIProfessor(courseId);
    if (!professor) {
      console.error(`No professor found for course: ${courseId}`);
      return null;
    }

    const provider = env.AI_INSTRUCTOR_PROVIDER || 'openai';

    if (provider === 'openai') {
      return await generateLectureOpenAI(env, professor, request);
    } else if (provider === 'claude') {
      return await generateLectureClaude(env, professor, request);
    }

    return null;
  } catch (error) {
    console.error('Lecture generation error:', error);
    return null;
  }
}

/**
 * Generate lecture using OpenAI GPT-4
 */
async function generateLectureOpenAI(
  env: any,
  professor: AIProfessor,
  request: LectureRequest
): Promise<LectureResponse | null> {
  try {
    const userPrompt = `
    Create a ${request.studentLevel} level lecture on: ${request.topic}
    ${request.subtopics ? `Subtopics to cover: ${request.subtopics.join(', ')}` : ''}
    
    Format the response as JSON with this structure:
    {
      "title": "Lecture title",
      "introduction": "Opening that engages the student",
      "mainContent": "Main lecture content",
      "keyPoints": ["Point 1", "Point 2", ...],
      "examples": ["Example 1", "Example 2", ...],
      "conclusion": "Summary and takeaway",
      ${request.includeQuiz ? '"quiz": [{"question": "Q1", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "Why A is correct", "difficulty": "medium"}]' : ''}
    }
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: professor.systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    const lectureData = JSON.parse(content);
    return lectureData as LectureResponse;
  } catch (error) {
    console.error('OpenAI lecture generation error:', error);
    return null;
  }
}

/**
 * Generate lecture using Anthropic Claude
 */
async function generateLectureClaude(
  env: any,
  professor: AIProfessor,
  request: LectureRequest
): Promise<LectureResponse | null> {
  try {
    const userPrompt = `
    Create a ${request.studentLevel} level lecture on: ${request.topic}
    ${request.subtopics ? `Subtopics to cover: ${request.subtopics.join(', ')}` : ''}
    
    Format the response as JSON with this structure:
    {
      "title": "Lecture title",
      "introduction": "Opening that engages the student",
      "mainContent": "Main lecture content",
      "keyPoints": ["Point 1", "Point 2", ...],
      "examples": ["Example 1", "Example 2", ...],
      "conclusion": "Summary and takeaway"
    }
    `;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.CLAUDE_MODEL || 'claude-3-opus-20240229',
        max_tokens: 2000,
        system: professor.systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON response
    const lectureData = JSON.parse(content);
    return lectureData as LectureResponse;
  } catch (error) {
    console.error('Claude lecture generation error:', error);
    return null;
  }
}

/**
 * Answer student question using AI professor
 */
export async function answerStudentQuestion(
  env: any,
  courseId: string,
  question: string,
  context?: string
): Promise<string | null> {
  try {
    const professor = getAIProfessor(courseId);
    if (!professor) return null;

    const provider = env.AI_INSTRUCTOR_PROVIDER || 'openai';
    const systemPrompt = `${professor.systemPrompt}

Answer the student's question thoroughly and accurately. If the question relates to tax, include relevant tax code references.
Keep the answer focused and clear.`;

    const userPrompt = context
      ? `Course context: ${context}\n\nStudent question: ${question}`
      : `Student question: ${question}`;

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    }

    return null;
  } catch (error) {
    console.error('Question answering error:', error);
    return null;
  }
}

/**
 * Generate quiz questions for a topic
 */
export async function generateQuiz(
  env: any,
  courseId: string,
  topic: string,
  questionCount: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<QuizQuestion[] | null> {
  try {
    const professor = getAIProfessor(courseId);
    if (!professor) return null;

    const provider = env.AI_INSTRUCTOR_PROVIDER || 'openai';

    const userPrompt = `
    Generate ${questionCount} multiple-choice quiz questions on the topic: ${topic}
    Difficulty level: ${difficulty}
    
    Format as JSON array:
    [
      {
        "id": "q1",
        "question": "Question text",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "explanation": "Why A is correct",
        "difficulty": "medium"
      }
    ]
    `;

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: professor.systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const questions = JSON.parse(content);
      return questions as QuizQuestion[];
    }

    return null;
  } catch (error) {
    console.error('Quiz generation error:', error);
    return null;
  }
}

/**
 * Get feedback on student assignment
 */
export async function getAssignmentFeedback(
  env: any,
  courseId: string,
  studentSubmission: string,
  assignmentName: string,
  rubric?: string
): Promise<string | null> {
  try {
    const professor = getAIProfessor(courseId);
    if (!professor) return null;

    const provider = env.AI_INSTRUCTOR_PROVIDER || 'openai';
    const systemPrompt = `${professor.systemPrompt}

You are providing detailed feedback on a student assignment.
Be encouraging while pointing out areas for improvement.
Reference course concepts and provide specific suggestions.`;

    const userPrompt = `
    Assignment: ${assignmentName}
    ${rubric ? `Rubric: ${rubric}\n` : ''}
    
    Student Submission:
    ${studentSubmission}
    
    Please provide detailed feedback on this assignment.
    `;

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    }

    return null;
  } catch (error) {
    console.error('Feedback generation error:', error);
    return null;
  }
}

/**
 * Get all AI professors
 */
export function getAllAIProfessors(): AIProfessor[] {
  return Object.values(AI_PROFESSOR_PERSONAS);
}

/**
 * Get professors by program
 */
export function getProfessorsByProgram(programId: string): AIProfessor[] {
  return Object.values(AI_PROFESSOR_PERSONAS).filter(
    p => p.programId === 'all' || p.programId === programId
  );
}

export default {
  getAIProfessor,
  generateLecture,
  answerStudentQuestion,
  generateQuiz,
  getAssignmentFeedback,
  getAllAIProfessors,
  getProfessorsByProgram
};
