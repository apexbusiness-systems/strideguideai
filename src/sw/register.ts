// @stride/sw-register v3.1 — Scoped to /app/sw.js in production; unregisters root SW; preview cleanup
export function registerSW() {
  const isPreview = window.location.hostname.includes('lovableproject.com');
  const isAppRoute = window.location.pathname.startsWith('/app');
  
  if (!("serviceWorker" in navigator)) {
    console.warn('[SW] Service Worker API not supported in this browser');
    return;
  }
  
  // Preview mode: unregister all SW and clear caches
  if (isPreview) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      Promise.all(regs.map(r => r.unregister())).catch(err => {
        console.warn('[SW] Preview: Failed to unregister some workers:', err);
      });
    });
    if ('caches' in window) {
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name))).catch(err => {
          console.warn('[SW] Preview: Failed to clear some caches:', err);
        });
      });
    }
    console.log('[SW] Preview: all workers unregistered, caches cleared');
    return;
  }
  
  // Production mode only (skip in dev to avoid conflicts)
  if (import.meta.env.DEV) {
    console.log('[SW] Dev mode: skipping service worker registration');
    return;
  }
  
  // Marketing pages (/auth, /, etc.): unregister any root-level SW
  if (!isAppRoute) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => {
        if (r.scope === window.location.origin + '/' || !r.scope.includes('/app/')) {
          console.log(`[SW] Marketing page: unregistering non-/app/ worker at ${r.scope}`);
          r.unregister().catch(err => {
            console.warn(`[SW] Failed to unregister worker at ${r.scope}:`, err);
          });
        }
      });
    });
    return;
  }
  
  // PWA /app/ route: register scoped worker at /app/sw.js
  navigator.serviceWorker.register("/app/sw.js", { scope: "/app/" })
    .then(reg => {
      console.log(`[SW] Registered /app/ worker: ${reg.scope}`);
      
      // Check if service worker is already active
      if (reg.active) {
        console.log(`[SW] Service worker is active: ${reg.active.scriptURL}`);
      }
      
      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        
        console.log('[SW] New service worker found, installing...');
        
        newSW.addEventListener("statechange", () => {
          console.log(`[SW] Service worker state changed: ${newSW.state}`);
          
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            const ev = new CustomEvent("sw:update", { detail: { version: "v3.1", scope: "/app/" } });
            window.dispatchEvent(ev);
            console.log('[SW] Service worker update available');
          }
          
          if (newSW.state === "activated") {
            console.log('[SW] New service worker activated');
          }
        });
      });
    })
    .catch(err => {
      console.error('[SW] Registration failed:', err);
      // Emit error event for diagnostic purposes
      const ev = new CustomEvent("sw:error", { detail: { error: err.message || String(err) } });
      window.dispatchEvent(ev);
    });
}
