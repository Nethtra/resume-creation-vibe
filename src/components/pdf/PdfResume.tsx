import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import {
  ACCENTS,
  DEFAULT_ORDER,
  DEFAULT_SPACING,
  DEFAULT_TYPOGRAPHY,
  visibleOrder,
  type ResumeData,
  type ResumeEntry,
  type SectionId,
  type Spacing,
  type Typography,
} from '../../lib/resume'
import { PdfIcon, type PdfIconName } from './icons'

/**
 * PDF 导出渲染（@react-pdf/renderer，真文本层）。
 *
 * 与 HTML 预览 ResumePaper.tsx 保持同一 props 接口与同一布局规范：
 * - 预览纸宽 794px（A4@96dpi），PDF A4 = 595.28pt，统一换算系数 S = 595.28/794；
 * - 字号比例（姓名 2.05×/节标题 1.05×/日期 0.9×…）、间距参数、区块顺序、
 *   主题色三元组、照片、侧栏宽度全部随 store 同步；
 * - 纸面固定浅色（与预览 PIN 一致），PDF 页即纸（去掉预览卡片的描边，多页时每页
 *   由 Page padding 保证页边距一致）。
 */

/* 预览 794px ↔ PDF 595.28pt（A4@96dpi ↔ A4@72dpi） */
const S = 595.28 / 794
const pt = (px: number) => px * S

const INK = '#191919'
const INK2 = '#6e6a63'
const LINE = '#e5e2da'
const PAPER = '#faf9f5'
const PHOTO_BG = '#f3f0e9'

const SECTION_LABEL: Record<SectionId, string> = {
  education: '教育经历',
  work: '实习 / 工作经历',
  projects: '项目经历',
  skills: '技能',
  certificates: '证书',
  awards: '荣誉奖项',
}

function sectionIcon(id: SectionId): PdfIconName {
  switch (id) {
    case 'education':
      return 'graduation-cap'
    case 'work':
      return 'briefcase'
    case 'projects':
      return 'folder-git-2'
    default:
      return 'award'
  }
}

/* ---------- 字号比例（与 ResumePaper 的 --pp-fz-* 变量一致） ---------- */

export interface PdfResumeProps {
  variant?: 'classic' | 'sidebar' | 'blocks' | 'centered' | 'dark' | 'band'
  data?: ResumeData
  accent?: { accent: string; strong: string; soft: string }
  typography?: Typography
  spacing?: Spacing
  order?: SectionId[]
  sidebarPct?: number
  hideEmpty?: boolean
}

type Fz = {
  base: number
  name: number
  intent: number
  contact: number
  sec: number
  date: number
  chip: number
  side: number
}

function makeFz(typo: Typography): Fz {
  const base = pt(typo.size)
  return {
    base,
    name: base * 2.05,
    intent: base * 1.05,
    contact: base * 0.95,
    sec: base * 1.05,
    date: base * 0.9,
    chip: base * 0.86,
    side: base * 0.95,
  }
}

/* ---------- 通用小件 ---------- */

function ContactItem({ icon, text, size, a }: { icon: PdfIconName; text: string; size: number; a: Accent }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: pt(4) }}>
      <PdfIcon name={icon} size={pt(11)} color={a.accent} />
      <Text style={{ fontSize: size }}>{text}</Text>
    </View>
  )
}

function ContactRow({ data, size, a, marginTop }: { data: ResumeData; size: number; a: Accent; marginTop: number }) {
  const items: [PdfIconName, string][] = [
    ['phone', data.phone],
    ['mail', data.email],
    ['github', data.github],
    ['map-pin', data.location],
  ]
  return (
    <View
      style={{
        marginTop: pt(marginTop),
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: pt(14),
        rowGap: pt(2),
      }}
    >
      {items.map(([icon, text]) => (
        <ContactItem key={icon} icon={icon} text={text} size={size} a={a} />
      ))}
    </View>
  )
}

type Accent = { accent: string; strong: string; soft: string }

/** 方框证件照（经典单栏 / 简约色块：66×86，占位时居中人形图标） */
function PhotoRect({ photo }: { photo?: string }) {
  const box = { width: pt(66), height: pt(86) }
  if (photo) {
    return <Image src={photo} style={{ ...box, objectFit: 'cover', borderWidth: 1, borderColor: LINE, borderRadius: pt(4), flexShrink: 0 }} />
  }
  return (
    <View
      style={{
        ...box,
        flexShrink: 0,
        borderWidth: 1,
        borderColor: LINE,
        borderRadius: pt(4),
        backgroundColor: PHOTO_BG,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PdfIcon name="user" size={pt(22)} color={INK2} />
    </View>
  )
}

/** 圆形头像（双栏简洁：68×68，描边主题色） */
function PhotoCircle({ photo, color }: { photo?: string; color: string }) {
  const box = { width: pt(68), height: pt(68) }
  if (photo) {
    return <Image src={photo} style={{ ...box, objectFit: 'cover', borderRadius: pt(999), borderWidth: 2, borderColor: color }} />
  }
  return (
    <View
      style={{
        ...box,
        borderRadius: pt(999),
        borderWidth: 2,
        borderColor: color,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PdfIcon name="user" size={pt(24)} color={INK2} />
    </View>
  )
}

/** 经历类条目：标题 + 右对齐日期 + 圆点列表（ATS 阅读顺序：标题→日期→要点） */
function EntryList({ entries, fz, a }: { entries: ResumeEntry[]; fz: Fz; a: Accent }) {
  return (
    <>
      {entries.map((e, i) => (
        <View key={i} style={{ marginTop: pt(8) }}>
          <View
            minPresenceAhead={pt(26)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: pt(12),
            }}
          >
            <Text style={{ fontSize: fz.base, fontWeight: 600 }}>{e.title}</Text>
            <Text style={{ fontSize: fz.date, color: INK2 }}>{e.date}</Text>
          </View>
          {e.bullets.map((b, j) => (
            <View key={j} style={{ position: 'relative', marginTop: pt(2), paddingLeft: pt(10) }}>
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: fz.base * 0.6,
                  width: pt(3),
                  height: pt(3),
                  borderRadius: pt(1.5),
                  backgroundColor: a.accent,
                }}
              />
              <Text style={{ fontSize: fz.base, color: INK2 }}>{b}</Text>
            </View>
          ))}
        </View>
      ))}
    </>
  )
}

function ChipRow({ tags, variant, fz, a }: { tags: string[]; variant: 'line' | 'soft'; fz: Fz; a: Accent }) {
  const line = variant === 'line'
  return (
    <View style={{ marginTop: pt(8), flexDirection: 'row', flexWrap: 'wrap', gap: pt(4) }}>
      {tags.map((t, i) => (
        <View
          key={i}
          style={{
            borderRadius: pt(999),
            borderWidth: 1,
            borderColor: line ? LINE : a.soft,
            backgroundColor: line ? PAPER : a.soft,
            paddingHorizontal: pt(8),
            paddingVertical: pt(1),
          }}
        >
          <Text style={{ fontSize: fz.chip, color: INK, fontWeight: line ? 400 : 500 }}>{t}</Text>
        </View>
      ))}
    </View>
  )
}

function AwardLines({ items, fz, a }: { items: string[]; fz: Fz; a: Accent }) {
  return (
    <>
      {items.map((t, i) => (
        <View key={i} style={{ position: 'relative', marginTop: pt(4), paddingLeft: pt(10) }}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: fz.base * 0.6,
              width: pt(3),
              height: pt(3),
              borderRadius: pt(1.5),
              backgroundColor: a.accent,
            }}
          />
          <Text style={{ fontSize: fz.base, color: INK2 }}>{t}</Text>
        </View>
      ))}
    </>
  )
}

function SectionBody({ id, data, fz, a }: { id: SectionId; data: ResumeData; fz: Fz; a: Accent }) {
  switch (id) {
    case 'education':
      return <EntryList entries={data.education} fz={fz} a={a} />
    case 'work':
      return <EntryList entries={data.work} fz={fz} a={a} />
    case 'projects':
      return <EntryList entries={data.projects} fz={fz} a={a} />
    case 'skills':
      return <ChipRow tags={data.skills} variant="line" fz={fz} a={a} />
    case 'certificates':
      return <ChipRow tags={data.certificates} variant="soft" fz={fz} a={a} />
    case 'awards':
      return <AwardLines items={data.awards} fz={fz} a={a} />
  }
}

/** 方点标题 + 下划线（经典单栏的节标题） */
function DotTitle({ id, fz, a }: { id: SectionId; fz: Fz; a: Accent }) {
  return (
    <View
      minPresenceAhead={pt(26)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: pt(6),
        borderBottomWidth: 1,
        borderBottomColor: INK,
        paddingBottom: pt(4),
      }}
    >
      <View style={{ width: pt(6), height: pt(6), backgroundColor: a.accent }} />
      <Text style={{ fontSize: fz.sec, fontWeight: 600, letterSpacing: fz.sec * 0.18 }}>{SECTION_LABEL[id]}</Text>
    </View>
  )
}

/** 色块标题条（简约色块 / 双栏简洁主栏共用） */
function BarTitle({ id, fz, a }: { id: SectionId; fz: Fz; a: Accent }) {
  return (
    <View
      minPresenceAhead={pt(26)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: pt(8),
        backgroundColor: a.soft,
        borderRadius: pt(4),
        paddingHorizontal: pt(10),
        paddingVertical: pt(4),
      }}
    >
      <View style={{ width: pt(4), height: pt(12), borderRadius: pt(2), backgroundColor: a.accent }} />
      <PdfIcon name={sectionIcon(id)} size={pt(11)} color={a.strong} />
      <Text style={{ fontSize: fz.sec, fontWeight: 600, letterSpacing: fz.sec * 0.14, color: a.strong }}>
        {SECTION_LABEL[id]}
      </Text>
    </View>
  )
}

/* ---------- 经典单栏 ---------- */

function Classic({ data, order, spacing, fz, a, typo }: Omit<PdfResumeProps, 'variant' | 'sidebarPct'> & { fz: Fz; a: Accent; typo: Typography }) {
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: '#ffffff',
        paddingTop: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
        paddingBottom: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
        paddingHorizontal: pt(spacing?.px ?? DEFAULT_SPACING.px),
        fontFamily: `pp-${typo.font}`,
        fontSize: fz.base,
        lineHeight: typo.lineHeight,
        color: INK,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: pt(12) }} wrap={false}>
        <View style={{ flexShrink: 1 }}>
          <Text style={{ fontSize: fz.name, fontWeight: 600, letterSpacing: fz.name * 0.25, lineHeight: 1.25 }}>{data?.name}</Text>
          <Text style={{ marginTop: pt(4), fontSize: fz.intent, fontWeight: 500, color: a.strong, lineHeight: 1.4 }}>
            求职意向：{data?.intent}
          </Text>
          <ContactRow data={data!} size={fz.contact} a={a} marginTop={6} />
        </View>
        <PhotoRect photo={data?.photo} />
      </View>

      <View style={{ marginTop: pt(14), height: pt(2), backgroundColor: INK }} />

      {(order ?? DEFAULT_ORDER).map((id) => (
        <View key={id} style={{ marginTop: pt(spacing?.secGap ?? DEFAULT_SPACING.secGap) }}>
          <DotTitle id={id} fz={fz} a={a} />
          <View style={{ marginTop: pt(spacing?.titleGap ?? DEFAULT_SPACING.titleGap), paddingLeft: pt(spacing?.indent ?? 0) }}>
            <SectionBody id={id} data={data!} fz={fz} a={a} />
          </View>
        </View>
      ))}
    </Page>
  )
}

/* ---------- 简约色块（单栏 + 色块标题条） ---------- */

function Blocks({ data, order, spacing, fz, a, typo }: Omit<PdfResumeProps, 'variant' | 'sidebarPct'> & { fz: Fz; a: Accent; typo: Typography }) {
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: '#ffffff',
        paddingTop: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
        paddingBottom: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
        paddingHorizontal: pt(spacing?.px ?? DEFAULT_SPACING.px),
        fontFamily: `pp-${typo.font}`,
        fontSize: fz.base,
        lineHeight: typo.lineHeight,
        color: INK,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: pt(12) }} wrap={false}>
        <View style={{ flexShrink: 1 }}>
          <Text style={{ fontSize: fz.name, fontWeight: 600, letterSpacing: fz.name * 0.2, lineHeight: 1.25 }}>{data?.name}</Text>
          <Text style={{ marginTop: pt(4), fontSize: fz.intent, fontWeight: 500, color: a.strong, lineHeight: 1.4 }}>
            求职意向：{data?.intent}
          </Text>
          <ContactRow data={data!} size={fz.contact} a={a} marginTop={8} />
        </View>
        <PhotoRect photo={data?.photo} />
      </View>

      {(order ?? DEFAULT_ORDER).map((id) => (
        <View key={id} style={{ marginTop: pt(spacing?.secGap ?? DEFAULT_SPACING.secGap) }}>
          <BarTitle id={id} fz={fz} a={a} />
          <View style={{ marginTop: pt(spacing?.titleGap ?? DEFAULT_SPACING.titleGap), paddingLeft: pt(spacing?.indent ?? 0) }}>
            <SectionBody id={id} data={data!} fz={fz} a={a} />
          </View>
        </View>
      ))}
    </Page>
  )
}

/* ---------- 双栏简洁（浅色侧栏 + 色块标题主栏） ---------- */

function Sidebar({
  data,
  order,
  spacing,
  fz,
  a,
  typo,
  sidebarPct,
}: Omit<PdfResumeProps, 'variant'> & { fz: Fz; a: Accent; typo: Typography; sidebarPct: number }) {
  const tagOrder = (order ?? DEFAULT_ORDER).filter((id) => id === 'skills' || id === 'certificates' || id === 'awards')
  const entryOrder = (order ?? DEFAULT_ORDER).filter((id) => id === 'education' || id === 'work' || id === 'projects')
  const contacts: [PdfIconName, string][] = [
    ['phone', data?.phone ?? ''],
    ['mail', data?.email ?? ''],
    ['github', data?.github ?? ''],
    ['map-pin', data?.location ?? ''],
  ]
  const sideLabel = {
    marginTop: pt(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(25,25,25,0.2)',
    paddingBottom: pt(4),
    fontSize: fz.side,
    fontWeight: 600,
    letterSpacing: fz.side * 0.18,
    color: INK2,
  } as const

  return (
    <Page
      size="A4"
      style={{
        backgroundColor: '#ffffff',
        fontFamily: `pp-${typo.font}`,
        fontSize: fz.base,
        lineHeight: typo.lineHeight,
        color: INK,
      }}
    >
      {/* minHeight 100%：相对固定页高，让浅色侧栏背景拉满整页（与商业模板一致） */}
      <View style={{ flexDirection: 'row', minHeight: '100%' }}>
        <View style={{ width: `${sidebarPct}%`, backgroundColor: a.soft, padding: pt(20) }}>
          <View style={{ alignItems: 'center' }}>
            <PhotoCircle photo={data?.photo} color={a.accent} />
          </View>
          <Text style={sideLabel}>联系方式</Text>
          {contacts.map(([icon, text]) => (
            <View key={icon} style={{ marginTop: pt(6), flexDirection: 'row', alignItems: 'flex-start', gap: pt(6) }}>
              <View style={{ marginTop: pt(2) }}>
                <PdfIcon name={icon} size={pt(10)} color={a.accent} />
              </View>
              <Text style={{ flex: 1 }}>{text}</Text>
            </View>
          ))}
          {tagOrder.map((id) => (
            <View key={id}>
              <Text style={sideLabel}>{SECTION_LABEL[id]}</Text>
              <SectionBody id={id} data={data!} fz={fz} a={a} />
            </View>
          ))}
        </View>

        <View
          style={{
            flexGrow: 1,
            paddingTop: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
            paddingBottom: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
            paddingHorizontal: pt(spacing?.px ?? DEFAULT_SPACING.px),
          }}
        >
          <Text style={{ fontSize: fz.name, fontWeight: 600, letterSpacing: fz.name * 0.15, lineHeight: 1.25 }}>{data?.name}</Text>
          <Text style={{ marginTop: pt(2), fontSize: fz.intent, fontWeight: 500, color: a.strong, lineHeight: 1.4 }}>
            求职意向：{data?.intent}
          </Text>
          {entryOrder.map((id) => (
            <View key={id} style={{ marginTop: pt(spacing?.secGap ?? DEFAULT_SPACING.secGap) }}>
              <BarTitle id={id} fz={fz} a={a} />
              <View style={{ marginTop: pt(spacing?.titleGap ?? DEFAULT_SPACING.titleGap), paddingLeft: pt(spacing?.indent ?? 0) }}>
                <SectionBody id={id} data={data!} fz={fz} a={a} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </Page>
  )
}

/* ---------- 文档入口（接口与 ResumePaper 对齐） ---------- */

export default function PdfResume({
  variant = 'classic',
  data,
  accent,
  typography = DEFAULT_TYPOGRAPHY,
  spacing = DEFAULT_SPACING,
  order = DEFAULT_ORDER,
  sidebarPct = 32,
  hideEmpty = false,
}: PdfResumeProps): ReactElement {
  const a = accent ?? ACCENTS[0]
  const fz = makeFz(typography)
  const name = data?.name?.trim()
  const shownOrder = data ? visibleOrder(order, data, hideEmpty) : order
  return (
    <Document
      title={name ? `${name}的简历` : '简历'}
      author={name || undefined}
      language="zh-CN"
      creator="素页简历 PlainPage"
    >
      {variant === 'sidebar' ? (
        <Sidebar data={data} order={shownOrder} spacing={spacing} fz={fz} a={a} typo={typography} sidebarPct={sidebarPct} />
      ) : variant === 'blocks' ? (
        <Blocks data={data} order={shownOrder} spacing={spacing} fz={fz} a={a} typo={typography} />
      ) : variant === 'centered' ? (
        <CenteredPdf data={data} order={shownOrder} spacing={spacing} fz={fz} a={a} typo={typography} />
      ) : variant === 'dark' ? (
        <DarkAsidePdf data={data} order={shownOrder} spacing={spacing} fz={fz} a={a} typo={typography} sidebarPct={sidebarPct} />
      ) : variant === 'band' ? (
        <BandPdf data={data} order={shownOrder} spacing={spacing} fz={fz} a={a} typo={typography} />
      ) : (
        <Classic data={data} order={shownOrder} spacing={spacing} fz={fz} a={a} typo={typography} />
      )}
    </Document>
  )
}

/* ---------- 居中雅致（PDF） ---------- */

function CenteredPdf({ data, order, spacing, fz, a, typo }: Omit<PdfResumeProps, 'variant' | 'sidebarPct'> & { fz: Fz; a: Accent; typo: Typography }) {
  const contacts: [PdfIconName, string][] = [
    ['phone', data?.phone ?? ''],
    ['mail', data?.email ?? ''],
    ['github', data?.github ?? ''],
    ['map-pin', data?.location ?? ''],
  ]
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: '#ffffff',
        paddingTop: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
        paddingBottom: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
        paddingHorizontal: pt(spacing?.px ?? DEFAULT_SPACING.px),
        fontFamily: `pp-${typo.font}`,
        fontSize: fz.base,
        lineHeight: typo.lineHeight,
        color: INK,
      }}
    >
      <View style={{ alignItems: 'center' }} wrap={false}>
        <View style={{ alignItems: 'center' }}>
          <PhotoCircle photo={data?.photo} color={a.accent} />
        </View>
        <Text style={{ marginTop: pt(8), fontSize: fz.name, fontWeight: 600, letterSpacing: fz.name * 0.24, lineHeight: 1.25, textAlign: 'center' }}>
          {data?.name}
        </Text>
        <Text style={{ marginTop: pt(4), fontSize: fz.intent, fontWeight: 500, color: a.strong, lineHeight: 1.4 }}>
          求职意向：{data?.intent}
        </Text>
        <View style={{ marginTop: pt(6), flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: pt(14), rowGap: pt(2) }}>
          {contacts.map(([icon, text]) => (
            <View key={icon} style={{ flexDirection: 'row', alignItems: 'center', gap: pt(4) }}>
              <PdfIcon name={icon} size={pt(11)} color={a.accent} />
              <Text style={{ fontSize: fz.contact }}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: pt(14), height: 1, backgroundColor: LINE }} />

      {(order ?? DEFAULT_ORDER).map((id) => (
        <View key={id} style={{ marginTop: pt(spacing?.secGap ?? DEFAULT_SPACING.secGap) }}>
          <View minPresenceAhead={pt(26)} style={{ flexDirection: 'row', alignItems: 'center', gap: pt(12) }}>
            <View style={{ flexGrow: 1, height: 1, backgroundColor: LINE }} />
            <Text style={{ fontSize: fz.sec, fontWeight: 600, letterSpacing: fz.sec * 0.26 }}>{SECTION_LABEL[id]}</Text>
            <View style={{ flexGrow: 1, height: 1, backgroundColor: LINE }} />
          </View>
          <View style={{ marginTop: pt(spacing?.titleGap ?? DEFAULT_SPACING.titleGap), paddingLeft: pt(spacing?.indent ?? 0) }}>
            <SectionBody id={id} data={data!} fz={fz} a={a} />
          </View>
        </View>
      ))}
    </Page>
  )
}

/* ---------- 深色商务（PDF）：近黑侧栏白字 ---------- */

function DarkAsidePdf({
  data,
  order,
  spacing,
  fz,
  a,
  typo,
  sidebarPct,
}: Omit<PdfResumeProps, 'variant'> & { fz: Fz; a: Accent; typo: Typography; sidebarPct: number }) {
  const contacts: [PdfIconName, string][] = [
    ['phone', data?.phone ?? ''],
    ['mail', data?.email ?? ''],
    ['github', data?.github ?? ''],
    ['map-pin', data?.location ?? ''],
  ]
  const tagOrder = (order ?? DEFAULT_ORDER).filter((id) => id === 'skills' || id === 'certificates' || id === 'awards')
  const entryOrder = (order ?? DEFAULT_ORDER).filter((id) => id === 'education' || id === 'work' || id === 'projects')
  const darkLabel = {
    marginTop: pt(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.25)',
    paddingBottom: pt(4),
    fontSize: fz.side,
    fontWeight: 600,
    letterSpacing: fz.side * 0.18,
    color: 'rgba(255,255,255,0.75)',
  } as const

  return (
    <Page
      size="A4"
      style={{
        backgroundColor: '#ffffff',
        fontFamily: `pp-${typo.font}`,
        fontSize: fz.base,
        lineHeight: typo.lineHeight,
        color: INK,
      }}
    >
      {/* minHeight 100%：深色侧栏背景拉满整页 */}
      <View style={{ flexDirection: 'row', minHeight: '100%' }}>
        <View style={{ width: `${sidebarPct}%`, backgroundColor: '#191919', padding: pt(20) }}>
          <View style={{ alignItems: 'center' }}>
            <PhotoCircle photo={data?.photo} color={a.accent} />
          </View>
          <Text style={darkLabel}>联系方式</Text>
          {contacts.map(([icon, text]) => (
            <View key={icon} style={{ marginTop: pt(6), flexDirection: 'row', alignItems: 'flex-start', gap: pt(6) }}>
              <View style={{ marginTop: pt(2) }}>
                <PdfIcon name={icon} size={pt(10)} color={a.accent} />
              </View>
              <Text style={{ flex: 1, color: 'rgba(236,233,226,0.9)' }}>{text}</Text>
            </View>
          ))}
          {tagOrder.map((id) => (
            <View key={id}>
              <Text style={darkLabel}>{SECTION_LABEL[id]}</Text>
              {id === 'awards' ? (
                (data?.awards ?? []).map((t, i) => (
                  <View key={i} style={{ position: 'relative', marginTop: pt(4), paddingLeft: pt(10) }}>
                    <View style={{ position: 'absolute', left: 0, top: fz.base * 0.6, width: pt(3), height: pt(3), borderRadius: pt(1.5), backgroundColor: a.accent }} />
                    <Text style={{ fontSize: fz.base, color: 'rgba(236,233,226,0.85)' }}>{t}</Text>
                  </View>
                ))
              ) : (
                <View style={{ marginTop: pt(8), flexDirection: 'row', flexWrap: 'wrap', gap: pt(4) }}>
                  {(id === 'skills' ? data?.skills ?? [] : data?.certificates ?? []).map((t, i) => (
                    <View
                      key={i}
                      style={{
                        borderRadius: pt(999),
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.3)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        paddingHorizontal: pt(8),
                        paddingVertical: pt(1),
                      }}
                    >
                      <Text style={{ fontSize: fz.chip, color: '#ece9e2', fontWeight: 500 }}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <View
          style={{
            flexGrow: 1,
            paddingTop: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
            paddingBottom: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
            paddingHorizontal: pt(spacing?.px ?? DEFAULT_SPACING.px),
          }}
        >
          <Text style={{ fontSize: fz.name, fontWeight: 600, letterSpacing: fz.name * 0.15, lineHeight: 1.25 }}>{data?.name}</Text>
          <Text style={{ marginTop: pt(2), fontSize: fz.intent, fontWeight: 500, color: a.strong, lineHeight: 1.4 }}>
            求职意向：{data?.intent}
          </Text>
          {entryOrder.map((id) => (
            <View key={id} style={{ marginTop: pt(spacing?.secGap ?? DEFAULT_SPACING.secGap) }}>
              <BarTitle id={id} fz={fz} a={a} />
              <View style={{ marginTop: pt(spacing?.titleGap ?? DEFAULT_SPACING.titleGap), paddingLeft: pt(spacing?.indent ?? 0) }}>
                <SectionBody id={id} data={data!} fz={fz} a={a} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </Page>
  )
}

/* ---------- 顶部色带（PDF）：全宽色带头部 + 竖条标题 ---------- */

function BandPdf({ data, order, spacing, fz, a, typo }: Omit<PdfResumeProps, 'variant' | 'sidebarPct'> & { fz: Fz; a: Accent; typo: Typography }) {
  const contacts: [PdfIconName, string][] = [
    ['phone', data?.phone ?? ''],
    ['mail', data?.email ?? ''],
    ['github', data?.github ?? ''],
    ['map-pin', data?.location ?? ''],
  ]
  return (
    <Page size="A4" style={{ backgroundColor: '#ffffff', fontFamily: `pp-${typo.font}`, fontSize: fz.base, lineHeight: typo.lineHeight, color: INK }}>
      <View
        style={{
          backgroundColor: a.soft,
          paddingTop: pt(Math.round((spacing?.pt ?? DEFAULT_SPACING.pt) * 0.6)),
          paddingBottom: pt(Math.round((spacing?.pt ?? DEFAULT_SPACING.pt) * 0.6)),
          paddingHorizontal: pt(spacing?.px ?? DEFAULT_SPACING.px),
        }}
        wrap={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: pt(12) }}>
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontSize: fz.name, fontWeight: 600, letterSpacing: fz.name * 0.18, lineHeight: 1.25 }}>{data?.name}</Text>
            <Text style={{ marginTop: pt(4), fontSize: fz.intent, fontWeight: 500, color: a.strong, lineHeight: 1.4 }}>
              求职意向：{data?.intent}
            </Text>
            <View style={{ marginTop: pt(6), flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: pt(14), rowGap: pt(2) }}>
              {contacts.map(([icon, text]) => (
                <View key={icon} style={{ flexDirection: 'row', alignItems: 'center', gap: pt(4) }}>
                  <PdfIcon name={icon} size={pt(11)} color={a.accent} />
                  <Text style={{ fontSize: fz.contact }}>{text}</Text>
                </View>
              ))}
            </View>
          </View>
          <PhotoRect photo={data?.photo} />
        </View>
      </View>

      <View
        style={{
          paddingTop: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
          paddingBottom: pt(spacing?.pt ?? DEFAULT_SPACING.pt),
          paddingHorizontal: pt(spacing?.px ?? DEFAULT_SPACING.px),
        }}
      >
        {(order ?? DEFAULT_ORDER).map((id) => (
          <View key={id} style={{ marginTop: pt(spacing?.secGap ?? DEFAULT_SPACING.secGap) }}>
            <View minPresenceAhead={pt(26)} style={{ flexDirection: 'row', alignItems: 'center', gap: pt(8), borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: pt(6) }}>
              <View style={{ width: pt(3), height: pt(13), borderRadius: pt(1.5), backgroundColor: a.accent }} />
              <Text style={{ fontSize: fz.sec, fontWeight: 600, letterSpacing: fz.sec * 0.16 }}>{SECTION_LABEL[id]}</Text>
            </View>
            <View style={{ marginTop: pt(spacing?.titleGap ?? DEFAULT_SPACING.titleGap), paddingLeft: pt(spacing?.indent ?? 0) }}>
              <SectionBody id={id} data={data!} fz={fz} a={a} />
            </View>
          </View>
        ))}
      </View>
    </Page>
  )
}
