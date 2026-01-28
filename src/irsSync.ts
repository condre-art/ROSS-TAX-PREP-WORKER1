import { v4 as uuid } from "uuid";

export interface Env {
  DB: D1Database;
}

async function upsertMemo(env: Env, memo: {
  source: string;
  irs_id?: string;
  title: string;
  summary?: string;
  full_text?: string;
  url?: string;
  tags?: string[];
  published_at?: string;
  status?: string;
}) {
  const id = uuid();
  const tags_json = JSON.stringify(memo.tags ?? []);

  // Upsert by (source, irs_id, title)
  await env.DB.prepare(
    `INSERT INTO irs_memos (id, source, irs_id, title, summary, full_text, url, tags_json, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 'active'), ?)
     ON CONFLICT(id) DO NOTHING`
  ).bind(
    id,
    memo.source,
    memo.irs_id ?? null,
    memo.title,
    memo.summary ?? null,
    memo.full_text ?? null,
    memo.url ?? null,
    tags_json,
    memo.status ?? "active",
    memo.published_at ?? null
  ).run();
}

/** Fetch IRS Newsroom (example: RSS or HTML) */
async function syncNewsroom(env: Env) {
  const res = await fetch("https://www.irs.gov/newsroom"); // you’ll likely parse HTML or RSS
  const html = await res.text();

  // TODO: parse HTML/RSS → items[]
  const items: Array<{
    irs_id?: string;
    title: string;
    summary?: string;
    url?: string;
    published_at?: string;
    tags?: string[];
  }> = []; // fill from parser

  for (const item of items) {
    await upsertMemo(env, {
      source: "newsroom",
      ...item,
    });
  }
}

/** Fetch IRB index and entries */
async function syncIRB(env: Env) {
  const res = await fetch("https://www.irs.gov/irb"); // index page
  const html = await res.text();

  // TODO: parse IRB issues and entries
  const items: Array<{
    irs_id: string;       // e.g. "IRB 2025-10"
    title: string;
    summary?: string;
    url?: string;
    published_at?: string;
    tags?: string[];
  }> = [];

  for (const item of items) {
    await upsertMemo(env, {
      source: "irb",
      ...item,
    });
  }
}

/** Fetch transcript-related docs / schema pages */
async function syncTranscriptDocs(env: Env) {
  const res = await fetch("https://www.irs.gov/individuals/tax-return-transcripts"); // example
  const html = await res.text();

  // TODO: parse for schema fields or link to PDFs you process offline
  // Option: just create memos tagged 'transcript' for now
  const items: Array<{
    title: string;
    summary?: string;
    url?: string;
    published_at?: string;
    tags?: string[];
  }> = [];

  for (const item of items) {
    await upsertMemo(env, {
      source: "schema",
      ...item,
    });
  }
}

export default {
  // Cron trigger in wrangler.toml: "0 * * * *" (hourly)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(syncNewsroom(env));
    ctx.waitUntil(syncIRB(env));
    ctx.waitUntil(syncTranscriptDocs(env));
  },
};
