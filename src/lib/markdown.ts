import { normalizeResume, type ResumeData } from './resume'

/**
 * 把常见简历 Markdown 解析成结构化数据。
 * 约定：# 姓名；## 分区标题（基本信息/求职意向/教育经历/实习(工作)经历/项目经历/技能/证书/荣誉奖项）；
 * ### 条目标题；`- ` 行是描述或 `键: 值`（基本信息区）。
 * 解析不了的行忽略，导入的数据总会过一遍 normalizeResume 兜底。
 */

const ENTRY_SECTIONS = ['education', 'work', 'projects'] as const
const TAG_SECTIONS = ['skills', 'certificates', 'awards'] as const

const SECTION_MAP: [RegExp, string][] = [
  [/教育/, 'education'],
  [/实习|工作经历|工作/, 'work'],
  [/项目/, 'projects'],
  [/技能/, 'skills'],
  [/证书/, 'certificates'],
  [/荣誉|奖项|获奖/, 'awards'],
  [/意向|基本信息|联系/, 'basics'],
]

const BASIC_KEYS: [RegExp, string][] = [
  [/意向|目标|求职/, 'intent'],
  [/手机|电话|tel/i, 'phone'],
  [/邮箱|邮件|email/i, 'email'],
  [/github|主页|博客|链接/i, 'github'],
  [/城市|地点|坐标/, 'location'],
]

const isDatey = (s: string) => /\d{4}\s*[.年/\-–—~至]|至今/.test(s)
const clean = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`(.+?)`/g, '$1').trim()

export function parseMarkdown(md: string): ResumeData {
  const out: Record<string, unknown> = {
    education: [],
    work: [],
    projects: [],
    skills: [],
    certificates: [],
    awards: [],
  }
  let section: string | null = null
  let entry: { title: string; date: string; bullets: string[] } | null = null

  const flush = () => {
    if (entry && section && (ENTRY_SECTIONS as readonly string[]).includes(section)) {
      ;(out[section] as { title: string; date: string; bullets: string[] }[]).push({
        title: entry.title,
        date: entry.date,
        bullets: entry.bullets,
      })
    }
    entry = null
  }

  for (const raw of md.replace(/\r/g, '').split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const h1 = line.match(/^#\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    const li = line.match(/^[-*•]\s+(.+)/)
    const kv = line.match(/^([^:：]{1,8})[:：]\s*(.+)/)

    if (h1 && !h1[1].startsWith('#')) {
      if (!out.name) out.name = clean(h1[1])
      continue
    }
    if (h2) {
      flush()
      const title = clean(h2[1])
      section = SECTION_MAP.find(([re]) => re.test(title))?.[1] ?? null
      continue
    }
    if (h3) {
      flush()
      if (section && (ENTRY_SECTIONS as readonly string[]).includes(section)) {
        entry = { title: clean(h3[1]), date: '', bullets: [] }
      }
      continue
    }
    if (li) {
      const text = clean(li[1])
      if (section === 'basics') {
        const hit = kv && BASIC_KEYS.find(([re]) => re.test(kv[1]))
        if (hit) out[hit[1]] = clean(kv![2])
        else if (!out.intent) out.intent = text
      } else if (section && (TAG_SECTIONS as readonly string[]).includes(section)) {
        ;(out[section] as string[]).push(text)
      } else if (entry) {
        if (!entry.date && isDatey(text)) entry.date = text
        else entry.bullets.push(text)
      }
      continue
    }
    // 普通行
    if (section === 'basics' && kv) {
      const hit = BASIC_KEYS.find(([re]) => re.test(kv[1]))
      if (hit) out[hit[1]] = clean(kv[2])
    } else if (section && (ENTRY_SECTIONS as readonly string[]).includes(section)) {
      flush()
      entry = { title: clean(line), date: '', bullets: [] }
    }
  }
  flush()
  return normalizeResume(out)
}

export const MARKDOWN_SAMPLE = `# 张小明

## 基本信息

- 求职意向：前端开发工程师（2027 届）
- 手机：138-0000-0000
- 邮箱：zhangming@mail.com
- GitHub：github.com/zhangming
- 城市：杭州

## 教育经历

### 某某大学 · 计算机科学与技术（本科）

- 2023.09 – 2027.06
- GPA 3.6 / 4.0（专业前 10%）
- 核心课程：数据结构、操作系统、计算机网络

## 实习经历

### 某科技有限公司 · 后端开发实习生

- 2026.03 – 2026.06
- 负责订单模块接口开发，将查询接口平均响应时间从 800ms 优化至 120ms

## 项目经历

### 在线简历编辑器（个人开源项目）

- 2026.09 – 至今
- 独立完成表单编辑、实时预览与 PDF 导出全链路

## 技能

- JavaScript / React
- Java / Spring Boot

## 证书

- CET-6

## 荣誉奖项

- 国家励志奖学金（2024）
`
