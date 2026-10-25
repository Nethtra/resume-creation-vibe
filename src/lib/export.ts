import { createElement, type ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { ACCENTS, type FontId, type ResumeData, type SectionId, type Spacing, type TemplateVariant, type Typography } from './resume'

/**
 * 导出逻辑（懒加载）：
 * - PDF：@react-pdf/renderer + PdfResume 全部走 dynamic import，首屏不加载这套依赖；
 * - 中文字体：只注册当前字体族的子集文件（public/fonts/，由 scripts/subset-fonts.mjs 生成），
 *   400/500/600 三档精确匹配组件里用到的字重；同族只注册一次；
 * - 生僻字：导出前比对 charset.json（构建期生成的字形覆盖清单），超出覆盖的字符在导出后如实提示；
 * - PNG：modern-screenshot 对隐藏挂载的全尺寸纸面截图（仅用于预览分享，不承担 ATS 职责）。
 */

/** 与 scripts/subset-fonts.mjs 的输出文件一一对应（仿宋源字体仅有 Regular 字重，三档共用同一文件） */
const FONT_FILES: Record<FontId, Record<400 | 500 | 600, string>> = {
  sans: { 400: 'pp-sans-400.otf', 500: 'pp-sans-500.otf', 600: 'pp-sans-600.otf' },
  song: { 400: 'pp-song-400.otf', 500: 'pp-song-500.otf', 600: 'pp-song-600.otf' },
  kai: { 400: 'pp-kai-400.ttf', 500: 'pp-kai-500.ttf', 600: 'pp-kai-600.ttf' },
  fang: { 400: 'pp-fang-400.ttf', 500: 'pp-fang-400.ttf', 600: 'pp-fang-400.ttf' },
  yuan: { 400: 'pp-yuan-400.ttf', 500: 'pp-yuan-500.ttf', 600: 'pp-yuan-600.ttf' },
}

export interface ExportInput {
  data: ResumeData
  template: TemplateVariant
  accentId: string
  typography: Typography
  spacing: Spacing
  sectionOrder: SectionId[]
  sidebarPct: number
  hideEmpty: boolean
}

const fontUrl = (file: string) => `${import.meta.env.BASE_URL}fonts/${file}`

let registeredFamily = ''
async function ensureFontRegistered(fontId: FontId) {
  if (registeredFamily === fontId) return
  const { Font } = await import('@react-pdf/renderer')
  const files = FONT_FILES[fontId]
  // 预检可达性：字体文件缺失时 fontkit 解析响应体会硬崩（无法 try/catch），必须提前拦截
  const probe = await fetch(fontUrl(files[400]), { method: 'HEAD' })
  if (!probe.ok) throw new Error(`内嵌字体文件缺失（${files[400]}），请检查部署产物是否完整`)
  Font.register({
    family: `pp-${fontId}`,
    fonts: ([400, 500, 600] as const).map((weight) => ({
      src: fontUrl(files[weight]),
      fontWeight: weight,
    })),
  })
  registeredFamily = fontId
}

/* ---------- 生僻字检查：导出内容 vs 内嵌字库覆盖 ---------- */

let charsetRanges: [number, number][] | null = null

function collectText(data: ResumeData): string {
  const parts: string[] = [data.name, data.intent, data.phone, data.email, data.github, data.location]
  for (const key of ['education', 'work', 'projects'] as const) {
    for (const e of data[key]) parts.push(e.title, e.date, ...e.bullets)
  }
  parts.push(...data.skills, ...data.certificates, ...data.awards)
  return parts.filter(Boolean).join('\n')
}

async function loadCharset(): Promise<[number, number][]> {
  if (charsetRanges) return charsetRanges
  const res = await fetch(fontUrl('charset.json'))
  if (!res.ok) return [] // 覆盖清单缺失时静默跳过检查，不阻塞导出
  const ranges: [number, number][] = (await res.json()).ranges
  charsetRanges = ranges
  return ranges
}

async function findMissingChars(data: ResumeData): Promise<string[]> {
  const ranges = await loadCharset()
  if (!ranges.length) return []
  const missing = new Set<string>()
  for (const ch of collectText(data)) {
    const c = ch.codePointAt(0)!
    if (c < 0x20) continue
    if (!ranges.some(([s, e]) => c >= s && c <= e)) missing.add(ch)
  }
  return [...missing].slice(0, 8)
}

/* ---------- 下载工具 ---------- */

function stamp(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/* ---------- PDF ---------- */

function buildDoc(input: ExportInput, PdfResume: (typeof import('../components/pdf/PdfResume'))['default']) {
  const accent = ACCENTS.find((a) => a.id === input.accentId) ?? ACCENTS[0]
  return createElement(PdfResume, {
    variant: input.template,
    data: input.data,
    accent: { accent: accent.accent, strong: accent.strong, soft: accent.soft },
    typography: input.typography,
    spacing: input.spacing,
    order: input.sectionOrder,
    sidebarPct: input.sidebarPct,
    hideEmpty: input.hideEmpty,
  })
}

/** 生成并下载 PDF（真文本层）；返回超出内嵌字库的字符（可能显示为空心框） */
export async function exportPdf(input: ExportInput): Promise<string[]> {
  const [{ pdf }, PdfResume] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/pdf/PdfResume'),
  ])
  await ensureFontRegistered(input.typography.font)
  const missing = await findMissingChars(input.data)
  const blob = await pdf(buildDoc(input, PdfResume.default) as ReactElement<DocumentProps>).toBlob()
  downloadBlob(blob, `plainpage-resume-${stamp()}.pdf`)
  return missing
}

/* ---------- PNG ---------- */

/**
 * PNG 长图：把刚生成的 PDF 按页光栅化后纵向拼接（与 PDF 同源渲染，保证两者一致）。
 * 不用 DOM 截图（modern-screenshot）：构建产物下 foreignObject 无法可靠嵌入 webfont，
 * 回退字体度量差会导致文字溢出重叠（M2 实测）。
 */
export async function exportPng(input: ExportInput): Promise<number> {
  const [{ pdf }, PdfResume, pdfjsLib, workerMod] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/pdf/PdfResume'),
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerMod.default

  await ensureFontRegistered(input.typography.font)
  const blob = await pdf(buildDoc(input, PdfResume.default) as ReactElement<DocumentProps>).toBlob()
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise

  // 2 倍清晰度；总高超出 canvas 安全上限时自动降倍率
  const A4_H_PT = 841.89
  const MAX_CANVAS_H = 16000
  const scale = Math.min(2, Math.floor((MAX_CANVAS_H / (doc.numPages * A4_H_PT)) * 10) / 10)

  const out = document.createElement('canvas')
  let y = 0
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale })
    if (i === 1) {
      out.width = Math.ceil(viewport.width)
      out.height = Math.ceil(viewport.height) * doc.numPages
      const ctx = out.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, out.width, out.height)
    }
    const c = document.createElement('canvas')
    c.width = Math.ceil(viewport.width)
    c.height = Math.ceil(viewport.height)
    await page.render({ canvasContext: c.getContext('2d')!, viewport, background: '#ffffff' } as never).promise
    out.getContext('2d')!.drawImage(c, 0, y)
    y += c.height
  }
  const pngBlob = await new Promise<Blob>((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 编码失败'))), 'image/png'),
  )
  downloadBlob(pngBlob, `plainpage-resume-${stamp()}.png`)
  return doc.numPages
}

/* ---------- 诊断（?pdfmin=1 触发）：最小 react-pdf 文档，隔离环境问题 ---------- */

export async function exportPdfMinimal(withChineseFont: boolean, withSvg = false): Promise<number> {
  const { Document, Page, Text, pdf, Font } = await import('@react-pdf/renderer')
  if (withChineseFont) {
    Font.register({ family: 'pp-sans', src: fontUrl(FONT_FILES.sans[400]) })
  }
  const { PdfIcon } = await import('../components/pdf/icons')
  const doc = createElement(
    Document,
    null,
    createElement(
      Page,
      { size: 'A4', style: { fontFamily: withChineseFont ? 'pp-sans' : 'Helvetica', fontSize: 12, paddingTop: 40 } },
      withSvg ? createElement(PdfIcon, { name: 'phone', size: 11, color: '#d97757' }) : null,
      createElement(Text, null, withChineseFont ? '最小文档测试 Hello 中文' : 'Minimal doc test Hello'),
    ),
  )
  const blob = await pdf(doc as ReactElement<DocumentProps>).toBlob()
  downloadBlob(blob, `pdfmin-${withSvg ? 'svg-' : ''}${withChineseFont ? 'cn' : 'en'}.pdf`)
  return blob.size
}
