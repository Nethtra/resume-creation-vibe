/**
 * 构建期字体子集化脚本（node scripts/subset-fonts.mjs）
 *
 * 作用：把 scripts/fonts-src/ 下的开源中文字体全量文件，按「GB2312 全集 +
 * 常用姓名补充字 + ASCII + 常用符号」子集化到 public/fonts/，并生成
 * public/fonts/charset.json（字形覆盖清单，供导出前做生僻字提醒）。
 *
 * 为什么必须子集 + 用开源字体：
 * - 简历预览用 Windows 系统字体（楷体/仿宋/幼圆等），但微软字体无嵌入分发授权，
 *   PDF 内嵌必须用开源字体（OFL 允许嵌入分发）。
 * - 全量 Noto SC 单字重 ~8MB，子集后 ~1.5-3MB，且只在用户首次点导出时按需加载。
 *
 * 源字体（scripts/fonts-src/，均 OFL 开源，需手动下载，见 scripts/README-fonts.md）：
 *   NotoSansSC-Regular/Medium/Bold.otf   黑体替代（notofonts/noto-cjk）
 *   NotoSerifSC-Regular/Medium/SemiBold/Bold.otf 宋体替代（notofonts/noto-cjk）
 *   LXGWWenKai-Regular/Medium.ttf        楷体替代（lxgw/LxgwWenKai）
 *   ZhuqueFangsong-Regular.otf           仿宋替代（TrionesType/Zhuque）
 *   ResourceHanRounded-Regular/Medium/Bold.ttf 幼圆替代（CyanoHao/resource-han-rounded）
 */
import subsetFont from 'subset-font'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = join(root, 'scripts', 'fonts-src')
const OUT_DIR = join(root, 'public', 'fonts')

/* ---------- 字符集生成 ---------- */

/** 常用姓名补充字（多为 GBK/通用规范汉字表三级，不在 GB2312 内），尽力覆盖，缺字由导出前检查兜底 */
const NAME_EXTRA =
  '喆堃頔翀晟煜珩玥瑄琰璇璟璨睿恩淼犇鑫彧翯翾晞晗暄曦昉旻昕炅炜燚辰昀熹赟瓒滢灏珺珮琤瑀瑾璞毓淇沐洢浠潼泠泫洺妍姝娅嫣婳媖寅宸崧嵘忻慕斓昶昱晏晁暻朔桉梓榕槿樾橙歆烨煊泓洵洹瑷珂甄皖祎禧穹竣笙筠篁絮翊聿芃芊芷苒茗荃莯菁萱葳葵蓁蔓蕙虔骁骞麒龘垚钰錡镕雯霖霏霁靓馨颀颂赫铖旭晏'

function buildCharset() {
  const set = new Set()
  // ASCII 可打印区
  for (let c = 0x20; c <= 0x7e; c++) set.add(c)
  // 常用西文标点与符号
  for (const ch of '€©®°±×÷√‰§¶†‡•…—–‘’“”″′‹›«»\u00a0\u3007') set.add(ch.codePointAt(0))
  // GB2312 全集（符号区 A1–A9 + 汉字区 B0–F7）
  const gbk = new TextDecoder('gbk')
  for (let row = 0xa1; row <= 0xf7; row++) {
    for (let col = 0xa1; col <= 0xfe; col++) {
      const ch = gbk.decode(Buffer.from([row, col]))
      if (ch.length === 1 && ch.codePointAt(0) !== 0xfffd) set.add(ch.codePointAt(0))
    }
  }
  // 姓名补充字
  for (const ch of NAME_EXTRA) set.add(ch.codePointAt(0))
  return [...set].sort((a, b) => a - b)
}

/** 码点数组 → 压缩区间（[[start,end],...]） */
function toRanges(codes) {
  const ranges = []
  let start = null, prev = null
  for (const c of codes) {
    if (start === null) { start = prev = c; continue }
    if (c === prev + 1) { prev = c; continue }
    ranges.push([start, prev]); start = prev = c
  }
  if (start !== null) ranges.push([start, prev])
  return ranges
}

/* ---------- 子集任务 ---------- */

// 输出文件命名：pp-<字体id>-<字重>.otf，与 src/lib/export.ts 的 PDF_FONT_FILES 对应
const JOBS = [
  { src: 'NotoSansSC-Regular.otf', out: 'pp-sans-400.otf' },
  { src: 'NotoSansSC-Medium.otf', out: 'pp-sans-500.otf' },
  { src: 'NotoSansSC-Bold.otf', out: 'pp-sans-600.otf' },
  { src: 'NotoSerifSC-Regular.otf', out: 'pp-song-400.otf' },
  { src: 'NotoSerifSC-Medium.otf', out: 'pp-song-500.otf' },
  { src: 'NotoSerifSC-SemiBold.otf', out: 'pp-song-600.otf' },
  { src: 'LXGWWenKai-Regular.ttf', out: 'pp-kai-400.ttf' },
  { src: 'LXGWWenKai-Medium.ttf', out: 'pp-kai-500.ttf' },
  { src: 'LXGWWenKai-Medium.ttf', out: 'pp-kai-600.ttf' },
  { src: 'ZhuqueFangsong-Regular.ttf', out: 'pp-fang-400.ttf' },
  { src: 'ResourceHanRounded-Regular.ttf', out: 'pp-yuan-400.ttf' },
  { src: 'ResourceHanRounded-Medium.ttf', out: 'pp-yuan-500.ttf' },
  { src: 'ResourceHanRounded-Bold.ttf', out: 'pp-yuan-600.ttf' },
]

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const codes = buildCharset()
  const text = String.fromCodePoint(...codes)
  console.log(`字符集：${codes.length} 个码点`)

  const report = []
  let totalKb = 0
  for (const job of JOBS) {
    const srcPath = join(SRC_DIR, job.src)
    if (!existsSync(srcPath)) {
      console.warn(`跳过 ${job.out}：源文件缺失 ${job.src}`)
      continue
    }
    const input = readFileSync(srcPath)
    // 省略 targetFormat：输出保持输入格式（OTF→OTF，TTF→TTF），避免 CFF/glyf 转换
    const out = await subsetFont(input, text)
    const outPath = join(OUT_DIR, job.out)
    writeFileSync(outPath, out)
    const kb = Math.round(statSync(outPath).size / 1024)
    const srcMb = (input.length / 1024 / 1024).toFixed(1)
    totalKb += kb
    report.push(job.out)
    console.log(`✓ ${job.out}  ${kb}KB  (源 ${srcMb}MB)`)
  }

  writeFileSync(
    join(OUT_DIR, 'charset.json'),
    JSON.stringify({ ranges: toRanges(codes), builtAt: new Date().toISOString().slice(0, 10) }),
  )
  console.log(`✓ charset.json（${toRanges(codes).length} 个区间）`)
  console.log(`合计输出：${report.length} 个文件，约 ${(totalKb / 1024).toFixed(1)}MB`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
