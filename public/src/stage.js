// The prompting stage: a scrolling script under a fixed reading line.
// It moves either at a set speaking pace, or (voice follow) to wherever the speaker is.
import { esc, inline, clock, measure } from './format.js';
import { tokenize, follow, FOLLOW } from './follow.js';
import { voiceSupported, createListener } from './voice.js';
import { icon } from './icons.js';

export function createStage({ t, pageTitle, getRate, nudgeRate, rateLabel, prefs, savePrefs, onExit }) {
  const $ = id => document.getElementById(id);
  const stage = $('stage'), scroller = $('scroller'), script = $('script'), line = $('line');
  const S = {
    on: false, playing: false, acc: 0, lastT: 0, elapsed: 0, wake: null, idle: 0, noteTimer: 0,
    lines: [], units: [], before: [], total: 1, sections: [], lastPage: -1, unit: 'word',
    // voice follow
    voice: false, listener: null, tokens: [], tokLine: [], tokAt: [], lineStart: [], lineTokens: [], pos: 0, target: 0
  };
  let size = prefs.size || (matchMedia('(max-width: 760px)').matches ? 30 : 46);
  let mirrored = !!prefs.mirror;

  const guideY = () => scroller.clientHeight * 0.36;
  const lineTop = () => guideY() - size * 0.08;
  const topOf = el => el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

  function render(parsed) {
    script.innerHTML = parsed.pages.map((p, i) =>
      `<section data-title="${esc(pageTitle(p, i))}"><div class="cue"><b>P${i + 1}</b><span>${esc(pageTitle(p, i))}</span></div>${p.lines.map(l => '<p>' + inline(l) + '</p>').join('')}</section>`
    ).join('') + `<p class="end">${esc(t('ended'))}</p>`;
    S.sections = [...script.querySelectorAll('section')];
    S.lines = [...script.querySelectorAll('section p')];
    S.units = S.lines.map(el => measure(el.textContent).units);
    S.before = [];
    S.units.reduce((acc, n, i) => (S.before[i] = acc, acc + n), 0);
    S.total = S.units.reduce((a, b) => a + b, 0) || 1;
    S.unit = parsed.unit;
    // One flat token list for voice follow, remembering which line each token is on.
    S.tokens = []; S.tokLine = []; S.tokAt = []; S.lineStart = []; S.lineTokens = [];
    S.lines.forEach((el, i) => {
      const toks = tokenize(el.textContent);
      S.lineStart[i] = S.tokens.length;
      S.lineTokens[i] = toks.length;
      toks.forEach((tok, k) => { S.tokens.push(tok); S.tokLine.push(i); S.tokAt.push(k); });
    });
  }

  function persist() { prefs.size = size; prefs.mirror = mirrored; prefs.voice = S.voice; savePrefs(prefs); }
  function applySize() {
    document.documentElement.style.setProperty('--size', size + 'px');
    script.style.paddingTop = lineTop() + 'px';
    line.style.top = lineTop() + 'px';
  }
  function applyMirror() {
    stage.classList.toggle('mirror', mirrored);
    $('mirror').setAttribute('aria-pressed', String(mirrored));
  }

  // The spoken line that sits on the reading line.
  function currentLine() {
    const y = scroller.scrollTop + guideY() + size * 0.4;
    let lo = 0, hi = S.lines.length - 1, ans = 0;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (topOf(S.lines[m]) <= y) { ans = m; lo = m + 1; } else hi = m - 1;
    }
    return ans;
  }
  // Each line scrolls at its own pace — its height over how much there is to say in it —
  // so a short line and a long one are read at the same speaking rate.
  function pxPerSec() {
    const i = currentLine(), el = S.lines[i];
    const h = el.offsetHeight + parseFloat(getComputedStyle(el).marginBottom);
    return (getRate() / 60) * h / Math.max(S.units[i], 3);
  }
  const pageNow = () => S.sections.indexOf(S.lines[currentLine()].closest('section'));

  function update() {
    if (!S.on || !S.lines.length) return;
    const i = currentLine();
    S.lines.forEach((el, k) => el.classList.toggle('past', k < i));
    const sec = S.lines[i].closest('section'), p = S.sections.indexOf(sec);
    if (p !== S.lastPage) {
      S.lastPage = p;
      $('sPage').textContent = 'P' + (p + 1) + ' / ' + S.sections.length;
      $('sTitle').textContent = sec.dataset.title;
    }
    const done = S.before[i] || 0;
    $('sRemain').textContent = clock((S.total - done) / getRate() * 60);
    $('sBar').style.width = (done / S.total * 100).toFixed(2) + '%';
    $('rateVal').textContent = getRate();
    $('rateUnit').textContent = rateLabel();
  }

  // ——— Voice follow
  // Where to scroll so the next word to say sits on the reading line; a line that wraps is
  // walked through in proportion to how far into it the speaker is.
  function scrollFor(pos) {
    if (!S.tokens.length) return scroller.scrollTop;
    const k = Math.min(pos, S.tokens.length - 1);
    const i = S.tokLine[k], el = S.lines[i];
    const into = pos >= S.tokens.length ? 1 : S.tokAt[k] / Math.max(S.lineTokens[i], 1);
    const extra = Math.max(0, el.offsetHeight - size * 1.62);
    return topOf(el) - lineTop() + into * extra;
  }
  const posAtLine = i => S.lineStart[i] ?? 0;
  function heard(text) {
    let next = follow(S.tokens, S.pos, tokenize(text), FOLLOW[S.unit] || FOLLOW.word);
    if (next === null || next === S.pos) return;
    // Recognizers often garble a sentence's last word; with only that word left, the line is done.
    if (next < S.tokens.length && S.tokAt[next] === S.lineTokens[S.tokLine[next]] - 1) next++;
    S.pos = next;
    S.target = scrollFor(S.pos);
  }
  function setListening(state) {
    const chip = $('listen');
    chip.hidden = !(S.voice && S.playing && state === 'listening');
    if (state === 'denied') { note(t('voiceDenied')); setVoice(false); }
    if (state === 'unavailable') { note(t('voiceUnavailable')); setVoice(false); }
  }
  function listener() {
    if (!S.listener) {
      const lang = S.unit === 'char' ? 'zh-CN' : ((navigator.language || '').toLowerCase().startsWith('en') ? navigator.language : 'en-US');
      S.listener = createListener({ lang, onHeard: heard, onState: setListening });
    }
    return S.listener;
  }
  function setVoice(on) {
    S.voice = on;
    $('voice').setAttribute('aria-pressed', String(on));
    stage.classList.toggle('voice', on);
    persist();
    if (on) {
      S.pos = posAtLine(currentLine());
      S.target = scroller.scrollTop;
      if (S.playing) listener().start();
    } else {
      S.listener?.stop();
      $('listen').hidden = true;
    }
    update();
  }
  function toggleVoice() {
    if (S.voice) { setVoice(false); return; }
    if (!voiceSupported()) { note(t('voiceUnsupported')); return; }
    if (prefs.voiceConsent) { setVoice(true); return; }
    $('consent').hidden = false;
    $('consentOk').focus();
  }
  function closeConsent(ok) {
    $('consent').hidden = true;
    if (ok) { prefs.voiceConsent = true; setVoice(true); }
    $('voice').focus();
  }
  function note(msg) {
    const el = $('stageNote');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(S.noteTimer);
    S.noteTimer = setTimeout(() => { el.hidden = true; }, 4200);
  }

  // ——— Playback
  function frame(time) {
    if (!S.playing) return;
    // Real elapsed time, so a throttled or slow display keeps the speaking pace; capped so a long stall can't jump ahead.
    const dt = S.lastT ? Math.min((time - S.lastT) / 1000, 0.5) : 0;
    S.lastT = time;
    if (Math.abs(scroller.scrollTop - S.acc) > 3) { // the reader scrolled by hand
      S.acc = scroller.scrollTop;
      if (S.voice) { S.pos = posAtLine(currentLine()); S.target = S.acc; }
    }
    if (S.voice) S.acc += (S.target - S.acc) * Math.min(1, dt * 5); // ease towards the speaker
    else S.acc += pxPerSec() * dt;
    scroller.scrollTop = S.acc;
    S.elapsed += dt;
    $('sElapsed').textContent = clock(S.elapsed);
    if (!S.voice && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) { setPlaying(false); return; }
    requestAnimationFrame(frame);
  }

  async function setPlaying(on) {
    S.playing = on;
    const btn = $('play');
    btn.innerHTML = on ? icon.pause : icon.play;
    btn.title = on ? t('pause') : t('play');
    btn.setAttribute('aria-label', btn.title);
    if (on) {
      S.acc = scroller.scrollTop;
      S.lastT = 0;
      if (S.voice) { S.pos = posAtLine(currentLine()); S.target = S.acc; listener().start(); }
      requestAnimationFrame(frame);
      try { S.wake = await navigator.wakeLock?.request('screen'); } catch { S.wake = null; }
    } else {
      S.listener?.stop();
      $('listen').hidden = true;
      try { await S.wake?.release(); } catch { /* already released */ }
      S.wake = null;
    }
    bumpIdle();
  }

  function goPage(p) {
    p = Math.max(0, Math.min(S.sections.length - 1, p));
    const first = S.sections[p].querySelector('p') || S.sections[p];
    scroller.scrollTop = topOf(first) - lineTop();
    S.acc = scroller.scrollTop;
    const i = S.lines.indexOf(first);
    if (i >= 0) { S.pos = posAtLine(i); S.target = S.acc; }
    update();
  }
  function bumpIdle() {
    stage.classList.remove('idle');
    clearTimeout(S.idle);
    if (S.playing) S.idle = setTimeout(() => stage.classList.add('idle'), 2400);
  }
  function resize(d) {
    const keep = S.lines[currentLine()];
    size = Math.max(20, Math.min(112, size + d));
    applySize();
    scroller.scrollTop = topOf(keep) - lineTop();
    S.acc = scroller.scrollTop;
    if (S.voice) S.target = scrollFor(S.pos);
    persist();
    update();
  }
  const toggleMirror = () => { mirrored = !mirrored; applyMirror(); persist(); };
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else stage.requestFullscreen?.().catch(() => {});
  };
  const rate = d => { nudgeRate(d); update(); };

  function enter(parsed, fromPage = 0) {
    render(parsed);
    S.listener = null; // the script's language may have changed
    stage.hidden = false;
    S.on = true;
    S.elapsed = 0;
    S.lastPage = -1;
    $('sElapsed').textContent = '00:00';
    $('voice').hidden = !voiceSupported();
    S.voice = !!(prefs.voice && prefs.voiceConsent && voiceSupported());
    $('voice').setAttribute('aria-pressed', String(S.voice));
    stage.classList.toggle('voice', S.voice);
    applySize();
    applyMirror();
    scroller.scrollTop = 0;
    goPage(fromPage);
    scroller.focus({ preventScroll: true });
    bumpIdle();
  }
  function exit() {
    const page = Math.max(0, pageNow());
    setPlaying(false);
    $('consent').hidden = true;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    stage.hidden = true;
    S.on = false;
    onExit(page);
  }

  $('play').onclick = () => setPlaying(!S.playing);
  $('prev').onclick = () => goPage(pageNow() - 1);
  $('next').onclick = () => goPage(pageNow() + 1);
  $('slower').onclick = () => rate(-10);
  $('faster').onclick = () => rate(10);
  $('smaller').onclick = () => resize(-4);
  $('bigger').onclick = () => resize(4);
  $('mirror').onclick = toggleMirror;
  $('voice').onclick = toggleVoice;
  $('full').onclick = toggleFull;
  $('exit').onclick = exit;
  $('consentOk').onclick = () => closeConsent(true);
  $('consentCancel').onclick = () => closeConsent(false);
  scroller.addEventListener('click', () => setPlaying(!S.playing));
  scroller.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  ['mousemove', 'touchstart'].forEach(e => stage.addEventListener(e, bumpIdle, { passive: true }));
  addEventListener('resize', () => { if (S.on) { applySize(); if (S.voice) S.target = scrollFor(S.pos); update(); } });

  const keys = {
    ' ': () => setPlaying(!S.playing),
    ArrowUp: () => rate(10), ArrowDown: () => rate(-10),
    ArrowLeft: () => goPage(pageNow() - 1), ArrowRight: () => goPage(pageNow() + 1),
    PageUp: () => goPage(pageNow() - 1), PageDown: () => goPage(pageNow() + 1),
    '+': () => resize(4), '=': () => resize(4), '-': () => resize(-4), '_': () => resize(-4),
    m: toggleMirror, f: toggleFull, v: toggleVoice,
    Escape: () => { if (!document.fullscreenElement) exit(); }
  };
  function handleKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    if (!$('consent').hidden) { // the consent prompt owns the keyboard while it's open
      if (e.key === 'Escape') { e.preventDefault(); closeConsent(false); }
      return false;
    }
    const fn = keys[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!fn) return false;
    e.preventDefault();
    fn();
    bumpIdle();
    return true;
  }

  return { enter, exit, handleKey, get active() { return S.on; } };
}
