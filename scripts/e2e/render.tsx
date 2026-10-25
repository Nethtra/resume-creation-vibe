/**
 * Node 端 PDF 导出 E2E 渲染器（开发测试用，不进构建产物）
 *
 * 用真实组件渲染 PDF：esbuild 打包本文件（TSX），运行时直接调 @react-pdf 的
 * pdf().toBlob()，与浏览器端 src/lib/export.ts 的调用路径一致。
 *
 * 用法：node scripts/e2e/render.mjs --template classic --font sans --size 10.5
 *        --line 1.7 --accent terra --out out.pdf [--long] [--sidebar 32]
 *        [--order education,work,...] [--spacing pt,px,indent,secGap,titleGap]
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { createElement } from 'react'
import { Font, pdf } from '@react-pdf/renderer'
import PdfResume from '../../src/components/pdf/PdfResume'
import { ACCENTS, sampleResume, DEFAULT_SPACING, DEFAULT_TYPOGRAPHY, DEFAULT_ORDER, type SectionId } from '../../src/lib/resume'

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? process.argv[i + 1] : def
}

const font = arg('font', 'sans')
const weights = { sans: ['pp-sans-400.otf', 'pp-sans-500.otf', 'pp-sans-600.otf'], song: ['pp-song-400.otf', 'pp-song-500.otf', 'pp-song-600.otf'], kai: ['pp-kai-400.ttf', 'pp-kai-500.ttf', 'pp-kai-600.ttf'], fang: ['pp-fang-400.ttf', 'pp-fang-400.ttf', 'pp-fang-400.ttf'], yuan: ['pp-yuan-400.ttf', 'pp-yuan-500.ttf', 'pp-yuan-600.ttf'] } as const
const files = (weights as Record<string, readonly string[]>)[font]
if (!files) throw new Error('unknown font: ' + font)

Font.register({
  family: `pp-${font}`,
  fonts: files.map((f, i) => ({
    src: fileURLToPath(new URL(`../../public/fonts/${f}`, import.meta.url)),
    fontWeight: [400, 500, 600][i],
  })),
})

const template = (arg('template', 'classic') as 'classic' | 'sidebar' | 'blocks')
const accent = ACCENTS.find((a) => a.id === arg('accent', 'terra')) ?? ACCENTS[0]
const spacingRaw = arg('spacing') // "pt,px,indent,secGap,titleGap"
const spacing = spacingRaw
  ? Object.fromEntries(Object.values(DEFAULT_SPACING).map((v, i) => [['pt', 'px', 'indent', 'secGap', 'titleGap'][i], Number(spacingRaw.split(',')[i])]))
  : DEFAULT_SPACING
const typography = {
  font: font as (typeof DEFAULT_TYPOGRAPHY.font),
  size: Number(arg('size', String(DEFAULT_TYPOGRAPHY.size))),
  lineHeight: Number(arg('line', String(DEFAULT_TYPOGRAPHY.lineHeight))),
}
const order = (arg('order')?.split(',') as SectionId[]) ?? DEFAULT_ORDER
const sidebarPct = Number(arg('sidebar', '32'))

let data = sampleResume
const drop = arg('drop') // 清空某区块，配合 --hide-empty 验证空模块隐藏
if (drop && ['education', 'work', 'projects', 'skills', 'certificates', 'awards'].includes(drop)) {
  data = { ...data, [drop]: [] } as typeof data
}
const hideEmpty = !!arg('hide-empty')
if (arg('long')) {
  // 撑页内容：每类条目复制多份，触发 PDF 分页
  const many = (n: number) => Array.from({ length: n }, (_, i) => ({ ...sampleResume.work[0], title: `某科技公司${i + 1} · 后端开发实习生${i + 1}`, bullets: ['负责订单模块接口开发，将查询接口平均响应时间从 800ms 优化至 120ms，QPS 提升 3 倍', '参与代码评审与新人培训，沉淀 3 篇团队开发规范文档', '主导灰度发布体系建设，故障恢复时间从 30 分钟缩短至 5 分钟'] }))
  data = { ...sampleResume, work: many(6), projects: many(3) }
}
if (arg('rare')) {
  // 生僻字（超出 GB2312/补充字表覆盖）
  data = { ...data, name: '张頔翀' }
}
if (arg('photo')) {
  // 有效 JPEG dataURL（PIL 生成，见 photo-b64.txt），验证图片嵌入链路
  data = { ...data, photo: readFileSync(new URL('./photo-b64.txt', import.meta.url), 'utf8').trim() }
}

const doc = createElement(PdfResume, {
  variant: template,
  data,
  accent: { accent: accent.accent, strong: accent.strong, soft: accent.soft },
  typography,
  spacing: spacing as typeof DEFAULT_SPACING,
  order,
  sidebarPct,
  hideEmpty,
})

const t0 = Date.now()
const blob = await pdf(doc as never).toBlob()
const buf = Buffer.from(await blob.arrayBuffer())
const out = arg('out', 'scripts/e2e/out.pdf')
writeFileSync(out, buf)
console.log(JSON.stringify({ out, bytes: buf.length, ms: Date.now() - t0, template, font, size: typography.size, line: typography.lineHeight, accent: accent.id }))
