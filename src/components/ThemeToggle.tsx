import { Monitor, Moon, Sun } from 'lucide-react'
import { cycleTheme, useTheme } from '../lib/theme'

/** 主题三态切换：浅色 → 深色 → 跟随系统 */
export default function ThemeToggle() {
  const theme = useTheme()
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const label = theme === 'dark' ? '深色' : theme === 'light' ? '浅色' : '跟随系统'
  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`当前主题：${label}，点击切换`}
      title={`主题：${label}（点击切换 浅色/深色/跟随系统）`}
      className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-line bg-surface text-ink-2 transition-colors duration-200 hover:text-ink"
    >
      <Icon size={16} />
    </button>
  )
}
