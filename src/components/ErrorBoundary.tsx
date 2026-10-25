import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'

/**
 * React 错误边界：渲染崩溃时显示兜底 UI 而不是白屏。
 * - variant="page"：包住整个应用（main.tsx），兜底整页提示；
 * - variant="panel"：包住局部区域（如编辑器预览），崩溃只影响该区域。
 * 「重试」通过内部 attempt 计数 remount 子树，重新初始化出错组件。
 * 注意：数据保存在 localStorage，与渲染生命周期无关——兜底文案里如实说明，避免用户误以为数据丢了。
 */

interface Props {
  children: ReactNode
  variant?: 'page' | 'panel'
  title?: string
}

interface State {
  error: Error | null
  attempt: number
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private retry = () => this.setState((s) => ({ error: null, attempt: s.attempt + 1 }))

  render() {
    const { error } = this.state
    if (!error) {
      return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>
    }

    if (this.props.variant === 'panel') {
      return (
        <div
          role="alert"
          className="flex min-h-[380px] flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface p-8 text-center"
        >
          <TriangleAlert size={22} className="text-accent-strong" aria-hidden />
          <p className="font-medium">{this.props.title ?? '这一块渲染出错了'}</p>
          <p className="max-w-[42ch] text-xs leading-relaxed text-ink-2">
            你的简历数据仍保存在本机，不会丢失。点击重试重新渲染；若持续出错，刷新页面即可恢复。
          </p>
          <button
            type="button"
            onClick={this.retry}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition-all duration-200 hover:bg-ink/85 active:scale-[0.97]"
          >
            <RotateCcw size={13} /> 重试
          </button>
        </div>
      )
    }

    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <span className="inline-block h-3 w-3 rounded-[3px] bg-accent" aria-hidden />
        <h1 className="font-display text-2xl font-semibold">{this.props.title ?? '页面出了点问题'}</h1>
        <p className="max-w-[46ch] text-sm leading-relaxed text-ink-2">
          你的简历数据保存在浏览器本地，不会因为这个错误丢失。
        </p>
        {error.message && (
          <pre className="max-w-[80vw] overflow-auto rounded-lg border border-line bg-surface px-4 py-2 text-xs text-ink-2">
            {error.message}
          </pre>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={this.retry}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-strong px-4 py-2 text-sm font-medium text-paper transition-all duration-200 hover:bg-ink active:scale-[0.97]"
          >
            <RotateCcw size={13} /> 重试
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-ink px-4 py-2 text-sm font-medium transition-colors hover:bg-surface active:scale-[0.97]"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }
}
