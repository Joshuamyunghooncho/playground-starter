// Safe, namespaced localStorage helpers. Never throws (private mode, quota,
// SSR). Call from effects or event handlers only, never during render.

const PREFIX = "playground"

export function storageKey(namespace: string, key: string) {
  return `${PREFIX}:${namespace}:${key}`
}

export function readStorage<T>(namespace: string, key: string): T | undefined {
  try {
    if (typeof window === "undefined") return undefined
    const raw = window.localStorage.getItem(storageKey(namespace, key))
    return raw === null ? undefined : (JSON.parse(raw) as T)
  } catch {
    return undefined
  }
}

export function writeStorage(namespace: string, key: string, value: unknown) {
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(storageKey(namespace, key), JSON.stringify(value))
  } catch {
    // Ignore: storage full or unavailable.
  }
}

export function removeStorage(namespace: string, key: string) {
  try {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(storageKey(namespace, key))
  } catch {
    // Ignore.
  }
}
