// The prompting stage: a scrolling script under a fixed reading line.
import { esc, inline, clock, measure } from './format.js';
import { icon } from './icons.js';

export function createStage({ t, pageTitle, getRate, nudgeRate, rateLabel, prefs, savePrefs, onExit }) {
  const $ = id => document.getElementById(id);
  const stage = $('stage'), scroller = $('scroller'), script = $('script'), line = $('line');
  const S = { on: false, playing: false, acc: 0, lastT: 0, elapsed: 0, wake: null, idle: 0, lines: [], units: [], before: [], total: 1, sections: [], lastPage: -1 };
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
  }

  function persist() { prefs.size = size; prefs.mirror = mirrored; savePrefs(prefs); }
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

  function frame(time) {
    if (!S.playing) return;
    // Real elapsed time, so a throttled or slow display keeps the speaking pace; capped so a long stall can't jump ahead.
    const dt = S.lastT ? Math.min((time - S.lastT) / 1000, 0.5) : 0;
    S.lastT = time;
    if (Math.abs(scroller.scrollTop - S.acc) > 3) S.acc = scroller.scrollTop; // the reader scrolled by hand
    S.acc += pxPerSec() * dt;
    scroller.scrollTop = S.acc;
    S.elapsed += dt;
    $('sElapsed').textContent = clock(S.elapsed);
    if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) { setPlaying(false); return; }
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
      requestAnimationFrame(frame);
      try { S.wake = await navigator.wakeLock?.request('screen'); } catch { S.wake = null; }
    } else {
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
    stage.hidden = false;
    S.on = true;
    S.elapsed = 0;
    S.lastPage = -1;
    $('sElapsed').textContent = '00:00';
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
  $('full').onclick = toggleFull;
  $('exit').onclick = exit;
  scroller.addEventListener('click', () => setPlaying(!S.playing));
  scroller.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  ['mousemove', 'touchstart'].forEach(e => stage.addEventListener(e, bumpIdle, { passive: true }));
  addEventListener('resize', () => { if (S.on) { applySize(); update(); } });

  const keys = {
    ' ': () => setPlaying(!S.playing),
    ArrowUp: () => rate(10), ArrowDown: () => rate(-10),
    ArrowLeft: () => goPage(pageNow() - 1), ArrowRight: () => goPage(pageNow() + 1),
    PageUp: () => goPage(pageNow() - 1), PageDown: () => goPage(pageNow() + 1),
    '+': () => resize(4), '=': () => resize(4), '-': () => resize(-4), '_': () => resize(-4),
    m: toggleMirror, f: toggleFull,
    Escape: () => { if (!document.fullscreenElement) exit(); }
  };
  function handleKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return false;
    const fn = keys[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!fn) return false;
    e.preventDefault();
    fn();
    bumpIdle();
    return true;
  }

  return { enter, exit, handleKey, get active() { return S.on; } };
}
