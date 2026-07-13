// ── SHARED UTILITIES ─────────────────────────────────────
// Used by index.html and privacy-policy.html

const LANG_META = {
  sq: { flag: '\ud83c\udde6\ud83c\uddf1', label: 'Shqip' },
  mk: { flag: '\ud83c\uddf2\ud83c\uddf0', label: '\u041c\u0430\u043a\u0435\u0434\u043e\u043d\u0441\u043a\u0438' },
  en: { flag: '\ud83c\uddec\ud83c\udde7', label: 'English' },
  tr: { flag: '\ud83c\uddf9\ud83c\uddf7', label: 'T\u00fcrk\u00e7e' },
};

let currentLang = 'sq';
let isDark = false;

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.classList.toggle('light', !isDark);
  const label = document.getElementById('theme-label');
  if (label) label.textContent = isDark ? 'Light' : 'Dark';
  localStorage.setItem('elixir-theme', isDark ? 'dark' : 'light');
}

function toggleLangMenu() {
  const dd = document.getElementById('lang-dropdown');
  const btn = document.getElementById('lang-btn');
  if (!dd || !btn) return;
  const isOpen = dd.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
}

// close dropdown on outside click
document.addEventListener('click', (e) => {
  const dd = document.getElementById('lang-dropdown');
  if (!dd) return;
  if (!dd.contains(e.target)) {
    dd.classList.remove('open');
    const btn = document.getElementById('lang-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
});

function setLang(lang) {
  // Each page must define its own `T` object before loading this script
  if (typeof T === 'undefined') return;

  currentLang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem('elixir-lang', lang);

  // close dropdown
  const dd = document.getElementById('lang-dropdown');
  if (dd) dd.classList.remove('open');
  const btn = document.getElementById('lang-btn');
  if (btn) btn.setAttribute('aria-expanded', 'false');

  // update dropdown display
  const meta = LANG_META[lang];
  const flagEl = document.getElementById('lang-flag');
  const currentEl = document.getElementById('lang-current');
  if (flagEl) flagEl.textContent = meta.flag;
  if (currentEl) currentEl.textContent = meta.label;

  // update active state in menu
  document.querySelectorAll('#lang-menu button[data-lang]').forEach((b) => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  const dict = T[lang];
  if (!dict) return;

  // text nodes
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  // placeholders
  document.querySelectorAll('[data-placeholder-i18n]').forEach((el) => {
    const key = el.getAttribute('data-placeholder-i18n');
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });

  // page-specific hook
  if (typeof onLangChanged === 'function') {
    onLangChanged(lang);
  }
}

// ── SCROLL ANIMATIONS ────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-in').forEach((el) => observer.observe(el));

// ── INIT ─────────────────────────────────────────────────
(function initShared() {
  // Restore theme \u2014 default is light
  const savedTheme = localStorage.getItem('elixir-theme') || 'light';
  if (savedTheme === 'light') {
    isDark = false;
    document.documentElement.classList.add('light');
  } else {
    isDark = true;
    document.documentElement.classList.remove('light');
  }

  // Restore language (default: 'sq')
  const savedLang = localStorage.getItem('elixir-lang') || 'sq';
  currentLang = savedLang;

  // Update theme label if element exists
  const themeLabel = document.getElementById('theme-label');
  if (themeLabel) themeLabel.textContent = isDark ? 'Light' : 'Dark';

  // Update lang dropdown display
  const meta = LANG_META[currentLang];
  const flagEl = document.getElementById('lang-flag');
  const currentEl = document.getElementById('lang-current');
  if (flagEl) flagEl.textContent = meta.flag;
  if (currentEl) currentEl.textContent = meta.label;

  // Mark active lang button
  document.querySelectorAll('#lang-menu button[data-lang]').forEach((b) => {
    b.classList.toggle('active', b.dataset.lang === currentLang);
  });
})();
