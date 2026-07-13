// ── THEME & LANGUAGE (shared across all pages) ──────────────
let currentLang = 'sq';
let isDark = false;

const LANG_META = {
  sq: { flag: '🇦🇱', label: 'Shqip' },
  mk: { flag: '🇲🇰', label: 'Македонски' },
  en: { flag: '🇬🇧', label: 'English' },
  tr: { flag: '🇹🇷', label: 'Türkçe' },
};

function toggleLangMenu() {
  const dd = document.getElementById('lang-dropdown');
  const btn = document.getElementById('lang-btn');
  const isOpen = dd.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
}

// close dropdown on outside click
document.addEventListener('click', (e) => {
  const dd = document.getElementById('lang-dropdown');
  if (!dd.contains(e.target)) {
    dd.classList.remove('open');
    document.getElementById('lang-btn').setAttribute('aria-expanded', 'false');
  }
});

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.classList.toggle('light', !isDark);
  document.getElementById('theme-label').textContent = isDark ? 'Light' : 'Dark';
  localStorage.setItem('elixir-theme', isDark ? 'dark' : 'light');
}

function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem('elixir-lang', lang);

  // close dropdown
  document.getElementById('lang-dropdown').classList.remove('open');
  document.getElementById('lang-btn').setAttribute('aria-expanded', 'false');

  // update dropdown display
  const meta = LANG_META[lang];
  document.getElementById('lang-flag').textContent = meta.flag;
  document.getElementById('lang-current').textContent = meta.label;

  // update active state in menu
  document.querySelectorAll('#lang-menu button[data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  const dict = T[lang];

  // text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  // placeholders
  document.querySelectorAll('[data-placeholder-i18n]').forEach(el => {
    const key = el.getAttribute('data-placeholder-i18n');
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });
  document.querySelectorAll('.gallery-caption').forEach(cap => {
    const key = 'caption' + lang.charAt(0).toUpperCase() + lang.slice(1);
    cap.textContent = cap.dataset[key] || '';
  });
}

// ── INIT ──────────────────────────────────────────────────
// Restore theme — default is light
const savedTheme = localStorage.getItem('elixir-theme') || 'light';
if (savedTheme === 'light') {
  isDark = false;
  document.documentElement.classList.add('light');
  document.getElementById('theme-label').textContent = 'Dark';
} else {
  isDark = true;
  document.documentElement.classList.remove('light');
  document.getElementById('theme-label').textContent = 'Light';
}

// Restore language (default: 'sq')
const savedLang = localStorage.getItem('elixir-lang') || 'sq';
setLang(savedLang);
