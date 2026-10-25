import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, ScanText, ShieldCheck } from 'lucide-react'
import ResumePaper from '../components/ResumePaper'
import Reveal from '../components/Reveal'
import ThemeToggle from '../components/ThemeToggle'
import type { TemplateVariant } from '../lib/resume'

const features = [
  {
    icon: ShieldCheck,
    title: '数据不出浏览器',
    desc: '无账号、无上传，简历只保存在你浏览器的 localStorage 里，断网也能继续编辑，随时导出 JSON 备份。',
  },
  {
    icon: ScanText,
    title: 'ATS 友好导出',
    desc: 'PDF 是真实文本层，可选中、可检索、阅读顺序清晰——机器初筛不会丢掉你写下的任何内容。',
  },
  {
    icon: BadgeCheck,
    title: '真免费无水印',
    desc: '开源项目，所有模板免费导出，没有导出次数墙，也不加任何水印。',
  },
]

const templates: { variant: TemplateVariant; name: string; desc: string; tags: string[] }[] = [
  { variant: 'classic', name: '经典单栏', desc: '信息密度最高，机筛解析最稳，默认推荐', tags: ['单栏', '最 ATS'] },
  { variant: 'sidebar', name: '双栏简洁', desc: '浅色侧栏 + 色块标题条，分栏宽度可拖动', tags: ['双栏', '可调分栏'] },
  { variant: 'blocks', name: '简约色块', desc: '单栏排版 + 色块标题条，干净利落', tags: ['单栏', '色块标题'] },
]

const faqs = [
  {
    q: '真的免费吗？导出有水印吗？',
    a: '完全免费、无水印、无导出次数限制。项目开源，模板与导出功能不设付费墙。',
  },
  {
    q: '我的简历数据存在哪里？',
    a: '只存在你自己浏览器的 localStorage 里，不上传任何服务器。可以随时导出 JSON 备份，也可以一键清除全部数据。',
  },
  {
    q: '「ATS 友好」是什么意思？',
    a: 'ATS 是企业用来初筛简历的机器系统。本站导出的 PDF 是真实文本（可选中、可复制、顺序清晰），机筛解析不丢内容——不少图形化简历工具的 PDF 会在这一步丢分。',
  },
  {
    q: '支持导出 Word 吗？',
    a: '当前版本支持 PDF 与 PNG；Word 格式已在路线图中。',
  },
]

const cardHover = 'transition-all duration-300 ease-out hover:-translate-y-1 hover:border-ink-2 active:translate-y-0'

/* 轮播卡片：以 520px 宽渲染完整简历再整体缩放，字形清晰不挤压。
   缩放比按卡片可视内容宽（340 - 左右内边距 24 - 边框 2）计算，避免右侧被裁 */
const PAPER_W = 520
const CARD_W = 340
const CARD_SCALE = (CARD_W - 26) / PAPER_W
const CARD_H = Math.round(((PAPER_W * 297) / 210) * CARD_SCALE)

function ShowcaseCard({ t, dup = false }: { t: (typeof templates)[number]; dup?: boolean }) {
  return (
    <div className="mr-6 w-[340px] flex-none" aria-hidden={dup || undefined}>
      <Link
        to={`/editor?template=${t.variant}`}
        className="block rounded-xl border border-line bg-surface p-3 transition-all duration-300 hover:-translate-y-1 hover:border-ink-2"
        tabIndex={dup ? -1 : undefined}
      >
        <div className="overflow-hidden rounded-md border border-line" style={{ height: CARD_H }}>
          <div style={{ width: PAPER_W, transform: `scale(${CARD_SCALE})`, transformOrigin: 'top left' }}>
            <ResumePaper variant={t.variant} />
          </div>
        </div>
        <div className="px-1 pb-1 pt-3">
          <div className="flex items-center justify-between">
            <b className="text-sm font-semibold">{t.name}</b>
            <span className="flex gap-1.5">
              {t.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-2">
                  {tag}
                </span>
              ))}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-2">{t.desc}</p>
        </div>
      </Link>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 顶栏 */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-wide">
            <span className="inline-block h-3 w-3 rounded-[3px] bg-accent transition-transform duration-300 hover:rotate-90" aria-hidden />
            素页简历
          </Link>
          <nav className="flex items-center gap-4 text-sm text-ink-2 sm:gap-6">
            <a href="#templates" className="link-underline hidden hover:text-ink sm:inline">
              模板
            </a>
            <a href="#privacy" className="link-underline hidden hover:text-ink sm:inline">
              隐私说明
            </a>
            <ThemeToggle />
            <Link
              to="/editor"
              className="rounded-lg bg-accent-strong px-4 py-2 font-medium text-paper transition-all duration-200 hover:bg-ink active:scale-[0.97]"
            >
              开始制作
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="hero-in text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
            Plain · Free · ATS-Friendly
          </p>
          <h1
            className="hero-in mt-3 font-display text-4xl font-semibold leading-[1.22] md:text-[44px]"
            style={{ animationDelay: '90ms' }}
          >
            不用注册，不收钱，
            <br />
            三分钟做出能过机筛的简历
          </h1>
          <p className="hero-in mt-5 max-w-[46ch] leading-relaxed text-ink-2" style={{ animationDelay: '180ms' }}>
            面向应届生和初级求职者：填写信息 → 选模板 → 导出 ATS 友好的 PDF。全程免费无水印，数据只保存在你自己的浏览器里。
          </p>
          <div className="hero-in mt-7 flex flex-wrap gap-3" style={{ animationDelay: '270ms' }}>
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-strong px-5 py-2.5 font-medium text-paper transition-all duration-200 hover:bg-ink active:scale-[0.97]"
            >
              开始制作 <ArrowRight size={16} />
            </Link>
            <a
              href="#templates"
              className="inline-flex items-center rounded-lg border border-ink px-5 py-2.5 font-medium transition-all duration-200 hover:bg-surface active:scale-[0.97]"
            >
              看看模板
            </a>
          </div>
          <ul
            className="hero-in mt-8 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-2"
            style={{ animationDelay: '360ms' }}
          >
            {['免费开源', '无水印', '数据本地存储', 'PDF 真文本'].map((x) => (
              <li key={x} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="hero-in" style={{ animationDelay: '220ms' }}>
          <ResumePaper />
        </div>
      </section>

      {/* 三卖点 */}
      <section className="mx-auto grid max-w-6xl gap-4 px-5 md:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <Reveal key={title} delay={i * 90}>
            <div className={`h-full rounded-xl border border-line bg-surface p-6 ${cardHover}`}>
              <Icon size={20} className="text-accent-strong" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{desc}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* 模板轮播 */}
      <section id="templates" className="scroll-mt-6 py-16">
        <Reveal>
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3 px-5">
            <div>
              <h2 className="font-display text-3xl font-semibold">模板</h2>
              <p className="mt-2 text-sm text-ink-2">三套全部免费、均为真实文本导出，支持 9 种主题色与字体字号行距自定义。</p>
            </div>
            <span className="hidden text-xs text-ink-2 sm:block">更多模板在路线图中</span>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div
            className="marquee mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]"
          >
            <div className="marquee-track py-2">
              {[...templates, ...templates].map((t, i) => (
                <ShowcaseCard key={`${t.variant}-${i}`} t={t} dup={i >= templates.length} />
              ))}
            </div>
          </div>
        </Reveal>
        <p className="mt-2 text-center text-xs text-ink-2">自动轮播 · 悬停暂停 · 点击模板直接开始填写</p>
      </section>

      {/* 隐私声明条 */}
      <section id="privacy" className="mx-auto max-w-6xl scroll-mt-6 px-5">
        <Reveal>
          <div className="rounded-r-xl border-l-4 border-accent bg-surface p-5 text-sm leading-relaxed">
            <b className="font-semibold">你的简历只保存在你自己的设备上。</b>
            <span className="text-ink-2">
              {' '}
              本站是纯静态应用：没有后端服务器、没有统计埋点、没有任何接口请求（字体也是本地加载）。清除浏览器数据即可彻底删除所有内容。
            </span>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-semibold">FAQ</h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-8 border-t border-line">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 font-medium transition-colors hover:text-accent-strong">
                  {f.q}
                  <span aria-hidden className="text-lg text-ink-2 transition-transform duration-300 group-open:rotate-45">
                    ＋
                  </span>
                </summary>
                <p className="max-w-[70ch] pb-4 text-sm leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 素页简历 PlainPage · 为求职者做的免费开源工具</span>
          <span>GitHub 仓库整理中 · 基于 React / Tailwind CSS / @react-pdf 等开源库构建</span>
        </div>
      </footer>
    </div>
  )
}
