/**
 * Role-Based Email System
 * Provides email templates and delivery for students, teachers, and admins
 * Integrates with MailChannels API for email delivery from domain
 */

interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

interface EmailPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Student Email Templates
 */
export const STUDENT_EMAIL_TEMPLATES = {
  // Email notification when account is created
  accountCreated: (studentName: string, studentEmail: string, tempPassword: string): EmailTemplate => ({
    subject: 'Welcome to Ross Tax Academy - Your Account Has Been Created',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Ross Tax Academy</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Dear ${studentName},</p>
          
          <p>Congratulations! Your student account has been created successfully. You can now access our online learning platform.</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p><strong>Your Student Email:</strong></p>
            <p style="font-size: 18px; color: #667eea;">${studentEmail}</p>
            
            <p style="margin-top: 15px;"><strong>Temporary Password:</strong></p>
            <p style="font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 4px;">${tempPassword}</p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Log in to your account using your student email and temporary password</li>
            <li>Change your password immediately for security</li>
            <li>Complete your profile information</li>
            <li>Access your course materials and lesson plans</li>
          </ol>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/login" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Login to Your Account
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please contact our support team at support@rosstaxprepandbookkeeping.com
          </p>
        </div>
      </div>
    `,
    textBody: `Welcome to Ross Tax Academy\n\nYour account has been created successfully.\n\nStudent Email: ${studentEmail}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.`
  }),

  // Course enrollment confirmation
  courseEnrolled: (studentName: string, courseName: string, courseId: string): EmailTemplate => ({
    subject: `Course Enrollment Confirmation: ${courseName}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">✓ Enrollment Confirmed</h2>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Dear ${studentName},</p>
          
          <p>You have been successfully enrolled in the following course:</p>
          
          <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">${courseName}</h3>
            <p><strong>Course ID:</strong> ${courseId}</p>
            <p><strong>Enrollment Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Active</span></p>
          </div>
          
          <p><strong>What's Next:</strong></p>
          <ul>
            <li>Access course materials and lesson plans</li>
            <li>Review your weekly schedule</li>
            <li>Download lecture recordings and notes</li>
            <li>Submit assignments by deadline</li>
            <li>Check your grades in the gradebook</li>
          </ul>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/courses/${courseId}" style="display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Go to Course
            </a>
          </p>
        </div>
      </div>
    `,
    textBody: `You have been enrolled in: ${courseName}\n\nCourse ID: ${courseId}\nStatus: Active\n\nLog in to your account to view course materials.`
  }),

  // Grade posted notification
  gradePosted: (studentName: string, courseName: string, assignmentName: string, grade: string): EmailTemplate => ({
    subject: `Grade Posted: ${assignmentName}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2196F3; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Grade Posted</h2>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Dear ${studentName},</p>
          
          <p>A grade has been posted for your assignment in ${courseName}.</p>
          
          <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #2196F3;">
            <p><strong>Assignment:</strong> ${assignmentName}</p>
            <p><strong>Course:</strong> ${courseName}</p>
            <p><strong>Your Grade:</strong> <span style="font-size: 24px; color: #2196F3; font-weight: bold;">${grade}</span></p>
          </div>
          
          <p>Please log in to your account to view detailed feedback from your instructor.</p>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/gradebook" style="display: inline-block; padding: 12px 30px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Gradebook
            </a>
          </p>
        </div>
      </div>
    `,
    textBody: `Grade Posted: ${assignmentName}\n\nCourse: ${courseName}\nYour Grade: ${grade}\n\nLog in to view details.`
  }),

  // Attendance reminder
  attendanceReminder: (studentName: string, courseName: string, sessionDate: string): EmailTemplate => ({
    subject: `Upcoming Class: ${courseName}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FF9800; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Class Reminder</h2>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Dear ${studentName},</p>
          
          <p>This is a reminder that you have an upcoming class session.</p>
          
          <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #FF9800;">
            <p><strong>Course:</strong> ${courseName}</p>
            <p><strong>Session Date/Time:</strong> ${sessionDate}</p>
            <p><strong>Attendance:</strong> Required for this session</p>
          </div>
          
          <p>Please ensure you are logged in and ready 5 minutes before the session starts. Your attendance will be recorded automatically.</p>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/schedule" style="display: inline-block; padding: 12px 30px; background: #FF9800; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View My Schedule
            </a>
          </p>
        </div>
      </div>
    `,
    textBody: `Class Reminder: ${courseName}\n\nSession Date/Time: ${sessionDate}\n\nPlease be ready 5 minutes before the session starts.`
  }),

  // Certificate issued
  certificateIssued: (studentName: string, courseName: string, certificateCode: string): EmailTemplate => ({
    subject: `Certificate Issued: ${courseName}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎓 Congratulations!</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Dear ${studentName},</p>
          
          <p>You have successfully completed ${courseName} and your certificate has been issued!</p>
          
          <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0; border: 2px dashed #f5576c;">
            <p><strong>Course:</strong> ${courseName}</p>
            <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Certificate Code:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${certificateCode}</code></p>
          </div>
          
          <p>Your certificate is now available for download and can be verified using the certificate code above.</p>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/certificates" style="display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Download Certificate
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            You can share your certificate with employers using the verification code: <strong>${certificateCode}</strong>
          </p>
        </div>
      </div>
    `,
    textBody: `Congratulations! You have completed ${courseName}\n\nCertificate Code: ${certificateCode}\n\nLog in to download your certificate.`
  })
};

/**
 * Teacher/Instructor Email Templates
 */
export const TEACHER_EMAIL_TEMPLATES = {
  // Account created for instructor
  accountCreated: (teacherName: string, teacherEmail: string, tempPassword: string): EmailTemplate => ({
    subject: 'Instructor Account Created - Ross Tax Academy',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Instructor Portal Access</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Dear ${teacherName},</p>
          
          <p>Your instructor account has been created successfully. You now have access to the instructor portal.</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p><strong>Instructor Email:</strong></p>
            <p style="font-size: 18px; color: #667eea;">${teacherEmail}</p>
            
            <p style="margin-top: 15px;"><strong>Temporary Password:</strong></p>
            <p style="font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 4px;">${tempPassword}</p>
          </div>
          
          <p><strong>Portal Features:</strong></p>
          <ul>
            <li>View assigned courses and student rosters</li>
            <li>Create and manage lesson plans</li>
            <li>Record student attendance</li>
            <li>Post grades and provide feedback</li>
            <li>View student transcripts and performance</li>
            <li>Schedule office hours and meetings</li>
          </ul>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/instructor" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Access Instructor Portal
            </a>
          </p>
        </div>
      </div>
    `,
    textBody: `Your instructor account has been created.\n\nEmail: ${teacherEmail}\nTemporary Password: ${tempPassword}\n\nLog in to access the instructor portal.`
  }),

  // New students enrolled in course
  studentsEnrolled: (teacherName: string, courseName: string, studentCount: number): EmailTemplate => ({
    subject: `New Student Enrollments: ${courseName}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">New Enrollments</h2>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Dear ${teacherName},</p>
          
          <p>${studentCount} new student(s) have enrolled in ${courseName}.</p>
          
          <p>You can view the complete student roster and manage attendance, grades, and feedback in the instructor portal.</p>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/instructor/roster" style="display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Student Roster
            </a>
          </p>
        </div>
      </div>
    `,
    textBody: `${studentCount} new student(s) enrolled in ${courseName}\n\nLog in to view the student roster.`
  }),

  // Grade deadline reminder
  gradeDeadlineReminder: (teacherName: string, courseName: string, dueDate: string): EmailTemplate => ({
    subject: `Grade Submission Deadline Reminder: ${courseName}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FF9800; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">⏰ Deadline Reminder</h2>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Dear ${teacherName},</p>
          
          <p>This is a reminder that grades for ${courseName} are due on ${dueDate}.</p>
          
          <p>Please ensure all assignments have been graded and feedback provided to students by this date.</p>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/instructor/gradebook" style="display: inline-block; padding: 12px 30px; background: #FF9800; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Open Gradebook
            </a>
          </p>
        </div>
      </div>
    `,
    textBody: `Grades for ${courseName} are due on ${dueDate}.\n\nPlease submit all grades by this deadline.`
  }),

  // Lesson plan request
  lessonPlanRequest: (teacherName: string, courseName: string, dueDate: string): EmailTemplate => ({
    subject: `Lesson Plan Due: ${courseName}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2196F3; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Lesson Plan Due</h2>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Dear ${teacherName},</p>
          
          <p>Please submit your lesson plan for ${courseName} by ${dueDate}.</p>
          
          <p>Your lesson plan should include:</p>
          <ul>
            <li>Weekly learning objectives</li>
            <li>Lecture outlines and materials</li>
            <li>Assignment descriptions and due dates</li>
            <li>Assessment methods</li>
          </ul>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/instructor/lesson-plans" style="display: inline-block; padding: 12px 30px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Submit Lesson Plan
            </a>
          </p>
        </div>
      </div>
    `,
    textBody: `Submit lesson plan for ${courseName} by ${dueDate}.\n\nInclude weekly objectives, lecture outlines, and assessments.`
  })
};

/**
 * Admin Email Templates
 */
export const ADMIN_EMAIL_TEMPLATES = {
  // Daily enrollment summary
  dailyEnrollmentSummary: (enrollmentCount: number, totalRevenue: number, date: string): EmailTemplate => ({
    subject: `Daily Enrollment Summary - ${date}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1976D2; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Daily Summary</h2>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <p>Daily enrollment and revenue summary for ${date}:</p>
          
          <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="color: #666; margin: 0;">New Enrollments</p>
                <p style="font-size: 32px; color: #1976D2; font-weight: bold; margin: 0;">${enrollmentCount}</p>
              </div>
              <div>
                <p style="color: #666; margin: 0;">Total Revenue</p>
                <p style="font-size: 32px; color: #1976D2; font-weight: bold; margin: 0;">$${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/admin/dashboard" style="display: inline-block; padding: 12px 30px; background: #1976D2; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Dashboard
            </a>
          </p>
        </div>
      </div>
    `,
    textBody: `Daily Summary - ${date}\n\nNew Enrollments: ${enrollmentCount}\nTotal Revenue: $${totalRevenue}\n\nLog in to view details.`
  }),

  // System alert
  systemAlert: (alertTitle: string, alertMessage: string, severity: string): EmailTemplate => ({
    subject: `[${severity.toUpperCase()}] ${alertTitle}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${severity === 'high' ? '#f44336' : severity === 'medium' ? '#FF9800' : '#2196F3'}; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">System Alert</h2>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h3>${alertTitle}</h3>
          
          <p>${alertMessage}</p>
          
          <p style="margin: 30px 0;">
            <a href="https://academy.rosstaxprepandbookkeeping.com/admin/alerts" style="display: inline-block; padding: 12px 30px; background: ${severity === 'high' ? '#f44336' : severity === 'medium' ? '#FF9800' : '#2196F3'}; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Alert Details
            </a>
          </p>
        </div>
      </div>
    `,
    textBody: `System Alert: ${alertTitle}\n\n${alertMessage}\n\nLog in to view details.`
  })
};

/**
 * Send email via MailChannels
 */
export async function sendEmail(
  mailChannelsKey: string,
  from: string,
  payload: EmailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'X-API-KEY': mailChannelsKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: payload.to }]
          }
        ],
        from: { email: from },
        subject: payload.subject,
        content: [
          {
            type: 'text/html',
            value: payload.html
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `MailChannels API error: ${response.status} - ${error}`
      };
    }

    return {
      success: true,
      messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    return {
      success: false,
      error: `Email send failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Send student email
 */
export async function sendStudentEmail(
  mailChannelsKey: string,
  studentEmail: string,
  templateType: keyof typeof STUDENT_EMAIL_TEMPLATES,
  params: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = (STUDENT_EMAIL_TEMPLATES[templateType] as Function)(...Object.values(params));

  return sendEmail(mailChannelsKey, `noreply@rosstaxprepandbookkeeping.com`, {
    to: studentEmail,
    from: 'noreply@rosstaxprepandbookkeeping.com',
    subject: template.subject,
    html: template.htmlBody,
    text: template.textBody
  });
}

/**
 * Send teacher email
 */
export async function sendTeacherEmail(
  mailChannelsKey: string,
  teacherEmail: string,
  templateType: keyof typeof TEACHER_EMAIL_TEMPLATES,
  params: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = (TEACHER_EMAIL_TEMPLATES[templateType] as Function)(...Object.values(params));

  return sendEmail(mailChannelsKey, `noreply@rosstaxprepandbookkeeping.com`, {
    to: teacherEmail,
    from: 'noreply@rosstaxprepandbookkeeping.com',
    subject: template.subject,
    html: template.htmlBody,
    text: template.textBody
  });
}

/**
 * Send admin email
 */
export async function sendAdminEmail(
  mailChannelsKey: string,
  adminEmail: string,
  templateType: keyof typeof ADMIN_EMAIL_TEMPLATES,
  params: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = (ADMIN_EMAIL_TEMPLATES[templateType] as Function)(...Object.values(params));

  return sendEmail(mailChannelsKey, `noreply@rosstaxprepandbookkeeping.com`, {
    to: adminEmail,
    from: 'noreply@rosstaxprepandbookkeeping.com',
    subject: template.subject,
    html: template.htmlBody,
    text: template.textBody
  });
}
