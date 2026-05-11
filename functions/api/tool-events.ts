type Env = {
  DB: D1Database;
};

type TrendRow = {
  tool_key: string;
  tool_id: string | null;
  name: string;
  url: string;
  count: number;
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

const clean = (value: unknown, max = 300) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function validateUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 500) : "";
  } catch {
    return "";
  }
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return json({ error: "请求格式不正确" }, { status: 400 });
  }

  const toolId = clean(payload.id, 80);
  const name = clean(payload.name, 120);
  const url = validateUrl(clean(payload.url, 500));

  if (!name || !url) {
    return json({ error: "工具名称和网址必填" }, { status: 400 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const toolKey = toolId || (await sha256(url));

  await env.DB.prepare(
    `INSERT INTO tool_click_daily (date, tool_key, tool_id, name, url, count)
     VALUES (?1, ?2, ?3, ?4, ?5, 1)
     ON CONFLICT(date, tool_key) DO UPDATE SET
       count = count + 1,
       name = excluded.name,
       url = excluded.url,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  )
    .bind(date, toolKey, toolId || null, name, url)
    .run();

  return json({ ok: true });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 6), 1), 20);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") || 14), 1), 90);
  const cutoff = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { results } = await env.DB.prepare(
    `SELECT
       tool_key,
       MAX(tool_id) AS tool_id,
       MAX(name) AS name,
       MAX(url) AS url,
       SUM(count) AS count
     FROM tool_click_daily
     WHERE date >= ?1
     GROUP BY tool_key
     ORDER BY count DESC, name ASC
     LIMIT ?2`,
  )
    .bind(cutoff, limit)
    .all<TrendRow>();

  return json({ items: results || [] });
};
