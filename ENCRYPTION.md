# Encryption Practices for Ross Tax Prep Platform

## Overview
This document describes the encryption practices used to protect sensitive data at rest and in transit for the Ross Tax Prep platform, ensuring compliance with IRS, GLBA, and industry best practices.

## In Transit
- All API endpoints are served over HTTPS (Cloudflare Workers/Pages enforce TLS).
- Sensitive data (PII, credentials, payment info) is never transmitted in plaintext.

## At Rest
- **Passwords**: All user and staff passwords are hashed using bcrypt before storage in the database.
- **MFA Secrets**: TOTP secrets for multi-factor authentication are encrypted using AES-GCM with a key provided via the `ENCRYPTION_KEY` environment variable. Secrets are decrypted only for verification.
- **PII (Email, Phone, Address, etc.)**: Stored as plaintext by default. For higher compliance, fields can be encrypted using the provided AES-GCM utility in the codebase. Consider encrypting PII for high-risk users or as required by law.
- **Payment Data**: No raw card or bank account data is stored. All payment processing is handled by third-party providers (Stripe, Square, banks) via secure APIs.
- **Documents**: Uploaded documents are stored in Cloudflare R2 or other secure storage. For highly sensitive documents, encrypt before upload or use provider-side encryption.

## Key Management
- The AES-GCM encryption key is set via the `ENCRYPTION_KEY` environment variable and must be kept secret. Rotate keys periodically and never commit them to source control.

## Developer Guidance
- Use the `encrypt` and `decrypt` utilities in the codebase for any new sensitive fields.
- Never log or transmit decrypted secrets or PII.
- Review and update this document as compliance requirements evolve.

## Compliance References
- IRS Publication 1075: https://www.irs.gov/pub/irs-pdf/p1075.pdf
- GLBA Safeguards Rule: https://www.ftc.gov/business-guidance/privacy-security/gramm-leach-bliley-act

---
For questions, contact the compliance officer or lead developer.
