import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, follow, FOLLOW } from '../public/src/follow.js';

test('tokenize splits CJK into characters and other scripts into words', () => {
  assert.deepEqual(tokenize('Hello, World!'), ['hello', 'world']);
  assert.deepEqual(tokenize('我们相信'), ['我', '们', '相', '信']);
  assert.deepEqual(tokenize('部署 AI Agent'), ['部', '署', 'ai', 'agent']);
  assert.deepEqual(tokenize("Don't **stop**"), ['dont', 'stop']);
  assert.deepEqual(tokenize('合并了 4,513 个 PR'), ['合', '并', '了', '4513', '个', 'pr']);
});

const en = tokenize('Good morning everyone. Today I want to show you one simple idea. It changes how a team works.');
const at = word => en.indexOf(word);

test('follows the speaker forward through the script', () => {
  const heard = tokenize('good morning everyone today I want');
  assert.equal(follow(en, 0, heard, FOLLOW.word), at('want') + 1);
});

test('tolerates a misheard word', () => {
  const heard = tokenize('today I won to show you');
  assert.equal(follow(en, 3, heard, FOLLOW.word), at('you') + 1);
});

test('tolerates a dropped word', () => {
  const heard = tokenize('show you simple idea');
  assert.equal(follow(en, 6, heard, FOLLOW.word), at('idea') + 1);
});

test('ignores speech that does not match the script nearby', () => {
  assert.equal(follow(en, 0, tokenize('sorry can everyone hear me okay'), FOLLOW.word), null);
});

test('does not jump far ahead when a phrase repeats', () => {
  const script = tokenize('We ship every week. Customers notice. We ship every week because it matters.');
  const second = script.lastIndexOf('week');
  const pos = follow(script, 0, tokenize('we ship every week'), FOLLOW.word);
  assert.ok(pos < second, `expected the first "week", got index ${pos - 1}`);
});

test('stays out of reach of a match beyond the look-ahead window', () => {
  const filler = Array.from({ length: 80 }, (_, i) => 'w' + i).join(' ');
  const script = tokenize(filler + ' the final line here');
  assert.equal(follow(script, 0, tokenize('the final line here'), FOLLOW.word), null);
});

test('follows Chinese speech with a wrong character', () => {
  const zh = tokenize('大家早上好。今天我想分享一个简单的想法。');
  const heard = tokenize('今天我想分享一个检单的'); // 简 heard as 检
  assert.equal(follow(zh, 5, heard, FOLLOW.char), zh.indexOf('的') + 1);
});
