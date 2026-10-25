import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, X, XCircle } from 'lucide-react'
import { ATS_TIPS, runAtsChecks, type AtsLevel } from '../../lib/ats'
import type { ResumeData } from '../../lib/resume'

const LEVEL_META: Record<AtsLevel, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  pass: { icon: CheckCircle2, cls: 'text-ok', label: '通过' },
  warn: { icon: AlertTriangle, cls: 'text-[#b45309] dark:text-[#f0a13c]', label: '建议' },
  fail: { icon: XCircle, cls: 'text-[#c53030]', label: '待补' },
}

/** ATS 自检弹窗：按打开瞬间的简历内容计算检查清单（弹窗为只读，关闭后继续编辑） */
export default function AtsModal({
  onClose,
  data,
  paperHeight,
}: {
  onClose: () => void
  data: ResumeData
  paperHeight?: number
}) {
  const summary = useMemo(() => runAtsChecks({ data, paperHeight }), [data, paperHeight])

  const verdict = summary.fail
    ? `还有 ${summary.fail} 项待补——补齐后再导出，机筛通过率更稳`
    : summary.warn
      ? `可以导出。${summary.warn} 条建议能让机筛解析更顺`
      : '全部通过，可以放心导出'

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="ATS 自检清单"
    >
      <div className="max-h-[86vh] w-full max-w-2xl overflow-auto rounded-xl border border-line bg-surface p-5 shadow-none">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <ClipboardCheck size={17} className="text-accent-strong" /> ATS 自检清单
          </h2>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="rounded-lg border border-line p-1.5 text-ink-2 transition-colors hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-2">
          按你当前填写的内容实时检查（共 {summary.pass + summary.warn + summary.fail} 项）。
          清单只给建议、<b className="text-ink">不会拦截导出</b>；关闭弹窗继续编辑，改完可再打开复查。
        </p>

        <div
          className={`mt-3 rounded-lg border px-3.5 py-2.5 text-sm font-medium ${
            summary.fail
              ? 'border-[#c53030]/30 bg-[#c53030]/5 text-[#c53030]'
              : summary.warn
                ? 'border-[#b45309]/30 bg-[#b45309]/5 text-[#b45309] dark:text-[#f0a13c]'
                : 'border-ok/30 bg-ok/5 text-ok'
          }`}
        >
          {verdict}
          <span className="ml-2 text-xs font-normal opacity-80">
            {summary.fail} 待补 · {summary.warn} 建议 · {summary.pass} 通过
          </span>
        </div>

        {summary.groups.map((group) => (
          <section key={group.id} className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-2">{group.label}</h3>
            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
              {group.checks.map((c) => {
                const { icon: Icon, cls, label } = LEVEL_META[c.level]
                return (
                  <li key={c.id} className="flex items-start gap-2.5 px-3.5 py-2.5">
                    <Icon size={15} className={`mt-0.5 flex-none ${cls}`} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm">
                        {c.title}
                        <span className={`ml-2 text-[10px] font-medium ${cls}`}>{label}</span>
                      </p>
                      {c.detail && <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{c.detail}</p>}
                    </div>
                  </li>
                )
              })}
              {group.checks.length === 0 && <li className="px-3.5 py-2.5 text-xs text-ink-2">本组暂无可检查项</li>}
            </ul>
          </section>
        ))}

        <section className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-2">导出小贴士（本站已内置的 ATS 保障）</h3>
          <ul className="mt-2 space-y-1.5 rounded-lg border border-line bg-paper px-3.5 py-3">
            {ATS_TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs leading-relaxed text-ink-2">
                <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-accent-strong px-4 py-2 text-sm font-medium text-paper transition-all hover:bg-ink active:scale-[0.97]"
          >
            继续编辑
          </button>
        </div>
      </div>
    </div>
  )
}
