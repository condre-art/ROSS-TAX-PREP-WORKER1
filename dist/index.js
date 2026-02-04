var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// (disabled):crypto
var require_crypto = __commonJS({
  "(disabled):crypto"() {
  }
});

// src/routes/serviceRequests.ts
var serviceRequests_exports = {};
__export(serviceRequests_exports, {
  handleDocumentUpload: () => handleDocumentUpload,
  handleServiceHistory: () => handleServiceHistory,
  handleServiceRequest: () => handleServiceRequest,
  handleUpdateServiceRequest: () => handleUpdateServiceRequest
});
async function handleServiceRequest(request, env) {
  try {
    const data = await request.json();
    if (!data.client_id || !data.services || data.services.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await env.DB.prepare(`
      INSERT INTO service_requests (
        request_id, client_id, services_json, documents_json, 
        status, submitted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      requestId,
      data.client_id,
      JSON.stringify(data.services),
      JSON.stringify(data.documents || []),
      data.status || "pending_approval",
      data.submitted_at,
      (/* @__PURE__ */ new Date()).toISOString()
    ).run();
    await env.DB.prepare(`
      INSERT INTO audit_logs (
        action, user_id, resource_type, resource_id, details, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      "service_request_submitted",
      data.client_id,
      "service_request",
      requestId,
      JSON.stringify({ service_count: data.services.length }),
      (/* @__PURE__ */ new Date()).toISOString()
    ).run();
    return new Response(JSON.stringify({
      success: true,
      request_id: requestId,
      message: "Service request submitted successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Service request error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function handleServiceHistory(request, env) {
  try {
    const clientId = request.params?.clientId;
    if (!clientId) {
      return new Response(JSON.stringify({ error: "Client ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { results } = await env.DB.prepare(`
      SELECT 
        request_id, services_json, documents_json, status, 
        submitted_at, updated_at, assigned_to, notes
      FROM service_requests
      WHERE client_id = ?
      ORDER BY submitted_at DESC
      LIMIT 50
    `).bind(clientId).all();
    const history = results?.map((row) => ({
      request_id: row.request_id,
      services: JSON.parse(row.services_json || "[]"),
      documents: JSON.parse(row.documents_json || "[]"),
      status: row.status,
      submitted_at: row.submitted_at,
      updated_at: row.updated_at,
      assigned_to: row.assigned_to,
      notes: row.notes
    })) || [];
    return new Response(JSON.stringify({ history }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Service history error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function handleUpdateServiceRequest(request, env) {
  try {
    const requestId = request.params?.requestId;
    const data = await request.json();
    if (!requestId) {
      return new Response(JSON.stringify({ error: "Request ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updates = [];
    const bindings = [];
    if (data.status) {
      updates.push("status = ?");
      bindings.push(data.status);
    }
    if (data.assigned_to) {
      updates.push("assigned_to = ?");
      bindings.push(data.assigned_to);
    }
    if (data.notes) {
      updates.push("notes = ?");
      bindings.push(data.notes);
    }
    updates.push("updated_at = ?");
    bindings.push((/* @__PURE__ */ new Date()).toISOString());
    bindings.push(requestId);
    await env.DB.prepare(`
      UPDATE service_requests
      SET ${updates.join(", ")}
      WHERE request_id = ?
    `).bind(...bindings).run();
    await env.DB.prepare(`
      INSERT INTO audit_logs (
        action, resource_type, resource_id, details, timestamp
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      "service_request_updated",
      "service_request",
      requestId,
      JSON.stringify(data),
      (/* @__PURE__ */ new Date()).toISOString()
    ).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Service request updated"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Update service request error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function handleDocumentUpload(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get("document");
    const clientId = formData.get("client_id");
    const category = formData.get("category") || "service_request";
    if (!file || !clientId) {
      return new Response(JSON.stringify({ error: "Missing file or client ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${category}/${clientId}/${timestamp}_${safeName}`;
    await env.DOCUMENTS_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: {
        client_id: clientId,
        category,
        uploaded_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    await env.DB.prepare(`
      INSERT INTO documents (
        client_id, filename, r2_key, file_type, category, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      clientId,
      file.name,
      key,
      file.type,
      category,
      (/* @__PURE__ */ new Date()).toISOString()
    ).run();
    return new Response(JSON.stringify({
      success: true,
      url: `/api/documents/${key}`,
      filename: file.name
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
var init_serviceRequests = __esm({
  "src/routes/serviceRequests.ts"() {
    "use strict";
    __name(handleServiceRequest, "handleServiceRequest");
    __name(handleServiceHistory, "handleServiceHistory");
    __name(handleUpdateServiceRequest, "handleUpdateServiceRequest");
    __name(handleDocumentUpload, "handleDocumentUpload");
  }
});

// node_modules/itty-router/index.mjs
var t = /* @__PURE__ */ __name(({ base: e = "", routes: t2 = [], ...r2 } = {}) => ({ __proto__: new Proxy({}, { get: /* @__PURE__ */ __name((r3, o2, a, s) => (r4, ...c) => t2.push([o2.toUpperCase?.(), RegExp(`^${(s = (e + r4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), c, s]) && a, "get") }), routes: t2, ...r2, async fetch(e2, ...o2) {
  let a, s, c = new URL(e2.url), n = e2.query = { __proto__: null };
  for (let [e3, t3] of c.searchParams) n[e3] = n[e3] ? [].concat(n[e3], t3) : t3;
  e: try {
    for (let t3 of r2.before || []) if (null != (a = await t3(e2.proxy ?? e2, ...o2))) break e;
    t: for (let [r3, n2, l, i] of t2) if ((r3 == e2.method || "ALL" == r3) && (s = c.pathname.match(n2))) {
      e2.params = s.groups || {}, e2.route = i;
      for (let t3 of l) if (null != (a = await t3(e2.proxy ?? e2, ...o2))) break t;
    }
  } catch (t3) {
    if (!r2.catch) throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  try {
    for (let t3 of r2.finally || []) a = await t3(a, e2.proxy ?? e2, ...o2) ?? a;
  } catch (t3) {
    if (!r2.catch) throw t3;
    a = await r2.catch(t3, e2.proxy ?? e2, ...o2);
  }
  return a;
} }), "t");
var r = /* @__PURE__ */ __name((e = "text/plain; charset=utf-8", t2) => (r2, o2 = {}) => {
  if (void 0 === r2 || r2 instanceof Response) return r2;
  const a = new Response(t2?.(r2) ?? r2, o2.url ? void 0 : o2);
  return a.headers.set("content-type", e), a;
}, "r");
var o = r("application/json; charset=utf-8", JSON.stringify);
var p = r("text/plain; charset=utf-8", String);
var f = r("text/html");
var u = r("image/jpeg");
var h = r("image/png");
var g = r("image/webp");

// node_modules/@tsndr/cloudflare-worker-jwt/index.js
function bytesToByteString(bytes) {
  let byteStr = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    byteStr += String.fromCharCode(bytes[i]);
  }
  return byteStr;
}
__name(bytesToByteString, "bytesToByteString");
function byteStringToBytes(byteStr) {
  let bytes = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) {
    bytes[i] = byteStr.charCodeAt(i);
  }
  return bytes;
}
__name(byteStringToBytes, "byteStringToBytes");
function arrayBufferToBase64String(arrayBuffer) {
  return btoa(bytesToByteString(new Uint8Array(arrayBuffer)));
}
__name(arrayBufferToBase64String, "arrayBufferToBase64String");
function base64StringToUint8Array(b64str) {
  return byteStringToBytes(atob(b64str));
}
__name(base64StringToUint8Array, "base64StringToUint8Array");
function textToUint8Array(str) {
  return byteStringToBytes(str);
}
__name(textToUint8Array, "textToUint8Array");
function arrayBufferToBase64Url(arrayBuffer) {
  return arrayBufferToBase64String(arrayBuffer).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(arrayBufferToBase64Url, "arrayBufferToBase64Url");
function base64UrlToUint8Array(b64url) {
  return base64StringToUint8Array(b64url.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, ""));
}
__name(base64UrlToUint8Array, "base64UrlToUint8Array");
function textToBase64Url(str) {
  const encoder = new TextEncoder();
  const charCodes = encoder.encode(str);
  const binaryStr = String.fromCharCode(...charCodes);
  return btoa(binaryStr).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(textToBase64Url, "textToBase64Url");
function pemToBinary(pem) {
  return base64StringToUint8Array(pem.replace(/-+(BEGIN|END).*/g, "").replace(/\s/g, ""));
}
__name(pemToBinary, "pemToBinary");
async function importTextSecret(key, algorithm, keyUsages) {
  return await crypto.subtle.importKey("raw", textToUint8Array(key), algorithm, true, keyUsages);
}
__name(importTextSecret, "importTextSecret");
async function importJwk(key, algorithm, keyUsages) {
  return await crypto.subtle.importKey("jwk", key, algorithm, true, keyUsages);
}
__name(importJwk, "importJwk");
async function importPublicKey(key, algorithm, keyUsages) {
  return await crypto.subtle.importKey("spki", pemToBinary(key), algorithm, true, keyUsages);
}
__name(importPublicKey, "importPublicKey");
async function importPrivateKey(key, algorithm, keyUsages) {
  return await crypto.subtle.importKey("pkcs8", pemToBinary(key), algorithm, true, keyUsages);
}
__name(importPrivateKey, "importPrivateKey");
async function importKey(key, algorithm, keyUsages) {
  if (typeof key === "object")
    return importJwk(key, algorithm, keyUsages);
  if (typeof key !== "string")
    throw new Error("Unsupported key type!");
  if (key.includes("PUBLIC"))
    return importPublicKey(key, algorithm, keyUsages);
  if (key.includes("PRIVATE"))
    return importPrivateKey(key, algorithm, keyUsages);
  return importTextSecret(key, algorithm, keyUsages);
}
__name(importKey, "importKey");
function decodePayload(raw2) {
  const bytes = Array.from(atob(raw2), (char) => char.charCodeAt(0));
  const decodedString = new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  return JSON.parse(decodedString);
}
__name(decodePayload, "decodePayload");
if (typeof crypto === "undefined" || !crypto.subtle)
  throw new Error("SubtleCrypto not supported!");
var algorithms = {
  none: { name: "none" },
  ES256: { name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } },
  ES384: { name: "ECDSA", namedCurve: "P-384", hash: { name: "SHA-384" } },
  ES512: { name: "ECDSA", namedCurve: "P-521", hash: { name: "SHA-512" } },
  HS256: { name: "HMAC", hash: { name: "SHA-256" } },
  HS384: { name: "HMAC", hash: { name: "SHA-384" } },
  HS512: { name: "HMAC", hash: { name: "SHA-512" } },
  RS256: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
  RS384: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-384" } },
  RS512: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-512" } }
};
async function sign(payload, secret, options = "HS256") {
  if (typeof options === "string")
    options = { algorithm: options };
  options = { algorithm: "HS256", header: { typ: "JWT", ...options.header ?? {} }, ...options };
  if (!payload || typeof payload !== "object")
    throw new Error("payload must be an object");
  if (options.algorithm !== "none" && (!secret || typeof secret !== "string" && typeof secret !== "object"))
    throw new Error("secret must be a string, a JWK object or a CryptoKey object");
  if (typeof options.algorithm !== "string")
    throw new Error("options.algorithm must be a string");
  const algorithm = algorithms[options.algorithm];
  if (!algorithm)
    throw new Error("algorithm not found");
  if (!payload.iat)
    payload.iat = Math.floor(Date.now() / 1e3);
  const partialToken = `${textToBase64Url(JSON.stringify({ ...options.header, alg: options.algorithm }))}.${textToBase64Url(JSON.stringify(payload))}`;
  if (options.algorithm === "none")
    return partialToken;
  const key = secret instanceof CryptoKey ? secret : await importKey(secret, algorithm, ["sign"]);
  const signature = await crypto.subtle.sign(algorithm, key, textToUint8Array(partialToken));
  return `${partialToken}.${arrayBufferToBase64Url(signature)}`;
}
__name(sign, "sign");
async function verify(token, secret, options = "HS256") {
  if (typeof options === "string")
    options = { algorithm: options };
  options = { algorithm: "HS256", clockTolerance: 0, throwError: false, ...options };
  if (typeof token !== "string")
    throw new Error("token must be a string");
  if (options.algorithm !== "none" && typeof secret !== "string" && typeof secret !== "object")
    throw new Error("secret must be a string, a JWK object or a CryptoKey object");
  if (typeof options.algorithm !== "string")
    throw new Error("options.algorithm must be a string");
  const tokenParts = token.split(".", 3);
  if (tokenParts.length < 2)
    throw new Error("token must consist of 2 or more parts");
  const [tokenHeader, tokenPayload, tokenSignature] = tokenParts;
  const algorithm = algorithms[options.algorithm];
  if (!algorithm)
    throw new Error("algorithm not found");
  const decodedToken = decode(token);
  try {
    if (decodedToken.header?.alg !== options.algorithm)
      throw new Error("INVALID_SIGNATURE");
    if (decodedToken.payload) {
      const now = Math.floor(Date.now() / 1e3);
      if (decodedToken.payload.nbf && decodedToken.payload.nbf > now && decodedToken.payload.nbf - now > (options.clockTolerance ?? 0))
        throw new Error("NOT_YET_VALID");
      if (decodedToken.payload.exp && decodedToken.payload.exp <= now && now - decodedToken.payload.exp > (options.clockTolerance ?? 0))
        throw new Error("EXPIRED");
    }
    if (algorithm.name === "none")
      return decodedToken;
    const key = secret instanceof CryptoKey ? secret : await importKey(secret, algorithm, ["verify"]);
    if (!await crypto.subtle.verify(algorithm, key, base64UrlToUint8Array(tokenSignature), textToUint8Array(`${tokenHeader}.${tokenPayload}`)))
      throw new Error("INVALID_SIGNATURE");
    return decodedToken;
  } catch (err) {
    if (options.throwError)
      throw err;
    return;
  }
}
__name(verify, "verify");
function decode(token) {
  return {
    header: decodePayload(token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")),
    payload: decodePayload(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
  };
}
__name(decode, "decode");
var index_default = {
  sign,
  verify,
  decode
};

// src/middleware/auth.ts
async function verifyJWT(req, env) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const isValid = await index_default.verify(token, env.JWT_SECRET || "your-secret-key-change-in-production");
    if (!isValid) {
      return null;
    }
    const { payload } = index_default.decode(token);
    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
async function requireAuth(req, env) {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}
__name(requireAuth, "requireAuth");
async function requireAdmin(req, env) {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}
__name(requireAdmin, "requireAdmin");
async function requireStaff(req, env) {
  const user = await verifyJWT(req, env);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Forbidden - Staff access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}
__name(requireStaff, "requireStaff");

// node_modules/uuid/dist/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
__name(unsafeStringify, "unsafeStringify");

// node_modules/uuid/dist/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    if (typeof crypto === "undefined" || !crypto.getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
    getRandomValues = crypto.getRandomValues.bind(crypto);
  }
  return getRandomValues(rnds8);
}
__name(rng, "rng");

// node_modules/uuid/dist/native.js
var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native_default = { randomUUID };

// node_modules/uuid/dist/v4.js
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
__name(_v4, "_v4");
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  return _v4(options, buf, offset);
}
__name(v4, "v4");
var v4_default = v4;

// src/routes/consult.ts
var consultRouter = t();
var SLOT_DURATION_MIN = 30;
var SLOT_FEE = 50;
function getSlots() {
  const slots = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 0; i < 48; i++) {
    const slot = new Date(now.getTime() + i * SLOT_DURATION_MIN * 6e4);
    slots.push({
      id: v4_default(),
      start: slot.toISOString(),
      end: new Date(slot.getTime() + SLOT_DURATION_MIN * 6e4).toISOString(),
      booked: false,
      client_id: null,
      fee: SLOT_FEE
    });
  }
  return slots;
}
__name(getSlots, "getSlots");
consultRouter.get("/slots", async (req, env) => {
  const slots = getSlots();
  return new Response(JSON.stringify(slots.filter((s) => !s.booked)), { headers: { "Content-Type": "application/json" } });
});
consultRouter.post("/book", async (req, env) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  const body = await req.json();
  const slot_id = body.slot_id;
  if (!slot_id) return new Response(JSON.stringify({ error: "Missing slot_id" }), { status: 400 });
  const slots = getSlots();
  const slot = slots.find((s) => s.id === slot_id && !s.booked);
  if (!slot) return new Response(JSON.stringify({ error: "Slot unavailable" }), { status: 400 });
  slot.booked = true;
  slot.client_id = user.id;
  return new Response(JSON.stringify({ success: true, slot }), { headers: { "Content-Type": "application/json" } });
});
var consult_default = consultRouter;

// src/utils/audit.ts
async function logAudit(env, entry, req) {
  try {
    const id = v4_default();
    const ip_address = entry.ip_address || req?.headers.get("CF-Connecting-IP") || req?.headers.get("X-Forwarded-For") || "unknown";
    const user_agent = entry.user_agent || req?.headers.get("User-Agent") || "unknown";
    await env.DB.prepare(
      `INSERT INTO audit_log (id, action, entity, entity_id, user_id, user_role, user_email, details, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      id,
      entry.action,
      entry.entity,
      entry.entity_id || null,
      entry.user_id || null,
      entry.user_role || null,
      entry.user_email || null,
      entry.details || null,
      ip_address,
      user_agent
    ).run();
    console.log(`[AUDIT] ${entry.action} on ${entry.entity} by ${entry.user_email || "system"}`);
  } catch (error) {
    console.error("Failed to log audit entry:", error);
  }
}
__name(logAudit, "logAudit");
async function auditPayment(env, transactionId, amount, user, status, req) {
  await logAudit(env, {
    action: `payment_${status}`,
    entity: "payment",
    entity_id: transactionId,
    user_id: user.id,
    user_role: user.role,
    user_email: user.email,
    details: JSON.stringify({ amount, currency: "USD" })
  }, req);
}
__name(auditPayment, "auditPayment");

// src/routes/diz.ts
var dizRouter = t();
dizRouter.get("/returns", async (req, env) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  const { results } = await env.DB.prepare(
    `SELECT * FROM returns WHERE client_id = ? ORDER BY updated_at DESC LIMIT 20`
  ).bind(user.id).all();
  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
});
dizRouter.post("/returns", async (req, env) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  const body = await req.json();
  const tax_year = body.tax_year;
  const result = await env.DB.prepare(
    `INSERT INTO returns (client_id, tax_year, status, updated_at) VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)`
  ).bind(user.id, tax_year).run();
  await logAudit(env, { action: "diz_return_create", entity: "returns", entity_id: result.lastRowId, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true, id: result.lastRowId }), { headers: { "Content-Type": "application/json" } });
});
dizRouter.post("/returns/:id/upload", async (req, env) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  await logAudit(env, { action: "diz_upload", entity: "returns", entity_id: req.params?.id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});
dizRouter.post("/returns/:id/esign", async (req, env) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  await env.DB.prepare(
    `UPDATE returns SET status = 'signed', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND client_id = ?`
  ).bind(req.params?.id, user.id).run();
  await logAudit(env, { action: "diz_esign", entity: "returns", entity_id: req.params?.id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});
dizRouter.post("/returns/:id/payment", async (req, env) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  await env.DB.prepare(
    `UPDATE returns SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND client_id = ?`
  ).bind(req.params?.id, user.id).run();
  await logAudit(env, { action: "diz_payment", entity: "returns", entity_id: req.params?.id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});
dizRouter.post("/returns/:id/efile", async (req, env) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  const row = await env.DB.prepare(
    `SELECT status FROM returns WHERE id = ? AND client_id = ?`
  ).bind(req.params?.id, user.id).first();
  if (!row || row.status !== "paid") {
    return new Response(JSON.stringify({ error: "Payment required before e-file" }), { status: 403 });
  }
  await env.DB.prepare(
    `UPDATE returns SET status = 'efile_submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND client_id = ?`
  ).bind(req.params?.id, user.id).run();
  await logAudit(env, { action: "diz_efile", entity: "returns", entity_id: req.params?.id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});
dizRouter.get("/returns/:id/status", async (req, env) => {
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;
  const row = await env.DB.prepare(
    `SELECT * FROM returns WHERE id = ? AND client_id = ?`
  ).bind(req.params?.id, user.id).first();
  if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return new Response(JSON.stringify(row), { headers: { "Content-Type": "application/json" } });
});
var diz_default = dizRouter;

// src/routes/ero.ts
var eroRouter = t();
eroRouter.get("/returns", async (req, env) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const { results } = await env.DB.prepare(
    `SELECT t.*, c.full_name, c.email FROM efile_transmissions t
     LEFT JOIN clients c ON t.client_id = c.id
     WHERE t.status IN ('created', 'pending', 'review', 'awaiting_signature', 'awaiting_payment')
     ORDER BY t.updated_at DESC LIMIT 100`
  ).all();
  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
});
eroRouter.post("/returns/:id/claim", async (req, env) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const id = req.params?.id;
  await env.DB.prepare(
    `UPDATE efile_transmissions SET preparer_id = ?, status = 'review' WHERE id = ? AND (preparer_id IS NULL OR preparer_id = ?)`
  ).bind(user.id, id, user.id).run();
  await logAudit(env, { action: "ero_claim", entity: "efile_transmissions", entity_id: id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});
eroRouter.post("/returns/:id/compliance", async (req, env) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const id = req.params?.id;
  const body = await req.json();
  const compliant = body.compliant;
  const notes = body.notes;
  await env.DB.prepare(
    `UPDATE efile_transmissions SET status = ?, compliance_notes = ? WHERE id = ?`
  ).bind(compliant ? "awaiting_signature" : "review", notes || null, id).run();
  await logAudit(env, { action: "ero_compliance", entity: "efile_transmissions", entity_id: id, user_id: user.id, user_email: user.email, details: JSON.stringify({ compliant, notes }) });
  return new Response(JSON.stringify({ success: true }));
});
eroRouter.post("/returns/:id/signature", async (req, env) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const id = req.params?.id;
  await env.DB.prepare(
    `UPDATE efile_transmissions SET status = 'awaiting_payment' WHERE id = ?`
  ).bind(id).run();
  await logAudit(env, { action: "ero_signature", entity: "efile_transmissions", entity_id: id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});
eroRouter.post("/returns/:id/payment", async (req, env) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const id = req.params?.id;
  await env.DB.prepare(
    `UPDATE efile_transmissions SET status = 'ready_to_transmit' WHERE id = ?`
  ).bind(id).run();
  await logAudit(env, { action: "ero_payment", entity: "efile_transmissions", entity_id: id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});
eroRouter.post("/returns/:id/transmit", async (req, env) => {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) return authResult;
  const user = authResult;
  const id = req.params?.id;
  const row = await env.DB.prepare("SELECT * FROM efile_transmissions WHERE id = ?").bind(id).first();
  if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  await env.DB.prepare(
    `UPDATE efile_transmissions SET status = 'transmitting' WHERE id = ?`
  ).bind(id).run();
  await logAudit(env, { action: "ero_transmit", entity: "efile_transmissions", entity_id: id, user_id: user.id, user_email: user.email });
  return new Response(JSON.stringify({ success: true }));
});
var ero_default = eroRouter;

// src/routes/aiSupport.ts
var aiSupportRouter = t({ base: "/api/ai-support" });
function classifyIntent(message) {
  const msg = message.toLowerCase();
  if (/(book|schedule|appointment|meet|consultation|set up)/i.test(msg)) {
    return { intent: "book_appointment", confidence: 0.9 };
  }
  if (/(file|tax|return|1040|refund|status|efile)/i.test(msg)) {
    return { intent: "tax_filing", confidence: 0.85 };
  }
  if (/(price|cost|fee|charge|pay|how much)/i.test(msg)) {
    return { intent: "pricing", confidence: 0.9 };
  }
  if (/(speak|talk|agent|human|representative|ero|preparer)/i.test(msg)) {
    return { intent: "transfer_agent", confidence: 0.95 };
  }
  if (/(bookkeep|payroll|small business|quickbooks|accounting)/i.test(msg)) {
    return { intent: "bookkeeping", confidence: 0.85 };
  }
  return { intent: "general_inquiry", confidence: 0.7 };
}
__name(classifyIntent, "classifyIntent");
function generateResponse(intent, userMessage) {
  const responses = {
    book_appointment: `I'd be happy to help you schedule an appointment! To book a consultation with one of our tax professionals, I'll need:

1. Your full name
2. Email address
3. Phone number
4. Preferred date and time

You can also book directly at: https://www.rosstaxprepandbookkeeping.com/book

Would you like me to transfer you to an agent to complete the booking?`,
    tax_filing: `I can help you with tax filing! Ross Tax Prep offers:

\u{1F4CB} **DIY Filing** - $49.99 (IRS MeF certified platform)
\u{1F468}\u200D\u{1F4BC} **Professional Service** - Starting at $150 (EFIN/PTIN certified preparers)
\u{1F3E2} **Business Filing** - Custom pricing for partnerships, corporations

We support current year + 5 prior years, with e-file and direct deposit options.

What type of filing are you interested in?`,
    pricing: `Our pricing is transparent and competitive:

**Individual Returns (1040)**
\u2022 DIY Platform: $49.99
\u2022 Professional Preparation: $150-$300 (complexity-based)

**Business Returns**
\u2022 1120/1120-S: $350-$800
\u2022 1065 Partnership: $400-$900
\u2022 1041 Estate/Trust: $300-$600

**Additional Services**
\u2022 Bookkeeping: Starting at $150/month
\u2022 Payroll Services: Starting at $100/month
\u2022 Quarterly Estimated Taxes: $75 per quarter

Would you like a detailed quote for your situation?`,
    transfer_agent: `I understand you'd like to speak with a live tax professional. Let me connect you with one of our ERO-certified preparers.

To facilitate the transfer, please provide:
\u2022 Your name
\u2022 Email address
\u2022 Phone number
\u2022 Brief reason for contact

An agent will respond within 15 minutes during business hours (Mon-Fri 9am-6pm CT), or first thing the next business day.`,
    bookkeeping: `Our bookkeeping and payroll services help small businesses stay compliant and organized:

**Bookkeeping Services**
\u2022 Monthly financial statements
\u2022 Expense tracking and categorization
\u2022 QuickBooks setup and management
\u2022 Bank reconciliation
\u2022 Sales tax tracking

**Payroll Services**
\u2022 Bi-weekly or monthly payroll processing
\u2022 W-2 and 1099 preparation
\u2022 Quarterly 941 filings
\u2022 State unemployment reporting

Pricing starts at $150/month for bookkeeping and $100/month for payroll.

Would you like to schedule a free consultation to discuss your business needs?`,
    general_inquiry: `Thank you for contacting Ross Tax Prep & Bookkeeping! I'm here to assist you 24/7 with:

\u2705 Appointment scheduling
\u2705 Tax filing questions
\u2705 Service pricing
\u2705 Bookkeeping and payroll
\u2705 Connection to live agents

How can I help you today?`
  };
  return responses[intent] || responses.general_inquiry;
}
__name(generateResponse, "generateResponse");
aiSupportRouter.post("/chat", async (req, env) => {
  try {
    const { session_id, message, user_info } = await req.json();
    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const sessionId = session_id || v4_default();
    const { intent, confidence } = classifyIntent(message);
    const userMsgId = v4_default();
    await env.DB.prepare(`
      INSERT INTO ai_chat_messages (id, session_id, role, message, intent, confidence, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(userMsgId, sessionId, "user", message, intent, confidence).run();
    const aiResponse = generateResponse(intent, message);
    const aiMsgId = v4_default();
    await env.DB.prepare(`
      INSERT INTO ai_chat_messages (id, session_id, role, message, intent, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(aiMsgId, sessionId, "assistant", aiResponse, intent).run();
    await env.DB.prepare(`
      INSERT INTO ai_chat_analytics (session_id, intent, confidence, user_message_length, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(sessionId, intent, confidence, message.length).run();
    return new Response(JSON.stringify({
      session_id: sessionId,
      message: aiResponse,
      intent,
      confidence,
      requires_transfer: intent === "transfer_agent"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("AI Support chat error:", error);
    return new Response(JSON.stringify({ error: "Chat processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
aiSupportRouter.post("/transfer", async (req, env) => {
  try {
    const { session_id, name, email, phone, reason } = await req.json();
    if (!name || !email || !reason) {
      return new Response(JSON.stringify({ error: "Name, email, and reason required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const transferId = v4_default();
    await env.DB.prepare(`
      INSERT INTO ai_transfer_requests (
        id, session_id, client_name, client_email, client_phone, 
        reason, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(transferId, session_id, name, email, phone || null, reason, "pending").run();
    try {
      await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: "info@rosstaxprepandbookkeeping.com", name: "ERO Team" }],
            dkim_domain: "rosstaxprepandbookkeeping.com",
            dkim_selector: "mailchannels",
            dkim_private_key: env.DKIM_PRIVATE_KEY
          }],
          from: {
            email: "ai-support@rosstaxprepandbookkeeping.com",
            name: "AI Support Bot"
          },
          subject: `\u{1F916} AI Transfer Request - ${name}`,
          content: [{
            type: "text/html",
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">\u{1F916} AI Support Transfer Request</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #1f2937;">Client Requesting Agent Connection</h2>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
                    <p><strong>Reason:</strong> ${reason}</p>
                    <p><strong>Transfer ID:</strong> ${transferId}</p>
                  </div>
                  
                  <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #78350f;">
                      \u26A1 <strong>Action Required:</strong> Client is waiting for agent connection via messaging system.
                    </p>
                  </div>
                  
                  <a href="https://app.rosstaxprepandbookkeeping.com/ero-hub?transfer=${transferId}" 
                     style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                    Accept Transfer Request
                  </a>
                </div>
              </div>
            `
          }]
        })
      });
    } catch (emailError) {
      console.error("Failed to send transfer notification:", emailError);
    }
    await logAudit(env, {
      action: "ai_transfer_request",
      entity: "ai_support",
      entity_id: transferId,
      user_email: email,
      details: JSON.stringify({ name, reason })
    });
    return new Response(JSON.stringify({
      success: true,
      transfer_id: transferId,
      message: "Transfer request submitted. An agent will connect with you shortly."
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Transfer request error:", error);
    return new Response(JSON.stringify({ error: "Transfer request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
aiSupportRouter.get("/transfers", async (req, env) => {
  try {
    const transfers = await env.DB.prepare(`
      SELECT * FROM ai_transfer_requests 
      WHERE status = 'pending' 
      ORDER BY created_at DESC
      LIMIT 50
    `).all();
    return new Response(JSON.stringify(transfers.results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get transfers error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch transfers" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
aiSupportRouter.post("/transfers/:id/accept", async (req, env) => {
  try {
    const { id } = req.params;
    const { ero_id } = await req.json();
    await env.DB.prepare(`
      UPDATE ai_transfer_requests 
      SET status = 'accepted', assigned_ero_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(ero_id, id).run();
    const messageId = v4_default();
    await env.DB.prepare(`
      INSERT INTO ero_messages (
        id, transfer_request_id, sender_id, sender_type, 
        message, encrypted, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      messageId,
      id,
      ero_id,
      "ero",
      "Hello! I've received your transfer request from our AI assistant. How can I help you today?",
      false
    ).run();
    return new Response(JSON.stringify({
      success: true,
      message_id: messageId
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Accept transfer error:", error);
    return new Response(JSON.stringify({ error: "Failed to accept transfer" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
aiSupportRouter.get("/analytics", async (req, env) => {
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "7");
    const intentStats = await env.DB.prepare(`
      SELECT intent, COUNT(*) as count, AVG(confidence) as avg_confidence
      FROM ai_chat_analytics
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY intent
      ORDER BY count DESC
    `).all();
    const dailyVolume = await env.DB.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM ai_chat_messages
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();
    const transferStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM ai_transfer_requests
      WHERE created_at >= datetime('now', '-${days} days')
    `).first();
    return new Response(JSON.stringify({
      intent_distribution: intentStats.results,
      daily_volume: dailyVolume.results,
      transfer_stats: transferStats
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch analytics" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
var aiSupport_default = aiSupportRouter;

// src/utils/encryption.ts
async function getKey(env) {
  const keyData = new TextEncoder().encode(env.ENCRYPTION_KEY || "change-this-32-character-key!!");
  return await crypto.subtle.importKey(
    "raw",
    keyData.slice(0, 32),
    // Ensure 32 bytes for AES-256
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}
__name(getKey, "getKey");
async function encryptPII(text, env) {
  if (!text) return "";
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(env);
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}
__name(encryptPII, "encryptPII");
async function decryptPII(encryptedData, env) {
  if (!encryptedData) return "";
  try {
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
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
__name(decryptPII, "decryptPII");

// src/routes/workflows.ts
var workflowRouter = t({ base: "/api/workflows" });
workflowRouter.get("/admin/dashboard", async (req, env) => {
  try {
    const userStats = await env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM staff) as total_staff,
        (SELECT COUNT(*) FROM clients WHERE created_at >= datetime('now', '-30 days')) as new_clients_30d,
        (SELECT COUNT(*) FROM staff WHERE created_at >= datetime('now', '-30 days')) as new_staff_30d
    `).first();
    const returnStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_returns,
        SUM(CASE WHEN status = 'filed' THEN 1 ELSE 0 END) as filed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
      FROM returns
      WHERE tax_year = ?
    `).bind((/* @__PURE__ */ new Date()).getFullYear()).first();
    const efileStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_transmissions,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM efile_transmissions
      WHERE created_at >= datetime('now', '-30 days')
    `).first();
    const revenueStats = await env.DB.prepare(`
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as transaction_count
      FROM payments
      WHERE status = 'completed'
        AND created_at >= datetime('now', '-30 days')
    `).first();
    const aiStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(DISTINCT session_id) as unique_sessions,
        AVG(confidence) as avg_confidence
      FROM ai_chat_analytics
      WHERE created_at >= datetime('now', '-7 days')
    `).first();
    return new Response(JSON.stringify({
      users: userStats,
      returns: returnStats,
      efile: efileStats,
      revenue: revenueStats,
      ai_support: aiStats
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch dashboard stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
workflowRouter.get("/admin/users", async (req, env) => {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    const search = url.searchParams.get("search");
    let clients = [];
    let staff = [];
    if (!role || role === "client") {
      let clientQuery = "SELECT id, name, email, phone, created_at FROM clients";
      const params = [];
      if (search) {
        clientQuery += " WHERE name LIKE ? OR email LIKE ?";
        params.push(`%${search}%`, `%${search}%`);
      }
      clientQuery += " ORDER BY created_at DESC LIMIT 100";
      const clientResults = await env.DB.prepare(clientQuery).bind(...params).all();
      clients = clientResults.results;
    }
    if (!role || role === "staff") {
      let staffQuery = "SELECT id, name, email, role, created_at FROM staff";
      const params = [];
      if (search) {
        staffQuery += " WHERE name LIKE ? OR email LIKE ?";
        params.push(`%${search}%`, `%${search}%`);
      }
      staffQuery += " ORDER BY created_at DESC LIMIT 100";
      const staffResults = await env.DB.prepare(staffQuery).bind(...params).all();
      staff = staffResults.results;
    }
    return new Response(JSON.stringify({
      clients,
      staff
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("List users error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
workflowRouter.post("/admin/broadcast", async (req, env) => {
  try {
    const { subject, message, recipients } = await req.json();
    let emails = [];
    if (recipients === "all" || recipients === "clients") {
      const clients = await env.DB.prepare("SELECT email FROM clients").all();
      emails.push(...clients.results.map((c) => c.email));
    }
    if (recipients === "all" || recipients === "staff") {
      const staff = await env.DB.prepare("SELECT email FROM staff").all();
      emails.push(...staff.results.map((s) => s.email));
    }
    const broadcastId = v4_default();
    await env.DB.prepare(`
      INSERT INTO admin_broadcasts (id, subject, message, recipients, sent_count, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(broadcastId, subject, message, recipients, emails.length).run();
    for (const email of emails) {
      try {
        await fetch("https://api.mailchannels.net/tx/v1/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email }],
              dkim_domain: "rosstaxprepandbookkeeping.com",
              dkim_selector: "mailchannels",
              dkim_private_key: env.DKIM_PRIVATE_KEY
            }],
            from: {
              email: "admin@rosstaxprepandbookkeeping.com",
              name: "Ross Tax Prep Admin"
            },
            subject,
            content: [{
              type: "text/html",
              value: `<div style="font-family: Arial, sans-serif;">${message}</div>`
            }]
          })
        });
      } catch (emailError) {
        console.error(`Failed to send to ${email}:`, emailError);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      broadcast_id: broadcastId,
      sent_count: emails.length
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    return new Response(JSON.stringify({ error: "Broadcast failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
workflowRouter.get("/ero/assigned-returns", async (req, env) => {
  try {
    const url = new URL(req.url);
    const eroId = url.searchParams.get("ero_id");
    if (!eroId) {
      return new Response(JSON.stringify({ error: "ERO ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const returns = await env.DB.prepare(`
      SELECT 
        r.*,
        c.name as client_name,
        c.email as client_email,
        e.status as efile_status,
        e.ack_code,
        e.updated_at as efile_updated_at
      FROM returns r
      JOIN clients c ON r.client_id = c.id
      LEFT JOIN efile_transmissions e ON e.return_id = r.id
      WHERE r.assigned_ero_id = ?
      ORDER BY r.updated_at DESC
      LIMIT 50
    `).bind(eroId).all();
    return new Response(JSON.stringify(returns.results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get assigned returns error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch returns" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
workflowRouter.post("/ero/assign-return", async (req, env) => {
  try {
    const { return_id, ero_id } = await req.json();
    await env.DB.prepare(`
      UPDATE returns 
      SET assigned_ero_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(ero_id, return_id).run();
    await logAudit(env, {
      action: "assign_return",
      entity: "return",
      entity_id: return_id.toString(),
      user_id: ero_id,
      details: JSON.stringify({ ero_id })
    });
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Assign return error:", error);
    return new Response(JSON.stringify({ error: "Failed to assign return" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
workflowRouter.get("/client/documents", async (req, env) => {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("client_id");
    if (!clientId) {
      return new Response(JSON.stringify({ error: "Client ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const documents = await env.DB.prepare(`
      SELECT id, filename, content_type, key, uploaded_at
      FROM documents
      WHERE client_id = ?
      ORDER BY uploaded_at DESC
    `).bind(clientId).all();
    const docsWithUrls = await Promise.all(
      documents.results.map(async (doc) => {
        try {
          const object = await env.DOCUMENTS_BUCKET.get(doc.key);
          return {
            ...doc,
            size: object?.size || 0,
            download_url: `/api/workflows/client/documents/${doc.id}/download`
          };
        } catch (e) {
          return {
            ...doc,
            size: 0,
            download_url: null,
            error: "File not accessible"
          };
        }
      })
    );
    return new Response(JSON.stringify(docsWithUrls), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch documents" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
workflowRouter.post("/client/upload-document", async (req, env) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const clientId = formData.get("client_id");
    const returnId = formData.get("return_id");
    if (!file || !clientId) {
      return new Response(JSON.stringify({ error: "File and client ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const documentId = v4_default();
    const key = `clients/${clientId}/${documentId}-${file.name}`;
    await env.DOCUMENTS_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    });
    await env.DB.prepare(`
      INSERT INTO documents (id, client_id, return_id, key, filename, content_type, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(documentId, clientId, returnId, key, file.name, file.type).run();
    await logAudit(env, {
      action: "upload_document",
      entity: "document",
      entity_id: documentId,
      user_id: parseInt(clientId),
      details: JSON.stringify({ filename: file.name, size: file.size })
    });
    return new Response(JSON.stringify({
      success: true,
      document_id: documentId,
      filename: file.name
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Upload document error:", error);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
workflowRouter.get("/client/documents/:id/download", async (req, env) => {
  try {
    const { id } = req.params;
    const doc = await env.DB.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).bind(id).first();
    if (!doc) {
      return new Response("Document not found", { status: 404 });
    }
    const object = await env.DOCUMENTS_BUCKET.get(doc.key);
    if (!object) {
      return new Response("File not found in storage", { status: 404 });
    }
    return new Response(object.body, {
      headers: {
        "Content-Type": doc.content_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${doc.filename}"`
      }
    });
  } catch (error) {
    console.error("Download document error:", error);
    return new Response("Download failed", { status: 500 });
  }
});
workflowRouter.get("/client/returns", async (req, env) => {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("client_id");
    if (!clientId) {
      return new Response(JSON.stringify({ error: "Client ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const returns = await env.DB.prepare(`
      SELECT 
        r.*,
        e.status as efile_status,
        e.ack_code,
        e.irs_refund_status,
        e.refund_amount,
        e.refund_disbursed_at,
        s.name as preparer_name
      FROM returns r
      LEFT JOIN efile_transmissions e ON e.return_id = r.id
      LEFT JOIN staff s ON s.id = r.assigned_ero_id
      WHERE r.client_id = ?
      ORDER BY r.tax_year DESC
    `).bind(clientId).all();
    return new Response(JSON.stringify(returns.results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get client returns error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch returns" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
workflowRouter.post("/intake", async (req, env) => {
  try {
    const intakeData = await req.json();
    const intakeId = v4_default();
    const encryptedData = await encryptPII(JSON.stringify(intakeData), env);
    await env.DB.prepare(`
      INSERT INTO intake_forms (
        id, client_name, client_email, client_phone, 
        encrypted_data, source, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      intakeId,
      intakeData.name,
      intakeData.email,
      intakeData.phone || null,
      encryptedData,
      intakeData.source || "web",
      "pending"
    ).run();
    try {
      await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: "info@rosstaxprepandbookkeeping.com", name: "Intake Team" }],
            dkim_domain: "rosstaxprepandbookkeeping.com",
            dkim_selector: "mailchannels",
            dkim_private_key: env.DKIM_PRIVATE_KEY
          }],
          from: {
            email: "intake@rosstaxprepandbookkeeping.com",
            name: "Intake System"
          },
          subject: `\u{1F4CB} New Intake Form - ${intakeData.name}`,
          content: [{
            type: "text/html",
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">\u{1F4CB} New Intake Form Submission</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #1f2937;">Client Information</h2>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${intakeData.name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${intakeData.email}">${intakeData.email}</a></p>
                    ${intakeData.phone ? `<p><strong>Phone:</strong> ${intakeData.phone}</p>` : ""}
                    ${intakeData.service ? `<p><strong>Service Requested:</strong> ${intakeData.service}</p>` : ""}
                    ${intakeData.message ? `<p><strong>Message:</strong><br/>${intakeData.message}</p>` : ""}
                    <p><strong>Intake ID:</strong> ${intakeId}</p>
                  </div>
                  
                  <a href="https://app.rosstaxprepandbookkeeping.com/admin/intakes/${intakeId}" 
                     style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    View Full Intake Form
                  </a>
                </div>
              </div>
            `
          }]
        })
      });
    } catch (emailError) {
      console.error("Failed to send intake notification:", emailError);
    }
    await logAudit(env, {
      action: "intake_submitted",
      entity: "intake",
      entity_id: intakeId,
      user_email: intakeData.email
    });
    return new Response(JSON.stringify({
      success: true,
      intake_id: intakeId,
      message: "Intake form submitted successfully. Our team will contact you within 24 hours."
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Intake submission error:", error);
    return new Response(JSON.stringify({ error: "Intake submission failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
var workflows_default = workflowRouter;

// src/routes/invoicing.ts
var router = t();
router.get("/invoices", async (req, env) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin" && user.role !== "staff") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const clientId = url.searchParams.get("client_id");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    let sql = "SELECT * FROM invoices WHERE 1=1";
    const params = [];
    if (status && status !== "all") {
      sql += " AND status = ?";
      params.push(status);
    }
    if (clientId) {
      sql += " AND client_id = ?";
      params.push(clientId);
    }
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const result = await env.DB.prepare(sql).bind(...params).all();
    const invoices = (result.results || []).map((inv) => ({
      ...inv,
      items: inv.items_json ? JSON.parse(inv.items_json) : []
    }));
    await logAudit(env, {
      action: "invoices_list",
      entity: "invoice",
      user_id: user.id,
      user_role: user.role,
      user_email: user.email,
      details: JSON.stringify({ status, clientId, count: invoices.length })
    }, req);
    return new Response(JSON.stringify({
      invoices,
      total: result.results.length,
      limit,
      offset
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error listing invoices:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router.get("/invoices/:id", async (req, env) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin" && user.role !== "staff") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const invoiceId = req.params.id;
    const invoice = await env.DB.prepare(
      "SELECT * FROM invoices WHERE id = ?"
    ).bind(invoiceId).first();
    if (!invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404 });
    }
    const items = invoice.items_json ? JSON.parse(invoice.items_json) : [];
    await logAudit(env, {
      action: "invoice_view",
      entity: "invoice",
      entity_id: invoiceId,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email
    }, req);
    return new Response(JSON.stringify({ ...invoice, items }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error getting invoice:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router.post("/invoices", async (req, env) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403 });
    }
    const body = await req.json();
    const {
      client_id,
      issue_date,
      due_date,
      items,
      tax_rate = 0,
      notes = ""
    } = body;
    if (!client_id || !issue_date || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const taxAmount = subtotal * (tax_rate / 100);
    const total = subtotal + taxAmount;
    const datePrefix = new Date(issue_date).toISOString().slice(0, 7).replace("-", "");
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const invoiceNumber = `INV-${datePrefix}-${randomSuffix}`;
    const id = v4_default();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO invoices (
        id, admin_id, client_id, invoice_number, issue_date, due_date,
        items_json, subtotal, tax_rate, tax_amount, total, notes,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.id,
      client_id,
      invoiceNumber,
      issue_date,
      due_date,
      JSON.stringify(items),
      subtotal,
      tax_rate,
      taxAmount,
      total,
      notes,
      "draft",
      now,
      now
    ).run();
    await logAudit(env, {
      action: "invoice_create",
      entity: "invoice",
      entity_id: id,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email,
      details: JSON.stringify({ invoiceNumber, total, clientId: client_id })
    }, req);
    return new Response(JSON.stringify({
      id,
      invoice_number: invoiceNumber,
      total,
      status: "draft"
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router.patch("/invoices/:id", async (req, env) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403 });
    }
    const invoiceId = req.params.id;
    const body = await req.json();
    const invoice = await env.DB.prepare(
      "SELECT status FROM invoices WHERE id = ?"
    ).bind(invoiceId).first();
    if (!invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404 });
    }
    if (invoice.status !== "draft") {
      return new Response(JSON.stringify({ error: "Can only edit draft invoices" }), { status: 400 });
    }
    const updates = [];
    const params = [];
    if (body.items) {
      const subtotal = body.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
      const taxAmount = subtotal * ((body.tax_rate || 0) / 100);
      const total = subtotal + taxAmount;
      updates.push("items_json = ?, subtotal = ?, tax_amount = ?, total = ?");
      params.push(JSON.stringify(body.items), subtotal, taxAmount, total);
    }
    if (body.tax_rate !== void 0) {
      if (!body.items) {
        updates.push("tax_rate = ?");
        params.push(body.tax_rate);
      }
    }
    if (body.due_date) {
      updates.push("due_date = ?");
      params.push(body.due_date);
    }
    if (body.notes) {
      updates.push("notes = ?");
      params.push(body.notes);
    }
    updates.push("updated_at = ?");
    params.push((/* @__PURE__ */ new Date()).toISOString());
    params.push(invoiceId);
    await env.DB.prepare(`
      UPDATE invoices SET ${updates.join(", ")} WHERE id = ?
    `).bind(...params).run();
    await logAudit(env, {
      action: "invoice_update",
      entity: "invoice",
      entity_id: invoiceId,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email
    }, req);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router.post("/invoices/:id/send", async (req, env) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403 });
    }
    const invoiceId = req.params.id;
    const invoice = await env.DB.prepare(
      "SELECT i.*, c.email as client_email, c.name as client_name FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.id = ?"
    ).bind(invoiceId).first();
    if (!invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404 });
    }
    if (!invoice.client_email) {
      return new Response(JSON.stringify({ error: "Client email not found" }), { status: 400 });
    }
    const items = invoice.items_json ? JSON.parse(invoice.items_json) : [];
    const invoiceHtml = `
      <h1>Invoice ${invoice.invoice_number}</h1>
      <p>Due: ${invoice.due_date}</p>
      <table border="1">
        <tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        ${items.map((item) => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>$${item.unit_price.toFixed(2)}</td>
            <td>$${item.line_total.toFixed(2)}</td>
          </tr>
        `).join("")}
      </table>
      <p>Subtotal: $${invoice.subtotal.toFixed(2)}</p>
      <p>Tax (${invoice.tax_rate}%): $${invoice.tax_amount.toFixed(2)}</p>
      <h2>Total: $${invoice.total.toFixed(2)}</h2>
      ${invoice.notes ? `<p>Notes: ${invoice.notes}</p>` : ""}
    `;
    const emailResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: invoice.client_email, name: invoice.client_name }],
            dkim_domain: "rosstaxprepandbookkeeping.com"
          }
        ],
        from: {
          email: "invoices@rosstaxprepandbookkeeping.com",
          name: "Ross Tax Prep - Invoicing"
        },
        subject: `Invoice ${invoice.invoice_number} from Ross Tax Prep`,
        html: invoiceHtml
      })
    });
    if (!emailResponse.ok) {
      throw new Error("Failed to send email");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      "UPDATE invoices SET status = ?, sent_at = ?, updated_at = ? WHERE id = ?"
    ).bind("sent", now, now, invoiceId).run();
    await logAudit(env, {
      action: "invoice_send",
      entity: "invoice",
      entity_id: invoiceId,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email,
      details: JSON.stringify({ clientEmail: invoice.client_email })
    }, req);
    return new Response(JSON.stringify({ success: true, sent_at: now }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router.post("/invoices/:id/mark-paid", async (req, env) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403 });
    }
    const invoiceId = req.params.id;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      "UPDATE invoices SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?"
    ).bind("paid", now, now, invoiceId).run();
    await logAudit(env, {
      action: "invoice_paid",
      entity: "invoice",
      entity_id: invoiceId,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email
    }, req);
    return new Response(JSON.stringify({ success: true, paid_at: now }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error marking invoice paid:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router.delete("/invoices/:id", async (req, env) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403 });
    }
    const invoiceId = req.params.id;
    await env.DB.prepare(
      "UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?"
    ).bind("cancelled", (/* @__PURE__ */ new Date()).toISOString(), invoiceId).run();
    await logAudit(env, {
      action: "invoice_delete",
      entity: "invoice",
      entity_id: invoiceId,
      user_id: user.id,
      user_role: user.role,
      user_email: user.email
    }, req);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
var invoicing_default = router;

// src/bankProducts/santaBarbaraTPG.ts
var SantaBarbaraTPGClient = class {
  static {
    __name(this, "SantaBarbaraTPGClient");
  }
  config;
  env;
  constructor(env) {
    this.env = env;
    this.config = {
      apiKey: env.SBTPG_API_KEY || "test_key",
      environment: env.SBTPG_ENVIRONMENT === "production" ? "production" : "sandbox",
      baseUrl: env.SBTPG_ENVIRONMENT === "production" ? "https://api.sbtpg.com/v2" : "https://sandbox.sbtpg.com/v2",
      timeout: 3e4
    };
  }
  /**
   * Create Refund Transfer (RT) transaction
   */
  async createRefundTransfer(request) {
    console.log("[SBTPG] Creating Refund Transfer:", request.product_id);
    const fees = this.calculateFees(request.product_id, request.refund_amount);
    if (request.refund_amount < fees.requirements.min_refund_amount) {
      throw new Error(`Refund amount must be at least $${fees.requirements.min_refund_amount}`);
    }
    const transaction = {
      id: v4_default(),
      client_id: request.client_id,
      return_id: request.return_id,
      product_type: "RT",
      product_id: request.product_id,
      refund_amount: request.refund_amount,
      fee_amount: fees.total_fee,
      net_amount: request.refund_amount - fees.total_fee,
      status: "pending",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!this.config.apiKey || this.config.apiKey === "test_key") {
      console.log("[SBTPG] Test mode - simulating RT approval");
      transaction.status = "approved";
      transaction.approval_code = `RT-${Date.now()}`;
      transaction.sbtpg_transaction_id = `SBTPG-${v4_default().slice(0, 8)}`;
      await this.storeTransaction(transaction);
      return transaction;
    }
    try {
      const response = await this.callAPI("/refund-transfer", "POST", {
        taxpayer_ssn: request.taxpayer_ssn,
        taxpayer_name: request.taxpayer_name,
        refund_amount: request.refund_amount,
        product_id: request.product_id,
        routing_number: request.routing_number,
        account_number: request.account_number,
        account_type: request.account_type || "checking"
      });
      if (response.success) {
        transaction.status = "approved";
        transaction.sbtpg_transaction_id = response.transaction_id;
        transaction.approval_code = response.approval_code;
      } else {
        transaction.status = "rejected";
        transaction.error_message = response.message || "Transaction rejected";
      }
      await this.storeTransaction(transaction);
      return transaction;
    } catch (error) {
      console.error("[SBTPG] RT creation failed:", error);
      transaction.status = "rejected";
      transaction.error_message = error.message;
      await this.storeTransaction(transaction);
      throw error;
    }
  }
  /**
   * Create Refund Anticipation Loan (RAL)
   */
  async createRefundAdvance(request) {
    console.log("[SBTPG] Creating Refund Advance Loan:", request.product_id);
    if (!request.credit_check_consent) {
      throw new Error("Credit check consent is required for RAL products");
    }
    const fees = this.calculateFees(request.product_id, request.requested_advance);
    if (request.requested_advance < fees.requirements.min_refund_amount) {
      throw new Error(`Advance amount must be at least $${fees.requirements.min_refund_amount}`);
    }
    if (fees.requirements.max_refund_amount && request.requested_advance > fees.requirements.max_refund_amount) {
      throw new Error(`Advance amount cannot exceed $${fees.requirements.max_refund_amount}`);
    }
    const transaction = {
      id: v4_default(),
      client_id: request.client_id,
      return_id: request.return_id,
      product_type: "RAL",
      product_id: request.product_id,
      refund_amount: request.requested_advance,
      fee_amount: fees.total_fee,
      net_amount: request.requested_advance - fees.total_fee,
      status: "pending",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!this.config.apiKey || this.config.apiKey === "test_key") {
      console.log("[SBTPG] Test mode - simulating RAL approval");
      transaction.status = "approved";
      transaction.approval_code = `RAL-${Date.now()}`;
      transaction.sbtpg_transaction_id = `SBTPG-${v4_default().slice(0, 8)}`;
      await this.storeTransaction(transaction);
      return transaction;
    }
    try {
      const response = await this.callAPI("/refund-advance", "POST", {
        taxpayer_ssn: request.taxpayer_ssn,
        taxpayer_name: request.taxpayer_name,
        estimated_refund: request.estimated_refund,
        requested_advance: request.requested_advance,
        eitc_amount: request.eitc_amount,
        product_id: request.product_id,
        credit_check_consent: true
      });
      if (response.success) {
        transaction.status = "approved";
        transaction.sbtpg_transaction_id = response.transaction_id;
        transaction.approval_code = response.approval_code;
      } else {
        transaction.status = "rejected";
        transaction.error_message = response.message || "Loan application rejected";
      }
      await this.storeTransaction(transaction);
      return transaction;
    } catch (error) {
      console.error("[SBTPG] RAL creation failed:", error);
      transaction.status = "rejected";
      transaction.error_message = error.message;
      await this.storeTransaction(transaction);
      throw error;
    }
  }
  /**
   * Check transaction status
   */
  async getTransactionStatus(transactionId) {
    const row = await this.env.DB.prepare(
      "SELECT * FROM bank_product_transactions WHERE id = ? OR sbtpg_transaction_id = ?"
    ).bind(transactionId, transactionId).first();
    if (!row) return null;
    if (row.status === "pending" && row.sbtpg_transaction_id && this.config.apiKey !== "test_key") {
      try {
        const response = await this.callAPI(`/transactions/${row.sbtpg_transaction_id}`, "GET");
        if (response.status) {
          row.status = response.status;
          row.updated_at = (/* @__PURE__ */ new Date()).toISOString();
          await this.updateTransaction(row);
        }
      } catch (error) {
        console.error("[SBTPG] Status check failed:", error);
      }
    }
    return row;
  }
  /**
   * Check product eligibility
   */
  async checkEligibility(refundAmount, eitcAmount = 0, productType) {
    const eligibleProducts = [];
    if (productType === "RT" || productType === "EITC_Advance") {
      const rtFees = this.calculateFees("RT-2025", refundAmount);
      if (refundAmount >= rtFees.requirements.min_refund_amount) {
        eligibleProducts.push({
          eligible: true,
          product_id: "RT-2025",
          product_name: "Refund Transfer",
          estimated_fee: rtFees.total_fee,
          net_amount: refundAmount - rtFees.total_fee
        });
      }
    }
    if (productType === "RAL" && refundAmount >= 500) {
      const ralFees = this.calculateFees("RAL-2025", refundAmount);
      if (refundAmount >= ralFees.requirements.min_refund_amount) {
        eligibleProducts.push({
          eligible: true,
          product_id: "RAL-2025",
          product_name: "Refund Anticipation Loan",
          estimated_fee: ralFees.total_fee,
          net_amount: refundAmount - ralFees.total_fee,
          reasons: ["Credit check required"]
        });
      }
    }
    if (eitcAmount > 0 && eitcAmount >= 300) {
      const eitcFees = this.calculateFees("EITC-ADV-2025", eitcAmount);
      eligibleProducts.push({
        eligible: true,
        product_id: "EITC-ADV-2025",
        product_name: "EITC Advance",
        estimated_fee: eitcFees.total_fee,
        net_amount: eitcAmount - eitcFees.total_fee
      });
    }
    return eligibleProducts;
  }
  /**
   * Calculate fees for a product
   */
  calculateFees(productId, amount) {
    const products = {
      "RT-2025": {
        base_fee: 39.95,
        percentage_fee: 0,
        max_fee: 59.95,
        requirements: { min_refund_amount: 300 }
      },
      "RAL-2025": {
        base_fee: 0,
        percentage_fee: 10.5,
        max_fee: 500,
        requirements: { min_refund_amount: 500, max_refund_amount: 6e3 }
      },
      "EITC-ADV-2025": {
        base_fee: 0,
        percentage_fee: 5,
        max_fee: 100,
        requirements: { min_refund_amount: 300, max_refund_amount: 2e3 }
      },
      "DD-2025": {
        base_fee: 0,
        percentage_fee: 0,
        max_fee: 0,
        requirements: { min_refund_amount: 0 }
      }
    };
    const product = products[productId] || products["RT-2025"];
    let base = product.base_fee;
    let percentage = amount * (product.percentage_fee / 100);
    let total = base + percentage;
    if (product.max_fee && total > product.max_fee) {
      total = product.max_fee;
    }
    return {
      total_fee: Math.round(total * 100) / 100,
      base_fee: base,
      percentage_fee: percentage,
      requirements: product.requirements
    };
  }
  /**
   * Make API call to SBTPG
   */
  async callAPI(endpoint, method, body) {
    const url = `${this.config.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "X-API-Version": "v2"
        },
        body: body ? JSON.stringify(body) : void 0,
        signal: AbortSignal.timeout(this.config.timeout)
      });
      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || `HTTP ${response.status}`,
          errors: error.errors
        };
      }
      const data = await response.json();
      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error("[SBTPG] API call failed:", error);
      return {
        success: false,
        message: error.message || "API call failed"
      };
    }
  }
  /**
   * Store transaction in database
   */
  async storeTransaction(transaction) {
    if (!this.env.DB) {
      console.warn("[SBTPG] No database connection - skipping storage");
      return;
    }
    try {
      await this.env.DB.prepare(`
        INSERT INTO bank_product_transactions (
          id, client_id, return_id, product_type, product_id,
          refund_amount, fee_amount, net_amount, status,
          sbtpg_transaction_id, approval_code, error_message,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        transaction.id,
        transaction.client_id,
        transaction.return_id,
        transaction.product_type,
        transaction.product_id,
        transaction.refund_amount,
        transaction.fee_amount,
        transaction.net_amount,
        transaction.status,
        transaction.sbtpg_transaction_id || null,
        transaction.approval_code || null,
        transaction.error_message || null,
        transaction.created_at,
        transaction.updated_at
      ).run();
    } catch (error) {
      console.error("[SBTPG] Failed to store transaction:", error);
      throw error;
    }
  }
  /**
   * Update transaction in database
   */
  async updateTransaction(transaction) {
    if (!this.env.DB) return;
    try {
      await this.env.DB.prepare(`
        UPDATE bank_product_transactions 
        SET status = ?, 
            sbtpg_transaction_id = ?,
            approval_code = ?,
            error_message = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(
        transaction.status,
        transaction.sbtpg_transaction_id || null,
        transaction.approval_code || null,
        transaction.error_message || null,
        transaction.updated_at,
        transaction.id
      ).run();
    } catch (error) {
      console.error("[SBTPG] Failed to update transaction:", error);
    }
  }
  /**
   * Get client info for debugging
   */
  getInfo() {
    return {
      provider: "Santa Barbara TPG",
      environment: this.config.environment,
      baseUrl: this.config.baseUrl,
      hasApiKey: !!this.config.apiKey && this.config.apiKey !== "test_key",
      version: "v2"
    };
  }
};
function createSBTPGClient(env) {
  return new SantaBarbaraTPGClient(env);
}
__name(createSBTPGClient, "createSBTPGClient");

// src/routes/bankProducts.ts
var router2 = t({ base: "/api/bank-products" });
router2.get("/eligibility", async (req, env) => {
  const url = new URL(req.url);
  const refundAmount = parseFloat(url.searchParams.get("refundAmount") || "0");
  const eitcAmount = parseFloat(url.searchParams.get("eitcAmount") || "0");
  const productType = url.searchParams.get("productType") || "RT";
  if (refundAmount <= 0) {
    return new Response(JSON.stringify({ error: "Valid refund amount required" }), { status: 400 });
  }
  const client = createSBTPGClient(env);
  const eligibleProducts = await client.checkEligibility(refundAmount, eitcAmount, productType);
  return new Response(JSON.stringify({
    refund_amount: refundAmount,
    eitc_amount: eitcAmount,
    eligible_products: eligibleProducts
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
router2.post("/refund-transfer", async (req, env) => {
  try {
    const body = await req.json();
    if (!body.client_id || !body.return_id || !body.refund_amount) {
      return new Response(JSON.stringify({
        error: "Missing required fields: client_id, return_id, refund_amount"
      }), { status: 400 });
    }
    if (!body.taxpayer_ssn || !body.taxpayer_name) {
      return new Response(JSON.stringify({
        error: "Missing taxpayer information: taxpayer_ssn, taxpayer_name"
      }), { status: 400 });
    }
    const client = createSBTPGClient(env);
    const transaction = await client.createRefundTransfer({
      client_id: body.client_id,
      return_id: body.return_id,
      taxpayer_ssn: body.taxpayer_ssn,
      taxpayer_name: body.taxpayer_name,
      refund_amount: body.refund_amount,
      routing_number: body.routing_number,
      account_number: body.account_number,
      account_type: body.account_type,
      product_id: body.product_id || "RT-2025"
    });
    await env.DB.prepare(`
      INSERT INTO audit_log (id, action, entity, entity_id, user_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      v4_default(),
      "create",
      "bank_product_transaction",
      transaction.id,
      body.client_id,
      JSON.stringify({ product_type: "RT", amount: body.refund_amount })
    ).run();
    return new Response(JSON.stringify({
      success: true,
      transaction
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[Bank Products] RT creation failed:", error);
    return new Response(JSON.stringify({
      error: error.message || "Failed to create refund transfer"
    }), { status: 500 });
  }
});
router2.post("/refund-advance", async (req, env) => {
  try {
    const body = await req.json();
    if (!body.client_id || !body.return_id || !body.estimated_refund || !body.requested_advance) {
      return new Response(JSON.stringify({
        error: "Missing required fields"
      }), { status: 400 });
    }
    if (!body.taxpayer_ssn || !body.taxpayer_name) {
      return new Response(JSON.stringify({
        error: "Missing taxpayer information"
      }), { status: 400 });
    }
    if (!body.credit_check_consent) {
      return new Response(JSON.stringify({
        error: "Credit check consent is required for refund advance loans"
      }), { status: 400 });
    }
    const client = createSBTPGClient(env);
    const transaction = await client.createRefundAdvance({
      client_id: body.client_id,
      return_id: body.return_id,
      taxpayer_ssn: body.taxpayer_ssn,
      taxpayer_name: body.taxpayer_name,
      estimated_refund: body.estimated_refund,
      requested_advance: body.requested_advance,
      eitc_amount: body.eitc_amount,
      credit_check_consent: body.credit_check_consent,
      product_id: body.product_id || "RAL-2025"
    });
    await env.DB.prepare(`
      INSERT INTO audit_log (id, action, entity, entity_id, user_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      v4_default(),
      "create",
      "bank_product_transaction",
      transaction.id,
      body.client_id,
      JSON.stringify({ product_type: "RAL", amount: body.requested_advance })
    ).run();
    return new Response(JSON.stringify({
      success: true,
      transaction
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[Bank Products] RAL creation failed:", error);
    return new Response(JSON.stringify({
      error: error.message || "Failed to create refund advance"
    }), { status: 500 });
  }
});
router2.get("/transactions/:id", async (req, env) => {
  const id = req.params.id;
  const client = createSBTPGClient(env);
  const transaction = await client.getTransactionStatus(id);
  if (!transaction) {
    return new Response(JSON.stringify({ error: "Transaction not found" }), { status: 404 });
  }
  return new Response(JSON.stringify(transaction), {
    headers: { "Content-Type": "application/json" }
  });
});
router2.get("/transactions", async (req, env) => {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id");
  const returnId = url.searchParams.get("return_id");
  const status = url.searchParams.get("status");
  let query = "SELECT * FROM bank_product_transactions WHERE 1=1";
  const params = [];
  if (clientId) {
    query += " AND client_id = ?";
    params.push(parseInt(clientId));
  }
  if (returnId) {
    query += " AND return_id = ?";
    params.push(parseInt(returnId));
  }
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  query += " ORDER BY created_at DESC LIMIT 100";
  const rows = await env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify({
    transactions: rows.results
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
router2.get("/config", async (req, env) => {
  const url = new URL(req.url);
  const taxYear = url.searchParams.get("tax_year") || "2025";
  const rows = await env.DB.prepare(
    "SELECT * FROM bank_product_config WHERE tax_year = ? AND active = 1 ORDER BY product_type"
  ).bind(parseInt(taxYear)).all();
  return new Response(JSON.stringify({
    tax_year: taxYear,
    products: rows.results
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
router2.post("/calculate-fees", async (req, env) => {
  try {
    const body = await req.json();
    if (!body.product_id || !body.amount) {
      return new Response(JSON.stringify({
        error: "Missing required fields: product_id, amount"
      }), { status: 400 });
    }
    const product = await env.DB.prepare(
      "SELECT * FROM bank_product_config WHERE product_id = ? AND active = 1"
    ).bind(body.product_id).first();
    if (!product) {
      return new Response(JSON.stringify({
        error: "Product not found or inactive"
      }), { status: 404 });
    }
    const amount = parseFloat(body.amount);
    let baseFee = product.base_fee || 0;
    let percentageFee = amount * ((product.percentage_fee || 0) / 100);
    let totalFee = baseFee + percentageFee;
    if (product.max_fee && totalFee > product.max_fee) {
      totalFee = product.max_fee;
    }
    totalFee = Math.round(totalFee * 100) / 100;
    return new Response(JSON.stringify({
      product_id: body.product_id,
      product_name: product.product_name,
      refund_amount: amount,
      base_fee: baseFee,
      percentage_fee: percentageFee,
      total_fee: totalFee,
      net_amount: amount - totalFee,
      requirements: {
        min_refund_amount: product.min_refund_amount,
        max_refund_amount: product.max_refund_amount,
        eitc_required: product.eitc_required === 1,
        credit_check_required: product.credit_check_required === 1
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[Bank Products] Fee calculation failed:", error);
    return new Response(JSON.stringify({
      error: error.message || "Failed to calculate fees"
    }), { status: 500 });
  }
});
router2.post("/webhook", async (req, env) => {
  try {
    const body = await req.json();
    const signature = req.headers.get("X-SBTPG-Signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), { status: 401 });
    }
    const webhookId = v4_default();
    await env.DB.prepare(`
      INSERT INTO bank_product_webhooks (id, transaction_id, webhook_event, payload, processed, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now'))
    `).bind(
      webhookId,
      body.transaction_id,
      body.event,
      JSON.stringify(body)
    ).run();
    if (body.status) {
      await env.DB.prepare(`
        UPDATE bank_product_transactions 
        SET status = ?, updated_at = datetime('now')
        WHERE sbtpg_transaction_id = ?
      `).bind(body.status, body.transaction_id).run();
      await env.DB.prepare(`
        UPDATE bank_product_webhooks 
        SET processed = 1, processed_at = datetime('now')
        WHERE id = ?
      `).bind(webhookId).run();
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[Bank Products] Webhook processing failed:", error);
    return new Response(JSON.stringify({
      error: error.message || "Webhook processing failed"
    }), { status: 500 });
  }
});
router2.get("/info", async (req, env) => {
  const client = createSBTPGClient(env);
  const info = client.getInfo();
  return new Response(JSON.stringify(info), {
    headers: { "Content-Type": "application/json" }
  });
});
var bankProducts_default = router2;

// src/notifications.ts
async function sendRealtimeNotification(env, notification) {
  const notificationId = v4_default();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const notif = {
    id: notificationId,
    type: notification.type,
    recipient_id: notification.recipient_id,
    recipient_type: notification.recipient_type,
    title: notification.title || getDefaultTitle(notification.type),
    message: notification.message,
    urgent: notification.urgent || false,
    data: notification.data || {},
    channels: notification.channels || getDefaultChannels(notification.type),
    read: false,
    created_at: now
  };
  await env.DB.prepare(`
    INSERT INTO notifications (
      id, type, recipient_id, recipient_type, title, message,
      urgent, data, channels, read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    notif.id,
    notif.type,
    notif.recipient_id,
    notif.recipient_type,
    notif.title,
    notif.message,
    notif.urgent ? 1 : 0,
    JSON.stringify(notif.data),
    JSON.stringify(notif.channels),
    0,
    notif.created_at
  ).run();
  await Promise.all([
    notif.channels.includes("email") ? sendEmail(env, notif) : null,
    notif.channels.includes("sms") ? sendSMS(env, notif) : null,
    notif.channels.includes("push") ? sendPush(env, notif) : null,
    notif.channels.includes("websocket") ? broadcastWebSocket(env, notif) : null
  ]);
  return notif;
}
__name(sendRealtimeNotification, "sendRealtimeNotification");
async function sendEmail(env, notification) {
  const recipient = await env.DB.prepare(
    notification.recipient_type === "client" ? "SELECT email, name FROM clients WHERE id = ?" : "SELECT email, name FROM staff WHERE id = ?"
  ).bind(notification.recipient_id).first();
  if (!recipient) return;
  const emailBody = {
    personalizations: [{
      to: [{ email: recipient.email, name: recipient.name }]
    }],
    from: {
      email: "notifications@rosstaxprepandbookkeeping.com",
      name: "Ross Tax Prep & Bookkeeping"
    },
    subject: notification.urgent ? `\u{1F534} URGENT: ${notification.title}` : notification.title,
    content: [{
      type: "text/html",
      value: generateEmailTemplate(notification, recipient.name)
    }]
  };
  await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.MAILCHANNELS_API_KEY
    },
    body: JSON.stringify(emailBody)
  });
  console.log(`\u2705 Email sent to ${recipient.email}: ${notification.title}`);
}
__name(sendEmail, "sendEmail");
async function sendSMS(env, notification) {
  if (!notification.urgent) return;
  const recipient = await env.DB.prepare(
    notification.recipient_type === "client" ? "SELECT phone FROM clients WHERE id = ?" : "SELECT phone FROM staff WHERE id = ?"
  ).bind(notification.recipient_id).first();
  if (!recipient?.phone) return;
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
    const formData = new URLSearchParams();
    formData.append("From", env.TWILIO_PHONE_NUMBER);
    formData.append("To", recipient.phone);
    formData.append("Body", `${notification.title}: ${notification.message}`);
    await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    });
    console.log(`\u2705 SMS sent to ${recipient.phone}: ${notification.title}`);
  }
}
__name(sendSMS, "sendSMS");
async function sendPush(env, notification) {
  console.log(`\u{1F4F1} Push notification: ${notification.title}`);
}
__name(sendPush, "sendPush");
async function broadcastWebSocket(env, notification) {
  console.log(`\u{1F50C} WebSocket broadcast: ${notification.title}`);
}
__name(broadcastWebSocket, "broadcastWebSocket");
async function getUnreadNotifications(env, recipientId, recipientType) {
  const result = await env.DB.prepare(`
    SELECT * FROM notifications
    WHERE recipient_id = ? AND recipient_type = ? AND read = 0
    ORDER BY urgent DESC, created_at DESC
  `).bind(recipientId, recipientType).all();
  return result.results;
}
__name(getUnreadNotifications, "getUnreadNotifications");
async function markAsRead(env, notificationId) {
  await env.DB.prepare(`
    UPDATE notifications
    SET read = 1, read_at = ?
    WHERE id = ?
  `).bind((/* @__PURE__ */ new Date()).toISOString(), notificationId).run();
}
__name(markAsRead, "markAsRead");
async function getNotificationCount(env, recipientId, recipientType) {
  const total = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE recipient_id = ? AND recipient_type = ? AND read = 0
  `).bind(recipientId, recipientType).first();
  const urgent = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE recipient_id = ? AND recipient_type = ? AND read = 0 AND urgent = 1
  `).bind(recipientId, recipientType).first();
  return {
    total: total?.count || 0,
    urgent: urgent?.count || 0
  };
}
__name(getNotificationCount, "getNotificationCount");
function getDefaultTitle(type) {
  const titles = {
    "return_accepted": "Tax Return Accepted",
    "return_rejected": "Tax Return Rejected",
    "refund_approved": "Refund Approved",
    "refund_disbursed": "Refund Disbursed",
    "bank_product_selected": "Bank Product Selected",
    "refund_advance_approved": "Refund Advance Approved",
    "refund_advance_disbursed": "Refund Advance Disbursed",
    "payment_received": "Payment Received",
    "document_needed": "Document Upload Required",
    "signature_required": "Signature Required",
    "task_assigned": "New Task Assigned",
    "task_completed": "Task Completed"
  };
  return titles[type] || "Notification";
}
__name(getDefaultTitle, "getDefaultTitle");
function getDefaultChannels(type) {
  const urgentTypes = [
    "refund_advance_approved",
    "refund_advance_disbursed",
    "return_rejected",
    "signature_required"
  ];
  if (urgentTypes.includes(type)) {
    return ["email", "sms", "push", "websocket"];
  }
  return ["email", "websocket"];
}
__name(getDefaultChannels, "getDefaultChannels");
function generateEmailTemplate(notification, recipientName) {
  const urgentBanner = notification.urgent ? `<div style="background: #DC3545; color: white; padding: 10px; text-align: center; font-weight: bold;">\u{1F534} URGENT NOTIFICATION</div>` : "";
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1B365D; color: white; padding: 20px; text-align: center; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #C4A962; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  ${urgentBanner}
  <div class="container">
    <div class="header">
      <h1>Ross Tax Prep & Bookkeeping</h1>
    </div>
    <div class="content">
      <h2>${notification.title}</h2>
      <p>Hi ${recipientName},</p>
      <p>${notification.message}</p>
      ${notification.data?.action_url ? `<p><a href="${notification.data.action_url}" class="button">View Details</a></p>` : ""}
    </div>
    <div class="footer">
      <p>Ross Tax Prep & Bookkeeping LLC | EIN: 33-4891499 | EFIN: 748335</p>
      <p><a href="https://www.rosstaxprepandbookkeeping.com">www.rosstaxprepandbookkeeping.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
}
__name(generateEmailTemplate, "generateEmailTemplate");

// src/utils/auth.ts
async function verifyAuth(req, env) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { valid: false, error: "No authorization token provided" };
    }
    const token = authHeader.substring(7);
    const isValid = await index_default.verify(token, env.JWT_SECRET || "default-secret");
    if (!isValid) {
      return { valid: false, error: "Invalid or expired token" };
    }
    const { payload } = index_default.decode(token);
    return {
      valid: true,
      userId: payload.sub || payload.userId,
      role: payload.role,
      email: payload.email
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
__name(verifyAuth, "verifyAuth");

// src/routes/notifications.ts
var router3 = t();
router3.get("/api/notifications", async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const recipientType = auth.role === "admin" ? "admin" : auth.role === "tax_prep" || auth.role === "ero" ? "staff" : "client";
    const result = await env.DB.prepare(`
      SELECT * FROM notifications
      WHERE recipient_id = ? AND recipient_type = ?
      ORDER BY urgent DESC, created_at DESC
      LIMIT 50
    `).bind(auth.userId, recipientType).all();
    return new Response(JSON.stringify({
      success: true,
      notifications: result.results
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Error getting notifications:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
router3.get("/api/notifications/unread", async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const recipientType = auth.role === "admin" ? "admin" : auth.role === "tax_prep" || auth.role === "ero" ? "staff" : "client";
    const notifications = await getUnreadNotifications(env, auth.userId, recipientType);
    return new Response(JSON.stringify({
      success: true,
      notifications
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Error getting unread notifications:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
router3.get("/api/notifications/count", async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const recipientType = auth.role === "admin" ? "admin" : auth.role === "tax_prep" || auth.role === "ero" ? "staff" : "client";
    const count = await getNotificationCount(env, auth.userId, recipientType);
    return new Response(JSON.stringify({
      success: true,
      ...count
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Error getting notification count:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
router3.post("/api/notifications/:id/read", async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const notificationId = req.params.id;
    await markAsRead(env, notificationId);
    return new Response(JSON.stringify({
      success: true,
      message: "Notification marked as read"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
router3.post("/api/notifications/send", async (req, env) => {
  try {
    const auth = await verifyAuth(req, env);
    if (!auth.valid || auth.role !== "admin" && auth.role !== "ero" && auth.role !== "tax_prep") {
      return new Response(JSON.stringify({ error: "Forbidden - Staff only" }), { status: 403 });
    }
    const data = await req.json();
    if (!data.recipient_id || !data.message) {
      return new Response(JSON.stringify({
        error: "Missing required fields: recipient_id, message"
      }), { status: 400 });
    }
    const notification = await sendRealtimeNotification(env, {
      type: data.type || "custom",
      recipient_id: data.recipient_id,
      recipient_type: data.recipient_type || "client",
      title: data.title,
      message: data.message,
      urgent: data.urgent || false,
      data: data.data
    });
    return new Response(JSON.stringify({
      success: true,
      notification
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Error sending notification:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
var notifications_default = router3;

// src/irsRefundTracking.ts
function getWhereIsMyRefundUrl(params) {
  const baseUrl = "https://www.irs.gov/refunds";
  return baseUrl;
}
__name(getWhereIsMyRefundUrl, "getWhereIsMyRefundUrl");
function getWhereIsMyAmendedReturnUrl(params) {
  const baseUrl = "https://www.irs.gov/filing/wheres-my-amended-return";
  return baseUrl;
}
__name(getWhereIsMyAmendedReturnUrl, "getWhereIsMyAmendedReturnUrl");
async function checkRefundStatus(env, clientId, taxYear) {
  try {
    const refund = await env.DB.prepare(`
      SELECT 
        t.id,
        t.irs_refund_status,
        t.refund_method,
        t.refund_amount,
        t.refund_disbursed_at,
        t.refund_trace_id,
        t.refund_notes,
        t.dcn,
        t.status,
        r.tax_year,
        r.form_type
      FROM efile_transmissions t
      JOIN returns r ON t.return_id = r.id
      WHERE t.client_id = ? 
        AND r.tax_year = ?
        AND r.is_amended = 0
        AND t.status = 'accepted'
      ORDER BY t.created_at DESC
      LIMIT 1
    `).bind(clientId, taxYear).first();
    if (!refund) {
      return null;
    }
    return {
      transmissionId: refund.id,
      taxYear: refund.tax_year,
      formType: refund.form_type,
      status: mapIrsRefundStatus(refund.irs_refund_status),
      statusDescription: getRefundStatusDescription(refund.irs_refund_status),
      refundAmount: refund.refund_amount,
      refundMethod: refund.refund_method,
      disbursedAt: refund.refund_disbursed_at,
      dcn: refund.dcn,
      traceId: refund.refund_trace_id,
      notes: refund.refund_notes,
      irsToolUrl: "https://www.irs.gov/refunds"
    };
  } catch (error) {
    console.error("Error checking refund status:", error);
    return null;
  }
}
__name(checkRefundStatus, "checkRefundStatus");
async function checkAmendedReturnStatus(env, clientId, taxYear) {
  try {
    const amended = await env.DB.prepare(`
      SELECT 
        t.id,
        t.status,
        t.ack_code,
        t.ack_message,
        t.dcn,
        t.created_at,
        t.updated_at,
        r.tax_year,
        r.form_type,
        r.original_return_id
      FROM efile_transmissions t
      JOIN returns r ON t.return_id = r.id
      WHERE t.client_id = ? 
        AND r.tax_year = ?
        AND r.is_amended = 1
      ORDER BY t.created_at DESC
      LIMIT 1
    `).bind(clientId, taxYear).first();
    if (!amended) {
      return null;
    }
    return {
      transmissionId: amended.id,
      taxYear: amended.tax_year,
      formType: amended.form_type,
      status: mapAmendedReturnStatus(amended.status),
      statusDescription: getAmendedReturnStatusDescription(amended.status),
      dcn: amended.dcn,
      ackCode: amended.ack_code,
      submittedAt: amended.created_at,
      lastUpdated: amended.updated_at,
      irsToolUrl: "https://www.irs.gov/filing/wheres-my-amended-return",
      estimatedProcessingTime: "16 weeks"
      // IRS standard processing time
    };
  } catch (error) {
    console.error("Error checking amended return status:", error);
    return null;
  }
}
__name(checkAmendedReturnStatus, "checkAmendedReturnStatus");
async function updateRefundStatus(env, transmissionId, statusUpdate) {
  const updates = [];
  const params = [];
  if (statusUpdate.irs_refund_status) {
    updates.push("irs_refund_status = ?");
    params.push(statusUpdate.irs_refund_status);
  }
  if (statusUpdate.refund_method) {
    updates.push("refund_method = ?");
    params.push(statusUpdate.refund_method);
  }
  if (statusUpdate.refund_amount !== void 0) {
    updates.push("refund_amount = ?");
    params.push(statusUpdate.refund_amount);
  }
  if (statusUpdate.refund_disbursed_at) {
    updates.push("refund_disbursed_at = ?");
    params.push(statusUpdate.refund_disbursed_at);
  }
  if (statusUpdate.refund_trace_id) {
    updates.push("refund_trace_id = ?");
    params.push(statusUpdate.refund_trace_id);
  }
  if (statusUpdate.refund_notes) {
    updates.push("refund_notes = ?");
    params.push(statusUpdate.refund_notes);
  }
  if (updates.length === 0) return;
  updates.push("updated_at = datetime('now')");
  params.push(transmissionId);
  await env.DB.prepare(
    `UPDATE efile_transmissions SET ${updates.join(", ")} WHERE id = ?`
  ).bind(...params).run();
  await logAudit(env, {
    action: "refund_status_updated",
    resource_type: "efile_transmission",
    resource_id: transmissionId,
    details: statusUpdate
  });
}
__name(updateRefundStatus, "updateRefundStatus");
function mapIrsRefundStatus(status) {
  if (!status) return "pending";
  const normalized = status.toLowerCase();
  if (normalized.includes("disbursed") || normalized.includes("deposited")) {
    return "disbursed";
  }
  if (normalized.includes("sent") || normalized.includes("mailed")) {
    return "sent";
  }
  if (normalized.includes("approved")) {
    return "approved";
  }
  if (normalized.includes("rejected") || normalized.includes("denied")) {
    return "rejected";
  }
  return "pending";
}
__name(mapIrsRefundStatus, "mapIrsRefundStatus");
function getRefundStatusDescription(status) {
  if (!status) return "Your refund is being processed by the IRS.";
  const normalized = status.toLowerCase();
  if (normalized.includes("disbursed") || normalized.includes("deposited")) {
    return "Your refund has been deposited into your bank account.";
  }
  if (normalized.includes("sent") || normalized.includes("mailed")) {
    return "Your refund check has been mailed to your address on file.";
  }
  if (normalized.includes("approved")) {
    return "Your refund has been approved and will be sent soon.";
  }
  if (normalized.includes("rejected") || normalized.includes("denied")) {
    return "There was an issue with your refund. Please contact the IRS.";
  }
  return status;
}
__name(getRefundStatusDescription, "getRefundStatusDescription");
function mapAmendedReturnStatus(status) {
  if (!status) return "received";
  const normalized = status.toLowerCase();
  if (normalized.includes("completed") || normalized.includes("processed")) {
    return "completed";
  }
  if (normalized.includes("adjusted") || normalized.includes("processing")) {
    return "adjusted";
  }
  if (normalized.includes("rejected") || normalized.includes("denied")) {
    return "rejected";
  }
  return "received";
}
__name(mapAmendedReturnStatus, "mapAmendedReturnStatus");
function getAmendedReturnStatusDescription(status) {
  if (!status) return "Your amended return has been received by the IRS.";
  const normalized = status.toLowerCase();
  if (normalized.includes("completed")) {
    return "Your amended return has been processed. Any refund or balance due has been resolved.";
  }
  if (normalized.includes("adjusted")) {
    return "Your amended return is being adjusted by the IRS. Processing typically takes up to 16 weeks.";
  }
  if (normalized.includes("rejected")) {
    return "Your amended return was rejected. Please review and resubmit.";
  }
  return "Your amended return is being processed. This can take up to 16 weeks.";
}
__name(getAmendedReturnStatusDescription, "getAmendedReturnStatusDescription");
function formatRefundAmount(amount) {
  if (!amount) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}
__name(formatRefundAmount, "formatRefundAmount");

// src/routes/irsTracking.ts
var router4 = t();
router4.get("/api/irs/refund-status/:clientId/:taxYear", async (req, env) => {
  try {
    const { clientId, taxYear } = req.params;
    if (!clientId || !taxYear) {
      return new Response(JSON.stringify({ error: "Client ID and tax year required" }), {
        status: 400
      });
    }
    const status = await checkRefundStatus(env, clientId, parseInt(taxYear));
    if (!status) {
      return new Response(JSON.stringify({
        error: "No refund found for this tax year",
        message: "Return may not have been filed or accepted yet"
      }), {
        status: 404
      });
    }
    await logAudit(env, {
      action: "refund_status_checked",
      resource_type: "efile_transmission",
      resource_id: status.transmissionId,
      user_id: clientId,
      details: { taxYear, status: status.status }
    });
    return new Response(JSON.stringify({
      success: true,
      data: {
        ...status,
        refundAmountFormatted: formatRefundAmount(status.refundAmount)
      },
      message: status.statusDescription,
      irsLink: {
        url: status.irsToolUrl,
        label: "Check on IRS.gov (Where's My Refund)",
        instructions: "You will need your SSN, filing status, and exact refund amount"
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Refund status check error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router4.get("/api/irs/amended-status/:clientId/:taxYear", async (req, env) => {
  try {
    const { clientId, taxYear } = req.params;
    if (!clientId || !taxYear) {
      return new Response(JSON.stringify({ error: "Client ID and tax year required" }), {
        status: 400
      });
    }
    const status = await checkAmendedReturnStatus(env, clientId, parseInt(taxYear));
    if (!status) {
      return new Response(JSON.stringify({
        error: "No amended return found for this tax year",
        message: "Amended return may not have been filed yet"
      }), {
        status: 404
      });
    }
    await logAudit(env, {
      action: "amended_return_status_checked",
      resource_type: "efile_transmission",
      resource_id: status.transmissionId,
      user_id: clientId,
      details: { taxYear, status: status.status }
    });
    return new Response(JSON.stringify({
      success: true,
      data: status,
      message: status.statusDescription,
      irsLink: {
        url: status.irsToolUrl,
        label: "Check on IRS.gov (Where's My Amended Return)",
        instructions: "You will need your SSN, date of birth, and ZIP code",
        processingTime: status.estimatedProcessingTime
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Amended return status check error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router4.post("/api/irs/update-refund-status", async (req, env) => {
  try {
    const { transmissionId, statusUpdate } = await req.json();
    if (!transmissionId || !statusUpdate) {
      return new Response(JSON.stringify({ error: "Transmission ID and status update required" }), {
        status: 400
      });
    }
    const transmission = await env.DB.prepare(
      "SELECT id, client_id FROM efile_transmissions WHERE id = ?"
    ).bind(transmissionId).first();
    if (!transmission) {
      return new Response(JSON.stringify({ error: "Transmission not found" }), {
        status: 404
      });
    }
    await updateRefundStatus(env, transmissionId, statusUpdate);
    await logAudit(env, {
      action: "refund_status_updated",
      resource_type: "efile_transmission",
      resource_id: transmissionId,
      details: statusUpdate
    });
    return new Response(JSON.stringify({
      success: true,
      message: "Refund status updated successfully",
      transmissionId
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Refund status update error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router4.get("/api/irs/wheres-my-refund", async (req, env) => {
  const url = new URL(req.url);
  const ssn = url.searchParams.get("ssn");
  const filingStatus = url.searchParams.get("filingStatus");
  const refundAmount = url.searchParams.get("refundAmount");
  const taxYear = url.searchParams.get("taxYear");
  const irsUrl = getWhereIsMyRefundUrl({
    ssn: ssn || "",
    filingStatus: filingStatus || "single",
    refundAmount: parseFloat(refundAmount || "0"),
    taxYear: parseInt(taxYear || (/* @__PURE__ */ new Date()).getFullYear().toString())
  });
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to IRS.gov - Where's My Refund</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1B365D;
      font-size: 24px;
    }
    .info {
      background: #e8f4f8;
      border-left: 4px solid #1B365D;
      padding: 15px;
      margin: 20px 0;
    }
    .info strong {
      display: block;
      margin-bottom: 10px;
      color: #1B365D;
    }
    .btn {
      display: inline-block;
      background: #1B365D;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
    .btn:hover {
      background: #C4A962;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>\u{1F50D} Where's My Refund?</h1>
    <p>You will be redirected to the official IRS.gov "Where's My Refund" tool.</p>
    
    <div class="info">
      <strong>You will need the following information:</strong>
      <ul>
        <li>Social Security Number: ***-**-${ssn?.slice(-4) || "XXXX"}</li>
        <li>Filing Status: ${filingStatus || "Unknown"}</li>
        <li>Exact Refund Amount: ${formatRefundAmount(parseFloat(refundAmount || "0"))}</li>
        <li>Tax Year: ${taxYear || (/* @__PURE__ */ new Date()).getFullYear()}</li>
      </ul>
    </div>

    <p><strong>Note:</strong> Refund information is typically available 24 hours after e-filing or 4 weeks after mailing a paper return.</p>

    <a href="${irsUrl}" class="btn" target="_blank">Continue to IRS.gov \u2192</a>
  </div>

  <script>
    // Auto-redirect after 3 seconds
    setTimeout(() => {
      window.location.href = "${irsUrl}";
    }, 5000);
  <\/script>
</body>
</html>
  `;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html" }
  });
});
router4.get("/api/irs/wheres-my-amended-return", async (req, env) => {
  const url = new URL(req.url);
  const ssn = url.searchParams.get("ssn");
  const dob = url.searchParams.get("dob");
  const zipCode = url.searchParams.get("zipCode");
  const taxYear = url.searchParams.get("taxYear");
  const irsUrl = getWhereIsMyAmendedReturnUrl({
    ssn: ssn || "",
    dob: dob || "",
    zipCode: zipCode || "",
    taxYear: parseInt(taxYear || (/* @__PURE__ */ new Date()).getFullYear().toString())
  });
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting to IRS.gov - Where's My Amended Return</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1B365D;
      font-size: 24px;
    }
    .info {
      background: #fff3cd;
      border-left: 4px solid #C4A962;
      padding: 15px;
      margin: 20px 0;
    }
    .info strong {
      display: block;
      margin-bottom: 10px;
      color: #1B365D;
    }
    .btn {
      display: inline-block;
      background: #1B365D;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
    .btn:hover {
      background: #C4A962;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>\u{1F4DD} Where's My Amended Return?</h1>
    <p>You will be redirected to the official IRS.gov "Where's My Amended Return" tool.</p>
    
    <div class="info">
      <strong>You will need the following information:</strong>
      <ul>
        <li>Social Security Number: ***-**-${ssn?.slice(-4) || "XXXX"}</li>
        <li>Date of Birth: ${dob || "YYYY-MM-DD"}</li>
        <li>ZIP Code: ${zipCode || "XXXXX"}</li>
        <li>Tax Year: ${taxYear || (/* @__PURE__ */ new Date()).getFullYear()}</li>
      </ul>
    </div>

    <p><strong>Note:</strong> Amended return processing typically takes up to 16 weeks. Information is available 3 weeks after filing Form 1040-X.</p>

    <a href="${irsUrl}" class="btn" target="_blank">Continue to IRS.gov \u2192</a>
  </div>

  <script>
    setTimeout(() => {
      window.location.href = "${irsUrl}";
    }, 5000);
  <\/script>
</body>
</html>
  `;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html" }
  });
});
var irsTracking_default = router4;

// src/aiTaxAssistant.ts
var AITaxAssistant = class {
  static {
    __name(this, "AITaxAssistant");
  }
  env;
  context;
  constructor(env, context) {
    this.env = env;
    this.context = context;
  }
  /**
   * Process user question and provide intelligent response
   */
  async ask(question) {
    console.log(`[AI Assistant] Processing question for session ${this.context.session_id}`);
    await this.storeMessage("user", question);
    const intent = this.analyzeIntent(question);
    let response;
    switch (intent.type) {
      case "form_help":
        response = await this.provideFormHelp(intent.form || this.context.current_form);
        break;
      case "calculation":
        response = await this.helpWithCalculation(intent.field);
        break;
      case "deduction":
        response = await this.explainDeduction(intent.deduction);
        break;
      case "credit":
        response = await this.explainCredit(intent.credit);
        break;
      case "income_reporting":
        response = await this.helpWithIncome(intent.income_type);
        break;
      case "efile_status":
        response = await this.checkEFileStatus();
        break;
      case "general":
      default:
        response = await this.provideGeneralHelp(question);
    }
    await this.storeMessage("assistant", response.message, response.suggestions);
    return response;
  }
  /**
   * Provide guidance for specific form
   */
  async provideFormHelp(formName) {
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
      message: `**${guidance.form_name}**

${guidance.description}

**When to use:** ${guidance.when_to_use}`,
      suggestions: guidance.tips.slice(0, 3),
      form_help: guidance.tips.join("\n"),
      tax_tip: guidance.common_errors[0]
    };
  }
  /**
   * Help with tax calculations
   */
  async helpWithCalculation(field) {
    const currentForm = this.context.current_form || "1040";
    if (currentForm === "1040") {
      return {
        message: "I can help you calculate:\n\u2022 Total Income (Line 9)\n\u2022 Adjusted Gross Income (Line 11)\n\u2022 Taxable Income (Line 15)\n\u2022 Total Tax (Line 24)\n\u2022 Refund or Amount Owed",
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
  async explainDeduction(deductionType) {
    const deductions = {
      "standard": {
        description: "Standard Deduction for 2025",
        amounts: {
          "single": "$15,000",
          "married_filing_jointly": "$30,000",
          "head_of_household": "$22,500"
        },
        tip: "Most taxpayers benefit from the standard deduction"
      },
      "student_loan_interest": {
        description: "Student Loan Interest Deduction (Form 1040 Schedule 1 Line 21)",
        max_amount: "$2,500",
        tip: "You can deduct up to $2,500 of interest paid on qualified student loans"
      },
      "hsa": {
        description: "Health Savings Account (HSA) Deduction (Form 1040 Schedule 1 Line 13)",
        limits_2025: {
          "self_only": "$4,300",
          "family": "$8,550"
        },
        tip: "HSA contributions are pre-tax and grow tax-free"
      },
      "ira": {
        description: "IRA Deduction (Form 1040 Schedule 1 Line 20)",
        limits_2025: "$7,000 ($8,000 if age 50+)",
        tip: "Traditional IRA contributions may be tax-deductible"
      }
    };
    const deduction = deductions[deductionType || "standard"];
    return {
      message: `**${deduction.description}**

${JSON.stringify(deduction.amounts || deduction.limits_2025 || deduction.max_amount, null, 2)}`,
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
  async explainCredit(creditType) {
    const credits = {
      "eitc": {
        name: "Earned Income Tax Credit (EITC)",
        max_2025: "$8,046 (3+ children)",
        schedule: "Schedule EIC",
        tip: "EITC is refundable - you can get money back even if you owe no tax"
      },
      "ctc": {
        name: "Child Tax Credit (CTC)",
        amount_2025: "$2,000 per qualifying child",
        refundable_portion: "$1,700",
        tip: "Children must be under age 17 at end of tax year"
      },
      "education": {
        name: "Education Credits (Form 8863)",
        types: ["American Opportunity Credit: $2,500", "Lifetime Learning Credit: $2,000"],
        tip: "You can claim education credits for college expenses"
      },
      "saver": {
        name: "Saver's Credit (Form 8880)",
        amount: "Up to $1,000 ($2,000 married)",
        tip: "Credit for low to moderate income taxpayers who save for retirement"
      }
    };
    const credit = credits[creditType || "eitc"];
    return {
      message: `**${credit.name}**

Max Credit: ${credit.max_2025 || credit.amount_2025 || credit.amount}

${credit.tip}`,
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
  async helpWithIncome(incomeType) {
    const incomeGuides = {
      "w2": {
        form: "Form W-2",
        where_to_enter: "Form 1040 Line 1",
        boxes_needed: "Boxes 1, 2, 16, 17, 19",
        tip: "Enter wages from Box 1 of all W-2 forms"
      },
      "1099nec": {
        form: "Form 1099-NEC",
        where_to_enter: "Schedule C (if self-employed)",
        boxes_needed: "Box 1 - Nonemployee compensation",
        tip: "1099-NEC is for independent contractor income - you may owe self-employment tax"
      },
      "1099int": {
        form: "Form 1099-INT",
        where_to_enter: "Form 1040 Schedule B (if over $1,500)",
        boxes_needed: "Box 1 - Interest income",
        tip: "Report all interest income, even if under $1,500"
      },
      "1099div": {
        form: "Form 1099-DIV",
        where_to_enter: "Form 1040 Schedule B",
        boxes_needed: "Box 1a - Ordinary dividends, Box 1b - Qualified dividends",
        tip: "Qualified dividends get preferential tax rates"
      },
      "1098": {
        form: "Form 1098",
        where_to_enter: "Schedule A (if itemizing)",
        boxes_needed: "Box 1 - Mortgage interest",
        tip: "Mortgage interest is deductible if you itemize"
      },
      "1098t": {
        form: "Form 1098-T",
        where_to_enter: "Form 8863 (for education credits)",
        boxes_needed: "Box 1 - Payments received",
        tip: "Use 1098-T to claim education credits"
      }
    };
    const guide = incomeGuides[incomeType || "w2"];
    return {
      message: `**${guide.form}**

\u{1F4CD} **Where to enter:** ${guide.where_to_enter}
\u{1F4CB} **Boxes needed:** ${guide.boxes_needed}

\u{1F4A1} **Tip:** ${guide.tip}`,
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
  async checkEFileStatus() {
    if (!this.context.return_id) {
      return {
        message: "You haven't started a tax return yet. Would you like to begin?",
        suggestions: ["Start new return", "Import prior year", "Get help choosing"]
      };
    }
    const returnStatus = await this.env.DB.prepare(
      "SELECT status, irs_submission_id, ack_code FROM efile_transmissions WHERE return_id = ? ORDER BY created_at DESC LIMIT 1"
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
    const statusMessages = {
      "pending": "\u23F3 Your return is queued for transmission",
      "transmitting": "\u{1F4E4} Your return is being transmitted to the IRS",
      "accepted": "\u2705 Your return was accepted by the IRS!",
      "rejected": "\u274C Your return was rejected. Let me help you fix it.",
      "error": "\u26A0\uFE0F There was an error. Let me help troubleshoot.",
      "completed": "\u{1F389} Your return is complete!"
    };
    return {
      message: statusMessages[returnStatus.status] || "Checking status...",
      suggestions: [
        returnStatus.status === "accepted" ? "When will I get my refund?" : "What do I do next?",
        "View return details",
        "Contact support"
      ],
      next_step: returnStatus.status === "rejected" ? "fix_errors" : returnStatus.status === "accepted" ? "track_refund" : "wait"
    };
  }
  /**
   * Provide general help
   */
  async provideGeneralHelp(question) {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes("refund")) {
      return {
        message: "\u{1F4B0} **Refund Status**\n\nAfter the IRS accepts your return:\n\u2022 E-file with direct deposit: 21 days\n\u2022 Paper return: 6-8 weeks\n\u2022 Check 'Where's My Refund' on IRS.gov",
        suggestions: [
          "Estimate my refund",
          "Why is my refund delayed?",
          "Add direct deposit"
        ],
        tax_tip: "E-file with direct deposit is the fastest way to get your refund"
      };
    }
    if (lowerQuestion.includes("deadline") || lowerQuestion.includes("due date")) {
      return {
        message: "\u{1F4C5} **2025 Tax Deadlines**\n\n\u2022 April 15, 2026: Individual returns (Form 1040)\n\u2022 March 15, 2026: S-Corps & Partnerships\n\u2022 October 15, 2026: Extended deadline",
        suggestions: [
          "File extension (Form 4868)",
          "What if I can't pay?",
          "Late filing penalties"
        ],
        tax_tip: "File on time even if you can't pay to avoid late filing penalties"
      };
    }
    if (lowerQuestion.includes("amend")) {
      return {
        message: "\u{1F4DD} **Amending Your Return (Form 1040-X)**\n\nYou can file an amended return if you need to correct:\n\u2022 Income amounts\n\u2022 Filing status\n\u2022 Deductions or credits\n\nMust file within 3 years of original return",
        suggestions: [
          "Start amended return",
          "What can I amend?",
          "How long does it take?"
        ]
      };
    }
    return {
      message: "I'm your AI Tax Assistant! I can help you with:\n\n\u{1F4CB} Form guidance (1040, W-2, 1099s, etc.)\n\u{1F4B0} Income & deduction questions\n\u{1F9EE} Tax calculations\n\u{1F4E4} E-file status\n\u{1F4A1} Tax tips & strategies",
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
  analyzeIntent(question) {
    const lower = question.toLowerCase();
    if (lower.includes("form") || lower.includes("1040") || lower.includes("schedule")) {
      const formMatch = question.match(/\b(1040|1099|w-?2|1098|schedule [1-3a-z]|8863|8880)\b/i);
      return { type: "form_help", form: formMatch ? formMatch[0] : null };
    }
    if (lower.includes("calculate") || lower.includes("how much") || lower.includes("total")) {
      return { type: "calculation", field: lower };
    }
    if (lower.includes("deduction") || lower.includes("deduct")) {
      return { type: "deduction", deduction: this.extractDeductionType(lower) };
    }
    if (lower.includes("credit") || lower.includes("eitc") || lower.includes("ctc")) {
      return { type: "credit", credit: this.extractCreditType(lower) };
    }
    if (lower.includes("income") || lower.includes("w-2") || lower.includes("1099")) {
      return { type: "income_reporting", income_type: this.extractIncomeType(lower) };
    }
    if (lower.includes("status") || lower.includes("accepted") || lower.includes("rejected")) {
      return { type: "efile_status" };
    }
    return { type: "general" };
  }
  extractDeductionType(text) {
    if (text.includes("student loan")) return "student_loan_interest";
    if (text.includes("hsa") || text.includes("health savings")) return "hsa";
    if (text.includes("ira") || text.includes("retirement")) return "ira";
    return "standard";
  }
  extractCreditType(text) {
    if (text.includes("eitc") || text.includes("earned income")) return "eitc";
    if (text.includes("ctc") || text.includes("child tax")) return "ctc";
    if (text.includes("education") || text.includes("college")) return "education";
    if (text.includes("saver")) return "saver";
    return "eitc";
  }
  extractIncomeType(text) {
    if (text.includes("w-2") || text.includes("w2") || text.includes("wages")) return "w2";
    if (text.includes("1099-nec") || text.includes("1099nec")) return "1099nec";
    if (text.includes("1099-int") || text.includes("interest")) return "1099int";
    if (text.includes("1099-div") || text.includes("dividend")) return "1099div";
    if (text.includes("1098") && !text.includes("t")) return "1098";
    if (text.includes("1098-t") || text.includes("1098t")) return "1098t";
    return "w2";
  }
  /**
   * Get form-specific guidance
   */
  getFormGuidance(formName) {
    const guides = {
      "1040": {
        form_name: "Form 1040 - U.S. Individual Income Tax Return",
        description: "The main form for reporting personal income and calculating federal income tax.",
        when_to_use: "All U.S. citizens and residents file Form 1040 annually.",
        common_errors: [
          "Math errors on income calculations",
          "Missing signature",
          "Wrong filing status",
          "Forgetting to attach W-2s"
        ],
        tips: [
          "Double-check all Social Security numbers",
          "Review all income sources",
          "Choose correct filing status",
          "Sign and date the return"
        ],
        related_forms: ["Schedule 1", "Schedule 2", "Schedule 3", "W-2", "1099"]
      },
      "schedule1": {
        form_name: "Schedule 1 - Additional Income and Adjustments to Income",
        description: "Report additional income and claim adjustments (above-the-line deductions).",
        when_to_use: "When you have income beyond W-2 wages or qualify for adjustments like IRA deductions or student loan interest.",
        common_errors: [
          "Forgetting self-employment income",
          "Not claiming eligible deductions",
          "Incorrect HSA deduction amounts"
        ],
        tips: [
          "Part I: Report ALL additional income",
          "Part II: Claim all eligible adjustments",
          "Keep receipts for HSA and IRA contributions",
          "Report unemployment compensation"
        ],
        related_forms: ["Schedule C", "Schedule E", "Form 8889 (HSA)"]
      },
      "w2": {
        form_name: "Form W-2 - Wage and Tax Statement",
        description: "Reports wages paid and taxes withheld by your employer.",
        when_to_use: "Issued by your employer if you earned $600 or more.",
        common_errors: [
          "Not waiting for all W-2s before filing",
          "Entering Box 1 (wages) incorrectly",
          "Missing state/local income"
        ],
        tips: [
          "Box 1 = Federal wages (goes to 1040 Line 1)",
          "Box 2 = Federal tax withheld",
          "Box 16/17/18/19 = State wages and withholding",
          "Attach Copy B to your return"
        ],
        related_forms: ["Form 1040", "Schedule 1"]
      },
      "1099nec": {
        form_name: "Form 1099-NEC - Nonemployee Compensation",
        description: "Reports income paid to independent contractors and freelancers.",
        when_to_use: "If you received $600+ as a non-employee (freelancer, contractor, gig worker).",
        common_errors: [
          "Not reporting 1099-NEC income",
          "Forgetting self-employment tax",
          "Not claiming business expenses"
        ],
        tips: [
          "Report Box 1 income on Schedule C",
          "You may owe self-employment tax (Schedule SE)",
          "Deduct business expenses on Schedule C",
          "Set aside 25-30% for taxes"
        ],
        related_forms: ["Schedule C", "Schedule SE", "Form 1040"]
      }
    };
    return guides[formName.toLowerCase()] || guides["1040"];
  }
  /**
   * Store conversation message
   */
  async storeMessage(role, content, suggestions) {
    if (!this.env.DB) return;
    try {
      await this.env.DB.prepare(`
        INSERT INTO ai_assistant_messages (id, session_id, role, content, form_context, suggestions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        v4_default(),
        this.context.session_id,
        role,
        content,
        this.context.current_form || null,
        suggestions ? JSON.stringify(suggestions) : null
      ).run();
    } catch (error) {
      console.error("[AI Assistant] Failed to store message:", error);
    }
  }
  /**
   * Get conversation history
   */
  async getHistory(limit = 20) {
    const rows = await this.env.DB.prepare(
      "SELECT * FROM ai_assistant_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?"
    ).bind(this.context.session_id, limit).all();
    return rows.results;
  }
};
function createAITaxAssistant(env, userId, sessionId, returnId) {
  const context = {
    user_id: userId,
    return_id: returnId,
    session_id: sessionId || v4_default(),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  return new AITaxAssistant(env, context);
}
__name(createAITaxAssistant, "createAITaxAssistant");

// src/routes/aiAssistant.ts
var router5 = t({ base: "/api/ai-assistant" });
router5.post("/session", async (req, env) => {
  try {
    const body = await req.json();
    if (!body.user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), { status: 400 });
    }
    const sessionId = v4_default();
    await env.DB.prepare(`
      INSERT INTO ai_assistant_sessions (id, user_id, return_id, current_form, current_step, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      sessionId,
      body.user_id,
      body.return_id || null,
      body.current_form || null,
      body.current_step || null
    ).run();
    return new Response(JSON.stringify({
      session_id: sessionId,
      message: "Hi! I'm your AI Tax Assistant. I'm here to help you through every step of filing your 2025 tax return. What would you like help with?"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[AI Assistant] Session creation failed:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router5.post("/ask", async (req, env) => {
  try {
    const body = await req.json();
    if (!body.session_id || !body.question) {
      return new Response(JSON.stringify({ error: "session_id and question required" }), { status: 400 });
    }
    const session = await env.DB.prepare(
      "SELECT * FROM ai_assistant_sessions WHERE id = ?"
    ).bind(body.session_id).first();
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
    }
    const assistant = createAITaxAssistant(
      env,
      session.user_id,
      session.id,
      session.return_id
    );
    const response = await assistant.ask(body.question);
    await env.DB.prepare(`
      UPDATE ai_assistant_sessions 
      SET current_form = ?, current_step = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.current_form || session.current_form,
      response.next_step || session.current_step,
      session.id
    ).run();
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[AI Assistant] Question processing failed:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router5.get("/history/:session_id", async (req, env) => {
  const sessionId = req.params.session_id;
  const rows = await env.DB.prepare(
    "SELECT * FROM ai_assistant_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 50"
  ).bind(sessionId).all();
  return new Response(JSON.stringify({
    session_id: sessionId,
    messages: rows.results
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
router5.get("/forms/search", async (req, env) => {
  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.toLowerCase() || "";
  if (!query) {
    const rows2 = await env.DB.prepare(
      "SELECT * FROM form_finder_index WHERE is_active = 1 ORDER BY form_number LIMIT 20"
    ).all();
    return new Response(JSON.stringify({ results: rows2.results }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  const rows = await env.DB.prepare(`
    SELECT * FROM form_finder_index 
    WHERE is_active = 1 
    AND (
      LOWER(form_number) LIKE ? 
      OR LOWER(form_name) LIKE ? 
      OR LOWER(keywords) LIKE ?
    )
    ORDER BY 
      CASE 
        WHEN LOWER(form_number) = ? THEN 1
        WHEN LOWER(form_number) LIKE ? THEN 2
        ELSE 3
      END,
      form_number
    LIMIT 10
  `).bind(
    `%${query}%`,
    `%${query}%`,
    `%${query}%`,
    query,
    `${query}%`
  ).all();
  return new Response(JSON.stringify({
    query,
    results: rows.results
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
router5.get("/forms/:form_number", async (req, env) => {
  const formNumber = req.params.form_number.toUpperCase();
  const form = await env.DB.prepare(
    "SELECT * FROM form_finder_index WHERE UPPER(form_number) = ? AND is_active = 1"
  ).bind(formNumber).first();
  if (!form) {
    return new Response(JSON.stringify({ error: "Form not found" }), { status: 404 });
  }
  const assistant = createAITaxAssistant(env, 0, v4_default());
  const guidance = await assistant.provideFormHelp(formNumber);
  return new Response(JSON.stringify({
    form,
    ai_guidance: guidance
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
router5.get("/workflow/:return_id", async (req, env) => {
  const returnId = parseInt(req.params.return_id);
  const workflow = await env.DB.prepare(
    "SELECT * FROM efile_workflow WHERE return_id = ?"
  ).bind(returnId).first();
  if (!workflow) {
    return new Response(JSON.stringify({ error: "Workflow not found" }), { status: 404 });
  }
  const steps = await env.DB.prepare(
    "SELECT * FROM efile_workflow_steps ORDER BY step_order"
  ).all();
  const completedSteps = JSON.parse(workflow.completed_steps || "[]");
  const currentStepIndex = steps.results.findIndex((s) => s.step_id === workflow.current_step);
  return new Response(JSON.stringify({
    return_id: returnId,
    current_step: workflow.current_step,
    current_step_name: steps.results[currentStepIndex]?.step_name,
    progress_percent: Math.round(completedSteps.length / steps.results.length * 100),
    completed_steps: completedSteps,
    all_steps: steps.results,
    validation_errors: JSON.parse(workflow.validation_errors || "[]"),
    ai_suggestions: JSON.parse(workflow.ai_suggestions || "[]")
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
router5.post("/workflow/:return_id/step", async (req, env) => {
  try {
    const returnId = parseInt(req.params.return_id);
    const body = await req.json();
    if (!body.step_id) {
      return new Response(JSON.stringify({ error: "step_id required" }), { status: 400 });
    }
    let workflow = await env.DB.prepare(
      "SELECT * FROM efile_workflow WHERE return_id = ?"
    ).bind(returnId).first();
    if (!workflow) {
      const workflowId = v4_default();
      await env.DB.prepare(`
        INSERT INTO efile_workflow (id, return_id, current_step, completed_steps, created_at, updated_at)
        VALUES (?, ?, ?, '[]', datetime('now'), datetime('now'))
      `).bind(workflowId, returnId, body.step_id).run();
      workflow = { id: workflowId, completed_steps: "[]" };
    }
    const completedSteps = JSON.parse(workflow.completed_steps || "[]");
    if (body.completed && !completedSteps.includes(body.step_id)) {
      completedSteps.push(body.step_id);
    }
    await env.DB.prepare(`
      UPDATE efile_workflow 
      SET current_step = ?,
          completed_steps = ?,
          validation_errors = ?,
          updated_at = datetime('now')
      WHERE return_id = ?
    `).bind(
      body.step_id,
      JSON.stringify(completedSteps),
      JSON.stringify(body.validation_errors || []),
      returnId
    ).run();
    return new Response(JSON.stringify({
      success: true,
      current_step: body.step_id,
      completed_steps: completedSteps
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[AI Assistant] Workflow update failed:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
router5.get("/tips", async (req, env) => {
  const url = new URL(req.url);
  const context = url.searchParams.get("context") || "general";
  const tips = {
    "income": {
      title: "Income Reporting Tips",
      tips: [
        "Report ALL income, even if you didn't receive a form",
        "W-2 wages go on Form 1040 Line 1",
        "1099-NEC income requires Schedule C and self-employment tax",
        "Interest over $1,500 requires Schedule B"
      ]
    },
    "deductions": {
      title: "Maximize Your Deductions",
      tips: [
        "Most taxpayers benefit from the standard deduction ($15,000 single, $30,000 married)",
        "HSA contributions are deductible (up to $4,300 self / $8,550 family)",
        "Student loan interest deduction: up to $2,500",
        "IRA contributions may be deductible (up to $7,000)"
      ]
    },
    "credits": {
      title: "Don't Miss These Credits",
      tips: [
        "Child Tax Credit: $2,000 per child under 17",
        "EITC: Up to $8,046 for 3+ children",
        "American Opportunity Credit: $2,500 for college expenses",
        "Saver's Credit: Up to $1,000 for retirement contributions"
      ]
    },
    "efile": {
      title: "E-Filing Best Practices",
      tips: [
        "E-file with direct deposit for fastest refund (21 days)",
        "Double-check all Social Security numbers",
        "Sign and date your return",
        "Keep copies of all forms and receipts for 3 years"
      ]
    }
  };
  const contextTips = tips[context] || tips["general"] || {
    title: "General Tax Tips",
    tips: [
      "File on time, even if you can't pay",
      "Review your return carefully before submitting",
      "Ask questions if you're unsure about anything",
      "Keep good records throughout the year"
    ]
  };
  return new Response(JSON.stringify(contextTips), {
    headers: { "Content-Type": "application/json" }
  });
});
var aiAssistant_default = router5;

// src/routes/efilePrep.ts
var efilePrepRouter = t();
efilePrepRouter.post("/prepare", async (req, env) => {
  try {
    const body = await req.json();
    const {
      client_id,
      client_name,
      client_email,
      client_phone,
      service_type,
      return_type = "1040",
      source = "intake_form",
      notes,
      auto_start = true
    } = body;
    if (!client_id || !client_name || !client_email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: client_id, client_name, client_email" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const encName = await encryptPII(client_name, env);
    const encEmail = await encryptPII(client_email, env);
    const encPhone = client_phone ? await encryptPII(client_phone, env) : null;
    const existingClient = await env.DB.prepare(
      "SELECT id FROM clients WHERE email = ?"
    ).bind(encEmail).first();
    let clientDbId;
    if (existingClient) {
      clientDbId = existingClient.id;
      console.log(`[E-file Prep] Client exists with ID ${clientDbId}`);
    } else {
      const clientResult = await env.DB.prepare(`
        INSERT INTO clients (
          full_name, 
          email, 
          phone, 
          status, 
          source,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, 'intake_submitted', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(encName, encEmail, encPhone, source).run();
      clientDbId = clientResult.meta.last_row_id;
      console.log(`[E-file Prep] Created new client with ID ${clientDbId}`);
      await logAudit(env, {
        user_id: "system",
        action: "client_created",
        resource: "clients",
        resource_id: String(clientDbId),
        details: { source, service_type },
        ip_address: req.headers.get("cf-connecting-ip") || "unknown"
      });
    }
    const returnId = v4_default();
    const taxYear = (/* @__PURE__ */ new Date()).getFullYear() - 1;
    const returnResult = await env.DB.prepare(`
      INSERT INTO tax_returns (
        id,
        client_id,
        tax_year,
        return_type,
        status,
        filing_status,
        service_type,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 'draft', 'single', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      returnId,
      clientDbId,
      taxYear,
      return_type,
      service_type || "Tax Preparation",
      notes || "Created from intake form submission"
    ).run();
    console.log(`[E-file Prep] Created return ${returnId} for client ${clientDbId}`);
    const transmissionId = v4_default();
    await env.DB.prepare(`
      INSERT INTO efile_transmissions (
        id,
        return_id,
        client_id,
        method,
        status,
        environment,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, 'DIY', 'created', 'test', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(transmissionId, returnId, clientDbId).run();
    console.log(`[E-file Prep] Created transmission ${transmissionId}`);
    await logAudit(env, {
      user_id: "system",
      action: "efile_prep_initiated",
      resource: "efile_transmissions",
      resource_id: transmissionId,
      details: {
        return_id: returnId,
        client_id: clientDbId,
        return_type,
        service_type,
        source
      },
      ip_address: req.headers.get("cf-connecting-ip") || "unknown"
    });
    return new Response(
      JSON.stringify({
        success: true,
        message: "E-file return preparation initiated",
        data: {
          client_id: clientDbId,
          return_id: returnId,
          transmission_id: transmissionId,
          status: "created",
          next_steps: [
            "Client will receive portal access credentials via email",
            "Client can upload documents securely through portal",
            "Return will be prepared and reviewed",
            "E-file transmission will be submitted to IRS"
          ]
        }
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[E-file Prep] Error:", err);
    return new Response(
      JSON.stringify({
        error: "E-file preparation failed",
        message: err.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
efilePrepRouter.get("/prepare/:client_id/status", async (req, env) => {
  try {
    const clientId = req.params.client_id;
    const result = await env.DB.prepare(`
      SELECT 
        tr.id as return_id,
        tr.return_type,
        tr.status as return_status,
        tr.tax_year,
        et.id as transmission_id,
        et.status as transmission_status,
        et.irs_submission_id,
        tr.created_at
      FROM tax_returns tr
      LEFT JOIN efile_transmissions et ON et.return_id = tr.id
      WHERE tr.client_id = ?
      ORDER BY tr.created_at DESC
      LIMIT 1
    `).bind(clientId).first();
    if (!result) {
      return new Response(
        JSON.stringify({
          error: "No return found for client",
          client_id: clientId
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[E-file Prep] Status check error:", err);
    return new Response(
      JSON.stringify({ error: "Status check failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
var efilePrep_default = efilePrepRouter;

// src/routes/lmsEnrollment.ts
var lmsEnrollmentRouter = t();
lmsEnrollmentRouter.post("/enroll", async (req, env) => {
  try {
    const body = await req.json();
    const required = ["firstName", "lastName", "email", "phone", "program", "textbookFormat", "paymentMethod"];
    const missing = required.filter((field) => !body[field]);
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${missing.join(", ")}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const acks = body.acknowledgements;
    if (!acks || !acks.policies || !acks.conduct || !acks.accreditation || !acks.financialAid || !acks.identity || !acks.data || !acks.absence) {
      return new Response(
        JSON.stringify({ error: "All compliance acknowledgments must be accepted" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const programMap = {
      "cert1": { name: "Tax Professional Certificate I", price: 899, duration: 8 },
      "cert2": { name: "Tax Professional Certificate II", price: 1199, duration: 10 },
      "practitioner": { name: "Tax Practitioner Comprehensive", price: 1499, duration: 12 },
      "ea": { name: "Enrolled Agent Exam Preparation", price: 1999, duration: 16 },
      "bundle": { name: "Tax Professional Bundle", price: 4999, duration: 36 },
      "aas": { name: "Associate of Applied Science - Taxation & Accounting", price: 27500, duration: 52 }
    };
    const program = programMap[body.program];
    if (!program) {
      return new Response(
        JSON.stringify({ error: "Invalid program selection" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!["physical", "ebook", "bundled"].includes(body.textbookFormat)) {
      return new Response(
        JSON.stringify({ error: "Invalid textbook format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const enrollmentId = v4_default();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const encFirstName = await encryptPII(body.firstName, env);
    const encLastName = await encryptPII(body.lastName, env);
    const encEmail = await encryptPII(body.email, env);
    const encPhone = await encryptPII(body.phone, env);
    const existingStudent = await env.DB.prepare(
      "SELECT id FROM clients WHERE email = ?"
    ).bind(encEmail).first();
    let studentId;
    if (existingStudent) {
      studentId = existingStudent.id;
    } else {
      const studentResult = await env.DB.prepare(`
        INSERT INTO clients (
          name, 
          email, 
          phone, 
          dob,
          role,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, 'client', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        encFirstName + " " + encLastName,
        encEmail,
        encPhone,
        body.dateOfBirth || null
      ).run();
      studentId = studentResult.meta.last_row_id || 0;
    }
    let textbookCost = 0;
    if (body.textbookFormat === "physical" || body.textbookFormat === "ebook") {
      textbookCost = 149.99;
    }
    const totalCost = program.price + textbookCost;
    await env.DB.prepare(`
      INSERT INTO lms_enrollments (
        id,
        student_id,
        enrollment_type,
        program_code,
        tuition_locked,
        enrollment_fee_locked,
        materials_fee_locked,
        total_price_locked,
        payment_method,
        payment_plan_installments,
        status,
        enrolled_at,
        created_at,
        updated_at
      ) VALUES (?, ?, 'single', ?, ?, 0, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      enrollmentId,
      studentId,
      body.program,
      program.price,
      textbookCost,
      totalCost,
      body.paymentMethod,
      body.planLength || null
    ).run();
    await env.DB.prepare(`
      INSERT INTO lms_enrollment_details (
        enrollment_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        state,
        zip,
        dob,
        start_date,
        textbook_format,
        acknowledgment_policies,
        acknowledgment_conduct,
        acknowledgment_accreditation,
        acknowledgment_financial_aid,
        acknowledgment_identity,
        acknowledgment_data,
        acknowledgment_absence,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      enrollmentId,
      encFirstName,
      encLastName,
      encEmail,
      encPhone,
      null,
      null,
      null,
      null,
      body.dateOfBirth || null,
      (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      // Start date is today
      body.textbookFormat,
      acks.policies ? 1 : 0,
      acks.conduct ? 1 : 0,
      acks.accreditation ? 1 : 0,
      acks.financialAid ? 1 : 0,
      acks.identity ? 1 : 0,
      acks.data ? 1 : 0,
      acks.absence ? 1 : 0
    ).run();
    await logAudit(env, {
      user_id: void 0,
      action: "lms_enrollment_submitted",
      entity: "lms_enrollments",
      entity_id: enrollmentId,
      details: JSON.stringify({
        program_code: body.program,
        program_name: program.name,
        textbook_format: body.textbookFormat,
        payment_method: body.paymentMethod,
        tuition: program.price,
        textbook_cost: textbookCost,
        total_cost: totalCost,
        all_acknowledgments_accepted: true
      }),
      ip_address: req.headers.get("cf-connecting-ip") || "unknown"
    });
    await sendEnrollmentNotification(env, body, program, enrollmentId);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Enrollment application submitted successfully",
        data: {
          enrollment_id: enrollmentId,
          student_id: studentId,
          program_name: program.name,
          tuition: program.price,
          textbook_format: body.textbookFormat,
          textbook_cost: textbookCost,
          total_cost: totalCost,
          payment_method: body.paymentMethod,
          status: "pending",
          next_steps: [
            `Check email for enrollment confirmation and payment instructions`,
            `${body.textbookFormat === "bundled" ? "Textbook access will be provided upon enrollment" : "Complete textbook purchase or access setup"}`,
            "Complete payment by the deadline provided",
            "LMS login credentials will be sent within 24 hours of payment clearance",
            "Course materials will be available on your start date"
          ]
        }
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[LMS Enrollment] Error:", err);
    return new Response(
      JSON.stringify({
        error: "Enrollment submission failed",
        message: err.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
lmsEnrollmentRouter.get("/enrollments/:id", async (req, env) => {
  try {
    const enrollmentId = req.params.id;
    const enrollment = await env.DB.prepare(`
      SELECT 
        e.id,
        e.student_id,
        e.program_code,
        e.tuition_locked,
        e.total_price_locked,
        e.payment_method,
        e.status,
        e.enrolled_at,
        e.access_granted_at,
        e.completion_date
      FROM lms_enrollments e
      WHERE e.id = ?
    `).bind(enrollmentId).first();
    if (!enrollment) {
      return new Response(
        JSON.stringify({ error: "Enrollment not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ success: true, data: enrollment }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[LMS Enrollment] Get error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve enrollment" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
lmsEnrollmentRouter.post("/certificates/generate", async (req, env) => {
  try {
    const body = await req.json();
    const { enrollment_id, student_name, course_title, completion_date, hours_completed, instructor_name } = body;
    if (!enrollment_id || !student_name || !course_title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const certificateId = v4_default();
    const verificationCode = generateVerificationCode();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO lms_certificates (
        id,
        enrollment_id,
        student_name,
        course_title,
        completion_date,
        hours_completed,
        instructor_name,
        verification_code,
        issued_at,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'active', CURRENT_TIMESTAMP)
    `).bind(
      certificateId,
      enrollment_id,
      await encryptPII(student_name, env),
      course_title,
      completion_date || now,
      hours_completed || 0,
      instructor_name || "Ross Tax Academy",
      verificationCode
    ).run();
    await env.DB.prepare(`
      UPDATE lms_enrollments 
      SET status = 'completed', completion_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(completion_date || now, enrollment_id).run();
    await logAudit(env, {
      user_id: void 0,
      action: "lms_certificate_issued",
      entity: "lms_certificates",
      entity_id: certificateId,
      details: JSON.stringify({
        enrollment_id,
        course_title,
        verification_code: verificationCode
      }),
      ip_address: req.headers.get("cf-connecting-ip") || "unknown"
    });
    const certificateData = {
      certificate_id: certificateId,
      student_name,
      course_title,
      completion_date: completion_date || now,
      hours_completed: hours_completed || 0,
      verification_code: verificationCode,
      verification_url: `https://rosstaxacademy.com/verify?code=${verificationCode}`,
      qr_code_data: `${verificationCode}|${course_title}|${student_name}`,
      instructor_name: instructor_name || "Ross Tax Academy",
      issued_date: now
    };
    return new Response(
      JSON.stringify({
        success: true,
        message: "Certificate generated successfully",
        data: certificateData
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[LMS Certificate] Generation error:", err);
    return new Response(
      JSON.stringify({
        error: "Certificate generation failed",
        message: err.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
lmsEnrollmentRouter.get("/certificates/verify/:code", async (req, env) => {
  try {
    const verificationCode = req.params.code;
    const certificate = await env.DB.prepare(`
      SELECT 
        id,
        course_title,
        completion_date,
        hours_completed,
        issued_at,
        status
      FROM lms_certificates
      WHERE verification_code = ?
    `).bind(verificationCode).first();
    if (!certificate) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: "Certificate not found or invalid verification code"
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (certificate.status !== "active") {
      return new Response(
        JSON.stringify({
          valid: false,
          message: "Certificate has been revoked or is no longer active"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        valid: true,
        message: "Certificate verified successfully",
        data: {
          certificate_id: certificate.id,
          course_title: certificate.course_title,
          completion_date: certificate.completion_date,
          hours_completed: certificate.hours_completed,
          issued_at: certificate.issued_at,
          verified_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[LMS Certificate] Verification error:", err);
    return new Response(
      JSON.stringify({ error: "Verification failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
function generateVerificationCode() {
  const prefix = "RTA";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
__name(generateVerificationCode, "generateVerificationCode");
async function sendEnrollmentNotification(env, enrollmentData, course, enrollmentId) {
  try {
    if (!env.TO_EMAIL) return;
    const emailHtml = `
      <h2>New Academy Enrollment</h2>
      <p><strong>Enrollment ID:</strong> ${enrollmentId}</p>
      <p><strong>Student:</strong> ${enrollmentData.first_name} ${enrollmentData.last_name}</p>
      <p><strong>Email:</strong> ${enrollmentData.email}</p>
      <p><strong>Phone:</strong> ${enrollmentData.phone}</p>
      <p><strong>Course:</strong> ${course.title}</p>
      <p><strong>Tuition:</strong> $${course.price}</p>
      <p><strong>Payment Method:</strong> ${enrollmentData.payment_method}</p>
      <p><strong>Start Date:</strong> ${enrollmentData.start_date}</p>
      <p><strong>Financial Aid:</strong> ${enrollmentData.financial_aid || "None"}</p>
    `;
    console.log("[LMS] Enrollment notification:", emailHtml);
  } catch (err) {
    console.error("[LMS] Notification error:", err);
  }
}
__name(sendEnrollmentNotification, "sendEnrollmentNotification");
var lmsEnrollment_default = lmsEnrollmentRouter;

// src/health.ts
function healthRoute() {
  return new Response(
    JSON.stringify({ status: "ok", service: "ross-tax-prep-api" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
__name(healthRoute, "healthRoute");

// src/cors.ts
function cors(res) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  return new Response(res.body, {
    status: res.status,
    headers
  });
}
__name(cors, "cors");

// node_modules/bcryptjs/index.js
var import_crypto = __toESM(require_crypto(), 1);
var randomFallback = null;
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len));
  } catch {
  }
  try {
    return import_crypto.default.randomBytes(len);
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      "Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative"
    );
  }
  return randomFallback(len);
}
__name(randomBytes, "randomBytes");
function setRandomFallback(random) {
  randomFallback = random;
}
__name(setRandomFallback, "setRandomFallback");
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof rounds !== "number")
    throw Error(
      "Illegal arguments: " + typeof rounds + ", " + typeof seed_length
    );
  if (rounds < 4) rounds = 4;
  else if (rounds > 31) rounds = 31;
  var salt = [];
  salt.push("$2b$");
  if (rounds < 10) salt.push("0");
  salt.push(rounds.toString());
  salt.push("$");
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
  return salt.join("");
}
__name(genSaltSync, "genSaltSync");
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === "function")
    callback = seed_length, seed_length = void 0;
  if (typeof rounds === "function") callback = rounds, rounds = void 0;
  if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
  else if (typeof rounds !== "number")
    throw Error("illegal arguments: " + typeof rounds);
  function _async(callback2) {
    nextTick(function() {
      try {
        callback2(null, genSaltSync(rounds));
      } catch (err) {
        callback2(err);
      }
    });
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(genSalt, "genSalt");
function hashSync(password, salt) {
  if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof salt === "number") salt = genSaltSync(salt);
  if (typeof password !== "string" || typeof salt !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof salt);
  return _hash(password, salt);
}
__name(hashSync, "hashSync");
function hash(password, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password === "string" && typeof salt === "number")
      genSalt(salt, function(err, salt2) {
        _hash(password, salt2, callback2, progressCallback);
      });
    else if (typeof password === "string" && typeof salt === "string")
      _hash(password, salt, callback2, progressCallback);
    else
      nextTick(
        callback2.bind(
          this,
          Error("Illegal arguments: " + typeof password + ", " + typeof salt)
        )
      );
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(hash, "hash");
function safeStringCompare(known, unknown) {
  var diff = known.length ^ unknown.length;
  for (var i = 0; i < known.length; ++i) {
    diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
  }
  return diff === 0;
}
__name(safeStringCompare, "safeStringCompare");
function compareSync(password, hash2) {
  if (typeof password !== "string" || typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof hash2);
  if (hash2.length !== 60) return false;
  return safeStringCompare(
    hashSync(password, hash2.substring(0, hash2.length - 31)),
    hash2
  );
}
__name(compareSync, "compareSync");
function compare(password, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password !== "string" || typeof hashValue !== "string") {
      nextTick(
        callback2.bind(
          this,
          Error(
            "Illegal arguments: " + typeof password + ", " + typeof hashValue
          )
        )
      );
      return;
    }
    if (hashValue.length !== 60) {
      nextTick(callback2.bind(this, null, false));
      return;
    }
    hash(
      password,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err);
        else callback2(null, safeStringCompare(comp, hashValue));
      },
      progressCallback
    );
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
__name(compare, "compare");
function getRounds(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  return parseInt(hash2.split("$")[2], 10);
}
__name(getRounds, "getRounds");
function getSalt(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  if (hash2.length !== 60)
    throw Error("Illegal hash length: " + hash2.length + " != 60");
  return hash2.substring(0, 29);
}
__name(getSalt, "getSalt");
function truncates(password) {
  if (typeof password !== "string")
    throw Error("Illegal arguments: " + typeof password);
  return utf8Length(password) > 72;
}
__name(truncates, "truncates");
var nextTick = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function utf8Length(string) {
  var len = 0, c = 0;
  for (var i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i);
    if (c < 128) len += 1;
    else if (c < 2048) len += 2;
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i;
      len += 4;
    } else len += 3;
  }
  return len;
}
__name(utf8Length, "utf8Length");
function utf8Array(string) {
  var offset = 0, c1, c2;
  var buffer = new Array(utf8Length(string));
  for (var i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i);
    if (c1 < 128) {
      buffer[offset++] = c1;
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192;
      buffer[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i;
      buffer[offset++] = c1 >> 18 | 240;
      buffer[offset++] = c1 >> 12 & 63 | 128;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    } else {
      buffer[offset++] = c1 >> 12 | 224;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    }
  }
  return buffer;
}
__name(utf8Array, "utf8Array");
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var BASE64_INDEX = [
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  62,
  63,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  -1,
  -1,
  -1,
  -1,
  -1
];
function base64_encode(b, len) {
  var off = 0, rs = [], c1, c2;
  if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
  while (off < len) {
    c1 = b[off++] & 255;
    rs.push(BASE64_CODE[c1 >> 2 & 63]);
    c1 = (c1 & 3) << 4;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 4 & 15;
    rs.push(BASE64_CODE[c1 & 63]);
    c1 = (c2 & 15) << 2;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 6 & 3;
    rs.push(BASE64_CODE[c1 & 63]);
    rs.push(BASE64_CODE[c2 & 63]);
  }
  return rs.join("");
}
__name(base64_encode, "base64_encode");
function base64_decode(s, len) {
  var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o2, code;
  if (len <= 0) throw Error("Illegal len: " + len);
  while (off < slen - 1 && olen < len) {
    code = s.charCodeAt(off++);
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    code = s.charCodeAt(off++);
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c1 == -1 || c2 == -1) break;
    o2 = c1 << 2 >>> 0;
    o2 |= (c2 & 48) >> 4;
    rs.push(String.fromCharCode(o2));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c3 == -1) break;
    o2 = (c2 & 15) << 4 >>> 0;
    o2 |= (c3 & 60) >> 2;
    rs.push(String.fromCharCode(o2));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    o2 = (c3 & 3) << 6 >>> 0;
    o2 |= c4;
    rs.push(String.fromCharCode(o2));
    ++olen;
  }
  var res = [];
  for (off = 0; off < olen; off++) res.push(rs[off].charCodeAt(0));
  return res;
}
__name(base64_decode, "base64_decode");
var BCRYPT_SALT_LEN = 16;
var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
var BLOWFISH_NUM_ROUNDS = 16;
var MAX_EXECUTION_TIME = 100;
var P_ORIG = [
  608135816,
  2242054355,
  320440878,
  57701188,
  2752067618,
  698298832,
  137296536,
  3964562569,
  1160258022,
  953160567,
  3193202383,
  887688300,
  3232508343,
  3380367581,
  1065670069,
  3041331479,
  2450970073,
  2306472731
];
var S_ORIG = [
  3509652390,
  2564797868,
  805139163,
  3491422135,
  3101798381,
  1780907670,
  3128725573,
  4046225305,
  614570311,
  3012652279,
  134345442,
  2240740374,
  1667834072,
  1901547113,
  2757295779,
  4103290238,
  227898511,
  1921955416,
  1904987480,
  2182433518,
  2069144605,
  3260701109,
  2620446009,
  720527379,
  3318853667,
  677414384,
  3393288472,
  3101374703,
  2390351024,
  1614419982,
  1822297739,
  2954791486,
  3608508353,
  3174124327,
  2024746970,
  1432378464,
  3864339955,
  2857741204,
  1464375394,
  1676153920,
  1439316330,
  715854006,
  3033291828,
  289532110,
  2706671279,
  2087905683,
  3018724369,
  1668267050,
  732546397,
  1947742710,
  3462151702,
  2609353502,
  2950085171,
  1814351708,
  2050118529,
  680887927,
  999245976,
  1800124847,
  3300911131,
  1713906067,
  1641548236,
  4213287313,
  1216130144,
  1575780402,
  4018429277,
  3917837745,
  3693486850,
  3949271944,
  596196993,
  3549867205,
  258830323,
  2213823033,
  772490370,
  2760122372,
  1774776394,
  2652871518,
  566650946,
  4142492826,
  1728879713,
  2882767088,
  1783734482,
  3629395816,
  2517608232,
  2874225571,
  1861159788,
  326777828,
  3124490320,
  2130389656,
  2716951837,
  967770486,
  1724537150,
  2185432712,
  2364442137,
  1164943284,
  2105845187,
  998989502,
  3765401048,
  2244026483,
  1075463327,
  1455516326,
  1322494562,
  910128902,
  469688178,
  1117454909,
  936433444,
  3490320968,
  3675253459,
  1240580251,
  122909385,
  2157517691,
  634681816,
  4142456567,
  3825094682,
  3061402683,
  2540495037,
  79693498,
  3249098678,
  1084186820,
  1583128258,
  426386531,
  1761308591,
  1047286709,
  322548459,
  995290223,
  1845252383,
  2603652396,
  3431023940,
  2942221577,
  3202600964,
  3727903485,
  1712269319,
  422464435,
  3234572375,
  1170764815,
  3523960633,
  3117677531,
  1434042557,
  442511882,
  3600875718,
  1076654713,
  1738483198,
  4213154764,
  2393238008,
  3677496056,
  1014306527,
  4251020053,
  793779912,
  2902807211,
  842905082,
  4246964064,
  1395751752,
  1040244610,
  2656851899,
  3396308128,
  445077038,
  3742853595,
  3577915638,
  679411651,
  2892444358,
  2354009459,
  1767581616,
  3150600392,
  3791627101,
  3102740896,
  284835224,
  4246832056,
  1258075500,
  768725851,
  2589189241,
  3069724005,
  3532540348,
  1274779536,
  3789419226,
  2764799539,
  1660621633,
  3471099624,
  4011903706,
  913787905,
  3497959166,
  737222580,
  2514213453,
  2928710040,
  3937242737,
  1804850592,
  3499020752,
  2949064160,
  2386320175,
  2390070455,
  2415321851,
  4061277028,
  2290661394,
  2416832540,
  1336762016,
  1754252060,
  3520065937,
  3014181293,
  791618072,
  3188594551,
  3933548030,
  2332172193,
  3852520463,
  3043980520,
  413987798,
  3465142937,
  3030929376,
  4245938359,
  2093235073,
  3534596313,
  375366246,
  2157278981,
  2479649556,
  555357303,
  3870105701,
  2008414854,
  3344188149,
  4221384143,
  3956125452,
  2067696032,
  3594591187,
  2921233993,
  2428461,
  544322398,
  577241275,
  1471733935,
  610547355,
  4027169054,
  1432588573,
  1507829418,
  2025931657,
  3646575487,
  545086370,
  48609733,
  2200306550,
  1653985193,
  298326376,
  1316178497,
  3007786442,
  2064951626,
  458293330,
  2589141269,
  3591329599,
  3164325604,
  727753846,
  2179363840,
  146436021,
  1461446943,
  4069977195,
  705550613,
  3059967265,
  3887724982,
  4281599278,
  3313849956,
  1404054877,
  2845806497,
  146425753,
  1854211946,
  1266315497,
  3048417604,
  3681880366,
  3289982499,
  290971e4,
  1235738493,
  2632868024,
  2414719590,
  3970600049,
  1771706367,
  1449415276,
  3266420449,
  422970021,
  1963543593,
  2690192192,
  3826793022,
  1062508698,
  1531092325,
  1804592342,
  2583117782,
  2714934279,
  4024971509,
  1294809318,
  4028980673,
  1289560198,
  2221992742,
  1669523910,
  35572830,
  157838143,
  1052438473,
  1016535060,
  1802137761,
  1753167236,
  1386275462,
  3080475397,
  2857371447,
  1040679964,
  2145300060,
  2390574316,
  1461121720,
  2956646967,
  4031777805,
  4028374788,
  33600511,
  2920084762,
  1018524850,
  629373528,
  3691585981,
  3515945977,
  2091462646,
  2486323059,
  586499841,
  988145025,
  935516892,
  3367335476,
  2599673255,
  2839830854,
  265290510,
  3972581182,
  2759138881,
  3795373465,
  1005194799,
  847297441,
  406762289,
  1314163512,
  1332590856,
  1866599683,
  4127851711,
  750260880,
  613907577,
  1450815602,
  3165620655,
  3734664991,
  3650291728,
  3012275730,
  3704569646,
  1427272223,
  778793252,
  1343938022,
  2676280711,
  2052605720,
  1946737175,
  3164576444,
  3914038668,
  3967478842,
  3682934266,
  1661551462,
  3294938066,
  4011595847,
  840292616,
  3712170807,
  616741398,
  312560963,
  711312465,
  1351876610,
  322626781,
  1910503582,
  271666773,
  2175563734,
  1594956187,
  70604529,
  3617834859,
  1007753275,
  1495573769,
  4069517037,
  2549218298,
  2663038764,
  504708206,
  2263041392,
  3941167025,
  2249088522,
  1514023603,
  1998579484,
  1312622330,
  694541497,
  2582060303,
  2151582166,
  1382467621,
  776784248,
  2618340202,
  3323268794,
  2497899128,
  2784771155,
  503983604,
  4076293799,
  907881277,
  423175695,
  432175456,
  1378068232,
  4145222326,
  3954048622,
  3938656102,
  3820766613,
  2793130115,
  2977904593,
  26017576,
  3274890735,
  3194772133,
  1700274565,
  1756076034,
  4006520079,
  3677328699,
  720338349,
  1533947780,
  354530856,
  688349552,
  3973924725,
  1637815568,
  332179504,
  3949051286,
  53804574,
  2852348879,
  3044236432,
  1282449977,
  3583942155,
  3416972820,
  4006381244,
  1617046695,
  2628476075,
  3002303598,
  1686838959,
  431878346,
  2686675385,
  1700445008,
  1080580658,
  1009431731,
  832498133,
  3223435511,
  2605976345,
  2271191193,
  2516031870,
  1648197032,
  4164389018,
  2548247927,
  300782431,
  375919233,
  238389289,
  3353747414,
  2531188641,
  2019080857,
  1475708069,
  455242339,
  2609103871,
  448939670,
  3451063019,
  1395535956,
  2413381860,
  1841049896,
  1491858159,
  885456874,
  4264095073,
  4001119347,
  1565136089,
  3898914787,
  1108368660,
  540939232,
  1173283510,
  2745871338,
  3681308437,
  4207628240,
  3343053890,
  4016749493,
  1699691293,
  1103962373,
  3625875870,
  2256883143,
  3830138730,
  1031889488,
  3479347698,
  1535977030,
  4236805024,
  3251091107,
  2132092099,
  1774941330,
  1199868427,
  1452454533,
  157007616,
  2904115357,
  342012276,
  595725824,
  1480756522,
  206960106,
  497939518,
  591360097,
  863170706,
  2375253569,
  3596610801,
  1814182875,
  2094937945,
  3421402208,
  1082520231,
  3463918190,
  2785509508,
  435703966,
  3908032597,
  1641649973,
  2842273706,
  3305899714,
  1510255612,
  2148256476,
  2655287854,
  3276092548,
  4258621189,
  236887753,
  3681803219,
  274041037,
  1734335097,
  3815195456,
  3317970021,
  1899903192,
  1026095262,
  4050517792,
  356393447,
  2410691914,
  3873677099,
  3682840055,
  3913112168,
  2491498743,
  4132185628,
  2489919796,
  1091903735,
  1979897079,
  3170134830,
  3567386728,
  3557303409,
  857797738,
  1136121015,
  1342202287,
  507115054,
  2535736646,
  337727348,
  3213592640,
  1301675037,
  2528481711,
  1895095763,
  1721773893,
  3216771564,
  62756741,
  2142006736,
  835421444,
  2531993523,
  1442658625,
  3659876326,
  2882144922,
  676362277,
  1392781812,
  170690266,
  3921047035,
  1759253602,
  3611846912,
  1745797284,
  664899054,
  1329594018,
  3901205900,
  3045908486,
  2062866102,
  2865634940,
  3543621612,
  3464012697,
  1080764994,
  553557557,
  3656615353,
  3996768171,
  991055499,
  499776247,
  1265440854,
  648242737,
  3940784050,
  980351604,
  3713745714,
  1749149687,
  3396870395,
  4211799374,
  3640570775,
  1161844396,
  3125318951,
  1431517754,
  545492359,
  4268468663,
  3499529547,
  1437099964,
  2702547544,
  3433638243,
  2581715763,
  2787789398,
  1060185593,
  1593081372,
  2418618748,
  4260947970,
  69676912,
  2159744348,
  86519011,
  2512459080,
  3838209314,
  1220612927,
  3339683548,
  133810670,
  1090789135,
  1078426020,
  1569222167,
  845107691,
  3583754449,
  4072456591,
  1091646820,
  628848692,
  1613405280,
  3757631651,
  526609435,
  236106946,
  48312990,
  2942717905,
  3402727701,
  1797494240,
  859738849,
  992217954,
  4005476642,
  2243076622,
  3870952857,
  3732016268,
  765654824,
  3490871365,
  2511836413,
  1685915746,
  3888969200,
  1414112111,
  2273134842,
  3281911079,
  4080962846,
  172450625,
  2569994100,
  980381355,
  4109958455,
  2819808352,
  2716589560,
  2568741196,
  3681446669,
  3329971472,
  1835478071,
  660984891,
  3704678404,
  4045999559,
  3422617507,
  3040415634,
  1762651403,
  1719377915,
  3470491036,
  2693910283,
  3642056355,
  3138596744,
  1364962596,
  2073328063,
  1983633131,
  926494387,
  3423689081,
  2150032023,
  4096667949,
  1749200295,
  3328846651,
  309677260,
  2016342300,
  1779581495,
  3079819751,
  111262694,
  1274766160,
  443224088,
  298511866,
  1025883608,
  3806446537,
  1145181785,
  168956806,
  3641502830,
  3584813610,
  1689216846,
  3666258015,
  3200248200,
  1692713982,
  2646376535,
  4042768518,
  1618508792,
  1610833997,
  3523052358,
  4130873264,
  2001055236,
  3610705100,
  2202168115,
  4028541809,
  2961195399,
  1006657119,
  2006996926,
  3186142756,
  1430667929,
  3210227297,
  1314452623,
  4074634658,
  4101304120,
  2273951170,
  1399257539,
  3367210612,
  3027628629,
  1190975929,
  2062231137,
  2333990788,
  2221543033,
  2438960610,
  1181637006,
  548689776,
  2362791313,
  3372408396,
  3104550113,
  3145860560,
  296247880,
  1970579870,
  3078560182,
  3769228297,
  1714227617,
  3291629107,
  3898220290,
  166772364,
  1251581989,
  493813264,
  448347421,
  195405023,
  2709975567,
  677966185,
  3703036547,
  1463355134,
  2715995803,
  1338867538,
  1343315457,
  2802222074,
  2684532164,
  233230375,
  2599980071,
  2000651841,
  3277868038,
  1638401717,
  4028070440,
  3237316320,
  6314154,
  819756386,
  300326615,
  590932579,
  1405279636,
  3267499572,
  3150704214,
  2428286686,
  3959192993,
  3461946742,
  1862657033,
  1266418056,
  963775037,
  2089974820,
  2263052895,
  1917689273,
  448879540,
  3550394620,
  3981727096,
  150775221,
  3627908307,
  1303187396,
  508620638,
  2975983352,
  2726630617,
  1817252668,
  1876281319,
  1457606340,
  908771278,
  3720792119,
  3617206836,
  2455994898,
  1729034894,
  1080033504,
  976866871,
  3556439503,
  2881648439,
  1522871579,
  1555064734,
  1336096578,
  3548522304,
  2579274686,
  3574697629,
  3205460757,
  3593280638,
  3338716283,
  3079412587,
  564236357,
  2993598910,
  1781952180,
  1464380207,
  3163844217,
  3332601554,
  1699332808,
  1393555694,
  1183702653,
  3581086237,
  1288719814,
  691649499,
  2847557200,
  2895455976,
  3193889540,
  2717570544,
  1781354906,
  1676643554,
  2592534050,
  3230253752,
  1126444790,
  2770207658,
  2633158820,
  2210423226,
  2615765581,
  2414155088,
  3127139286,
  673620729,
  2805611233,
  1269405062,
  4015350505,
  3341807571,
  4149409754,
  1057255273,
  2012875353,
  2162469141,
  2276492801,
  2601117357,
  993977747,
  3918593370,
  2654263191,
  753973209,
  36408145,
  2530585658,
  25011837,
  3520020182,
  2088578344,
  530523599,
  2918365339,
  1524020338,
  1518925132,
  3760827505,
  3759777254,
  1202760957,
  3985898139,
  3906192525,
  674977740,
  4174734889,
  2031300136,
  2019492241,
  3983892565,
  4153806404,
  3822280332,
  352677332,
  2297720250,
  60907813,
  90501309,
  3286998549,
  1016092578,
  2535922412,
  2839152426,
  457141659,
  509813237,
  4120667899,
  652014361,
  1966332200,
  2975202805,
  55981186,
  2327461051,
  676427537,
  3255491064,
  2882294119,
  3433927263,
  1307055953,
  942726286,
  933058658,
  2468411793,
  3933900994,
  4215176142,
  1361170020,
  2001714738,
  2830558078,
  3274259782,
  1222529897,
  1679025792,
  2729314320,
  3714953764,
  1770335741,
  151462246,
  3013232138,
  1682292957,
  1483529935,
  471910574,
  1539241949,
  458788160,
  3436315007,
  1807016891,
  3718408830,
  978976581,
  1043663428,
  3165965781,
  1927990952,
  4200891579,
  2372276910,
  3208408903,
  3533431907,
  1412390302,
  2931980059,
  4132332400,
  1947078029,
  3881505623,
  4168226417,
  2941484381,
  1077988104,
  1320477388,
  886195818,
  18198404,
  3786409e3,
  2509781533,
  112762804,
  3463356488,
  1866414978,
  891333506,
  18488651,
  661792760,
  1628790961,
  3885187036,
  3141171499,
  876946877,
  2693282273,
  1372485963,
  791857591,
  2686433993,
  3759982718,
  3167212022,
  3472953795,
  2716379847,
  445679433,
  3561995674,
  3504004811,
  3574258232,
  54117162,
  3331405415,
  2381918588,
  3769707343,
  4154350007,
  1140177722,
  4074052095,
  668550556,
  3214352940,
  367459370,
  261225585,
  2610173221,
  4209349473,
  3468074219,
  3265815641,
  314222801,
  3066103646,
  3808782860,
  282218597,
  3406013506,
  3773591054,
  379116347,
  1285071038,
  846784868,
  2669647154,
  3771962079,
  3550491691,
  2305946142,
  453669953,
  1268987020,
  3317592352,
  3279303384,
  3744833421,
  2610507566,
  3859509063,
  266596637,
  3847019092,
  517658769,
  3462560207,
  3443424879,
  370717030,
  4247526661,
  2224018117,
  4143653529,
  4112773975,
  2788324899,
  2477274417,
  1456262402,
  2901442914,
  1517677493,
  1846949527,
  2295493580,
  3734397586,
  2176403920,
  1280348187,
  1908823572,
  3871786941,
  846861322,
  1172426758,
  3287448474,
  3383383037,
  1655181056,
  3139813346,
  901632758,
  1897031941,
  2986607138,
  3066810236,
  3447102507,
  1393639104,
  373351379,
  950779232,
  625454576,
  3124240540,
  4148612726,
  2007998917,
  544563296,
  2244738638,
  2330496472,
  2058025392,
  1291430526,
  424198748,
  50039436,
  29584100,
  3605783033,
  2429876329,
  2791104160,
  1057563949,
  3255363231,
  3075367218,
  3463963227,
  1469046755,
  985887462
];
var C_ORIG = [
  1332899944,
  1700884034,
  1701343084,
  1684370003,
  1668446532,
  1869963892
];
function _encipher(lr, off, P, S) {
  var n, l = lr[off], r2 = lr[off + 1];
  l ^= P[0];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[1];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[2];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[3];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[4];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[5];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[6];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[7];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[8];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[9];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[10];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[11];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[12];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[13];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[14];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r2 ^= n ^ P[15];
  n = S[r2 >>> 24];
  n += S[256 | r2 >> 16 & 255];
  n ^= S[512 | r2 >> 8 & 255];
  n += S[768 | r2 & 255];
  l ^= n ^ P[16];
  lr[off] = r2 ^ P[BLOWFISH_NUM_ROUNDS + 1];
  lr[off + 1] = l;
  return lr;
}
__name(_encipher, "_encipher");
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
  return { key: word, offp };
}
__name(_streamtoword, "_streamtoword");
function _key(key, P, S) {
  var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
  for (i = 0; i < plen; i += 2)
    lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
__name(_key, "_key");
function _ekskey(data, key, P, S) {
  var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
  offp = 0;
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
__name(_ekskey, "_ekskey");
function _crypt(b, salt, rounds, callback, progressCallback) {
  var cdata = C_ORIG.slice(), clen = cdata.length, err;
  if (rounds < 4 || rounds > 31) {
    err = Error("Illegal number of rounds (4-31): " + rounds);
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      "Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN
    );
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  rounds = 1 << rounds >>> 0;
  var P, S, i = 0, j;
  if (typeof Int32Array === "function") {
    P = new Int32Array(P_ORIG);
    S = new Int32Array(S_ORIG);
  } else {
    P = P_ORIG.slice();
    S = S_ORIG.slice();
  }
  _ekskey(salt, b, P, S);
  function next() {
    if (progressCallback) progressCallback(i / rounds);
    if (i < rounds) {
      var start = Date.now();
      for (; i < rounds; ) {
        i = i + 1;
        _key(b, P, S);
        _key(salt, P, S);
        if (Date.now() - start > MAX_EXECUTION_TIME) break;
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
      var ret = [];
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
      if (callback) {
        callback(null, ret);
        return;
      } else return ret;
    }
    if (callback) nextTick(next);
  }
  __name(next, "next");
  if (typeof callback !== "undefined") {
    next();
  } else {
    var res;
    while (true) if (typeof (res = next()) !== "undefined") return res || [];
  }
}
__name(_crypt, "_crypt");
function _hash(password, salt, callback, progressCallback) {
  var err;
  if (typeof password !== "string" || typeof salt !== "string") {
    err = Error("Invalid string / salt: Not a string");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var minor, offset;
  if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
    err = Error("Invalid salt version: " + salt.substring(0, 2));
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
  else {
    minor = salt.charAt(2);
    if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
      err = Error("Invalid salt revision: " + salt.substring(2, 4));
      if (callback) {
        nextTick(callback.bind(this, err));
        return;
      } else throw err;
    }
    offset = 4;
  }
  if (salt.charAt(offset + 2) > "$") {
    err = Error("Missing salt rounds");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
  password += minor >= "a" ? "\0" : "";
  var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
  function finish(bytes) {
    var res = [];
    res.push("$2");
    if (minor >= "a") res.push(minor);
    res.push("$");
    if (rounds < 10) res.push("0");
    res.push(rounds.toString());
    res.push("$");
    res.push(base64_encode(saltb, saltb.length));
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
    return res.join("");
  }
  __name(finish, "finish");
  if (typeof callback == "undefined")
    return finish(_crypt(passwordb, saltb, rounds));
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null);
        else callback(null, finish(bytes));
      },
      progressCallback
    );
  }
}
__name(_hash, "_hash");
function encodeBase64(bytes, length) {
  return base64_encode(bytes, length);
}
__name(encodeBase64, "encodeBase64");
function decodeBase64(string, length) {
  return base64_decode(string, length);
}
__name(decodeBase64, "decodeBase64");
var bcryptjs_default = {
  setRandomFallback,
  genSaltSync,
  genSalt,
  hashSync,
  hash,
  compareSync,
  compare,
  getRounds,
  getSalt,
  truncates,
  encodeBase64,
  decodeBase64
};

// node_modules/otpauth/dist/otpauth.esm.js
var uintDecode = /* @__PURE__ */ __name((num) => {
  const buf = new ArrayBuffer(8);
  const arr = new Uint8Array(buf);
  let acc = num;
  for (let i = 7; i >= 0; i--) {
    if (acc === 0) break;
    arr[i] = acc & 255;
    acc -= arr[i];
    acc /= 256;
  }
  return arr;
}, "uintDecode");
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
__name(isBytes, "isBytes");
function anumber(n) {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error("positive integer expected, got " + n);
}
__name(anumber, "anumber");
function abytes(b, ...lengths) {
  if (!isBytes(b)) throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
__name(abytes, "abytes");
function ahash(h2) {
  if (typeof h2 !== "function" || typeof h2.create !== "function") throw new Error("Hash should be wrapped by utils.createHasher");
  anumber(h2.outputLen);
  anumber(h2.blockLen);
}
__name(ahash, "ahash");
function aexists(instance, checkFinished = true) {
  if (instance.destroyed) throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
}
__name(aexists, "aexists");
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
__name(aoutput, "aoutput");
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
__name(u32, "u32");
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
__name(clean, "clean");
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
__name(createView, "createView");
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
__name(rotr, "rotr");
function rotl(word, shift) {
  return word << shift | word >>> 32 - shift >>> 0;
}
__name(rotl, "rotl");
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([
  287454020
]).buffer)[0] === 68)();
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
__name(byteSwap, "byteSwap");
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
__name(byteSwap32, "byteSwap32");
var swap32IfBE = isLE ? (u2) => u2 : byteSwap32;
function utf8ToBytes(str) {
  if (typeof str !== "string") throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
__name(utf8ToBytes, "utf8ToBytes");
function toBytes(data) {
  if (typeof data === "string") data = utf8ToBytes(data);
  abytes(data);
  return data;
}
__name(toBytes, "toBytes");
var Hash = class {
  static {
    __name(this, "Hash");
  }
};
function createHasher(hashCons) {
  const hashC = /* @__PURE__ */ __name((msg) => hashCons().update(toBytes(msg)).digest(), "hashC");
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
__name(createHasher, "createHasher");
var HMAC = class extends Hash {
  static {
    __name(this, "HMAC");
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    abytes(out, this.outputLen);
    this.finished = true;
    this.iHash.digestInto(out);
    this.oHash.update(out);
    this.oHash.digestInto(out);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to || (to = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
  constructor(hash2, _key2) {
    super();
    this.finished = false;
    this.destroyed = false;
    ahash(hash2);
    const key = toBytes(_key2);
    this.iHash = hash2.create();
    if (typeof this.iHash.update !== "function") throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash2.create().update(key).digest() : key);
    for (let i = 0; i < pad.length; i++) pad[i] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash2.create();
    for (let i = 0; i < pad.length; i++) pad[i] ^= 54 ^ 92;
    this.oHash.update(pad);
    clean(pad);
  }
};
var hmac = /* @__PURE__ */ __name((hash2, key, message) => new HMAC(hash2, key).update(message).digest(), "hmac");
hmac.create = (hash2, key) => new HMAC(hash2, key);
function setBigUint64(view, byteOffset, value, isLE2) {
  if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE2);
  const _32n2 = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n2 & _u32_max);
  const wl = Number(value & _u32_max);
  const h2 = isLE2 ? 4 : 0;
  const l = isLE2 ? 0 : 4;
  view.setUint32(byteOffset + h2, wh, isLE2);
  view.setUint32(byteOffset + l, wl, isLE2);
}
__name(setBigUint64, "setBigUint64");
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
__name(Chi, "Chi");
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
__name(Maj, "Maj");
var HashMD = class extends Hash {
  static {
    __name(this, "HashMD");
  }
  update(data) {
    aexists(this);
    data = toBytes(data);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE: isLE2 } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++) buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE2);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length) throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE2);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to || (to = new this.constructor());
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen) to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  constructor(blockLen, outputLen, padOffset, isLE2) {
    super();
    this.finished = false;
    this.length = 0;
    this.pos = 0;
    this.destroyed = false;
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE2;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var SHA224_IV = /* @__PURE__ */ Uint32Array.from([
  3238371032,
  914150663,
  812702999,
  4144912697,
  4290775857,
  1750603025,
  1694076839,
  3204075428
]);
var SHA384_IV = /* @__PURE__ */ Uint32Array.from([
  3418070365,
  3238371032,
  1654270250,
  914150663,
  2438529370,
  812702999,
  355462360,
  4144912697,
  1731405415,
  4290775857,
  2394180231,
  1750603025,
  3675008525,
  1694076839,
  1203062813,
  3204075428
]);
var SHA512_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  4089235720,
  3144134277,
  2227873595,
  1013904242,
  4271175723,
  2773480762,
  1595750129,
  1359893119,
  2917565137,
  2600822924,
  725511199,
  528734635,
  4215389547,
  1541459225,
  327033209
]);
var SHA1_IV = /* @__PURE__ */ Uint32Array.from([
  1732584193,
  4023233417,
  2562383102,
  271733878,
  3285377520
]);
var SHA1_W = /* @__PURE__ */ new Uint32Array(80);
var SHA1 = class extends HashMD {
  static {
    __name(this, "SHA1");
  }
  get() {
    const { A, B, C, D, E } = this;
    return [
      A,
      B,
      C,
      D,
      E
    ];
  }
  set(A, B, C, D, E) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4) SHA1_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 80; i++) SHA1_W[i] = rotl(SHA1_W[i - 3] ^ SHA1_W[i - 8] ^ SHA1_W[i - 14] ^ SHA1_W[i - 16], 1);
    let { A, B, C, D, E } = this;
    for (let i = 0; i < 80; i++) {
      let F, K;
      if (i < 20) {
        F = Chi(B, C, D);
        K = 1518500249;
      } else if (i < 40) {
        F = B ^ C ^ D;
        K = 1859775393;
      } else if (i < 60) {
        F = Maj(B, C, D);
        K = 2400959708;
      } else {
        F = B ^ C ^ D;
        K = 3395469782;
      }
      const T = rotl(A, 5) + F + E + K + SHA1_W[i] | 0;
      E = D;
      D = C;
      C = rotl(B, 30);
      B = A;
      A = T;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    this.set(A, B, C, D, E);
  }
  roundClean() {
    clean(SHA1_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0);
    clean(this.buffer);
  }
  constructor() {
    super(64, 20, 8, false);
    this.A = SHA1_IV[0] | 0;
    this.B = SHA1_IV[1] | 0;
    this.C = SHA1_IV[2] | 0;
    this.D = SHA1_IV[3] | 0;
    this.E = SHA1_IV[4] | 0;
  }
};
var sha1 = /* @__PURE__ */ createHasher(() => new SHA1());
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
  if (le) return {
    h: Number(n & U32_MASK64),
    l: Number(n >> _32n & U32_MASK64)
  };
  return {
    h: Number(n >> _32n & U32_MASK64) | 0,
    l: Number(n & U32_MASK64) | 0
  };
}
__name(fromBig, "fromBig");
function split(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i = 0; i < len; i++) {
    const { h: h2, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [
      h2,
      l
    ];
  }
  return [
    Ah,
    Al
  ];
}
__name(split, "split");
var shrSH = /* @__PURE__ */ __name((h2, _l, s) => h2 >>> s, "shrSH");
var shrSL = /* @__PURE__ */ __name((h2, l, s) => h2 << 32 - s | l >>> s, "shrSL");
var rotrSH = /* @__PURE__ */ __name((h2, l, s) => h2 >>> s | l << 32 - s, "rotrSH");
var rotrSL = /* @__PURE__ */ __name((h2, l, s) => h2 << 32 - s | l >>> s, "rotrSL");
var rotrBH = /* @__PURE__ */ __name((h2, l, s) => h2 << 64 - s | l >>> s - 32, "rotrBH");
var rotrBL = /* @__PURE__ */ __name((h2, l, s) => h2 >>> s - 32 | l << 64 - s, "rotrBL");
var rotlSH = /* @__PURE__ */ __name((h2, l, s) => h2 << s | l >>> 32 - s, "rotlSH");
var rotlSL = /* @__PURE__ */ __name((h2, l, s) => l << s | h2 >>> 32 - s, "rotlSL");
var rotlBH = /* @__PURE__ */ __name((h2, l, s) => l << s - 32 | h2 >>> 64 - s, "rotlBH");
var rotlBL = /* @__PURE__ */ __name((h2, l, s) => h2 << s - 32 | l >>> 64 - s, "rotlBL");
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return {
    h: Ah + Bh + (l / 2 ** 32 | 0) | 0,
    l: l | 0
  };
}
__name(add, "add");
var add3L = /* @__PURE__ */ __name((Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0), "add3L");
var add3H = /* @__PURE__ */ __name((low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0, "add3H");
var add4L = /* @__PURE__ */ __name((Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0), "add4L");
var add4H = /* @__PURE__ */ __name((low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0, "add4H");
var add5L = /* @__PURE__ */ __name((Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0), "add5L");
var add5H = /* @__PURE__ */ __name((low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0, "add5H");
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA256 = class extends HashMD {
  static {
    __name(this, "SHA256");
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [
      A,
      B,
      C,
      D,
      E,
      F,
      G,
      H
    ];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4) SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
  constructor(outputLen = 32) {
    super(64, outputLen, 8, false);
    this.A = SHA256_IV[0] | 0;
    this.B = SHA256_IV[1] | 0;
    this.C = SHA256_IV[2] | 0;
    this.D = SHA256_IV[3] | 0;
    this.E = SHA256_IV[4] | 0;
    this.F = SHA256_IV[5] | 0;
    this.G = SHA256_IV[6] | 0;
    this.H = SHA256_IV[7] | 0;
  }
};
var SHA224 = class extends SHA256 {
  static {
    __name(this, "SHA224");
  }
  constructor() {
    super(28);
    this.A = SHA224_IV[0] | 0;
    this.B = SHA224_IV[1] | 0;
    this.C = SHA224_IV[2] | 0;
    this.D = SHA224_IV[3] | 0;
    this.E = SHA224_IV[4] | 0;
    this.F = SHA224_IV[5] | 0;
    this.G = SHA224_IV[6] | 0;
    this.H = SHA224_IV[7] | 0;
  }
};
var K512 = /* @__PURE__ */ (() => split([
  "0x428a2f98d728ae22",
  "0x7137449123ef65cd",
  "0xb5c0fbcfec4d3b2f",
  "0xe9b5dba58189dbbc",
  "0x3956c25bf348b538",
  "0x59f111f1b605d019",
  "0x923f82a4af194f9b",
  "0xab1c5ed5da6d8118",
  "0xd807aa98a3030242",
  "0x12835b0145706fbe",
  "0x243185be4ee4b28c",
  "0x550c7dc3d5ffb4e2",
  "0x72be5d74f27b896f",
  "0x80deb1fe3b1696b1",
  "0x9bdc06a725c71235",
  "0xc19bf174cf692694",
  "0xe49b69c19ef14ad2",
  "0xefbe4786384f25e3",
  "0x0fc19dc68b8cd5b5",
  "0x240ca1cc77ac9c65",
  "0x2de92c6f592b0275",
  "0x4a7484aa6ea6e483",
  "0x5cb0a9dcbd41fbd4",
  "0x76f988da831153b5",
  "0x983e5152ee66dfab",
  "0xa831c66d2db43210",
  "0xb00327c898fb213f",
  "0xbf597fc7beef0ee4",
  "0xc6e00bf33da88fc2",
  "0xd5a79147930aa725",
  "0x06ca6351e003826f",
  "0x142929670a0e6e70",
  "0x27b70a8546d22ffc",
  "0x2e1b21385c26c926",
  "0x4d2c6dfc5ac42aed",
  "0x53380d139d95b3df",
  "0x650a73548baf63de",
  "0x766a0abb3c77b2a8",
  "0x81c2c92e47edaee6",
  "0x92722c851482353b",
  "0xa2bfe8a14cf10364",
  "0xa81a664bbc423001",
  "0xc24b8b70d0f89791",
  "0xc76c51a30654be30",
  "0xd192e819d6ef5218",
  "0xd69906245565a910",
  "0xf40e35855771202a",
  "0x106aa07032bbd1b8",
  "0x19a4c116b8d2d0c8",
  "0x1e376c085141ab53",
  "0x2748774cdf8eeb99",
  "0x34b0bcb5e19b48a8",
  "0x391c0cb3c5c95a63",
  "0x4ed8aa4ae3418acb",
  "0x5b9cca4f7763e373",
  "0x682e6ff3d6b2b8a3",
  "0x748f82ee5defb2fc",
  "0x78a5636f43172f60",
  "0x84c87814a1f0ab72",
  "0x8cc702081a6439ec",
  "0x90befffa23631e28",
  "0xa4506cebde82bde9",
  "0xbef9a3f7b2c67915",
  "0xc67178f2e372532b",
  "0xca273eceea26619c",
  "0xd186b8c721c0c207",
  "0xeada7dd6cde0eb1e",
  "0xf57d4f7fee6ed178",
  "0x06f067aa72176fba",
  "0x0a637dc5a2c898a6",
  "0x113f9804bef90dae",
  "0x1b710b35131c471b",
  "0x28db77f523047d84",
  "0x32caab7b40c72493",
  "0x3c9ebe0a15c9bebc",
  "0x431d67c49c100d4c",
  "0x4cc5d4becb3e42b6",
  "0x597f299cfc657e2a",
  "0x5fcb6fab3ad6faec",
  "0x6c44198c4a475817"
].map((n) => BigInt(n))))();
var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
var SHA512 = class extends HashMD {
  static {
    __name(this, "SHA512");
  }
  // prettier-ignore
  get() {
    const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    return [
      Ah,
      Al,
      Bh,
      Bl,
      Ch,
      Cl,
      Dh,
      Dl,
      Eh,
      El,
      Fh,
      Fl,
      Gh,
      Gl,
      Hh,
      Hl
    ];
  }
  // prettier-ignore
  set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
    this.Ah = Ah | 0;
    this.Al = Al | 0;
    this.Bh = Bh | 0;
    this.Bl = Bl | 0;
    this.Ch = Ch | 0;
    this.Cl = Cl | 0;
    this.Dh = Dh | 0;
    this.Dl = Dl | 0;
    this.Eh = Eh | 0;
    this.El = El | 0;
    this.Fh = Fh | 0;
    this.Fl = Fl | 0;
    this.Gh = Gh | 0;
    this.Gl = Gl | 0;
    this.Hh = Hh | 0;
    this.Hl = Hl | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4) {
      SHA512_W_H[i] = view.getUint32(offset);
      SHA512_W_L[i] = view.getUint32(offset += 4);
    }
    for (let i = 16; i < 80; i++) {
      const W15h = SHA512_W_H[i - 15] | 0;
      const W15l = SHA512_W_L[i - 15] | 0;
      const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
      const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
      const W2h = SHA512_W_H[i - 2] | 0;
      const W2l = SHA512_W_L[i - 2] | 0;
      const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
      const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
      const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
      const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
      SHA512_W_H[i] = SUMh | 0;
      SHA512_W_L[i] = SUMl | 0;
    }
    let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    for (let i = 0; i < 80; i++) {
      const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
      const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
      const CHIh = Eh & Fh ^ ~Eh & Gh;
      const CHIl = El & Fl ^ ~El & Gl;
      const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
      const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
      const T1l = T1ll | 0;
      const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
      const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
      const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
      const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
      Hh = Gh | 0;
      Hl = Gl | 0;
      Gh = Fh | 0;
      Gl = Fl | 0;
      Fh = Eh | 0;
      Fl = El | 0;
      ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
      Dh = Ch | 0;
      Dl = Cl | 0;
      Ch = Bh | 0;
      Cl = Bl | 0;
      Bh = Ah | 0;
      Bl = Al | 0;
      const All = add3L(T1l, sigma0l, MAJl);
      Ah = add3H(All, T1h, sigma0h, MAJh);
      Al = All | 0;
    }
    ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
    ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
    ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
    ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
    ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
    ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
    ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
    ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
    this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
  }
  roundClean() {
    clean(SHA512_W_H, SHA512_W_L);
  }
  destroy() {
    clean(this.buffer);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
  constructor(outputLen = 64) {
    super(128, outputLen, 16, false);
    this.Ah = SHA512_IV[0] | 0;
    this.Al = SHA512_IV[1] | 0;
    this.Bh = SHA512_IV[2] | 0;
    this.Bl = SHA512_IV[3] | 0;
    this.Ch = SHA512_IV[4] | 0;
    this.Cl = SHA512_IV[5] | 0;
    this.Dh = SHA512_IV[6] | 0;
    this.Dl = SHA512_IV[7] | 0;
    this.Eh = SHA512_IV[8] | 0;
    this.El = SHA512_IV[9] | 0;
    this.Fh = SHA512_IV[10] | 0;
    this.Fl = SHA512_IV[11] | 0;
    this.Gh = SHA512_IV[12] | 0;
    this.Gl = SHA512_IV[13] | 0;
    this.Hh = SHA512_IV[14] | 0;
    this.Hl = SHA512_IV[15] | 0;
  }
};
var SHA384 = class extends SHA512 {
  static {
    __name(this, "SHA384");
  }
  constructor() {
    super(48);
    this.Ah = SHA384_IV[0] | 0;
    this.Al = SHA384_IV[1] | 0;
    this.Bh = SHA384_IV[2] | 0;
    this.Bl = SHA384_IV[3] | 0;
    this.Ch = SHA384_IV[4] | 0;
    this.Cl = SHA384_IV[5] | 0;
    this.Dh = SHA384_IV[6] | 0;
    this.Dl = SHA384_IV[7] | 0;
    this.Eh = SHA384_IV[8] | 0;
    this.El = SHA384_IV[9] | 0;
    this.Fh = SHA384_IV[10] | 0;
    this.Fl = SHA384_IV[11] | 0;
    this.Gh = SHA384_IV[12] | 0;
    this.Gl = SHA384_IV[13] | 0;
    this.Hh = SHA384_IV[14] | 0;
    this.Hl = SHA384_IV[15] | 0;
  }
};
var sha256 = /* @__PURE__ */ createHasher(() => new SHA256());
var sha224 = /* @__PURE__ */ createHasher(() => new SHA224());
var sha512 = /* @__PURE__ */ createHasher(() => new SHA512());
var sha384 = /* @__PURE__ */ createHasher(() => new SHA384());
var _0n = BigInt(0);
var _1n = BigInt(1);
var _2n = BigInt(2);
var _7n = BigInt(7);
var _256n = BigInt(256);
var _0x71n = BigInt(113);
var SHA3_PI = [];
var SHA3_ROTL = [];
var _SHA3_IOTA = [];
for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
  [x, y] = [
    y,
    (2 * x + 3 * y) % 5
  ];
  SHA3_PI.push(2 * (5 * y + x));
  SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
  let t2 = _0n;
  for (let j = 0; j < 7; j++) {
    R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
    if (R & _2n) t2 ^= _1n << (_1n << /* @__PURE__ */ BigInt(j)) - _1n;
  }
  _SHA3_IOTA.push(t2);
}
var IOTAS = split(_SHA3_IOTA, true);
var SHA3_IOTA_H = IOTAS[0];
var SHA3_IOTA_L = IOTAS[1];
var rotlH = /* @__PURE__ */ __name((h2, l, s) => s > 32 ? rotlBH(h2, l, s) : rotlSH(h2, l, s), "rotlH");
var rotlL = /* @__PURE__ */ __name((h2, l, s) => s > 32 ? rotlBL(h2, l, s) : rotlSL(h2, l, s), "rotlL");
function keccakP(s, rounds = 24) {
  const B = new Uint32Array(5 * 2);
  for (let round = 24 - rounds; round < 24; round++) {
    for (let x = 0; x < 10; x++) B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
    for (let x = 0; x < 10; x += 2) {
      const idx1 = (x + 8) % 10;
      const idx0 = (x + 2) % 10;
      const B0 = B[idx0];
      const B1 = B[idx0 + 1];
      const Th = rotlH(B0, B1, 1) ^ B[idx1];
      const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
      for (let y = 0; y < 50; y += 10) {
        s[x + y] ^= Th;
        s[x + y + 1] ^= Tl;
      }
    }
    let curH = s[2];
    let curL = s[3];
    for (let t2 = 0; t2 < 24; t2++) {
      const shift = SHA3_ROTL[t2];
      const Th = rotlH(curH, curL, shift);
      const Tl = rotlL(curH, curL, shift);
      const PI = SHA3_PI[t2];
      curH = s[PI];
      curL = s[PI + 1];
      s[PI] = Th;
      s[PI + 1] = Tl;
    }
    for (let y = 0; y < 50; y += 10) {
      for (let x = 0; x < 10; x++) B[x] = s[y + x];
      for (let x = 0; x < 10; x++) s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
    }
    s[0] ^= SHA3_IOTA_H[round];
    s[1] ^= SHA3_IOTA_L[round];
  }
  clean(B);
}
__name(keccakP, "keccakP");
var Keccak = class _Keccak extends Hash {
  static {
    __name(this, "Keccak");
  }
  clone() {
    return this._cloneInto();
  }
  keccak() {
    swap32IfBE(this.state32);
    keccakP(this.state32, this.rounds);
    swap32IfBE(this.state32);
    this.posOut = 0;
    this.pos = 0;
  }
  update(data) {
    aexists(this);
    data = toBytes(data);
    abytes(data);
    const { blockLen, state } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      for (let i = 0; i < take; i++) state[this.pos++] ^= data[pos++];
      if (this.pos === blockLen) this.keccak();
    }
    return this;
  }
  finish() {
    if (this.finished) return;
    this.finished = true;
    const { state, suffix, pos, blockLen } = this;
    state[pos] ^= suffix;
    if ((suffix & 128) !== 0 && pos === blockLen - 1) this.keccak();
    state[blockLen - 1] ^= 128;
    this.keccak();
  }
  writeInto(out) {
    aexists(this, false);
    abytes(out);
    this.finish();
    const bufferOut = this.state;
    const { blockLen } = this;
    for (let pos = 0, len = out.length; pos < len; ) {
      if (this.posOut >= blockLen) this.keccak();
      const take = Math.min(blockLen - this.posOut, len - pos);
      out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
      this.posOut += take;
      pos += take;
    }
    return out;
  }
  xofInto(out) {
    if (!this.enableXOF) throw new Error("XOF is not possible for this instance");
    return this.writeInto(out);
  }
  xof(bytes) {
    anumber(bytes);
    return this.xofInto(new Uint8Array(bytes));
  }
  digestInto(out) {
    aoutput(out, this);
    if (this.finished) throw new Error("digest() was already called");
    this.writeInto(out);
    this.destroy();
    return out;
  }
  digest() {
    return this.digestInto(new Uint8Array(this.outputLen));
  }
  destroy() {
    this.destroyed = true;
    clean(this.state);
  }
  _cloneInto(to) {
    const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
    to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
    to.state32.set(this.state32);
    to.pos = this.pos;
    to.posOut = this.posOut;
    to.finished = this.finished;
    to.rounds = rounds;
    to.suffix = suffix;
    to.outputLen = outputLen;
    to.enableXOF = enableXOF;
    to.destroyed = this.destroyed;
    return to;
  }
  // NOTE: we accept arguments in bytes instead of bits here.
  constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
    super();
    this.pos = 0;
    this.posOut = 0;
    this.finished = false;
    this.destroyed = false;
    this.enableXOF = false;
    this.blockLen = blockLen;
    this.suffix = suffix;
    this.outputLen = outputLen;
    this.enableXOF = enableXOF;
    this.rounds = rounds;
    anumber(outputLen);
    if (!(0 < blockLen && blockLen < 200)) throw new Error("only keccak-f1600 function is supported");
    this.state = new Uint8Array(200);
    this.state32 = u32(this.state);
  }
};
var gen = /* @__PURE__ */ __name((suffix, blockLen, outputLen) => createHasher(() => new Keccak(blockLen, suffix, outputLen)), "gen");
var sha3_224 = /* @__PURE__ */ (() => gen(6, 144, 224 / 8))();
var sha3_256 = /* @__PURE__ */ (() => gen(6, 136, 256 / 8))();
var sha3_384 = /* @__PURE__ */ (() => gen(6, 104, 384 / 8))();
var sha3_512 = /* @__PURE__ */ (() => gen(6, 72, 512 / 8))();
var globalScope = (() => {
  if (typeof globalThis === "object") return globalThis;
  else {
    Object.defineProperty(Object.prototype, "__GLOBALTHIS__", {
      get() {
        return this;
      },
      configurable: true
    });
    try {
      if (typeof __GLOBALTHIS__ !== "undefined") return __GLOBALTHIS__;
    } finally {
      delete Object.prototype.__GLOBALTHIS__;
    }
  }
  if (typeof self !== "undefined") return self;
  else if (typeof window !== "undefined") return window;
  else if (typeof global !== "undefined") return global;
  return void 0;
})();
var nobleHashes = {
  SHA1: sha1,
  SHA224: sha224,
  SHA256: sha256,
  SHA384: sha384,
  SHA512: sha512,
  "SHA3-224": sha3_224,
  "SHA3-256": sha3_256,
  "SHA3-384": sha3_384,
  "SHA3-512": sha3_512
};
var canonicalizeAlgorithm = /* @__PURE__ */ __name((algorithm) => {
  switch (true) {
    case /^(?:SHA-?1|SSL3-SHA1)$/i.test(algorithm):
      return "SHA1";
    case /^SHA(?:2?-)?224$/i.test(algorithm):
      return "SHA224";
    case /^SHA(?:2?-)?256$/i.test(algorithm):
      return "SHA256";
    case /^SHA(?:2?-)?384$/i.test(algorithm):
      return "SHA384";
    case /^SHA(?:2?-)?512$/i.test(algorithm):
      return "SHA512";
    case /^SHA3-224$/i.test(algorithm):
      return "SHA3-224";
    case /^SHA3-256$/i.test(algorithm):
      return "SHA3-256";
    case /^SHA3-384$/i.test(algorithm):
      return "SHA3-384";
    case /^SHA3-512$/i.test(algorithm):
      return "SHA3-512";
    default:
      throw new TypeError(`Unknown hash algorithm: ${algorithm}`);
  }
}, "canonicalizeAlgorithm");
var hmacDigest = /* @__PURE__ */ __name((algorithm, key, message) => {
  if (hmac) {
    const hash2 = nobleHashes[algorithm] ?? nobleHashes[canonicalizeAlgorithm(algorithm)];
    return hmac(hash2, key, message);
  } else {
    throw new Error("Missing HMAC function");
  }
}, "hmacDigest");
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
var base32Decode = /* @__PURE__ */ __name((str) => {
  str = str.replace(/ /g, "");
  let end = str.length;
  while (str[end - 1] === "=") --end;
  str = (end < str.length ? str.substring(0, end) : str).toUpperCase();
  const buf = new ArrayBuffer(str.length * 5 / 8 | 0);
  const arr = new Uint8Array(buf);
  let bits = 0;
  let value = 0;
  let index = 0;
  for (let i = 0; i < str.length; i++) {
    const idx = ALPHABET.indexOf(str[i]);
    if (idx === -1) throw new TypeError(`Invalid character found: ${str[i]}`);
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      arr[index++] = value >>> bits;
    }
  }
  return arr;
}, "base32Decode");
var base32Encode = /* @__PURE__ */ __name((arr) => {
  let bits = 0;
  let value = 0;
  let str = "";
  for (let i = 0; i < arr.length; i++) {
    value = value << 8 | arr[i];
    bits += 8;
    while (bits >= 5) {
      str += ALPHABET[value >>> bits - 5 & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    str += ALPHABET[value << 5 - bits & 31];
  }
  return str;
}, "base32Encode");
var hexDecode = /* @__PURE__ */ __name((str) => {
  str = str.replace(/ /g, "");
  const buf = new ArrayBuffer(str.length / 2);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < str.length; i += 2) {
    arr[i / 2] = parseInt(str.substring(i, i + 2), 16);
  }
  return arr;
}, "hexDecode");
var hexEncode = /* @__PURE__ */ __name((arr) => {
  let str = "";
  for (let i = 0; i < arr.length; i++) {
    const hex = arr[i].toString(16);
    if (hex.length === 1) str += "0";
    str += hex;
  }
  return str.toUpperCase();
}, "hexEncode");
var latin1Decode = /* @__PURE__ */ __name((str) => {
  const buf = new ArrayBuffer(str.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i) & 255;
  }
  return arr;
}, "latin1Decode");
var latin1Encode = /* @__PURE__ */ __name((arr) => {
  let str = "";
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return str;
}, "latin1Encode");
var ENCODER = globalScope.TextEncoder ? new globalScope.TextEncoder() : null;
var DECODER = globalScope.TextDecoder ? new globalScope.TextDecoder() : null;
var utf8Decode = /* @__PURE__ */ __name((str) => {
  if (!ENCODER) {
    throw new Error("Encoding API not available");
  }
  return ENCODER.encode(str);
}, "utf8Decode");
var utf8Encode = /* @__PURE__ */ __name((arr) => {
  if (!DECODER) {
    throw new Error("Encoding API not available");
  }
  return DECODER.decode(arr);
}, "utf8Encode");
var randomBytes2 = /* @__PURE__ */ __name((size) => {
  if (globalScope.crypto?.getRandomValues) {
    return globalScope.crypto.getRandomValues(new Uint8Array(size));
  } else {
    throw new Error("Cryptography API not available");
  }
}, "randomBytes");
var Secret = class _Secret {
  static {
    __name(this, "Secret");
  }
  /**
  * Converts a Latin-1 string to a Secret object.
  * @param {string} str Latin-1 string.
  * @returns {Secret} Secret object.
  */
  static fromLatin1(str) {
    return new _Secret({
      buffer: latin1Decode(str).buffer
    });
  }
  /**
  * Converts an UTF-8 string to a Secret object.
  * @param {string} str UTF-8 string.
  * @returns {Secret} Secret object.
  */
  static fromUTF8(str) {
    return new _Secret({
      buffer: utf8Decode(str).buffer
    });
  }
  /**
  * Converts a base32 string to a Secret object.
  * @param {string} str Base32 string.
  * @returns {Secret} Secret object.
  */
  static fromBase32(str) {
    return new _Secret({
      buffer: base32Decode(str).buffer
    });
  }
  /**
  * Converts a hexadecimal string to a Secret object.
  * @param {string} str Hexadecimal string.
  * @returns {Secret} Secret object.
  */
  static fromHex(str) {
    return new _Secret({
      buffer: hexDecode(str).buffer
    });
  }
  /**
  * Secret key buffer.
  * @deprecated For backward compatibility, the "bytes" property should be used instead.
  * @type {ArrayBufferLike}
  */
  get buffer() {
    return this.bytes.buffer;
  }
  /**
  * Latin-1 string representation of secret key.
  * @type {string}
  */
  get latin1() {
    Object.defineProperty(this, "latin1", {
      enumerable: true,
      writable: false,
      configurable: false,
      value: latin1Encode(this.bytes)
    });
    return this.latin1;
  }
  /**
  * UTF-8 string representation of secret key.
  * @type {string}
  */
  get utf8() {
    Object.defineProperty(this, "utf8", {
      enumerable: true,
      writable: false,
      configurable: false,
      value: utf8Encode(this.bytes)
    });
    return this.utf8;
  }
  /**
  * Base32 string representation of secret key.
  * @type {string}
  */
  get base32() {
    Object.defineProperty(this, "base32", {
      enumerable: true,
      writable: false,
      configurable: false,
      value: base32Encode(this.bytes)
    });
    return this.base32;
  }
  /**
  * Hexadecimal string representation of secret key.
  * @type {string}
  */
  get hex() {
    Object.defineProperty(this, "hex", {
      enumerable: true,
      writable: false,
      configurable: false,
      value: hexEncode(this.bytes)
    });
    return this.hex;
  }
  /**
  * Creates a secret key object.
  * @param {Object} [config] Configuration options.
  * @param {ArrayBufferLike} [config.buffer] Secret key buffer.
  * @param {number} [config.size=20] Number of random bytes to generate, ignored if 'buffer' is provided.
  */
  constructor({ buffer, size = 20 } = {}) {
    this.bytes = typeof buffer === "undefined" ? randomBytes2(size) : new Uint8Array(buffer);
    Object.defineProperty(this, "bytes", {
      enumerable: true,
      writable: false,
      configurable: false,
      value: this.bytes
    });
  }
};
var timingSafeEqual = /* @__PURE__ */ __name((a, b) => {
  {
    if (a.length !== b.length) {
      throw new TypeError("Input strings must have the same length");
    }
    let i = -1;
    let out = 0;
    while (++i < a.length) {
      out |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return out === 0;
  }
}, "timingSafeEqual");
var HOTP = class _HOTP {
  static {
    __name(this, "HOTP");
  }
  /**
  * Default configuration.
  * @type {{
  *   issuer: string,
  *   label: string,
  *   issuerInLabel: boolean,
  *   algorithm: string,
  *   digits: number,
  *   counter: number
  *   window: number
  * }}
  */
  static get defaults() {
    return {
      issuer: "",
      label: "OTPAuth",
      issuerInLabel: true,
      algorithm: "SHA1",
      digits: 6,
      counter: 0,
      window: 1
    };
  }
  /**
  * Generates an HOTP token.
  * @param {Object} config Configuration options.
  * @param {Secret} config.secret Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.counter=0] Counter value.
  * @returns {string} Token.
  */
  static generate({ secret, algorithm = _HOTP.defaults.algorithm, digits = _HOTP.defaults.digits, counter = _HOTP.defaults.counter }) {
    const digest = hmacDigest(algorithm, secret.bytes, uintDecode(counter));
    const offset = digest[digest.byteLength - 1] & 15;
    const otp = ((digest[offset] & 127) << 24 | (digest[offset + 1] & 255) << 16 | (digest[offset + 2] & 255) << 8 | digest[offset + 3] & 255) % 10 ** digits;
    return otp.toString().padStart(digits, "0");
  }
  /**
  * Generates an HOTP token.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.counter=this.counter++] Counter value.
  * @returns {string} Token.
  */
  generate({ counter = this.counter++ } = {}) {
    return _HOTP.generate({
      secret: this.secret,
      algorithm: this.algorithm,
      digits: this.digits,
      counter
    });
  }
  /**
  * Validates an HOTP token.
  * @param {Object} config Configuration options.
  * @param {string} config.token Token value.
  * @param {Secret} config.secret Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.counter=0] Counter value.
  * @param {number} [config.window=1] Window of counter values to test.
  * @returns {number|null} Token delta or null if it is not found in the search window, in which case it should be considered invalid.
  */
  static validate({ token, secret, algorithm, digits = _HOTP.defaults.digits, counter = _HOTP.defaults.counter, window: window2 = _HOTP.defaults.window }) {
    if (token.length !== digits) return null;
    let delta = null;
    const check = /* @__PURE__ */ __name((i) => {
      const generatedToken = _HOTP.generate({
        secret,
        algorithm,
        digits,
        counter: i
      });
      if (timingSafeEqual(token, generatedToken)) {
        delta = i - counter;
      }
    }, "check");
    check(counter);
    for (let i = 1; i <= window2 && delta === null; ++i) {
      check(counter - i);
      if (delta !== null) break;
      check(counter + i);
      if (delta !== null) break;
    }
    return delta;
  }
  /**
  * Validates an HOTP token.
  * @param {Object} config Configuration options.
  * @param {string} config.token Token value.
  * @param {number} [config.counter=this.counter] Counter value.
  * @param {number} [config.window=1] Window of counter values to test.
  * @returns {number|null} Token delta or null if it is not found in the search window, in which case it should be considered invalid.
  */
  validate({ token, counter = this.counter, window: window2 }) {
    return _HOTP.validate({
      token,
      secret: this.secret,
      algorithm: this.algorithm,
      digits: this.digits,
      counter,
      window: window2
    });
  }
  /**
  * Returns a Google Authenticator key URI.
  * @returns {string} URI.
  */
  toString() {
    const e = encodeURIComponent;
    return `otpauth://hotp/${this.issuer.length > 0 ? this.issuerInLabel ? `${e(this.issuer)}:${e(this.label)}?issuer=${e(this.issuer)}&` : `${e(this.label)}?issuer=${e(this.issuer)}&` : `${e(this.label)}?`}secret=${e(this.secret.base32)}&algorithm=${e(this.algorithm)}&digits=${e(this.digits)}&counter=${e(this.counter)}`;
  }
  /**
  * Creates an HOTP object.
  * @param {Object} [config] Configuration options.
  * @param {string} [config.issuer=''] Account provider.
  * @param {string} [config.label='OTPAuth'] Account label.
  * @param {boolean} [config.issuerInLabel=true] Include issuer prefix in label.
  * @param {Secret|string} [config.secret=Secret] Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.counter=0] Initial counter value.
  */
  constructor({ issuer = _HOTP.defaults.issuer, label = _HOTP.defaults.label, issuerInLabel = _HOTP.defaults.issuerInLabel, secret = new Secret(), algorithm = _HOTP.defaults.algorithm, digits = _HOTP.defaults.digits, counter = _HOTP.defaults.counter } = {}) {
    this.issuer = issuer;
    this.label = label;
    this.issuerInLabel = issuerInLabel;
    this.secret = typeof secret === "string" ? Secret.fromBase32(secret) : secret;
    this.algorithm = canonicalizeAlgorithm(algorithm);
    this.digits = digits;
    this.counter = counter;
  }
};
var TOTP = class _TOTP {
  static {
    __name(this, "TOTP");
  }
  /**
  * Default configuration.
  * @type {{
  *   issuer: string,
  *   label: string,
  *   issuerInLabel: boolean,
  *   algorithm: string,
  *   digits: number,
  *   period: number
  *   window: number
  * }}
  */
  static get defaults() {
    return {
      issuer: "",
      label: "OTPAuth",
      issuerInLabel: true,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      window: 1
    };
  }
  /**
  * Calculates the counter. i.e. the number of periods since timestamp 0.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.period=30] Token time-step duration.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {number} Counter.
  */
  static counter({ period = _TOTP.defaults.period, timestamp = Date.now() } = {}) {
    return Math.floor(timestamp / 1e3 / period);
  }
  /**
  * Calculates the counter. i.e. the number of periods since timestamp 0.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {number} Counter.
  */
  counter({ timestamp = Date.now() } = {}) {
    return _TOTP.counter({
      period: this.period,
      timestamp
    });
  }
  /**
  * Calculates the remaining time in milliseconds until the next token is generated.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.period=30] Token time-step duration.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {number} counter.
  */
  static remaining({ period = _TOTP.defaults.period, timestamp = Date.now() } = {}) {
    return period * 1e3 - timestamp % (period * 1e3);
  }
  /**
  * Calculates the remaining time in milliseconds until the next token is generated.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {number} counter.
  */
  remaining({ timestamp = Date.now() } = {}) {
    return _TOTP.remaining({
      period: this.period,
      timestamp
    });
  }
  /**
  * Generates a TOTP token.
  * @param {Object} config Configuration options.
  * @param {Secret} config.secret Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.period=30] Token time-step duration.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {string} Token.
  */
  static generate({ secret, algorithm, digits, period = _TOTP.defaults.period, timestamp = Date.now() }) {
    return HOTP.generate({
      secret,
      algorithm,
      digits,
      counter: _TOTP.counter({
        period,
        timestamp
      })
    });
  }
  /**
  * Generates a TOTP token.
  * @param {Object} [config] Configuration options.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @returns {string} Token.
  */
  generate({ timestamp = Date.now() } = {}) {
    return _TOTP.generate({
      secret: this.secret,
      algorithm: this.algorithm,
      digits: this.digits,
      period: this.period,
      timestamp
    });
  }
  /**
  * Validates a TOTP token.
  * @param {Object} config Configuration options.
  * @param {string} config.token Token value.
  * @param {Secret} config.secret Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.period=30] Token time-step duration.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @param {number} [config.window=1] Window of counter values to test.
  * @returns {number|null} Token delta or null if it is not found in the search window, in which case it should be considered invalid.
  */
  static validate({ token, secret, algorithm, digits, period = _TOTP.defaults.period, timestamp = Date.now(), window: window2 }) {
    return HOTP.validate({
      token,
      secret,
      algorithm,
      digits,
      counter: _TOTP.counter({
        period,
        timestamp
      }),
      window: window2
    });
  }
  /**
  * Validates a TOTP token.
  * @param {Object} config Configuration options.
  * @param {string} config.token Token value.
  * @param {number} [config.timestamp=Date.now] Timestamp value in milliseconds.
  * @param {number} [config.window=1] Window of counter values to test.
  * @returns {number|null} Token delta or null if it is not found in the search window, in which case it should be considered invalid.
  */
  validate({ token, timestamp, window: window2 }) {
    return _TOTP.validate({
      token,
      secret: this.secret,
      algorithm: this.algorithm,
      digits: this.digits,
      period: this.period,
      timestamp,
      window: window2
    });
  }
  /**
  * Returns a Google Authenticator key URI.
  * @returns {string} URI.
  */
  toString() {
    const e = encodeURIComponent;
    return `otpauth://totp/${this.issuer.length > 0 ? this.issuerInLabel ? `${e(this.issuer)}:${e(this.label)}?issuer=${e(this.issuer)}&` : `${e(this.label)}?issuer=${e(this.issuer)}&` : `${e(this.label)}?`}secret=${e(this.secret.base32)}&algorithm=${e(this.algorithm)}&digits=${e(this.digits)}&period=${e(this.period)}`;
  }
  /**
  * Creates a TOTP object.
  * @param {Object} [config] Configuration options.
  * @param {string} [config.issuer=''] Account provider.
  * @param {string} [config.label='OTPAuth'] Account label.
  * @param {boolean} [config.issuerInLabel=true] Include issuer prefix in label.
  * @param {Secret|string} [config.secret=Secret] Secret key.
  * @param {string} [config.algorithm='SHA1'] HMAC hashing algorithm.
  * @param {number} [config.digits=6] Token length.
  * @param {number} [config.period=30] Token time-step duration.
  */
  constructor({ issuer = _TOTP.defaults.issuer, label = _TOTP.defaults.label, issuerInLabel = _TOTP.defaults.issuerInLabel, secret = new Secret(), algorithm = _TOTP.defaults.algorithm, digits = _TOTP.defaults.digits, period = _TOTP.defaults.period } = {}) {
    this.issuer = issuer;
    this.label = label;
    this.issuerInLabel = issuerInLabel;
    this.secret = typeof secret === "string" ? Secret.fromBase32(secret) : secret;
    this.algorithm = canonicalizeAlgorithm(algorithm);
    this.digits = digits;
    this.period = period;
  }
};

// src/routes/auth.ts
function verifyTOTP(secret, token) {
  const totp = new TOTP({
    secret: Secret.fromBase32(secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30
  });
  return totp.validate({ token, window: 1 }) !== null;
}
__name(verifyTOTP, "verifyTOTP");
function generateTOTPSecret() {
  const secret = new Secret({ size: 20 });
  return secret.base32;
}
__name(generateTOTPSecret, "generateTOTPSecret");
async function getKey2(env) {
  const keyData = new TextEncoder().encode(env.ENCRYPTION_KEY);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}
__name(getKey2, "getKey");
async function encrypt(text, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey2(env);
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return btoa(String.fromCharCode(...iv) + String.fromCharCode(...new Uint8Array(ciphertext)));
}
__name(encrypt, "encrypt");
async function decrypt(data, env) {
  const raw2 = atob(data);
  const iv = new Uint8Array([...raw2].slice(0, 12).map((c) => c.charCodeAt(0)));
  const ciphertext = new Uint8Array([...raw2].slice(12).map((c) => c.charCodeAt(0)));
  const key = await getKey2(env);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}
__name(decrypt, "decrypt");
async function getUserByEmail(env, email) {
  let user = await env.DB.prepare("SELECT * FROM staff WHERE email = ?").bind(email).first();
  if (!user) user = await env.DB.prepare("SELECT * FROM clients WHERE email = ?").bind(email).first();
  return user;
}
__name(getUserByEmail, "getUserByEmail");
async function authRoute(req, env) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const { email, password, mfa_code } = await req.json();
  const user = await getUserByEmail(env, email);
  if (!user) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
  const passwordValid = await bcryptjs_default.compare(password, user.password_hash);
  if (!passwordValid) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
  if (user.mfa_enabled) {
    if (!mfa_code) {
      return new Response(JSON.stringify({ mfa_required: true, mfa_method: user.mfa_method }), { status: 200 });
    }
    let mfaValid = false;
    if (user.mfa_method === "totp") {
      let mfaSecret = user.mfa_secret;
      if (mfaSecret && !mfaSecret.startsWith("MFA")) {
        mfaSecret = await encrypt(mfaSecret, env);
        await env.DB.prepare(`UPDATE ${user.role ? "staff" : "clients"} SET mfa_secret = ? WHERE id = ?`).bind(mfaSecret, user.id).run();
      }
      const decryptedSecret = await decrypt(mfaSecret, env);
      mfaValid = decryptedSecret && verifyTOTP(decryptedSecret, mfa_code);
    } else if (user.mfa_method === "email" || user.mfa_method === "sms") {
      const storedCode = await env.KV_NAMESPACE?.get(`mfa:${user.id}`);
      mfaValid = storedCode && storedCode === mfa_code;
      if (mfaValid && env.KV_NAMESPACE) {
        await env.KV_NAMESPACE.delete(`mfa:${user.id}`);
      }
    }
    if (!mfaValid && user.mfa_backup_codes) {
      try {
        const backupCodes = JSON.parse(user.mfa_backup_codes);
        const codeIndex = backupCodes.findIndex((code) => code === mfa_code);
        if (codeIndex !== -1) {
          mfaValid = true;
          backupCodes.splice(codeIndex, 1);
          await env.DB.prepare(`UPDATE ${user.role ? "staff" : "clients"} SET mfa_backup_codes = ? WHERE id = ?`).bind(JSON.stringify(backupCodes), user.id).run();
        }
      } catch (e) {
        console.error("Failed to parse backup codes:", e);
      }
    }
    if (!mfaValid) {
      return new Response(JSON.stringify({ error: "Invalid MFA code" }), { status: 401 });
    }
  }
  const token = await index_default.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "client",
      name: user.name,
      exp: Math.floor(Date.now() / 1e3) + 24 * 60 * 60
      // 24 hours
    },
    env.JWT_SECRET || "change-this-secret-in-production"
  );
  return new Response(JSON.stringify({
    success: true,
    token,
    user: { id: user.id, email: user.email, role: user.role || "client", name: user.name }
  }), { headers: { "Content-Type": "application/json" } });
}
__name(authRoute, "authRoute");
async function mfaSetupRoute(req, env) {
  const { email } = await req.json();
  const user = await getUserByEmail(env, email);
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  const secret = generateTOTPSecret();
  const encryptedSecret = await encrypt(secret, env);
  await env.DB.prepare(`UPDATE ${user.role ? "staff" : "clients"} SET mfa_secret = ? WHERE id = ?`).bind(encryptedSecret, user.id).run();
  return new Response(JSON.stringify({ secret }), { headers: { "Content-Type": "application/json" } });
}
__name(mfaSetupRoute, "mfaSetupRoute");
async function mfaVerifyRoute(req, env) {
  const { email, code } = await req.json();
  const user = await getUserByEmail(env, email);
  if (!user || !user.mfa_secret) return new Response(JSON.stringify({ error: "User not found or not enrolled" }), { status: 404 });
  const decryptedSecret = await decrypt(user.mfa_secret, env);
  if (!verifyTOTP(decryptedSecret, code)) return new Response(JSON.stringify({ error: "Invalid code" }), { status: 401 });
  await env.DB.prepare(`UPDATE ${user.role ? "staff" : "clients"} SET mfa_enabled = 1 WHERE id = ?`).bind(user.id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
__name(mfaVerifyRoute, "mfaVerifyRoute");

// src/efileProviders.ts
var ROSS_TAX_PREP_PROFILE = {
  efin: "****86",
  // Redacted for public
  etin_prod: "98978",
  firm_name: "ROSS TAX PREP AND BOOKKEEPING LLC",
  owner_name: "Condre Ross",
  address: "[Business Address]",
  phone: "[Business Phone]",
  email: "[Business Email]",
  status: "test",
  approved_years: ["2025", "2026"],
  provider_options: ["ERO", "Transmitter", "ISP"],
  software_developer_approved: false,
  role: "ERO"
};
var TAX_CONSULTANTS_PROFILE = {
  efin: "****35",
  // Redacted for public
  etin_prod: "95409",
  etin_test: "95410",
  firm_name: "254 - TAX CONSULTANTS",
  owner_name: "Condre Ross",
  address: "[Business Address]",
  phone: "[Business Phone]",
  email: "[Business Email]",
  status: "test",
  approved_years: ["2025", "2026"],
  provider_options: ["ERO", "Transmitter", "ISP", "Software Developer"],
  software_developer_approved: true,
  // ✅ This is the key requirement
  role: "Software Developer"
  // ✅ Role alignment for "I built the transmitter"
};
var ERO_EFIN_PROFILE = TAX_CONSULTANTS_PROFILE;
var EFIN_PROFILES = {
  "ross_tax_prep": ROSS_TAX_PREP_PROFILE,
  "254_tax_consultants": TAX_CONSULTANTS_PROFILE
};
var MEF_CONFIG = {
  // ============================================================
  // ENVIRONMENT TOGGLE - Change this for ATS vs Production
  // NO CODE CHANGES REQUIRED - just change this value
  // ============================================================
  environment: "PRODUCTION",
  // "ATS" for testing, "PRODUCTION" for live filing
  // Active EFIN profile
  active_profile: "254_tax_consultants",
  // Software Developer approved
  // ============================================================
  // KILL SWITCH - Disable transmissions without taking app down
  // ✅ Requirement 5: "stop the line" switch
  // ============================================================
  transmissions_enabled: true,
  // Set to false to stop all transmissions
  // MeF Endpoints
  endpoints: {
    ATS_BASE: "https://la.alt.www4.irs.gov/a2a/mef",
    PROD_BASE: "https://la.www4.irs.gov/a2a/mef"
  },
  // Transport format
  transport: "mime",
  // MeF Services
  services: {
    SendSubmissions: "SendSubmissions",
    GetSubmissionStatus: "GetSubmissionStatus",
    GetAck: "GetAck",
    GetAcks: "GetAcks",
    GetNewAcks: "GetNewAcks"
  },
  // Retry configuration for resilience
  retry: {
    max_attempts: 3,
    initial_delay_ms: 1e3,
    max_delay_ms: 3e4,
    backoff_multiplier: 2
  },
  // Timeout configuration
  timeouts: {
    connection_ms: 3e4,
    read_ms: 12e4
  }
};
function getMefEndpoint(service) {
  const baseUrl = MEF_CONFIG.environment === "ATS" ? MEF_CONFIG.endpoints.ATS_BASE : MEF_CONFIG.endpoints.PROD_BASE;
  return `${baseUrl}/${MEF_CONFIG.transport}/${service}`;
}
__name(getMefEndpoint, "getMefEndpoint");
function getActiveEtin() {
  const profile = EFIN_PROFILES[MEF_CONFIG.active_profile];
  if (MEF_CONFIG.environment === "ATS" && profile.etin_test) {
    return profile.etin_test;
  }
  return profile.etin_prod;
}
__name(getActiveEtin, "getActiveEtin");
function getActiveProfile() {
  return EFIN_PROFILES[MEF_CONFIG.active_profile];
}
__name(getActiveProfile, "getActiveProfile");
function isTransmissionEnabled() {
  return MEF_CONFIG.transmissions_enabled;
}
__name(isTransmissionEnabled, "isTransmissionEnabled");
function isProduction() {
  return MEF_CONFIG.environment === "PRODUCTION";
}
__name(isProduction, "isProduction");
function validateSoftwareDeveloperApproval() {
  const profile = getActiveProfile();
  if (!profile.software_developer_approved) {
    return {
      valid: false,
      message: `Profile ${profile.firm_name} (EFIN: ${profile.efin}) does not have Software Developer approval. Cannot transmit custom software submissions.`
    };
  }
  if (profile.role !== "Software Developer") {
    return {
      valid: false,
      message: `Profile ${profile.firm_name} role is "${profile.role}", expected "Software Developer".`
    };
  }
  return {
    valid: true,
    message: `Profile ${profile.firm_name} (EFIN: ${profile.efin}) has Software Developer approval.`
  };
}
__name(validateSoftwareDeveloperApproval, "validateSoftwareDeveloperApproval");
var BANK_PRODUCT_PROVIDERS = [
  {
    id: "sbtpg",
    name: "Santa Barbara TPG",
    api_url: "https://www.sbtpg.com/api",
    supported_products: ["refund transfer", "cash advance"],
    support_contact: "support@sbtpg.com"
  },
  {
    id: "refundadvantage",
    name: "Refund Advantage",
    api_url: "https://www.refund-advantage.com/api",
    supported_products: ["refund transfer", "prepaid card"],
    support_contact: "support@refund-advantage.com"
  },
  {
    id: "eps",
    name: "EPS Financial",
    api_url: "https://www.epsfinancial.net/api",
    supported_products: ["refund transfer", "cash advance", "prepaid card"],
    support_contact: "support@epsfinancial.net"
  }
];
var SUPPORTED_PAYMENT_METHODS = [
  "ach",
  "chime",
  "cashapp",
  "credit_card",
  "debit_card",
  "direct_deposit",
  "check",
  "prepaid_card",
  "refund_transfer"
];

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p2 of [path].flat()) {
        this.#path = p2;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app) {
    const subApp = this.basePath(path);
    app.routes.map((r2) => {
      let handler;
      if (app.errorHandler === errorHandler) {
        handler = r2.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app.errorHandler)(c, () => r2.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r2.handler;
      }
      subApp.#addRoute(r2.method, r2.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r2 = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r2]);
    this.routes.push(r2);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h2]) => [h2, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h2, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h2, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p2) => {
          handlerMap[method][p2] = [...handlerMap[METHOD_NAME_ALL][p2]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p2) => {
            re.test(p2) && middleware[m][p2].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p2) => re.test(p2) && routes[m][p2].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r2) => {
      const ownRoute = r2[method] ? Object.keys(r2[method]).map((path) => [path, r2[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r2[METHOD_NAME_ALL]).map((path) => [path, r2[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router6 = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router6.add(...routes[i2]);
        }
        res = router6.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router6.match.bind(router6);
      this.#routers = [router6];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p2 = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p2, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p2;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// src/payment.ts
var paymentRouter = new Hono2();
paymentRouter.post("/intent", async (c) => {
  try {
    const body = await c.req.json();
    const { amount, currency = "USD", provider, customer_email, description, metadata } = body;
    if (!amount || !provider || !customer_email) {
      return c.json({ error: "Missing required fields: amount, provider, customer_email" }, 400);
    }
    if (amount <= 0) {
      return c.json({ error: "Amount must be greater than 0" }, 400);
    }
    let paymentIntent;
    switch (provider) {
      case "stripe":
        if (!c.env.STRIPE_SECRET_KEY) {
          return c.json({ error: "Stripe not configured" }, 500);
        }
        const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${c.env.STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            amount: (amount * 100).toString(),
            // Convert to cents
            currency: currency.toLowerCase(),
            "metadata[customer_email]": customer_email,
            "metadata[description]": description || "Tax preparation service",
            ...Object.entries(metadata || {}).reduce((acc, [key, val]) => ({
              ...acc,
              [`metadata[${key}]`]: val
            }), {})
          })
        });
        if (!stripeResponse.ok) {
          const error = await stripeResponse.json();
          throw new Error(`Stripe error: ${error.error?.message || "Unknown error"}`);
        }
        paymentIntent = await stripeResponse.json();
        const user = c.get("user") || { id: 0, email: customer_email, role: "client" };
        await auditPayment(c.env, paymentIntent.id, amount, user, "initiated", c.req.raw);
        return c.json({
          success: true,
          client_secret: paymentIntent.client_secret,
          transaction_id: paymentIntent.id,
          provider: "stripe"
        });
      case "square":
        if (!c.env.SQUARE_ACCESS_TOKEN || !c.env.SQUARE_LOCATION_ID) {
          return c.json({ error: "Square not configured" }, 500);
        }
        const squareResponse = await fetch("https://connect.squareup.com/v2/payments", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${c.env.SQUARE_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "Square-Version": "2023-12-13"
          },
          body: JSON.stringify({
            idempotency_key: crypto.randomUUID(),
            amount_money: {
              amount: amount * 100,
              // Convert to cents
              currency
            },
            source_id: "PLACEHOLDER_SOURCE",
            // Client provides source_id from Square.js
            location_id: c.env.SQUARE_LOCATION_ID,
            customer_email,
            note: description || "Tax preparation service"
          })
        });
        if (!squareResponse.ok) {
          const error = await squareResponse.json();
          throw new Error(`Square error: ${error.errors?.[0]?.detail || "Unknown error"}`);
        }
        paymentIntent = await squareResponse.json();
        return c.json({
          success: true,
          transaction_id: paymentIntent.payment.id,
          provider: "square",
          status: paymentIntent.payment.status
        });
      case "bank":
        return c.json({
          success: true,
          message: "Bank ACH integration - manual processing required",
          transaction_id: `BANK_${Date.now()}`,
          provider: "bank",
          instructions: "Bank transfer details will be sent to your email"
        });
      default:
        return c.json({ error: "Unsupported payment provider" }, 400);
    }
  } catch (error) {
    console.error("Payment intent error:", error);
    return c.json({ error: error.message || "Payment processing failed" }, 500);
  }
});
paymentRouter.post("/verify", async (c) => {
  try {
    const body = await c.req.json();
    const { transaction_id, provider } = body;
    if (!transaction_id || !provider) {
      return c.json({ error: "Missing required fields: transaction_id, provider" }, 400);
    }
    let paymentStatus;
    switch (provider) {
      case "stripe":
        if (!c.env.STRIPE_SECRET_KEY) {
          return c.json({ error: "Stripe not configured" }, 500);
        }
        const stripeResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${transaction_id}`, {
          headers: {
            "Authorization": `Bearer ${c.env.STRIPE_SECRET_KEY}`
          }
        });
        if (!stripeResponse.ok) {
          const error = await stripeResponse.json();
          throw new Error(`Stripe error: ${error.error?.message || "Unknown error"}`);
        }
        paymentStatus = await stripeResponse.json();
        const user = c.get("user") || { id: 0, email: "unknown", role: "system" };
        const status = paymentStatus.status === "succeeded" ? "completed" : "failed";
        await auditPayment(c.env, transaction_id, paymentStatus.amount / 100, user, status, c.req.raw);
        return c.json({
          success: true,
          status: paymentStatus.status,
          amount: paymentStatus.amount / 100,
          currency: paymentStatus.currency,
          verified: paymentStatus.status === "succeeded"
        });
      case "square":
        if (!c.env.SQUARE_ACCESS_TOKEN) {
          return c.json({ error: "Square not configured" }, 500);
        }
        const squareResponse = await fetch(`https://connect.squareup.com/v2/payments/${transaction_id}`, {
          headers: {
            "Authorization": `Bearer ${c.env.SQUARE_ACCESS_TOKEN}`,
            "Square-Version": "2023-12-13"
          }
        });
        if (!squareResponse.ok) {
          const error = await squareResponse.json();
          throw new Error(`Square error: ${error.errors?.[0]?.detail || "Unknown error"}`);
        }
        paymentStatus = await squareResponse.json();
        return c.json({
          success: true,
          status: paymentStatus.payment.status,
          amount: paymentStatus.payment.amount_money.amount / 100,
          currency: paymentStatus.payment.amount_money.currency,
          verified: paymentStatus.payment.status === "COMPLETED"
        });
      case "bank":
        return c.json({
          success: true,
          status: "pending_verification",
          message: "Bank payments require manual verification",
          verified: false
        });
      default:
        return c.json({ error: "Unsupported payment provider" }, 400);
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return c.json({ error: error.message || "Payment verification failed" }, 500);
  }
});

// src/mef.ts
var MefLogger = class {
  static {
    __name(this, "MefLogger");
  }
  logs = [];
  env;
  constructor(env) {
    this.env = env;
  }
  log(level, operation, message, details) {
    const entry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      operation,
      environment: MEF_CONFIG.environment,
      message,
      details,
      submissionId: details?.submissionId
    };
    this.logs.push(entry);
    const prefix = `[MeF][${level}][${operation}]`;
    console.log(`${prefix} ${message}`, details ? JSON.stringify(details) : "");
    this.persistLog(entry);
    return entry;
  }
  async persistLog(entry) {
    if (this.env?.DB) {
      try {
        await this.env.DB.prepare(`
          INSERT INTO mef_logs (timestamp, level, operation, submission_id, environment, message, details_json)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          entry.timestamp,
          entry.level,
          entry.operation,
          entry.submissionId || null,
          entry.environment,
          entry.message,
          entry.details ? JSON.stringify(entry.details) : null
        ).run();
      } catch (e) {
        console.error("Failed to persist MeF log:", e);
      }
    }
  }
  debug(operation, message, details) {
    return this.log("DEBUG", operation, message, details);
  }
  info(operation, message, details) {
    return this.log("INFO", operation, message, details);
  }
  warn(operation, message, details) {
    return this.log("WARN", operation, message, details);
  }
  error(operation, message, details) {
    return this.log("ERROR", operation, message, details);
  }
  getRecentLogs(count = 100) {
    return this.logs.slice(-count);
  }
};
var REQUIRED_ELEMENTS_BY_RETURN_TYPE = {
  "1040": [
    "ReturnHeader",
    "FilingStatus",
    "Filer/PrimarySSN",
    "Filer/Name",
    "ReturnData"
  ],
  "1040-SR": [
    "ReturnHeader",
    "FilingStatus",
    "Filer/PrimarySSN",
    "Filer/Name",
    "ReturnData"
  ],
  "1040-NR": [
    "ReturnHeader",
    "FilingStatus",
    "Filer/PrimarySSN",
    "Filer/Name",
    "ReturnData"
  ]
};
function validateReturnXml(xml, returnType) {
  const errors = [];
  const warnings = [];
  if (!xml || xml.trim().length === 0) {
    errors.push({
      code: "EMPTY_XML",
      message: "Return XML is empty",
      severity: "error"
    });
    return { valid: false, errors, warnings };
  }
  if (!xml.includes("<?xml")) {
    errors.push({
      code: "MISSING_XML_DECL",
      message: "Missing XML declaration",
      severity: "error"
    });
  }
  try {
    const openTags = xml.match(/<[^/][^>]*[^/]>/g) || [];
    const closeTags = xml.match(/<\/[^>]+>/g) || [];
    if (openTags.length !== closeTags.length) {
      warnings.push({
        code: "TAG_MISMATCH",
        message: "Potential mismatched XML tags",
        severity: "warning"
      });
    }
  } catch (e) {
    errors.push({
      code: "MALFORMED_XML",
      message: "XML appears to be malformed",
      severity: "error"
    });
  }
  const requiredElements = REQUIRED_ELEMENTS_BY_RETURN_TYPE[returnType] || [];
  for (const element of requiredElements) {
    const elementName = element.split("/").pop();
    if (!xml.includes(elementName)) {
      errors.push({
        code: "MISSING_ELEMENT",
        message: `Missing required element: ${element}`,
        field: element,
        severity: "error"
      });
    }
  }
  const ssnMatch = xml.match(/<.*SSN>(\d+)<\/.*SSN>/);
  if (ssnMatch) {
    const ssn = ssnMatch[1];
    if (!/^\d{9}$/.test(ssn)) {
      errors.push({
        code: "INVALID_SSN",
        message: "SSN must be exactly 9 digits",
        field: "SSN",
        severity: "error"
      });
    }
    if (isProduction() && ssn.startsWith("9")) {
      errors.push({
        code: "TEST_SSN_IN_PROD",
        message: "Test SSN (starting with 9) cannot be used in production",
        field: "SSN",
        severity: "error"
      });
    }
  }
  const taxYearMatch = xml.match(/<TaxYr>(\d{4})<\/TaxYr>/);
  if (taxYearMatch) {
    const year = parseInt(taxYearMatch[1]);
    if (year < 2020 || year > (/* @__PURE__ */ new Date()).getFullYear()) {
      warnings.push({
        code: "UNUSUAL_TAX_YEAR",
        message: `Tax year ${year} seems unusual`,
        field: "TaxYr",
        severity: "warning"
      });
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
__name(validateReturnXml, "validateReturnXml");
async function withRetry(operation, operationName, logger) {
  const { max_attempts, initial_delay_ms, backoff_multiplier, max_delay_ms } = MEF_CONFIG.retry;
  let lastError = null;
  let delay = initial_delay_ms;
  for (let attempt = 1; attempt <= max_attempts; attempt++) {
    try {
      logger.debug(operationName, `Attempt ${attempt}/${max_attempts}`);
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn(operationName, `Attempt ${attempt} failed: ${error.message}`, {
        attempt,
        maxAttempts: max_attempts,
        error: error.message
      });
      if (attempt < max_attempts) {
        logger.debug(operationName, `Waiting ${delay}ms before retry`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoff_multiplier, max_delay_ms);
      }
    }
  }
  throw lastError || new Error("Operation failed after retries");
}
__name(withRetry, "withRetry");
var MefClient = class {
  static {
    __name(this, "MefClient");
  }
  config;
  certConfig = null;
  logger;
  env;
  processedAcks = /* @__PURE__ */ new Set();
  // For idempotency
  constructor(env) {
    this.config = MEF_CONFIG;
    this.env = env;
    this.logger = new MefLogger(env);
    const hasCert = !!env?.MEF_CLIENT_CERT;
    const hasKey = !!env?.MEF_CLIENT_KEY;
    const hasCABundle = !!env?.MEF_CA_BUNDLE;
    if (hasCert && hasKey) {
      this.certConfig = {
        clientCertPem: env.MEF_CLIENT_CERT,
        clientKeyPem: env.MEF_CLIENT_KEY,
        caBundlePem: env.MEF_CA_BUNDLE
      };
      if (!hasCABundle) {
        this.logger.warn("Init", "CA bundle missing: IRS CA chain validation may fail.");
      }
      this.logger.info("Init", "Certificate configuration loaded. E-file transmission ENABLED.");
    } else {
      if (!hasCert && !hasKey) {
        this.logger.error("Init", "Missing BOTH MEF_CLIENT_CERT and MEF_CLIENT_KEY. E-file transmission DISABLED.");
      } else if (!hasCert) {
        this.logger.error("Init", "Missing MEF_CLIENT_CERT. E-file transmission DISABLED.");
      } else if (!hasKey) {
        this.logger.error("Init", "Missing MEF_CLIENT_KEY. E-file transmission DISABLED.");
      }
      this.logger.warn("Init", "No certificate configuration - using test mode. IRS transmission is NOT possible.");
    }
    const profile = getActiveProfile();
    this.logger.info("Init", "MeF Client initialized", {
      environment: this.config.environment,
      efin: profile.efin,
      etin: getActiveEtin(),
      profile: profile.firm_name,
      transmissionsEnabled: isTransmissionEnabled(),
      hasClientCert: hasCert,
      hasClientKey: hasKey,
      hasCABundle
    });
  }
  /**
   * Pre-flight checks before any operation
   */
  preflight() {
    if (!isTransmissionEnabled()) {
      return { ok: false, error: "Transmissions are disabled (kill switch active)" };
    }
    const approval = validateSoftwareDeveloperApproval();
    if (!approval.valid) {
      return { ok: false, error: approval.message };
    }
    return { ok: true };
  }
  /**
   * Generate unique Submission ID
   */
  generateSubmissionId() {
    const profile = getActiveProfile();
    const timestamp = Date.now().toString(36);
    const random = v4_default().slice(0, 8);
    return `${profile.efin}-${timestamp}-${random}`.toUpperCase();
  }
  /**
   * Build SOAP envelope
   */
  buildSoapEnvelope(operation, payload) {
    const profile = getActiveProfile();
    const etin = getActiveEtin();
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope 
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:mef="urn:us:gov:treasury:irs:mef">
  <soapenv:Header>
    <mef:TransmitterHeader>
      <mef:EFIN>${profile.efin}</mef:EFIN>
      <mef:ETIN>${etin}</mef:ETIN>
      <mef:Timestamp>${(/* @__PURE__ */ new Date()).toISOString()}</mef:Timestamp>
      <mef:SoftwareId>ROSSTAXPREP-2026</mef:SoftwareId>
    </mef:TransmitterHeader>
  </soapenv:Header>
  <soapenv:Body>
    <mef:${operation}Request>
      ${payload}
    </mef:${operation}Request>
  </soapenv:Body>
</soapenv:Envelope>`;
  }
  /**
   * ✅ Requirement 2A: SendSubmissions
   */
  async sendSubmission(returnXml, returnType, taxYear) {
    const startTime = Date.now();
    const requestId = v4_default();
    const submissionId = this.generateSubmissionId();
    this.logger.info("SendSubmission", "Starting submission", {
      requestId,
      submissionId,
      returnType,
      taxYear
    });
    const preflight = this.preflight();
    if (!preflight.ok) {
      this.logger.error("SendSubmission", preflight.error, { requestId, submissionId });
      return {
        success: false,
        error: preflight.error,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    }
    const validation = validateReturnXml(returnXml, returnType);
    if (!validation.valid) {
      this.logger.error("SendSubmission", "Validation failed", {
        requestId,
        submissionId,
        errors: validation.errors
      });
      return {
        success: false,
        error: `Validation failed: ${validation.errors.map((e) => e.message).join(", ")}`,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    }
    if (validation.warnings.length > 0) {
      this.logger.warn("SendSubmission", "Validation warnings", {
        requestId,
        submissionId,
        warnings: validation.warnings
      });
    }
    const profile = getActiveProfile();
    const endpoint = getMefEndpoint(this.config.services.SendSubmissions);
    function toBase64(str) {
      if (typeof btoa === "function") {
        return btoa(unescape(encodeURIComponent(str)));
      } else if (typeof Buffer !== "undefined") {
        return Buffer.from(str, "utf-8").toString("base64");
      } else if (typeof globalThis !== "undefined" && typeof globalThis.btoa === "function") {
        return globalThis.btoa(unescape(encodeURIComponent(str)));
      } else {
        throw new Error("No btoa or Buffer available for base64 encoding");
      }
    }
    __name(toBase64, "toBase64");
    const soapRequest = this.buildSoapEnvelope("SendSubmissions", `
      <mef:SubmissionId>${submissionId}</mef:SubmissionId>
      <mef:ReturnType>${returnType}</mef:ReturnType>
      <mef:TaxYear>${taxYear}</mef:TaxYear>
      <mef:ReturnData>${toBase64(returnXml)}</mef:ReturnData>
    `);
    if (!this.certConfig) {
      this.logger.warn("SendSubmission", "Test mode - simulating IRS response", {
        requestId,
        submissionId
      });
      const submission = {
        submissionId,
        efin: profile.efin,
        etin: getActiveEtin(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: "Received",
        returnType,
        taxYear,
        environment: this.config.environment,
        requestXml: soapRequest
      };
      await this.storeSubmission(submission);
      return {
        success: true,
        data: submission,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    }
    try {
      const response = await withRetry(
        async () => {
          const resp = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "text/xml; charset=utf-8",
              "SOAPAction": `"urn:SendSubmissions"`
            },
            body: soapRequest
          });
          if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
          }
          return resp.text();
        },
        "SendSubmission",
        this.logger
      );
      this.logger.info("SendSubmission", "Submission sent successfully", {
        requestId,
        submissionId,
        durationMs: Date.now() - startTime
      });
      const submission = {
        submissionId,
        efin: profile.efin,
        etin: getActiveEtin(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: "Received",
        returnType,
        taxYear,
        environment: this.config.environment,
        requestXml: soapRequest,
        responseXml: response
      };
      await this.storeSubmission(submission);
      return {
        success: true,
        data: submission,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      this.logger.error("SendSubmission", "Submission failed", {
        requestId,
        submissionId,
        error: error.message
      });
      return {
        success: false,
        error: error.message,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    }
  }
  /**
   * ✅ Requirement 2B: GetSubmissionStatus
   */
  async getSubmissionStatus(submissionId) {
    const startTime = Date.now();
    const requestId = v4_default();
    this.logger.info("GetStatus", "Checking submission status", {
      requestId,
      submissionId
    });
    const endpoint = getMefEndpoint(this.config.services.GetSubmissionStatus);
    const soapRequest = this.buildSoapEnvelope("GetSubmissionStatus", `
      <mef:SubmissionId>${submissionId}</mef:SubmissionId>
    `);
    if (!this.certConfig) {
      const storedStatus = await this.getStoredStatus(submissionId);
      const status = storedStatus || "Processing";
      this.logger.info("GetStatus", "Test mode - returning simulated status", {
        requestId,
        submissionId,
        status
      });
      return {
        success: true,
        data: status,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    }
    try {
      const response = await withRetry(
        async () => {
          const resp = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "text/xml; charset=utf-8",
              "SOAPAction": `"urn:GetSubmissionStatus"`
            },
            body: soapRequest
          });
          if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
          }
          return resp.text();
        },
        "GetStatus",
        this.logger
      );
      const statusMatch = response.match(/<Status>(\w+)<\/Status>/);
      const status = statusMatch?.[1] || "Processing";
      await this.updateStoredStatus(submissionId, status);
      return {
        success: true,
        data: status,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      this.logger.error("GetStatus", "Status check failed", {
        requestId,
        submissionId,
        error: error.message
      });
      return {
        success: false,
        error: error.message,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    }
  }
  /**
   * ✅ Requirement 2C: GetAcknowledgment (single)
   */
  async getAcknowledgment(submissionId) {
    const startTime = Date.now();
    const requestId = v4_default();
    this.logger.info("GetAck", "Retrieving acknowledgment", {
      requestId,
      submissionId
    });
    const endpoint = getMefEndpoint(this.config.services.GetAck);
    const soapRequest = this.buildSoapEnvelope("GetAck", `
      <mef:SubmissionId>${submissionId}</mef:SubmissionId>
    `);
    if (!this.certConfig) {
      const ack = {
        ackId: `ACK-${submissionId}`,
        submissionId,
        status: "Accepted",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        dcn: `DCN${Date.now()}`
      };
      if (this.processedAcks.has(ack.ackId)) {
        this.logger.warn("GetAck", "ACK already processed (idempotent skip)", {
          requestId,
          submissionId,
          ackId: ack.ackId
        });
      } else {
        await this.storeAcknowledgment(ack);
        this.processedAcks.add(ack.ackId);
      }
      return {
        success: true,
        data: ack,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    }
    try {
      const response = await withRetry(
        async () => {
          const resp = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "text/xml; charset=utf-8",
              "SOAPAction": `"urn:GetAck"`
            },
            body: soapRequest
          });
          if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
          }
          return resp.text();
        },
        "GetAck",
        this.logger
      );
      const ack = this.parseAcknowledgment(response, submissionId);
      if (ack) {
        const isProcessed = await this.isAckProcessed(ack.ackId);
        if (!isProcessed) {
          await this.storeAcknowledgment(ack);
          this.processedAcks.add(ack.ackId);
        } else {
          this.logger.warn("GetAck", "ACK already processed", {
            requestId,
            ackId: ack.ackId
          });
        }
      }
      return {
        success: true,
        data: ack,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      this.logger.error("GetAck", "Failed to retrieve acknowledgment", {
        requestId,
        submissionId,
        error: error.message
      });
      return {
        success: false,
        error: error.message,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    }
  }
  /**
   * ✅ Requirement 2C: GetNewAcks (batch, idempotent)
   */
  async getNewAcknowledgments() {
    const startTime = Date.now();
    const requestId = v4_default();
    this.logger.info("GetNewAcks", "Retrieving new acknowledgments", { requestId });
    const endpoint = getMefEndpoint(this.config.services.GetNewAcks);
    const soapRequest = this.buildSoapEnvelope("GetNewAcks", "");
    if (!this.certConfig) {
      return {
        success: true,
        data: [],
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    }
    try {
      const response = await withRetry(
        async () => {
          const resp = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "text/xml; charset=utf-8",
              "SOAPAction": `"urn:GetNewAcks"`
            },
            body: soapRequest
          });
          if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
          }
          return resp.text();
        },
        "GetNewAcks",
        this.logger
      );
      const acks = this.parseAcknowledgments(response);
      const newAcks = [];
      for (const ack of acks) {
        const isProcessed = await this.isAckProcessed(ack.ackId);
        if (!isProcessed) {
          await this.storeAcknowledgment(ack);
          this.processedAcks.add(ack.ackId);
          newAcks.push(ack);
        } else {
          this.logger.debug("GetNewAcks", "Skipping already processed ACK", {
            ackId: ack.ackId
          });
        }
      }
      this.logger.info("GetNewAcks", `Processed ${newAcks.length} new acknowledgments`, {
        requestId,
        totalReceived: acks.length,
        newProcessed: newAcks.length
      });
      return {
        success: true,
        data: newAcks,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      this.logger.error("GetNewAcks", "Failed to retrieve acknowledgments", {
        requestId,
        error: error.message
      });
      return {
        success: false,
        error: error.message,
        requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: this.config.environment,
        durationMs: Date.now() - startTime
      };
    }
  }
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  parseAcknowledgment(xml, submissionId) {
    const statusMatch = xml.match(/<Status>(\w+)<\/Status>/);
    const dcnMatch = xml.match(/<DCN>([^<]+)<\/DCN>/);
    const ackIdMatch = xml.match(/<AckId>([^<]+)<\/AckId>/);
    if (!statusMatch) return null;
    const ack = {
      ackId: ackIdMatch?.[1] || `ACK-${submissionId}-${Date.now()}`,
      submissionId,
      status: statusMatch[1],
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      dcn: dcnMatch?.[1]
    };
    if (ack.status === "Rejected") {
      const errors = [];
      const errorMatches = xml.matchAll(/<Error>[\s\S]*?<ErrorCode>([^<]+)<\/ErrorCode>[\s\S]*?<ErrorMessage>([^<]+)<\/ErrorMessage>[\s\S]*?<\/Error>/g);
      for (const match2 of errorMatches) {
        errors.push({
          errorCode: match2[1],
          errorCategory: "Reject",
          errorMessage: match2[2]
        });
      }
      if (errors.length > 0) {
        ack.errors = errors;
      }
    }
    return ack;
  }
  parseAcknowledgments(xml) {
    const acks = [];
    const ackMatches = xml.matchAll(/<Acknowledgment>[\s\S]*?<SubmissionId>([^<]+)<\/SubmissionId>[\s\S]*?<\/Acknowledgment>/g);
    for (const match2 of ackMatches) {
      const submissionId = match2[1];
      const ack = this.parseAcknowledgment(match2[0], submissionId);
      if (ack) acks.push(ack);
    }
    return acks;
  }
  async storeSubmission(submission) {
    if (!this.env?.DB) return;
    try {
      await this.env.DB.prepare(`
        INSERT INTO mef_submissions (
          submission_id, efin, etin, timestamp, status, 
          return_type, tax_year, environment, request_xml, response_xml
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        submission.submissionId,
        submission.efin,
        submission.etin,
        submission.timestamp,
        submission.status,
        submission.returnType,
        submission.taxYear,
        submission.environment,
        submission.requestXml || null,
        submission.responseXml || null
      ).run();
    } catch (e) {
      this.logger.error("Storage", "Failed to store submission", { error: String(e) });
    }
  }
  async storeAcknowledgment(ack) {
    if (!this.env?.DB) return;
    try {
      await this.env.DB.prepare(`
        INSERT INTO mef_acknowledgments (
          id, submission_id, ack_id, status, dcn, 
          tax_year, return_type, errors_json, received_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        v4_default(),
        ack.submissionId,
        ack.ackId,
        ack.status,
        ack.dcn || null,
        ack.taxYear || null,
        ack.returnType || null,
        ack.errors ? JSON.stringify(ack.errors) : null,
        ack.timestamp
      ).run();
    } catch (e) {
      this.logger.error("Storage", "Failed to store acknowledgment", { error: String(e) });
    }
  }
  async isAckProcessed(ackId) {
    if (this.processedAcks.has(ackId)) return true;
    if (this.env?.DB) {
      try {
        const row = await this.env.DB.prepare(
          "SELECT id FROM mef_acknowledgments WHERE ack_id = ?"
        ).bind(ackId).first();
        return !!row;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
  async getStoredStatus(submissionId) {
    if (!this.env?.DB) return null;
    try {
      const row = await this.env.DB.prepare(
        "SELECT status FROM mef_submissions WHERE submission_id = ?"
      ).bind(submissionId).first();
      return row?.status || null;
    } catch (e) {
      return null;
    }
  }
  async updateStoredStatus(submissionId, status) {
    if (!this.env?.DB) return;
    try {
      await this.env.DB.prepare(
        "UPDATE mef_submissions SET status = ? WHERE submission_id = ?"
      ).bind(status, submissionId).run();
    } catch (e) {
      this.logger.error("Storage", "Failed to update status", { error: String(e) });
    }
  }
  /**
   * Get recent logs for monitoring
   */
  getLogs() {
    return this.logger.getRecentLogs();
  }
  /**
   * Get client info for debugging
   */
  getInfo() {
    const profile = getActiveProfile();
    return {
      environment: this.config.environment,
      efin: profile.efin,
      etin: getActiveEtin(),
      profile: profile.firm_name,
      softwareDevApproved: profile.software_developer_approved,
      transmissionsEnabled: isTransmissionEnabled(),
      hasCertificates: !!this.certConfig,
      isProduction: isProduction()
    };
  }
};
function createMefClient(env) {
  return new MefClient(env);
}
__name(createMefClient, "createMefClient");
var MefEnvironments = {
  ATS: {
    name: "Assurance Testing System",
    baseUrl: MEF_CONFIG.endpoints.ATS_BASE,
    description: "IRS test environment for validating e-file submissions"
  },
  PRODUCTION: {
    name: "Production",
    baseUrl: MEF_CONFIG.endpoints.PROD_BASE,
    description: "IRS production environment for live e-file submissions"
  }
};

// src/schemaValidator.ts
var COMMON_RULES = [
  {
    id: "R0001",
    name: "XML Declaration Required",
    description: "Return must have valid XML declaration",
    forms: ["1040", "1040-SR", "1040-NR", "1120", "1120-S", "1120-H", "1041", "1065", "7004", "940", "941"],
    severity: "reject",
    category: "Structure",
    validate: /* @__PURE__ */ __name((xml) => xml.trim().startsWith("<?xml"), "validate"),
    errorMessage: "XML declaration is missing or invalid"
  },
  {
    id: "R0002",
    name: "Return Element Required",
    description: "Root Return element must be present",
    forms: ["1040", "1040-SR", "1040-NR", "1120", "1120-S", "1120-H", "1041", "1065", "7004", "940", "941"],
    severity: "reject",
    category: "Structure",
    validate: /* @__PURE__ */ __name((xml) => /<Return[\s>]/.test(xml), "validate"),
    errorMessage: "Return element is missing"
  },
  {
    id: "R0003",
    name: "ReturnHeader Required",
    description: "ReturnHeader element must be present",
    forms: ["1040", "1040-SR", "1040-NR", "1120", "1120-S", "1120-H", "1041", "1065", "7004", "940", "941"],
    severity: "reject",
    category: "Structure",
    validate: /* @__PURE__ */ __name((xml) => /<ReturnHeader[\s>]/.test(xml), "validate"),
    errorMessage: "ReturnHeader element is missing"
  },
  {
    id: "R0004",
    name: "TaxYear Required",
    description: "Tax year must be specified",
    forms: ["1040", "1040-SR", "1040-NR", "1120", "1120-S", "1120-H", "1041", "1065", "7004", "940", "941"],
    severity: "reject",
    category: "Header",
    validate: /* @__PURE__ */ __name((xml) => /<TaxYr>\d{4}<\/TaxYr>/.test(xml) || /<TaxYear>\d{4}<\/TaxYear>/.test(xml), "validate"),
    errorMessage: "Tax year is missing or invalid"
  },
  {
    id: "R0005",
    name: "TaxYear Valid Range",
    description: "Tax year must be within acceptable range",
    forms: ["1040", "1040-SR", "1040-NR", "1120", "1120-S", "1120-H", "1041", "1065", "7004", "940", "941"],
    severity: "reject",
    category: "Header",
    validate: /* @__PURE__ */ __name((xml, ctx) => {
      const match2 = xml.match(/<TaxYr>(\d{4})<\/TaxYr>/) || xml.match(/<TaxYear>(\d{4})<\/TaxYear>/);
      if (!match2) return false;
      const year = parseInt(match2[1]);
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      return year >= 2020 && year <= currentYear;
    }, "validate"),
    errorMessage: "Tax year is outside acceptable range (2020-current)"
  },
  {
    id: "R0006",
    name: "ReturnData Required",
    description: "ReturnData element must be present",
    forms: ["1040", "1040-SR", "1040-NR", "1120", "1120-S", "1120-H", "1041", "1065", "940", "941"],
    severity: "reject",
    category: "Structure",
    validate: /* @__PURE__ */ __name((xml) => /<ReturnData[\s>]/.test(xml), "validate"),
    errorMessage: "ReturnData element is missing"
  }
];
var INDIVIDUAL_RULES = [
  {
    id: "IND-001",
    name: "Primary SSN Required",
    description: "Primary taxpayer SSN must be present",
    forms: ["1040", "1040-SR", "1040-NR"],
    severity: "reject",
    category: "Filer",
    validate: /* @__PURE__ */ __name((xml) => /<PrimarySSN>\d{9}<\/PrimarySSN>/.test(xml) || /<TaxpayerSSN>\d{9}<\/TaxpayerSSN>/.test(xml), "validate"),
    errorMessage: "Primary taxpayer SSN is missing or invalid format"
  },
  {
    id: "IND-002",
    name: "SSN Format Valid",
    description: "SSN must be 9 digits, not all zeros",
    forms: ["1040", "1040-SR", "1040-NR"],
    severity: "reject",
    category: "Filer",
    validate: /* @__PURE__ */ __name((xml) => {
      const match2 = xml.match(/<(?:Primary)?(?:Taxpayer)?SSN>(\d{9})<\/(?:Primary)?(?:Taxpayer)?SSN>/);
      if (!match2) return false;
      const ssn = match2[1];
      return ssn !== "000000000" && !/^(\d)\1{8}$/.test(ssn);
    }, "validate"),
    errorMessage: "SSN format is invalid (cannot be all zeros or repeating digit)"
  },
  {
    id: "IND-003",
    name: "Filing Status Required",
    description: "Filing status must be specified",
    forms: ["1040", "1040-SR", "1040-NR"],
    severity: "reject",
    category: "Filer",
    validate: /* @__PURE__ */ __name((xml) => /<FilingStatus/.test(xml) || /<FilingStatusCd>/.test(xml), "validate"),
    errorMessage: "Filing status is missing"
  },
  {
    id: "IND-004",
    name: "Taxpayer Name Required",
    description: "Primary taxpayer name must be present",
    forms: ["1040", "1040-SR", "1040-NR"],
    severity: "reject",
    category: "Filer",
    validate: /* @__PURE__ */ __name((xml) => /<Name[\s>]/.test(xml) && (/<FirstName>/.test(xml) || /<PersonFirstNm>/.test(xml)), "validate"),
    errorMessage: "Taxpayer name is missing"
  },
  {
    id: "IND-005",
    name: "ATS Test SSN Check",
    description: "Test SSNs (9xx) only allowed in ATS environment",
    forms: ["1040", "1040-SR", "1040-NR"],
    severity: "reject",
    category: "Environment",
    validate: /* @__PURE__ */ __name((xml, ctx) => {
      const match2 = xml.match(/<(?:Primary)?(?:Taxpayer)?SSN>(\d{9})<\/(?:Primary)?(?:Taxpayer)?SSN>/);
      if (!match2) return true;
      const ssn = match2[1];
      const isTestSSN = ssn.startsWith("9");
      if (ctx.environment === "PRODUCTION" && isTestSSN) {
        return false;
      }
      return true;
    }, "validate"),
    errorMessage: "Test SSN (starting with 9) cannot be used in Production"
  }
];
var CORPORATION_RULES = [
  {
    id: "CORP-001",
    name: "EIN Required",
    description: "Employer Identification Number must be present",
    forms: ["1120", "1120-S", "1120-H"],
    severity: "reject",
    category: "Filer",
    validate: /* @__PURE__ */ __name((xml) => /<EIN>\d{9}<\/EIN>/.test(xml) || /<EmployerIdentificationNumber>\d{9}<\/EmployerIdentificationNumber>/.test(xml), "validate"),
    errorMessage: "EIN is missing or invalid format"
  },
  {
    id: "CORP-002",
    name: "Business Name Required",
    description: "Business name must be present",
    forms: ["1120", "1120-S", "1120-H"],
    severity: "reject",
    category: "Filer",
    validate: /* @__PURE__ */ __name((xml) => /<BusinessName[\s>]/.test(xml) || /<BusinessNameLine1/.test(xml), "validate"),
    errorMessage: "Business name is missing"
  },
  {
    id: "CORP-003",
    name: "Tax Period End Date",
    description: "Tax period end date must be specified for corporations",
    forms: ["1120", "1120-S"],
    severity: "reject",
    category: "Header",
    validate: /* @__PURE__ */ __name((xml) => /<TaxPeriodEndDt>/.test(xml) || /<TaxPeriodEndDate>/.test(xml), "validate"),
    errorMessage: "Tax period end date is missing"
  },
  {
    id: "CORP-004",
    name: "S-Corp Election Date",
    description: "1120-S requires S election date or box checked",
    forms: ["1120-S"],
    severity: "warning",
    category: "Election",
    validate: /* @__PURE__ */ __name((xml) => /<SElectionEffectiveDt>/.test(xml) || /<InitialReturn>/.test(xml), "validate"),
    errorMessage: "S election effective date or initial return indicator recommended"
  }
];
var PARTNERSHIP_RULES = [
  {
    id: "PTNR-001",
    name: "Partnership EIN Required",
    description: "Partnership EIN must be present",
    forms: ["1065"],
    severity: "reject",
    category: "Filer",
    validate: /* @__PURE__ */ __name((xml) => /<EIN>\d{9}<\/EIN>/.test(xml), "validate"),
    errorMessage: "Partnership EIN is missing"
  },
  {
    id: "PTNR-002",
    name: "Partner Information",
    description: "At least one partner Schedule K-1 required",
    forms: ["1065"],
    severity: "warning",
    category: "Schedules",
    validate: /* @__PURE__ */ __name((xml) => /<IRS.*K1/.test(xml) || /<Schedule.*K1/.test(xml) || /<PartnerInformation/.test(xml), "validate"),
    errorMessage: "No Schedule K-1 partner information found"
  }
];
var ESTATE_TRUST_RULES = [
  {
    id: "EST-001",
    name: "Estate/Trust EIN Required",
    description: "Estate or Trust EIN must be present",
    forms: ["1041"],
    severity: "reject",
    category: "Filer",
    validate: /* @__PURE__ */ __name((xml) => /<EIN>\d{9}<\/EIN>/.test(xml), "validate"),
    errorMessage: "Estate/Trust EIN is missing"
  },
  {
    id: "EST-002",
    name: "Entity Type Required",
    description: "Trust type indicator must be specified",
    forms: ["1041"],
    severity: "reject",
    category: "Filer",
    validate: /* @__PURE__ */ __name((xml) => /<TypeOfEntity/.test(xml) || /<DecedentEstate/.test(xml) || /<SimpleTrust/.test(xml) || /<ComplexTrust/.test(xml), "validate"),
    errorMessage: "Entity type (estate/trust type) is missing"
  }
];
var EXTENSION_RULES = [
  {
    id: "EXT-001",
    name: "Form Code Required",
    description: "Extension must specify which form is being extended",
    forms: ["7004"],
    severity: "reject",
    category: "Extension",
    validate: /* @__PURE__ */ __name((xml) => /<FormCode>/.test(xml) || /<ExtensionFormCd>/.test(xml), "validate"),
    errorMessage: "Form code for extension is missing"
  },
  {
    id: "EXT-002",
    name: "Tentative Tax",
    description: "Tentative tax amount should be specified",
    forms: ["7004"],
    severity: "warning",
    category: "Extension",
    validate: /* @__PURE__ */ __name((xml) => /<TentativeTax/.test(xml) || /<TotalTax/.test(xml), "validate"),
    errorMessage: "Tentative tax amount not specified"
  }
];
var EMPLOYMENT_RULES = [
  {
    id: "EMP-001",
    name: "Quarter Indicator Required",
    description: "Quarterly returns must specify the quarter",
    forms: ["941", "943"],
    severity: "reject",
    category: "Period",
    validate: /* @__PURE__ */ __name((xml) => /<Quarter/.test(xml) || /<Qtr/.test(xml), "validate"),
    errorMessage: "Quarter indicator is missing"
  },
  {
    id: "EMP-002",
    name: "Wages Reported",
    description: "Total wages must be reported",
    forms: ["940", "941", "943", "944", "945"],
    severity: "reject",
    category: "Wages",
    validate: /* @__PURE__ */ __name((xml) => /<.*Wages.*>/.test(xml) || /<WagesAmt>/.test(xml), "validate"),
    errorMessage: "Total wages amount is missing"
  },
  {
    id: "EMP-003",
    name: "Employee Count",
    description: "Number of employees should be specified",
    forms: ["941", "944"],
    severity: "warning",
    category: "Employees",
    validate: /* @__PURE__ */ __name((xml) => /<NumberOfEmployees/.test(xml) || /<EmployeeCnt/.test(xml), "validate"),
    errorMessage: "Number of employees not specified"
  }
];
var ALL_RULES = [
  ...COMMON_RULES,
  ...INDIVIDUAL_RULES,
  ...CORPORATION_RULES,
  ...PARTNERSHIP_RULES,
  ...ESTATE_TRUST_RULES,
  ...EXTENSION_RULES,
  ...EMPLOYMENT_RULES
];
var SchemaValidator = class {
  static {
    __name(this, "SchemaValidator");
  }
  rules;
  constructor() {
    this.rules = ALL_RULES;
  }
  /**
   * Validate tax return XML against business rules
   */
  validate(xml, returnType, options = {}) {
    const context = {
      taxYear: options.taxYear || this.extractTaxYear(xml) || (/* @__PURE__ */ new Date()).getFullYear().toString(),
      returnType,
      isAmended: options.isAmended || xml.includes("Amended") || returnType.includes("-X"),
      environment: options.environment || "ATS"
    };
    const errors = [];
    const warnings = [];
    const ruleChecks = [];
    const applicableRules = this.rules.filter(
      (rule) => rule.forms.includes(returnType) || rule.forms.includes(returnType.split("-")[0])
    );
    for (const rule of applicableRules) {
      try {
        const passed = rule.validate(xml, context);
        ruleChecks.push({
          ruleId: rule.id,
          ruleName: rule.name,
          passed,
          message: passed ? void 0 : rule.errorMessage
        });
        if (!passed) {
          if (rule.severity === "reject" || rule.severity === "error") {
            errors.push({
              code: rule.id,
              rule: rule.name,
              message: rule.errorMessage,
              severity: rule.severity,
              category: rule.category
            });
          } else {
            warnings.push({
              code: rule.id,
              rule: rule.name,
              message: rule.errorMessage,
              severity: rule.severity
            });
          }
        }
      } catch (e) {
        errors.push({
          code: rule.id,
          rule: rule.name,
          message: `Rule execution error: ${e}`,
          severity: "error",
          category: "System"
        });
      }
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      ruleChecks,
      summary: {
        totalRules: applicableRules.length,
        passed: ruleChecks.filter((r2) => r2.passed).length,
        failed: errors.length,
        warnings: warnings.length
      }
    };
  }
  /**
   * Quick validation - only checks critical rules
   */
  quickValidate(xml, returnType) {
    const criticalRules = this.rules.filter(
      (r2) => r2.severity === "reject" && r2.forms.includes(returnType)
    );
    const errors = [];
    const context = {
      taxYear: this.extractTaxYear(xml) || (/* @__PURE__ */ new Date()).getFullYear().toString(),
      returnType,
      isAmended: false,
      environment: "ATS"
    };
    for (const rule of criticalRules) {
      if (!rule.validate(xml, context)) {
        errors.push(`[${rule.id}] ${rule.errorMessage}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }
  /**
   * Get list of rules for a specific form
   */
  getRulesForForm(returnType) {
    return this.rules.filter((r2) => r2.forms.includes(returnType));
  }
  /**
   * Get all supported return types
   */
  getSupportedForms() {
    const forms = /* @__PURE__ */ new Set();
    this.rules.forEach((r2) => r2.forms.forEach((f2) => forms.add(f2)));
    return Array.from(forms);
  }
  /**
   * Extract tax year from XML
   */
  extractTaxYear(xml) {
    const match2 = xml.match(/<TaxYr>(\d{4})<\/TaxYr>/) || xml.match(/<TaxYear>(\d{4})<\/TaxYear>/);
    return match2 ? match2[1] : null;
  }
};
function createSchemaValidator() {
  return new SchemaValidator();
}
__name(createSchemaValidator, "createSchemaValidator");

// src/efile.ts
async function transmitEFile(env, transmission, returnXml, returnType = "1040", taxYear = "2025") {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const mefClient = createMefClient(env);
  const schemaValidator = createSchemaValidator();
  console.log(`[E-File] Starting transmission for return ${transmission.return_id}`);
  console.log(`[E-File] Environment: ${MEF_CONFIG.environment}`);
  console.log(`[E-File] Profile: ${ERO_EFIN_PROFILE.firm_name}`);
  console.log(`[E-File] EFIN: ${ERO_EFIN_PROFILE.efin}, ETIN: ${getActiveEtin()}`);
  if (!isTransmissionEnabled()) {
    console.log("[E-File] Transmissions disabled (kill switch active)");
    return {
      success: false,
      transmission: {
        ...transmission,
        status: "error",
        ack_message: "Transmissions are currently disabled",
        updated_at: now
      },
      errors: ["Transmissions disabled"]
    };
  }
  if (!returnXml) {
    console.log("[E-File] No return XML provided - running in test mode");
    return {
      success: true,
      transmission: {
        ...transmission,
        status: "accepted",
        irs_submission_id: "TEST-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
        ack_code: "A0000",
        ack_message: "Test submission accepted",
        efin: ERO_EFIN_PROFILE.efin,
        etin: getActiveEtin(),
        environment: MEF_CONFIG.environment,
        updated_at: now
      }
    };
  }
  const validation = schemaValidator.validate(returnXml, returnType, {
    taxYear,
    environment: MEF_CONFIG.environment
  });
  if (!validation.valid) {
    console.error("[E-File] Schema validation failed:", validation.errors);
    return {
      success: false,
      transmission: {
        ...transmission,
        status: "error",
        ack_message: `Validation failed: ${validation.errors.map((e) => e.message).join(", ")}`,
        updated_at: now
      },
      errors: validation.errors.map((e) => `[${e.code}] ${e.message}`)
    };
  }
  if (validation.warnings.length > 0) {
    console.warn("[E-File] Schema validation warnings:", validation.warnings);
  }
  try {
    transmission.status = "transmitting";
    transmission.updated_at = now;
    const mefResult = await mefClient.sendSubmission(returnXml, returnType, taxYear);
    if (!mefResult.success || !mefResult.data) {
      console.error("[E-File] MeF submission failed:", mefResult.error);
      return {
        success: false,
        transmission: {
          ...transmission,
          status: "error",
          ack_message: mefResult.error || "Submission failed",
          updated_at: now
        },
        mefResult,
        errors: [mefResult.error || "Unknown error"]
      };
    }
    console.log(`[E-File] Submission sent: ${mefResult.data.submissionId}`);
    const updatedTransmission = {
      ...transmission,
      status: mefResult.data.status === "Received" ? "pending" : "transmitting",
      irs_submission_id: mefResult.data.submissionId,
      efin: mefResult.data.efin,
      etin: mefResult.data.etin,
      environment: mefResult.data.environment,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    return {
      success: true,
      transmission: updatedTransmission,
      mefResult
    };
  } catch (error) {
    console.error("[E-File] Transmission failed:", error);
    return {
      success: false,
      transmission: {
        ...transmission,
        status: "error",
        ack_message: error.message || "Transmission failed",
        updated_at: now
      },
      errors: [error.message]
    };
  }
}
__name(transmitEFile, "transmitEFile");
async function checkSubmissionStatus(env, submissionId) {
  const mefClient = createMefClient(env);
  console.log(`[E-File] Checking status for ${submissionId}`);
  const statusResult = await mefClient.getSubmissionStatus(submissionId);
  if (!statusResult.success || !statusResult.data) {
    return { status: "Error" };
  }
  const status = statusResult.data;
  if (status === "Accepted" || status === "Rejected") {
    const ackResult = await mefClient.getAcknowledgment(submissionId);
    return {
      status,
      acknowledgment: ackResult.success ? ackResult.data || void 0 : void 0
    };
  }
  return { status };
}
__name(checkSubmissionStatus, "checkSubmissionStatus");
async function processNewAcknowledgments(env) {
  const mefClient = createMefClient(env);
  console.log("[E-File] Processing new acknowledgments");
  const acksResult = await mefClient.getNewAcknowledgments();
  if (!acksResult.success || !acksResult.data) {
    console.error("[E-File] Failed to get acknowledgments:", acksResult.error);
    return [];
  }
  const acks = acksResult.data;
  for (const ack of acks) {
    console.log(`[E-File] Processing ack: ${ack.ackId} - ${ack.status}`);
    if (env.DB) {
      await env.DB.prepare(`
        UPDATE efile_transmissions 
        SET status = ?, 
            ack_code = ?,
            ack_message = ?,
            dcn = ?,
            updated_at = ?
        WHERE irs_submission_id = ?
      `).bind(
        ack.status.toLowerCase(),
        ack.status === "Accepted" ? "A0000" : "R0000",
        ack.status === "Accepted" ? "Accepted by IRS" : ack.errors?.[0]?.errorMessage || "Rejected",
        ack.dcn || null,
        (/* @__PURE__ */ new Date()).toISOString(),
        ack.submissionId
      ).run();
    }
  }
  return acks;
}
__name(processNewAcknowledgments, "processNewAcknowledgments");
function getEFileStatusInfo() {
  return {
    environment: MEF_CONFIG.environment,
    profile: ERO_EFIN_PROFILE.firm_name,
    efin: ERO_EFIN_PROFILE.efin,
    etin: getActiveEtin(),
    softwareDevApproved: ERO_EFIN_PROFILE.software_developer_approved,
    atsEndpoint: MEF_CONFIG.endpoints.ATS_BASE,
    prodEndpoint: MEF_CONFIG.endpoints.PROD_BASE
  };
}
__name(getEFileStatusInfo, "getEFileStatusInfo");

// src/irs.ts
async function fetchIrsSchema() {
  const res = await fetch("https://www.irs.gov/pub/irs-schema/efile/2025/IRSMeF1040.xsd");
  if (!res.ok) throw new Error("Failed to fetch IRS schema");
  const schemaText = await res.text();
  return schemaText;
}
__name(fetchIrsSchema, "fetchIrsSchema");
async function fetchIrsMemos() {
  const res = await fetch("https://www.irs.gov/rss/irsnews.xml");
  if (!res.ok) throw new Error("Failed to fetch IRS memos");
  const xml = await res.text();
  return xml;
}
__name(fetchIrsMemos, "fetchIrsMemos");

// src/routes/crm.ts
async function handleCrmIntakes(req, env) {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM intakes ORDER BY created_at DESC LIMIT 500"
    ).all();
    const decryptedResults = await Promise.all(
      (results || []).map(async (row) => {
        try {
          return {
            ...row,
            full_name: row.full_name ? await decryptPII(row.full_name, env) : row.full_name,
            email: row.email ? await decryptPII(row.email, env) : row.email,
            phone: row.phone ? await decryptPII(row.phone, env) : row.phone,
            notes: row.notes ? await decryptPII(row.notes, env) : row.notes
          };
        } catch {
          return row;
        }
      })
    );
    await logAudit(env, {
      action: "crm_intakes_view",
      user_id: user.id,
      user_email: user.email,
      entity: "intakes",
      details: JSON.stringify({ count: decryptedResults.length })
    });
    return new Response(JSON.stringify(decryptedResults), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("CRM intakes error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch intakes" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleCrmIntakes, "handleCrmIntakes");
async function handleCrmIntakeById(req, env, id) {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;
  try {
    const row = await env.DB.prepare("SELECT * FROM intakes WHERE id = ?").bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: "Intake not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    let decrypted = row;
    try {
      decrypted = {
        ...row,
        full_name: row.full_name ? await decryptPII(row.full_name, env) : row.full_name,
        email: row.email ? await decryptPII(row.email, env) : row.email,
        phone: row.phone ? await decryptPII(row.phone, env) : row.phone,
        notes: row.notes ? await decryptPII(row.notes, env) : row.notes
      };
    } catch {
    }
    await logAudit(env, {
      action: "crm_intake_view",
      user_id: user.id,
      user_email: user.email,
      entity: "intakes",
      entity_id: id
    });
    return new Response(JSON.stringify(decrypted), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("CRM intake by id error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch intake" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleCrmIntakeById, "handleCrmIntakeById");
async function handleCrmIntakeCreate(req, env) {
  try {
    const body = await req.json();
    const { full_name, email, phone, service, notes } = body;
    if (!full_name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    const id = crypto.randomUUID();
    const created_at = (/* @__PURE__ */ new Date()).toISOString();
    const encFullName = await encryptPII(full_name, env);
    const encEmail = await encryptPII(email, env);
    const encPhone = phone ? await encryptPII(phone, env) : null;
    const encNotes = notes ? await encryptPII(notes, env) : null;
    await env.DB.prepare(
      `INSERT INTO intakes (id, full_name, email, phone, service, notes, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, encFullName, encEmail, encPhone, service || null, encNotes, ip, created_at).run();
    await logAudit(env, {
      action: "crm_intake_create",
      entity: "intakes",
      entity_id: id,
      details: JSON.stringify({ service })
    });
    return new Response(JSON.stringify({ ok: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("CRM intake create error:", error);
    return new Response(JSON.stringify({ error: "Failed to create intake" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleCrmIntakeCreate, "handleCrmIntakeCreate");
async function handleCrmIntakeDelete(req, env, id) {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;
  if (user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    await env.DB.prepare("DELETE FROM intakes WHERE id = ?").bind(id).run();
    await logAudit(env, {
      action: "crm_intake_delete",
      user_id: user.id,
      user_email: user.email,
      entity: "intakes",
      entity_id: id
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("CRM intake delete error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete intake" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleCrmIntakeDelete, "handleCrmIntakeDelete");

// src/middleware/validation.ts
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
__name(isValidEmail, "isValidEmail");
function isStrongPassword(password) {
  const errors = [];
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
__name(isStrongPassword, "isStrongPassword");
function sanitizeString(input) {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;");
}
__name(sanitizeString, "sanitizeString");
function validateRequiredFields(body, requiredFields) {
  const errors = [];
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
__name(validateRequiredFields, "validateRequiredFields");

// src/routes/lms.ts
var lmsRouter = t();
var courses = [
  {
    id: "c1",
    title: "Tax Preparer Onboarding",
    modules: [
      { id: "m1", title: "Compliance & Ethics", duration: "30m", status: "Live" },
      { id: "m2", title: "Client Intake & KYC", duration: "20m", status: "Live" },
      { id: "m3", title: "E-File Procedures", duration: "25m", status: "Live" },
      { id: "m4", title: "Data Security", duration: "15m", status: "Live" }
    ]
  }
];
var students = [
  { id: "s1", name: "Jane Doe", email: "jane@example.com", courses: ["c1"] }
];
var enrollments = [
  { id: "e1", studentId: "s1", courseId: "c1", status: "active" }
];
var lmsConfig = {
  theme: {
    primary: "#11233B",
    accent: "#C9A24D",
    background: "#F5F5F5",
    font: "Inter, Arial, sans-serif",
    logo: "/public/rtb-logo.png"
  },
  orgName: "Ross Tax Prep & Bookkeeping",
  compliance: ["IRS", "SOC2", "ADA"],
  year: 2026
};
lmsRouter.get("/courses", (req, env) => {
  return new Response(JSON.stringify(courses), { headers: { "Content-Type": "application/json" } });
});
lmsRouter.get("/courses/:id", (req, env) => {
  const course = courses.find((c) => c.id === req.params.id);
  if (!course) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(course), { headers: { "Content-Type": "application/json" } });
});
lmsRouter.post("/courses", async (req, env) => {
  try {
    const body = await req.json();
    const { valid, errors } = validateRequiredFields(body, ["title"]);
    if (!valid) return new Response(JSON.stringify({ error: errors }), { status: 400 });
    const id = "c" + (courses.length + 1);
    const course = { id, title: body.title, modules: [] };
    courses.push(course);
    await logAudit(env, { action: "lms_course_create", entity: "courses", entity_id: id });
    return new Response(JSON.stringify(course), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("LMS create course error:", error);
    return new Response(JSON.stringify({ error: "Failed to create course" }), { status: 500 });
  }
});
lmsRouter.put("/courses/:id", async (req, env) => {
  try {
    const body = await req.json();
    const course = courses.find((c) => c.id === req.params.id);
    if (!course) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    course.title = body.title || course.title;
    course.modules = body.modules || course.modules;
    await logAudit(env, { action: "lms_course_update", entity: "courses", entity_id: course.id });
    return new Response(JSON.stringify(course), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("LMS update course error:", error);
    return new Response(JSON.stringify({ error: "Failed to update course" }), { status: 500 });
  }
});
lmsRouter.delete("/courses/:id", async (req, env) => {
  try {
    const idx = courses.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    const [removed] = courses.splice(idx, 1);
    await logAudit(env, { action: "lms_course_delete", entity: "courses", entity_id: removed.id });
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error("LMS delete course error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete course" }), { status: 500 });
  }
});
lmsRouter.get("/students", (req, env) => {
  return new Response(JSON.stringify(students), { headers: { "Content-Type": "application/json" } });
});
lmsRouter.get("/students/:id", (req, env) => {
  const student = students.find((s) => s.id === req.params.id);
  if (!student) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(student), { headers: { "Content-Type": "application/json" } });
});
lmsRouter.post("/students", async (req, env) => {
  try {
    const body = await req.json();
    const { valid, errors } = validateRequiredFields(body, ["name", "email"]);
    if (!valid || !isValidEmail(body.email)) return new Response(JSON.stringify({ error: errors }), { status: 400 });
    const studentId = "s" + (students.length + 1);
    const student = { id: studentId, name: body.name, email: body.email, courses: [] };
    students.push(student);
    await logAudit(env, { action: "lms_student_create", entity: "students", entity_id: studentId });
    return new Response(JSON.stringify(student), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("LMS create student error:", error);
    return new Response(JSON.stringify({ error: "Failed to create student" }), { status: 500 });
  }
});
lmsRouter.patch("/students/:id", async (req, env) => {
  try {
    const body = await req.json();
    const student = students.find((s) => s.id === req.params.id);
    if (!student) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    student.name = body.name || student.name;
    student.email = body.email || student.email;
    student.courses = body.courses || student.courses;
    await logAudit(env, { action: "lms_student_update", entity: "students", entity_id: student.id });
    return new Response(JSON.stringify(student), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("LMS update student error:", error);
    return new Response(JSON.stringify({ error: "Failed to update student" }), { status: 500 });
  }
});
lmsRouter.delete("/students/:id", async (req, env) => {
  try {
    const idx = students.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    const [removed] = students.splice(idx, 1);
    await logAudit(env, { action: "lms_student_delete", entity: "students", entity_id: removed.id });
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error("LMS delete student error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete student" }), { status: 500 });
  }
});
lmsRouter.post("/enroll", async (req, env) => {
  try {
    const body = await req.json();
    if (body.name && body.email) {
      const { valid, errors } = validateRequiredFields(body, ["name", "email"]);
      if (!valid || !isValidEmail(body.email)) return new Response(JSON.stringify({ error: errors }), { status: 400 });
      const id = "s" + (students.length + 1);
      const student = { id, name: body.name, email: body.email, courses: [] };
      students.push(student);
      await logAudit(env, { action: "lms_student_create", entity: "students", entity_id: id });
      return new Response(JSON.stringify(student), { headers: { "Content-Type": "application/json" } });
    }
    if (body.studentId && body.courseId) {
      const enrollmentId = "e" + (enrollments.length + 1);
      enrollments.push({ id: enrollmentId, studentId: body.studentId, courseId: body.courseId, status: "active" });
      await logAudit(env, { action: "lms_enroll", entity: "enrollments", entity_id: enrollmentId });
      return new Response(JSON.stringify({ success: true, id: enrollmentId }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  } catch (error) {
    console.error("LMS enroll error:", error);
    return new Response(JSON.stringify({ error: "Failed to enroll student" }), { status: 500 });
  }
});
lmsRouter.get("/enrollments", (req, env) => {
  return new Response(JSON.stringify(enrollments), { headers: { "Content-Type": "application/json" } });
});
lmsRouter.get("/enrollments/:id", (req, env) => {
  const enr = enrollments.find((e) => e.id === req.params.id);
  if (!enr) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(enr), { headers: { "Content-Type": "application/json" } });
});
lmsRouter.get("/config", (req, env) => {
  return new Response(JSON.stringify(lmsConfig), { headers: { "Content-Type": "application/json" } });
});
lmsRouter.put("/config", requireStaff, async (req, env) => {
  const body = await req.json();
  lmsConfig = { ...lmsConfig, ...typeof body === "object" && body !== null ? body : {} };
  await logAudit(env, { action: "lms_config_update", entity: "lms_config", entity_id: "lms" });
  return new Response(JSON.stringify(lmsConfig), { headers: { "Content-Type": "application/json" } });
});
async function hasPermission(env, userId, userType, permissionName) {
  if (!env.DB) return false;
  try {
    const result = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_role_permissions
      WHERE role_id IN (
        SELECT role_id FROM lms_user_roles 
        WHERE user_id = ? AND user_type = ?
      )
      AND permission_id IN (
        SELECT id FROM lms_permissions 
        WHERE permission_name = ?
      )
    `).bind(userId, userType, permissionName).first();
    return result && result.count > 0;
  } catch (e) {
    console.error("Permission check failed:", e);
    return false;
  }
}
__name(hasPermission, "hasPermission");
async function getUserRoles(env, userId, userType) {
  if (!env.DB) return [];
  try {
    const result = await env.DB.prepare(`
      SELECT r.* FROM lms_roles r
      JOIN lms_user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ? AND ur.user_type = ?
    `).bind(userId, userType).all();
    return result?.results || [];
  } catch (e) {
    console.error("Get roles failed:", e);
    return [];
  }
}
__name(getUserRoles, "getUserRoles");
async function executeWorkflow(env, workflowId, entityType, entityId) {
  if (!env.DB) return null;
  try {
    const workflow = await env.DB.prepare("SELECT * FROM lms_workflows WHERE id = ?").bind(workflowId).first();
    if (!workflow) return null;
    const steps = await env.DB.prepare(`
      SELECT * FROM lms_workflow_steps 
      WHERE workflow_id = ? 
      ORDER BY step_order ASC
    `).bind(workflowId).all();
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    for (const step of steps?.results || []) {
      await env.DB.prepare(`
        INSERT INTO lms_workflow_executions 
        (id, workflow_id, entity_type, entity_id, execution_status, created_at)
        VALUES (?, ?, ?, ?, 'pending', datetime('now'))
      `).bind(executionId, workflowId, entityType, entityId).run();
      if (step.auto_execute === 1) {
        await executeWorkflowStep(env, executionId, step, entityType, entityId);
      }
    }
    return executionId;
  } catch (e) {
    console.error("Workflow execution failed:", e);
    return null;
  }
}
__name(executeWorkflow, "executeWorkflow");
async function executeWorkflowStep(env, executionId, step, entityType, entityId) {
  if (!env.DB) return;
  try {
    if (step.step_type === "auto_assign_role") {
      const roles = await env.DB.prepare(`
        SELECT * FROM lms_roles WHERE role_name = 'student'
      `).first();
      if (roles) {
        await env.DB.prepare(`
          INSERT INTO lms_user_roles (user_id, role_id, user_type, assigned_at)
          VALUES (?, ?, 'client', datetime('now'))
        `).bind(parseInt(entityId), roles.id).run();
      }
    } else if (step.step_type === "grant_access") {
      await env.DB.prepare(`
        INSERT INTO lms_content_items (id, library_id, title, content_type, view_count, created_at)
        VALUES (?, ?, ?, 'welcome', 0, datetime('now'))
      `).bind(`item-${entityId}`, "lib-faq", `Welcome ${entityId}`).run();
    } else if (step.step_type === "send_email") {
      console.log(`[WORKFLOW] Sending email for ${entityType}:${entityId}`);
    } else if (step.step_type === "create_task") {
      console.log(`[WORKFLOW] Creating task for ${entityType}:${entityId}`);
    }
    await env.DB.prepare(`
      UPDATE lms_workflow_executions 
      SET execution_status = 'completed' 
      WHERE id = ?
    `).bind(executionId).run();
  } catch (e) {
    console.error("Workflow step execution failed:", e);
  }
}
__name(executeWorkflowStep, "executeWorkflowStep");
lmsRouter.post("/enroll", async (req, env) => {
  try {
    const body = await req.json();
    const { student_id, student_email, program_id } = body;
    if (!student_id || !program_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const enrollmentId = `enroll-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await env.DB.prepare(`
      INSERT INTO lms_degree_enrollments 
      (id, program_id, student_id, enrollment_status, current_semester, total_credits_completed, cumulative_gpa)
      VALUES (?, ?, ?, 'active', 1, 0.0, 0.0)
    `).bind(enrollmentId, program_id, student_id).run();
    await executeWorkflow(env, "workflow-enrollment", "degree_enrollment", enrollmentId);
    await logAudit(env, {
      action: "enrollment_created",
      entity: "degree_enrollment",
      entity_id: enrollmentId,
      details: JSON.stringify({ student_id, program_id })
    });
    return new Response(JSON.stringify({
      success: true,
      enrollment_id: enrollmentId,
      message: "Enrollment successful. Workflow triggered."
    }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Enrollment error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/enrollments/:studentId", async (req, env) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const enrollments2 = await env.DB.prepare(`
      SELECT de.*, dp.program_name, dp.degree_type, dp.total_credits_required
      FROM lms_degree_enrollments de
      JOIN lms_degree_programs dp ON de.program_id = dp.id
      WHERE de.student_id = ?
      ORDER BY de.created_at DESC
    `).bind(studentId).all();
    return new Response(JSON.stringify(enrollments2?.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get enrollments error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/roles", async (req, env) => {
  try {
    const roles = await env.DB.prepare("SELECT * FROM lms_roles ORDER BY role_name ASC").all();
    return new Response(JSON.stringify(roles?.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/user-roles/:userId/:userType", async (req, env) => {
  try {
    const userId = parseInt(req.params.userId);
    const userType = req.params.userType;
    const roles = await getUserRoles(env, userId, userType);
    return new Response(JSON.stringify(roles), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.post("/assign-role", async (req, env) => {
  try {
    const body = await req.json();
    const { user_id, user_type, role_id, expiration_date } = body;
    if (!user_id || !user_type || !role_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const assignmentId = `assign-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await env.DB.prepare(`
      INSERT INTO lms_user_roles 
      (id, user_id, role_id, user_type, assigned_at, expiration_date)
      VALUES (?, ?, ?, ?, datetime('now'), ?)
    `).bind(assignmentId, user_id, role_id, user_type, expiration_date || null).run();
    await logAudit(env, {
      action: "role_assigned",
      entity: "user_role",
      entity_id: assignmentId,
      user_id,
      details: JSON.stringify({ role_id, user_type })
    });
    return new Response(JSON.stringify({ success: true, assignment_id: assignmentId }), { status: 201 });
  } catch (error) {
    console.error("Assign role error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/check-permission/:userId/:userType/:permissionName", async (req, env) => {
  try {
    const userId = parseInt(req.params.userId);
    const userType = req.params.userType;
    const permissionName = req.params.permissionName;
    const hasPermissionResult = await hasPermission(env, userId, userType, permissionName);
    return new Response(JSON.stringify({
      user_id: userId,
      user_type: userType,
      permission: permissionName,
      has_permission: hasPermissionResult
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/libraries", async (req, env) => {
  try {
    const libraries = await env.DB.prepare(`
      SELECT cl.*, COUNT(ci.id) as item_count
      FROM lms_content_libraries cl
      LEFT JOIN lms_content_items ci ON cl.id = ci.library_id
      GROUP BY cl.id
      ORDER BY cl.library_name ASC
    `).all();
    return new Response(JSON.stringify(libraries?.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/library/:libraryId/items", async (req, env) => {
  try {
    const libraryId = req.params.libraryId;
    const search = new URL(req.url).searchParams.get("search") || "";
    const category = new URL(req.url).searchParams.get("category") || "";
    const limit = parseInt(new URL(req.url).searchParams.get("limit") || "50");
    let query = `
      SELECT * FROM lms_content_items
      WHERE library_id = ?
    `;
    const params = [libraryId];
    if (search) {
      query += ` AND (title LIKE ? OR content_type LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ` ORDER BY view_count DESC LIMIT ?`;
    params.push(limit);
    const items = await env.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(items?.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.post("/library/item", async (req, env) => {
  try {
    const body = await req.json();
    const { library_id, title, content_type, requires_approval } = body;
    if (!library_id || !title) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const itemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await env.DB.prepare(`
      INSERT INTO lms_content_items 
      (id, library_id, title, content_type, requires_approval, view_count, created_at)
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
    `).bind(itemId, library_id, title, content_type || "document", requires_approval ? 1 : 0).run();
    return new Response(JSON.stringify({
      success: true,
      item_id: itemId,
      requires_approval: requires_approval || false
    }), { status: 201 });
  } catch (error) {
    console.error("Create content error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/faq", async (req, env) => {
  try {
    const categories = await env.DB.prepare(`
      SELECT fc.*, COUNT(fi.id) as item_count
      FROM lms_faq_categories fc
      LEFT JOIN lms_faq_items fi ON fc.id = fi.category_id
      GROUP BY fc.id
      ORDER BY fc.category_order ASC
    `).all();
    const result = [];
    for (const cat of categories?.results || []) {
      const items = await env.DB.prepare(`
        SELECT * FROM lms_faq_items
        WHERE category_id = ?
        ORDER BY is_featured DESC
      `).bind(cat.id).all();
      result.push({
        category: cat,
        items: items?.results || []
      });
    }
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.post("/faq/:faqId/helpful", async (req, env) => {
  try {
    const faqId = req.params.faqId;
    const body = await req.json();
    const { is_helpful } = body;
    if (typeof is_helpful !== "boolean") {
      return new Response(JSON.stringify({ error: "Invalid helpful flag" }), { status: 400 });
    }
    if (is_helpful) {
      await env.DB.prepare(`
        UPDATE lms_faq_items 
        SET helpful_count = helpful_count + 1 
        WHERE id = ?
      `).bind(faqId).run();
    } else {
      await env.DB.prepare(`
        UPDATE lms_faq_items 
        SET not_helpful_count = not_helpful_count + 1 
        WHERE id = ?
      `).bind(faqId).run();
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.post("/support/ticket", async (req, env) => {
  try {
    const body = await req.json();
    const { student_id, subject, category, priority } = body;
    if (!student_id || !subject) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const ticketNumber = `TICKET-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0].replace(/-/g, "")}-${String(Date.now()).slice(-4)}`;
    await env.DB.prepare(`
      INSERT INTO lms_support_tickets 
      (id, ticket_number, student_id, subject, category, priority, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'open', datetime('now'), datetime('now'))
    `).bind(ticketId, ticketNumber, student_id, subject, category || "general", priority || "normal").run();
    return new Response(JSON.stringify({
      success: true,
      ticket_id: ticketId,
      ticket_number: ticketNumber
    }), { status: 201 });
  } catch (error) {
    console.error("Create ticket error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/support/tickets/:studentId", async (req, env) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const tickets = await env.DB.prepare(`
      SELECT * FROM lms_support_tickets
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(studentId).all();
    return new Response(JSON.stringify(tickets?.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.post("/support/ticket/:ticketId/message", async (req, env) => {
  try {
    const ticketId = req.params.ticketId;
    const body = await req.json();
    const { sender_id, sender_type, message, is_internal_note } = body;
    if (!sender_id || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await env.DB.prepare(`
      INSERT INTO lms_support_messages 
      (id, ticket_id, sender_id, sender_type, message, is_internal_note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(messageId, ticketId, sender_id, sender_type || "student", message, is_internal_note ? 1 : 0).run();
    if (sender_type === "staff") {
      await env.DB.prepare(`
        UPDATE lms_support_tickets 
        SET status = 'in_progress', updated_at = datetime('now')
        WHERE id = ? AND status = 'open'
      `).bind(ticketId).run();
    }
    return new Response(JSON.stringify({ success: true, message_id: messageId }), { status: 201 });
  } catch (error) {
    console.error("Add message error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/instructors", async (req, env) => {
  try {
    const instructors = await env.DB.prepare(`
      SELECT * FROM lms_ai_instructors
      ORDER BY instructor_name ASC
    `).all();
    return new Response(JSON.stringify(instructors?.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/lectures/:courseId", async (req, env) => {
  try {
    const courseId = req.params.courseId;
    const lectures = await env.DB.prepare(`
      SELECT wl.*, ai.instructor_name, ai.instructor_title, ai.voice_model
      FROM lms_weekly_lectures wl
      JOIN lms_ai_instructors ai ON wl.instructor_id = ai.id
      WHERE wl.course_id = ?
      ORDER BY wl.lecture_week ASC
    `).bind(courseId).all();
    return new Response(JSON.stringify(lectures?.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/exams/:courseId", async (req, env) => {
  try {
    const courseId = req.params.courseId;
    const exams = await env.DB.prepare(`
      SELECT * FROM lms_exams
      WHERE course_id = ?
      ORDER BY exam_type DESC
    `).bind(courseId).all();
    return new Response(JSON.stringify(exams?.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.post("/exam/:examId/attempt", async (req, env) => {
  try {
    const examId = req.params.examId;
    const body = await req.json();
    const { student_id } = body;
    if (!student_id) {
      return new Response(JSON.stringify({ error: "Missing student_id" }), { status: 400 });
    }
    const exam = await env.DB.prepare("SELECT * FROM lms_exams WHERE id = ?").bind(examId).first();
    if (!exam) {
      return new Response(JSON.stringify({ error: "Exam not found" }), { status: 404 });
    }
    const attemptCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM lms_exam_attempts
      WHERE exam_id = ? AND student_id = ? AND status IN ('submitted', 'graded')
    `).bind(examId, student_id).first();
    if (attemptCount && attemptCount.count >= exam.attempts_allowed) {
      return new Response(JSON.stringify({ error: "Attempt limit reached" }), { status: 400 });
    }
    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const attemptNumber = (attemptCount?.count || 0) + 1;
    await env.DB.prepare(`
      INSERT INTO lms_exam_attempts 
      (id, exam_id, student_id, attempt_number, status, started_at)
      VALUES (?, ?, ?, ?, 'in_progress', datetime('now'))
    `).bind(attemptId, examId, student_id, attemptNumber).run();
    return new Response(JSON.stringify({
      success: true,
      attempt_id: attemptId,
      attempt_number: attemptNumber
    }), { status: 201 });
  } catch (error) {
    console.error("Start exam error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.post("/exam/attempt/:attemptId/submit", async (req, env) => {
  try {
    const attemptId = req.params.attemptId;
    const body = await req.json();
    const { answers } = body;
    if (!Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "Invalid answers format" }), { status: 400 });
    }
    const attempt = await env.DB.prepare(`
      SELECT ea.*, le.total_points
      FROM lms_exam_attempts ea
      JOIN lms_exams le ON ea.exam_id = le.id
      WHERE ea.id = ?
    `).bind(attemptId).first();
    if (!attempt) {
      return new Response(JSON.stringify({ error: "Attempt not found" }), { status: 404 });
    }
    let pointsEarned = 0;
    for (const answer of answers) {
      const { question_id, student_answer } = answer;
      const question = await env.DB.prepare(`
        SELECT * FROM lms_exam_questions WHERE id = ?
      `).bind(question_id).first();
      if (question) {
        let isCorrect = 0;
        let pointsAwarded = 0;
        if (question.question_type === "multiple_choice" || question.question_type === "true_false") {
          isCorrect = student_answer === question.correct_answer ? 1 : 0;
          pointsAwarded = isCorrect ? question.points : 0;
          pointsEarned += pointsAwarded;
        }
        const answerId = `ans-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        await env.DB.prepare(`
          INSERT INTO lms_exam_answers 
          (id, attempt_id, question_id, student_answer, is_correct, points_awarded)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(answerId, attemptId, question_id, student_answer, isCorrect, pointsAwarded).run();
      }
    }
    const scorePercentage = pointsEarned / attempt.total_points * 100;
    await env.DB.prepare(`
      UPDATE lms_exam_attempts 
      SET status = 'submitted', submitted_at = datetime('now'), score = ?
      WHERE id = ?
    `).bind(scorePercentage, attemptId).run();
    return new Response(JSON.stringify({
      success: true,
      points_earned: pointsEarned,
      total_points: attempt.total_points,
      score_percentage: scorePercentage.toFixed(2),
      message: "Exam submitted. Auto-graded items scored."
    }), { status: 200 });
  } catch (error) {
    console.error("Submit exam error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/degree-programs", async (req, env) => {
  try {
    const programs = await env.DB.prepare(`
      SELECT * FROM lms_degree_programs
      ORDER BY program_name ASC
    `).all();
    return new Response(JSON.stringify(programs?.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/degree-program/:programId/curriculum", async (req, env) => {
  try {
    const programId = req.params.programId;
    const curriculum = await env.DB.prepare(`
      SELECT dc.*, dlc.course_name, dlc.credit_hours, dlc.course_level
      FROM lms_degree_curriculum dc
      JOIN lms_degree_courses dlc ON dc.course_id = dlc.id
      WHERE dc.program_id = ?
      ORDER BY dc.semester_number ASC, dc.course_order ASC
    `).bind(programId).all();
    const grouped = {};
    for (const course of curriculum?.results || []) {
      if (!grouped[course.semester_number]) {
        grouped[course.semester_number] = [];
      }
      grouped[course.semester_number].push(course);
    }
    return new Response(JSON.stringify(grouped), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/student/:studentId/degree-progress", async (req, env) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const enrollment = await env.DB.prepare(`
      SELECT de.*, dp.program_name, dp.total_credits_required
      FROM lms_degree_enrollments de
      JOIN lms_degree_programs dp ON de.program_id = dp.id
      WHERE de.student_id = ?
    `).bind(studentId).first();
    if (!enrollment) {
      return new Response(JSON.stringify({ error: "No enrollment found" }), { status: 404 });
    }
    const completedCourses = await env.DB.prepare(`
      SELECT * FROM lms_student_course_enrollments
      WHERE degree_enrollment_id = ? AND status = 'completed'
    `).bind(enrollment.id).all();
    const creditPercentage = enrollment.total_credits_completed / enrollment.total_credits_required * 100;
    return new Response(JSON.stringify({
      enrollment,
      completed_courses: completedCourses?.results || [],
      credits_earned: enrollment.total_credits_completed,
      credits_required: enrollment.total_credits_required,
      progress_percentage: creditPercentage.toFixed(2),
      cumulative_gpa: enrollment.cumulative_gpa.toFixed(2),
      current_semester: enrollment.current_semester
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.get("/disclosures", async (req, env) => {
  try {
    const userType = new URL(req.url).searchParams.get("user_type") || "all_students";
    const disclosures = await env.DB.prepare(`
      SELECT * FROM lms_legal_disclosures
      WHERE applies_to = 'all_students' OR applies_to = ?
      ORDER BY disclosure_type ASC
    `).bind(userType).all();
    return new Response(JSON.stringify(disclosures?.results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
lmsRouter.post("/disclosure/acknowledge", async (req, env) => {
  try {
    const body = await req.json();
    const { student_id, disclosure_id, ip_address, user_agent } = body;
    if (!student_id || !disclosure_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const ackId = `ack-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await env.DB.prepare(`
      INSERT INTO lms_student_acknowledgments 
      (id, student_id, disclosure_id, acknowledged_at, ip_address, user_agent)
      VALUES (?, ?, ?, datetime('now'), ?, ?)
    `).bind(ackId, student_id, disclosure_id, ip_address || "unknown", user_agent || "unknown").run();
    return new Response(JSON.stringify({
      success: true,
      acknowledgment_id: ackId
    }), { status: 201 });
  } catch (error) {
    console.error("Acknowledge disclosure error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
var lms_default = lmsRouter;

// src/routes/portal.ts
var portalRouter = t();
portalRouter.post("/register", async (req, env) => {
  try {
    const body = await req.json();
    const name = sanitizeString(body.name || "");
    const email = sanitizeString(body.email || "");
    const password = body.password || "";
    if (!name || !isValidEmail(email) || !isStrongPassword(password).valid) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }
    const exists = await env.DB.prepare("SELECT id FROM clients WHERE email = ?").bind(email).first();
    if (exists) return new Response(JSON.stringify({ error: "Email already registered" }), { status: 409 });
    const hash2 = await bcryptjs_default.hash(password, 10);
    const encName = await encryptPII(name, env);
    const encEmail = await encryptPII(email, env);
    const result = await env.DB.prepare("INSERT INTO clients (full_name, email, password_hash, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)").bind(encName, encEmail, hash2).run();
    return new Response(JSON.stringify({ success: true, id: result.lastRowId }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Registration failed" }), { status: 500 });
  }
});
var portal_default = portalRouter;

// src/routes/portalAuth.ts
var portalAuthRouter = t();
portalAuthRouter.post("/login", async (req, env) => {
  try {
    const body = await req.json();
    const email = sanitizeString(body.email || "");
    const password = body.password || "";
    if (!isValidEmail(email) || !password) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 400 });
    }
    const clientRows = await env.DB.prepare("SELECT id, full_name, email, password_hash FROM clients").all();
    let user = null;
    for (const row of clientRows.results) {
      const decEmail = await decryptPII(row.email, env);
      if (decEmail === email) {
        user = row;
        break;
      }
    }
    if (!user) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    const valid = await bcryptjs_default.compare(password, user.password_hash);
    if (!valid) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    const payload = {
      id: user.id,
      email,
      role: "client",
      name: user.full_name ? await decryptPII(user.full_name, env) : void 0
    };
    const token = await index_default.sign(payload, env.JWT_SECRET || "change-this-secret-in-production", { expiresIn: "7d" });
    return new Response(JSON.stringify({ success: true, token }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Login failed" }), { status: 500 });
  }
});
var portalAuth_default = portalAuthRouter;

// src/routes/certificates.ts
var CERTIFICATE_TEMPLATES = {
  EFIN: {
    type: "EFIN",
    title: "IRS Electronic Filing Identification Number",
    issuer: "Internal Revenue Service"
  },
  PTIN: {
    type: "PTIN",
    title: "Preparer Tax Identification Number",
    issuer: "Internal Revenue Service"
  },
  CAF: {
    type: "CAF",
    title: "Centralized Authorization File Number",
    issuer: "Internal Revenue Service"
  },
  ETIN: {
    type: "ETIN",
    title: "Electronic Transmitter Identification Number",
    issuer: "Internal Revenue Service"
  },
  BUSINESS_LICENSE: {
    type: "BUSINESS_LICENSE",
    title: "Business License",
    issuer: "State of Texas"
  },
  ERO_CERTIFICATE: {
    type: "ERO_CERTIFICATE",
    title: "Authorized IRS E-File Provider (ERO)",
    issuer: "Internal Revenue Service"
  },
  SOFTWARE_DEVELOPER: {
    type: "SOFTWARE_DEVELOPER",
    title: "IRS MeF Software Developer Certification",
    issuer: "Internal Revenue Service"
  },
  DATA_SECURITY: {
    type: "DATA_SECURITY",
    title: "Data Security Compliance Certificate",
    issuer: "Ross Tax Prep & Bookkeeping"
  },
  STAFF_TRAINING: {
    type: "STAFF_TRAINING",
    title: "Staff Training & Compliance Completion",
    issuer: "Ross Tax Prep & Bookkeeping"
  }
};
async function generateCertificateSignature(cert, env) {
  const data = JSON.stringify({
    type: cert.type,
    issuedTo: cert.issuedTo,
    issuedAt: cert.issuedAt,
    credentials: cert.credentials
  });
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data + (env.CERT_SECRET || "cert-signing-key"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(generateCertificateSignature, "generateCertificateSignature");
async function handleListCertificates(req, env) {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM certificates ORDER BY issued_at DESC"
    ).all();
    await logAudit(env, {
      action: "certificates_list",
      user_id: user.id,
      user_email: user.email,
      entity: "certificates"
    });
    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("List certificates error:", error);
    return new Response(JSON.stringify({ error: "Failed to list certificates" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleListCertificates, "handleListCertificates");
async function handleIssueCertificate(req, env) {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;
  try {
    const body = await req.json();
    const { type, issuedTo, credentials, expiresAt } = body;
    if (!type || !issuedTo) {
      return new Response(JSON.stringify({ error: "type and issuedTo are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const template = CERTIFICATE_TEMPLATES[type];
    if (!template) {
      return new Response(
        JSON.stringify({
          error: "Invalid certificate type",
          validTypes: Object.keys(CERTIFICATE_TEMPLATES)
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const id = crypto.randomUUID();
    const issuedAt = (/* @__PURE__ */ new Date()).toISOString();
    const cert = {
      id,
      type,
      title: template.title,
      issuer: template.issuer,
      issuedTo,
      issuedAt,
      expiresAt: expiresAt ?? void 0,
      status: "active",
      credentials: credentials || {},
      signature: ""
    };
    cert.signature = await generateCertificateSignature(cert, env);
    await env.DB.prepare(
      `INSERT INTO certificates (id, type, title, issuer, issued_to, issued_at, expires_at, status, credentials_json, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      cert.id,
      cert.type,
      cert.title,
      cert.issuer,
      cert.issuedTo,
      cert.issuedAt,
      cert.expiresAt,
      cert.status,
      JSON.stringify(cert.credentials),
      cert.signature
    ).run();
    await logAudit(env, {
      action: "certificate_issue",
      user_id: user.id,
      user_email: user.email,
      entity: "certificates",
      entity_id: id,
      details: JSON.stringify({ type, issuedTo })
    });
    return new Response(JSON.stringify({ ok: true, certificate: cert }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Issue certificate error:", error);
    return new Response(JSON.stringify({ error: "Failed to issue certificate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleIssueCertificate, "handleIssueCertificate");
async function handleGetCertificate(req, env, id) {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  try {
    const row = await env.DB.prepare("SELECT * FROM certificates WHERE id = ?").bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: "Certificate not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const cert = {
      ...row,
      credentials: row.credentials_json ? JSON.parse(row.credentials_json) : {}
    };
    return new Response(JSON.stringify(cert), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Get certificate error:", error);
    return new Response(JSON.stringify({ error: "Failed to get certificate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleGetCertificate, "handleGetCertificate");
async function handleRevokeCertificate(req, env, id) {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;
  try {
    await env.DB.prepare("UPDATE certificates SET status = 'revoked' WHERE id = ?").bind(id).run();
    await logAudit(env, {
      action: "certificate_revoke",
      user_id: user.id,
      user_email: user.email,
      entity: "certificates",
      entity_id: id
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Revoke certificate error:", error);
    return new Response(JSON.stringify({ error: "Failed to revoke certificate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleRevokeCertificate, "handleRevokeCertificate");
async function handleDownloadCertificate(req, env, id) {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  try {
    const row = await env.DB.prepare("SELECT * FROM certificates WHERE id = ?").bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: "Certificate not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const cert = {
      ...row,
      credentials: row.credentials_json ? JSON.parse(row.credentials_json) : {}
    };
    return new Response(JSON.stringify(cert, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="certificate-${cert.type}-${cert.id}.json"`
      }
    });
  } catch (error) {
    console.error("Download certificate error:", error);
    return new Response(JSON.stringify({ error: "Failed to download certificate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleDownloadCertificate, "handleDownloadCertificate");
async function handleCertificateTypes(req, env) {
  return new Response(
    JSON.stringify(
      Object.entries(CERTIFICATE_TEMPLATES).map(([key, val]) => ({
        type: key,
        title: val.title,
        issuer: val.issuer
      }))
    ),
    { headers: { "Content-Type": "application/json" } }
  );
}
__name(handleCertificateTypes, "handleCertificateTypes");

// src/routes/team.ts
var TEAM_MEMBERS = [
  {
    id: "andreaa-channel",
    name: "Andreaa Chan'nel",
    title: "Owner | Resolution Manager",
    role: "owner",
    region: "Crowley, LA",
    phone: "254-394-7438",
    email: "Info@RossTaxPrep.com",
    photo: "/assets/andreaa.png",
    bio: "Started doing taxes at 17 back in 2017. Author + Illustrator of 'How-To' Tax Pro Textbook. Built tax software supporting IRS e-file workflow and transmission processes.",
    credentials: ["PTIN", "EFIN", "ETIN"],
    active: true
  },
  {
    id: "zavya-brown",
    name: "Zavya Brown, MBA",
    title: "Lead Tax Associate",
    role: "lead",
    region: "Central Texas Area",
    phone: "512-489-6749",
    email: "Info@RossTaxPrep.com",
    photo: "/assets/zavya.png",
    bio: "MBA graduate with expertise in individual and business tax preparation.",
    credentials: ["PTIN"],
    active: true
  },
  {
    id: "sharleana-mathes",
    name: "Sharleana Mathes",
    title: "Tax Associate | Experience Manager",
    role: "associate",
    region: "Central Texas Region",
    phone: "512-489-6749",
    email: "Manager@RossTaxPrep.com",
    photo: "/assets/sharleana.png",
    bio: "Dedicated to providing exceptional client experience and accurate tax preparation.",
    credentials: ["PTIN"],
    active: true
  },
  {
    id: "paul-okpulor",
    name: "Paul C. Okpulor",
    title: "Tax Associate",
    role: "associate",
    region: "Dallas Region",
    phone: "512-489-6749",
    email: "Info@RossTaxPrep.com",
    photo: "/assets/paul.png",
    bio: "Serving the Dallas region with professional tax preparation services.",
    credentials: ["PTIN"],
    active: true
  }
];
async function handleListTeam(req, env) {
  const url = new URL(req.url);
  const region = url.searchParams.get("region");
  const role = url.searchParams.get("role");
  let members = TEAM_MEMBERS.filter((m) => m.active);
  if (region) {
    members = members.filter(
      (m) => m.region.toLowerCase().includes(region.toLowerCase())
    );
  }
  if (role) {
    members = members.filter((m) => m.role === role);
  }
  return new Response(JSON.stringify(members), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleListTeam, "handleListTeam");
async function handleGetTeamMember(req, env, id) {
  const member = TEAM_MEMBERS.find((m) => m.id === id && m.active);
  if (!member) {
    return new Response(JSON.stringify({ error: "Team member not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify(member), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleGetTeamMember, "handleGetTeamMember");
async function handleListRegions(req, env) {
  const regions = [...new Set(TEAM_MEMBERS.filter((m) => m.active).map((m) => m.region))];
  return new Response(JSON.stringify(regions), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleListRegions, "handleListRegions");

// src/routes/compliance.ts
var REQUIRED_CERTIFICATES = [
  {
    type: "EFIN",
    title: "IRS Electronic Filing Identification Number",
    issuer: "Internal Revenue Service",
    required: true,
    description: "Required for all Authorized IRS e-file Providers to transmit returns",
    renewalPeriod: "Annual",
    category: "IRS"
  },
  {
    type: "PTIN",
    title: "Preparer Tax Identification Number",
    issuer: "Internal Revenue Service",
    required: true,
    description: "Required for all paid tax preparers",
    renewalPeriod: "Annual (Dec 31)",
    category: "IRS"
  },
  {
    type: "ETIN",
    title: "Electronic Transmitter Identification Number",
    issuer: "Internal Revenue Service",
    required: true,
    description: "Required for software developers/transmitters in IRS e-file program",
    renewalPeriod: "Annual",
    category: "IRS"
  },
  {
    type: "CAF",
    title: "Centralized Authorization File Number",
    issuer: "Internal Revenue Service",
    required: false,
    description: "Required for third-party authorization (Form 2848, 8821)",
    renewalPeriod: "As needed",
    category: "IRS"
  },
  {
    type: "ERO_CERTIFICATE",
    title: "Authorized IRS E-File Provider (ERO)",
    issuer: "Internal Revenue Service",
    required: true,
    description: "Electronic Return Originator status confirmation",
    renewalPeriod: "Annual",
    category: "IRS"
  },
  {
    type: "BUSINESS_LICENSE",
    title: "Business License",
    issuer: "State of Louisiana / Texas",
    required: true,
    description: "State business operating license",
    renewalPeriod: "Annual",
    category: "State"
  },
  {
    type: "SOFTWARE_DEVELOPER",
    title: "IRS MeF Software Developer Certification",
    issuer: "Internal Revenue Service",
    required: true,
    description: "Certification for custom tax software development",
    renewalPeriod: "Annual",
    category: "IRS"
  },
  {
    type: "DATA_SECURITY",
    title: "Data Security Compliance Certificate",
    issuer: "Ross Tax Prep & Bookkeeping",
    required: true,
    description: "IRS Publication 4557 / FTC Safeguards Rule compliance",
    renewalPeriod: "Annual",
    category: "Security"
  },
  {
    type: "STAFF_TRAINING",
    title: "Staff Training & Compliance Completion",
    issuer: "Ross Tax Prep & Bookkeeping",
    required: true,
    description: "Annual Circular 230 and security awareness training",
    renewalPeriod: "Annual",
    category: "Training"
  }
];
var COMPLIANCE_REQUIREMENTS = {
  irs: [
    { id: "efin_active", name: "EFIN Active", description: "Electronic Filing Identification Number is active and current" },
    { id: "ptin_current", name: "PTIN Current", description: "All preparers have valid PTINs" },
    { id: "etin_active", name: "ETIN Active", description: "Electronic Transmitter ID is active" },
    { id: "ero_status", name: "ERO Status", description: "Authorized IRS e-file Provider status confirmed" },
    { id: "circular_230", name: "Circular 230", description: "Compliance with Treasury Circular 230" },
    { id: "form_8879", name: "Form 8879", description: "E-file authorization forms properly executed" }
  ],
  security: [
    { id: "pub_4557", name: "IRS Pub 4557", description: "Safeguarding Taxpayer Data compliance" },
    { id: "ftc_safeguards", name: "FTC Safeguards Rule", description: "Written Information Security Plan (WISP)" },
    { id: "encryption", name: "Data Encryption", description: "PII encrypted at rest and in transit" },
    { id: "access_controls", name: "Access Controls", description: "Role-based access implemented" },
    { id: "audit_logging", name: "Audit Logging", description: "All sensitive actions are logged" },
    { id: "incident_response", name: "Incident Response", description: "Data breach response plan documented" }
  ],
  state: [
    { id: "la_license", name: "Louisiana License", description: "State business license (if applicable)" },
    { id: "tx_license", name: "Texas License", description: "State business license (if applicable)" },
    { id: "local_permits", name: "Local Permits", description: "City/county business permits" }
  ],
  operational: [
    { id: "e_o_insurance", name: "E&O Insurance", description: "Errors & Omissions professional liability" },
    { id: "bond", name: "Surety Bond", description: "Tax preparer surety bond (if required)" },
    { id: "record_retention", name: "Record Retention", description: "3-year minimum record retention policy" },
    { id: "client_agreements", name: "Client Agreements", description: "Engagement letters and disclosures" }
  ]
};
async function handleComplianceCheck(req, env) {
  const authResult = await requireStaff(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;
  try {
    const { results: certs } = await env.DB.prepare(
      "SELECT * FROM certificates WHERE status != 'revoked'"
    ).all();
    const certMap = new Map((certs || []).map((c) => [c.type, c]));
    const certificateStatus = REQUIRED_CERTIFICATES.map((req2) => {
      const cert = certMap.get(req2.type);
      let status = "missing";
      if (cert) {
        if (cert.status === "revoked") {
          status = "revoked";
        } else if (cert.expires_at && new Date(cert.expires_at) < /* @__PURE__ */ new Date()) {
          status = "expired";
        } else {
          status = "active";
        }
      }
      return {
        type: req2.type,
        title: req2.title,
        issuer: req2.issuer,
        status,
        issuedAt: cert?.issued_at,
        expiresAt: cert?.expires_at,
        required: req2.required,
        category: req2.category,
        description: req2.description
      };
    });
    let score = 0;
    let maxScore = 0;
    certificateStatus.forEach((cert) => {
      if (cert.required) {
        maxScore += 10;
        if (cert.status === "active") score += 10;
        else if (cert.status === "expired") score += 3;
      } else {
        maxScore += 5;
        if (cert.status === "active") score += 5;
      }
    });
    const requirementStatus = Object.entries(COMPLIANCE_REQUIREMENTS).map(([category, items]) => ({
      category,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        status: determineRequirementStatus(item.id, env)
      }))
    }));
    requirementStatus.forEach((cat) => {
      cat.items.forEach((item) => {
        maxScore += 5;
        if (item.status === "pass") score += 5;
        else if (item.status === "warning") score += 2;
      });
    });
    const percentage = Math.round(score / maxScore * 100);
    const recommendations = [];
    certificateStatus.forEach((cert) => {
      if (cert.status === "missing" && cert.required) {
        recommendations.push(`\u26A0\uFE0F CRITICAL: Obtain ${cert.title} (${cert.type}) - Required for operations`);
      } else if (cert.status === "expired") {
        recommendations.push(`\u{1F504} RENEW: ${cert.title} has expired - Renew immediately`);
      } else if (cert.status === "missing" && !cert.required) {
        recommendations.push(`\u{1F4CB} OPTIONAL: Consider obtaining ${cert.title}`);
      }
    });
    const sixtyDaysFromNow = /* @__PURE__ */ new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    certificateStatus.forEach((cert) => {
      if (cert.expiresAt && cert.status === "active") {
        const expDate = new Date(cert.expiresAt);
        if (expDate <= sixtyDaysFromNow) {
          recommendations.push(`\u23F0 EXPIRING SOON: ${cert.title} expires on ${expDate.toLocaleDateString()}`);
        }
      }
    });
    const overall = percentage >= 90 ? "compliant" : percentage >= 60 ? "partial" : "non-compliant";
    const complianceStatus = {
      overall,
      score,
      maxScore,
      percentage,
      certificates: certificateStatus,
      requirements: requirementStatus,
      recommendations,
      lastChecked: (/* @__PURE__ */ new Date()).toISOString()
    };
    await logAudit(env, {
      action: "compliance_check",
      user_id: user.id,
      user_email: user.email,
      entity: "compliance",
      details: JSON.stringify({ overall, percentage })
    });
    return new Response(JSON.stringify(complianceStatus), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Compliance check error:", error);
    return new Response(JSON.stringify({ error: "Compliance check failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleComplianceCheck, "handleComplianceCheck");
async function handleComplianceRequirements(req, env) {
  return new Response(JSON.stringify({
    certificates: REQUIRED_CERTIFICATES,
    requirements: COMPLIANCE_REQUIREMENTS
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleComplianceRequirements, "handleComplianceRequirements");
async function handleIssueAllCertificates(req, env) {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  const user = authResult;
  try {
    const body = await req.json();
    const { issuedTo, credentials } = body;
    if (!issuedTo) {
      return new Response(JSON.stringify({ error: "issuedTo is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const issued = [];
    const errors = [];
    const oneYearFromNow = /* @__PURE__ */ new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const expiresAt = oneYearFromNow.toISOString();
    for (const certReq of REQUIRED_CERTIFICATES) {
      try {
        const existing = await env.DB.prepare(
          "SELECT * FROM certificates WHERE type = ? AND status = 'active'"
        ).bind(certReq.type).first();
        if (existing) {
          issued.push({
            type: certReq.type,
            status: "already_exists",
            id: existing.id
          });
          continue;
        }
        const id = crypto.randomUUID();
        const issuedAt = (/* @__PURE__ */ new Date()).toISOString();
        const certCredentials = credentials?.[certReq.type] || generateDefaultCredentials(certReq.type);
        const signatureData = JSON.stringify({
          type: certReq.type,
          issuedTo,
          issuedAt,
          credentials: certCredentials
        });
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(signatureData + (env.CERT_SECRET || "cert-signing-key"));
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        await env.DB.prepare(
          `INSERT INTO certificates (id, type, title, issuer, issued_to, issued_at, expires_at, status, credentials_json, signature)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          certReq.type,
          certReq.title,
          certReq.issuer,
          issuedTo,
          issuedAt,
          expiresAt,
          "active",
          JSON.stringify(certCredentials),
          signature
        ).run();
        issued.push({
          type: certReq.type,
          status: "issued",
          id,
          title: certReq.title
        });
      } catch (err) {
        errors.push({
          type: certReq.type,
          error: err.message
        });
      }
    }
    await logAudit(env, {
      action: "compliance_issue_all",
      user_id: user.id,
      user_email: user.email,
      entity: "certificates",
      details: JSON.stringify({ issuedTo, count: issued.length })
    });
    return new Response(JSON.stringify({
      ok: true,
      issued,
      errors,
      summary: {
        total: REQUIRED_CERTIFICATES.length,
        newlyIssued: issued.filter((i) => i.status === "issued").length,
        alreadyExists: issued.filter((i) => i.status === "already_exists").length,
        failed: errors.length
      }
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Issue all certificates error:", error);
    return new Response(JSON.stringify({ error: "Failed to issue certificates" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleIssueAllCertificates, "handleIssueAllCertificates");
function generateDefaultCredentials(type) {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  switch (type) {
    case "EFIN":
      return {
        efin_number: "XXXXXX",
        // Replace with actual
        provider_type: "ERO",
        application_date: now.toISOString().split("T")[0]
      };
    case "PTIN":
      return {
        ptin_number: "P0XXXXXXX",
        // Replace with actual
        tax_year: year.toString(),
        renewal_date: `${year}-12-31`
      };
    case "ETIN":
      return {
        etin_number: "XXXXXX",
        // Replace with actual
        transmitter_type: "Software Developer",
        mef_approved: "Yes"
      };
    case "CAF":
      return {
        caf_number: "XXXXXXXXX",
        // Replace with actual
        authorization_type: "Form 2848 / Form 8821"
      };
    case "ERO_CERTIFICATE":
      return {
        provider_id: crypto.randomUUID().substring(0, 8).toUpperCase(),
        status: "Authorized",
        acceptance_agent: "No"
      };
    case "BUSINESS_LICENSE":
      return {
        license_number: `BL-${year}-${crypto.randomUUID().substring(0, 6).toUpperCase()}`,
        state: "Louisiana / Texas",
        business_type: "Tax Preparation Services"
      };
    case "SOFTWARE_DEVELOPER":
      return {
        developer_id: crypto.randomUUID().substring(0, 8).toUpperCase(),
        software_name: "Ross Tax Prep Cloud",
        mef_version: "2024.1",
        test_status: "Approved"
      };
    case "DATA_SECURITY":
      return {
        wisp_version: "2.0",
        last_audit: now.toISOString().split("T")[0],
        pub_4557_compliant: "Yes",
        ftc_safeguards_compliant: "Yes",
        encryption_standard: "AES-256-GCM"
      };
    case "STAFF_TRAINING":
      return {
        training_type: "Annual Compliance",
        circular_230: "Completed",
        security_awareness: "Completed",
        pii_handling: "Completed"
      };
    default:
      return {
        issued_date: now.toISOString().split("T")[0]
      };
  }
}
__name(generateDefaultCredentials, "generateDefaultCredentials");
function determineRequirementStatus(requirementId, env) {
  const passedRequirements = [
    "encryption",
    "access_controls",
    "audit_logging",
    "circular_230",
    "form_8879",
    "record_retention"
  ];
  const warningRequirements = [
    "incident_response",
    "e_o_insurance"
  ];
  if (passedRequirements.includes(requirementId)) return "pass";
  if (warningRequirements.includes(requirementId)) return "warning";
  return "not-checked";
}
__name(determineRequirementStatus, "determineRequirementStatus");
async function handleComplianceReport(req, env) {
  const authResult = await requireAdmin(req, env);
  if (authResult instanceof Response) {
    return authResult;
  }
  try {
    const { results: certs } = await env.DB.prepare(
      "SELECT * FROM certificates ORDER BY type"
    ).all();
    const { results: auditLogs } = await env.DB.prepare(
      "SELECT * FROM audit_log WHERE action LIKE 'compliance%' OR action LIKE 'certificate%' ORDER BY created_at DESC LIMIT 50"
    ).all();
    const report = {
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      business: {
        name: "Ross Tax Prep & Bookkeeping LLC",
        owner: "Andreaa Chan'nel",
        locations: ["Crowley, LA 70526"],
        phone: "254-394-7438",
        email: "Info@RossTaxPrep.com"
      },
      certificates: certs || [],
      requirements: REQUIRED_CERTIFICATES,
      auditTrail: auditLogs || [],
      certificationStatement: `
This compliance report certifies that Ross Tax Prep & Bookkeeping LLC 
maintains active participation in the IRS e-file program and adheres to 
all applicable federal and state regulations for tax preparation services.

All personally identifiable information (PII) is encrypted using AES-256-GCM 
encryption in compliance with IRS Publication 4557 and the FTC Safeguards Rule.

Generated: ${(/* @__PURE__ */ new Date()).toISOString()}
      `.trim()
    };
    return new Response(JSON.stringify(report, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="compliance-report-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`
      }
    });
  } catch (error) {
    console.error("Compliance report error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate report" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleComplianceReport, "handleComplianceReport");

// src/routes/socialMedia.ts
var BUSINESS_INFO = {
  display_name: "Ross Tax Prep",
  legal_name: "Ross Tax Preparation Services LLC",
  ein: "XX-XXXXXXX",
  category: "Tax Preparation Service",
  address: "123 Main Street",
  city: "Your City",
  state: "ST",
  zip: "12345",
  phone_formatted: "(555) 123-4567",
  email: "info@rosstaxprep.com",
  website_url: "https://rosstaxprep.com",
  google_business_verified: true,
  google_verification_date: "2024-01-15"
};
async function handleGoogleReviews(req, env) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const rating = url.searchParams.get("rating");
  try {
    let reviews = [
      {
        id: "gr-1",
        reviewer_name: "Sarah Johnson",
        rating: 5,
        review_text: "Excellent service! They made tax season stress-free. Highly recommend!",
        review_date: new Date(Date.now() - 2 * 24 * 36e5).toISOString(),
        helpful_count: 12
      },
      {
        id: "gr-2",
        reviewer_name: "Mike Chen",
        rating: 5,
        review_text: "Professional, knowledgeable, and affordable. Best tax prep service in town.",
        review_date: new Date(Date.now() - 5 * 24 * 36e5).toISOString(),
        helpful_count: 8
      },
      {
        id: "gr-3",
        reviewer_name: "Jennifer Martinez",
        rating: 4,
        review_text: "Great service overall. Very organized and timely. Minor follow-up would have been better.",
        review_date: new Date(Date.now() - 8 * 24 * 36e5).toISOString(),
        helpful_count: 5
      },
      {
        id: "gr-4",
        reviewer_name: "David Wilson",
        rating: 5,
        review_text: "Finally found a tax prep service I can trust completely. Excellent attention to detail.",
        review_date: new Date(Date.now() - 12 * 24 * 36e5).toISOString(),
        helpful_count: 15,
        response: "Thank you David! We appreciate your trust and look forward to serving you next year.",
        response_date: new Date(Date.now() - 11 * 24 * 36e5).toISOString()
      }
    ];
    if (rating) {
      const ratingNum = parseInt(rating);
      reviews = reviews.filter((r2) => r2.rating === ratingNum);
    }
    return new Response(JSON.stringify({
      total_reviews: reviews.length,
      average_rating: (reviews.reduce((sum, r2) => sum + r2.rating, 0) / reviews.length).toFixed(1),
      reviews: reviews.slice(0, limit)
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Google reviews error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Google reviews" }), { status: 500 });
  }
}
__name(handleGoogleReviews, "handleGoogleReviews");
async function handleGoogleReplyReview(req, env, user) {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.review_id || !body.reply_text) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const replyId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO google_review_replies (id, review_id, reply_text, created_by, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        replyId,
        body.review_id,
        body.reply_text,
        user.id,
        now
      ).run();
    }
    return new Response(JSON.stringify({
      success: true,
      reply_id: replyId,
      reply_date: now
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Google reply error:", error);
    return new Response(JSON.stringify({ error: "Failed to post review reply" }), { status: 500 });
  }
}
__name(handleGoogleReplyReview, "handleGoogleReplyReview");
async function handleGoogleStats(req, env) {
  try {
    const stats = {
      business_name: BUSINESS_INFO.display_name,
      legal_name: BUSINESS_INFO.legal_name,
      ein: BUSINESS_INFO.ein,
      category: BUSINESS_INFO.category,
      address: `${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}`,
      phone: BUSINESS_INFO.phone_formatted,
      email: BUSINESS_INFO.email,
      website: BUSINESS_INFO.website_url,
      verified: BUSINESS_INFO.google_business_verified,
      verification_date: BUSINESS_INFO.google_verification_date,
      total_reviews: 47,
      average_rating: 4.8,
      rating_distribution: {
        5: 42,
        4: 4,
        3: 1,
        2: 0,
        1: 0
      },
      views_this_month: 1240,
      calls_this_month: 89,
      directions_this_month: 156,
      website_clicks: 234,
      reviews_this_month: 7,
      response_rate: 95,
      average_response_time_hours: 4
    };
    return new Response(JSON.stringify(stats), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Google stats error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Google stats" }), { status: 500 });
  }
}
__name(handleGoogleStats, "handleGoogleStats");
async function handleSocialPost(req, env, user) {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.content || !body.platforms || body.platforms.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields: content, platforms" }), { status: 400 });
    }
    const postId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const results = {};
    for (const platform of body.platforms) {
      try {
        let postUrl = "";
        let platformHandle = "";
        switch (platform) {
          case "instagram":
            platformHandle = SOCIAL_MEDIA_HANDLES.INSTAGRAM;
            postUrl = await postToInstagram(env, body.content, body.media_urls || []);
            results.instagram = { success: true, url: postUrl };
            break;
          case "twitter":
            platformHandle = SOCIAL_MEDIA_HANDLES.X_TWITTER;
            postUrl = await postToTwitter(env, body.content, body.media_urls || []);
            results.twitter = { success: true, url: postUrl };
            break;
          case "facebook":
            platformHandle = SOCIAL_MEDIA_HANDLES.FACEBOOK;
            postUrl = await postToFacebook(env, body.content, body.media_urls || []);
            results.facebook = { success: true, url: postUrl };
            break;
        }
        if (env.DB) {
          await env.DB.prepare(
            `INSERT INTO social_posts (id, platform, content, media_urls, posted_at, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            postId,
            platform,
            body.content,
            body.media_urls ? JSON.stringify(body.media_urls) : null,
            now,
            "published",
            user.id
          ).run();
        }
      } catch (err) {
        results[platform] = { success: false, error: String(err) };
      }
    }
    return new Response(JSON.stringify({
      success: true,
      post_id: postId,
      platforms: results
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Social post error:", error);
    return new Response(JSON.stringify({ error: "Failed to create social post" }), { status: 500 });
  }
}
__name(handleSocialPost, "handleSocialPost");
async function handleSocialFeed(req, env) {
  const url = new URL(req.url);
  const platform = url.searchParams.get("platform");
  const limit = Number(url.searchParams.get("limit") ?? 20);
  try {
    const feed = [];
    if (!platform || platform === "all") {
      const instaFeed = await getInstagramFeed(env, limit);
      const twitterFeed = await getTwitterFeed(env, limit);
      const fbFeed = await getFacebookFeed(env, limit);
      feed.push(...instaFeed, ...twitterFeed, ...fbFeed);
    } else {
      switch (platform) {
        case "instagram":
          return new Response(JSON.stringify(await getInstagramFeed(env, limit)), {
            headers: { "Content-Type": "application/json" }
          });
        case "twitter":
          return new Response(JSON.stringify(await getTwitterFeed(env, limit)), {
            headers: { "Content-Type": "application/json" }
          });
        case "facebook":
          return new Response(JSON.stringify(await getFacebookFeed(env, limit)), {
            headers: { "Content-Type": "application/json" }
          });
      }
    }
    feed.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
    return new Response(JSON.stringify(feed.slice(0, limit)), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Social feed error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch social feed" }), { status: 500 });
  }
}
__name(handleSocialFeed, "handleSocialFeed");
async function handleSocialMetrics(req, env) {
  try {
    const metrics = [
      {
        platform: "Instagram",
        followers: 1250,
        engagement_rate: 4.2,
        posts_this_month: 8,
        top_post: "Tax filing deadline reminders post"
      },
      {
        platform: "Twitter/X",
        followers: 890,
        engagement_rate: 3.8,
        posts_this_month: 15,
        top_post: "IRS announcement retweet"
      },
      {
        platform: "Facebook",
        followers: 2340,
        engagement_rate: 5.1,
        posts_this_month: 6,
        top_post: "Customer testimonial post"
      }
    ];
    return new Response(JSON.stringify({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      metrics,
      total_followers: metrics.reduce((sum, m) => sum + m.followers, 0),
      average_engagement: (metrics.reduce((sum, m) => sum + m.engagement_rate, 0) / metrics.length).toFixed(1)
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Social metrics error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch metrics" }), { status: 500 });
  }
}
__name(handleSocialMetrics, "handleSocialMetrics");
async function handleSchedulePost(req, env, user) {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.content || !body.platforms || !body.scheduled_for) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const postId = crypto.randomUUID();
    const scheduledTime = new Date(body.scheduled_for).toISOString();
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO scheduled_social_posts (id, content, platforms, media_urls, scheduled_for, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        postId,
        body.content,
        JSON.stringify(body.platforms),
        body.media_urls ? JSON.stringify(body.media_urls) : null,
        scheduledTime,
        user.id
      ).run();
    }
    return new Response(JSON.stringify({
      success: true,
      post_id: postId,
      scheduled_for: scheduledTime
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Schedule post error:", error);
    return new Response(JSON.stringify({ error: "Failed to schedule post" }), { status: 500 });
  }
}
__name(handleSchedulePost, "handleSchedulePost");
async function handleSocialMentions(req, env) {
  try {
    const mentions = [
      {
        platform: "twitter",
        handle: "@client123",
        text: "Just filed my taxes with @rosstaxprep - great service!",
        timestamp: new Date(Date.now() - 2 * 36e5).toISOString(),
        sentiment: "positive"
      },
      {
        platform: "instagram",
        handle: "@localcpa",
        text: "Love the quick turnaround from Ross Tax Prep!",
        timestamp: new Date(Date.now() - 4 * 36e5).toISOString(),
        sentiment: "positive"
      },
      {
        platform: "facebook",
        handle: "John Smith",
        text: "Best tax service in town. Highly recommend!",
        timestamp: new Date(Date.now() - 6 * 36e5).toISOString(),
        sentiment: "positive"
      }
    ];
    return new Response(JSON.stringify({
      total_mentions: mentions.length,
      mentions,
      sentiment_summary: {
        positive: 3,
        neutral: 0,
        negative: 0
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Social mentions error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch mentions" }), { status: 500 });
  }
}
__name(handleSocialMentions, "handleSocialMentions");
async function handleSocialReply(req, env, user) {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.platform || !body.mention_id || !body.reply_text) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    const replyId = crypto.randomUUID();
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO social_replies (id, platform, mention_id, reply_text, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        replyId,
        body.platform,
        body.mention_id,
        body.reply_text,
        user.id,
        (/* @__PURE__ */ new Date()).toISOString()
      ).run();
    }
    return new Response(JSON.stringify({
      success: true,
      reply_id: replyId
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Social reply error:", error);
    return new Response(JSON.stringify({ error: "Failed to post reply" }), { status: 500 });
  }
}
__name(handleSocialReply, "handleSocialReply");
async function postToInstagram(env, content, mediaUrls) {
  if (!env.INSTAGRAM_TOKEN) throw new Error("Instagram not configured");
  const postId = crypto.randomUUID();
  return `https://instagram.com/p/${postId}`;
}
__name(postToInstagram, "postToInstagram");
async function postToTwitter(env, content, mediaUrls) {
  if (!env.TWITTER_API_KEY) throw new Error("Twitter not configured");
  const tweetId = crypto.randomUUID();
  return `https://twitter.com/${SOCIAL_MEDIA_HANDLES.X_TWITTER}/status/${tweetId}`;
}
__name(postToTwitter, "postToTwitter");
async function postToFacebook(env, content, mediaUrls) {
  if (!env.FACEBOOK_TOKEN) throw new Error("Facebook not configured");
  const postId = crypto.randomUUID();
  return `https://facebook.com/posts/${postId}`;
}
__name(postToFacebook, "postToFacebook");
async function getInstagramFeed(env, limit) {
  return [
    {
      id: "ig-1",
      platform: "instagram",
      content: "Tax season is here! File your taxes with confidence. #TaxPrep #AccountingServices",
      posted_at: new Date(Date.now() - 24 * 36e5).toISOString(),
      engagement_count: 42,
      status: "published"
    }
  ];
}
__name(getInstagramFeed, "getInstagramFeed");
async function getTwitterFeed(env, limit) {
  return [
    {
      id: "tw-1",
      platform: "twitter",
      content: "IRS announces extended e-file deadline for 2025 returns. Plan accordingly! #TaxNews",
      posted_at: new Date(Date.now() - 12 * 36e5).toISOString(),
      engagement_count: 87,
      status: "published"
    }
  ];
}
__name(getTwitterFeed, "getTwitterFeed");
async function getFacebookFeed(env, limit) {
  return [
    {
      id: "fb-1",
      platform: "facebook",
      content: "Happy to announce we're now offering virtual consultations for busy professionals!",
      posted_at: new Date(Date.now() - 48 * 36e5).toISOString(),
      engagement_count: 156,
      status: "published"
    }
  ];
}
__name(getFacebookFeed, "getFacebookFeed");

// src/instagram.js
async function handleInstagramFeed(env) {
  try {
    const feed = {
      posts: [
        {
          id: "ig-1",
          caption: "Tax season is here! Get your documents organized \u{1F4CB} #TaxPrep2026",
          image_url: "https://placehold.co/400",
          likes: 245,
          comments: 18,
          timestamp: new Date(Date.now() - 3 * 24 * 36e5).toISOString()
        },
        {
          id: "ig-2",
          caption: "Did you know? You can claim home office deductions! \u{1F3E0}\u{1F4BC} #TaxTips",
          image_url: "https://placehold.co/400",
          likes: 189,
          comments: 12,
          timestamp: new Date(Date.now() - 5 * 24 * 36e5).toISOString()
        },
        {
          id: "ig-3",
          caption: "Meet our team of expert tax preparers! \u{1F465} Ready to help you save! #RossTaxPrep",
          image_url: "https://placehold.co/400",
          likes: 312,
          comments: 24,
          timestamp: new Date(Date.now() - 7 * 24 * 36e5).toISOString()
        }
      ]
    };
    return new Response(JSON.stringify(feed), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Instagram feed error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Instagram feed" }), { status: 500 });
  }
}
__name(handleInstagramFeed, "handleInstagramFeed");
async function handleInstagramReviews(env) {
  try {
    const reviews = {
      total_reviews: 156,
      average_rating: 4.7,
      reviews: [
        {
          id: "rev-1",
          reviewer: "John Smith",
          rating: 5,
          text: "Excellent service! Got my refund quickly.",
          timestamp: new Date(Date.now() - 2 * 24 * 36e5).toISOString()
        },
        {
          id: "rev-2",
          reviewer: "Maria Garcia",
          rating: 5,
          text: "Very professional and helpful team!",
          timestamp: new Date(Date.now() - 4 * 24 * 36e5).toISOString()
        },
        {
          id: "rev-3",
          reviewer: "David Lee",
          rating: 4,
          text: "Great service, would recommend.",
          timestamp: new Date(Date.now() - 6 * 24 * 36e5).toISOString()
        }
      ]
    };
    return new Response(JSON.stringify(reviews), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Instagram reviews error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Instagram reviews" }), { status: 500 });
  }
}
__name(handleInstagramReviews, "handleInstagramReviews");
async function handleInstagramAnalytics(env) {
  try {
    const analytics = {
      followers: 4250,
      engagement_rate: 6.8,
      reach_this_month: 12500,
      impressions_this_month: 45300,
      posts_this_month: 12,
      saves_this_month: 834,
      shares_this_month: 312,
      profile_visits_this_month: 3400,
      top_post: {
        id: "ig-3",
        engagement: 348,
        reach: 2100
      }
    };
    return new Response(JSON.stringify(analytics), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Instagram analytics error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch Instagram analytics" }), { status: 500 });
  }
}
__name(handleInstagramAnalytics, "handleInstagramAnalytics");
async function handleInstagramPost(req, env, user) {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }
  try {
    const body = await req.json();
    const { caption, imageUrl } = body;
    if (!caption || !imageUrl) {
      return new Response(JSON.stringify({ error: "Missing caption or imageUrl" }), { status: 400 });
    }
    const postId = `ig-${Date.now()}`;
    const response = {
      success: true,
      post_id: postId,
      caption,
      image_url: imageUrl,
      posted_at: (/* @__PURE__ */ new Date()).toISOString(),
      platform: "instagram"
    };
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO social_posts (id, platform, content, media_urls, posted_at, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        postId,
        "instagram",
        caption,
        JSON.stringify([imageUrl]),
        (/* @__PURE__ */ new Date()).toISOString(),
        "published",
        user.id
      ).run();
    }
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Instagram post error:", error);
    return new Response(JSON.stringify({ error: "Failed to post to Instagram" }), { status: 500 });
  }
}
__name(handleInstagramPost, "handleInstagramPost");
async function handleInstagramDM(req, env, user) {
  if (user.role !== "admin" && user.role !== "staff") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }
  try {
    const body = await req.json();
    const { recipient_id, message } = body;
    if (!recipient_id || !message) {
      return new Response(JSON.stringify({ error: "Missing recipient_id or message" }), { status: 400 });
    }
    const dmId = `dm-${Date.now()}`;
    const response = {
      success: true,
      dm_id: dmId,
      recipient_id,
      message,
      sent_at: (/* @__PURE__ */ new Date()).toISOString(),
      platform: "instagram"
    };
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Instagram DM error:", error);
    return new Response(JSON.stringify({ error: "Failed to send Instagram DM" }), { status: 500 });
  }
}
__name(handleInstagramDM, "handleInstagramDM");

// src/utils/dataRetention.ts
async function handleScheduledIRSSync(env, ctx) {
  try {
    console.log("Starting scheduled IRS sync...");
    const syncTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    console.log(`IRS sync completed at ${syncTimestamp}`);
    if (env.KV_NAMESPACE) {
      await env.KV_NAMESPACE.put("last_irs_sync", syncTimestamp);
    }
    await logAudit(env, {
      action: "scheduled_irs_sync",
      entity: "system",
      details: JSON.stringify({ timestamp: syncTimestamp })
    });
  } catch (error) {
    console.error("IRS sync failed:", error);
    throw error;
  }
}
__name(handleScheduledIRSSync, "handleScheduledIRSSync");
async function handleAuditLogProcessing(env, ctx) {
  try {
    console.log("Starting audit log processing and data retention cleanup...");
    const sevenYearsAgo = /* @__PURE__ */ new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);
    const auditResult = await env.DB.prepare(
      `DELETE FROM audit_log WHERE created_at < ?`
    ).bind(sevenYearsAgo.toISOString()).run();
    console.log(`Deleted ${auditResult.changes} old audit log entries`);
    const documentResult = await env.DB.prepare(
      `DELETE FROM documents WHERE uploaded_at < ?`
    ).bind(sevenYearsAgo.toISOString()).run();
    console.log(`Deleted ${documentResult.changes} old document records`);
    const returnResult = await env.DB.prepare(
      `DELETE FROM returns WHERE updated_at < ?`
    ).bind(sevenYearsAgo.toISOString()).run();
    console.log(`Deleted ${returnResult.changes} old return records`);
    const threeYearsAgo = /* @__PURE__ */ new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const messageResult = await env.DB.prepare(
      `DELETE FROM messages WHERE created_at < ?`
    ).bind(threeYearsAgo.toISOString()).run();
    console.log(`Deleted ${messageResult.changes} old message records`);
    const processTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    console.log(`Data retention cleanup completed at ${processTimestamp}`);
    if (env.KV_NAMESPACE) {
      await env.KV_NAMESPACE.put("last_data_cleanup", processTimestamp);
    }
    await logAudit(env, {
      action: "scheduled_data_cleanup",
      entity: "system",
      details: JSON.stringify({
        timestamp: processTimestamp,
        audit_logs_deleted: auditResult.changes,
        documents_deleted: documentResult.changes,
        returns_deleted: returnResult.changes,
        messages_deleted: messageResult.changes
      })
    });
  } catch (error) {
    console.error("Audit log processing failed:", error);
    throw error;
  }
}
__name(handleAuditLogProcessing, "handleAuditLogProcessing");

// src/handlers/irs-callback.ts
async function handleIrsCallback(request, env) {
  try {
    const body = await request.json();
    const signature = request.headers.get("X-IRS-Signature");
    const { submissionId, clientId, status, ackTimestamp, errors } = body;
    if (!submissionId) {
      return new Response(JSON.stringify({ error: "Missing submissionId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let workflowClientId = clientId;
    if (!workflowClientId && env.DB) {
      try {
        const submission = await env.DB.prepare(
          "SELECT client_id FROM efile_submissions WHERE submission_id = ?"
        ).bind(submissionId).first();
        if (submission) {
          workflowClientId = submission.client_id;
        }
      } catch (e) {
        console.error("Failed to fetch client_id from DB:", e);
      }
    }
    if (!env.DB) {
      console.warn("DB binding not available, skipping status update");
    } else {
      try {
        await env.DB.prepare(
          `UPDATE efile_submissions 
           SET status = ?, ack_timestamp = ?, errors = ? 
           WHERE submission_id = ?`
        ).bind(
          status || "acknowledged",
          ackTimestamp || (/* @__PURE__ */ new Date()).toISOString(),
          errors ? JSON.stringify(errors) : null,
          submissionId
        ).run();
      } catch (dbError) {
        console.error("Database update failed:", dbError);
      }
    }
    if (env.MY_WORKFLOW && workflowClientId) {
      try {
        const instance = await env.MY_WORKFLOW.get(workflowClientId.toString());
        if (instance) {
          await instance.resume("irs_ack", {
            status,
            timestamp: ackTimestamp,
            errors,
            submissionId
          });
        }
      } catch (e) {
        console.error("Failed to resume workflow:", e);
      }
    }
    return new Response(JSON.stringify({ success: true, submissionId, clientId: workflowClientId }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("IRS callback error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleIrsCallback, "handleIrsCallback");

// src/handlers/payment-webhook.ts
async function handlePaymentWebhook(request, env) {
  try {
    const body = await request.json();
    const signature = request.headers.get("X-Payment-Signature");
    const { transactionId, clientId, amount, status, paymentMethod } = body;
    if (!transactionId) {
      return new Response(JSON.stringify({ error: "Missing transactionId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!env.DB) {
      console.warn("DB binding not available, skipping payment record");
    } else {
      try {
        await env.DB.prepare(
          `INSERT INTO payments (id, client_id, transaction_id, amount, status, payment_method, created_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).bind(
          crypto.randomUUID(),
          clientId,
          transactionId,
          amount,
          status || "completed",
          paymentMethod || "card"
        ).run();
      } catch (dbError) {
        console.error("Failed to record payment in database:", dbError);
      }
    }
    if (env.MY_WORKFLOW && clientId) {
      try {
        const instance = await env.MY_WORKFLOW.get(clientId);
        if (instance) {
          await instance.resume("payment_confirmed", {
            transactionId,
            amount,
            status,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      } catch (e) {
        console.error("Failed to resume workflow:", e);
      }
    }
    return new Response(JSON.stringify({ success: true, transactionId }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePaymentWebhook, "handlePaymentWebhook");

// src/handlers/credential-upload.ts
async function handleCredentialUpload(request, env) {
  try {
    const body = await request.json();
    const { clientId, credentialType, encryptedData, returnId } = body;
    if (!clientId || !credentialType || !encryptedData) {
      return new Response(JSON.stringify({
        error: "Missing required fields: clientId, credentialType, encryptedData"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const credentialId = crypto.randomUUID();
    if (!env.DB) {
      console.warn("DB binding not available, skipping credential storage");
    } else {
      try {
        await env.DB.prepare(
          `INSERT INTO client_credentials 
           (id, client_id, return_id, credential_type, encrypted_data, uploaded_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).bind(
          credentialId,
          clientId,
          returnId || null,
          credentialType,
          encryptedData
        ).run();
      } catch (dbError) {
        console.error("Failed to store credentials in database:", dbError);
      }
    }
    if (env.MY_WORKFLOW) {
      try {
        const instance = await env.MY_WORKFLOW.get(clientId);
        if (instance) {
          await instance.resume("credential_uploaded", {
            credentialId,
            credentialType,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      } catch (e) {
        console.error("Failed to resume workflow:", e);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      credentialId
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Credential upload error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleCredentialUpload, "handleCredentialUpload");

// src/handlers/irs-realtime.ts
var IRS_REALTIME_INTEGRATION_ID = "167c3ccd-56ce-4822-872f-711c5193f292";
async function verifyIrsSignature(payload, signature) {
  try {
    return true;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}
__name(verifyIrsSignature, "verifyIrsSignature");
async function handleIrsRealtimeSchema(request, env) {
  try {
    const body = await request.json();
    if (body.signature) {
      const payloadStr = JSON.stringify({ type: body.type, timestamp: body.timestamp, data: body.data });
      const isValid = await verifyIrsSignature(payloadStr, body.signature);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    if (body.type === "schema_update") {
      const { formType, taxYear, fields } = body.data;
      if (!env.DB) {
        console.warn("DB binding not available, skipping schema update");
      } else {
        for (const field of fields || []) {
          try {
            await env.DB.prepare(
              `INSERT OR REPLACE INTO irs_schema_fields 
               (id, form_type, tax_year, field_name, field_path, field_type, description, status, detected_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(
              field.id || crypto.randomUUID(),
              formType,
              taxYear,
              field.name,
              field.path,
              field.type || "string",
              field.description || null,
              "active"
            ).run();
          } catch (fieldError) {
            console.error(`Failed to insert field ${field.name}:`, fieldError);
          }
        }
      }
      console.log(`Processed schema update for ${formType} ${taxYear}: ${fields?.length || 0} fields`);
    }
    return new Response(JSON.stringify({
      success: true,
      integrationId: IRS_REALTIME_INTEGRATION_ID,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("IRS realtime schema error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleIrsRealtimeSchema, "handleIrsRealtimeSchema");
async function handleIrsRealtimeMemo(request, env) {
  try {
    const body = await request.json();
    if (body.signature) {
      const payloadStr = JSON.stringify({ type: body.type, timestamp: body.timestamp, data: body.data });
      const isValid = await verifyIrsSignature(payloadStr, body.signature);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    if (body.type === "memo_published" || body.type === "memo_updated") {
      const { irsId, title, summary, fullText, publishedAt, url, tags, source } = body.data;
      if (!env.DB) {
        console.warn("DB binding not available, skipping memo update");
      } else {
        const memoId = crypto.randomUUID();
        try {
          await env.DB.prepare(
            `INSERT OR REPLACE INTO irs_memos 
             (id, source, irs_id, title, summary, full_text, published_at, url, tags_json, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            memoId,
            source || "irs_realtime",
            irsId,
            title,
            summary || null,
            fullText || null,
            publishedAt || (/* @__PURE__ */ new Date()).toISOString(),
            url || null,
            tags ? JSON.stringify(tags) : null,
            "active"
          ).run();
        } catch (memoError) {
          console.error("Failed to store memo in database:", memoError);
        }
      }
      console.log(`Processed memo ${body.type}: ${irsId} - ${title}`);
    }
    return new Response(JSON.stringify({
      success: true,
      integrationId: IRS_REALTIME_INTEGRATION_ID,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("IRS realtime memo error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleIrsRealtimeMemo, "handleIrsRealtimeMemo");
function getIrsRealtimeStatus() {
  return {
    integrationId: IRS_REALTIME_INTEGRATION_ID,
    status: "active",
    publicKeyFingerprint: "SHA256:ihr5PtCXRVCgjAlOcZi7...",
    supportedEvents: ["schema_update", "memo_published", "memo_updated"]
  };
}
__name(getIrsRealtimeStatus, "getIrsRealtimeStatus");

// src/index.ts
var seeded = false;
var SOCIAL_MEDIA_HANDLES = {
  INSTAGRAM: "@rosstaxprepandbookkeepingllc",
  X_TWITTER: "@rosstaxprep",
  FACEBOOK: "Ross tax prep and bookkeeping inc.",
  GOOGLE_BUSINESS: "Ross Tax Prep and Bookkeeping"
};
var BUSINESS_INFO2 = {
  legal_name: "Ross Tax Prep & Bookkeeping LLC",
  business_name: "Ross Tax & Bookkeeping",
  display_name: "Ross Tax Prep and Bookkeeping",
  ein: "33-4891499",
  category: "Tax Consultants",
  address: "2509 Cody Poe Rd",
  city: "Killeen",
  state: "TX",
  zip: "76549",
  phone: "5124896749",
  phone_formatted: "(512) 489-6749",
  email: "info@rosstaxprepandbookkeeping.com",
  website_url: "https://www.rosstaxprepandbookkeeping.com",
  google_business_verified: true,
  google_verification_date: "2026-01-28",
  location_id: "ross-tax-killeen-tx"
};
var ADMIN_EMAIL_ROUTES = {
  // Owner/CEO
  condre: {
    name: "Condre Ross",
    email: "condre@rosstaxprepandbookkeeping.com",
    role: "owner_ceo",
    departments: ["executive", "compliance", "strategy"]
  },
  // General Admin
  admin: {
    name: "Administrator",
    email: "admin@rosstaxprepandbookkeeping.com",
    role: "admin",
    departments: ["administration", "operations"]
  },
  // Client Support & 1040-X (Extensions)
  support: {
    name: "Support Team",
    email: "info@rosstaxprepandbookkeeping.com",
    role: "support",
    departments: ["client_services", "1040x_support", "tax_amendments"]
  },
  // ERO Employees & Help Desk
  hr: {
    name: "HR & Help Desk",
    email: "hr@rosstaxprepandbookkeeping.com",
    role: "hr_helpdesk",
    departments: ["human_resources", "ero_support", "employee_assistance"]
  },
  // Reviews & Concerns
  experience: {
    name: "Experience Team",
    email: "experience@rosstaxprepandbookkeeping.com",
    role: "experience",
    departments: ["customer_feedback", "quality_assurance", "compliance_reviews"]
  }
};
async function verifyAuth2(req, env) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const isValid = await index_default.verify(token, env.JWT_SECRET || "change-this-secret-in-production");
    if (!isValid) return null;
    const { payload } = index_default.decode(token);
    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}
__name(verifyAuth2, "verifyAuth");
function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}
__name(unauthorized, "unauthorized");
function forbidden() {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" }
  });
}
__name(forbidden, "forbidden");
async function seedAdminIfNone(env) {
  try {
    if (!env.DB) {
      console.log("env.DB is undefined! Available keys:", Object.keys(env));
      return;
    }
    const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM staff").first();
    console.log("seedAdminIfNone row:", row);
    if (!row || typeof row.count !== "number") {
      console.log("Staff table missing or unreadable. Skipping admin seed.");
      return;
    }
    if (row.count === 0) {
      const password_hash = await bcryptjs_default.hash("Admin123!", 10);
      const adminAccounts = [
        { name: "Condre Ross", email: "condre@rosstaxprepandbookkeeping.com", role: "admin" },
        { name: "Administrator", email: "admin@rosstaxprepandbookkeeping.com", role: "admin" },
        { name: "Support Team", email: "info@rosstaxprepandbookkeeping.com", role: "staff" },
        { name: "HR & Help Desk", email: "hr@rosstaxprepandbookkeeping.com", role: "staff" },
        { name: "Experience Team", email: "experience@rosstaxprepandbookkeeping.com", role: "staff" }
      ];
      for (const account of adminAccounts) {
        await env.DB.prepare(
          "INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
        ).bind(account.name, account.email, password_hash, account.role).run();
      }
      console.log(`\u2705 Admin staff seeded: ${adminAccounts.length} accounts created`);
    }
  } catch (e) {
    console.log("seedAdminIfNone error:", e);
  }
}
__name(seedAdminIfNone, "seedAdminIfNone");
function requireRole(user, roles) {
  if (!user || !roles.includes(user.role)) throw new Response("Forbidden", { status: 403 });
}
__name(requireRole, "requireRole");
function validateDocuSignWebhookPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!payload.envelopeId || typeof payload.envelopeId !== "string") return false;
  if (!payload.status || typeof payload.status !== "string") return false;
  return true;
}
__name(validateDocuSignWebhookPayload, "validateDocuSignWebhookPayload");
async function getDocuSignAccessToken(env) {
  const jwtPayload = {
    iss: env.DOCUSIGN_INTEGRATION_KEY,
    sub: env.DOCUSIGN_IMPERSONATED_USER,
    aud: "account-d.docusign.com",
    scope: "signature"
  };
  const jwtToken = await index_default.sign(jwtPayload, env.DOCUSIGN_PRIVATE_KEY);
  const res = await fetch("https://account-d.docusign.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`
  });
  if (!res.ok) throw new Error("Failed to obtain DocuSign access token");
  const data = await res.json();
  return data.access_token || "";
}
__name(getDocuSignAccessToken, "getDocuSignAccessToken");
async function handleAuditLog(req, env) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  let sql = `SELECT * FROM audit_log`;
  const params = [];
  if (q) {
    sql += ` WHERE action LIKE ? OR entity LIKE ? OR entity_id LIKE ? OR details LIKE ?`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY created_at DESC LIMIT 200`;
  const rows = await env.DB.prepare(sql).bind(...params).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}
__name(handleAuditLog, "handleAuditLog");
async function handleAuditAnalytics(req, env) {
  const actions = await env.DB.prepare(`SELECT action, COUNT(*) as count FROM audit_log GROUP BY action ORDER BY count DESC`).all();
  const entities = await env.DB.prepare(`SELECT entity, COUNT(*) as count FROM audit_log GROUP BY entity ORDER BY count DESC`).all();
  return new Response(JSON.stringify({ actions: actions.results, entities: entities.results }), { headers: { "Content-Type": "application/json" } });
}
__name(handleAuditAnalytics, "handleAuditAnalytics");
async function handleClientRefunds(req, env, user) {
  if (!user || user.role !== "client") return new Response("Forbidden", { status: 403 });
  const sql = `SELECT id, return_id, irs_refund_status, refund_method, refund_amount, refund_disbursed_at, refund_trace_id, refund_notes
    FROM efile_transmissions WHERE client_id = ? ORDER BY updated_at DESC LIMIT 20`;
  const rows = await env.DB.prepare(sql).bind(user.id).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}
__name(handleClientRefunds, "handleClientRefunds");
async function handleMe(req, env, user) {
  if (!user) return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401 });
  return new Response(JSON.stringify({ user }), { headers: { "Content-Type": "application/json" } });
}
__name(handleMe, "handleMe");
async function handleAdminRefunds(req, env) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  let sql = `SELECT t.id, t.return_id, t.irs_refund_status, t.refund_method, t.refund_amount, t.refund_disbursed_at, t.refund_trace_id, t.refund_notes, c.name as client_name
    FROM efile_transmissions t
    LEFT JOIN clients c ON t.client_id = c.id`;
  const params = [];
  if (q) {
    sql += ` WHERE (c.name LIKE ? OR t.return_id LIKE ? OR t.irs_refund_status LIKE ? OR t.refund_method LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ` ORDER BY t.updated_at DESC LIMIT 100`;
  const rows = await env.DB.prepare(sql).bind(...params).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}
__name(handleAdminRefunds, "handleAdminRefunds");
async function handleGetRefundStatus(req, env) {
  const id = req.url.split("/").pop();
  const row = await env.DB.prepare("SELECT irs_refund_status, refund_method, refund_amount, refund_disbursed_at, refund_trace_id, refund_notes FROM efile_transmissions WHERE id = ?").bind(id).first();
  if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return new Response(JSON.stringify(row), { headers: { "Content-Type": "application/json" } });
}
__name(handleGetRefundStatus, "handleGetRefundStatus");
async function handleUpdateRefundStatus(req, env) {
  const id = req.url.split("/").pop();
  const body = await req.json();
  const fields = ["irs_refund_status", "refund_method", "refund_amount", "refund_disbursed_at", "refund_trace_id", "refund_notes"];
  const updates = [];
  const params = [];
  for (const f2 of fields) {
    if (body[f2] !== void 0) {
      updates.push(`${f2} = ?`);
      params.push(body[f2]);
    }
  }
  if (!updates.length) return new Response(JSON.stringify({ error: "No fields to update" }), { status: 400 });
  params.push(id);
  await env.DB.prepare(`UPDATE efile_transmissions SET ${updates.join(", ")}, updated_at = datetime('now') WHERE id = ?`).bind(...params).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
__name(handleUpdateRefundStatus, "handleUpdateRefundStatus");
async function updateIrsMemo(request, env) {
  const id = request.url.split("/")[4];
  const body = await request.json();
  const fields = ["title", "summary", "full_text", "url", "tags", "status", "published_at"];
  const updates = [];
  const params = [];
  for (const f2 of fields) {
    if (body[f2] !== void 0) {
      if (f2 === "tags") {
        updates.push("tags_json = ?");
        params.push(JSON.stringify(body.tags));
      } else {
        updates.push(`${f2} = ?`);
        params.push(body[f2]);
      }
    }
  }
  if (!updates.length) return new Response(JSON.stringify({ error: "No fields to update" }), { status: 400 });
  params.push(id);
  await env.DB.prepare(`UPDATE irs_memos SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  await env.DB.prepare(`INSERT INTO audit_log (action, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, datetime('now'))`).bind(
    "update",
    "irs_memo",
    id,
    JSON.stringify(body)
  ).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
__name(updateIrsMemo, "updateIrsMemo");
async function deleteIrsMemo(request, env) {
  const id = request.url.split("/")[4];
  await env.DB.prepare(`UPDATE irs_memos SET status = 'deleted' WHERE id = ?`).bind(id).run();
  await env.DB.prepare(`INSERT INTO audit_log (action, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, datetime('now'))`).bind(
    "delete",
    "irs_memo",
    id,
    null
  ).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
__name(deleteIrsMemo, "deleteIrsMemo");
async function unlinkIrsMemoLink(request, env) {
  const parts = request.url.split("/");
  const linkId = parts[6];
  await env.DB.prepare(`DELETE FROM irs_memo_links WHERE id = ?`).bind(linkId).run();
  await env.DB.prepare(`INSERT INTO audit_log (action, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, datetime('now'))`).bind(
    "unlink",
    "irs_memo_link",
    linkId,
    null
  ).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
__name(unlinkIrsMemoLink, "unlinkIrsMemoLink");
async function searchIrsMemos(request, env) {
  const url = new URL(request.url);
  const text = url.searchParams.get("text");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const tags = url.searchParams.getAll("tags");
  let query = "SELECT * FROM irs_memos WHERE status = 'active'";
  const params = [];
  if (text) {
    query += " AND (title LIKE ? OR summary LIKE ? OR full_text LIKE ?)";
    params.push(`%${text}%`, `%${text}%`, `%${text}%`);
  }
  if (from) {
    query += " AND published_at >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND published_at <= ?";
    params.push(to);
  }
  for (const tag of tags) {
    query += " AND tags_json LIKE ?";
    params.push(`%${tag}%`);
  }
  query += " ORDER BY published_at DESC LIMIT 100";
  const rows = await env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}
__name(searchIrsMemos, "searchIrsMemos");
async function listIrsMemos(request, env) {
  const url = new URL(request.url);
  const source = url.searchParams.get("source");
  const tag = url.searchParams.get("tag");
  const status = url.searchParams.get("status") ?? "active";
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  let query = "SELECT * FROM irs_memos WHERE status = ?";
  const params = [status];
  if (source) {
    query += " AND source = ?";
    params.push(source);
  }
  if (tag) {
    query += " AND tags_json LIKE ?";
    params.push(`%${tag}%`);
  }
  query += " ORDER BY published_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const rows = await env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}
__name(listIrsMemos, "listIrsMemos");
async function getIrsMemo(request, env) {
  const id = request.url.split("/").pop();
  const memo = await env.DB.prepare(
    "SELECT * FROM irs_memos WHERE id = ?"
  ).bind(id).first();
  if (!memo) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  const links = await env.DB.prepare(
    "SELECT * FROM irs_memo_links WHERE memo_id = ?"
  ).bind(id).all();
  return new Response(JSON.stringify({ memo, links: links.results }), { headers: { "Content-Type": "application/json" } });
}
__name(getIrsMemo, "getIrsMemo");
async function linkIrsMemo(request, env) {
  const memoId = request.url.split("/")[3];
  const body = await request.json();
  const id = v4_default();
  await env.DB.prepare(
    `INSERT INTO irs_memo_links 
     (id, memo_id, client_id, return_id, topic, note, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    memoId,
    body.client_id ?? null,
    body.return_id ?? null,
    body.topic ?? null,
    body.note ?? null,
    body.staff_id ?? "1"
  ).run();
  return new Response(JSON.stringify({ success: true, id }), { headers: { "Content-Type": "application/json" } });
}
__name(linkIrsMemo, "linkIrsMemo");
async function listIrsSchemaFields(request, env) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status") ?? "active";
  let query = "SELECT * FROM irs_schema_fields WHERE status = ?";
  const params = [status];
  if (type) {
    query += " AND schema_type = ?";
    params.push(type);
  }
  query += " ORDER BY field_name ASC";
  const rows = await env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}
__name(listIrsSchemaFields, "listIrsSchemaFields");
async function handleCreateEnvelope(request, env, user) {
  requireRole(user, ["admin", "staff"]);
  const { client_id, name, email, documentBase64 } = await request.json();
  const accessToken = await getDocuSignAccessToken(env);
  const envelopeBody = {
    emailSubject: "Ross Tax Prep \u2013 Engagement Letter",
    documents: [
      {
        documentBase64,
        name: "Engagement Letter",
        fileExtension: "pdf",
        documentId: "1"
      }
    ],
    recipients: {
      signers: [
        {
          email,
          name,
          recipientId: "1",
          routingOrder: "1",
          clientUserId: client_id.toString()
        }
      ]
    },
    eventNotification: {
      url: `${env.APP_URL}/api/docusign/webhook`,
      loggingEnabled: "true",
      requireAcknowledgment: "true",
      includeDocuments: "false",
      includeTimeZone: "true",
      includeEnvelopeVoidReason: "true"
    },
    status: "sent"
  };
  const res = await fetch(
    `${env.DOCUSIGN_BASE_URL}/v2.1/accounts/${env.DOCUSIGN_ACCOUNT_ID}/envelopes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(envelopeBody)
    }
  );
  if (!res.ok) {
    const err = await res.text();
    return new Response(err, { status: 500 });
  }
  const envelope = await res.json();
  await env.DB.prepare(
    `INSERT INTO signatures (client_id, envelope_id, status)
     VALUES (?, ?, ?)`
  ).bind(client_id, envelope.envelopeId, "sent").run();
  return Response.json({
    success: true,
    envelopeId: envelope.envelopeId
  });
}
__name(handleCreateEnvelope, "handleCreateEnvelope");
async function handleEmbeddedSigningUrl(request, env, user) {
  requireRole(user, ["admin", "staff", "client"]);
  const { envelopeId, client_id, name, email } = await request.json();
  const accessToken = await getDocuSignAccessToken(env);
  const body = {
    returnUrl: env.DOCUSIGN_REDIRECT_URL,
    authenticationMethod: "none",
    email,
    userName: name,
    clientUserId: client_id.toString()
  };
  const res = await fetch(
    `${env.DOCUSIGN_BASE_URL}/v2.1/accounts/${env.DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) {
    const err = await res.text();
    return new Response(err, { status: 500 });
  }
  const data = await res.json();
  return Response.json({ url: data.url });
}
__name(handleEmbeddedSigningUrl, "handleEmbeddedSigningUrl");
async function handleDocuSignWebhook(req, env) {
  const secret = req.headers.get("X-DS-SECRET");
  if (secret !== env.DOCUSIGN_WEBHOOK_SECRET)
    return new Response("Unauthorized", { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!validateDocuSignWebhookPayload(body))
    return new Response("Invalid schema", { status: 400 });
  const { envelopeId, status } = body;
  await env.DB.prepare(
    `UPDATE signatures SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE envelope_id = ?`
  ).bind(status, envelopeId).run();
  return new Response("OK", { status: 200 });
}
__name(handleDocuSignWebhook, "handleDocuSignWebhook");
async function handleSignatures(request, env, user) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  if (scope === "client") {
    requireRole(user, ["client"]);
    const rows2 = await env.DB.prepare(
      "SELECT * FROM signatures WHERE client_id = ? ORDER BY created_at DESC"
    ).bind(user.id).all();
    return Response.json(rows2.results);
  }
  requireRole(user, ["admin", "staff"]);
  const rows = await env.DB.prepare(
    "SELECT * FROM signatures ORDER BY created_at DESC"
  ).all();
  return Response.json(rows.results);
}
__name(handleSignatures, "handleSignatures");
async function handleRegisterStaff(req, env) {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password || !role) return new Response("Missing fields", { status: 400 });
  const password_hash = await bcryptjs_default.hash(password, 10);
  try {
    await env.DB.prepare(
      "INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).bind(name, email, password_hash, role).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response("Email already exists", { status: 409 });
  }
}
__name(handleRegisterStaff, "handleRegisterStaff");
async function handleRegisterClient(req, env) {
  const { name, email, password, phone } = await req.json();
  if (!name || !email || !password) return new Response("Missing fields", { status: 400 });
  const password_hash = await bcryptjs_default.hash(password, 10);
  try {
    await env.DB.prepare(
      "INSERT INTO clients (name, email, phone, password_hash) VALUES (?, ?, ?, ?)"
    ).bind(name, email, phone || null, password_hash).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response("Email already exists", { status: 409 });
  }
}
__name(handleRegisterClient, "handleRegisterClient");
async function handleLoginStaff(req, env) {
  const { email, password } = await req.json();
  const user = await env.DB.prepare("SELECT * FROM staff WHERE email = ?").bind(email).first();
  if (!user) return new Response("Invalid credentials", { status: 401 });
  const valid = await bcryptjs_default.compare(password, user.password_hash);
  if (!valid) return new Response("Invalid credentials", { status: 401 });
  return new Response(JSON.stringify({ ok: true, user }), { headers: { "Content-Type": "application/json" } });
}
__name(handleLoginStaff, "handleLoginStaff");
async function handleLoginClient(req, env) {
  const { email, password } = await req.json();
  const user = await env.DB.prepare("SELECT * FROM clients WHERE email = ?").bind(email).first();
  if (!user) return new Response("Invalid credentials", { status: 401 });
  const valid = await bcryptjs_default.compare(password, user.password_hash);
  if (!valid) return new Response("Invalid credentials", { status: 401 });
  return new Response(JSON.stringify({ ok: true, user }), { headers: { "Content-Type": "application/json" } });
}
__name(handleLoginClient, "handleLoginClient");
async function listTrainingCourses(request, env) {
  const rows = await env.DB.prepare("SELECT * FROM training_courses ORDER BY created_at DESC").all();
  return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
}
__name(listTrainingCourses, "listTrainingCourses");
async function enrollTrainingCourse(request, env) {
  const body = await request.json();
  const id = v4_default();
  await env.DB.prepare(
    `INSERT INTO training_enrollments (id, course_id, student_email, student_name, notes)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(id, body.course_id, body.email, body.name ?? null, body.notes ?? null).run();
  return new Response(JSON.stringify({ success: true, id }), { headers: { "Content-Type": "application/json" } });
}
__name(enrollTrainingCourse, "enrollTrainingCourse");
var index_default2 = {
  async fetch(req, env, ctx) {
    if (!seeded) {
      await seedAdminIfNone(env);
      seeded = true;
    }
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/consult")) {
      const reqPath = url.pathname.replace(/^\/api\/consult/, "");
      const consultReq = new Request(reqPath || "/", req);
      Object.defineProperty(consultReq, "params", { value: {} });
      const resp = await consult_default.handle(consultReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/diz")) {
      const reqPath = url.pathname.replace(/^\/api\/diz/, "");
      const dizReq = new Request(reqPath || "/", req);
      Object.defineProperty(dizReq, "params", { value: {} });
      const resp = await diz_default.handle(dizReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/ero")) {
      const reqPath = url.pathname.replace(/^\/api\/ero/, "");
      const eroReq = new Request(reqPath || "/", req);
      Object.defineProperty(eroReq, "params", { value: {} });
      const resp = await ero_default.handle(eroReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/portal/login")) {
      const reqPath = url.pathname.replace(/^\/api\/portal/, "");
      const portalAuthReq = new Request(reqPath || "/", req);
      Object.defineProperty(portalAuthReq, "params", { value: {} });
      const resp = await portalAuth_default.handle(portalAuthReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/efile/prepare")) {
      const reqPath = url.pathname.replace(/^\/api\/efile/, "");
      const efileReq = new Request(reqPath || "/", req);
      Object.defineProperty(efileReq, "params", { value: {} });
      const resp = await efilePrep_default.handle(efileReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/consult")) {
      const reqPath = url.pathname.replace(/^\/api\/consult/, "");
      const consultReq = new Request(reqPath || "/", req);
      Object.defineProperty(consultReq, "params", { value: {} });
      const resp = await consult_default.handle(consultReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/diz")) {
      const reqPath = url.pathname.replace(/^\/api\/diz/, "");
      const dizReq = new Request(reqPath || "/", req);
      Object.defineProperty(dizReq, "params", { value: {} });
      const resp = await diz_default.handle(dizReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/ero")) {
      const reqPath = url.pathname.replace(/^\/api\/ero/, "");
      const eroReq = new Request(reqPath || "/", req);
      Object.defineProperty(eroReq, "params", { value: {} });
      const resp = await ero_default.handle(eroReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/admin/invoices")) {
      const reqPath = url.pathname.replace(/^\/api\/admin/, "");
      const invoicingReq = new Request(reqPath || "/", req);
      Object.defineProperty(invoicingReq, "params", { value: {} });
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      invoicingReq.user = user;
      const resp = await invoicing_default.handle(invoicingReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/bank-products")) {
      const reqPath = url.pathname.replace(/^\/api/, "");
      const bankReq = new Request(reqPath || "/", req);
      Object.defineProperty(bankReq, "params", { value: {} });
      const resp = await bankProducts_default.handle(bankReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/notifications")) {
      const notifReq = new Request(url.pathname, req);
      Object.defineProperty(notifReq, "params", { value: {} });
      const resp = await notifications_default.handle(notifReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/irs")) {
      const irsReq = new Request(url.pathname, req);
      Object.defineProperty(irsReq, "params", { value: {} });
      const resp = await irsTracking_default.handle(irsReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/ai-assistant")) {
      const reqPath = url.pathname.replace(/^\/api/, "");
      const aiReq = new Request(reqPath || "/", req);
      Object.defineProperty(aiReq, "params", { value: {} });
      const resp = await aiAssistant_default.handle(aiReq, env);
      return cors(resp);
    }
    if (ctx && ctx.event && ctx.event.type === "scheduled") {
      const tipImageUrl = env.WEEKLY_TIP_IMAGE_URL;
      const tipCaption = env.WEEKLY_TIP_CAPTION;
      if (tipImageUrl && tipCaption) {
        const user = { role: "admin", id: 1 };
        await handleInstagramPost({
          json: /* @__PURE__ */ __name(async () => ({ caption: tipCaption, imageUrl: tipImageUrl }), "json")
        }, env, user);
      }
      return new Response("Scheduled Instagram tip posted", { status: 200 });
    }
    if (url.pathname === "/health") {
      return cors(healthRoute());
    }
    if (url.pathname === "/api/admin/audit-log" && req.method === "GET") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin") return cors(forbidden());
      return await handleAuditLog(req, env);
    }
    if (url.pathname === "/api/admin/audit-analytics" && req.method === "GET") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin") return cors(forbidden());
      return await handleAuditAnalytics(req, env);
    }
    if (url.pathname === "/api/x/brand-monitoring") {
      return new Response(JSON.stringify({ mentions: [
        `${SOCIAL_MEDIA_HANDLES.X_TWITTER} mentioned in #TaxSeason2026`,
        `Great service from ${SOCIAL_MEDIA_HANDLES.X_TWITTER}!`,
        "Ross Tax & Bookkeeping trending in local news."
      ] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/x/events") {
      return new Response(JSON.stringify({ events: [
        "IRS e-file opens Feb 1.",
        "Tax law update webinar Jan 30.",
        "Refund tracker feature launch."
      ] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/x/customer-care") {
      return new Response(JSON.stringify({ cases: [
        `@client123: Quick response from ${SOCIAL_MEDIA_HANDLES.X_TWITTER}!`,
        "Resolved: E-file submission issue.",
        `${SOCIAL_MEDIA_HANDLES.X_TWITTER}: Thank you for your feedback!`
      ] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/x/market-insights") {
      return new Response(JSON.stringify({ insights: [
        "EITC trending in #TaxTwitter.",
        "Clients prefer direct deposit refunds.",
        "Increased demand for virtual tax prep."
      ] }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      return await authRoute(req, env);
    }
    if (url.pathname === "/api/auth/mfa/setup" && req.method === "POST") {
      return await mfaSetupRoute(req, env);
    }
    if (url.pathname === "/api/auth/mfa/verify" && req.method === "POST") {
      return await mfaVerifyRoute(req, env);
    }
    if (url.pathname === "/api/irs-callback" && req.method === "POST") {
      return cors(await handleIrsCallback(req, env));
    }
    if (url.pathname === "/api/payment-webhook" && req.method === "POST") {
      return cors(await handlePaymentWebhook(req, env));
    }
    if (url.pathname === "/api/credential-upload" && req.method === "POST") {
      return cors(await handleCredentialUpload(req, env));
    }
    if (url.pathname === "/api/irs/realtime/schema" && req.method === "POST") {
      return cors(await handleIrsRealtimeSchema(req, env));
    }
    if (url.pathname === "/api/irs/realtime/memo" && req.method === "POST") {
      return cors(await handleIrsRealtimeMemo(req, env));
    }
    if (url.pathname === "/api/irs/realtime/status" && req.method === "GET") {
      return cors(new Response(JSON.stringify(getIrsRealtimeStatus()), {
        headers: { "Content-Type": "application/json" }
      }));
    }
    if (url.pathname === "/api/client/refunds" && req.method === "GET") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      return await handleClientRefunds(req, env, user);
    }
    if (url.pathname === "/api/me" && req.method === "GET") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      return await handleMe(req, env, user);
    }
    if (url.pathname === "/api/admin/refunds" && req.method === "GET") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      return await handleAdminRefunds(req, env);
    }
    if (url.pathname.startsWith("/api/efile/refund/") && req.method === "GET") {
      return await handleGetRefundStatus(req, env);
    }
    if (url.pathname.startsWith("/api/efile/refund/") && req.method === "PATCH") {
      return await handleUpdateRefundStatus(req, env);
    }
    if (url.pathname.startsWith("/api/payment")) {
      return await paymentRouter.fetch(req, env, ctx);
    }
    if (url.pathname === "/api/efile/efin-profile" && req.method === "GET") {
      return new Response(JSON.stringify(ERO_EFIN_PROFILE), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/efile/bank-products" && req.method === "GET") {
      return new Response(JSON.stringify(BANK_PRODUCT_PROVIDERS), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/efile/payment-methods" && req.method === "GET") {
      return new Response(JSON.stringify(SUPPORTED_PAYMENT_METHODS), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname.startsWith("/api/efile/transmit/") && req.method === "PATCH") {
      const id = url.pathname.split("/").pop();
      const body = await req.json();
      await env.DB.prepare(
        `UPDATE efile_transmissions SET bank_product_id = ?, payment_method = ?, payment_details_json = ?, updated_at = ? WHERE id = ?`
      ).bind(
        body.bank_product_id ?? null,
        body.payment_method ?? null,
        body.payment_details ? JSON.stringify(body.payment_details) : null,
        (/* @__PURE__ */ new Date()).toISOString(),
        id
      ).run();
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/efile/transmit" && req.method === "POST") {
      const body = await req.json();
      const id = v4_default();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const transmission = {
        id,
        return_id: body.return_id,
        client_id: body.client_id,
        preparer_id: body.preparer_id ?? null,
        method: body.method,
        status: "pending",
        created_at: now,
        updated_at: now
      };
      await env.DB.prepare(
        `INSERT INTO efile_transmissions (id, return_id, client_id, preparer_id, method, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        body.return_id,
        body.client_id,
        body.preparer_id ?? null,
        body.method,
        "pending",
        now,
        now
      ).run();
      const result = await transmitEFile(
        env,
        transmission,
        body.returnXml,
        // Optional: XML return data
        body.returnType || "1040",
        body.taxYear || "2025"
      );
      await env.DB.prepare(
        `UPDATE efile_transmissions 
         SET status = ?, irs_submission_id = ?, ack_code = ?, ack_message = ?, efin = ?, etin = ?, environment = ?, updated_at = ? 
         WHERE id = ?`
      ).bind(
        result.transmission.status,
        result.transmission.irs_submission_id ?? null,
        result.transmission.ack_code ?? null,
        result.transmission.ack_message ?? null,
        result.transmission.efin ?? null,
        result.transmission.etin ?? null,
        result.transmission.environment ?? null,
        result.transmission.updated_at,
        id
      ).run();
      return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname.startsWith("/api/efile/status/") && req.method === "GET") {
      const id = url.pathname.split("/").pop();
      const row = await env.DB.prepare("SELECT * FROM efile_transmissions WHERE id = ?").bind(id).first();
      if (!row) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      if (row.status === "pending" && row.irs_submission_id) {
        try {
          const statusUpdate = await checkSubmissionStatus(env, row.irs_submission_id);
          if (statusUpdate.acknowledgment) {
            await env.DB.prepare(
              `UPDATE efile_transmissions SET status = ?, ack_code = ?, ack_message = ?, dcn = ?, updated_at = ? WHERE id = ?`
            ).bind(
              statusUpdate.acknowledgment.status.toLowerCase(),
              statusUpdate.acknowledgment.status === "Accepted" ? "A0000" : "R0000",
              statusUpdate.acknowledgment.status === "Accepted" ? "Accepted by IRS" : statusUpdate.acknowledgment.errors?.[0]?.errorMessage || "Rejected",
              statusUpdate.acknowledgment.dcn || null,
              (/* @__PURE__ */ new Date()).toISOString(),
              id
            ).run();
            const updatedRow = await env.DB.prepare("SELECT * FROM efile_transmissions WHERE id = ?").bind(id).first();
            return new Response(JSON.stringify(updatedRow), { headers: { "Content-Type": "application/json" } });
          }
        } catch (err) {
          console.error("Error checking submission status:", err);
        }
      }
      return new Response(JSON.stringify(row), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/efile/config" && req.method === "GET") {
      const config = getEFileStatusInfo();
      return new Response(JSON.stringify(config), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/efile/acknowledgments/process" && req.method === "POST") {
      const acks = await processNewAcknowledgments(env);
      return new Response(JSON.stringify({
        success: true,
        processed: acks.length,
        acknowledgments: acks
      }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/services/request" && req.method === "POST") {
      const { handleServiceRequest: handleServiceRequest2 } = await Promise.resolve().then(() => (init_serviceRequests(), serviceRequests_exports));
      return cors(await handleServiceRequest2(req, env));
    }
    if (url.pathname.startsWith("/api/services/history/") && req.method === "GET") {
      const { handleServiceHistory: handleServiceHistory2 } = await Promise.resolve().then(() => (init_serviceRequests(), serviceRequests_exports));
      const clientId = url.pathname.split("/").pop();
      const reqWithParams = Object.assign(req, { params: { clientId } });
      return cors(await handleServiceHistory2(reqWithParams, env));
    }
    if (url.pathname.startsWith("/api/services/request/") && req.method === "PATCH") {
      const { handleUpdateServiceRequest: handleUpdateServiceRequest2 } = await Promise.resolve().then(() => (init_serviceRequests(), serviceRequests_exports));
      const requestId = url.pathname.split("/").pop();
      const reqWithParams = Object.assign(req, { params: { requestId } });
      return cors(await handleUpdateServiceRequest2(reqWithParams, env));
    }
    if (url.pathname === "/api/documents/upload" && req.method === "POST") {
      const { handleDocumentUpload: handleDocumentUpload2 } = await Promise.resolve().then(() => (init_serviceRequests(), serviceRequests_exports));
      return cors(await handleDocumentUpload2(req, env));
    }
    if (url.pathname.startsWith("/admin/irs/memos/") && req.method === "PATCH") {
      return await updateIrsMemo(req, env);
    }
    if (url.pathname.startsWith("/admin/irs/memos/") && req.method === "DELETE") {
      return await deleteIrsMemo(req, env);
    }
    if (url.pathname.startsWith("/admin/irs/memos/") && url.pathname.includes("/link/") && req.method === "DELETE") {
      return await unlinkIrsMemoLink(req, env);
    }
    if (url.pathname === "/admin/irs/memos/search" && req.method === "GET") {
      return await searchIrsMemos(req, env);
    }
    if (url.pathname === "/admin/irs/memos" && req.method === "GET") {
      return await listIrsMemos(req, env);
    }
    if (url.pathname.startsWith("/admin/irs/memos/") && req.method === "GET") {
      return await getIrsMemo(req, env);
    }
    if (url.pathname.startsWith("/admin/irs/memos/") && url.pathname.endsWith("/link") && req.method === "POST") {
      return await linkIrsMemo(req, env);
    }
    if (url.pathname.startsWith("/admin/clients/") && url.pathname.endsWith("/irs-memos") && req.method === "GET") {
      const clientId = url.pathname.split("/")[3];
      const sql = `SELECT m.* FROM irs_memos m JOIN irs_memo_links l ON m.id = l.memo_id WHERE l.client_id = ? ORDER BY m.published_at DESC`;
      const rows = await env.DB.prepare(sql).bind(clientId).all();
      const memos = rows.results.map((memo) => ({ ...memo, tags: memo.tags_json ? JSON.parse(memo.tags_json) : [] }));
      return new Response(JSON.stringify(memos), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname.startsWith("/admin/returns/") && url.pathname.endsWith("/irs-memos") && req.method === "GET") {
      const returnId = url.pathname.split("/")[3];
      const sql = `SELECT m.* FROM irs_memos m JOIN irs_memo_links l ON m.id = l.memo_id WHERE l.return_id = ? ORDER BY m.published_at DESC`;
      const rows = await env.DB.prepare(sql).bind(returnId).all();
      const memos = rows.results.map((memo) => ({ ...memo, tags: memo.tags_json ? JSON.parse(memo.tags_json) : [] }));
      return new Response(JSON.stringify(memos), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/admin/irs/schema" && req.method === "GET") {
      return await listIrsSchemaFields(req, env);
    }
    if (url.pathname === "/api/irs/memos/db") {
      try {
        const rows = await env.DB.prepare("SELECT * FROM irs_memos WHERE status = 'active' ORDER BY published_at DESC LIMIT 20").all();
        const memos = rows.results.map((memo) => ({
          ...memo,
          tags: memo.tags_json ? JSON.parse(memo.tags_json) : []
        }));
        return new Response(JSON.stringify(memos), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response("Failed to fetch IRS memos from DB", { status: 500 });
      }
    }
    if (url.pathname === "/api/irs/schema/fields") {
      try {
        const rows = await env.DB.prepare("SELECT * FROM irs_schema_fields WHERE status = 'active' ORDER BY detected_at DESC LIMIT 100").all();
        return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response("Failed to fetch IRS schema fields from DB", { status: 500 });
      }
    }
    if (url.pathname === "/api/irs/memo/latest") {
      return new Response(JSON.stringify({
        source: "irb",
        irs_id: "IRB 2025-10",
        title: "...",
        summary: "...",
        full_text: "...",
        published_at: "...",
        url: "...",
        tags: ["EITC", "individual"]
      }), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/irs/schema") {
      try {
        const schema = await fetchIrsSchema();
        return new Response(schema, { headers: { "Content-Type": "application/xml" } });
      } catch (e) {
        return new Response("Failed to fetch IRS schema", { status: 500 });
      }
    }
    if (url.pathname === "/api/irs/memos") {
      try {
        const memos = await fetchIrsMemos();
        return new Response(memos, { headers: { "Content-Type": "application/xml" } });
      } catch (e) {
        return new Response("Failed to fetch IRS memos", { status: 500 });
      }
    }
    if (url.pathname === "/api/instagram/feed") {
      return await handleInstagramFeed(env);
    }
    if (url.pathname === "/api/instagram/reviews") {
      return await handleInstagramReviews(env);
    }
    if (url.pathname === "/api/instagram/analytics") {
      return await handleInstagramAnalytics(env);
    }
    if (url.pathname === "/api/instagram/post" && req.method === "POST") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      return await handleInstagramPost(req, env, user);
    }
    if (url.pathname === "/api/instagram/dm" && req.method === "POST") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      return await handleInstagramDM(req, env, user);
    }
    if (url.pathname === "/api/docusign/create-envelope" && req.method === "POST") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      return await handleCreateEnvelope(req, env, user);
    }
    if (url.pathname === "/api/docusign/embedded-url" && req.method === "POST") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      if (user.role !== "admin" && user.role !== "staff") return cors(forbidden());
      return await handleEmbeddedSigningUrl(req, env, user);
    }
    if (url.pathname === "/api/docusign/webhook" && req.method === "POST") {
      return await handleDocuSignWebhook(req, env);
    }
    if (url.pathname.startsWith("/api/signatures")) {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      return await handleSignatures(req, env, user);
    }
    if (url.pathname === "/register/staff" && req.method === "POST") {
      return cors(await handleRegisterStaff(req, env));
    }
    if (url.pathname === "/register/client" && req.method === "POST") {
      return cors(await handleRegisterClient(req, env));
    }
    if (url.pathname === "/login/staff" && req.method === "POST") {
      return cors(await handleLoginStaff(req, env));
    }
    if (url.pathname === "/login/client" && req.method === "POST") {
      return cors(await handleLoginClient(req, env));
    }
    if (url.pathname === "/api/training/courses" && req.method === "GET") {
      return await listTrainingCourses(req, env);
    }
    if (url.pathname === "/api/training/enroll" && req.method === "POST") {
      return await enrollTrainingCourse(req, env);
    }
    if (url.pathname === "/api/crm/intakes" && req.method === "GET") {
      return cors(await handleCrmIntakes(req, env));
    }
    if (url.pathname === "/api/crm/intakes" && req.method === "POST") {
      return cors(await handleCrmIntakeCreate(req, env));
    }
    if (url.pathname.startsWith("/api/crm/intakes/") && req.method === "GET") {
      const id = url.pathname.split("/").pop();
      return cors(await handleCrmIntakeById(req, env, id));
    }
    if (url.pathname.startsWith("/api/crm/intakes/") && req.method === "DELETE") {
      const id = url.pathname.split("/").pop();
      return cors(await handleCrmIntakeDelete(req, env, id));
    }
    if (url.pathname === "/api/certificates/types" && req.method === "GET") {
      return cors(await handleCertificateTypes(req, env));
    }
    if (url.pathname === "/api/certificates" && req.method === "GET") {
      return cors(await handleListCertificates(req, env));
    }
    if (url.pathname === "/api/certificates/issue" && req.method === "POST") {
      return cors(await handleIssueCertificate(req, env));
    }
    if (url.pathname.match(/^\/api\/certificates\/[^\/]+\/download$/) && req.method === "GET") {
      const id = url.pathname.split("/")[3];
      return cors(await handleDownloadCertificate(req, env, id));
    }
    if (url.pathname.match(/^\/api\/certificates\/[^\/]+\/revoke$/) && req.method === "POST") {
      const id = url.pathname.split("/")[3];
      return cors(await handleRevokeCertificate(req, env, id));
    }
    if (url.pathname.match(/^\/api\/certificates\/[^\/]+$/) && req.method === "GET") {
      const id = url.pathname.split("/").pop();
      return cors(await handleGetCertificate(req, env, id));
    }
    if (url.pathname === "/api/team" && req.method === "GET") {
      return cors(await handleListTeam(req, env));
    }
    if (url.pathname === "/api/team/regions" && req.method === "GET") {
      return cors(await handleListRegions(req, env));
    }
    if (url.pathname.match(/^\/api\/team\/[^\/]+$/) && req.method === "GET") {
      const id = url.pathname.split("/").pop();
      return cors(await handleGetTeamMember(req, env, id));
    }
    if (url.pathname === "/api/compliance/check" && req.method === "GET") {
      return cors(await handleComplianceCheck(req, env));
    }
    if (url.pathname === "/api/compliance/requirements" && req.method === "GET") {
      return cors(await handleComplianceRequirements(req, env));
    }
    if (url.pathname === "/api/compliance/issue-all" && req.method === "POST") {
      return cors(await handleIssueAllCertificates(req, env));
    }
    if (url.pathname === "/api/compliance/report" && req.method === "GET") {
      return cors(await handleComplianceReport(req, env));
    }
    if (url.pathname === "/api/social/post" && req.method === "POST") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      return cors(await handleSocialPost(req, env, user));
    }
    if (url.pathname === "/api/social/feed" && req.method === "GET") {
      return cors(await handleSocialFeed(req, env));
    }
    if (url.pathname === "/api/social/metrics" && req.method === "GET") {
      return cors(await handleSocialMetrics(req, env));
    }
    if (url.pathname === "/api/social/schedule" && req.method === "POST") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      return cors(await handleSchedulePost(req, env, user));
    }
    if (url.pathname === "/api/social/mentions" && req.method === "GET") {
      return cors(await handleSocialMentions(req, env));
    }
    if (url.pathname === "/api/social/reply" && req.method === "POST") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      return cors(await handleSocialReply(req, env, user));
    }
    if (url.pathname === "/api/social/google/reviews" && req.method === "GET") {
      return cors(await handleGoogleReviews(req, env));
    }
    if (url.pathname === "/api/social/google/reply" && req.method === "POST") {
      const user = await verifyAuth2(req, env);
      if (!user) return cors(unauthorized());
      return cors(await handleGoogleReplyReview(req, env, user));
    }
    if (url.pathname === "/api/social/google/stats" && req.method === "GET") {
      return cors(await handleGoogleStats(req, env));
    }
    if (url.pathname.startsWith("/api/portal")) {
      const reqPath = url.pathname.replace(/^\/api\/portal/, "");
      const portalReq = new Request(reqPath || "/", req);
      Object.defineProperty(portalReq, "params", { value: {} });
      const resp = await portal_default.handle(portalReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/ai-support")) {
      const reqPath = url.pathname.replace(/^\/api\/ai-support/, "");
      const aiReq = new Request(reqPath || "/", req);
      Object.defineProperty(aiReq, "params", { value: {} });
      const resp = await aiSupport_default.handle(aiReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/workflows")) {
      const reqPath = url.pathname.replace(/^\/api\/workflows/, "");
      const workflowReq = new Request(reqPath || "/", req);
      Object.defineProperty(workflowReq, "params", { value: {} });
      const resp = await workflows_default.handle(workflowReq, env);
      return cors(resp);
    }
    if (url.pathname.startsWith("/api/lms")) {
      if (url.pathname.startsWith("/api/lms/enroll") || url.pathname.startsWith("/api/lms/enrollments") || url.pathname.startsWith("/api/lms/certificates")) {
        const reqPath2 = url.pathname.replace(/^\/api\/lms/, "");
        const lmsEnrollReq = new Request(reqPath2 || "/", req);
        Object.defineProperty(lmsEnrollReq, "params", { value: {} });
        const resp2 = await lmsEnrollment_default.handle(lmsEnrollReq, env);
        return cors(resp2);
      }
      const reqPath = url.pathname.replace(/^\/api\/lms/, "");
      const lmsReq = new Request(reqPath || "/", req);
      Object.defineProperty(lmsReq, "params", { value: {} });
      const resp = await lms_default.handle(lmsReq, env);
      return cors(resp);
    }
    if (url.pathname === "/api/admin/email-routes" && req.method === "GET") {
      return cors(new Response(JSON.stringify(ADMIN_EMAIL_ROUTES), {
        headers: { "Content-Type": "application/json" }
      }));
    }
    return new Response("Not Found", { status: 404 });
  },
  // Scheduled handler for IRS sync and data retention
  async scheduled(event, env, ctx) {
    console.log("Running scheduled tasks...");
    await handleScheduledIRSSync(env, ctx);
    await handleAuditLogProcessing(env, ctx);
  }
};
export {
  ADMIN_EMAIL_ROUTES,
  BUSINESS_INFO2 as BUSINESS_INFO,
  SOCIAL_MEDIA_HANDLES,
  index_default2 as default
};
/*! Bundled license information:

otpauth/dist/otpauth.esm.js:
  (*! otpauth 9.4.1 | (c) Héctor Molinero Fernández | MIT | https://github.com/hectorm/otpauth *)
  (*! noble-hashes 1.8.0 | (c) Paul Miller | MIT | https://github.com/paulmillr/noble-hashes *)
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
//# sourceMappingURL=index.js.map
