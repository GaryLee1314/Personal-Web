# 李胜华工具箱

一个数据驱动的工具导航站，布局参考工具箱类导航站，内容来自本地 JSON。

## 常用命令

```bash
npm run crawl
npm run dev
npm run build
npm run pages:dev
```

## 修改内容

主要内容在：

```txt
src/data/tools.json
```

如果想重新导入外部页面数据，需要先确认你有权使用该数据源，然后指定来源：

```bash
$env:TOOLS_SOURCE_URL="https://example.com/"; npm run crawl
```

爬虫脚本在：

```txt
scripts/crawl.mjs
```

站点标题、分类、热门站点和工具直达都会从 JSON 渲染。

爬虫会把工具图标下载到本地：

```txt
public/icons/
```

`src/data/tools.json` 里只保存 `/icons/...` 路径，不会在页面里热链外部 CDN。

## 部署

运行：

```bash
npm run build
```

构建结果在 `dist/`，可以部署到 Cloudflare Pages、Vercel、Netlify、GitHub Pages 或任意静态服务器。

## 留言功能

留言功能使用 Cloudflare Pages Functions + D1。前端调用：

```txt
GET /api/comments
POST /api/comments
```

D1 建表脚本在：

```txt
migrations/0001_comments.sql
```

Cloudflare 初始化流程：

```bash
npm run d1:create
npm run d1:migrate:remote
```

`npm run d1:create` 会输出真实的 `database_id`。把它填到 `wrangler.toml` 的 `database_id`，或者在 Cloudflare Pages 控制台手动绑定同一个数据库。

然后在 Cloudflare Pages 项目的 Settings -> Functions -> D1 database bindings 中添加绑定：

```txt
Variable name: DB
Database: tools_comments
```

本地完整预览 Pages Functions：

```bash
npm run d1:migrate:local
npm run pages:dev
```

如果需要评论审核，在 Cloudflare Pages 环境变量中设置：

```txt
COMMENT_REVIEW_REQUIRED=true
```

默认不审核，评论提交后直接显示。
