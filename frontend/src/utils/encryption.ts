/**
 * Frontend Encryption Utilities
 * Note: This is client-side encryption for transport security only.
 * Server-side encryption in src/utils/encryption.ts provides the actual data-at-rest security.
 */

/**
 * Client-side encryption for sensitive data before API transmission
 * Uses Web Crypto API for AES-GCM encryption
 */
export async function encryptPII(text: string): Promise<string> {
  // For client-side, we'll use a session key
  // In production, this key should be securely exchanged with the server
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Generate a random key for this session
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  // Export key for transmission
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  
  // Combine key + IV + ciphertext
  const combined = new Uint8Array(exportedKey.byteLength + iv.length + encrypted.byteLength);
  combined.set(new Uint8Array(exportedKey), 0);
  combined.set(iv, exportedKey.byteLength);
  combined.set(new Uint8Array(encrypted), exportedKey.byteLength + iv.length);
  
  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Client-side decryption
 */
export async function decryptPII(encryptedData: string): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract key, IV, and ciphertext
    const keyData = combined.slice(0, 32);
    const iv = combined.slice(32, 44);
    const ciphertext = combined.slice(44);
    
    // Import key
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}

/**
 * Hash sensitive data for comparison (e.g., password verification)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
