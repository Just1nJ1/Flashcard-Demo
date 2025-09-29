const state = {
  sets: [],
  order: [],
  items: [],
  index: 0,
  showTranslation: false,
  currentTheme: 'dark',
  showCategoryScreen: true,
  categoryEmojis: {
    'animals': '🐾',
    'food': '🍎',
    'travel': '✈️'
  }
};

const els = {
  setSelect: document.getElementById('setSelect'),
  image: document.getElementById('image'),
  word: document.getElementById('word'),
  sentence: document.getElementById('sentence'),
  translation: document.getElementById('translation'),
  card: document.getElementById('card'),
  position: document.getElementById('position'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  toast: document.getElementById('toast'),
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  categorySelect: document.getElementById('categorySelect'),
  selectedCategoryEmoji: document.getElementById('selectedCategoryEmoji'),
  selectedCategoryName: document.getElementById('selectedCategoryName'),
  categoryScreen: document.getElementById('categoryScreen'),
  categoryGrid: document.getElementById('categoryGrid'),
  viewport: document.getElementById('viewport'),
};

function initializeTheme() {
  const savedTheme = localStorage.getItem('vocab.theme') || 'dark';
  state.currentTheme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon();
  updateThemeColor();
}

function updateThemeIcon() {
  if (state.currentTheme === 'dark') {
    els.themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  } else {
    els.themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  }
}

function updateThemeColor() {
  const themeColor = state.currentTheme === 'dark' ? '#0b1020' : '#f8fafc';
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', themeColor);
  }
}

function toggleTheme() {
  state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.currentTheme);
  localStorage.setItem('vocab.theme', state.currentTheme);
  updateThemeIcon();
  updateThemeColor();
}

async function loadData(){
  const res = await fetch('/data/vocab.json');
  if(!res.ok) throw new Error('Failed to load data');
  const data = await res.json();
  state.sets = data.sets || [];
  renderSetOptions();
  renderCategoryScreen();
  const preferred = localStorage.getItem('vocab.set') || state.sets[0]?.id;
  if (preferred) {
    await selectSet(preferred);
    showFlashcardView();
  } else {
    showCategoryScreen();
  }
}

function renderSetOptions(){
  els.setSelect.innerHTML = state.sets.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  els.setSelect.addEventListener('change', () => selectSet(els.setSelect.value));
}

function renderCategoryScreen() {
  els.categoryGrid.innerHTML = state.sets.map(set => `
    <div class="category-card" data-set-id="${set.id}">
      <div class="category-emoji">${state.categoryEmojis[set.id] || '📚'}</div>
      <h3 class="category-name">${escapeHtml(set.name)}</h3>
    </div>
  `).join('');

  // Add click handlers to category cards
  els.categoryGrid.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const setId = card.dataset.setId;
      selectSet(setId);
      showFlashcardView();
    });
  });
}

function showCategoryScreen() {
  state.showCategoryScreen = true;
  els.categoryScreen.classList.add('active');
  els.viewport.style.display = 'none';
}

function showFlashcardView() {
  state.showCategoryScreen = false;
  els.categoryScreen.classList.remove('active');
  els.viewport.style.display = 'grid';
}

async function selectSet(setId){
  const set = state.sets.find(s => s.id === setId) || state.sets[0];
  if(!set){ return; }
  localStorage.setItem('vocab.set', set.id);
  state.items = [...set.items];
  state.order = shuffle(Array.from({length: state.items.length}, (_, i) => i));
  state.index = 0;
  state.showTranslation = false;

  // Update category selection display
  updateCategorySelection(set);

  render();
  ensureProperSizing(); // Ensure sizing after set change
  toast(`Loaded: ${set.name}`);
}

function updateCategorySelection(set) {
  const emoji = state.categoryEmojis[set.id] || '📚';
  const name = set.name;

  els.selectedCategoryEmoji.textContent = emoji;
  els.selectedCategoryName.textContent = name;
  els.setSelect.value = set.id;
}

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function current(){
  if(state.items.length === 0) return null;
  const realIndex = state.order[state.index];
  return state.items[realIndex];
}

function render(){
  const item = current();
  if(!item){ return; }
  els.image.src = item.image;
  els.image.alt = item.word;
  els.word.textContent = item.word;
  els.sentence.textContent = item.sentence;
  els.translation.textContent = item.translation;
  els.translation.hidden = !state.showTranslation;
  els.position.textContent = `${state.index + 1}/${state.items.length}`;
  // Ensure proper sizing after render
  ensureProperSizing();
}

function ensureProperSizing(){
  // Force layout recalculation to ensure card fits within viewport
  requestAnimationFrame(() => {
    const viewport = els.card.parentElement;
    if (viewport) {
      const viewportRect = viewport.getBoundingClientRect();
      const cardRect = els.card.getBoundingClientRect();

      // Debug logging
      console.log('Viewport:', viewportRect.width, 'x', viewportRect.height);
      console.log('Card:', cardRect.width, 'x', cardRect.height);

      // If card is larger than viewport, force it to fit
      if (cardRect.height > viewportRect.height || cardRect.width > viewportRect.width) {
        const newWidth = Math.min(720, viewportRect.width * 0.96);
        const newHeight = Math.min(viewportRect.height, 560);
        console.log('Resizing card to:', newWidth, 'x', newHeight);
        els.card.style.width = newWidth + 'px';
        els.card.style.height = newHeight + 'px';
      } else {
        // Reset to CSS defaults if within bounds
        els.card.style.width = '';
        els.card.style.height = '';
      }
    }
  });
}

function next(){
  if(state.index < state.items.length - 1){
    state.index++;
    state.showTranslation = false;
    render();
  }
}

function prev(){
  if(state.index > 0){
    state.index--;
    state.showTranslation = false;
    render();
  }
}

function toggleTranslation(){
  state.showTranslation = !state.showTranslation;
  els.translation.hidden = !state.showTranslation;
}

function bindControls(){
  els.nextBtn.addEventListener('click', next);
  els.prevBtn.addEventListener('click', prev);
  els.card.addEventListener('click', toggleTranslation);
  els.themeToggle.addEventListener('click', toggleTheme);
  els.categorySelect.addEventListener('click', showCategoryScreen);

  // Keyboard support
  window.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowRight') next();
    else if(e.key === 'ArrowLeft') prev();
    else if(e.key === ' ' || e.key.toLowerCase() === 't') toggleTranslation();
    else if(e.key === 'Escape') {
      if (state.showCategoryScreen) {
        showFlashcardView();
      }
    }
  });

  // Handle window resize to ensure proper sizing
  window.addEventListener('resize', ensureProperSizing);
  // Handle orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(ensureProperSizing, 100);
  });
  bindGestures();
}

function bindGestures(){
  let startX = 0, startY = 0, isTouch = false, hasMoved = false;
  const threshold = 40; // px
  const maxY = 60; // Ignore if too vertical
  const maxTransform = 120; // Max transform distance

  function onStart(clientX, clientY){
    startX = clientX; startY = clientY; isTouch = true; hasMoved = false;
  }
  function onMove(clientX, clientY){
    if(!isTouch) return;
    const dx = clientX - startX; const dy = Math.abs(clientY - startY);
    if (dy > maxY) return;
    if (Math.abs(dx) > 6) hasMoved = true;
    const clampedDx = Math.max(-maxTransform, Math.min(maxTransform, dx));
    els.card.style.transform = `translateX(${clampedDx}px)`;
    els.card.style.transition = 'none';
  }
  function onEnd(clientX){
    if(!isTouch) return; isTouch = false;
    const dx = clientX - startX;
    els.card.style.transition = 'transform 0.2s ease';
    els.card.style.transform = 'translateX(0px)';

    // Force a layout recalculation to ensure proper sizing
    els.card.offsetHeight;

    if(!hasMoved) return;
    if (dx <= -threshold) next();
    else if (dx >= threshold) prev();
  }

  els.card.addEventListener('touchstart', e=>{
    const t = e.changedTouches[0];
    onStart(t.clientX, t.clientY);
  }, {passive:true});
  els.card.addEventListener('touchmove', e=>{
    const t = e.changedTouches[0];
    onMove(t.clientX, t.clientY);
  }, {passive:true});
  els.card.addEventListener('touchend', e=>{
    const t = e.changedTouches[0];
    onEnd(t.clientX);
  });

  // Mouse dragging for desktop testing
  let mouseDown = false;
  els.card.addEventListener('mousedown', e=>{ mouseDown = true; onStart(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e=>{ if(mouseDown) onMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup', e=>{ if(mouseDown){ mouseDown=false; onEnd(e.clientX); } });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"]g/, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function toast(message){
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(els.toast._t);
  els.toast._t = setTimeout(()=>{ els.toast.hidden = true; }, 1200);
}

bindControls();
initializeTheme();

// Hide the old select element
els.setSelect.style.display = 'none';

loadData().then(() => {
  // Ensure proper sizing after initial data load
  setTimeout(ensureProperSizing, 100);
}).catch(err=>{
  console.error(err);
  toast('Failed to load data');
});


