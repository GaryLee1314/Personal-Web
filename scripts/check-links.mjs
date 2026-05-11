import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

const root = process.cwd();
const input = args.get("input") || "src/data/tools.json";
const output = args.get("output") || "reports/link-check.json";
const concurrency = Number(args.get("concurrency") || 8);
const timeoutMs = Number(args.get("timeout") || 12000);
const limit = Number(args.get("limit") || 0);
const strict = args.get("strict") === "true" || process.env.STRICT_LINK_CHECK === "true";

function flattenTools(data) {
  const tools = new Map();

  for (const category of data.categories || []) {
    for (const tool of category.tools || []) {
      if (tool?.url && /^https?:\/\//.test(tool.url)) {
        tools.set(tool.url, {
          id: tool.id || null,
          name: tool.name,
          url: tool.url,
          category: category.name,
        });
      }
    }
  }

  return [...tools.values()];
}

async function requestWithTimeout(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 link-checker; +https://tools.lishenghua.com/",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkTool(tool) {
  const started = Date.now();

  try {
    let response = await requestWithTimeout(tool.url, "HEAD");

    if ([403, 405, 406, 429].includes(response.status)) {
      await delay(150);
      response = await requestWithTimeout(tool.url, "GET");
    }

    const elapsedMs = Date.now() - started;
    const status = response.status;
    const finalUrl = response.url || tool.url;
    const ok = status >= 200 && status < 400;
    const severity = ok ? "ok" : status === 403 || status === 429 ? "warning" : "error";

    return {
      ...tool,
      ok,
      severity,
      status,
      finalUrl,
      elapsedMs,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ...tool,
      ok: false,
      severity: "error",
      status: null,
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
    };
  }
}

async function runPool(items, worker) {
  const results = [];
  let index = 0;

  async function runNext() {
    while (index < items.length) {
      const current = items[index++];
      const result = await worker(current);
      results.push(result);
      const mark = result.ok ? "OK" : result.severity === "warning" ? "WARN" : "FAIL";
      console.log(`${mark} ${result.status ?? "-"} ${result.name} ${result.url}`);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runNext));
  return results;
}

const data = JSON.parse(await fs.readFile(path.join(root, input), "utf8"));
const tools = flattenTools(data).slice(0, limit || undefined);
const results = await runPool(tools, checkTool);
const summary = {
  checkedAt: new Date().toISOString(),
  total: results.length,
  ok: results.filter((item) => item.ok).length,
  warnings: results.filter((item) => item.severity === "warning").length,
  errors: results.filter((item) => item.severity === "error").length,
};

const report = {
  summary,
  issues: results.filter((item) => !item.ok),
  results,
};

await fs.mkdir(path.dirname(path.join(root, output)), { recursive: true });
await fs.writeFile(path.join(root, output), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(summary, null, 2));

if (strict && summary.errors > 0) {
  process.exitCode = 1;
}
