import * as cheerio from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_URL = process.env.TOOLS_SOURCE_URL;
const OUT_FILE = new URL("../src/data/tools.json", import.meta.url);
const ICON_DIR = new URL("../public/icons/", import.meta.url);

if (!SOURCE_URL) {
  throw new Error("Set TOOLS_SOURCE_URL to an authorized tools directory source before running this script.");
}

const clean = (value = "") => value.replace(/\s+/g, " ").trim();
const iconDownloads = new Map();

const iconPool = [
  "Video",
  "Sparkles",
  "Music",
  "BookOpen",
  "Gamepad2",
  "Image",
  "Wrench",
  "Box",
];

function absoluteUrl(url) {
  if (!url) return "";
  return new URL(url, SOURCE_URL).toString();
}

function genericDesc(name) {
  return name ? `快速访问 ${name}` : "";
}

function isSourceOwnedUrl(url) {
  if (!url) return false;
  try {
    return new URL(url).hostname.endsWith("liumingye.cn");
  } catch {
    return false;
  }
}

function iconExtension(url, contentType = "") {
  const fromType = contentType.split(";")[0].trim().toLowerCase();
  const typeMap = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
  };

  if (typeMap[fromType]) return typeMap[fromType];

  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico"].includes(ext) ? ext : ".png";
  } catch {
    return ".png";
  }
}

function iconFileName(id, name, url, ext) {
  const base = clean(id || name || url)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return `${base || "tool"}${ext}`;
}

async function localizeIcon(remoteUrl, id, name) {
  if (!remoteUrl) return "";
  const url = absoluteUrl(remoteUrl);
  if (!/^https?:\/\//i.test(url)) return "";

  const key = `${id || name || ""}:${url}`;
  if (iconDownloads.has(key)) return iconDownloads.get(key);

  const task = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
          accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });
      if (!response.ok) return "";

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) return "";

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length || bytes.length > 512 * 1024) return "";

      await mkdir(ICON_DIR, { recursive: true });
      const ext = iconExtension(url, contentType);
      const filename = iconFileName(id, name, url, ext);
      await writeFile(new URL(filename, ICON_DIR), bytes);
      return `/icons/${filename}`;
    } catch {
      return "";
    }
  })();

  iconDownloads.set(key, task);
  return task;
}

function parseSidebar($) {
  return $(".aside-menu > .menu-item")
    .map((index, item) => {
      const $item = $(item);
      return {
        name: clean($item.children("a").find(".menu-text").first().text()),
        icon: iconPool[index] ?? "Folder",
        children: $item
          .find(".sub-menu .menu-item .menu-text")
          .map((_, child) => clean($(child).text()))
          .get()
          .filter(Boolean),
      };
    })
    .get()
    .filter((item) => item.name);
}

function parseHotSites($) {
  return $(".hot-rank .list-item")
    .map((_, item) => {
      const $item = $(item);
      const $link = $item.find("a.list-goto").first();
      const title = clean($item.find(".list-title").text());
      const [name, ...descParts] = title.split(" - ");
      return {
        name: clean(name),
        desc: clean(descParts.join(" - ") || $link.attr("title") || ""),
        url: absoluteUrl($link.attr("href")),
      };
    })
    .get()
    .filter((item) => item.name && item.url && !isSourceOwnedUrl(item.url));
}

function parseDirectTools($) {
  return $(".tool-direct .index-sudoku .list-item")
    .map((_, item) => {
      const $item = $(item);
      const $link = $item.find("a.list-goto").first();
      const iconClass = clean($item.find("i").attr("class") || "");
      const style = clean($item.find(".btn-icon").attr("style") || "");
      return {
        name: clean($item.find(".text-sm").text()),
        url: absoluteUrl($link.attr("href")),
        iconClass,
        color: style.replace(/^background:\s*/i, "").replace(/;$/, ""),
      };
    })
    .get()
    .filter((item) => item.name && item.url && !isSourceOwnedUrl(item.url));
}

async function fetchCategoryGroup(mid) {
  const url = new URL("api", SOURCE_URL);
  url.searchParams.set("event", "category");
  url.searchParams.set("mid", mid);

  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      accept: "application/json,text/plain,*/*",
    },
  });

  if (!response.ok) return [];

  const json = await response.json();
  if (json.status !== "success" || !Array.isArray(json.data)) return [];

  const sourceItems = json.data
    .map((item) => {
      const name = clean(item.title || "");
      const id = String(item.cid || "");
      const url = absoluteUrl(item.url || item.permalink);
      return { id, name, url, logo: item.logo };
    })
    .filter((item) => item.name && item.url && !isSourceOwnedUrl(item.url));

  return Promise.all(
    sourceItems.map(async (item) => {
      const icon = await localizeIcon(item.logo, item.id, item.name);
      return {
        id: item.id,
        name: item.name,
        desc: genericDesc(item.name),
        url: item.url,
        ...(icon ? { icon } : {}),
      };
    }),
  );
}

function dedupeTools(groups) {
  const seen = new Set();
  const tools = [];

  for (const group of groups) {
    for (const tool of group.tools) {
      const key = tool.id || `${tool.name}-${tool.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      tools.push(tool);
    }
  }

  return tools;
}

async function parseCategories($, sidebarItems) {
  const cards = $("main .card[id^='c-']").get();

  return Promise.all(
    cards.map(async (card, cardIndex) => {
      const $card = $(card);
      const id = $card.attr("id") || `c-${cardIndex + 1}`;
      const header = clean($card.children(".card-header").find(".h4").first().text());
      const sidebar = sidebarItems.find((item) => item.name === header);
      const tabNodes = $card.find(".card-header .card-tab .nav-link").get();
      const tabs = tabNodes
        .map((tab) => ({
          name: clean($(tab).text()),
          mid: clean($(tab).attr("data-mid") || ""),
        }))
        .filter((tab) => tab.name);
      const fallbackTabs = $card
        .find(".card-header .card-tab .nav-link")
        .map((_, tab) => clean($(tab).text()))
        .get()
        .filter(Boolean);
      const fallbackSourceTools = $card
        .find(".card-body > .row > div[title]")
        .get()
        .map((wrapper) => {
          const $wrapper = $(wrapper);
          const $link = $wrapper.find("a.list-item").first();
          const $img = $wrapper.find("img").first();
          const id = clean($link.attr("cid") || "");
          const name = clean($link.find(".list-title").text());
          return {
            id,
            name,
            url: absoluteUrl($link.attr("href")),
            logo: $img.attr("data-src") || $img.attr("src"),
          };
        })
        .filter((item) => item.name && item.url && !isSourceOwnedUrl(item.url));
      const fallbackTools = await Promise.all(
        fallbackSourceTools.map(async (item) => {
          const icon = await localizeIcon(item.logo, item.id, item.name);
          return {
            id: item.id,
            name: item.name,
            desc: genericDesc(item.name),
            url: item.url,
            ...(icon ? { icon } : {}),
          };
        }),
      );
      const apiGroups = await Promise.all(
        tabs.map(async (tab) => {
          const tools = tab.mid ? await fetchCategoryGroup(tab.mid) : [];
          return {
            name: tab.name,
            mid: tab.mid,
            tools: tools.length ? tools : fallbackTools,
          };
        }),
      );
      const groups = apiGroups.length
        ? apiGroups
        : [
            {
              name: fallbackTabs[0] || header,
              mid: "",
              tools: fallbackTools,
            },
          ];

      return {
        id,
        name: header,
        icon: sidebar?.icon ?? iconPool[cardIndex] ?? "Folder",
        tabs: tabs.length ? tabs.map((tab) => tab.name) : sidebar?.children ?? [],
        groups,
        tools: dedupeTools(groups),
      };
    }),
  ).then((items) => items.filter((item) => item.name && item.tools.length));
}

const response = await fetch(SOURCE_URL, {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
  },
});

if (!response.ok) {
  throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
}

const html = await response.text();
const $ = cheerio.load(html);
const sidebar = parseSidebar($);
const categories = await parseCategories($, sidebar);
const crawledTools = dedupeTools(categories.map((category) => ({ tools: category.tools })));

const data = {
  crawledAt: new Date().toISOString(),
  site: {
    title: "李胜华工具箱",
    footer: "© 2026 李胜华工具箱",
  },
  hotSites: crawledTools.slice(0, 6),
  directTools: parseDirectTools($),
  categories,
};

await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(OUT_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");

console.log(
  `Crawled ${data.categories.length} categories, ${data.categories.reduce(
    (sum, item) => sum + item.tools.length,
    0,
  )} tools, ${data.directTools.length} shortcuts.`,
);
