import { registerSW } from 'virtual:pwa-register'

let registration: ServiceWorkerRegistration | undefined

/**
 * Registers the service worker ourselves (vite.config.ts sets
 * injectRegister: false) instead of using the plugin's auto-injected
 * script, which only ever registers once on load and has no way to force
 * a fresh check — exactly the "shows a stale build" problem. This keeps
 * a handle on the registration so checkForUpdate() below can drive it.
 *
 * Still fully "autoUpdate": the moment a new version is found — whether
 * by the browser's own background check or by checkForUpdate() — it's
 * applied immediately, no confirmation prompt.
 */
const applyUpdate = registerSW({
  immediate: true,
  onRegisteredSW(_url, r) {
    registration = r
  },
  onNeedRefresh() {
    applyUpdate(true)
  },
})

/**
 * Forces an immediate check against the network for a new version,
 * bypassing the browser's own ~24h throttle on automatic checks. If one
 * is found it's applied right away (the page reloads on its own) — this
 * function just kicks off the check. Returns false if the service worker
 * never registered (e.g. this browser doesn't support one), so the
 * caller can tell the user rather than pretend nothing happened.
 */
export async function checkForUpdate(): Promise<boolean> {
  if (!registration) return false
  await registration.update()
  return true
}
