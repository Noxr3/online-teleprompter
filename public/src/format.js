// Script format and timing — pure functions, shared by the editor, the stage and the tests.
//
// Format:
//   "# Title"         the script's name (only meaningful as the first line of an imported file)
//   "## Page title"   starts a new page (a slide, a section)
//   any other line    one spoken line
//   **words**         stress — drawn highlighted on the stage

const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/g;
const WORD = /[\p{L}\p{N}]+(?:['’.,\-][\p{L}\p{N}]+)*/gu;

/** How much there is to say: CJK characters and other-script words are each one spoken unit. */
export function measure(text) {
  const plain = String(text).replace(/\*\*/g, '');
  const cjk = (plain.match(CJK) || []).length;
  const words = (plain.replace(CJK, ' ').match(WORD) || []).length;
  return { cjk, words, units: cjk + words };
}

/** Comfortable presenting pace: ~280 Chinese/Japanese/Korean characters, or ~150 words, per minute. */
export const DEFAULT_RATE = { char: 280, word: 150 };
export const RATE_LIMITS = { min: 60, max: 900 };
export const defaultRate = unit => DEFAULT_RATE[unit] || DEFAULT_RATE.char;

export function parse(text) {
  const pages = [];
  let cur = null, offset = 0, cjk = 0, words = 0;
  for (const raw of String(text).split('\n')) {
    const start = offset;
    offset += raw.length + 1;
    const line = raw.trim();
    if (!line || /^(-{3,}|\*{3,}|_{3,})$/.test(line) || /^#\s/.test(line)) continue;
    const heading = line.match(/^#{2,6}\s*(.*)$/);
    if (heading) {
      const title = heading[1].replace(/^P\s*\d+\s*[·.、:：\-–—]\s*/i, '').trim();
      cur = { title, lines: [], offset: start, units: 0 };
      pages.push(cur);
      continue;
    }
    if (!cur) { cur = { title: '', lines: [], offset: start, units: 0 }; pages.push(cur); }
    const spoken = line.replace(/^([-*+]|\d+[.)])\s+/, '');
    const m = measure(spoken);
    cur.lines.push(spoken);
    cur.units += m.units;
    cjk += m.cjk;
    words += m.words;
  }
  let acc = 0;
  for (const p of pages) { p.before = acc; acc += p.units; }
  return { pages, total: acc, cjk, words, unit: cjk >= words ? 'char' : 'word' };
}

/** Index of the page that contains a character offset in the source text. */
export function pageAt(parsed, index) {
  let k = 0;
  parsed.pages.forEach((p, i) => { if (p.offset <= index) k = i; });
  return k;
}

/** Split an imported file into a name (from a leading "# Title") and the script body. */
export function splitTitle(text) {
  const src = String(text).replace(/\r\n?/g, '\n').replace(/^﻿/, '');
  const m = src.match(/^\s*#\s+(.+)\n?/);
  return m ? { title: m[1].trim(), text: src.slice(m[0].length).replace(/^\n+/, '') } : { title: '', text: src };
}

export const toMarkdown = doc => (doc.title ? `# ${doc.title}\n\n` : '') + doc.text.replace(/\s*$/, '\n');

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
export const clock = secs => {
  const s = Math.max(0, Math.round(secs));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const mm = String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  return h ? h + ':' + mm : mm;
};
