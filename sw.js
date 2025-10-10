// Simple service worker for offline caching
const CACHE_NAME = 'vocab-cards-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
});

self.addEventListener('fetch', (event) => {
  // Optional: Add caching logic here if needed
});
