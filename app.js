const state = {
  sets: [],
  order: [],
  items: [],
  index: 0,
  showTranslation: false,
  currentScreen: 'home', // 'home' or 'cards'
  currentSet: null,
  theme: localStorage.getItem('vocab.theme') || 'dark',
};

const els = {
  homeScreen: document.getElementById('homeScreen'),
  cardScreen: document.getElementById('cardScreen'),
  categoryGrid: document.getElementById('categoryGrid'),
  setSelectBtn: document.getElementById('setSelectBtn'),
  categoryEmoji: document.getElementById('categoryEmoji'),
  categoryModal: document.getElementById('categoryModal'),
  categoryList: document.getElementById('categoryList'),
  closeModal: document.getElementById('closeModal'),
  themeToggle: document.getElementById('themeToggle'),
  themeToggleCard: document.getElementById('themeToggleCard'),
  image: document.getElementById('image'),
  word: document.getElementById('word'),
  sentence: document.getElementById('sentence'),
  translation: document.getElementById('translation'),
  card: document.getElementById('card'),
  position: document.getElementById('position'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  toast: document.getElementById('toast'),
};

async function loadData(){
  const res = await fetch('/data/vocab.json');
  if(!res.ok) throw new Error('Failed to load data');
  const data = await res.json();
  state.sets = data.sets || [];
  renderCategoryGrid();
  renderCategoryList();
  applyTheme();
}

function renderCategoryGrid(){
  els.categoryGrid.innerHTML = state.sets.map(set => `
    <div class="category-card" data-set-id="${set.id}">
      <div class="category-card-emoji">${set.emoji || '📚'}</div>
      <h3 class="category-card-name">${escapeHtml(set.name)}</h3>
      <p class="category-card-count">${set.items.length} cards</p>
    </div>
  `).join('');
  
  // Add click handlers
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const setId = card.dataset.setId;
      selectSet(setId);
    });
  });
}

function renderCategoryList(){
  els.categoryList.innerHTML = state.sets.map(set => `
    <div class="category-item" data-set-id="${set.id}">
      <div class="category-item-emoji">${set.emoji || '📚'}</div>
      <div class="category-item-info">
        <h4 class="category-item-name">${escapeHtml(set.name)}</h4>
        <p class="category-item-count">${set.items.length} cards</p>
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      const setId = item.dataset.setId;
      selectSet(setId);
      closeModal();
    });
  });
}

async function selectSet(setId){
  const set = state.sets.find(s => s.id === setId) || state.sets[0];
  if(!set){ return; }
  localStorage.setItem('vocab.set', set.id);
  state.currentSet = set;
  state.items = [...set.items];
  state.order = shuffle(Array.from({length: state.items.length}, (_, i) => i));
  state.index = 0;
  state.showTranslation = false;
  
  // Update category selector button
  els.categoryEmoji.textContent = set.emoji || '📚';
  
  // Switch to card screen
  showScreen('cards');
  render();
  ensureProperSizing();
  toast(`Loaded: ${set.name}`);
}

function showScreen(screen){
  state.currentScreen = screen;
  if(screen === 'home'){
    els.homeScreen.hidden = false;
    els.cardScreen.hidden = true;
  } else {
    els.homeScreen.hidden = true;
    els.cardScreen.hidden = false;
  }
}

function openModal(){
  els.categoryModal.hidden = false;
}

function closeModal(){
  els.categoryModal.hidden = true;
}

function toggleTheme(){
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('vocab.theme', state.theme);
  applyTheme();
}

function applyTheme(){
  const root = document.documentElement;
  root.setAttribute('data-theme', state.theme);
  
  // Update theme toggle icons
  const icon = state.theme === 'dark' ? '🌙' : '☀️';
  const themeIcons = document.querySelectorAll('.theme-icon');
  themeIcons.forEach(el => el.textContent = icon);
  
  // Update meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if(metaTheme){
    metaTheme.content = state.theme === 'dark' ? '#0b1020' : '#f5f7fb';
  }
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
  // Card navigation
  els.nextBtn.addEventListener('click', next);
  els.prevBtn.addEventListener('click', prev);
  els.card.addEventListener('click', toggleTranslation);
  
  // Theme toggles
  els.themeToggle.addEventListener('click', toggleTheme);
  els.themeToggleCard.addEventListener('click', toggleTheme);
  
  // Category selection
  els.setSelectBtn.addEventListener('click', openModal);
  els.closeModal.addEventListener('click', closeModal);
  els.categoryModal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  
  // Keyboard support
  window.addEventListener('keydown', (e)=>{
    if(state.currentScreen === 'cards'){
      if(e.key === 'ArrowRight') next();
      else if(e.key === 'ArrowLeft') prev();
      else if(e.key === ' ' || e.key.toLowerCase() === 't') toggleTranslation();
      else if(e.key === 'Escape' && !els.categoryModal.hidden) closeModal();
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
loadData().then(() => {
  // Show home screen initially
  showScreen('home');
}).catch(err=>{
  console.error(err);
  toast('Failed to load data');
});


