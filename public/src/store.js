// Everything stays in this browser's localStorage. There is no server.

const DOC_KEY = 'online-teleprompter:doc:v1';
const PREFS_KEY = 'online-teleprompter:prefs:v1';
// Scripts saved before the project was renamed.
const LEGACY = { 'online-teleprompter:doc:v1': 'dokki-prompter:doc:v1', 'online-teleprompter:prefs:v1': 'dokki-prompter:prefs:v1' };

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? localStorage.getItem(LEGACY[key])); } catch { return null; }
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
