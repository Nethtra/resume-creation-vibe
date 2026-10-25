# PDF 内嵌字体说明

PDF 导出（`src/components/pdf/`）使用开源中文字体替代 Windows 系统字体——微软字体
（宋体/楷体/仿宋/幼圆）无嵌入分发授权，开源字体（以下均为 OFL 或等效自由许可）允许
嵌入 PDF 分发。预览端仍用系统字体（零下载），PDF 端字形与预览为同风格近似。

## 字体映射（预览字体 → PDF 内嵌字体）

| 预览（系统字体） | PDF 内嵌（开源） | 许可 | 来源 |
|---|---|---|---|
| 黑体（雅黑/苹方） | Noto Sans SC（Regular/Medium/Bold） | OFL | github.com/notofonts/noto-cjk（Sans/SubsetOTF/SC） |
| 宋体（SimSun） | Noto Serif SC（Regular/Medium/SemiBold） | OFL | github.com/notofonts/noto-cjk（Serif/SubsetOTF/SC） |
| 楷体（KaiTi） | 霞鹜文楷 LXGW WenKai（Regular/Medium） | OFL | github.com/lxgw/LxgwWenKai |
| 仿宋（FangSong） | 朱雀仿宋 Zhuque Fangsong（Regular，单字重） | OFL | github.com/TrionesType/zhuque |
| 幼圆（YouYuan） | 资源圆体 Resource Han Rounded CN（Regular/Medium/Bold） | OFL | github.com/CyanoHao/resource-han-rounded |

## 子集化流程

1. 手动下载上表源字体放入 `scripts/fonts-src/`（该目录已 gitignore，不入库）；
2. `npm run fonts`（即 `node scripts/subset-fonts.mjs`）：
   - 字符集 = GB2312 全集（7445）+ 常用姓名补充字 + ASCII + 常用符号，共 8318 码点；
   - 输出 `public/fonts/pp-<字体id>-<字重>.<otf|ttf>`（共 13 个文件，~38MB，**入库**，
     部署时随静态资源发布）与 `public/fonts/charset.json`（字形覆盖清单）；
3. 运行时只在首次点导出时按当前字体族懒加载对应子集（单次导出约 2–7MB，浏览器缓存）。

## 已知限制（如实告知）

- 简历文本若含字库覆盖外的生僻字，导出后会 toast 提示（该字符在 PDF 中可能显示为空心框）；
- 朱雀仿宋目前仅 Regular 字重，仿宋档位的标题加粗效果弱于其他字体；
- 楷体（霞鹜文楷）500/600 两档共用 Medium 字重。
