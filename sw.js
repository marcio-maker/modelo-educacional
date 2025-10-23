// sw.js - Service Worker para Aha! Academy PWA (Otimizado com Push)
const CACHE_NAME = 'aha-academy-v2.1.0'; // Atualização de versão
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  // Assets: assumindo que estas imagens estão na pasta 'img'
  '/img/logo-48x48.png',
  '/img/logo-72x72.png',
  '/img/logo-96x96.png',
  '/img/logo-144x144.png',
  '/img/logo-192x192.png',
  '/img/logo-512x512.png',
  '/img/maskable_icon.png',
  '/img/default-user.webp',
  '/img/hero1.webp',
  '/img/hero2.webp',
  '/img/hero3.webp',
  '/img/course1.webp',
  '/img/course2.webp',
  // Fontes/Ícones (CRUCIAL: Garante Font Awesome offline)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto, pré-armazenando recursos.');
      // O 'add' pode falhar para alguns recursos (ex: ícones externos), usamos 'addAll' para tentar o máximo possível
      return cache.addAll(urlsToCache).catch((error) => {
        console.warn('[SW] Falha ao pré-armazenar alguns recursos:', error);
      });
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado.');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`🗑️ Deletando cache antigo: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de Cache: Cache with Network Fallback, melhorado para vídeos
self.addEventListener('fetch', (event) => {
  // Exclusão de YouTube: Se a URL contém 'youtube.com', vai direto para a rede.
  if (event.request.url.includes('youtube.com') || event.request.url.includes('ytimg.com')) {
    event.respondWith(fetch(event.request).catch(() => console.warn(`[SW] Falha ao buscar recurso YT: ${event.request.url}`)));
    return;
  }

  // Estratégia principal: Tenta cache, se falhar, tenta rede.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          console.warn(`[SW] Falha ao buscar recurso: ${event.request.url}`);
          // Fallback final: se não está no cache e a rede falhou (offline), pode retornar uma página de fallback
          // if (event.request.mode === 'navigate') { return caches.match('/index.html'); } // Exemplo
        });
      })
  );
});

// =======================================
// [NOVO] MELHORIA 1: Lógica de Notificação Push
// =======================================

// Ouvinte para receber a notificação push (requer um servidor para enviar a mensagem)
self.addEventListener('push', (event) => {
  // Fallback de dados caso o payload do servidor esteja vazio ou corrompido
  const data = event.data?.json() || { 
    title: 'Não perca sua sequência!', 
    body: 'Volte para a Aha! Academy e mantenha seu progresso.',
    icon: '/img/logo-192x192.png'
  };

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.icon, // Ícone pequeno na barra (Android)
    data: {
      url: data.url || '/' // URL para onde o usuário será levado ao clicar
    }
  };

  // Garante que a notificação será exibida
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Ouvinte para o clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    // 1. Tenta encontrar uma janela existente para focar
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. Se não encontrar, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});