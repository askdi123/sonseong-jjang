const CACHE_NAME = 'sonseong-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Service Worker 설치
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Service Worker 활성화
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if(cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 네트워크 요청 처리
self.addEventListener('fetch', event => {
  // 외부 리소스는 네트워크 우선
  if(event.request.url.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const cache = caches.open(CACHE_NAME);
          cache.then(c => c.put(event.request, response.clone()));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // HTML 파일: 네트워크 우선
  if(event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 기타: 캐시 우선
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        if(event.request.destination === 'image') {
          return new Response('이미지를 불러올 수 없습니다', {status: 404});
        }
      })
  );
});

// 백그라운드 동기 (선택사항)
self.addEventListener('sync', event => {
  if(event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

function syncData() {
  // 여기에 데이터 동기화 로직 추가 가능
  return Promise.resolve();
}
