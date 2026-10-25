import { Circle, Path, Svg } from '@react-pdf/renderer'

/**
 * PDF 端图标：从 lucide-static@0.469.0 抄录的 path 数据（与预览端 lucide-react@0.469 同版本，
 * 图形完全一致；lucide 为 ISC 许可）。预览端图标是 HTML SVG，@react-pdf 需要用
 * Svg/Path/Circle 原语重新组合，故把 24×24 坐标系的原始数据抽成常量。
 */
export type PdfIconName =
  | 'phone'
  | 'mail'
  | 'github'
  | 'map-pin'
  | 'user'
  | 'graduation-cap'
  | 'briefcase'
  | 'folder-git-2'
  | 'award'

const PATHS: Record<PdfIconName, string[]> = {
  phone: [
    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  ],
  mail: ['m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'],
  github: [
    'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
    'M9 18c-4.51 2-5-2-7-2',
  ],
  'map-pin': ['M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'],
  'graduation-cap': [
    'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z',
    'M22 10v6',
    'M6 12.5V16a6 3 0 0 0 12 0v-3.5',
  ],
  briefcase: ['M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'],
  'folder-git-2': [
    'M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5',
    'M18 19c-2.8 0-5-2.2-5-5v8',
  ],
  award: ['m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526'],
}

const CIRCLES: Partial<Record<PdfIconName, { cx: number; cy: number; r: number }[]>> = {
  award: [{ cx: 12, cy: 8, r: 6 }],
  'folder-git-2': [
    { cx: 13, cy: 12, r: 2 },
    { cx: 20, cy: 19, r: 2 },
  ],
  'map-pin': [{ cx: 12, cy: 10, r: 3 }],
  user: [{ cx: 12, cy: 7, r: 4 }],
}

/** 线性图标（对应 lucide 的 stroke 风格：无填充、2px 描边、圆头圆角） */
export function PdfIcon({ name, size, color }: { name: PdfIconName; size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {(PATHS[name] ?? []).map((d, i) => (
        <Path key={`p${i}`} d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {(CIRCLES[name] ?? []).map((c, i) => (
        <Circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  )
}
