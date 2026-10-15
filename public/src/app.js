import { parse, pageAt, defaultRate, RATE_LIMITS, splitTitle, toMarkdown, esc, clock } from './format.js';
import { createI18n } from './i18n.js';
import { store } from './store.js';
import { createStage } from './stage.js';
import { icon } from './icons.js';

const REPO_URL = 'https://github.com/Noxr3/online-teleprompter';

const $ = id => document.getElementById(id);
const prefs = store.loadPrefs();
const { lang, t, sample } = createI18n(prefs.lang);

let doc = store.loadDoc() || { title: sample.title, text: sample.text, rate: null };
let parsed = parse(doc.text);
const rate = () => doc.rate || defaultRate(parsed.unit);
const rateLabel = () => t(parsed.unit === 'char' ? 'rateChar' : 'rateWord');
const pageTitle = (p, i) => p.title || (i === 0 ? t('opening') : t('untitledPage'));

// ——— Shell
$('root').innerHTML = `
<div class="edit" id="edit">
  <header class="bar">
    <div class="name"><span class="kind">${t('appName')}</span><input id="title" class="title-input" aria-label="${t('docName')}" placeholder="${t('titlePlaceholder')}"></div>
    <span class="status" id="status" role="status"></span>
    <div class="menu-wrap">
      <button class="btn icon-btn" id="menuBtn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="menu" title="${t('more')}" aria-label="${t('more')}">${icon.more}</button>
      <div class="menu" id="menu" role="menu" hidden>
        <button role="menuitem" type="button" data-act="import">${icon.upload}${t('import')}</button>
        <button role="menuitem" type="button" data-act="export">${icon.download}${t('export')}</button>
        <div class="sep" role="separator"></div>
        <button role="menuitem" type="button" data-act="new">${icon.file}${t('newScript')}</button>
        <button role="menuitem" type="button" data-act="sample">${icon.sample}${t('loadSample')}</button>
        <div class="sep" role="separator"></div>
        <button role="menuitem" type="button" data-act="lang">${icon.globe}${t('switchLang')}</button>
        <a role="menuitem" href="${t('guideHref')}">${icon.sample}${t('guide')}</a>
        <a role="menuitem" href="${REPO_URL}" target="_blank" rel="noopener">${icon.code}${t('source')}</a>
      </div>
    </div>
    <button class="btn primary" id="start" type="button" title="${t('startTitle')}">${icon.play}${t('start')}</button>
  </header>
  <div class="workspace">
    <nav class="outline" aria-label="${t('outline')}">
      <div class="outline-head"><span>${t('outline')}</span><span>${t('outlineTime')}</span></div>
      <ol id="outline"></ol>
      <a class="star-link" href="${REPO_URL}" target="_blank" rel="noopener">${icon.star}<span>${t('starCta')}</span></a>
    </nav>
    <section class="sheet">
      <div class="toolbar">
        <button class="btn ghost" id="addPage" type="button">${icon.plus}${t('addPage')}</button>
        <button class="btn ghost" id="stress" type="button" title="${t('stressTitle')}">${icon.stress}${t('stress')}</button>
        <span class="hint">${t('hint')}</span>
      </div>
      <textarea id="text" spellcheck="false" aria-label="${t('scriptLabel')}" placeholder="${esc(t('placeholder'))}"></textarea>
      <div class="meta">
        <span><b id="mPages">0</b> ${t('pages')}</span>
        <span><b id="mUnits">0</b> <span id="mUnitLabel"></span></span>
        <span class="spacer"></span>
        <label for="minutes">${t('finishIn')}</label><input id="minutes" type="number" min="0.5" max="300" step="0.5" inputmode="decimal"><span>${t('minutes')}</span>
        <span id="mRate"></span>
      </div>
    </section>
  </div>
</div>

<div class="stage" id="stage" hidden>
  <div class="stage-top">
    <button class="sbtn" id="exit" type="button" title="${t('doneTitle')}">${icon.close}${t('done')}</button>
    <div class="where"><span class="pn" id="sPage"></span><span class="pt" id="sTitle"></span></div>
    <div class="clock"><span class="listen" id="listen" hidden>${t('listening')}</span><b id="sElapsed">00:00</b> · ${t('remain')} <b id="sRemain">--:--</b></div>
    <div class="track"><i id="sBar"></i></div>
  </div>
  <div class="viewport">
    <div class="line" id="line" aria-hidden="true"></div>
    <div class="scroller" id="scroller" tabindex="0" aria-label="${t('stageLabel')}"><article class="script" id="script"></article></div>
    <div class="dock">
      <button class="ib" id="prev" type="button" title="${t('prev')}" aria-label="${t('prev')}">${icon.prev}</button>
      <button class="ib play" id="play" type="button" title="${t('play')}" aria-label="${t('play')}">${icon.play}</button>
      <button class="ib" id="next" type="button" title="${t('next')}" aria-label="${t('next')}">${icon.next}</button>
      <span class="div"></span>
      <button class="ib" id="slower" type="button" title="${t('slower')}" aria-label="${t('slower')}">−</button>
      <span class="readout"><span id="rateVal"></span><small id="rateUnit"></small></span>
      <button class="ib" id="faster" type="button" title="${t('faster')}" aria-label="${t('faster')}">+</button>
      <span class="div size-only"></span>
      <button class="ib a-small size-only" id="smaller" type="button" title="${t('smaller')}" aria-label="${t('smaller')}">A</button>
      <button class="ib a-big size-only" id="bigger" type="button" title="${t('bigger')}" aria-label="${t('bigger')}">A</button>
      <span class="div"></span>
      <button class="ib" id="voice" type="button" aria-pressed="false" title="${t('voice')}" aria-label="${t('voice')}" hidden>${icon.mic}</button>
      <button class="ib" id="mirror" type="button" aria-pressed="false" title="${t('mirror')}" aria-label="${t('mirror')}">${icon.mirror}</button>
      <button class="ib" id="full" type="button" title="${t('fullscreen')}" aria-label="${t('fullscreen')}">${icon.full}</button>
    </div>
    <div class="stage-note" id="stageNote" role="status" hidden></div>
    <div class="consent" id="consent" role="dialog" aria-modal="true" aria-labelledby="consentTitle" hidden>
      <div class="consent-card">
        <h2 id="consentTitle">${t('voiceConsentTitle')}</h2>
        <p>${t('voiceConsentBody')}</p>
        <p class="fine">${t('voiceConsentFine')}</p>
        <div class="consent-actions">
          <button class="sbtn" id="consentCancel" type="button">${t('cancel')}</button>
          <button class="sbtn primary" id="consentOk" type="button">${icon.mic}${t('voiceConsentOk')}</button>
        </div>
      </div>
    </div>
  </div>
</div>

<input type="file" id="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden>
<div class="drop" id="drop" hidden>${t('dropHint')}</div>
<div class="toast" id="toast" role="status" hidden></div>`;

const ta = $('text'), titleIn = $('title'), edit = $('edit');

// ——— Saving: every change is written to this browser shortly after typing stops.
let saveTimer = 0, saveOk = true;
function renderStatus() {
  const st = $('status');
  st.textContent = saveOk ? t('saved') : t('saveFailed');
  st.dataset.tone = saveOk ? 'ok' : 'error';
}
function changed() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveOk = store.saveDoc(doc); renderStatus(); }, 350);
}
addEventListener('pagehide', () => { clearTimeout(saveTimer); store.saveDoc(doc); });

let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

// ——— Edit view
let renderTimer = 0;
function renderEdit() {
  parsed = parse(doc.text);
  const r = rate();
  $('mPages').textContent = parsed.pages.length;
  $('mUnits').textContent = parsed.total.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en');
  $('mUnitLabel').textContent = t(parsed.unit === 'char' ? 'unitChar' : 'unitWord');
  if (document.activeElement !== $('minutes')) $('minutes').value = parsed.total ? Math.max(0.5, Math.round(parsed.total / r * 2) / 2) : '';
  $('mRate').textContent = t('at', { rate: r, unit: rateLabel() });
  $('outline').innerHTML = parsed.pages.map((p, i) => `<li class="row" data-i="${i}">
      <button class="go" type="button"><span class="n">P${i + 1}</span><span class="t">${esc(pageTitle(p, i))}</span><span class="at">${clock(p.before / r * 60)}</span></button>
      <button class="play-from" type="button" title="${t('playFromTitle')}" aria-label="${t('playFrom', { n: i + 1 })}">${icon.play}</button></li>`).join('');
  markCaretPage();
}
function markCaretPage() {
  const k = pageAt(parsed, ta.selectionStart);
  $('outline').querySelectorAll('.row').forEach((row, i) => row.classList.toggle('on', i === k));
}
// Scroll the editor so a character offset sits near the top, measured with an off-screen copy of the textarea.
function scrollTextTo(index) {
  const cs = getComputedStyle(ta), m = document.createElement('div');
  m.className = 'measure';
  Object.assign(m.style, { width: ta.clientWidth + 'px', font: cs.font, padding: cs.padding, letterSpacing: cs.letterSpacing });
  m.textContent = ta.value.slice(0, index) + '.';
  document.body.appendChild(m);
  const y = m.scrollHeight - parseFloat(cs.paddingBottom);
  m.remove();
  ta.focus({ preventScroll: true });
  ta.setSelectionRange(index, index);
  ta.scrollTop = Math.max(0, y - parseFloat(cs.lineHeight) * 2);
  markCaretPage();
}
function textEdited() {
  doc.text = ta.value;
  changed();
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderEdit, 120);
}
function loadDoc(next, message) {
  doc = { title: next.title || '', text: next.text, rate: next.rate || null };
  ta.value = doc.text;
  titleIn.value = doc.title;
  ta.scrollTop = 0;
  ta.setSelectionRange(0, 0);
  changed();
  renderEdit();
  if (message) toast(message);
}

ta.addEventListener('input', textEdited);
['keyup', 'click', 'select'].forEach(e => ta.addEventListener(e, markCaretPage));
titleIn.addEventListener('input', () => { doc.title = titleIn.value; changed(); });
$('minutes').addEventListener('change', () => {
  const minutes = parseFloat($('minutes').value);
  if (minutes > 0 && parsed.total) {
    doc.rate = Math.max(RATE_LIMITS.min, Math.min(RATE_LIMITS.max, Math.round(parsed.total / minutes)));
    changed();
  }
  renderEdit();
});
$('outline').addEventListener('click', e => {
  const row = e.target.closest('.row');
  if (!row) return;
  const i = Number(row.dataset.i);
  if (e.target.closest('.play-from')) startStage(i);
  else scrollTextTo(parsed.pages[i].offset);
});
$('addPage').addEventListener('click', () => {
  const end = ta.value.indexOf('\n', ta.selectionEnd);
  const at = end === -1 ? ta.value.length : end;
  const label = t('newPage');
  const insert = (at > 0 ? '\n\n' : '') + '## ' + label + '\n';
  ta.focus();
  ta.setRangeText(insert, at, at, 'end');
  const s = at + insert.indexOf(label);
  ta.setSelectionRange(s, s + label.length);
  textEdited();
});
$('stress').addEventListener('click', () => {
  const a = ta.selectionStart, b = ta.selectionEnd, sel = ta.value.slice(a, b);
  ta.focus();
  if (sel.length >= 4 && sel.startsWith('**') && sel.endsWith('**')) ta.setRangeText(sel.slice(2, -2), a, b, 'select');
  else if (sel) ta.setRangeText('**' + sel + '**', a, b, 'select');
  else { ta.setRangeText('****', a, b, 'end'); ta.setSelectionRange(a + 2, a + 2); }
  textEdited();
});
$('start').addEventListener('click', () => startStage(0));

// ——— Menu
const menu = $('menu'), menuBtn = $('menuBtn');
function setMenu(open) {
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) menu.querySelector('[role=menuitem]').focus();
}
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('.menu-wrap')) setMenu(false); });
menu.addEventListener('keydown', e => {
  const items = [...menu.querySelectorAll('[role=menuitem]')];
  const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  if (e.key === 'Escape') { setMenu(false); menuBtn.focus(); }
});
menu.addEventListener('click', e => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (!act) return;
  setMenu(false);
  if (act === 'import') $('file').click();
  if (act === 'export') exportDoc();
  if (act === 'new' && confirm(t('newConfirm'))) loadDoc({ title: '', text: '' });
  if (act === 'sample' && confirm(t('sampleConfirm'))) loadDoc(sample);
  if (act === 'lang') { prefs.lang = lang === 'zh' ? 'en' : 'zh'; store.savePrefs(prefs); clearTimeout(saveTimer); store.saveDoc(doc); location.reload(); }
});

// ——— Import / export
const fileName = () => (doc.title || 'script').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) + '.md';
function exportDoc() {
  const blob = new Blob([toMarkdown(doc)], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(t('exported', { name: a.download }));
}
async function importFile(file) {
  if (!file) return;
  let raw;
  try { raw = await file.text(); } catch { toast(t('importFailed')); return; }
  if (raw.includes('\u0000')) { toast(t('importFailed')); return; }
  const { title, text } = splitTitle(raw);
  if (doc.text.trim() && doc.text !== text && !confirm(t('replaceConfirm', { name: file.name }))) return;
  loadDoc({ title: title || file.name.replace(/\.(md|markdown|txt)$/i, ''), text, rate: doc.rate }, t('imported', { name: file.name }));
}
$('file').addEventListener('change', e => { importFile(e.target.files[0]); e.target.value = ''; });

let dragDepth = 0;
const hasFiles = e => [...(e.dataTransfer?.types || [])].includes('Files');
addEventListener('dragenter', e => { if (!hasFiles(e) || stage.active) return; dragDepth++; $('drop').hidden = false; });
addEventListener('dragleave', e => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('drop').hidden = true; });
addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
addEventListener('drop', e => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragDepth = 0;
  $('drop').hidden = true;
  if (!stage.active) importFile(e.dataTransfer.files[0]);
});

// ——— Stage
const stage = createStage({
  t, pageTitle, rateLabel,
  getRate: rate,
  nudgeRate: d => { doc.rate = Math.max(RATE_LIMITS.min, Math.min(RATE_LIMITS.max, rate() + d)); changed(); },
  prefs,
  savePrefs: p => store.savePrefs(p),
  onExit: page => {
    edit.hidden = false;
    renderEdit();
    if (parsed.pages[page]) scrollTextTo(parsed.pages[page].offset);
  }
});
function startStage(fromPage) {
  parsed = parse(doc.text);
  if (!parsed.total) { toast(t('emptyScript')); ta.focus(); return; }
  edit.hidden = true;
  stage.enter(parsed, fromPage);
}

addEventListener('keydown', e => {
  if (stage.active) { stage.handleKey(e); return; }
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key === 'Enter') { e.preventDefault(); startStage(pageAt(parsed, ta.selectionStart)); }
  else if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); clearTimeout(saveTimer); saveOk = store.saveDoc(doc); renderStatus(); }
});

// ——— Boot
ta.value = doc.text;
titleIn.value = doc.title;
ta.setSelectionRange(0, 0);
renderEdit();
renderStatus();
if (!store.loadDoc()) changed();
