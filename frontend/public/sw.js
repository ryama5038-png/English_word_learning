const CACHE_NAME = 'vocab-app-cache-v1';

// インストール時に事前キャッシュ（プレキャッシュ）する主要静的リソース
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 1. インストールイベント: 静的リソースをキャッシュに保存
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. アクティベートイベント: 古いバージョンのキャッシュを削除してクリーンアップ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
            return null;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. フェッチイベント: Stale-While-Revalidate / キャッシュファースト戦略でオフライン起動に対応
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET リクエスト以外（POST/PUT/DELETE等）や chrome-extension スキーム等はスキップ
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // バックエンド API リクエスト (/api/ 等、または別ポートのAPIサーバー) はキャッシュせずネットワーク優先
  if (url.pathname.startsWith('/api') || url.port === '8000') {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // ネットワークから最新リソースを取得してキャッシュを更新する非同期処理
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // オフライン時の画面遷移（HTMLナビゲーション）は index.html をフォールバック返却
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return cachedResponse;
        });

      // キャッシュがあれば即座に返し（高速表示＆オフライン対応）、裏でキャッシュを更新
      return cachedResponse || fetchPromise;
    })
  );
});
