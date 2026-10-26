import { A4_HEIGHT_PX, type ResumeData, type SectionId } from './resume'

/**
 * ATS 自检清单（纯函数，与 UI 解耦）：
 * 按机筛系统的真实关注点分三组——必填信息（解析器第一眼）、内容完整度（关键词与量化成果）、
 * 排版与导出（页数与文件名）。只给结论与建议，不拦截导出。
 */

export type AtsLevel = 'pass' | 'warn' | 'fail'

export interface AtsCheck {
  id: string
  level: AtsLevel
  /** 一句话结论 */
  title: string
  /** 具体建议（fail/warn 时给出怎么做） */
  detail: string
}

export interface AtsGroup {
  id: string
  label: string
  checks: AtsCheck[]
}

export interface AtsSummary {
  groups: AtsGroup[]
  pass: number
  warn: number
  fail: number
}

export interface AtsInput {
  data: ResumeData
  /** 预览纸面自然高度 px；超过 A4 一页视为内容偏多（可省略，省略时不检查页数） */
  paperHeight?: number
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 含量化数字的描述（80ms、40%、3 倍、60+……） */
const QUANT_RE = /\d|[一二两三四五六七八九十百千万亿]+[%％倍]/

const ENTRY_LABEL: Record<SectionId, string> = {
  education: '教育经历',
  work: '实习 / 工作经历',
  projects: '项目经历',
  skills: '技能',
  certificates: '证书',
  awards: '荣誉奖项',
  summary: '个人优势',
}

export function runAtsChecks({ data, paperHeight }: AtsInput): AtsSummary {
  const groups: AtsGroup[] = [
    { id: 'basics', label: '必填信息（机筛解析的第一眼）', checks: [] },
    { id: 'content', label: '内容完整度（关键词与量化成果）', checks: [] },
    { id: 'layout', label: '排版与导出', checks: [] },
  ]
  const [gBasics, gContent, gLayout] = groups

  /* ---- 必填信息 ---- */

  gBasics.checks.push(
    data.name.trim()
      ? { id: 'name', level: 'pass', title: '姓名已填', detail: '' }
      : { id: 'name', level: 'fail', title: '姓名未填', detail: '姓名是简历的第一字段，所有 ATS 解析器都会读取。' },
  )

  gBasics.checks.push(
    data.intent.trim()
      ? { id: 'intent', level: 'pass', title: '求职意向已填', detail: '' }
      : {
          id: 'intent',
          level: 'fail',
          title: '求职意向未填',
          detail: '写清岗位方向（如「前端开发工程师」），机筛常按意向与岗位关键词做第一轮匹配。',
        },
  )

  const hasPhone = data.phone.trim().length > 0
  const hasEmail = data.email.trim().length > 0
  if (hasPhone && hasEmail) {
    gBasics.checks.push({ id: 'contact', level: 'pass', title: '电话与邮箱都已填', detail: '' })
  } else if (hasPhone) {
    gBasics.checks.push({
      id: 'contact',
      level: 'warn',
      title: '只填了电话',
      detail: '建议补上邮箱：多数 ATS 以邮箱作为候选人的唯一标识，通知面试也常用邮件。',
    })
  } else if (hasEmail) {
    gBasics.checks.push({
      id: 'contact',
      level: 'warn',
      title: '只填了邮箱',
      detail: '建议补上电话：部分国内 ATS / HR 习惯电话初筛。',
    })
  } else {
    gBasics.checks.push({
      id: 'contact',
      level: 'fail',
      title: '联系方式为空',
      detail: '电话与邮箱至少填一项，否则机筛通过后 HR 无法联系你。',
    })
  }

  if (hasEmail && !EMAIL_RE.test(data.email.trim())) {
    gBasics.checks.push({
      id: 'email-format',
      level: 'warn',
      title: '邮箱格式疑似有误',
      detail: `「${data.email.trim()}」不是常见的 name@domain 形式，请检查有无漏字或全角字符。`,
    })
  }

  /* ---- 内容完整度 ---- */

  gContent.checks.push(
    data.education.length > 0
      ? { id: 'education', level: 'pass', title: '教育经历已填', detail: '' }
      : {
          id: 'education',
          level: 'fail',
          title: '教育经历未填',
          detail: '应届生与初级岗位简历中教育经历是必填项（学校、专业、时间段）。',
        },
  )

  if (data.work.length === 0 && data.projects.length === 0) {
    gContent.checks.push({
      id: 'experience',
      level: 'warn',
      title: '实习 / 工作与项目经历都为空',
      detail: '至少填写其一：没有工作经历就用课程设计、个人项目、比赛填满这一栏。',
    })
  } else {
    gContent.checks.push({ id: 'experience', level: 'pass', title: '有经历内容（实习 / 工作或项目）', detail: '' })
  }

  // 每条经历都应有描述；空条目会被机筛解析为无效内容
  const emptyEntries: string[] = []
  let totalBullets = 0
  let quantBullets = 0
  for (const key of ['education', 'work', 'projects'] as const) {
    for (const e of data[key]) {
      const filled = e.bullets.map((b) => b.trim()).filter(Boolean)
      totalBullets += filled.length
      quantBullets += filled.filter((b) => QUANT_RE.test(b)).length
      if (!e.title.trim() || filled.length === 0) {
        emptyEntries.push(e.title.trim() || ENTRY_LABEL[key] + '（未命名条目）')
      }
    }
  }
  gContent.checks.push(
    emptyEntries.length === 0
      ? { id: 'entries', level: 'pass', title: '每条经历都有标题和描述', detail: '' }
      : {
          id: 'entries',
          level: 'warn',
          title: `${emptyEntries.length} 条经历缺标题或描述`,
          detail: `「${emptyEntries.slice(0, 3).join('、')}」没有可解析的内容——空条目建议删除或补 2~4 条描述。`,
        },
  )

  if (totalBullets >= 3) {
    const ratio = quantBullets / totalBullets
    gContent.checks.push(
      ratio >= 0.3
        ? {
            id: 'quantify',
            level: 'pass',
            title: `量化成果充足（${quantBullets}/${totalBullets} 条含数字）`,
            detail: '',
          }
        : {
            id: 'quantify',
            level: 'warn',
            title: `量化成果偏少（${quantBullets}/${totalBullets} 条含数字）`,
            detail: '把成果写成数字：响应时间从 800ms 降到 120ms、覆盖 1 万用户、效率提升 40%——数字比形容词可信。',
          },
    )
  }

  gContent.checks.push(
    data.skills.length > 0
      ? { id: 'skills', level: 'pass', title: `技能已填（${data.skills.length} 项）`, detail: '' }
      : {
          id: 'skills',
          level: 'warn',
          title: '技能为空',
          detail: '机筛大量依赖技能关键词匹配，把岗位 JD 里的关键词写进来（会用的才写）。',
        },
  )

  /* ---- 排版与导出 ---- */

  if (typeof paperHeight === 'number') {
    gLayout.checks.push(
      paperHeight <= A4_HEIGHT_PX + 40
        ? { id: 'page', level: 'pass', title: '内容在一页以内', detail: '' }
        : {
            id: 'page',
            level: 'warn',
            title: '内容超过一页 A4',
            detail: '单栏模板会自然分页；双栏模板超页部分会被压缩。建议精简到一页（应届生简历一页最稳）。',
          },
    )
  }

  /* ---- 汇总 ---- */

  const all = groups.flatMap((g) => g.checks)
  return {
    groups,
    pass: all.filter((c) => c.level === 'pass').length,
    warn: all.filter((c) => c.level === 'warn').length,
    fail: all.filter((c) => c.level === 'fail').length,
  }
}

/** 导出小贴士（与数据无关的静态说明，弹窗底部展示） */
export const ATS_TIPS: string[] = [
  '本站导出的 PDF 是真实文本层，可选中、可检索——这是 ATS 解析的前提，图形化工具的图片型 PDF 做不到。',
  '六套模板都是单栏逻辑顺序、无表格嵌套，阅读顺序与视觉顺序一致，机筛不会读乱。',
  '照片会被 ATS 直接忽略，不影响解析；不想放照片可在表单里删除。',
  '导出后建议把文件重命名为「姓名-岗位-简历.pdf」，HR 下载几十份简历时这样最不容易被漏掉。',
]
