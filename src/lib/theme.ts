import { useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const KEY = 'plainpage-theme'
const listeners = new Set<() => void>()

function init(): ThemeMode {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    /* localStorage 不可用时跟随系统 */
  }
  return 'system'
}

let current: ThemeMode = init()

export function applyTheme(mode: ThemeMode) {
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function setTheme(mode: ThemeMode) {
  current = mode
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    /* ignore */
  }
  applyTheme(mode)
  listeners.forEach((l) => l())
}

export function cycleTheme() {
  setTheme(current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light')
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', cb)
  return () => {
    listeners.delete(cb)
    mq.removeEventListener('change', cb)
  }
}

export function useTheme(): ThemeMode {
  return useSyncExternalStore(subscribe, () => current)
}

/** 应用启动时调用一次：恢复上次选择并跟随系统变化 */
export function initTheme() {
  applyTheme(current)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (current === 'system') applyTheme(current)
  })
}
