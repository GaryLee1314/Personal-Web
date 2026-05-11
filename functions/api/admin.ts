type Env = {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
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

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  // 校验管理员密码
  const authHeader = request.headers.get("Authorization");
  const expectedPassword = env.ADMIN_PASSWORD;
  
  // 如果环境变量里没有配置密码，或者前端传来的密码不对，则拒绝访问
  if (!expectedPassword || authHeader !== expectedPassword) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);

    if (url.searchParams.get("view") === "analytics") {
      const top = await env.DB.prepare(
        `SELECT
           tool_key,
           MAX(tool_id) AS tool_id,
           MAX(name) AS name,
           MAX(url) AS url,
           SUM(count) AS count,
           MAX(updated_at) AS last_clicked_at
         FROM tool_click_daily
         GROUP BY tool_key
         ORDER BY count DESC, last_clicked_at DESC
         LIMIT 50`,
      ).all();

      const daily = await env.DB.prepare(
        `SELECT date, tool_id, name, url, count, updated_at
         FROM tool_click_daily
         ORDER BY date DESC, count DESC, updated_at DESC
         LIMIT 200`,
      ).all();

      return json({
        top: top.results || [],
        daily: daily.results || [],
      });
    }

    // 获取最新 100 条留言（包含所有状态）
    const { results } = await env.DB.prepare(
      `SELECT * FROM comments ORDER BY created_at DESC LIMIT 100`
    ).all();
    return json({ comments: results || [] });
  }

  if (request.method === "PATCH") {
    // 修改留言状态 (例如: approved / pending)
    const { id, status } = await request.json() as any;
    if (!id || !status) return json({ error: "Missing fields" }, { status: 400 });
    
    await env.DB.prepare(
      `UPDATE comments SET status = ?1 WHERE id = ?2`
    ).bind(status, id).run();
    return json({ ok: true });
  }

  if (request.method === "DELETE") {
    // 永久删除留言
    const { id } = await request.json() as any;
    if (!id) return json({ error: "Missing id" }, { status: 400 });
    
    await env.DB.prepare(
      `DELETE FROM comments WHERE id = ?1`
    ).bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};
