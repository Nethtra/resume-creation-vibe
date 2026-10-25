import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Download, Eye, EyeOff, FileCode2, ImageDown, Loader2, PenLine, RotateCcw, SlidersHorizontal, Sparkles, Trash2, Upload } from 'lucide-react'
import ResumePaper from '../components/ResumePaper'
import ThemeToggle from '../components/ThemeToggle'
import EditorForm from '../components/editor/EditorForm'
import MarkdownModal from '../components/editor/MarkdownModal'
import { parseMarkdown } from '../lib/markdown'
import { exportPdf, exportPng, exportPdfMinimal } from '../lib/export'
import {
  ACCENTS,
  DEFAULT_SPACING,
  FONTS,
  type ResumeData,
  type Spacing,
  type TemplateVariant,
  type Typography,
} from '../lib/resume'
import { useEditor } from '../store/resume'

const A4_WIDTH = 794
/** A4 高度 @96dpi（内容超过此高度时双栏模板的 PDF 会压缩进单页） */
const A4_HEIGHT_PX = 1123
const TYPO_SIZES = [9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 14, 15]
const TYPO_LINES = [1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2]
const SPACING_FIELDS: { key: keyof Spacing; label: string; min: number; max: number }[] = [
  { key: 'pt', label: '页面上边距', min: 12, max: 56 },
  { key: 'px', label: '页面左右边距', min: 12, max: 56 },
  { key: 'indent', label: '内容缩进', min: 0, max: 24 },
  { key: 'secGap', label: '模块上边距', min: 6, max: 32 },
  { key: 'titleGap', label: '标题下边距', min: 0, max: 16 },
]

const TEMPLATES: { id: TemplateVariant; label: string }[] = [
  { id: 'classic', label: '经典单栏' },
  { id: 'sidebar', label: '双栏简洁' },
  { id: 'blocks', label: '简约色块' },
  { id: 'centered', label: '居中雅致' },
  { id: 'dark', label: '深色商务' },
  { id: 'band', label: '顶部色带' },
]

const btnGhost =
  'inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-all duration-200 hover:border-ink-2 hover:bg-paper active:scale-[0.97]'

function SavedBadge() {
  const savedAt = useEditor((s) => s.savedAt)
  return (
    <span key={savedAt} className="saved-flash hidden items-center gap-1 text-xs text-ok sm:inline-flex">
      <Check size={13} aria-hidden /> 已自动保存 · 本地
    </span>
  )
}

function PreviewPane({ className = '', template, accentId, data, typography, spacing, onInnerHeight, hideEmpty, setHideEmpty }: {
  className?: string
  template: TemplateVariant
  accentId: string
  data: ResumeData
  typography: Typography
  spacing: Spacing
  /** 纸面自然高度（未缩放 px），供导出时判断内容是否超出 A4 一页 */
  onInnerHeight?: (h: number) => void
  hideEmpty: boolean
  setHideEmpty: (v: boolean) => void
}) {
  const setTemplate = useEditor((s) => s.setTemplate)
  const setAccentId = useEditor((s) => s.setAccentId)
  const setTypo = useEditor((s) => s.setTypo)
  const setSpacing = useEditor((s) => s.setSpacing)
  const sectionOrder = useEditor((s) => s.sectionOrder)
  const sidebarPct = useEditor((s) => s.sidebarPct)
  const setSidebarPct = useEditor((s) => s.setSidebarPct)

  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [innerH, setInnerH] = useState(1123)
  const [spacingOpen, setSpacingOpen] = useState(false)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!wrap || !inner) return
    const update = () => {
      setScale(Math.min(1, (wrap.clientWidth - 28) / A4_WIDTH))
      setInnerH(inner.offsetHeight)
      onInnerHeight?.(inner.offsetHeight)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(wrap)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  const accent = ACCENTS.find((a) => a.id === accentId) ?? ACCENTS[0]

  return (
    <section
      aria-label="实时预览"
      className={`${className} min-w-0 flex-col max-lg:h-[calc(100dvh-200px)] lg:sticky lg:top-[68px] lg:h-[calc(100vh-92px)]`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div role="tablist" aria-label="简历模板" className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={template === t.id}
              onClick={() => setTemplate(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                template === t.id ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 排版个性化：字体 / 字号 / 行距 / 主题色 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-2 text-xs text-ink-2">
        <label className="flex items-center gap-1.5">
          字体
          <select
            value={typography.font}
            onChange={(e) => setTypo({ font: e.target.value as Typography['font'] })}
            className="rounded-md border border-line bg-surface px-1.5 py-1 text-xs text-ink outline-none transition-colors focus:border-ink-2"
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          字号
          <select
            value={typography.size}
            onChange={(e) => setTypo({ size: Number(e.target.value) })}
            className="rounded-md border border-line bg-surface px-1.5 py-1 text-xs text-ink outline-none transition-colors focus:border-ink-2"
          >
            {TYPO_SIZES.map((px) => (
              <option key={px} value={px}>
                {px}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          行距
          <select
            value={typography.lineHeight}
            onChange={(e) => setTypo({ lineHeight: Number(e.target.value) })}
            className="rounded-md border border-line bg-surface px-1.5 py-1 text-xs text-ink outline-none transition-colors focus:border-ink-2"
          >
            {TYPO_LINES.map((lh) => (
              <option key={lh} value={lh}>
                {lh}
              </option>
            ))}
          </select>
        </label>
        <span className="flex items-center gap-1.5">
          主题色
          <span role="group" aria-label="简历主题色" className="flex items-center gap-1.5">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-label={`主题色：${a.label}`}
                aria-pressed={accentId === a.id}
                title={a.label}
                onClick={() => setAccentId(a.id)}
                style={{ background: a.accent }}
                className={`h-5 w-5 rounded-full transition-transform duration-150 ${
                  accentId === a.id ? 'scale-110 ring-2 ring-ink ring-offset-2 ring-offset-paper' : 'hover:scale-110'
                }`}
              />
            ))}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setHideEmpty(!hideEmpty)}
          aria-pressed={hideEmpty}
          title={hideEmpty ? '已开启：未填写的模块不出现在简历上（点击关闭）' : '已关闭：空模块会以标题形式显示（点击开启）'}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
            hideEmpty ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2 hover:text-ink'
          }`}
        >
          {hideEmpty ? <EyeOff size={12} /> : <Eye size={12} />} 隐藏空模块
        </button>
        <span className="relative">
          <button
            type="button"
            onClick={() => setSpacingOpen((v) => !v)}
            aria-expanded={spacingOpen}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 ${
              spacingOpen ? 'border-ink text-ink' : 'border-line bg-surface text-ink-2 hover:text-ink'
            }`}
          >
            <SlidersHorizontal size={12} /> 间距
          </button>
          {spacingOpen && (
            <>
              <div className="fixed inset-0 z-20" aria-hidden onClick={() => setSpacingOpen(false)} />
              <div className="absolute left-0 top-full z-30 mt-1.5 w-72 rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold">间距配置</h3>
                  <button
                    type="button"
                    onClick={() => setSpacing(DEFAULT_SPACING)}
                    className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[10px] text-ink-2 transition-colors hover:text-ink"
                  >
                    <RotateCcw size={10} /> 重置
                  </button>
                </div>
                <div className="mt-3 space-y-2.5">
                  {SPACING_FIELDS.map(({ key, label, min, max }) => (
                    <label key={key} className="flex items-center gap-2 text-xs">
                      <span className="w-[86px] flex-none text-ink-2">{label}</span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={spacing[key]}
                        aria-label={label}
                        onChange={(e) => setSpacing({ [key]: Number(e.target.value) })}
                        className="flex-1 accent-accent-strong"
                      />
                      <span className="w-9 flex-none text-right tabular-nums text-ink">{spacing[key]}px</span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 border-t border-line pt-2 text-[10px] leading-relaxed text-ink-2">
                  对所有模板生效；「简约色块 / 经典单栏」的页边距、「双栏简洁」主栏内边距随动。
                </p>
              </div>
            </>
          )}
        </span>
      </div>

      <div ref={wrapRef} className="min-h-[380px] flex-1 overflow-auto rounded-xl border border-line bg-stage p-3.5">
        <div style={{ width: A4_WIDTH * scale, height: innerH * scale, margin: '0 auto' }}>
          <div ref={innerRef} style={{ width: A4_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <ResumePaper
              variant={template}
              data={data}
              accent={accent}
              typography={typography}
              spacing={spacing}
              order={sectionOrder}
              sidebarPct={sidebarPct}
              hideEmpty={hideEmpty}
              onSidebarResize={setSidebarPct}
            />
          </div>
        </div>
      </div>
      <p className="pt-2 text-center text-xs text-ink-2">
        {template === 'sidebar'
          ? 'A4 实时预览 · 拖动双栏之间的竖线可调整侧栏宽度 · 数据只保存在本机'
          : 'A4 实时预览 · 导出的 PDF 为可选中、可检索的真实文本 · 数据只保存在本机'}
      </p>
    </section>
  )
}

export default function Editor() {
  const data = useEditor((s) => s.data)
  const template = useEditor((s) => s.template)
  const accentId = useEditor((s) => s.accentId)
  const typography = useEditor((s) => s.typography)
  const spacing = useEditor((s) => s.spacing)
  const sectionOrder = useEditor((s) => s.sectionOrder)
  const sidebarPct = useEditor((s) => s.sidebarPct)
  const hideEmpty = useEditor((s) => s.hideEmpty)
  const setHideEmpty = useEditor((s) => s.setHideEmpty)
  const setTemplate = useEditor((s) => s.setTemplate)
  const loadSample = useEditor((s) => s.loadSample)
  const resetAll = useEditor((s) => s.resetAll)
  const importJson = useEditor((s) => s.importJson)
  const applyData = useEditor((s) => s.applyData)

  const [params, setParams] = useSearchParams()
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null)
  const [tab, setTab] = useState<'form' | 'preview'>('form')
  const [mdOpen, setMdOpen] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'png' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const innerHeightRef = useRef(1123)

  // 轮播卡片 / 模板页跳转进来时带上 ?template=xxx
  useEffect(() => {
    const t = params.get('template')
    if (t && TEMPLATES.some((x) => x.id === t)) {
      setTemplate(t as TemplateVariant)
      params.delete('template')
      setParams(params, { replace: true })
    }
  }, [params, setParams, setTemplate])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const d = new Date()
    a.href = url
    a.download = `plainpage-resume-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg({ text: '已导出 JSON 备份' })
  }

  const onImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    file.text().then((text) => {
      const err = importJson(text)
      setMsg(err ? { text: err, bad: true } : { text: '导入成功，已在本机保存' })
    })
  }

  const onReset = () => {
    if (window.confirm('确定清空全部简历数据？此操作不可恢复（建议先「导出 JSON」备份）。')) {
      resetAll()
      setMsg({ text: '已清空' })
    }
  }

  const applyMarkdown = (md: string): string | null => {
    try {
      applyData(parseMarkdown(md))
      setMsg({ text: 'Markdown 导入成功' })
      return null
    } catch {
      return 'Markdown 解析失败，请检查格式'
    }
  }

  const onExportPdf = async () => {
    if (exporting) return
    setExporting('pdf')
    try {
      // 诊断开关：/editor?pdfmin=1 → 最小文档（隔离 react-pdf 环境问题）；pdfmin=cn → 加中文字体；pdfmin=svg → 再加 SVG 图标
      const pdfmin = new URLSearchParams(window.location.search).get('pdfmin')
      if (pdfmin !== null) {
        const size = await exportPdfMinimal(pdfmin === 'cn' || pdfmin === 'svg', pdfmin === 'svg')
        setMsg({ text: `最小文档已导出（${(size / 1024).toFixed(0)}KB）` })
        return
      }
      const missing = await exportPdf({ data, template, accentId, typography, spacing, sectionOrder, sidebarPct, hideEmpty })
      // 双栏模板是固定行布局：内容超过一页时 react-pdf 会压缩进单页（数据不丢但变密），如实提醒
      if (template === 'sidebar' && innerHeightRef.current > A4_HEIGHT_PX + 40) {
        setMsg({ text: 'PDF 已导出 · 注意：双栏模板内容较多，超出一页的部分会被压缩，建议精简内容或调小字号/间距', bad: true })
        return
      }
      setMsg(
        missing.length
          ? { text: `PDF 已导出 · 注意：${missing.join('、')} 超出内嵌字库，可能显示为空心框`, bad: true }
          : { text: 'PDF 已导出 · 真实文本，可选中可检索' },
      )
    } catch (e) {
      console.error(e)
      setMsg({ text: 'PDF 导出失败：' + (e instanceof Error ? e.message : String(e)), bad: true })
    } finally {
      setExporting(null)
    }
  }

  // PNG 导出：从导出的 PDF 光栅化拼接长图（与 PDF 同源渲染，双 Tab 下都可用）
  const onExportPng = async () => {
    if (exporting) return
    setExporting('png')
    try {
      const pages = await exportPng({ data, template, accentId, typography, spacing, sectionOrder, sidebarPct, hideEmpty })
      setMsg({ text: pages > 1 ? `PNG 已导出（${pages} 页拼接长图）` : 'PNG 已导出（2 倍清晰度）' })
    } catch (e) {
      console.error(e)
      setMsg({ text: 'PNG 导出失败：' + (e instanceof Error ? e.message : String(e)), bad: true })
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            aria-label="返回首页"
            className="flex items-center gap-1.5 text-sm text-ink-2 transition-colors duration-200 hover:text-ink"
          >
            <ArrowLeft size={16} /> <span className="hidden sm:inline">素页简历</span>
          </Link>
          <SavedBadge />
          {msg && (
            <span role="status" className={`truncate text-xs ${msg.bad ? 'text-[#c53030]' : 'text-ink-2'}`}>
              {msg.text}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" onClick={loadSample} className={`${btnGhost} max-sm:hidden`} title="用示例数据体验完整流程">
              <Sparkles size={13} /> <span className="hidden md:inline">填入示例</span>
            </button>
            <button type="button" onClick={() => setMdOpen(true)} className={btnGhost} title="从 Markdown 导入简历内容">
              <FileCode2 size={13} /> <span className="hidden md:inline">Markdown</span>
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={btnGhost} aria-label="导入 JSON" title="导入 JSON 备份文件">
              <Upload size={13} /> <span className="hidden md:inline">导入 JSON</span>
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />
            <button type="button" onClick={exportJson} className={btnGhost} aria-label="导出 JSON" title="导出 JSON 备份">
              <Download size={13} /> <span className="hidden md:inline">导出 JSON</span>
            </button>
            <button type="button" onClick={onReset} aria-label="清空数据" className={`${btnGhost} max-sm:hidden px-2.5`}>
              <Trash2 size={13} />
            </button>
            <button type="button" onClick={onExportPng} disabled={exporting !== null} className={btnGhost} title="导出 PNG 长图（分享预览用，非文本层）">
              {exporting === 'png' ? <Loader2 size={13} className="animate-spin" /> : <ImageDown size={13} />}
              <span className="hidden md:inline">导出 PNG</span>
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={onExportPdf}
              disabled={exporting !== null}
              title="导出 ATS 友好 PDF：真实文本层，可选中可检索"
              className="ml-1 inline-flex flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-ink px-2.5 py-2 text-sm font-medium text-paper transition-all duration-200 hover:bg-ink/85 active:scale-[0.97] disabled:cursor-wait sm:px-3.5"
            >
              {exporting === 'pdf' && <Loader2 size={13} className="animate-spin" aria-hidden />}
              <span className="hidden sm:inline">{exporting === 'pdf' ? '生成中' : '导出 '}</span>PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-4 py-5 pb-20 lg:grid-cols-[minmax(360px,440px)_1fr] lg:pb-5">
        <section aria-label="简历内容填写" className={tab === 'preview' ? 'hidden lg:block' : 'block'}>
          <EditorForm />
        </section>
        <PreviewPane
          className={tab === 'form' ? 'hidden lg:flex' : 'flex'}
          template={template}
          accentId={accentId}
          data={data}
          typography={typography}
          spacing={spacing}
          onInnerHeight={(h) => (innerHeightRef.current = h)}
          hideEmpty={hideEmpty}
          setHideEmpty={setHideEmpty}
        />
      </main>

      <nav aria-label="编辑器视图切换" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface lg:hidden">
        {(
          [
            ['form', '填写', PenLine],
            ['preview', '预览', Eye],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors duration-200 ${
              tab === id ? 'bg-ink text-paper' : 'text-ink-2'
            }`}
          >
            <Icon size={15} aria-hidden /> {label}
          </button>
        ))}
      </nav>

      {mdOpen && <MarkdownModal onClose={() => setMdOpen(false)} onApply={applyMarkdown} />}
    </div>
  )
}
