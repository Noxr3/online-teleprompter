import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measure, parse, pageAt, splitTitle, toMarkdown, inline, clock, defaultRate } from '../public/src/format.js';

test('measure counts CJK characters and other-script words as spoken units', () => {
  assert.deepEqual(measure('我们相信'), { cjk: 4, words: 0, units: 4 });
  assert.deepEqual(measure('Hello, world'), { cjk: 0, words: 2, units: 2 });
  assert.deepEqual(measure('部署 AI Agent 很容易'), { cjk: 5, words: 2, units: 7 });
  assert.equal(measure('1,024 个 API').units, 3);
  assert.equal(measure("don't stop").words, 2);
  assert.equal(measure('**重音**').units, 2, 'stress marks are not spoken');
});

test('parse splits pages on ## headings and lines on newlines', () => {
  const p = parse('## One\nfirst line\n\nsecond line\n## Two\nthird line\n');
  assert.equal(p.pages.length, 2);
  assert.deepEqual(p.pages[0].lines, ['first line', 'second line']);
  assert.deepEqual(p.pages[1].lines, ['third line']);
  assert.equal(p.pages[0].title, 'One');
  assert.equal(p.unit, 'word');
});

test('page titles are not spoken and do not count towards timing', () => {
  const p = parse('## 一个很长很长的标题\n你好');
  assert.equal(p.total, 2);
  assert.equal(p.pages[0].units, 2);
});

test('a "P3 ·" prefix on a heading is dropped, since pages are numbered for you', () => {
  assert.equal(parse('## P3 · 从 FDE 驻场优化').pages[0].title, '从 FDE 驻场优化');
  assert.equal(parse('## p12: Market').pages[0].title, 'Market');
});

test('lines before the first heading become an untitled opening page', () => {
  const p = parse('Good morning\n## Agenda\nToday');
  assert.equal(p.pages.length, 2);
  assert.equal(p.pages[0].title, '');
  assert.deepEqual(p.pages[0].lines, ['Good morning']);
});

test('a "# Title" line, rules and list markers are not read aloud', () => {
  const p = parse('# Deck\n---\n## A\n- first\n2. second\n* third');
  assert.equal(p.pages.length, 1);
  assert.deepEqual(p.pages[0].lines, ['first', 'second', 'third']);
});

test('before is the running total of units, and offsets point at each heading', () => {
  const text = '## A\n一二三\n## B\n四五';
  const p = parse(text);
  assert.deepEqual(p.pages.map(x => x.before), [0, 3]);
  assert.equal(p.total, 5);
  assert.equal(text.slice(p.pages[1].offset, p.pages[1].offset + 4), '## B');
  assert.equal(pageAt(p, 0), 0);
  assert.equal(pageAt(p, text.length), 1);
  assert.equal(p.unit, 'char');
});

test('default pace follows the script language', () => {
  assert.equal(defaultRate('char'), 280);
  assert.equal(defaultRate('word'), 150);
});

test('import and export round-trip the title', () => {
  const doc = { title: 'My talk', text: '## One\nHello' };
  const md = toMarkdown(doc);
  assert.equal(md, '# My talk\n\n## One\nHello\n');
  assert.deepEqual(splitTitle(md), { title: 'My talk', text: '## One\nHello\n' });
  assert.deepEqual(splitTitle('﻿## One\r\nHi'), { title: '', text: '## One\nHi' });
});

test('inline escapes HTML before adding stress', () => {
  assert.equal(inline('<b>x</b> **y**'), '&lt;b&gt;x&lt;/b&gt; <strong>y</strong>');
  assert.equal(inline('a ** b'), 'a ** b');
});

test('clock formats seconds', () => {
  assert.equal(clock(0), '00:00');
  assert.equal(clock(75.4), '01:15');
  assert.equal(clock(3725), '1:02:05');
  assert.equal(clock(-5), '00:00');
});
