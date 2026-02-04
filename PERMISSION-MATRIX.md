# PERMISSION MATRIX - ROSS TAX & BOOKKEEPING
## Visual Role-to-Permission Mapping

Legend: ✅ = Granted | ⚠️ = MFA Required | 🔒 = Sensitive | ❌ = Denied

---

## 🎯 AUTHENTICATION & ACCOUNT

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| auth:login | ✅ | ✅ | ✅ | ✅ | ✅ |
| auth:logout | ✅ | ✅ | ✅ | ✅ | ✅ |
| auth:mfa_setup | ✅ | ✅ | ✅ | ✅ | ✅ |
| auth:mfa_verify | ✅ | ✅ | ✅ | ✅ | ✅ |
| auth:password_change | ✅ | ✅ | ✅ | ✅ | ✅ |
| auth:password_reset 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| account:view_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| account:edit_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| account:delete_own ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ |
| account:view_all 🔒 | ❌ | ❌ | ✅ | ✅ | ✅ |
| account:edit_all 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| account:delete_all 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 📄 E-FILE & TAX TRANSMISSION

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| efile:create_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| efile:view_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| efile:edit_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| efile:delete_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| efile:create | ❌ | ✅ | ✅ | ✅ | ✅ |
| efile:view_all 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| efile:edit_all 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| efile:delete_all 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| efile:submit 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ |
| efile:approve 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| efile:transmit 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| efile:acknowledge 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| efile:reject_handling | ❌ | ✅ | ✅ | ✅ | ✅ |
| efile:amend 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| efile:extension | ✅ | ✅ | ✅ | ✅ | ✅ |
| efile:status_check | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🏛️ IRS MEF & TRANSMISSION

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| mef:configure 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| mef:credentials 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| mef:test_mode | ❌ | ✅ | ✅ | ✅ | ✅ |
| mef:production_mode 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| mef:bulk_transmit 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| mef:ack_download 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| mef:error_logs 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| mef:schema_update 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 👥 CLIENTS & CRM

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| clients:view_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| clients:create | ❌ | ✅ | ✅ | ✅ | ✅ |
| clients:view_all 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| clients:edit 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| clients:delete 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| clients:export 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| clients:merge 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| crm:intakes | ❌ | ✅ | ✅ | ✅ | ✅ |
| crm:notes | ❌ | ✅ | ✅ | ✅ | ✅ |
| crm:communications 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 📁 DOCUMENTS & FILE MANAGEMENT

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| documents:upload_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| documents:view_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| documents:delete_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| documents:upload_all | ❌ | ✅ | ✅ | ✅ | ✅ |
| documents:view_all 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| documents:delete_all 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| documents:download 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ |
| documents:share 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| documents:r2_access 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 🛒 SERVICES & REQUESTS

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| services:view | ✅ | ✅ | ✅ | ✅ | ✅ |
| services:request | ✅ | ✅ | ✅ | ✅ | ✅ |
| services:view_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| services:view_all | ❌ | ✅ | ✅ | ✅ | ✅ |
| services:approve | ❌ | ✅ | ✅ | ✅ | ✅ |
| services:reject | ❌ | ✅ | ✅ | ✅ | ✅ |
| services:assign | ❌ | ✅ | ✅ | ✅ | ✅ |
| services:pricing 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| services:pricing_override 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 📊 BOOKKEEPING

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| bookkeeping:view_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| bookkeeping:create | ❌ | ✅ | ✅ | ✅ | ✅ |
| bookkeeping:edit 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| bookkeeping:delete 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| bookkeeping:reconcile | ❌ | ✅ | ✅ | ✅ | ✅ |
| bookkeeping:reports | ❌ | ✅ | ✅ | ✅ | ✅ |
| bookkeeping:export 🔒 | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 💰 INVOICING & PAYMENTS

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| invoicing:view_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| invoicing:create | ❌ | ✅ | ✅ | ✅ | ✅ |
| invoicing:edit | ❌ | ✅ | ✅ | ✅ | ✅ |
| invoicing:delete 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| invoicing:send | ❌ | ✅ | ✅ | ✅ | ✅ |
| invoicing:view_all 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| payments:process 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ |
| payments:refund 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| payments:view_all 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| payments:configure 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 💵 REFUND TRACKING

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| refunds:track_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| refunds:track_all 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| refunds:update_status 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| refunds:bank_products 🔒 | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 🎓 LMS & EDUCATION

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| lms:view_catalog | ✅ | ✅ | ✅ | ✅ | ✅ |
| lms:enroll | ✅ | ✅ | ✅ | ✅ | ✅ |
| lms:view_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| lms:complete | ✅ | ✅ | ✅ | ✅ | ✅ |
| lms:create_courses | ❌ | ❌ | ✅ | ✅ | ✅ |
| lms:edit_courses | ❌ | ❌ | ✅ | ✅ | ✅ |
| lms:delete_courses 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| lms:certificates | ❌ | ✅ | ✅ | ✅ | ✅ |
| lms:analytics 🔒 | ❌ | ❌ | ✅ | ✅ | ✅ |
| lms:purchase_textbooks | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 👨‍💼 STAFF & TEAM MANAGEMENT

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| staff:view | ❌ | ✅ | ✅ | ✅ | ✅ |
| staff:create 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| staff:edit 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| staff:delete 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| staff:roles 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| staff:permissions 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| staff:schedule | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## ✅ COMPLIANCE & CERTIFICATIONS

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| compliance:view | ❌ | ✅ | ✅ | ✅ | ✅ |
| compliance:certificates 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| compliance:ptin 🔒⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ |
| compliance:efin 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| compliance:ce_credits | ❌ | ✅ | ✅ | ✅ | ✅ |
| compliance:audits 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 📈 REPORTING & ANALYTICS

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| reports:view_own | ✅ | ✅ | ✅ | ✅ | ✅ |
| reports:generate | ❌ | ✅ | ✅ | ✅ | ✅ |
| reports:custom | ❌ | ✅ | ✅ | ✅ | ✅ |
| reports:export 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| reports:financial 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| analytics:view 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| analytics:advanced 🔒 | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## ⚙️ SYSTEM ADMINISTRATION

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| system:settings 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| system:backup 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| system:restore 🔒⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ |
| system:logs 🔒 | ❌ | ❌ | ✅ | ✅ | ✅ |
| system:audit 🔒 | ❌ | ❌ | ✅ | ✅ | ✅ |
| system:database 🔒⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ |
| system:api_keys 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| system:environment 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| system:maintenance 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 🔌 INTEGRATIONS & APIS

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| integration:docusign | ❌ | ✅ | ✅ | ✅ | ✅ |
| integration:mailchannels | ❌ | ✅ | ✅ | ✅ | ✅ |
| integration:stripe 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| integration:plaid 🔒 | ❌ | ✅ | ✅ | ✅ | ✅ |
| integration:social_media | ❌ | ❌ | ✅ | ✅ | ✅ |
| integration:google_business | ❌ | ❌ | ✅ | ✅ | ✅ |
| api:create_key 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| api:revoke_key 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| api:view_usage 🔒 | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 🔔 NOTIFICATIONS & COMMUNICATIONS

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| notifications:receive | ✅ | ✅ | ✅ | ✅ | ✅ |
| notifications:send | ❌ | ✅ | ✅ | ✅ | ✅ |
| notifications:broadcast 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| email:send_client | ❌ | ✅ | ✅ | ✅ | ✅ |
| email:send_all 🔒⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| sms:send | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 🧮 AVALON TAX CALCULATIONS

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| avalon:calculate | ❌ | ✅ | ✅ | ✅ | ✅ |
| avalon:advanced | ❌ | ✅ | ✅ | ✅ | ✅ |
| avalon:override 🔒⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| avalon:multistate | ❌ | ✅ | ✅ | ✅ | ✅ |
| avalon:credits | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 🖥️ PORTAL & UI FEATURES

| Permission | Client | Preparer | ERO | Admin | Owner |
|------------|:------:|:--------:|:---:|:-----:|:-----:|
| portal:access | ✅ | ✅ | ✅ | ✅ | ✅ |
| portal:dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| portal:settings | ❌ | ✅ | ✅ | ✅ | ✅ |
| ui:admin_panel 🔒 | ❌ | ❌ | ✅ | ✅ | ✅ |
| ui:advanced_features | ❌ | ✅ | ✅ | ✅ | ✅ |

---

**Total Permissions**: 200+  
**Roles**: 5 (Client, Preparer, ERO, Admin, Owner)  
**Security Levels**: MFA Required (⚠️), Sensitive Data (🔒)  

**Last Updated**: February 3, 2026
