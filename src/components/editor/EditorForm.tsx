import { useRef, useState, type DragEvent as ReactDragEvent, type KeyboardEvent, type ReactNode } from 'react'
import {
  Award,
  Briefcase,
  ChevronDown,
  ChevronUp,
  FolderGit2,
  GraduationCap,
  GripVertical,
  Medal,
  Plus,
  Trash2,
  Trophy,
  User,
  X,
} from 'lucide-react'
import { fileToCompressedDataUrl } from '../../lib/image'
import type { EntryKey, ResumeData, SectionId, TagKey } from '../../lib/resume'
import { useEditor } from '../../store/resume'

const inputCls =
  'w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-ink-2 focus:bg-surface'
const iconBtn =
  'rounded-md border border-line p-1.5 text-ink-2 transition-colors duration-200 hover:border-ink-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40'

function Labeled({ label, children, span = false }: { label: string; children: ReactNode; span?: boolean }) {
  return (
    <label className={`block ${span ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs text-ink-2">{label}</span>
      {children}
    </label>
  )
}

const SECTION_META: Record<
  SectionId,
  { label: string; icon: typeof User; kind: 'entry' | 'tag'; badge: (d: ResumeData) => string }
> = {
  education: {
    label: '教育经历',
    icon: GraduationCap,
    kind: 'entry',
    badge: (d) => (d.education.length ? `${d.education.length} 条` : '未填'),
  },
  work: {
    label: '实习 / 工作经历',
    icon: Briefcase,
    kind: 'entry',
    badge: (d) => (d.work.length ? `${d.work.length} 条` : '未填'),
  },
  projects: {
    label: '项目经历',
    icon: FolderGit2,
    kind: 'entry',
    badge: (d) => (d.projects.length ? `${d.projects.length} 条` : '未填'),
  },
  skills: {
    label: '技能',
    icon: Award,
    kind: 'tag',
    badge: (d) => (d.skills.length ? `${d.skills.length} 项` : '未填'),
  },
  certificates: {
    label: '证书',
    icon: Medal,
    kind: 'tag',
    badge: (d) => (d.certificates.length ? `${d.certificates.length} 项` : '未填'),
  },
  awards: {
    label: '荣誉奖项',
    icon: Trophy,
    kind: 'tag',
    badge: (d) => (d.awards.length ? `${d.awards.length} 项` : '未填'),
  },
}

function SectionShell({
  icon: Icon,
  label,
  badge,
  open,
  onToggle,
  draggable,
  dimmed,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  gripOnMouseDown,
  children,
}: {
  icon: typeof User
  label: string
  badge?: string
  open: boolean
  onToggle: () => void
  draggable?: boolean
  dimmed?: boolean
  onDragStart?: (e: ReactDragEvent) => void
  onDragEnd?: () => void
  onDragOver?: (e: ReactDragEvent) => void
  onDrop?: (e: ReactDragEvent) => void
  gripOnMouseDown?: () => void
  children: ReactNode
}) {
  return (
    <section
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseUp={onDragEnd}
      className={`overflow-hidden rounded-xl border border-line bg-surface ${dimmed ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-1 pr-2 transition-colors duration-200 hover:bg-paper">
        {gripOnMouseDown && (
          <span
            onMouseDown={gripOnMouseDown}
            title="拖动调整顺序"
            aria-hidden
            className="ml-1.5 flex-none cursor-grab p-1 text-ink-2/50 transition-colors duration-150 hover:text-ink-2 active:cursor-grabbing"
          >
            <GripVertical size={14} />
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-3.5 text-left"
        >
          <Icon size={16} className="flex-none text-accent-strong" />
          <span className="flex-1 truncate text-sm font-medium">{label}</span>
          {badge && <span className="flex-none rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-2">{badge}</span>}
          <ChevronDown
            size={15}
            aria-hidden
            className={`flex-none text-ink-2 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      <div className={`acc-body ${open ? 'open' : ''}`}>
        <div>
          <div className="border-t border-line px-4 py-4">{children}</div>
        </div>
      </div>
    </section>
  )
}

function TagInput({ tagKey, placeholder }: { tagKey: TagKey; placeholder: string }) {
  const tags = useEditor((s) => s.data[tagKey])
  const addTag = useEditor((s) => s.addTag)
  const removeTag = useEditor((s) => s.removeTag)
  const [draft, setDraft] = useState('')

  const commit = () => {
    if (draft.trim()) {
      addTag(tagKey, draft)
      setDraft('')
    }
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      removeTag(tagKey, tags.length - 1)
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-2 transition-colors duration-200 focus-within:border-ink-2">
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-xs"
        >
          {t}
          <button
            type="button"
            aria-label={`删除「${t}」`}
            onClick={() => removeTag(tagKey, i)}
            className="text-ink-2 transition-colors duration-150 hover:text-accent-strong"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={tags.length ? '' : placeholder}
        className="min-w-[90px] flex-1 bg-transparent py-0.5 text-sm outline-none"
      />
    </div>
  )
}

const ENTRY_META: Record<EntryKey, { titlePlaceholder: string; datePlaceholder: string }> = {
  education: { titlePlaceholder: '某某大学 · 计算机科学与技术（本科）', datePlaceholder: '2023.09 – 2027.06' },
  work: { titlePlaceholder: '某科技有限公司 · 后端开发实习生', datePlaceholder: '2026.03 – 2026.06' },
  projects: { titlePlaceholder: '项目名称（个人项目 / 课程设计 / 竞赛）', datePlaceholder: '2026.09 – 至今' },
}

function EntryCard({ entryKey, index, total }: { entryKey: EntryKey; index: number; total: number }) {
  const entry = useEditor((s) => s.data[entryKey][index])
  const updateEntry = useEditor((s) => s.updateEntry)
  const removeEntry = useEditor((s) => s.removeEntry)
  const moveEntry = useEditor((s) => s.moveEntry)
  if (!entry) return null
  const meta = ENTRY_META[entryKey]

  const setBullet = (bi: number, v: string) =>
    updateEntry(entryKey, index, { bullets: entry.bullets.map((b, i) => (i === bi ? v : b)) })

  return (
    <div className="rounded-lg border border-line bg-paper p-3">
      <div className="grid gap-2.5 sm:grid-cols-[1fr_170px]">
        <Labeled label="名称">
          <input
            value={entry.title}
            onChange={(e) => updateEntry(entryKey, index, { title: e.target.value })}
            placeholder={meta.titlePlaceholder}
            className={inputCls}
          />
        </Labeled>
        <Labeled label="时间">
          <input
            value={entry.date}
            onChange={(e) => updateEntry(entryKey, index, { date: e.target.value })}
            placeholder={meta.datePlaceholder}
            className={inputCls}
          />
        </Labeled>
      </div>

      <div className="mt-2.5">
        <span className="mb-1 block text-xs text-ink-2">描述（一条一个亮点，用动词开头 + 具体数字最好）</span>
        {entry.bullets.map((b, bi) => (
          <div key={bi} className="mb-1.5 flex items-start gap-1.5">
            <textarea
              rows={2}
              value={b}
              onChange={(e) => setBullet(bi, e.target.value)}
              placeholder="例如：负责订单模块接口开发，将查询接口平均响应时间从 800ms 优化至 120ms"
              className={`${inputCls} resize-y`}
            />
            <button
              type="button"
              aria-label="删除这条描述"
              onClick={() => updateEntry(entryKey, index, { bullets: entry.bullets.filter((_, i) => i !== bi) })}
              className={`${iconBtn} mt-0.5`}
            >
              <X size={13} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => updateEntry(entryKey, index, { bullets: [...entry.bullets, ''] })}
          className="mt-0.5 inline-flex items-center gap-1 text-xs text-accent-strong transition-colors duration-150 hover:text-ink"
        >
          <Plus size={12} /> 添加一条描述
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-line pt-2">
        <button type="button" aria-label="上移" disabled={index === 0} onClick={() => moveEntry(entryKey, index, -1)} className={iconBtn}>
          <ChevronUp size={13} />
        </button>
        <button
          type="button"
          aria-label="下移"
          disabled={index === total - 1}
          onClick={() => moveEntry(entryKey, index, 1)}
          className={iconBtn}
        >
          <ChevronDown size={13} />
        </button>
        <button
          type="button"
          aria-label="删除该条"
          onClick={() => {
            if (window.confirm('删除这一条？')) removeEntry(entryKey, index)
          }}
          className={`${iconBtn} hover:border-[#c53030] hover:text-[#c53030]`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

const TAG_PLACEHOLDER: Record<TagKey, string> = {
  skills: '输入技能后回车，如：JavaScript / React',
  certificates: '如：CET-6，回车添加',
  awards: '如：国家励志奖学金（2024）',
}

export default function EditorForm() {
  const data = useEditor((s) => s.data)
  const update = useEditor((s) => s.update)
  const sectionOrder = useEditor((s) => s.sectionOrder)
  const reorderSections = useEditor((s) => s.reorderSections)
  const [open, setOpen] = useState<Record<string, boolean>>({ basics: true })
  const [photoErr, setPhotoErr] = useState<string | null>(null)
  const [dragId, setDragId] = useState<SectionId | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const toggle = (id: string) => setOpen((m) => ({ ...m, [id]: !m[id] }))

  /** 拖拽经过其他分区时按指针所在半区实时重排（HTML5 DnD，移动端用↑↓按钮） */
  const onSectionDragOver = (e: ReactDragEvent, id: SectionId) => {
    if (!dragId || dragId === id) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const to = sectionOrder.indexOf(id) + (e.clientY < rect.top + rect.height / 2 ? 0 : 1)
    const from = sectionOrder.indexOf(dragId)
    const arr = [...sectionOrder]
    arr.splice(from, 1)
    arr.splice(to > from ? to - 1 : to, 0, dragId)
    if (arr.some((v, i) => v !== sectionOrder[i])) reorderSections(arr)
  }

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      update({ photo: dataUrl })
      setPhotoErr(null)
    } catch {
      setPhotoErr('照片读取失败，请换一张图片')
    }
  }

  return (
    <div className="space-y-3">
      <SectionShell icon={User} label="基本信息" badge={data.name ? '已填' : '必填'} open={!!open.basics} onToggle={() => toggle('basics')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled label="姓名">
            <input value={data.name} onChange={(e) => update({ name: e.target.value })} placeholder="张小明" className={inputCls} />
          </Labeled>
          <Labeled label="所在城市">
            <input value={data.location} onChange={(e) => update({ location: e.target.value })} placeholder="杭州" className={inputCls} />
          </Labeled>
          <Labeled label="求职意向" span>
            <input
              value={data.intent}
              onChange={(e) => update({ intent: e.target.value })}
              placeholder="前端开发工程师（2027 届）"
              className={inputCls}
            />
          </Labeled>
          <Labeled label="手机号">
            <input value={data.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="138-0000-0000" className={inputCls} />
          </Labeled>
          <Labeled label="邮箱">
            <input
              value={data.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="zhangming@mail.com"
              className={inputCls}
            />
          </Labeled>
          <Labeled label="GitHub / 个人主页" span>
            <input
              value={data.github}
              onChange={(e) => update({ github: e.target.value })}
              placeholder="github.com/zhangming"
              className={inputCls}
            />
          </Labeled>

          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs text-ink-2">证件照（在「经典单栏 / 双栏简洁」模板中显示，可选）</span>
            <div className="flex items-center gap-3">
              <div className="h-16 w-12 flex-none overflow-hidden rounded-md border border-line bg-paper">
                {data.photo ? (
                  <img src={data.photo} alt="证件照预览" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-2">
                    <User size={15} />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs transition-colors duration-200 hover:bg-paper"
                >
                  {data.photo ? '更换照片' : '上传照片'}
                </button>
                {data.photo && (
                  <button
                    type="button"
                    onClick={() => update({ photo: '' })}
                    className="inline-flex items-center gap-1 text-xs text-ink-2 transition-colors hover:text-[#c53030]"
                  >
                    <Trash2 size={11} /> 删除
                  </button>
                )}
                <span className="text-[10px] text-ink-2">自动压缩到 320px 宽，只保存在本机</span>
              </div>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </div>
            {photoErr && (
              <p role="alert" className="mt-1 text-xs text-[#c53030]">
                {photoErr}
              </p>
            )}
          </div>
        </div>
      </SectionShell>

      {sectionOrder.map((id) => {
        const meta = SECTION_META[id]
        return (
          <SectionShell
            key={id}
            icon={meta.icon}
            label={meta.label}
            badge={meta.badge(data)}
            open={!!open[id]}
            onToggle={() => toggle(id)}
            draggable={dragId === id}
            dimmed={dragId === id}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/plain', id)
            }}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => onSectionDragOver(e, id)}
            onDrop={(e) => e.preventDefault()}
            gripOnMouseDown={() => setDragId(id)}
          >
            {meta.kind === 'entry' ? (
              <EntrySectionBody entryKey={id as EntryKey} />
            ) : (
              <TagInput tagKey={id as TagKey} placeholder={TAG_PLACEHOLDER[id as TagKey]} />
            )}
          </SectionShell>
        )
      })}
    </div>
  )
}

function EntrySectionBody({ entryKey }: { entryKey: EntryKey }) {
  const list = useEditor((s) => s.data[entryKey])
  const addEntry = useEditor((s) => s.addEntry)
  return (
    <div className="space-y-3">
      {list.map((_, i) => (
        <EntryCard key={i} entryKey={entryKey} index={i} total={list.length} />
      ))}
      {list.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-ink-2">
          还没有内容。一段经历 = 名称 + 时间 + 几条亮点描述。
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          addEntry(entryKey)
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-ink-2 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-200 hover:border-ink hover:text-ink"
      >
        <Plus size={12} /> 添加
      </button>
    </div>
  )
}
