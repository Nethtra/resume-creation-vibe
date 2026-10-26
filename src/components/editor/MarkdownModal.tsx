import { useRef, useState } from 'react'
import { FileCode2, Upload, X } from 'lucide-react'
import { MARKDOWN_SAMPLE } from '../../lib/markdown'

/** Markdown 导入弹窗：粘贴或上传 .md，按标题层级解析为结构化简历（覆盖当前内容） */
export default function MarkdownModal({ onClose, onApply }: { onClose: () => void; onApply: (md: string) => string | null }) {
  const [text, setText] = useState(MARKDOWN_SAMPLE)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setText(await file.text())
    setErr(null)
  }

  const submit = () => {
    if (!text.trim()) {
      setErr('内容为空，请粘贴或上传 Markdown')
      return
    }
    const result = onApply(text)
    if (result) setErr(result)
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Markdown 导入">
      <div className="w-full max-w-2xl rounded-xl border border-line bg-surface p-5 shadow-none">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <FileCode2 size={17} className="text-accent-strong" /> Markdown 导入
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
          粘贴 Markdown 或上传 .md 文件，按标题解析：<code># 姓名</code>、<code>## 分区</code>（基本信息 / 教育经历 /
          实习(工作)经历 / 项目经历 / 技能 / 证书 / 荣誉奖项 / 个人优势）、<code>### 条目</code>、<code>- 描述</code>。
          <b className="text-accent-strong">导入会覆盖当前内容</b>，建议先「导出 JSON」备份。
        </p>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setErr(null)
          }}
          spellCheck={false}
          className="mt-3 h-60 w-full resize-y rounded-lg border border-line bg-paper p-3 font-mono text-xs leading-relaxed outline-none transition-colors focus:border-ink-2"
        />
        {err && (
          <p role="alert" className="mt-2 text-xs text-[#c53030]">
            {err}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm transition-colors hover:bg-paper"
          >
            <Upload size={13} /> 上传 .md 文件
          </button>
          <input ref={fileRef} type="file" accept=".md,.markdown,text/markdown" className="hidden" onChange={onFile} />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-ink px-4 py-2 text-sm font-medium transition-colors hover:bg-paper">
              取消
            </button>
            <button
              type="button"
              onClick={submit}
              className="rounded-lg bg-accent-strong px-4 py-2 text-sm font-medium text-paper transition-all hover:bg-ink active:scale-[0.97]"
            >
              解析并导入
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
