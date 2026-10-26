import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useRef } from 'react'
import { Award, Briefcase, FolderGit2, Github, GraduationCap, Mail, MapPin, Phone, User } from 'lucide-react'
import {
  ACCENTS,
  DEFAULT_ORDER,
  DEFAULT_SPACING,
  DEFAULT_TYPOGRAPHY,
  FONTS,
  sampleResume,
  SECTION_LABEL,
  visibleOrder,
  type ResumeData,
  type ResumeEntry,
  type SectionId,
  type Spacing,
  type Typography,
} from '../lib/resume'

type Variant = 'classic' | 'sidebar' | 'blocks' | 'centered' | 'dark' | 'band'

/** 纸面永远按浅色文档渲染（深色模式下仍是一张白纸，就像 Word 的深色模式） */
const PIN: CSSProperties = {
  '--color-paper': '#faf9f5',
  '--color-surface': '#ffffff',
  '--color-ink': '#191919',
  '--color-ink-2': '#6e6a63',
  '--color-line': '#e5e2da',
  '--color-ok': '#16a34a',
} as CSSProperties

export default function ResumePaper({
  variant = 'classic',
  data = sampleResume,
  accent,
  typography = DEFAULT_TYPOGRAPHY,
  spacing = DEFAULT_SPACING,
  order = DEFAULT_ORDER,
  sidebarPct = 32,
  /** 隐藏空模块：未填写的区块不出现在简历上（编辑器开关控制） */
  hideEmpty = false,
  onSidebarResize,
}: {
  variant?: Variant
  data?: ResumeData
  /** 简历主题色（缺省陶土） */
  accent?: { accent: string; strong: string; soft: string }
  typography?: Typography
  spacing?: Spacing
  order?: SectionId[]
  sidebarPct?: number
  hideEmpty?: boolean
  /** 提供后双栏模板显示可拖动的分栏手柄（编辑器传入；展示场景不传） */
  onSidebarResize?: (pct: number) => void
}) {
  const a = accent ?? ACCENTS[0]
  const fz = typography.size
  const style: CSSProperties = {
    ...PIN,
    '--color-accent': a.accent,
    '--color-accent-strong': a.strong,
    '--color-accent-soft': a.soft,
    // 比例字号：正文 = 用户字号，其余按固定比例跟随（纸宽固定，内容自然回流）
    '--pp-fz': `${fz}px`,
    '--pp-fz-name': `calc(var(--pp-fz) * 2.05)`,
    '--pp-fz-intent': `calc(var(--pp-fz) * 1.05)`,
    '--pp-fz-contact': `calc(var(--pp-fz) * 0.95)`,
    '--pp-fz-sec': `calc(var(--pp-fz) * 1.05)`,
    '--pp-fz-date': `calc(var(--pp-fz) * 0.9)`,
    '--pp-fz-chip': `calc(var(--pp-fz) * 0.86)`,
    '--pp-fz-side': `calc(var(--pp-fz) * 0.95)`,
    '--pp-fz-sidechip': `calc(var(--pp-fz) * 0.81)`,
    lineHeight: typography.lineHeight,
    fontFamily: FONTS.find((f) => f.id === typography.font)?.stack,
  } as CSSProperties
  return (
    <div style={style}>
      {variant === 'classic' && <Classic data={data} order={visibleOrder(order, data, hideEmpty)} spacing={spacing} />}
      {variant === 'sidebar' && (
        <AsideLight data={data} order={visibleOrder(order, data, hideEmpty)} spacing={spacing} sidebarPct={sidebarPct} onSidebarResize={onSidebarResize} />
      )}
      {variant === 'blocks' && <Blocks data={data} order={visibleOrder(order, data, hideEmpty)} spacing={spacing} />}
      {variant === 'centered' && <Centered data={data} order={visibleOrder(order, data, hideEmpty)} spacing={spacing} />}
      {variant === 'dark' && <DarkAside data={data} order={visibleOrder(order, data, hideEmpty)} spacing={spacing} sidebarPct={sidebarPct} />}
      {variant === 'band' && <Band data={data} order={visibleOrder(order, data, hideEmpty)} spacing={spacing} />}
    </div>
  )
}

/* ---------- 区块内容（顺序由 order 驱动） ---------- */

function SectionBody({ id, data, dark }: { id: SectionId; data: ResumeData; dark?: boolean }) {
  switch (id) {
    case 'summary':
      return <AwardLines items={data.summary.split('\n').filter((l) => l.trim())} />
    case 'education':
      return <EntryList entries={data.education} />
    case 'work':
      return <EntryList entries={data.work} />
    case 'projects':
      return <EntryList entries={data.projects} />
    case 'skills':
      return <ChipRow tags={data.skills} variant="line" dark={dark} />
    case 'certificates':
      return <ChipRow tags={data.certificates} variant="soft" dark={dark} />
    case 'awards':
      return <AwardLines items={data.awards} dark={dark} />
  }
}

function sectionIcon(id: SectionId) {
  switch (id) {
    case 'education':
      return GraduationCap
    case 'work':
      return Briefcase
    case 'projects':
      return FolderGit2
    default:
      return Award
  }
}

/* ---------- 经典单栏（默认、最 ATS）：方点标题 + 横线 ---------- */

function Classic({ data, order, spacing }: { data: ResumeData; order: SectionId[]; spacing: Spacing }) {
  return (
    <div
      className="rounded-md border border-line bg-surface text-ink"
      style={{ padding: `${spacing.pt}px ${spacing.px}px` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-[length:var(--pp-fz-name)] font-semibold tracking-[0.25em]">{data.name}</div>
          <div className="mt-1 text-[length:var(--pp-fz-intent)] font-medium text-accent-strong">求职意向：{data.intent}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-[length:var(--pp-fz-contact)] text-ink-2">
            <span className="inline-flex items-center gap-1">
              <Phone size={11} className="text-accent" /> {data.phone}
            </span>
            <span className="inline-flex items-center gap-1">
              <Mail size={11} className="text-accent" /> {data.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Github size={11} className="text-accent" /> {data.github}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="text-accent" /> {data.location}
            </span>
          </div>
        </div>
        <PhotoBox photo={data.photo} shape="rect" />
      </div>

      <div className="mt-3.5 h-[2px] bg-ink" />

      {order.map((id) => (
        <div key={id} style={{ marginTop: spacing.secGap }}>
          <div className="flex items-center gap-1.5 border-b border-ink pb-1 text-[length:var(--pp-fz-sec)] font-semibold tracking-[0.18em]">
            <span className="inline-block h-[6px] w-[6px] flex-none bg-accent" aria-hidden />
            {SECTION_LABEL[id]}
          </div>
          <div style={{ marginTop: spacing.titleGap, paddingLeft: spacing.indent }}>
            <SectionBody id={id} data={data} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PhotoBox({ photo, shape }: { photo?: string; shape: 'rect' | 'circle' }) {
  if (shape === 'circle') {
    return (
      <div className="mx-auto flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-surface text-ink-2">
        {photo ? <img src={photo} alt="证件照" className="h-full w-full object-cover" /> : <User size={24} />}
      </div>
    )
  }
  return (
    <div className="flex h-[86px] w-[66px] flex-none items-center justify-center overflow-hidden rounded border border-line bg-[#f3f0e9] text-ink-2">
      {photo ? <img src={photo} alt="证件照" className="h-full w-full object-cover" /> : <User size={22} />}
    </div>
  )
}

function EntryList({ entries }: { entries: ResumeEntry[] }) {
  return (
    <>
      {entries.map((e) => (
        <div key={e.title + e.date} className="mt-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[length:var(--pp-fz)] font-semibold">{e.title}</span>
            <span className="flex-none whitespace-nowrap text-[length:var(--pp-fz-date)] text-ink-2">{e.date}</span>
          </div>
          {e.bullets.map((b, i) => (
            <div key={i} className="relative mt-0.5 pl-2.5 text-[length:var(--pp-fz)] text-ink-2">
              <span className="absolute left-0 top-[0.6em] h-[3px] w-[3px] flex-none rounded-full bg-accent" aria-hidden />
              {b}
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

function ChipRow({ tags, variant, dark }: { tags: string[]; variant: 'line' | 'soft'; dark?: boolean }) {
  const cls = dark
    ? 'border-white/30 bg-white/10 text-[#ece9e2]'
    : variant === 'line'
      ? 'border-line bg-paper text-ink'
      : 'border-accent-soft bg-accent-soft font-medium text-ink'
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t} className={`rounded-full border px-2 py-[1px] text-[length:var(--pp-fz-chip)] ${cls}`}>
          {t}
        </span>
      ))}
    </div>
  )
}

function AwardLines({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <>
      {items.map((a, i) => (
        <div key={i} className={`relative mt-1 pl-2.5 text-[length:var(--pp-fz)] ${dark ? 'text-[#ece9e2]/85' : 'text-ink-2'}`}>
          <span className="absolute left-0 top-[0.6em] h-[3px] w-[3px] flex-none rounded-full bg-accent" aria-hidden />
          {a}
        </div>
      ))}
    </>
  )
}

/* ---------- 色块标题条（简约色块 / 双栏简洁主栏共用） ---------- */

function BarTitle({ icon: Icon, children }: { icon: typeof Award; children: string }) {
  return (
    <div className="flex items-center gap-2 rounded bg-accent-soft px-2.5 py-1">
      <span className="h-3 w-1 flex-none rounded-sm bg-accent" aria-hidden />
      <Icon size={11} className="flex-none text-accent-strong" />
      <span className="text-[length:var(--pp-fz-sec)] font-semibold tracking-[0.14em] text-accent-strong">{children}</span>
    </div>
  )
}

/* ---------- 简约色块：单栏 + 色块标题条 ---------- */

function Blocks({ data, order, spacing }: { data: ResumeData; order: SectionId[]; spacing: Spacing }) {
  return (
    <div
      className="rounded-md border border-line bg-surface text-ink"
      style={{ padding: `${spacing.pt}px ${spacing.px}px` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-[length:var(--pp-fz-name)] font-semibold tracking-[0.2em]">{data.name}</div>
          <div className="mt-1 text-[length:var(--pp-fz-intent)] font-medium text-accent-strong">求职意向：{data.intent}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-[length:var(--pp-fz-contact)] text-ink-2">
            <span className="inline-flex items-center gap-1">
              <Phone size={11} className="text-accent" /> {data.phone}
            </span>
            <span className="inline-flex items-center gap-1">
              <Mail size={11} className="text-accent" /> {data.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Github size={11} className="text-accent" /> {data.github}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="text-accent" /> {data.location}
            </span>
          </div>
        </div>
        <PhotoBox photo={data.photo} shape="rect" />
      </div>

      {order.map((id) => (
        <div key={id} style={{ marginTop: spacing.secGap }}>
          <BarTitle icon={sectionIcon(id)}>{SECTION_LABEL[id]}</BarTitle>
          <div style={{ marginTop: spacing.titleGap, paddingLeft: spacing.indent }}>
            <SectionBody id={id} data={data} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- 双栏简洁：浅色侧栏（宽度可拖动）+ 色块标题主栏 ---------- */

/** 分栏拖动手柄：比例基于父容器宽度计算，缩放（transform）不影响 */
function SidebarHandle({ pct, onChange }: { pct: number; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const onPointerDown = (e: ReactPointerEvent) => {
    e.preventDefault()
    const grid = ref.current!.parentElement as HTMLElement
    const rect = grid.getBoundingClientRect()
    const move = (ev: PointerEvent) => {
      const p = ((ev.clientX - rect.left) / rect.width) * 100
      onChange(Math.min(45, Math.max(18, Math.round(p))))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
    }
    document.body.style.cursor = 'col-resize'
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      role="separator"
      aria-label="拖动调整侧栏宽度"
      aria-orientation="vertical"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={18}
      aria-valuemax={45}
      title="拖动调整侧栏宽度"
      className="group absolute inset-y-0 z-10 flex w-4 -translate-x-1/2 cursor-col-resize items-center justify-center"
      style={{ left: `${pct}%` }}
    >
      <span className="h-full w-px bg-accent/0 transition-colors duration-150 group-hover:bg-accent" aria-hidden />
      <span
        aria-hidden
        className="absolute flex h-7 w-3 flex-col items-center justify-center gap-[2px] rounded bg-accent opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      >
        <span className="h-[1.5px] w-1.5 rounded bg-white" />
        <span className="h-[1.5px] w-1.5 rounded bg-white" />
        <span className="h-[1.5px] w-1.5 rounded bg-white" />
      </span>
    </div>
  )
}

function AsideLight({
  data,
  order,
  spacing,
  sidebarPct,
  onSidebarResize,
}: {
  data: ResumeData
  order: SectionId[]
  spacing: Spacing
  sidebarPct: number
  onSidebarResize?: (pct: number) => void
}) {
  const contact = [
    { icon: Phone, text: data.phone },
    { icon: Mail, text: data.email },
    { icon: Github, text: data.github },
    { icon: MapPin, text: data.location },
  ]
  const tagOrder = order.filter((id) => id === 'skills' || id === 'certificates' || id === 'awards')
  const entryOrder = order.filter((id) => id === 'education' || id === 'work' || id === 'projects' || id === 'summary')
  return (
    <div
      className="relative grid overflow-hidden rounded-md border border-line bg-surface text-ink"
      style={{ gridTemplateColumns: `${sidebarPct}% 1fr` }}
    >
      <aside className="bg-accent-soft p-5">
        <PhotoBox photo={data.photo} shape="circle" />
        <p className="mt-3 border-b border-ink/20 pb-1 text-[length:var(--pp-fz-side)] font-semibold tracking-[0.18em] text-ink-2">联系方式</p>
        {contact.map(({ icon: Icon, text }) => (
          <div key={text} className="mt-1.5 flex items-start gap-1.5 text-[length:var(--pp-fz-side)]">
            <Icon size={10} className="mt-[2px] flex-none text-accent" />
            <span className="break-all">{text}</span>
          </div>
        ))}
        {tagOrder.map((id) => (
          <div key={id}>
            <p className="mt-3 border-b border-ink/20 pb-1 text-[length:var(--pp-fz-side)] font-semibold tracking-[0.18em] text-ink-2">
              {SECTION_LABEL[id]}
            </p>
            <SectionBody id={id} data={data} />
          </div>
        ))}
      </aside>

      <main style={{ padding: `${spacing.pt}px ${spacing.px}px` }}>
        <div className="font-display text-[length:var(--pp-fz-name)] font-semibold tracking-[0.15em]">{data.name}</div>
        <div className="mt-0.5 text-[length:var(--pp-fz-intent)] font-medium text-accent-strong">求职意向：{data.intent}</div>
        {entryOrder.map((id) => (
          <div key={id} style={{ marginTop: spacing.secGap }}>
            <BarTitle icon={sectionIcon(id)}>{SECTION_LABEL[id]}</BarTitle>
            <div style={{ marginTop: spacing.titleGap, paddingLeft: spacing.indent }}>
              <SectionBody id={id} data={data} />
            </div>
          </div>
        ))}
      </main>

      {onSidebarResize && <SidebarHandle pct={sidebarPct} onChange={onSidebarResize} />}
    </div>
  )
}

/* ---------- 居中雅致：姓名/意向/联系方式居中，节标题两侧细线（参考极简居中式） ---------- */

function Centered({ data, order, spacing }: { data: ResumeData; order: SectionId[]; spacing: Spacing }) {
  return (
    <div
      className="rounded-md border border-line bg-surface text-ink"
      style={{ padding: `${spacing.pt}px ${spacing.px}px` }}
    >
      <div className="flex flex-col items-center text-center">
        <PhotoBox photo={data.photo} shape="circle" />
        <div className="mt-2 font-display text-[length:var(--pp-fz-name)] font-semibold tracking-[0.24em]">{data.name}</div>
        <div className="mt-1 text-[length:var(--pp-fz-intent)] font-medium text-accent-strong">求职意向：{data.intent}</div>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-0.5 text-[length:var(--pp-fz-contact)] text-ink-2">
          <span className="inline-flex items-center gap-1">
            <Phone size={11} className="text-accent" /> {data.phone}
          </span>
          <span className="inline-flex items-center gap-1">
            <Mail size={11} className="text-accent" /> {data.email}
          </span>
          <span className="inline-flex items-center gap-1">
            <Github size={11} className="text-accent" /> {data.github}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} className="text-accent" /> {data.location}
          </span>
        </div>
      </div>

      <div className="mt-3.5 h-px bg-line" aria-hidden />

      {order.map((id) => (
        <div key={id} style={{ marginTop: spacing.secGap }}>
          <div className="flex items-center gap-3" aria-hidden={false}>
            <span className="h-px flex-1 bg-line" aria-hidden />
            <span className="text-[length:var(--pp-fz-sec)] font-semibold tracking-[0.26em]">{SECTION_LABEL[id]}</span>
            <span className="h-px flex-1 bg-line" aria-hidden />
          </div>
          <div style={{ marginTop: spacing.titleGap, paddingLeft: spacing.indent }}>
            <SectionBody id={id} data={data} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- 深色商务：近黑侧栏白字（参考蓝白商务风的深侧栏骨架，点缀主题色） ---------- */

function DarkAside({ data, order, spacing, sidebarPct }: { data: ResumeData; order: SectionId[]; spacing: Spacing; sidebarPct: number }) {
  const contact = [
    { icon: Phone, text: data.phone },
    { icon: Mail, text: data.email },
    { icon: Github, text: data.github },
    { icon: MapPin, text: data.location },
  ]
  const tagOrder = order.filter((id) => id === 'skills' || id === 'certificates' || id === 'awards')
  const entryOrder = order.filter((id) => id === 'education' || id === 'work' || id === 'projects' || id === 'summary')
  return (
    <div
      className="relative grid overflow-hidden rounded-md border border-line bg-surface text-ink"
      style={{ gridTemplateColumns: `${sidebarPct}% 1fr` }}
    >
      <aside className="bg-ink p-5 text-[#ece9e2]">
        <PhotoBox photo={data.photo} shape="circle" />
        <p className="mt-3 border-b border-white/25 pb-1 text-[length:var(--pp-fz-side)] font-semibold tracking-[0.18em] text-white/75">
          联系方式
        </p>
        {contact.map(({ icon: Icon, text }) => (
          <div key={text} className="mt-1.5 flex items-start gap-1.5 text-[length:var(--pp-fz-side)]">
            <Icon size={10} className="mt-[2px] flex-none text-accent" />
            <span className="break-all text-[#ece9e2]/90">{text}</span>
          </div>
        ))}
        {tagOrder.map((id) => (
          <div key={id}>
            <p className="mt-3 border-b border-white/25 pb-1 text-[length:var(--pp-fz-side)] font-semibold tracking-[0.18em] text-white/75">
              {SECTION_LABEL[id]}
            </p>
            <SectionBody id={id} data={data} dark />
          </div>
        ))}
      </aside>

      <main style={{ padding: `${spacing.pt}px ${spacing.px}px` }}>
        <div className="font-display text-[length:var(--pp-fz-name)] font-semibold tracking-[0.15em]">{data.name}</div>
        <div className="mt-0.5 text-[length:var(--pp-fz-intent)] font-medium text-accent-strong">求职意向：{data.intent}</div>
        {entryOrder.map((id) => (
          <div key={id} style={{ marginTop: spacing.secGap }}>
            <BarTitle icon={sectionIcon(id)}>{SECTION_LABEL[id]}</BarTitle>
            <div style={{ marginTop: spacing.titleGap, paddingLeft: spacing.indent }}>
              <SectionBody id={id} data={data} />
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}

/* ---------- 顶部色带：accent-soft 色带头部（姓名/意向/照片）+ 竖条标题单栏 ---------- */

function Band({ data, order, spacing }: { data: ResumeData; order: SectionId[]; spacing: Spacing }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface text-ink">
      <div
        className="flex items-start justify-between gap-3 bg-accent-soft"
        style={{ padding: `${Math.round(spacing.pt * 0.6)}px ${spacing.px}px` }}
      >
        <div>
          <div className="font-display text-[length:var(--pp-fz-name)] font-semibold tracking-[0.18em]">{data.name}</div>
          <div className="mt-1 text-[length:var(--pp-fz-intent)] font-medium text-accent-strong">求职意向：{data.intent}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-[length:var(--pp-fz-contact)] text-ink-2">
            <span className="inline-flex items-center gap-1">
              <Phone size={11} className="text-accent" /> {data.phone}
            </span>
            <span className="inline-flex items-center gap-1">
              <Mail size={11} className="text-accent" /> {data.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Github size={11} className="text-accent" /> {data.github}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="text-accent" /> {data.location}
            </span>
          </div>
        </div>
        <PhotoBox photo={data.photo} shape="rect" />
      </div>

      <div style={{ padding: `${spacing.pt}px ${spacing.px}px` }}>
        {order.map((id) => (
          <div key={id} style={{ marginTop: spacing.secGap }}>
            <div className="flex items-center gap-2 border-b border-line pb-1.5">
              <span className="h-[13px] w-[3px] flex-none rounded-sm bg-accent" aria-hidden />
              <span className="text-[length:var(--pp-fz-sec)] font-semibold tracking-[0.16em]">{SECTION_LABEL[id]}</span>
            </div>
            <div style={{ marginTop: spacing.titleGap, paddingLeft: spacing.indent }}>
              <SectionBody id={id} data={data} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
