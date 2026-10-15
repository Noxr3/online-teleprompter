# Dokki Prompter

A clean, private teleprompter for talks, pitches and recordings. Write your script, press **Start**, and read from one line.

**简体中文** · [English](#english)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDokki-lab%2Fdokki-prompter&project-name=dokki-prompter&repository-name=dokki-prompter)

---

## 简体中文

一个干净、私密的网页提词器。写好讲稿，点「开始提词」，眼睛只看一条阅读线。

- **写法只有三条**：`## 标题` 开始新的一页；其余每一行是一句话；`**文字**` 是重音，在提词时高亮。
- **按讲话速度滚动**：语速按「字/分」（英文按「词/分」）设置，每一行按自己的字数决定停留多久，长句短句节奏一致。
- **按时长倒推语速**：在底部填「讲完约 N 分钟」，语速自动换算；左侧大纲标出每一页的开讲时间。
- **提词模式**：阅读线、已读变暗、重音高亮、翻页、调速、调字号、镜像（提词玻璃）、全屏、播放时屏幕常亮。
- **完全在浏览器里运行**：没有服务器、没有账号、没有统计。讲稿自动保存在本机，可导入 / 导出 Markdown，也可以直接把 `.md` 文件拖进页面。
- 跟随系统的浅色 / 深色模式，支持手机；界面有简体中文和英文。

### 快捷键

| 场景 | 按键 | 作用 |
|---|---|---|
| 编辑 | `⌘/Ctrl + Enter` | 从光标所在的页开始提词 |
| 编辑 | `⌘/Ctrl + S` | 立即保存到本机 |
| 提词 | `空格` | 开始 / 暂停 |
| 提词 | `←` `→` | 上一页 / 下一页 |
| 提词 | `↑` `↓` | 语速 ±10 |
| 提词 | `+` `−` | 字号 |
| 提词 | `M` / `F` | 镜像 / 全屏 |
| 提词 | `Esc` | 回到编辑 |

### 部署

这是一个纯静态网站：`public/` 目录就是全部内容，没有构建步骤，也没有依赖。

- **Vercel**：点上面的 *Deploy with Vercel*，或者在 Vercel 导入这个仓库，不用改任何设置（`vercel.json` 已指定输出目录 `public`）。
- **其他静态托管**（GitHub Pages、Cloudflare Pages、Netlify、Nginx……）：把 `public/` 目录发布出去即可。

### 本地开发

需要 Node.js 20 或更新版本。

```bash
npm run dev     # http://localhost:5173
npm test        # 讲稿格式与计时的单元测试
```

代码结构：

```
public/
  index.html
  src/format.js   讲稿格式解析、字数与时长（纯函数，有测试）
  src/stage.js    提词模式：阅读线、滚动、键盘
  src/app.js      编辑界面、保存、导入导出
  src/i18n.js     界面文字与示例讲稿（简体中文 / English）
  src/styles.css  Dokki Fusion 设计 token
tests/            node:test 单元测试
scripts/serve.js  零依赖的本地开发服务器
```

---

## English

A clean, private teleprompter in your browser. Write the script, press **Start**, and keep your eyes on one reading line.

- **Three rules to write a script**: `## Title` starts a new page; every other line is one thing you say; `**words**` are stressed and highlighted on stage.
- **Paced like speech**: set the pace in words per minute (characters per minute for Chinese, Japanese and Korean). Each line stays on the reading line in proportion to what's in it, so short and long lines read at the same pace.
- **Work back from a time limit**: type how many minutes the talk should run and the pace follows. The outline shows when each page starts.
- **Stage**: reading line, dimmed past lines, stress highlights, page jumps, pace and text size controls, mirror mode for beam-splitter glass, full screen, and the screen stays awake while playing.
- **Runs entirely in your browser**: no server, no account, no analytics. The script saves to this device automatically; import and export Markdown, or drop a `.md` file onto the page.
- Follows your light or dark system setting, works on phones, and speaks Simplified Chinese and English.

### Keyboard

| Where | Keys | Does |
|---|---|---|
| Editor | `⌘/Ctrl + Enter` | Start from the page your cursor is on |
| Editor | `⌘/Ctrl + S` | Save to this device now |
| Stage | `Space` | Play / pause |
| Stage | `←` `→` | Previous / next page |
| Stage | `↑` `↓` | Pace ±10 |
| Stage | `+` `−` | Text size |
| Stage | `M` / `F` | Mirror / full screen |
| Stage | `Esc` | Back to editing |

### Deploy

It's a static site. Everything is in `public/`; there is no build step and there are no dependencies.

- **Vercel**: use the *Deploy with Vercel* button above, or import the repository. No settings to change; `vercel.json` sets the output directory to `public`.
- **Any static host** (GitHub Pages, Cloudflare Pages, Netlify, Nginx…): publish the `public/` directory.

### Develop

Requires Node.js 20 or newer.

```bash
npm run dev     # http://localhost:5173
npm test        # unit tests for the script format and timing
```

### Contributing

Issues and pull requests are welcome. Keep it dependency-free, run `npm test`, and check both the editor and the stage at phone width before opening a PR.

## License

[Apache License 2.0](LICENSE) © Dokki
