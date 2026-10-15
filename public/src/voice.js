// The browser's speech recognition, kept running for as long as the speaker wants it.

const Recognition = () => window.SpeechRecognition || window.webkitSpeechRecognition;
export const voiceSupported = () => typeof window !== 'undefined' && !!Recognition();

/**
 * onHeard(text): the last few seconds of recognized speech, interim words included.
 * onState(state): 'listening' | 'stopped' | 'denied' | 'unavailable'.
 */
export function createListener({ lang, onHeard, onState }) {
  let rec = null, wanted = false, restarts = [];

  function begin() {
    const R = Recognition();
    rec = new R();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => onState('listening');
    rec.onresult = e => {
      let text = '';
      for (let i = Math.max(0, e.results.length - 3); i < e.results.length; i++) text += ' ' + e.results[i][0].transcript;
      onHeard(text);
    };
    rec.onerror = e => {
      if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error)) { wanted = false; onState('denied'); }
    };
    // Recognition stops by itself after a pause; start it again while the speaker still wants it.
    rec.onend = () => {
      if (!wanted) { onState('stopped'); return; }
      const now = Date.now();
      restarts = restarts.filter(t => now - t < 10000).concat(now);
      if (restarts.length > 6) { wanted = false; onState('unavailable'); return; }
      try { rec.start(); } catch { setTimeout(() => wanted && begin(), 400); }
    };
    try { rec.start(); } catch { wanted = false; onState('unavailable'); }
  }

  return {
    start() { if (wanted) return; wanted = true; restarts = []; begin(); },
    stop() { wanted = false; try { rec?.abort(); } catch { /* already stopped */ } rec = null; onState('stopped'); }
  };
}
