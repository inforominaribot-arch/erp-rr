const CACHE_NAME = "erp-rr-mediciones-v1"

const CORE_ASSETS = [
  "/mediciones",
  "/mediciones/nueva",
  "/manifest.json",
  "/globe.svg",
]

// Instalar Service Worker y precachear el núcleo offline
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn("[SW] Advertencia precacheando assets:", err)
      })
    })
  )
  self.skipWaiting()
})

// Activar Service Worker y limpiar cachés anteriores
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Interceptar peticiones de red
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo peticiones GET en el mismo origen
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return
  }

  // Ignorar peticiones de desarrollo de Next.js hot-reload
  if (
    url.pathname.includes("/_next/webpack-hmr") ||
    url.pathname.includes("__nextjs")
  ) {
    return
  }

  // 1. Archivos estáticos de Next.js (_next/static, fuentes, svg): Cache First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        })
      })
    )
    return
  }

  // 2. Navegación de páginas HTML: Network First con fallback a caché offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(async () => {
          // Sin conexión: buscar en caché
          const cached = await caches.match(request)
          if (cached) return cached
          // Fallbacks a formularios de mediciones
          const fallbackNueva = await caches.match("/mediciones/nueva")
          if (fallbackNueva) return fallbackNueva
          const fallbackMediciones = await caches.match("/mediciones")
          if (fallbackMediciones) return fallbackMediciones
          return new Response(
            "<html><body><h2>Sin conexión a Internet</h2><p>Por favor abre la App de Mediciones instalada.</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          )
        })
    )
    return
  }

  // 3. Fallback genérico: Network first con rescate de caché
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})
