# 素页简历 PlainPage

免费、无水印、ATS 友好的在线简历工具。填写信息 → 选模板 → 导出能通过机器筛选的 PDF。

- **数据不出浏览器** — 无账号、无上传、无埋点，简历只保存在 localStorage，断网可用，随时导出 JSON 备份
- **ATS 友好** — 导出 PDF 为真实文本层（可选中、可检索），单栏阅读顺序，机器初筛不丢内容
- **自由定制** — 3 套模板 × 9 种主题色 × 5 种字体；字号、行距、间距、分栏宽度、区块顺序、证件照均可调整

## 本地开发

```bash
npm install
npm run dev      # 开发服务器 http://localhost:5173
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览生产构建
```

## 技术栈

Vite 6 · React 18 · TypeScript · Tailwind CSS v4 · zustand（persist → localStorage）· react-router 7 · @react-pdf/renderer（导出，开发中）· lucide-react

字体自托管（@fontsource：Poppins / Lora，中文回退系统字体），全站无外部请求。

## 路线图

- [x] M0 首页与设计系统
- [x] M1 编辑器：本地自动保存 / 实时预览 / JSON 与 Markdown 导入 / 模板与排版定制
- [ ] M2 PDF / PNG 导出（真文本 PDF）
- [ ] M3 模板扩展与移动端打磨
- [ ] M4 部署上线与打磨

## 协议

暂未确定（计划采用 MIT）。
