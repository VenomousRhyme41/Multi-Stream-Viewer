const domain = window.location.hostname;
let isTheaterMode = false;
let streamLayout = 4;
let announcementClosed = false;
let resetAllWarned = false;
let resetAllTimer = null;
let refreshAllWarned = false;
let refreshAllTimer = null;

const streamLayoutBtn = document.getElementById('streamLayoutBtn');
const theaterModeBtn = document.getElementById('theaterModeBtn');
const resetAllBtn = document.getElementById('resetAllBtn');
const refreshAllBtn = document.getElementById('refreshAllBtn');
const exitTheaterBtn = document.getElementById('exitTheaterBtn');
const resetBtns = document.querySelectorAll('.reset-btn');
const streamDropdowns = document.querySelectorAll('.stream-dropdown');
const favoritesDropdowns = document.querySelectorAll('.favorites-dropdown');
const historyDropdowns = document.querySelectorAll('.history-dropdown-select');
const favoriteBtns = document.querySelectorAll('.favorite-btn');
const announcementBanner = document.getElementById('announcementBanner');
const closeAnnouncement = document.getElementById('closeAnnouncement');
const announcementText = document.getElementById('announcementText');
const overlay = document.getElementById('overlay');
const shortcutsModal = document.getElementById('shortcutsModal');
const closeShortcuts = document.getElementById('closeShortcuts');
const streamsDropdownWrap = document.getElementById('streamsDropdownWrap');
const streamsDropdownBtn = document.getElementById('streamsDropdownBtn');

const channelMap = {
'espn': { url: 'https://embedstreams.top/embed/alpha/espn/1', name: 'ESPN' },
'mlb-network': { url: 'https://embedstreams.top/embed/alpha/mlb-network/1', name: 'MLB Network' },
'nfl-network': { url: 'https://embedstreams.top/embed/alpha/nfl-network/1', name: 'NFL Network' },
'nba-tv': { url: 'https://embedstreams.top/embed/alpha/nba-tv/1', name: 'NBA TV' },
'nhl-network': { url: 'https://embedstreams.top/embed/alpha/nhl-network/1', name: 'NHL Network' },
'tennis-channel': { url: 'https://embedstreams.top/embed/alpha/tennis-channel/1', name: 'Tennis' },
'sky-sports-golf': { url: 'https://embedstreams.top/embed/alpha/sky-sports-golf/1', name: 'Golf' },
'sky-sports-darts': { url: 'https://embedstreams.top/embed/alpha/sky-sports-darts/1', name: 'Darts' },
'fox-nrl-tv': { url: 'https://embedstreams.top/embed/alpha/fox-nrl-tv/1', name: 'Rugby' },
'ufc-events': { url: 'https://embedstreams.top/embed/alpha/ufc-events-ufc-mma-ufc-ppv/1', name: 'UFC' },
'dazn-f1': { url: 'https://embedstreams.top/embed/alpha/dazn-formula-1-dazn-f1/1', name: 'Formula 1' },
'sky-f1': { url: 'https://embedstreams.top/embed/alpha/sky-sports-f1-sky-f1/1', name: 'F1' },
'motogp': { url: 'https://embedstreams.top/embed/alpha/motogp-qualifying-motogp-main-race/1', name: 'MotoGP' },
'poker': { url: 'https://player.twitch.tv/?channel=pokerstars247&parent=venomousrhyme41.github.io', name: 'Poker' },
'southpark': { url: 'https://vecloud.eu/stream/3b146825-9e54-4e17-b96e-c172ced342ad', name: 'South Park' },
'simpsons': { url: 'https://vecloud.eu/stream/8b48e26f-e89d-47ab-abf5-04b4119273d0', name: 'The Simpsons' },
'familyguy': { url: 'https://vecloud.eu/stream/d2b4b104-853f-4e4e-9edd-425a1275e90a', name: 'Family Guy' }
};

streamsDropdownBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  streamsDropdownWrap.classList.toggle('open');
});
document.addEventListener('click', function(e) {
  if (!streamsDropdownWrap.contains(e.target)) streamsDropdownWrap.classList.remove('open');
});

function getFavorites() { return JSON.parse(localStorage.getItem('streamFavorites') || '[]'); }
function saveFavorites(f) { localStorage.setItem('streamFavorites', JSON.stringify(f)); }
function getHistory() { return JSON.parse(localStorage.getItem('streamHistory') || '[]'); }
function saveHistory(h) { localStorage.setItem('streamHistory', JSON.stringify(h.slice(0, 5))); }
function clearHistory() { localStorage.setItem('streamHistory', '[]'); updateHistoryDropdowns(); }

function addToHistory(src, title) {
  const history = getHistory();
  const idx = history.findIndex(i => i.src === src);
  if (idx > -1) history.splice(idx, 1);
  history.unshift({ src, title, timestamp: Date.now() });
  saveHistory(history);
  updateHistoryDropdowns();
}

function toggleFavorite(src, title) {
  const favorites = getFavorites();
  const idx = favorites.findIndex(i => i.src === src);
  if (idx > -1) favorites.splice(idx, 1);
  else favorites.unshift({ src, title, timestamp: Date.now() });
  saveFavorites(favorites);
  updateFavoritesDropdowns();
  updateFavoriteButtons();
}

function isFavorited(src) { return getFavorites().some(i => i.src === src); }

function updateFavoritesDropdowns() {
  const favorites = getFavorites();
  favoritesDropdowns.forEach(dropdown => {
    while (dropdown.children.length > 1) dropdown.removeChild(dropdown.lastChild);
    favorites.forEach(fav => {
      const opt = document.createElement('option');
      opt.value = fav.src;
      opt.textContent = fav.title || fav.src;
      dropdown.appendChild(opt);
    });
  });
}

function updateHistoryDropdowns() {
  const history = getHistory();
  historyDropdowns.forEach(dropdown => {
    while (dropdown.children.length > 1) dropdown.removeChild(dropdown.lastChild);
    history.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.src;
      opt.textContent = item.title || item.src;
      dropdown.appendChild(opt);
    });
  });
}

function updateFavoriteButtons() {
  document.querySelectorAll('.stream-wrapper.loaded').forEach(wrapper => {
    const iframe = wrapper.querySelector('.stream-iframe');
    const btn = wrapper.querySelector('.favorite-btn');
    if (iframe.src && isFavorited(iframe.src)) { btn.classList.add('favorited'); btn.innerHTML = '♥'; }
    else { btn.classList.remove('favorited'); btn.innerHTML = '♡'; }
  });
}

function showShortcuts() { shortcutsModal.style.display = 'block'; overlay.style.display = 'block'; }
function hideShortcuts() { shortcutsModal.style.display = 'none'; overlay.style.display = 'none'; }

closeShortcuts.addEventListener('click', hideShortcuts);
overlay.addEventListener('click', hideShortcuts);

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.shiftKey && e.key === '?') {
      shortcutsModal.style.display === 'block' ? hideShortcuts() : showShortcuts();
      return;
    }
    switch(e.key.toLowerCase()) {
      case 't': toggleTheaterMode(); break;
      case 'l': toggleStreamLayout(); break;
      case 'r': resetAll(); break;
      case 'f':
        const aw = document.querySelector('.stream-wrapper.active, .stream-wrapper.loaded');
        if (aw) { const iframe = aw.querySelector('.stream-iframe'); const info = aw.querySelector('.stream-info'); if (iframe.src) toggleFavorite(iframe.src, info.textContent); }
        break;
      case 'x': if (announcementBanner.style.display !== 'none') closeAnnouncement.click(); break;
      case 'a': if (announcementClosed) { announcementBanner.style.display = 'block'; announcementClosed = false; } break;
      case 'h': clearHistory(); showError("History cleared"); break;
    }
  });
}

async function fetchAnnouncement() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/VenomousRhyme41/multi-stream-announcement-text-/refs/heads/main/text.txt');
    if (response.ok) {
      const text = (await response.text()).trim();
      if (text.length > 0) {
        announcementText.textContent = text;
        if (!announcementClosed) {
          announcementBanner.style.display = 'block';
          setTimeout(() => {
            announcementBanner.classList.add('fading');
            setTimeout(() => {
              announcementBanner.style.display = 'none';
              announcementBanner.classList.remove('fading');
              announcementClosed = true;
            }, 500);
          }, 4000);
        }
      } else {
        announcementBanner.style.display = 'none';
      }
    } else {
      announcementBanner.style.display = 'none';
    }
  } catch { announcementBanner.style.display = 'none'; }
}

closeAnnouncement.addEventListener('click', function() {
  announcementBanner.style.display = 'none';
  announcementClosed = true;
});

streamLayoutBtn.addEventListener('click', toggleStreamLayout);
theaterModeBtn.addEventListener('click', toggleTheaterMode);
exitTheaterBtn.addEventListener('click', toggleTheaterMode);

resetAllBtn.addEventListener('click', function() {
  if (!resetAllWarned) {
    resetAllWarned = true;
    resetAllBtn.classList.add('danger-warn');
    resetAllTimer = setTimeout(() => { resetAllWarned = false; resetAllBtn.classList.remove('danger-warn'); }, 3000);
  } else {
    clearTimeout(resetAllTimer); resetAllWarned = false; resetAllBtn.classList.remove('danger-warn'); resetAll();
  }
});

refreshAllBtn.addEventListener('click', function() {
  if (!refreshAllWarned) {
    refreshAllWarned = true;
    refreshAllBtn.classList.add('danger-warn');
    refreshAllTimer = setTimeout(() => { refreshAllWarned = false; refreshAllBtn.classList.remove('danger-warn'); }, 3000);
  } else {
    clearTimeout(refreshAllTimer); refreshAllWarned = false; refreshAllBtn.classList.remove('danger-warn');
    document.querySelectorAll('.refresh-btn').forEach(btn => btn.click());
  }
});

document.querySelectorAll('.load-stream-btn').forEach(btn => { btn.addEventListener('click', function() { loadStream(this); }); });

document.querySelectorAll('.src-input').forEach(input => {
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { const btn = this.closest('.stream-input').querySelector('.load-stream-btn'); if (btn) btn.click(); }
  });
});

resetBtns.forEach(btn => { btn.addEventListener('click', function() { resetStream(this); }); });
streamDropdowns.forEach(d => { d.addEventListener('change', function() { handleDropdownChange(this); }); });
favoritesDropdowns.forEach(d => { d.addEventListener('change', function() { handleFavoritesChange(this); }); });
historyDropdowns.forEach(d => { d.addEventListener('change', function() { handleHistoryChange(this); }); });
favoriteBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    const wrapper = this.closest('.stream-wrapper');
    const iframe = wrapper.querySelector('.stream-iframe');
    const info = wrapper.querySelector('.stream-info');
    if (iframe.src) toggleFavorite(iframe.src, info.textContent);
  });
});

function handleFavoritesChange(dropdown) {
  const wrapper = dropdown.closest('.stream-wrapper');
  const src = dropdown.value;
  if (src) { const fav = getFavorites().find(f => f.src === src); if (fav) { loadIntoWrapper(wrapper, fav.src, fav.title || fav.src); dropdown.selectedIndex = 0; } }
}

function handleHistoryChange(dropdown) {
  const wrapper = dropdown.closest('.stream-wrapper');
  const src = dropdown.value;
  if (src) { const item = getHistory().find(i => i.src === src); if (item) { loadIntoWrapper(wrapper, item.src, item.title || item.src); dropdown.selectedIndex = 0; } }
}

function loadIntoWrapper(wrapper, src, title) {
  const iframe = wrapper.querySelector('.stream-iframe');
  iframe.src = src; iframe.style.display = 'block';
  wrapper.querySelector('.stream-input').style.display = 'none';
  wrapper.querySelector('.stream-controls').style.display = 'flex';
  wrapper.classList.add('loaded');
  wrapper.querySelector('.stream-info').textContent = title;
  wrapper.querySelector('.left-selectors').style.display = 'none';
  wrapper.querySelector('.right-selectors').style.display = 'none';
  wrapper.querySelector('.history-dropdown').style.display = 'none';
  updateFavoriteButtons();
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.stream-controls').forEach(c => { c.style.display = 'none'; });
  exitTheaterBtn.style.display = 'none';
  updateStreamLayout();
  fetchAnnouncement();
  updateFavoritesDropdowns();
  updateHistoryDropdowns();
  setupKeyboardShortcuts();
});

function loadStream(button) {
  const wrapper = button.closest('.stream-wrapper');
  const input = wrapper.querySelector('.src-input');
  const iframe = wrapper.querySelector('.stream-iframe');
  const inputContainer = wrapper.querySelector('.stream-input');
  const controls = wrapper.querySelector('.stream-controls');
  const info = wrapper.querySelector('.stream-info');
  const leftSelectors = wrapper.querySelector('.left-selectors');
  const rightSelectors = wrapper.querySelector('.right-selectors');
  const historyDropdown = wrapper.querySelector('.history-dropdown');
  let src = input.value.trim();
  let title = '';

  if (src.includes('<iframe')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(src, 'text/html');
    const el = doc.querySelector('iframe');
    if (el) { src = el.getAttribute('src'); title = el.getAttribute('title') || ''; }
  }

  if (!src) { showError("Please enter a valid URL or embed code"); return; }

  if (src.includes('youtube.com')) {
    if (src.includes('watch?v=')) {
      const vid = src.split('v=')[1].split('&')[0];
      src = `https://www.youtube.com/embed/${vid}?autoplay=1`;
      fetch(`https://noembed.com/embed?url=https://youtube.com/watch?v=${vid}`).then(r => r.json()).then(d => { if (d.title) info.textContent = d.title; });
    } else if (src.includes('youtu.be/')) {
      const vid = src.split('youtu.be/')[1].split('?')[0];
      src = `https://www.youtube.com/embed/${vid}?autoplay=1`;
      fetch(`https://noembed.com/embed?url=https://youtube.com/watch?v=${vid}`).then(r => r.json()).then(d => { if (d.title) info.textContent = d.title; });
    }
  } else if (!src.startsWith('http') && !src.startsWith('//')) {
    showError("Invalid URL format"); return;
  }

  iframe.src = src; iframe.style.display = 'block';
  inputContainer.style.display = 'none';
  controls.style.display = 'flex';
  wrapper.classList.add('loaded');
  leftSelectors.style.display = 'none';
  rightSelectors.style.display = 'none';
  historyDropdown.style.display = 'none';

  if (title) info.textContent = title;
  else info.textContent = src.replace(/https?:\/\/(www\.)?/, '').split('/')[0];

  input.value = '';
  addToHistory(src, title);
  updateFavoriteButtons();
  if (isTheaterMode) updateTheaterModeLayout();
}

function handleDropdownChange(dropdown) {
  const wrapper = dropdown.closest('.stream-wrapper');
  const channel = channelMap[dropdown.value];
  if (channel) { loadIntoWrapper(wrapper, channel.url, channel.name); dropdown.selectedIndex = 0; addToHistory(channel.url, channel.name); }
}

function toggleTheaterMode() {
  isTheaterMode = !isTheaterMode;
  document.body.classList.toggle('theater-mode', isTheaterMode);
  exitTheaterBtn.style.display = isTheaterMode ? 'block' : 'none';
  if (isTheaterMode) {
    updateTheaterModeLayout();
  } else {
    document.querySelectorAll('.stream-wrapper:not(.loaded) .left-selectors').forEach(s => s.style.display = 'flex');
    document.querySelectorAll('.stream-wrapper:not(.loaded) .right-selectors').forEach(s => s.style.display = 'flex');
    document.querySelectorAll('.stream-wrapper:not(.loaded) .history-dropdown').forEach(s => s.style.display = 'block');
    updateStreamLayout();
  }
}

function updateTheaterModeLayout() {
  const n = document.querySelectorAll('.stream-wrapper.loaded').length;
  document.body.classList.remove('two-streams', 'three-streams', 'four-streams');
  if (n <= 2) document.body.classList.add('two-streams');
  else if (n === 3) document.body.classList.add('three-streams');
  else document.body.classList.add('four-streams');
}

function toggleStreamLayout() {
  streamLayout = streamLayout === 4 ? 2 : (streamLayout === 2 ? 3 : 4);
  updateStreamLayout();
  const icons = { 2: 'fas fa-columns', 3: 'fas fa-th-large', 4: 'fas fa-th' };
  streamLayoutBtn.innerHTML = `<i class="${icons[streamLayout]}"></i> ${streamLayout} Streams`;
}

function updateStreamLayout() {
  const container = document.getElementById('streamContainer');
  const wrappers = document.querySelectorAll('.stream-wrapper');
  container.classList.remove('two-streams', 'three-streams', 'four-streams');
  if (streamLayout === 2) { container.classList.add('two-streams'); wrappers.forEach((w, i) => w.classList.toggle('hidden', i >= 2)); }
  else if (streamLayout === 3) { container.classList.add('three-streams'); wrappers.forEach((w, i) => w.classList.toggle('hidden', i >= 3)); }
  else { wrappers.forEach(w => w.classList.remove('hidden')); }
}

function resetStream(button) {
  const wrapper = button.closest('.stream-wrapper');
  wrapper.classList.remove('loaded');
  wrapper.querySelector('.stream-input').style.display = '';
  const iframe = wrapper.querySelector('.stream-iframe');
  iframe.style.display = 'none'; iframe.src = '';
  wrapper.querySelector('.stream-controls').style.display = 'none';
  wrapper.querySelector('.stream-info').textContent = '';
  wrapper.querySelector('.stream-dropdown').selectedIndex = 0;
  wrapper.querySelector('.favorites-dropdown').selectedIndex = 0;
  wrapper.querySelector('.history-dropdown-select').selectedIndex = 0;
  wrapper.querySelector('.left-selectors').style.display = 'flex';
  wrapper.querySelector('.right-selectors').style.display = 'flex';
  wrapper.querySelector('.history-dropdown').style.display = 'block';
  if (isTheaterMode) updateTheaterModeLayout();
}

function resetAll() {
  document.querySelectorAll('.stream-wrapper').forEach(wrapper => {
    wrapper.classList.remove('loaded');
    wrapper.querySelector('.stream-input').style.display = '';
    const iframe = wrapper.querySelector('.stream-iframe');
    iframe.style.display = 'none'; iframe.src = '';
    wrapper.querySelector('.stream-controls').style.display = 'none';
    wrapper.querySelector('.stream-info').textContent = '';
    wrapper.querySelector('.stream-dropdown').selectedIndex = 0;
    wrapper.querySelector('.favorites-dropdown').selectedIndex = 0;
    wrapper.querySelector('.history-dropdown-select').selectedIndex = 0;
    wrapper.querySelector('.left-selectors').style.display = 'flex';
    wrapper.querySelector('.right-selectors').style.display = 'flex';
    wrapper.querySelector('.history-dropdown').style.display = 'block';
  });
  if (isTheaterMode) updateTheaterModeLayout();
}

function showError(message) {
  const el = document.createElement('div');
  el.className = 'error-message'; el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

document.querySelectorAll('.refresh-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const iframe = btn.closest('.stream-wrapper').querySelector('.stream-iframe');
    if (iframe && iframe.src) { const s = iframe.src; iframe.src = ''; setTimeout(() => { iframe.src = s; }, 100); }
  });
});
