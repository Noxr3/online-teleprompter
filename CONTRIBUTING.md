# Contributing

Thanks for helping make Online Teleprompter better. 中文贡献者同样欢迎，Issue 和 PR 用中文或英文都可以。

## Ground rules

- **No dependencies, no build step.** The app is plain HTML, CSS and JavaScript modules in `public/`. If a feature seems to need a library, open an issue first so we can talk about it.
- **Nothing leaves the browser.** No analytics, no third-party requests, no server. `vercel.json` ships a strict Content Security Policy; keep it passing. The one exception is voice follow, which is off by default and asks first, because browser speech recognition may use the browser maker's service.
- **Both languages.** Any text a person sees goes in `public/src/i18n.js`, in English and Simplified Chinese.

## Getting started

```bash
npm run dev     # http://localhost:5173
npm test
```

## Before you open a pull request

1. `npm test` passes. Logic that can be a pure function (parsing, counting, timing) lives in `public/src/format.js` and gets a test in `tests/`.
2. You checked the editor and the stage in light and dark, and at phone width (about 390px).
3. The stage still works by keyboard: Space, arrows, `+`/`−`, `M`, `F`, `Esc`.
4. The pull request says what changed and why, with a screenshot or short recording for anything visible.

## Good first issues

Look for the [`good first issue`](https://github.com/Noxr3/online-teleprompter/labels/good%20first%20issue) label. Comment on the issue before you start so two people don't build the same thing.
