// ── PAGE LOGIC (index.html only): contact form, gallery, hours, animations ──

// ── CONTACT FORM ──────────────────────────────────────────
// Replace with your Formspree endpoint after signing up at formspree.io
const FORMSPREE_URL = 'https://formspree.io/f/xlgpykon';

async function submitContactForm(e) {
  e.preventDefault();
  const form    = document.getElementById('contact-form');
  const btn     = document.getElementById('form-submit-btn');
  const success = document.getElementById('form-success');
  const error   = document.getElementById('form-error');

  // reset feedback
  success.style.display = 'none';
  error.style.display   = 'none';

  // loading state
  btn.disabled = true;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

  try {
    const res = await fetch(FORMSPREE_URL, {
      method:  'POST',
      headers: { 'Accept': 'application/json' },
      body:    new FormData(form)
    });

    if (res.ok) {
      form.reset();
      success.style.display = 'flex';
    } else {
      error.style.display = 'flex';
    }
  } catch {
    error.style.display = 'flex';
  }

  btn.disabled  = false;
  btn.innerHTML = originalHTML;
  // re-apply translations to the button span
  const dict = T[currentLang];
  btn.querySelector('[data-i18n="form_submit"]') &&
    (btn.querySelector('[data-i18n="form_submit"]').textContent = dict.form_submit);
}

// ── HOURS MODAL ───────────────────────────────────────────
function openHoursModal() {
  // highlight today's row
  const dayMap = ['hours-sun','hours-mon','hours-tue','hours-wed','hours-thu','hours-fri','hours-sat'];
  const today  = new Date().getDay(); // 0=Sun
  document.querySelectorAll('.hours-row').forEach(r => r.classList.remove('hours-row-today'));
  const todayRow = document.getElementById(dayMap[today]);
  if (todayRow) todayRow.classList.add('hours-row-today');

  document.getElementById('hours-modal').classList.add('open');
}
function closeHoursModal() {
  document.getElementById('hours-modal').classList.remove('open');
}
function closeHoursModalOutside(e) {
  if (e.target === document.getElementById('hours-modal')) closeHoursModal();
}
// close with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeHoursModal();
    closeAdminModal();
  }
});

const ADMIN_PASSWORD = 'elixir2024';
const ADMIN_SESSION_KEY = 'elixir-admin';

function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

function applyAdminState() {
  const loggedIn = isAdminLoggedIn();
  document.getElementById('gallery-admin-bar').style.display = loggedIn ? 'block' : 'none';
  document.getElementById('gallery-login-bar').style.display = loggedIn ? 'none' : 'block';
  document.getElementById('gallery-admin-grid').style.display = loggedIn ? 'grid' : 'none';
  document.getElementById('gallery-slideshow').style.display = loggedIn ? 'none' : (slidePhotos.length ? '' : 'none');
  document.querySelectorAll('.gallery-slide .gallery-remove').forEach(btn => {
    btn.style.display = loggedIn ? 'flex' : 'none';
  });
  if (loggedIn) renderAdminGrid();
}
function openAdminModal() {
  document.getElementById('admin-password-input').value = '';
  document.getElementById('admin-error').classList.remove('visible');
  document.getElementById('admin-modal').classList.add('open');
  setTimeout(() => document.getElementById('admin-password-input').focus(), 80);
}

function closeAdminModal() {
  document.getElementById('admin-modal').classList.remove('open');
}

function closeAdminModalOutside(e) {
  if (e.target === document.getElementById('admin-modal')) closeAdminModal();
}

function submitAdminLogin() {
  const val = document.getElementById('admin-password-input').value;
  if (val === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    closeAdminModal();
    applyAdminState();
  } else {
    document.getElementById('admin-error').classList.add('visible');
    document.getElementById('admin-password-input').value = '';
    document.getElementById('admin-password-input').focus();
  }
}

function adminLogout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  applyAdminState();
}

// ── SUPABASE SETUP ────────────────────────────────────────
// !! FILL THESE IN with your Supabase project details !!
const SUPABASE_URL      = 'https://jxizbmdujdwnyzfzxspv.supabase.co';       // e.g. https://xxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXpibWR1amR3bnl6Znp4c3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODY1NjgsImV4cCI6MjA4OTc2MjU2OH0.WGrZ1iRxOLOc8Mvq5N5tpZuctlVS8ipBm6XIj9sD1Pg';  // long string starting with "eyJ..."

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── GALLERY ──────────────────────────────────────────────
// ── SLIDESHOW STATE ───────────────────────────────────────
let slidePhotos = [];
let editingPhoto = null;
let dragSrcIndex = null;

function renderAdminGrid() {
  const grid = document.getElementById('gallery-admin-grid');
  grid.innerHTML = '';

  slidePhotos.forEach((photo, i) => {
    const item = document.createElement('div');
    item.className = 'admin-grid-item';
    item.draggable = true;
    item.dataset.index = i;

    item.innerHTML = `
      <img src="${photo.url}" alt="${photo.alt || ''}">
      <div class="admin-grid-drag-handle">⠿</div>
      <div class="admin-grid-caption">${photo['caption_' + (currentLang || 'sq')] || ''}</div>`;

    // click to edit
    item.addEventListener('click', () => openEditPhotoModal(photo));

    // drag to reorder
    item.addEventListener('dragstart', () => {
      dragSrcIndex = i;
      setTimeout(() => item.classList.add('dragging'), 0);
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('dragover', e => { e.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', async e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (dragSrcIndex === null || dragSrcIndex === i) return;
      const reordered = [...slidePhotos];
      const [moved] = reordered.splice(dragSrcIndex, 1);
      reordered.splice(i, 0, moved);
      slidePhotos = reordered;
      // save new order to supabase
      await Promise.all(reordered.map((p, idx) =>
        _supabase.from('gallery_photos').update({ sort_order: idx }).eq('id', p.id)
      ));
      renderAdminGrid();
      dragSrcIndex = null;
    });

    grid.appendChild(item);
  });
}

function openEditPhotoModal(photo) {
  editingPhoto = photo;
  document.getElementById('edit-photo-preview').src = photo.url;
  document.getElementById('edit-cap-sq').value = photo.caption_sq || '';
  document.getElementById('edit-cap-mk').value = photo.caption_mk || '';
  document.getElementById('edit-cap-en').value = photo.caption_en || '';
  document.getElementById('edit-cap-tr').value = photo.caption_tr || '';
  document.getElementById('edit-photo-modal').classList.add('open');
}

function closeEditPhotoModal() {
  editingPhoto = null;
  document.getElementById('edit-photo-modal').classList.remove('open');
}

async function saveEditPhoto() {
  if (!editingPhoto) return;
  await _supabase.from('gallery_photos').update({
    caption_sq: document.getElementById('edit-cap-sq').value.trim() || null,
    caption_mk: document.getElementById('edit-cap-mk').value.trim() || null,
    caption_en: document.getElementById('edit-cap-en').value.trim() || null,
    caption_tr: document.getElementById('edit-cap-tr').value.trim() || null,
  }).eq('id', editingPhoto.id);
  closeEditPhotoModal();
  renderGallery();
}

async function confirmDeletePhoto() {
  if (!editingPhoto) return;
  if (!confirm('Delete this photo?')) return;
  await removeGalleryPhoto(editingPhoto.id, editingPhoto.storage_path);
  closeEditPhotoModal();
}

async function replaceGalleryImage(input) {
  if (!editingPhoto || !input.files[0]) return;
  const file = input.files[0];
  input.value = '';
  const ext  = file.name.split('.').pop();
  const path = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: storageErr } = await _supabase.storage.from('gallery').upload(path, file, { contentType: file.type });
  if (storageErr) { console.error(storageErr); return; }

  const { data: { publicUrl } } = _supabase.storage.from('gallery').getPublicUrl(path);

  // delete old file from storage
  if (editingPhoto.storage_path) await _supabase.storage.from('gallery').remove([editingPhoto.storage_path]);

  await _supabase.from('gallery_photos').update({ url: publicUrl, storage_path: path }).eq('id', editingPhoto.id);

  document.getElementById('edit-photo-preview').src = publicUrl;
  editingPhoto.url = publicUrl;
  editingPhoto.storage_path = path;
  renderGallery();
}
let slideIndex  = 0;
let slideTimer  = null;

function renderGalleryItems(photos) {
  slidePhotos = photos || [];
  slideIndex  = 0;

  const empty      = document.getElementById('gallery-empty');
  const slideshow  = document.getElementById('gallery-slideshow');
  const track      = document.getElementById('gallery-track');
  const dotsEl     = document.getElementById('gallery-dots');
  const counterEl  = document.getElementById('gallery-counter');

  track.innerHTML  = '';
  dotsEl.innerHTML = '';
  clearInterval(slideTimer);

  if (slidePhotos.length === 0) {
    empty.style.display     = isAdminLoggedIn() ? 'none' : '';
    slideshow.style.display = 'none';
    dotsEl.style.display    = 'none';
    counterEl.textContent   = '';
    if (isAdminLoggedIn()) renderAdminGrid();
    return;
  }

  empty.style.display    = 'none';
  slideshow.style.display = isAdminLoggedIn() ? 'none' : '';
  dotsEl.style.display   = isAdminLoggedIn() ? 'none' : 'flex';

  // build slides
  slidePhotos.forEach((photo, i) => {
    const slide = document.createElement('div');
    slide.className = 'gallery-slide' + (i === 0 ? ' active' : '');
    slide.dataset.id = photo.id;

    const img = document.createElement('img');
    img.src     = photo.url;
    img.alt     = photo.alt || 'Elixir Pharmacy';
    img.loading = i === 0 ? 'eager' : 'lazy';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'gallery-remove';
    removeBtn.title     = 'Remove photo';
    removeBtn.innerHTML = '✕';
    removeBtn.style.display = isAdminLoggedIn() ? 'flex' : 'none';
    removeBtn.onclick = (e) => { e.stopPropagation(); removeGalleryPhoto(photo.id, photo.storage_path); };

    const caption = document.createElement('div');
    caption.className = 'gallery-caption';
    caption.dataset.captionSq = photo.caption_sq || '';
    caption.dataset.captionMk = photo.caption_mk || '';
    caption.dataset.captionEn = photo.caption_en || '';
    caption.dataset.captionTr = photo.caption_tr || '';
    const lang = localStorage.getItem('elixir-lang') || 'sq';
      caption.textContent = photo['caption_' + lang] || '';

    slide.appendChild(img);
    slide.appendChild(caption);
    slide.appendChild(removeBtn);
    track.appendChild(slide);

    // dot
    const dot = document.createElement('button');
    dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Photo ${i + 1}`);
    dot.onclick = () => goToSlide(i);
    dotsEl.appendChild(dot);
  });

  updateCounter();
  updateArrows();

  // attach swipe on the freshly built track
  attachSwipe(track);

  // auto-advance every 5s
  slideTimer = setInterval(() => slideGallery(1), 5000);
  if (isAdminLoggedIn()) renderAdminGrid();
}

function goToSlide(next, direction) {
  if (slidePhotos.length === 0) return;
  const slides = document.querySelectorAll('.gallery-slide');
  const dots   = document.querySelectorAll('.gallery-dot');
  if (!slides.length) return;

  if (direction === undefined) direction = next > slideIndex ? 1 : -1;

  const current = slideIndex;
  slideIndex = (next + slidePhotos.length) % slidePhotos.length;

  if (current === slideIndex) return;

  // position incoming slide off-screen instantly (no transition)
  slides[slideIndex].style.transition = 'none';
  slides[slideIndex].style.transform  = direction > 0 ? 'translateX(100%)' : 'translateX(-100%)';
  slides[slideIndex].style.opacity    = '0';

  // double rAF: first frame paints the starting position,
  // second frame kicks off the transition — reliable on iOS Safari
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      slides[slideIndex].style.transition = '';
      slides[slideIndex].style.transform  = '';
      slides[slideIndex].style.opacity    = '';
      slides[slideIndex].classList.add('active');

      slides[current].classList.remove('active');
      slides[current].classList.add(direction > 0 ? 'exit-left' : 'exit-right');

      setTimeout(() => {
        slides[current].classList.remove('exit-left', 'exit-right');
        slides[current].style.transform = '';
      }, 480);
    });
  });

  dots.forEach((d, i) => d.classList.toggle('active', i === slideIndex));
  updateCounter();
  updateArrows();

  clearInterval(slideTimer);
  slideTimer = setInterval(() => slideGallery(1), 5000);
}

function slideGallery(dir) {
  goToSlide(slideIndex + dir, dir);
}

function updateCounter() {
  const el = document.getElementById('gallery-counter');
  if (slidePhotos.length > 1) {
    el.textContent = `${slideIndex + 1} / ${slidePhotos.length}`;
  } else {
    el.textContent = '';
  }
}

function updateArrows() {
  // arrows always wrap around, so they're never disabled — but hide if only 1 photo
  const hide = slidePhotos.length <= 1;
  document.getElementById('gallery-prev').style.display = hide ? 'none' : '';
  document.getElementById('gallery-next').style.display = hide ? 'none' : '';
  document.getElementById('gallery-dots').style.display = hide ? 'none' : 'flex';
}

// keyboard navigation
document.addEventListener('keydown', (e) => {
  if (slidePhotos.length < 2) return;
  if (e.key === 'ArrowLeft')  slideGallery(-1);
  if (e.key === 'ArrowRight') slideGallery(1);
});

// touch swipe — reattached in renderGalleryItems after track is rebuilt
function attachSwipe(track) {
  let startX = 0, startY = 0, swiping = false, cancelled = false;

  track.addEventListener('touchstart', (e) => {
    startX    = e.touches[0].clientX;
    startY    = e.touches[0].clientY;
    swiping   = true;
    cancelled = false;
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!swiping || cancelled) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    // if more vertical than horizontal, cancel the swipe so page can scroll
    if (Math.abs(dy) > Math.abs(dx) + 5) {
      cancelled = true;
      return;
    }
    // prevent page scroll only when clearly horizontal
    if (Math.abs(dx) > 8) e.preventDefault();
  }, { passive: false });

  track.addEventListener('touchend', (e) => {
    if (!swiping || cancelled) { swiping = false; return; }
    swiping = false;
    const dx = startX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 30) slideGallery(dx > 0 ? 1 : -1);
  }, { passive: true });

  track.addEventListener('touchcancel', () => { swiping = false; cancelled = false; }, { passive: true });
}

async function renderGallery() {
  const { data, error } = await _supabase
    .from('gallery_photos')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) { console.error('Gallery load error:', error); return; }
  renderGalleryItems(data);
}

async function addGalleryPhotos(input) {
  const files = input.files ? Array.from(input.files) : input;
  if (!files.length) return;
  if (input.value !== undefined) input.value = '';

  // show uploading indicator
  const bar = document.getElementById('gallery-admin-bar');
  const uploadingEl = document.createElement('div');
  uploadingEl.className = 'gallery-uploading';
  uploadingEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Uploading...`;
  bar.appendChild(uploadingEl);

  for (const file of files) {
    const ext  = file.name.split('.').pop();
    const path = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // 1. Upload file to Supabase Storage
    const { error: storageErr } = await _supabase.storage
      .from('gallery')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (storageErr) { console.error('Upload error:', storageErr); continue; }

    // 2. Get the public URL
    const { data: { publicUrl } } = _supabase.storage.from('gallery').getPublicUrl(path);

    // 3. Save URL to database table
    const { error: dbErr } = await _supabase
      .from('gallery_photos')
      .insert({ url: publicUrl, alt: file.name.replace(/\.[^.]+$/, ''), storage_path: path });

    if (dbErr) { console.error('DB insert error:', dbErr); }
  }

  uploadingEl.remove();
  renderGallery();
}

async function removeGalleryPhoto(id, storagePath) {
  // 1. Delete from database
  await _supabase.from('gallery_photos').delete().eq('id', id);
  // 2. Delete from storage
  if (storagePath) await _supabase.storage.from('gallery').remove([storagePath]);
  // 3. Re-fetch and re-render
  renderGallery();
}
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));

// Render gallery photos from Supabase
renderGallery();

// Apply admin state (show/hide controls)
applyAdminState();

// ── ADMIN URL TRIGGER ─────────────────────────────────────
function checkAdminHash() {
  if (window.location.hash === '#admin') {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    if (isAdminLoggedIn()) {
      applyAdminState();
    } else {
      openAdminModal();
    }
  }
}

// Runs on initial page load
checkAdminHash();

// Runs if already on page and user adds #admin to URL
window.addEventListener('hashchange', checkAdminHash);

// show floating CTA after scroll
window.addEventListener('scroll', () => {
  const cta = document.getElementById('floating-cta');
  if (window.scrollY > 400) {
    cta.style.opacity = '1';
    cta.style.transform = 'translateY(0)';
    cta.style.pointerEvents = 'auto';
  } else {
    cta.style.opacity = '0';
    cta.style.transform = 'translateY(16px)';
    cta.style.pointerEvents = 'none';
  }
}, { passive: true });

// init floating CTA hidden
document.getElementById('floating-cta').style.cssText = 'opacity:0;transform:translateY(16px);pointer-events:none;transition:opacity 0.4s,transform 0.4s;';
