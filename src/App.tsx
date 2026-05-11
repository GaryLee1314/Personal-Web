import { useEffect, useMemo, useState, type FormEvent } from "react";
import rawData from "./data/tools.json";
import { categoryIcons, directIcons, uiIcons } from "./icons";
import type { Category, SiteLink, ToolsData } from "./types";

const data = rawData as ToolsData;
const HISTORY_KEY = "lishenghua-tools-history";
const allTools = Array.from(
  new Map(
    data.categories
      .flatMap((category) => category.tools)
      .map((tool) => [tool.id || `${tool.name}-${tool.url}`, tool]),
  ).values(),
);
const toolLookup = new Map<string, SiteLink>();
allTools.forEach((tool) => {
  if (tool.id) toolLookup.set(tool.id, tool);
  toolLookup.set(tool.url, tool);
});

type CommentItem = {
  id: number;
  parent_id: number | null;
  author: string;
  url: string | null;
  text: string;
  created_at: string;
};

type ToolTrend = {
  tool_id: string | null;
  url: string;
  name: string;
  count: number;
};

type RankedSite = SiteLink & {
  clicks?: number;
};

type RankPeriod = "day" | "week";

function readHistory(): SiteLink[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(site: SiteLink) {
  const next = [site, ...readHistory().filter((item) => item.url !== site.url)].slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function trackToolOpen(site: SiteLink) {
  const payload = JSON.stringify({
    id: site.id || null,
    name: site.name,
    url: site.url,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/tool-events", blob);
    return;
  }

  fetch("/api/tool-events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = theme === "system" ? (systemDark ? "dark" : "light") : theme;
    };

    localStorage.setItem("theme", theme);
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return { theme, setTheme };
}

function SiteLogo() {
  return (
    <a href="#top" className="brand" aria-label={data.site.title}>
      <span className="brand-mark">
        <img src="/favicon.png" alt="" />
      </span>
      <span className="brand-text">
        <strong>{data.site.title}</strong>
        <small>Tools Navigator</small>
      </span>
    </a>
  );
}

function Sidebar() {
  return (
    <aside className="site-aside">
      <SiteLogo />
      <div className="aside-summary">
        <span>{allTools.length} 站点</span>
        <span>{data.categories.length} 分类</span>
      </div>
      <nav className="aside-menu" aria-label="分类导航">
        {data.categories.map((category) => {
          const Icon = categoryIcons[category.icon] ?? categoryIcons.Folder;
          return (
            <a className="aside-item" href={`#${category.id}`} key={category.id}>
              <span className="aside-main">
                <Icon size={16} />
                {category.name}
              </span>
              <span className="aside-children">{category.tabs.slice(0, 3).join(" / ")}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

function DashboardIntro({ totals }: { totals: number }) {
  return (
    <section className="dashboard-intro" id="top">
      <div>
        <p className="eyebrow">Tools Directory</p>
        <h1>李胜华工具箱</h1>
      </div>
      <div className="dashboard-stats" aria-label="站点统计">
        <span>
          <strong>{data.categories.length}</strong>
          分类
        </span>
        <span>
          <strong>{totals}</strong>
          站点
        </span>
        <span>
          <strong>{new Date(data.crawledAt).toLocaleDateString("zh-CN")}</strong>
          更新
        </span>
      </div>
    </section>
  );
}

function Header({
  theme,
  setTheme,
  history,
  categories,
}: {
  theme: string;
  setTheme: (value: string) => void;
  history: SiteLink[];
  categories: Category[];
}) {
  const [openCategories, setOpenCategories] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [openTheme, setOpenTheme] = useState(false);
  const Clock = uiIcons.Clock3;
  const Menu = uiIcons.Menu;
  const Moon = uiIcons.Moon;
  const Sun = uiIcons.Sun;

  return (
    <header className="site-header">
      <div className="mobile-brand">
        <SiteLogo />
      </div>
      <nav className="top-links" aria-label="页面链接">
        <a href="#message">留言</a>
      </nav>
      <div className="header-actions">
        <div className="dropdown-wrap mobile-category-wrap">
          <button
            className="icon-btn"
            type="button"
            title="分类导航"
            aria-label="分类导航"
            aria-expanded={openCategories}
            onClick={() => setOpenCategories(!openCategories)}
          >
            <Menu size={18} />
          </button>
          {openCategories && (
            <div className="dropdown-menu category-menu">
              <div className="dropdown-title">分类导航</div>
              {categories.map((category) => {
                const Icon = categoryIcons[category.icon] ?? categoryIcons.Folder;
                return (
                  <a href={`#${category.id}`} key={category.id} onClick={() => setOpenCategories(false)}>
                    <Icon size={15} />
                    <span>{category.name}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
        <div className="dropdown-wrap">
          <button className="icon-btn" type="button" title="更换主题" onClick={() => setOpenTheme(!openTheme)}>
            {theme === "light" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {openTheme && (
            <div className="dropdown-menu theme-menu">
              <button type="button" className={theme === "system" ? "active" : ""} onClick={() => setTheme("system")}>
                跟随系统
              </button>
              <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}>
                深色模式
              </button>
              <button type="button" className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}>
                浅色模式
              </button>
            </div>
          )}
        </div>
        <div className="dropdown-wrap">
          <button
            className="icon-btn"
            type="button"
            title="浏览历史"
            onClick={() => setOpenHistory(!openHistory)}
          >
            <Clock size={18} />
          </button>
          {openHistory && (
            <div className="dropdown-menu history-menu">
              <div className="dropdown-title">浏览历史</div>
              {history.length ? (
                history.map((item) => (
                  <a href={item.url} target="_blank" rel="noreferrer" key={item.url}>
                    {item.name}
                  </a>
                ))
              ) : (
                <span className="empty">暂无记录</span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchPanel({ onOpen }: { onOpen: (site: SiteLink) => void }) {
  const [keyword, setKeyword] = useState("");
  const SearchIcon = uiIcons.Search;
  const query = keyword.trim().toLowerCase();
  const results = query
    ? allTools
        .filter((tool) => `${tool.name} ${tool.desc}`.toLowerCase().includes(query))
        .slice(0, 24)
    : [];

  return (
    <section className="search-card" id="search">
      <div className="search-tabs">
        <span className="search-scope">
          <SearchIcon size={14} />
          全部工具
        </span>
      </div>
      <div className="search-form">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索工具、站点或关键词"
        />
      </div>
      {query && (
        <div className="search-results">
          {results.length ? (
            results.map((site) => (
              <ToolCard site={site} onOpen={onOpen} key={`search-${site.url}-${site.name}`} />
            ))
          ) : (
            <div className="no-results">没有匹配的工具</div>
          )}
        </div>
      )}
    </section>
  );
}

function HotSites({
  sites,
  period,
  onPeriodChange,
  onOpen,
}: {
  sites: RankedSite[];
  period: RankPeriod;
  onPeriodChange: (period: RankPeriod) => void;
  onOpen: (site: SiteLink) => void;
}) {
  return (
    <section className="panel hot-panel">
      <div className="rank-header">
        <h2>热门排行</h2>
        <div className="rank-period" aria-label="排行周期">
          <button type="button" className={period === "day" ? "active" : ""} onClick={() => onPeriodChange("day")}>
            今日
          </button>
          <button type="button" className={period === "week" ? "active" : ""} onClick={() => onPeriodChange("week")}>
            本周
          </button>
        </div>
      </div>
      <div className="rank-list">
        {sites.map((site, index) => (
          <a href={site.url} target="_blank" rel="noreferrer" onClick={() => onOpen(site)} key={site.url}>
            <span className="rank-number">{index + 1}</span>
            <span className="recommend-icon">
              {site.icon ? <img src={site.icon} alt="" loading="lazy" /> : site.name.slice(0, 1)}
            </span>
            <span>
              <strong>{site.name}</strong>
              <small>{site.desc}</small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function DirectTools() {
  const Paperclip = uiIcons.Paperclip;
  return (
    <section className="panel direct-panel">
      <h2>
        <Paperclip size={18} />
        工具直达
      </h2>
      <div className="shortcut-grid">
        {data.directTools.map((tool) => {
          const Icon = directIcons[tool.name] ?? categoryIcons.Wrench;
          return (
            <a href={tool.url} target="_blank" rel="noreferrer" className="shortcut" key={tool.name}>
              <span className="shortcut-icon" style={{ background: tool.color || "#3b82f6" }}>
                <Icon size={20} />
              </span>
              <span>{tool.name}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function ToolCard({ site, onOpen }: { site: SiteLink; onOpen: (site: SiteLink) => void }) {
  return (
    <a className="tool-card" href={site.url} target="_blank" rel="noreferrer" title={site.desc} onClick={() => onOpen(site)}>
      <span className="tool-icon">
        {site.icon ? <img src={site.icon} alt="" loading="lazy" /> : site.name.slice(0, 1)}
      </span>
      <span className="tool-body">
        <strong>{site.name}</strong>
        <small>{site.desc}</small>
      </span>
    </a>
  );
}

function CategorySection({ category, onOpen }: { category: Category; onOpen: (site: SiteLink) => void }) {
  const Icon = categoryIcons[category.icon] ?? categoryIcons.Folder;
  const [activeIndex, setActiveIndex] = useState(0);
  const activeGroup = category.groups[activeIndex] ?? category.groups[0];
  const tools = activeGroup?.tools.length ? activeGroup.tools : category.tools;

  return (
    <section className="panel category-panel" id={category.id}>
      <div className="panel-header">
        <h2>
          <Icon size={18} />
          {category.name}
        </h2>
        <div className="section-tabs">
          {(category.groups.length ? category.groups : category.tabs.map((tab) => ({ name: tab }))).map((tab, index) => (
            <button
              type="button"
              className={index === activeIndex ? "active" : ""}
              onClick={() => setActiveIndex(index)}
              key={`${category.id}-${tab.name}`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      <div className="tools-grid">
        {tools.map((site) => (
          <ToolCard site={site} onOpen={onOpen} key={`${category.id}-${site.url}-${site.name}`} />
        ))}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function CommentsSection() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [form, setForm] = useState({
    author: "",
    email: "",
    url: "",
    text: "",
    website: "",
  });

  async function loadComments(nextCursor = 0) {
    setLoading(true);
    setMessage({ text: "", type: "info" });

    try {
      const response = await fetch(`/api/comments?limit=10&cursor=${nextCursor}`);
      if (!response.ok) throw new Error("load failed");
      const payload = await response.json();
      setComments((current) => (nextCursor === 0 ? payload.comments : [...current, ...payload.comments]));
      setCursor(payload.nextCursor);
    } catch {
      setMessage({ text: "本地 Vite 预览不会连接 D1；部署到 Cloudflare 或使用 npm run pages:dev 后可用。", type: "info" });
      setCursor(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, []);

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "info" });

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          parentId: replyTo?.id || null,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "提交失败");
      }

      setMessage({ text: payload.message || "评论已提交", type: "success" });
      setForm((current) => ({ ...current, text: "", website: "" }));
      setReplyTo(null);

      if (payload.comment) {
        setComments((current) => [payload.comment, ...current]);
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "提交失败，请稍后再试", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="message-section" id="message">
      <article className="panel message-intro">
        <h1>留言</h1>
        <p>有想推荐的工具、失效链接或改进建议，可以在这里留言。</p>
      </article>
      <section className="panel comments-panel">
        <div className="comments-header">
          <h2>评论</h2>
          <span>{comments.length ? `${comments.length} 条` : "暂无评论"}</span>
        </div>
        <form className="comment-form" onSubmit={submitComment}>
          <div className="comment-form-grid">
            <input
              value={form.author}
              onChange={(event) => setForm({ ...form, author: event.target.value })}
              placeholder="称呼"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="邮箱"
              required
            />
            <input
              type="url"
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              placeholder="网址（选填）"
            />
          </div>
          <input
            className="hidden-field"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => setForm({ ...form, website: event.target.value })}
            placeholder="website"
          />
          {replyTo && (
            <div className="reply-banner">
              正在回复 {replyTo.author}
              <button type="button" onClick={() => setReplyTo(null)}>
                取消回复
              </button>
            </div>
          )}
          <textarea
            value={form.text}
            onChange={(event) => setForm({ ...form, text: event.target.value })}
            placeholder="输入评论内容..."
            rows={5}
            required
          />
          <div className="comment-actions">
            <span className={`msg-badge ${message.type}`} data-show={!!message.text}>{message.text}</span>
            <button type="submit" disabled={loading}>
              {loading ? "提交中..." : "发表评论"}
            </button>
          </div>
        </form>
        <div className="comment-list">
          {comments.map((comment) => (
            <article className="comment-item" id={`comment-${comment.id}`} key={comment.id}>
              <div className="comment-avatar">{comment.author.slice(0, 1).toUpperCase()}</div>
              <div className="comment-body">
                <div className="comment-meta">
                  <strong>
                    {comment.url ? (
                      <a href={comment.url} target="_blank" rel="noreferrer">
                        {comment.author}
                      </a>
                    ) : (
                      comment.author
                    )}
                  </strong>
                  <time>{formatDate(comment.created_at)}</time>
                </div>
                <p>{comment.text}</p>
                <button type="button" onClick={() => setReplyTo(comment)}>
                  回复
                </button>
              </div>
            </article>
          ))}
        </div>
        {cursor !== null && (
          <div className="load-more">
            <button type="button" onClick={() => loadComments(cursor)} disabled={loading}>
              加载更多
            </button>
          </div>
        )}
      </section>
    </section>
  );
}

function Footer() {
  return (
    <>
      <footer className="site-footer">{data.site.footer}</footer>
    </>
  );
}

export default function App() {
  const { theme, setTheme } = useTheme();
  const [history, setHistory] = useState<SiteLink[]>([]);
  const [rankPeriod, setRankPeriod] = useState<RankPeriod>("week");
  const [hotSites, setHotSites] = useState<RankedSite[]>(data.hotSites);
  const totals = useMemo(
    () => data.categories.reduce((sum, category) => sum + category.tools.length, 0),
    [],
  );

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadHotSites() {
      try {
        const days = rankPeriod === "day" ? 1 : 7;
        const response = await fetch(`/api/tool-events?limit=6&days=${days}`);
        if (!response.ok) return;
        const payload = await response.json();
        const items = Array.isArray(payload.items) ? (payload.items as ToolTrend[]) : [];
        const next: RankedSite[] = [];
        items.forEach((item) => {
          const tool = toolLookup.get(item.tool_id || "") || toolLookup.get(item.url);
          if (tool) {
            next.push({ ...tool, clicks: Number(item.count || 0) });
          }
        });

        if (!ignore && next.length) {
          setHotSites(next);
        } else if (!ignore) {
          setHotSites(data.hotSites);
        }
      } catch {
        // Local Vite previews do not expose Pages Functions; keep static recommendations.
        if (!ignore) {
          setHotSites(data.hotSites);
        }
      }
    }

    loadHotSites();
    return () => {
      ignore = true;
    };
  }, [rankPeriod]);

  function handleOpen(site: SiteLink) {
    saveHistory(site);
    setHistory(readHistory());
    trackToolOpen(site);
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="site-wrapper">
        <Header theme={theme} setTheme={setTheme} history={history} categories={data.categories} />
        <main className="site-main">
          <DashboardIntro totals={totals} />
          <SearchPanel onOpen={handleOpen} />
          <div className="main-layout">
            <div className="main-content">
              <div className="top-grid">
                <HotSites sites={hotSites} period={rankPeriod} onPeriodChange={setRankPeriod} onOpen={handleOpen} />
                <DirectTools />
              </div>
              {data.categories.map((category) => (
                <CategorySection category={category} onOpen={handleOpen} key={category.id} />
              ))}
              <CommentsSection />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
