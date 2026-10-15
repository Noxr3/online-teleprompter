// Everything stays in this browser's localStorage. There is no server.

const DOC_KEY = 'dokki-prompter:doc:v1';
const PREFS_KEY = 'dokki-prompter:prefs:v1';

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export const store = {
  loadDoc() {
    const d = read(DOC_KEY);
    return d && typeof d.text === 'string' ? { title: String(d.title || ''), text: d.text, rate: Number(d.rate) || null } : null;
  },
  saveDoc: doc => write(DOC_KEY, { title: doc.title, text: doc.text, rate: doc.rate, savedAt: Date.now() }),
  loadPrefs: () => read(PREFS_KEY) || {},
  savePrefs: prefs => write(PREFS_KEY, prefs)
};
