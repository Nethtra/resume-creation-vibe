"""
PDF 导出验证脚本（python scripts/e2e/validate_pdf.py <pdf> [--json case.json]）
检查：文本层可提取、关键内容存在、顺序正确、页面为 A4、字体已嵌入子集。
内容断言通过 JSON 文件驱动：{"must_contain": [...], "order": [...], "pages": [1,99]}
"""
import json
import sys

from pypdf import PdfReader


def full_text(reader: PdfReader) -> str:
    return "\n".join((p.extract_text() or "") for p in reader.pages)


def main() -> None:
    path = sys.argv[1]
    case = {}
    if len(sys.argv) > 3 and sys.argv[2] == "--json":
        with open(sys.argv[3], encoding="utf-8") as f:
            case = json.load(f)

    reader = PdfReader(path)
    text = full_text(reader)
    # pypdf 会把字距（letterSpacing）的 TJ 间隙读成空格（如「张 小 明」），
    # ATS 解析与人工搜索均做空白归一化，故内容断言统一在去空白文本上做。
    import re

    squashed = re.sub(r"\s+", "", text)
    errors = []

    # 1. 页面尺寸 A4（595.28 x 841.89 pt，容差 1pt）
    for i, page in enumerate(reader.pages):
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)
        if abs(w - 595.28) > 1 or abs(h - 841.89) > 1:
            errors.append(f"page {i}: size {w:.2f}x{h:.2f} != A4")

    # 2. 关键内容存在（去空白匹配）
    for needle in case.get("must_contain", []):
        if re.sub(r"\s+", "", needle) not in squashed:
            errors.append(f"missing text: {needle!r}")

    # 3. 乱码 / 替换字符
    if "\ufffd" in text:
        errors.append("replacement char (U+FFFD) found — likely garbled")

    # 4. 顺序：must_contain 出现的下标应递增（去空白）
    order_items = case.get("order", [])
    positions = []
    for needle in order_items:
        idx = squashed.find(re.sub(r"\s+", "", needle))
        if idx < 0:
            errors.append(f"order: {needle!r} not found")
            positions.append(-1)
        else:
            positions.append(idx)
    if positions != sorted(positions):
        errors.append(f"text order wrong: {list(zip(order_items, positions))}")

    # 5. 字体嵌入（Type0 子集）
    for i, page in enumerate(reader.pages):
        fonts = page["/Resources"].get("/Font", {})
        names = []
        for k in fonts:
            obj = fonts[k].get_object()
            names.append(str(obj.get("/Subtype")))
        if not names or "/Type0" not in names:
            errors.append(f"page {i}: no embedded Type0 font (found {names})")

    # 6. 页数范围
    pages = case.get("pages")
    if pages and not (pages[0] <= len(reader.pages) <= pages[1]):
        errors.append(f"page count {len(reader.pages)} not in {pages}")

    result = {"file": path, "pages": len(reader.pages), "chars": len(text), "errors": errors}
    print(json.dumps(result, ensure_ascii=False))
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
