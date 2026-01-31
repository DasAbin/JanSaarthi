import argparse
import json
import os
from typing import List, Dict, Any


def _render_pdf_to_images(input_path: str, temp_dir: str) -> List[str]:
    # Lightweight PDF render using pypdfium2 (recommended for Windows).
    import pypdfium2 as pdfium  # type: ignore

    os.makedirs(temp_dir, exist_ok=True)
    pdf = pdfium.PdfDocument(input_path)
    image_paths: List[str] = []
    for i in range(len(pdf)):
        page = pdf.get_page(i)
        pil_image = page.render(scale=2).to_pil()
        out = os.path.join(temp_dir, f"page_{i+1}.png")
        pil_image.save(out)
        image_paths.append(out)
    return image_paths


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--lang", default="en")
    parser.add_argument("--out", required=True)
    parser.add_argument("--fast", action="store_true", help="Fast mode: no angle classifier, faster OCR")
    args = parser.parse_args()

    from paddleocr import PaddleOCR  # type: ignore

    # Fast mode: use_angle_cls=False for speed; full mode uses angle classifier for accuracy
    use_angle_cls = not getattr(args, "fast", False)
    ocr = PaddleOCR(use_angle_cls=use_angle_cls, lang=args.lang)

    input_path = args.input
    ext = os.path.splitext(input_path)[1].lower()

    pages: List[Dict[str, Any]] = []

    if ext == ".pdf":
        temp_dir = os.path.join(os.path.dirname(args.out), "pdf_pages")
        image_paths = _render_pdf_to_images(input_path, temp_dir)
        for idx, img_path in enumerate(image_paths, start=1):
            res = ocr.ocr(img_path, cls=use_angle_cls)
            lines: List[str] = []
            for block in res or []:
                for item in block or []:
                    if len(item) >= 2 and item[1] and len(item[1]) >= 1:
                        lines.append(str(item[1][0]))
            pages.append({"pageNumber": idx, "text": "\n".join(lines)})
    else:
        res = ocr.ocr(input_path, cls=use_angle_cls)
        lines: List[str] = []
        for block in res or []:
            for item in block or []:
                if len(item) >= 2 and item[1] and len(item[1]) >= 1:
                    lines.append(str(item[1][0]))
        pages.append({"pageNumber": 1, "text": "\n".join(lines)})

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump({"pages": pages}, f, ensure_ascii=False)


if __name__ == "__main__":
    main()

