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
  if (els.setSelect) {
    els.setSelect.innerHTML = state.sets.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
    els.setSelect.addEventListener('change', () => selectSet(els.setSelect.value));
  }
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
  if (els.setSelect) {
    els.setSelect.value = set.id;
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

  // Add entrance animation for new cards
  els.card.style.transition = 'none';
  els.card.style.transform = 'translateY(20px) scale(0.95) rotateX(10deg)';
  els.card.style.opacity = '0';

  // Force reflow
  els.card.offsetHeight;

  // Animate in
  requestAnimationFrame(() => {
    els.card.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease';
    els.card.style.transform = 'translateY(0px) scale(1) rotateX(0deg)';
    els.card.style.opacity = '1';
  });

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
  if(state.index < state.items.length - 1 && !isAnimating){
    state.index++;
    state.showTranslation = false;
    render();
  }
}

function prev(){
  if(state.index > 0 && !isAnimating){
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

// Global animation state
let isAnimating = false;

function bindGestures(){
  let startX = 0, startY = 0, isTouch = false, hasMoved = false;
  const threshold = 80; // Increased threshold for more deliberate swipes
  const maxY = 100; // Allow more vertical movement
  const maxTransform = 200; // Allow more horizontal movement

  function onStart(clientX, clientY){
    if (isAnimating) return;
    startX = clientX; startY = clientY; isTouch = true; hasMoved = false;
  }

  function onMove(clientX, clientY){
    if(!isTouch || isAnimating) return;
    const dx = clientX - startX;
    const dy = Math.abs(clientY - startY);

    // Allow more vertical tolerance for natural card movement
    if (dy > maxY && Math.abs(dx) < 50) return;

    if (Math.abs(dx) > 10) hasMoved = true;

    const clampedDx = Math.max(-maxTransform, Math.min(maxTransform, dx));

    // Add rotation and perspective for stack effect
    const rotation = clampedDx * 0.1; // Subtle rotation based on horizontal movement
    const scale = Math.max(0.95, 1 - Math.abs(clampedDx) * 0.001); // Slight scale down when dragging far

    els.card.style.transform = `
      translateX(${clampedDx}px)
      rotate(${rotation}deg)
      scale(${scale})
      translateZ(0)
    `;
    els.card.style.transition = 'none';
    els.card.style.zIndex = '1000';

    // Add shadow effect based on movement
    const shadowOpacity = Math.min(Math.abs(clampedDx) / 100, 0.3);
    els.card.style.boxShadow = `
      0 10px 30px rgba(0,0,0,${0.35 + shadowOpacity}),
      0 ${Math.abs(clampedDx) * 0.5}px ${Math.abs(clampedDx) * 2}px rgba(0,0,0,${shadowOpacity})
    `;
  }

  function onEnd(clientX, clientY){
    if(!isTouch || isAnimating) return;
    isTouch = false;
    const dx = clientX - startX;
    const dy = Math.abs(clientY - startY);

    // If moved too much vertically, reset without action
    if (dy > maxY && Math.abs(dx) < 50) {
      resetCard();
      return;
    }

    if(!hasMoved) {
      resetCard();
      return;
    }

    isAnimating = true;

    if (dx <= -threshold) {
      // Swipe left - throw card to the right (next card)
      animateCardOut('next');
    } else if (dx >= threshold) {
      // Swipe right - throw card to the left (previous card)
      animateCardOut('prev');
    } else {
      // Not enough movement, reset card
      resetCard();
    }
  }

  function animateCardOut(direction) {
    const dx = direction === 'next' ? -maxTransform - 100 : maxTransform + 100;
    const rotation = direction === 'next' ? -30 : 30;
    const endX = dx;
    const endRotation = rotation;

    els.card.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    els.card.style.transform = `
      translateX(${endX}px)
      rotate(${endRotation}deg)
      scale(0.8)
      translateZ(0)
    `;

    // Animate out and then change card
    setTimeout(() => {
      if (direction === 'next') {
        next();
      } else {
        prev();
      }

      // Reset animation flag after card change
      setTimeout(() => {
        isAnimating = false;
      }, 50);
    }, 200);
  }

  function resetCard() {
    if (isAnimating) return;

    els.card.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    els.card.style.transform = 'translateX(0px) rotate(0deg) scale(1) translateZ(0)';
    els.card.style.zIndex = '1';
    els.card.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
  }

  // Add transition end listener for cleanup
  els.card.addEventListener('transitionend', () => {
    if (!isTouch) {
      resetCard();
    }
  });

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
    onEnd(t.clientX, t.clientY);
  });

  // Mouse dragging for desktop testing
  let mouseDown = false;
  els.card.addEventListener('mousedown', e=>{
    if (isAnimating) return;
    mouseDown = true;
    onStart(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', e=>{
    if(mouseDown) onMove(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', e=>{
    if(mouseDown){
      mouseDown = false;
      onEnd(e.clientX, e.clientY);
    }
  });
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

// Hide the old select element (if it exists)
if (els.setSelect) {
  els.setSelect.style.display = 'none';
}

loadData().then(() => {
  // Ensure proper sizing after initial data load
  setTimeout(ensureProperSizing, 100);
}).catch(err=>{
  console.error(err);
  toast('Failed to load data');
});


