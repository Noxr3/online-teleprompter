// Voice follow: find where the speaker is in the script from what speech recognition heard.
// Pure functions, no browser APIs, so they run in the unit tests.

const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/g;

/** Split text into comparable tokens: each CJK character is one token, other scripts split into words. */
export function tokenize(text) {
  const plain = String(text)
    .replace(/\*\*/g, '')
    .toLowerCase()
    .replace(/(\d)[,，](?=\d)/g, '$1') // "4,513" is heard as "4513"
    .replace(/['’]/g, '')              // "don't" is often heard as "dont"
    .replace(CJK, ' $& ');
  return plain.match(/[\p{L}\p{N}]+/gu) || [];
}

/** Matching settings for a script whose main unit is characters (CJK) or words. */
export const FOLLOW = {
  char: { tail: 10, min: 4, ahead: 80, behind: 4 },
  word: { tail: 6, min: 3, ahead: 50, behind: 3 }
};

/**
 * Given the script's tokens, the index of the next token the speaker should say, and the tokens
 * heard so far, return the new index, or null when what was heard doesn't place the speaker.
 *
 * The last few heard tokens are aligned backwards against the script near the current position,
 * tolerating words the recognizer dropped or got wrong. The best-scoring end wins; on a tie the
 * nearest one, so a phrase repeated later in the script doesn't make the stage jump ahead.
 */
export function follow(script, pos, heard, opts = FOLLOW.word) {
  const tail = heard.slice(-opts.tail);
  if (!tail.length || !script.length) return null;
  const need = Math.min(opts.min, tail.length);
  const from = Math.max(0, pos - opts.behind);
  const to = Math.min(script.length - 1, pos + opts.ahead);
  let best = null;
  for (let end = from; end <= to; end++) {
    if (script[end] !== tail[tail.length - 1] && script[end] !== tail[tail.length - 2]) continue;
    let at = end, score = 0;
    for (let t = tail.length - 1; t >= 0 && at >= 0; t--) {
      for (let skip = 0; skip <= 2 && at - skip >= 0; skip++) {
        if (script[at - skip] === tail[t]) { score++; at -= skip + 1; break; }
      }
    }
    if (score >= need && (!best || score > best.score)) best = { end, score };
  }
  return best ? best.end + 1 : null;
}
