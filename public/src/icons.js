const svg = (d, cls = '') => `<svg viewBox="0 0 24 24" aria-hidden="true"${cls ? ` class="${cls}"` : ''}>${d}</svg>`;

export const icon = {
  play: svg('<path d="M8 5.6v12.8a.8.8 0 0 0 1.2.7l10-6.4a.8.8 0 0 0 0-1.4l-10-6.4A.8.8 0 0 0 8 5.6Z"/>', 'solid'),
  pause: svg('<rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/>', 'solid'),
  prev: svg('<path d="M14.5 6 8.5 12l6 6"/>'),
  next: svg('<path d="m9.5 6 6 6-6 6"/>'),
  close: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  mirror: svg('<path d="M12 3.5v17M8.5 7.5 4 12l4.5 4.5zM15.5 7.5 20 12l-4.5 4.5z"/>'),
  full: svg('<path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  stress: svg('<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>'),
  more: svg('<path d="M6 12h.01M12 12h.01M18 12h.01"/>', 'dots'),
  upload: svg('<path d="M12 15V4.5M7.5 9 12 4.5 16.5 9M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15"/>'),
  download: svg('<path d="M12 4.5V15M7.5 10.5 12 15l4.5-4.5M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15"/>'),
  file: svg('<path d="M7 3.5h6.5L18 8v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5ZM13 3.5V8h5"/>'),
  sample: svg('<path d="M5 5.5h14M5 10h14M5 14.5h9M5 19h6"/>'),
  globe: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5s1.1-5.9 3.5-8.5Z"/>'),
  code: svg('<path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13"/>')
};
