// UI copy and the welcome script, in Simplified Chinese and English.

const zh = {
  appName: '在线提词器',
  docName: '讲稿名称',
  titlePlaceholder: '给讲稿起个名字',
  untitledPage: '未命名的一页',
  opening: '开场',
  start: '开始提词',
  startTitle: '开始提词（⌘↵）',
  more: '更多',
  import: '导入文件…',
  export: '导出 Markdown',
  newScript: '新建空白讲稿',
  loadSample: '载入示例讲稿',
  switchLang: 'English',
  source: 'GitHub 源代码',
  addPage: '新增一页',
  newPage: '新的一页',
  stress: '标为重音',
  stressTitle: '把选中的文字标为重音',
  hint: '<code>## 标题</code> 开始新的一页 · 每行一句 · <code>**文字**</code> 是重音',
  scriptLabel: '讲稿内容',
  placeholder: '## 第一页\n第一句话\n第二句话，**这里是重音**',
  pages: '页',
  unitChar: '字',
  unitWord: '词',
  rateChar: '字/分',
  rateWord: '词/分',
  finishIn: '讲完约',
  minutes: '分钟',
  at: '按 {rate} {unit}',
  outline: '页面',
  outlineTime: '开讲时间',
  playFrom: '从 P{n} 开始提词',
  playFromTitle: '从这一页开始提词',
  saved: '已保存在这台设备',
  saveFailed: '无法保存：浏览器禁止了本地存储',
  imported: '已导入 {name}',
  exported: '已导出 {name}',
  importFailed: '这个文件读不出来，请换一个 .md 或 .txt 文件',
  replaceConfirm: '用「{name}」替换当前讲稿？当前讲稿不会保留。',
  newConfirm: '新建空白讲稿？当前讲稿不会保留，需要的话先导出。',
  sampleConfirm: '载入示例讲稿？当前讲稿不会保留，需要的话先导出。',
  emptyScript: '讲稿还是空的，先写几句吧',
  dropHint: '松开即可导入讲稿',
  done: '完成',
  doneTitle: '回到编辑（Esc）',
  remain: '还剩',
  prev: '上一页（←）',
  next: '下一页（→）',
  play: '开始（空格）',
  pause: '暂停（空格）',
  slower: '慢一点（↓）',
  faster: '快一点（↑）',
  smaller: '字小一点（−）',
  bigger: '字大一点（+）',
  mirror: '镜像，用于提词玻璃（M）',
  fullscreen: '全屏（F）',
  stageLabel: '讲稿，点按开始或暂停',
  ended: '讲稿结束',
  starCta: '开源 · 在 GitHub 点个 Star',
  voice: '跟读：听你说话自动滚动（V）',
  listening: '正在听',
  voiceUnsupported: '这个浏览器不支持语音识别。请用 Chrome、Edge 或 Safari 打开。',
  voiceDenied: '没有麦克风权限，已切回按语速滚动。',
  voiceUnavailable: '语音识别暂时用不了，已切回按语速滚动。',
  voiceConsentTitle: '打开跟读？',
  voiceConsentBody: '跟读会用麦克风听你说话，讲到哪里，讲稿就滚到哪里。你停下，它也停下。',
  voiceConsentFine: '语音识别由浏览器完成，你说的话可能会发送到浏览器厂商的语音服务（比如 Chrome 用 Google，Edge 用 Microsoft，Safari 用 Apple）。讲稿本身不会被发送。',
  voiceConsentOk: '打开跟读',
  cancel: '取消',
  guide: '使用指南',
  guideHref: '/zh/guide'
};

const en = {
  appName: 'Online Teleprompter',
  docName: 'Script name',
  titlePlaceholder: 'Name your script',
  untitledPage: 'Untitled page',
  opening: 'Opening',
  start: 'Start',
  startTitle: 'Start prompting (⌘↵)',
  more: 'More',
  import: 'Import file…',
  export: 'Export Markdown',
  newScript: 'New blank script',
  loadSample: 'Load the sample script',
  switchLang: '中文',
  source: 'Source on GitHub',
  addPage: 'Add page',
  newPage: 'New page',
  stress: 'Stress',
  stressTitle: 'Mark the selected words as stressed',
  hint: '<code>## Title</code> starts a page · one line per sentence · <code>**words**</code> are stressed',
  scriptLabel: 'Script',
  placeholder: '## First page\nYour first line\nYour second line, **with stress here**',
  pages: 'pages',
  unitChar: 'characters',
  unitWord: 'words',
  rateChar: 'chars/min',
  rateWord: 'words/min',
  finishIn: 'Runs about',
  minutes: 'min',
  at: 'at {rate} {unit}',
  outline: 'Pages',
  outlineTime: 'Starts at',
  playFrom: 'Start prompting from P{n}',
  playFromTitle: 'Start prompting from this page',
  saved: 'Saved on this device',
  saveFailed: "Can't save: this browser blocks local storage",
  imported: 'Imported {name}',
  exported: 'Exported {name}',
  importFailed: "That file couldn't be read. Try a .md or .txt file.",
  replaceConfirm: 'Replace the current script with "{name}"? The current script will not be kept.',
  newConfirm: 'Start a blank script? The current one will not be kept, so export it first if you need it.',
  sampleConfirm: 'Load the sample script? The current one will not be kept, so export it first if you need it.',
  emptyScript: 'The script is empty. Write a few lines first.',
  dropHint: 'Drop to import this script',
  done: 'Done',
  doneTitle: 'Back to editing (Esc)',
  remain: 'left',
  prev: 'Previous page (←)',
  next: 'Next page (→)',
  play: 'Play (Space)',
  pause: 'Pause (Space)',
  slower: 'Slower (↓)',
  faster: 'Faster (↑)',
  smaller: 'Smaller text (−)',
  bigger: 'Larger text (+)',
  mirror: 'Mirror for a beam-splitter glass (M)',
  fullscreen: 'Full screen (F)',
  stageLabel: 'Script — tap to play or pause',
  ended: 'End of script',
  starCta: 'Open source · Star on GitHub',
  voice: 'Voice follow: scroll as you speak (V)',
  listening: 'Listening',
  voiceUnsupported: "This browser can't recognize speech. Open the prompter in Chrome, Edge or Safari.",
  voiceDenied: 'No microphone access, so the script is back to a set pace.',
  voiceUnavailable: "Speech recognition isn't available right now, so the script is back to a set pace.",
  voiceConsentTitle: 'Turn on voice follow?',
  voiceConsentBody: 'Voice follow listens through your microphone and keeps the script where you are. When you stop, it stops.',
  voiceConsentFine: 'Your browser does the recognition, and what you say may be sent to its speech service (for example Google for Chrome, Microsoft for Edge, Apple for Safari). Your script is not sent.',
  voiceConsentOk: 'Turn on',
  cancel: 'Cancel',
  guide: 'How it works',
  guideHref: '/guide'
};

const samples = {
  zh: {
    title: '示例讲稿',
    text: `## 欢迎使用在线提词器
这是一份示例讲稿，你可以直接把它改成自己的。
写法只有三条规则。
以两个井号开头的一行，会开始新的一页。
其余每一行，就是你要说的一句话。
用两对星号包住的文字，会显示成 **重音**。

## 开始提词
写完以后，点右上角的「开始提词」。
屏幕偏上有一条阅读线，读到哪里，就看那一行。
按空格开始或暂停，左右方向键翻页，上下方向键调整语速。
需要放在提词玻璃后面时，打开 **镜像**。
想让讲稿跟着你说话走，按 V 打开 **跟读**。

## 讲稿存在哪里
讲稿只保存在你自己的浏览器里，不会上传到任何服务器。
想换一台设备，就用菜单里的「导出」存成 Markdown 文件，再在另一台设备上「导入」。
**祝你讲得顺利。**
`
  },
  en: {
    title: 'Sample script',
    text: `## Welcome to Online Teleprompter
This is a sample script. Replace it with your own.
There are only three rules.
A line that starts with two hash marks begins a new page.
Every other line is one thing you say.
Words wrapped in double asterisks show up as **stress**.

## Start prompting
When you're ready, press Start in the top right corner.
A reading line sits near the top of the screen. Keep your eyes on it.
Press Space to play or pause, the left and right arrows to change page, and up and down to change the pace.
Behind a beam-splitter glass, turn on **mirror**.
Press V for **voice follow**, and the script will follow what you say.

## Where your script lives
Your script stays in this browser. Nothing is uploaded anywhere.
To move it to another device, export it as Markdown and import it there.
**Have a great talk.**
`
  }
};

export function createI18n(saved) {
  // A saved choice wins, then the page's own language (/zh/ is the Chinese page), then the browser's.
  const pageLang = document.documentElement.lang.toLowerCase().startsWith('zh') ? 'zh' : null;
  const lang = saved === 'zh' || saved === 'en' ? saved : pageLang || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
  const dict = lang === 'zh' ? zh : en;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  const t = (key, vars = {}) => (dict[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return { lang, t, sample: samples[lang] };
}
