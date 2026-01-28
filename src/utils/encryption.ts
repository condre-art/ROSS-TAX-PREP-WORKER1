/**
 * PII Encryption Utilities
 * Uses AES-GCM for encrypting sensitive personal information (SSN, addresses, phone numbers)
 * Compliant with IRS Publication 1075 requirements
 */

/**
 * Get encryption key from environment
 */
async function getKey(env: any): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(env.ENCRYPTION_KEY || "change-this-32-character-key!!");
  return await crypto.subtle.importKey(
    "raw",
    keyData.slice(0, 32), // Ensure 32 bytes for AES-256
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt sensitive text data
 * @param text - Plain text to encrypt
 * @param env - Environment with ENCRYPTION_KEY
 * @returns Base64 encoded encrypted data with IV prepended
 */
export async function encryptPII(text: string, env: any): Promise<string> {
  if (!text) return "";
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(env);
  const encoded = new TextEncoder().encode(text);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  
  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt sensitive text data
 * @param encryptedData - Base64 encoded encrypted data
 * @param env - Environment with ENCRYPTION_KEY
 * @returns Decrypted plain text
 */
export async function decryptPII(encryptedData: string, env: any): Promise<string> {
  if (!encryptedData) return "";
  
  try {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const key = await getKey(env);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}

/**
 * Encrypt SSN with formatting validation
 * @param ssn - Social Security Number (format: XXX-XX-XXXX or XXXXXXXXX)
 * @param env - Environment with ENCRYPTION_KEY
 * @returns Encrypted SSN
 */
export async function encryptSSN(ssn: string, env: any): Promise<string> {
  if (!ssn) return "";
  
  // Remove dashes and validate
  const cleanSSN = ssn.replace(/-/g, "");
  if (!/^\d{9}$/.test(cleanSSN)) {
    throw new Error("Invalid SSN format");
  }
  
  return await encryptPII(cleanSSN, env);
}

/**
 * Decrypt and format SSN
 * @param encryptedSSN - Encrypted SSN data
 * @param env - Environment with ENCRYPTION_KEY
 * @param format - Return formatted (XXX-XX-XXXX) or plain
 * @returns Decrypted SSN
 */
export async function decryptSSN(encryptedSSN: string, env: any, format: boolean = false): Promise<string> {
  const ssn = await decryptPII(encryptedSSN, env);
  if (!ssn || !format) return ssn;
  
  // Format as XXX-XX-XXXX
  return `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5)}`;
}

/**
 * Mask SSN for display (show last 4 digits only)
 * @param encryptedSSN - Encrypted SSN data
 * @param env - Environment with ENCRYPTION_KEY
 * @returns Masked SSN (XXX-XX-1234)
 */
export async function maskSSN(encryptedSSN: string, env: any): Promise<string> {
  const ssn = await decryptPII(encryptedSSN, env);
  if (!ssn || ssn.length < 4) return "XXX-XX-XXXX";
  
  const last4 = ssn.slice(-4);
  return `XXX-XX-${last4}`;
}

/**
 * Encrypt phone number
 * @param phone - Phone number (any format)
 * @param env - Environment with ENCRYPTION_KEY
 * @returns Encrypted phone number
 */
export async function encryptPhone(phone: string, env: any): Promise<string> {
  if (!phone) return "";
  
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, "");
  return await encryptPII(cleanPhone, env);
}

/**
 * Decrypt phone number
 * @param encryptedPhone - Encrypted phone data
 * @param env - Environment with ENCRYPTION_KEY
 * @param format - Return formatted (XXX) XXX-XXXX or plain
 * @returns Decrypted phone number
 */
export async function decryptPhone(encryptedPhone: string, env: any, format: boolean = false): Promise<string> {
  const phone = await decryptPII(encryptedPhone, env);
  if (!phone || !format || phone.length !== 10) return phone;
  
  // Format as (XXX) XXX-XXXX
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
}

/**
 * Bulk encrypt object fields
 * @param obj - Object with fields to encrypt
 * @param fields - Array of field names to encrypt
 * @param env - Environment with ENCRYPTION_KEY
 * @returns New object with encrypted fields
 */
export async function encryptFields(obj: any, fields: string[], env: any): Promise<any> {
  const encrypted = { ...obj };
  
  for (const field of fields) {
    if (obj[field]) {
      encrypted[field] = await encryptPII(obj[field], env);
    }
  }
  
  return encrypted;
}

/**
 * Bulk decrypt object fields
 * @param obj - Object with encrypted fields
 * @param fields - Array of field names to decrypt
 * @param env - Environment with ENCRYPTION_KEY
 * @returns New object with decrypted fields
 */
export async function decryptFields(obj: any, fields: string[], env: any): Promise<any> {
  const decrypted = { ...obj };
  
  for (const field of fields) {
    if (obj[field]) {
      decrypted[field] = await decryptPII(obj[field], env);
    }
  }
  
  return decrypted;
}
