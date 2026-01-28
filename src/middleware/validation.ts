/**
 * Request Validation Middleware
 * Validates and sanitizes API request inputs
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (US format)
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.length === 10 || cleanPhone.length === 11;
}

/**
 * Validate SSN format
 */
export function isValidSSN(ssn: string): boolean {
  const cleanSSN = ssn.replace(/-/g, "");
  return /^\d{9}$/.test(cleanSSN);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input (remove potential XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  for (const field of requiredFields) {
    if (!body[field] || body[field] === "") {
      errors.push({
        field,
        message: `${field} is required`
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate registration request
 */
export function validateRegistration(body: any): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  // Check required fields
  const required = validateRequiredFields(body, ["name", "email", "password"]);
  if (!required.valid) {
    errors.push(...required.errors);
  }
  
  // Validate email
  if (body.email && !isValidEmail(body.email)) {
    errors.push({
      field: "email",
      message: "Invalid email format"
    });
  }
  
  // Validate password strength
  if (body.password) {
    const passwordCheck = isStrongPassword(body.password);
    if (!passwordCheck.valid) {
      errors.push({
        field: "password",
        message: passwordCheck.errors.join(", ")
      });
    }
  }
  
  // Validate phone if provided
  if (body.phone && !isValidPhone(body.phone)) {
    errors.push({
      field: "phone",
      message: "Invalid phone number format"
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate login request
 */
export function validateLogin(body: any): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  const required = validateRequiredFields(body, ["email", "password"]);
  if (!required.valid) {
    errors.push(...required.errors);
  }
  
  if (body.email && !isValidEmail(body.email)) {
    errors.push({
      field: "email",
      message: "Invalid email format"
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate client data
 */
export function validateClientData(body: any): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  if (body.email && !isValidEmail(body.email)) {
    errors.push({
      field: "email",
      message: "Invalid email format"
    });
  }
  
  if (body.phone && !isValidPhone(body.phone)) {
    errors.push({
      field: "phone",
      message: "Invalid phone number format"
    });
  }
  
  if (body.ssn && !isValidSSN(body.ssn)) {
    errors.push({
      field: "ssn",
      message: "Invalid SSN format (must be 9 digits)"
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate payment request
 */
export function validatePayment(body: any): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  const required = validateRequiredFields(body, ["amount", "provider", "customer_email"]);
  if (!required.valid) {
    errors.push(...required.errors);
  }
  
  if (body.amount && (isNaN(body.amount) || body.amount <= 0)) {
    errors.push({
      field: "amount",
      message: "Amount must be a positive number"
    });
  }
  
  if (body.provider && !["stripe", "square", "bank"].includes(body.provider)) {
    errors.push({
      field: "provider",
      message: "Provider must be 'stripe', 'square', or 'bank'"
    });
  }
  
  if (body.customer_email && !isValidEmail(body.customer_email)) {
    errors.push({
      field: "customer_email",
      message: "Invalid email format"
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  filename: string,
  contentType: string,
  maxSizeMB: number = 10
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  // Allowed file types
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  
  if (!allowedTypes.includes(contentType)) {
    errors.push({
      field: "file",
      message: "Invalid file type. Allowed types: PDF, JPG, PNG, Excel, Word"
    });
  }
  
  // Validate filename
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
    errors.push({
      field: "filename",
      message: "Filename contains invalid characters"
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Middleware to validate request body
 */
export function validateRequest(
  body: any,
  validator: (body: any) => { valid: boolean; errors: ValidationError[] }
): Response | null {
  const result = validator(body);
  
  if (!result.valid) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: result.errors
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  
  return null;
}
