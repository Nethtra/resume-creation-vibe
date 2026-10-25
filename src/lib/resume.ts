export interface ResumeEntry {
  title: string
  date: string
  bullets: string[]
}

export interface ResumeData {
  name: string
  intent: string
  phone: string
  email: string
  github: string
  location: string
  /** 证件照 dataURL（本地压缩后存储；ATS 忽略图片，不影响机筛） */
  photo?: string
  education: ResumeEntry[]
  work: ResumeEntry[]
  projects: ResumeEntry[]
  skills: string[]
  certificates: string[]
  awards: string[]
}

export type EntryKey = 'education' | 'work' | 'projects'
export type TagKey = 'skills' | 'certificates' | 'awards'
export type SectionId = EntryKey | TagKey
export type TemplateVariant = 'classic' | 'sidebar' | 'blocks'

/** 简历区块的默认展示顺序（用户可在表单里上下调整，全模板共享） */
export const DEFAULT_ORDER: SectionId[] = ['education', 'work', 'projects', 'skills', 'certificates', 'awards']

/** 简历正文字体（纸面固定浅色渲染，字体由用户选择；均为 Windows 系统自带，无需下载） */
export const FONTS = [
  { id: 'sans', label: '黑体', stack: '"Poppins", "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", sans-serif' },
  { id: 'song', label: '宋体', stack: '"Lora", "SimSun", "Songti SC", "Noto Serif CJK SC", serif' },
  { id: 'kai', label: '楷体', stack: '"KaiTi", "Kaiti SC", "STKaiti", serif' },
  { id: 'fang', label: '仿宋', stack: '"FangSong", "FangSong SC", "STFangsong", serif' },
  { id: 'yuan', label: '幼圆', stack: '"YouYuan", "Yuanti SC", sans-serif' },
] as const

export type FontId = (typeof FONTS)[number]['id']

export interface Typography {
  font: FontId
  /** 正文字号基准（px）：姓名/标题/日期按固定比例跟随，纸面宽度不变、内容自然回流 */
  size: number
  lineHeight: number
}

export const DEFAULT_TYPOGRAPHY: Typography = { font: 'sans', size: 10.5, lineHeight: 1.7 }

/** 页面间距（px），学习商业简历站的间距配置面板 */
export interface Spacing {
  /** 页面上边距 */
  pt: number
  /** 页面左右边距 */
  px: number
  /** 内容缩进（各区块内容的额外左缩进） */
  indent: number
  /** 模块上边距（区块之间） */
  secGap: number
  /** 标题下边距（节标题与内容的间距） */
  titleGap: number
}

export const DEFAULT_SPACING: Spacing = { pt: 28, px: 28, indent: 0, secGap: 14, titleGap: 6 }

/** 简历主题色预设：accent 用于装饰图形，strong 用于文字/按钮（浅色纸面保证 ≥4.5:1），soft 为浅底 */
export const ACCENTS = [
  { id: 'terra', label: '陶土', accent: '#d97757', strong: '#b85c3f', soft: '#f6ebe4' },
  { id: 'ink', label: '墨黑', accent: '#191919', strong: '#191919', soft: '#eceae4' },
  { id: 'indigo', label: '靛蓝', accent: '#4a6fa5', strong: '#3d5f91', soft: '#e8edf5' },
  { id: 'pine', label: '松绿', accent: '#2f7d5d', strong: '#26684c', soft: '#e4f0ea' },
  { id: 'wine', label: '酒红', accent: '#a63d40', strong: '#8c3234', soft: '#f6e6e6' },
  { id: 'amber', label: '琥珀', accent: '#c9822d', strong: '#9a611b', soft: '#f7eedd' },
  { id: 'violet', label: '紫檀', accent: '#7c5ca8', strong: '#6a4c92', soft: '#efeaf6' },
  { id: 'steel', label: '藏蓝', accent: '#3d5a80', strong: '#324b6c', soft: '#e5ebf2' },
  { id: 'rose', label: '玫瑰', accent: '#c2607e', strong: '#a54a66', soft: '#f7e8ed' },
] as const

export type AccentPreset = (typeof ACCENTS)[number]

export const sampleResume: ResumeData = {
  name: '张小明',
  intent: '前端开发工程师（2027 届）',
  phone: '138-0000-0000',
  email: 'zhangming@mail.com',
  github: 'github.com/zhangming',
  location: '杭州',
  education: [
    {
      title: '某某大学 · 计算机科学与技术（本科）',
      date: '2023.09 – 2027.06',
      bullets: ['GPA 3.6 / 4.0（专业前 10%）', '核心课程：数据结构、操作系统、计算机网络、数据库'],
    },
  ],
  work: [
    {
      title: '某科技有限公司 · 后端开发实习生',
      date: '2026.03 – 2026.06',
      bullets: [
        '负责订单模块接口开发，将查询接口平均响应时间从 800ms 优化至 120ms',
        '参与代码评审，沉淀 3 篇团队开发规范文档',
      ],
    },
  ],
  projects: [
    {
      title: '在线简历编辑器（个人开源项目）',
      date: '2026.09 – 至今',
      bullets: ['独立完成表单编辑、实时预览与 PDF 导出全链路（React + TypeScript + Tailwind CSS）'],
    },
  ],
  skills: ['Java / Spring Boot', 'JavaScript / React', 'MySQL', 'Redis', 'Git'],
  certificates: ['CET-6', '软件设计师（软考中级）'],
  awards: ['国家励志奖学金（2024）', '蓝桥杯软件赛省赛二等奖', '校一等奖学金 × 2'],
}

export const emptyResume: ResumeData = {
  name: '',
  intent: '',
  phone: '',
  email: '',
  github: '',
  location: '',
  education: [],
  work: [],
  projects: [],
  skills: [],
  certificates: [],
  awards: [],
}

export const blankEntry = (): ResumeEntry => ({ title: '', date: '', bullets: [''] })

/** 导入 JSON 的宽容校验：只收字符串，坏数据一律回退为空 */
export function normalizeResume(raw: unknown): ResumeData {
  const d = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  const strArr = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : [])
  const entries = (v: unknown): ResumeEntry[] =>
    Array.isArray(v)
      ? v.map((e) => {
          const o = (typeof e === 'object' && e !== null ? e : {}) as Record<string, unknown>
          return { title: str(o.title), date: str(o.date), bullets: strArr(o.bullets) }
        })
      : []
  return {
    name: str(d.name),
    intent: str(d.intent),
    phone: str(d.phone),
    email: str(d.email),
    github: str(d.github),
    location: str(d.location),
    photo: str(d.photo) || undefined,
    education: entries(d.education),
    work: entries(d.work),
    projects: entries(d.projects),
    skills: strArr(d.skills),
    certificates: strArr(d.certificates),
    awards: strArr(d.awards),
  }
}
