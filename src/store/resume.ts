import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  blankEntry,
  DEFAULT_ORDER,
  DEFAULT_SPACING,
  DEFAULT_TYPOGRAPHY,
  emptyResume,
  normalizeResume,
  sampleResume,
  type EntryKey,
  type ResumeData,
  type ResumeEntry,
  type SectionId,
  type Spacing,
  type TagKey,
  type TemplateVariant,
  type Typography,
} from '../lib/resume'

interface EditorState {
  data: ResumeData
  template: TemplateVariant
  accentId: string
  typography: Typography
  spacing: Spacing
  /** 简历区块展示顺序（全模板共享，表单里可拖拽或上下调整） */
  sectionOrder: SectionId[]
  /** 双栏简洁模板的侧栏宽度百分比 */
  sidebarPct: number
  savedAt: number
  update: (patch: Partial<ResumeData>) => void
  addEntry: (key: EntryKey) => void
  updateEntry: (key: EntryKey, index: number, patch: Partial<ResumeEntry>) => void
  removeEntry: (key: EntryKey, index: number) => void
  moveEntry: (key: EntryKey, index: number, dir: -1 | 1) => void
  addTag: (key: TagKey, tag: string) => void
  removeTag: (key: TagKey, index: number) => void
  setTemplate: (t: TemplateVariant) => void
  setAccentId: (id: string) => void
  setTypo: (patch: Partial<Typography>) => void
  setSpacing: (patch: Partial<Spacing>) => void
  reorderSections: (order: SectionId[]) => void
  setSidebarPct: (v: number) => void
  loadSample: () => void
  resetAll: () => void
  applyData: (d: ResumeData) => void
  importJson: (raw: string) => string | null
}

/** 组合出新的 data（computed key 的 TS 宽化需要收窄） */
const withKey = (data: ResumeData, key: EntryKey | TagKey, value: ResumeEntry[] | string[]): ResumeData =>
  ({ ...data, [key]: value }) as ResumeData

export const useEditor = create<EditorState>()(
  persist(
    (set) => ({
      data: emptyResume,
      template: 'classic',
      accentId: 'terra',
      typography: DEFAULT_TYPOGRAPHY,
      spacing: DEFAULT_SPACING,
      sectionOrder: DEFAULT_ORDER,
      sidebarPct: 32,
      savedAt: 0,
      update: (patch) => set((s) => ({ data: { ...s.data, ...patch }, savedAt: Date.now() })),
      addEntry: (key) =>
        set((s) => ({ data: withKey(s.data, key, [...s.data[key as EntryKey], blankEntry()]), savedAt: Date.now() })),
      updateEntry: (key, index, patch) =>
        set((s) => ({
          data: withKey(s.data, key, s.data[key as EntryKey].map((e, i) => (i === index ? { ...e, ...patch } : e))),
          savedAt: Date.now(),
        })),
      removeEntry: (key, index) =>
        set((s) => ({ data: withKey(s.data, key, s.data[key as EntryKey].filter((_, i) => i !== index)), savedAt: Date.now() })),
      moveEntry: (key, index, dir) =>
        set((s) => {
          const arr = [...s.data[key as EntryKey]]
          const j = index + dir
          if (j < 0 || j >= arr.length) return s
          ;[arr[index], arr[j]] = [arr[j], arr[index]]
          return { data: withKey(s.data, key, arr), savedAt: Date.now() }
        }),
      addTag: (key, tag) =>
        set((s) => {
          const t = tag.trim()
          if (!t || (s.data[key as TagKey] as string[]).includes(t)) return s
          return { data: withKey(s.data, key, [...s.data[key as TagKey], t]), savedAt: Date.now() }
        }),
      removeTag: (key, index) =>
        set((s) => ({ data: withKey(s.data, key, s.data[key as TagKey].filter((_, i) => i !== index)), savedAt: Date.now() })),
      setTemplate: (template) => set({ template, savedAt: Date.now() }),
      setAccentId: (accentId) => set({ accentId, savedAt: Date.now() }),
      setTypo: (patch) => set((s) => ({ typography: { ...s.typography, ...patch }, savedAt: Date.now() })),
      setSpacing: (patch) => set((s) => ({ spacing: { ...s.spacing, ...patch }, savedAt: Date.now() })),
      reorderSections: (sectionOrder) => set({ sectionOrder, savedAt: Date.now() }),
      setSidebarPct: (sidebarPct) => set({ sidebarPct, savedAt: Date.now() }),
      loadSample: () => set({ data: sampleResume, savedAt: Date.now() }),
      resetAll: () => set({ data: emptyResume, savedAt: Date.now() }),
      applyData: (data) => set({ data, savedAt: Date.now() }),
      importJson: (raw) => {
        try {
          set({ data: normalizeResume(JSON.parse(raw)), savedAt: Date.now() })
          return null
        } catch {
          return 'JSON 解析失败，请检查文件内容是否完整'
        }
      },
    }),
    {
      name: 'plainpage-resume',
      version: 4,
      partialize: (s) => ({
        data: s.data,
        template: s.template,
        accentId: s.accentId,
        typography: s.typography,
        spacing: s.spacing,
        sectionOrder: s.sectionOrder,
        sidebarPct: s.sidebarPct,
      }),
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<EditorState>
        if (version < 2) p.typography = DEFAULT_TYPOGRAPHY
        if (version < 3) {
          p.sectionOrder = DEFAULT_ORDER
          p.sidebarPct = 32
        }
        if (version < 4) p.spacing = DEFAULT_SPACING
        return p as EditorState
      },
    },
  ),
)
