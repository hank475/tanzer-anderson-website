from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from render_canvas import (
    BLUE,
    GOLD,
    GOLD_LIGHT,
    INK,
    NAVY,
    OUTER,
    PAPER,
    WHITE,
    add_noise,
    draw_spaced,
    font,
    paper_texture,
    wrap_pixels,
)

W = 1280
H = 3400
BODY = font("sans", 26)
BODY_SEMIBOLD = font("sans_semibold", 26)
META = font("serif", 18)
CREST = font("serif", 42)
WORDMARK = font("serif", 46)
TAGLINE = font("sans_semibold", 14)
EYEBROW = font("sans_semibold", 15)
GREETING = font("serif_bold", 34)
BUTTON = font("sans_semibold", 16)
SIGNATURE = font("script", 76)
TITLE = font("sans_semibold", 14)
EMAIL = font("sans", 20)
SIDE = font("sans_semibold", 17)
SIDE_BIG = font("serif", 80)
FOOTER_WORDMARK = font("serif", 24)
FOOTER_SMALL = font("sans_semibold", 11)
COPYRIGHT = font("sans", 11)

PRODUCT = (
    "Tanzer Anderson has built a fixed-scope Commercial Talent Sprint for search and staffing firms "
    "that need an additional research lane on one difficult requisition—without hiring another "
    "researcher, transferring candidate contact, or adding a placement fee."
)
STATUS = (
    "The individuals are presented as researched prospects, not as interested or available unless "
    "that has been separately verified. Your team retains every candidate interaction, assessment "
    "decision, and client relationship."
)
CLOSING = "No call is required. Questions and the full engagement can be handled in writing."
BULLETS = [
    "25–40 evidence-backed potential candidates, ranked with fit reasoning",
    "source links, strengths, gaps, and risk flags",
    "a practical sourcing strategy and personalized opening copy",
    "a private, handoff-ready client room",
    "one written refinement",
]


def paragraph(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, max_width: int, *, gap: int = 30) -> int:
    for line in wrap_pixels(draw, text, BODY, max_width):
        draw.text((x, y), line, font=BODY, fill=INK)
        y += 46
    return y + gap


def render_record(record: dict[str, object], output: Path) -> None:
    image = paper_texture((W, H), OUTER, seed=31 + int(record["wave"]), strength=0.55).convert("RGBA")
    card_x, card_y = 76, 52
    card_w, card_h = 1128, 3270
    left_w = 790
    right_w = card_w - left_w
    meta_h = 86
    footer_h = 250
    content_top = card_y + meta_h
    footer_y = card_y + card_h - footer_h

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (card_x + 12, card_y + 18, card_x + card_w + 12, card_y + card_h + 18),
        radius=5,
        fill=(12, 23, 35, 70),
    )
    image = Image.alpha_composite(image, shadow.filter(ImageFilter.GaussianBlur(22)))

    image.paste(paper_texture((left_w, card_h - meta_h - footer_h), PAPER, 18, 1.2), (card_x, content_top))
    image.paste(paper_texture((card_w, meta_h), (249, 246, 240), 14, 0.6), (card_x, card_y))
    image.paste(paper_texture((card_w, footer_h), (244, 239, 230), 15, 0.8), (card_x, footer_y))

    panel = add_noise(Image.new("RGB", (right_w, card_h - meta_h - footer_h), NAVY), 8, 0.28, 19)
    panel_arr = np.asarray(panel).astype(np.float32)
    panel_arr = np.clip(panel_arr * np.linspace(1.08, 0.88, panel_arr.shape[0])[:, None, None], 0, 255).astype(np.uint8)
    image.paste(Image.fromarray(panel_arr), (card_x + left_w, content_top))

    draw = ImageDraw.Draw(image)
    draw.rectangle((card_x, card_y, card_x + card_w, card_y + card_h), outline=(205, 194, 176), width=2)
    draw.line((card_x, content_top, card_x + card_w, content_top), fill=GOLD, width=2)
    draw.line((card_x, footer_y, card_x + card_w, footer_y), fill=GOLD, width=2)
    draw.line((card_x + left_w, content_top, card_x + left_w, footer_y), fill=(20, 38, 58), width=2)

    draw.text((card_x + 52, card_y + 32), "Private & Confidential", font=META, fill=(86, 82, 75))
    right_meta = "Commercial Talent Sprint"
    draw.text((card_x + card_w - 52 - draw.textlength(right_meta, font=META), card_y + 32), right_meta, font=META, fill=(86, 82, 75))

    right_x, right_y = card_x + left_w, content_top
    arch_h = 500
    for row in range(arch_h):
        ratio = row / arch_h
        color = tuple(int(BLUE[index] * (1 - ratio) + (233, 240, 245)[index] * ratio) for index in range(3))
        draw.line((right_x, right_y + row, right_x + right_w, right_y + row), fill=color)
    draw.polygon(
        [(right_x, right_y + 350), (right_x + right_w, right_y + 40), (right_x + right_w, right_y + 160), (right_x + 105, right_y + 430), (right_x, right_y + 430)],
        fill=WHITE,
    )
    draw.line((right_x + 2, right_y + 348, right_x + right_w - 2, right_y + 38), fill=GOLD_LIGHT, width=3)
    draw.polygon(
        [(right_x, right_y + 430), (right_x + 105, right_y + 430), (right_x + right_w, right_y + 160), (right_x + right_w, right_y + arch_h), (right_x, right_y + arch_h)],
        fill=NAVY,
    )

    center_x = card_x + left_w // 2
    crest_y = content_top + 62
    crest = (center_x - 62, crest_y, center_x + 62, crest_y + 145)
    draw.rounded_rectangle(crest, radius=58, outline=(197, 180, 146), width=2, fill=(250, 248, 243))
    draw.text((center_x, crest_y + 48), "TA", font=CREST, fill=GOLD, anchor="ma")
    wordmark_y = crest_y + 186
    draw_spaced(draw, (center_x, wordmark_y), "TANZER ANDERSON", WORDMARK, NAVY, 10, "ma")
    tagline_y = wordmark_y + 65
    draw_spaced(draw, (center_x, tagline_y), "EXECUTIVE SEARCH & LEADERSHIP ADVISORY", TAGLINE, GOLD, 4, "ma")

    x = card_x + 86
    max_width = left_w - 170
    y = tagline_y + 110
    draw.line((x, y, x + 80, y), fill=GOLD, width=2)
    y += 54
    draw_spaced(draw, (x, y), "A PRIVATE COMMERCIAL NOTE", EYEBROW, GOLD, 3)
    y += 58
    draw.text((x, y), f"Hello {record['firstName']},", font=GREETING, fill=NAVY)
    y += 72

    y = paragraph(draw, str(record["intro"]), x, y, max_width)
    y = paragraph(draw, PRODUCT, x, y, max_width)
    y = paragraph(draw, "Within 72 hours of accepted intake, the $3,000 Sprint delivers:", x, y, max_width, gap=18)

    for bullet in BULLETS:
        draw.ellipse((x + 8, y + 12, x + 20, y + 24), fill=GOLD)
        bullet_lines = wrap_pixels(draw, bullet, BODY, max_width - 45)
        for line in bullet_lines:
            draw.text((x + 40, y), line, font=BODY, fill=INK)
            y += 46
        y += 10
    y += 18

    y = paragraph(draw, STATUS, x, y, max_width)
    y = paragraph(draw, str(record["recommendedUse"]), x, y, max_width)
    y = paragraph(draw, CLOSING, x, y, max_width, gap=36)

    button_w, button_h = 500, 74
    draw.rectangle((x, y, x + button_w, y + button_h), fill=NAVY)
    draw.rectangle((x + 3, y + 3, x + button_w - 3, y + button_h - 3), outline=(39, 66, 91), width=2)
    draw_spaced(draw, (x + button_w / 2, y + 26), "REVIEW THE SPRINT & PURCHASE", BUTTON, (247, 244, 236), 2.5, "ma")
    draw.text((x + button_w - 42, y + 22), "→", font=BUTTON, fill=GOLD)

    y += button_h + 55
    draw.line((x, y, x + max_width, y), fill=(205, 193, 174), width=2)
    y += 32
    draw.text((x, y), "With appreciation,", font=font("serif", 26), fill=(70, 73, 75))
    y += 28
    draw.text((x, y), "Henry Anderson", font=SIGNATURE, fill=GOLD)
    y += 92
    draw_spaced(draw, (x, y), "HENRY ANDERSON", TITLE, NAVY, 5)
    y += 34
    for title_line in ("MANAGING DIRECTOR - STRATEGY AND BUSINESS", "DEVELOPMENT"):
        draw_spaced(draw, (x, y), title_line, TITLE, GOLD, 2)
        y += 28
    draw.text((x, y + 6), "director@tanzeranderson.com", font=EMAIL, fill=(94, 92, 87))

    if y + 80 >= footer_y:
        raise SystemExit(f"Canvas overflow for {record['company']}: content bottom {y}, footer {footer_y}")

    side_x = right_x + 70
    side_y = right_y + arch_h + 112
    for phrase in ("COMMERCIAL.", "TALENT.", "SPRINT."):
        draw_spaced(draw, (side_x, side_y), phrase, SIDE, GOLD_LIGHT, 4)
        side_y += 62
    draw.line((side_x, side_y + 8, side_x + 100, side_y + 8), fill=GOLD, width=3)
    side_y += 155
    draw.text((side_x, side_y), "TA", font=SIDE_BIG, fill=(10, 45, 79))
    draw_spaced(draw, (side_x, footer_y - 120), f"WAVE {record['wave']} / {record['slug'].upper()[:18]}", font("sans_semibold", 11), (83, 109, 133), 2)

    footer_text_y = footer_y + 52
    draw_spaced(draw, (card_x + 58, footer_text_y), "TANZER ANDERSON", FOOTER_WORDMARK, NAVY, 7)
    draw_spaced(draw, (card_x + 58, footer_text_y + 44), "EXECUTIVE SEARCH & LEADERSHIP ADVISORY", FOOTER_SMALL, GOLD, 3)
    for index, value in enumerate(("director@tanzeranderson.com", "tanzeranderson.com")):
        draw.text((card_x + card_w - 58 - draw.textlength(value, font=EMAIL), footer_text_y + index * 34), value, font=EMAIL, fill=(91, 91, 88))
    draw.line((card_x + 58, footer_y + 162, card_x + card_w - 58, footer_y + 162), fill=(211, 201, 185), width=2)
    draw_spaced(draw, (card_x + card_w / 2, footer_y + 195), "PRIVATE & CONFIDENTIAL   |   © 2026 TANZER ANDERSON", COPYRIGHT, (143, 139, 130), 2, "ma")

    output.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(output, quality=82, optimize=True, progressive=True, subsampling=1)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--messages", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    payload = json.loads(Path(args.messages).read_text(encoding="utf-8"))
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    for record in payload["records"]:
        render_record(record, output_dir / f"{record['slug']}.jpg")


if __name__ == "__main__":
    main()
