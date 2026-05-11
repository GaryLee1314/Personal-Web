type Env = {
  DB: D1Database;
  COMMENT_REVIEW_REQUIRED?: string;
};

type CommentRow = {
  id: number;
  parent_id: number | null;
  author: string;
  url: string | null;
  text: string;
  created_at: string;
};

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });

const clean = (value: unknown, max = 500) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const cleanText = (value: unknown, max = 2000) =>
  String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, max);

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validateUrl(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 300) : "";
  } catch {
    return "";
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 30), 1), 100);
  const cursor = Math.max(Number(url.searchParams.get("cursor") || 0), 0);

  const result = await env.DB.prepare(
    `SELECT id, parent_id, author, url, text, created_at
     FROM comments
     WHERE status = 'approved'
     ORDER BY created_at DESC
     LIMIT ?1 OFFSET ?2`,
  )
    .bind(limit, cursor)
    .all<CommentRow>();

  return json({
    comments: result.results || [],
    nextCursor: (result.results || []).length === limit ? cursor + limit : null,
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return json({ error: "请求格式不正确" }, { status: 400 });
  }

  const author = clean(payload.author, 40);
  const email = clean(payload.email, 120).toLowerCase();
  const url = validateUrl(clean(payload.url, 300));
  const text = cleanText(payload.text, 1200);
  const parentId = Number(payload.parentId || 0) || null;
  const honeypot = clean(payload.website, 100);

  if (honeypot) {
    return json({ ok: true, message: "评论已提交" });
  }

  if (!author || !email || !text) {
    return json({ error: "称呼、邮箱和评论内容必填" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "邮箱格式不正确" }, { status: 400 });
  }

  if (text.length < 2) {
    return json({ error: "评论内容太短" }, { status: 400 });
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";
  const ipHash = await sha256(`${ip}:${email}`);
  const userAgent = clean(request.headers.get("user-agent"), 300);
  const status = env.COMMENT_REVIEW_REQUIRED === "true" ? "pending" : "approved";

  const inserted = await env.DB.prepare(
    `INSERT INTO comments (parent_id, author, email, url, text, status, ip_hash, user_agent)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
     RETURNING id, parent_id, author, url, text, created_at`,
  )
    .bind(parentId, author, email, url || null, text, status, ipHash, userAgent)
    .first<CommentRow>();

  return json(
    {
      ok: true,
      status,
      message: status === "pending" ? "评论已提交，审核后显示" : "评论已发布",
      comment: status === "approved" ? inserted : null,
    },
    { status: 201 },
  );
};
