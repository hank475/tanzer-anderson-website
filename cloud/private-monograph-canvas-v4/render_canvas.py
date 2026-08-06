from __future__ import annotations

import argparse
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1280, 2900
OUTER = (231, 225, 215)
PAPER = (247, 243, 234)
NAVY = (5, 24, 47)
INK = (39, 49, 61)
GOLD = (178, 138, 74)
GOLD_LIGHT = (216, 193, 150)
BLUE = (203, 221, 236)
WHITE = (252, 250, 245)

FONT_PATHS = {
    "serif": "/usr/share/fonts/truetype/ebgaramond/EBGaramond12-Regular.ttf",
    "serif_bold": "/usr/share/fonts/truetype/ebgaramond/EBGaramond12-Bold.ttf",
    "sans": "/usr/share/fonts/opentype/inter/Inter-Regular.otf",
    "sans_semibold": "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf",
    "script": "/usr/share/fonts/opentype/urw-base35/Z003-MediumItalic.otf",
}


def font(key: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_PATHS[key]
    if not os.path.exists(path):
        raise SystemExit(f"Required font missing: {path}")
    return ImageFont.truetype(path, size)


FONTS = {
    "meta": font("serif", 18),
    "crest": font("serif", 42),
    "wordmark": font("serif", 46),
    "tagline": font("sans_semibold", 14),
    "eyebrow": font("sans_semibold", 15),
    "greeting": font("serif_bold", 34),
    "body": font("sans", 28),
    "callout_title": font("sans_semibold", 15),
    "callout": font("sans", 24),
    "button": font("sans_semibold", 16),
    "signature": font("script", 76),
    "title": font("sans_semibold", 14),
    "email": font("sans", 20),
    "side_kicker": font("sans_semibold", 17),
    "side_big": font("serif", 80),
    "footer_wordmark": font("serif", 24),
    "footer_small": font("sans_semibold", 11),
    "copyright": font("sans", 11),
}


def paper_texture(size: tuple[int, int], base: tuple[int, int, int], seed: int, strength: float) -> Image.Image:
    width, height = size
    rng = np.random.default_rng(seed)
    arr = np.zeros((height, width, 3), dtype=np.float32)
    arr[:] = base
    arr += rng.normal(0, 2.8, (height, width, 1))

    cloud_source = rng.normal(0, 1, (max(2, height // 80), max(2, width // 80))).astype(np.float32)
    cloud_source = (cloud_source - cloud_source.min()) / (np.ptp(cloud_source) + 1e-6) * 255
    cloud = Image.fromarray(np.uint8(np.clip(cloud_source, 0, 255)))
    cloud = cloud.resize((width, height), Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(12))
    arr += (np.asarray(cloud).astype(np.float32) - 127.5)[..., None] / 38
    arr = np.clip(arr, 0, 255).astype(np.uint8)

    image = Image.fromarray(arr, "RGB")
    draw = ImageDraw.Draw(image, "RGBA")
    for _ in range(int((width + height) * 0.45 * strength)):
        x = int(rng.integers(0, width))
        y = int(rng.integers(0, height))
        length = int(rng.integers(8, 45))
        draw.line(
            (x, y, min(width, x + length), max(0, min(height - 1, y + int(rng.integers(-1, 2))))),
            fill=(145, 126, 100, int(rng.integers(3, 12))),
            width=1,
        )
    return image.filter(ImageFilter.GaussianBlur(0.12))


def add_noise(image: Image.Image, amount: float, opacity: float, seed: int) -> Image.Image:
    rng = np.random.default_rng(seed)
    arr = np.asarray(image).astype(np.int16)
    noise = rng.normal(0, amount, arr.shape[:2] + (1,))
    noisy = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.blend(image, Image.fromarray(noisy, "RGB"), opacity)


def draw_spaced(draw: ImageDraw.ImageDraw, xy: tuple[float, float], text: str, used_font: ImageFont.FreeTypeFont, fill: tuple[int, int, int], spacing: float, anchor: str = "la") -> None:
    x, y = xy
    widths = [draw.textlength(character, font=used_font) for character in text]
    total = sum(widths) + spacing * (len(text) - 1)
    if anchor.startswith("m"):
        x -= total / 2
    elif anchor.startswith("r"):
        x -= total
    for character, character_width in zip(text, widths):
        draw.text((x, y), character, font=used_font, fill=fill)
        x += character_width + spacing


def wrap_pixels(draw: ImageDraw.ImageDraw, text: str, used_font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else current + " " + word
        if draw.textlength(candidate, font=used_font) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def paragraph(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, max_width: int) -> int:
    line_height = 49
    for line in wrap_pixels(draw, text, FONTS["body"], max_width):
        draw.text((x, y), line, font=FONTS["body"], fill=INK)
        y += line_height
    return y + 32


def render(output: Path) -> None:
    image = paper_texture((W, H), OUTER, 21, 0.55).convert("RGBA")
    card_x, card_y = 76, 52
    card_w, card_h = 1128, 2770
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

    image.paste(paper_texture((left_w, card_h - meta_h - footer_h), PAPER, 8, 1.2), (card_x, content_top))
    image.paste(paper_texture((card_w, meta_h), (249, 246, 240), 4, 0.6), (card_x, card_y))
    image.paste(paper_texture((card_w, footer_h), (244, 239, 230), 5, 0.8), (card_x, footer_y))

    right_panel = add_noise(Image.new("RGB", (right_w, card_h - meta_h - footer_h), NAVY), 8, 0.28, 11)
    panel_arr = np.asarray(right_panel).astype(np.float32)
    panel_arr = np.clip(panel_arr * np.linspace(1.08, 0.88, panel_arr.shape[0])[:, None, None], 0, 255).astype(np.uint8)
    image.paste(Image.fromarray(panel_arr), (card_x + left_w, content_top))

    draw = ImageDraw.Draw(image)
    draw.rectangle((card_x, card_y, card_x + card_w, card_y + card_h), outline=(205, 194, 176), width=2)
    draw.line((card_x, content_top, card_x + card_w, content_top), fill=GOLD, width=2)
    draw.line((card_x, footer_y, card_x + card_w, footer_y), fill=GOLD, width=2)
    draw.line((card_x + left_w, content_top, card_x + left_w, footer_y), fill=(20, 38, 58), width=2)

    draw.text((card_x + 52, card_y + 32), "Private & Confidential", font=FONTS["meta"], fill=(86, 82, 75))
    meta_right = "Exact-render correspondence"
    draw.text((card_x + card_w - 52 - draw.textlength(meta_right, font=FONTS["meta"]), card_y + 32), meta_right, font=FONTS["meta"], fill=(86, 82, 75))

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
    draw.arc((crest[0] + 5, crest[1] + 5, crest[2] - 5, crest[3] - 5), 180, 360, fill=(255, 255, 255), width=2)
    draw.text((center_x, crest_y + 48), "TA", font=FONTS["crest"], fill=GOLD, anchor="ma")

    wordmark_y = crest_y + 186
    draw_spaced(draw, (center_x, wordmark_y), "TANZER ANDERSON", FONTS["wordmark"], NAVY, 10, "ma")
    tagline_y = wordmark_y + 65
    draw_spaced(draw, (center_x, tagline_y), "EXECUTIVE SEARCH & LEADERSHIP ADVISORY", FONTS["tagline"], GOLD, 4, "ma")

    x = card_x + 86
    max_width = left_w - 170
    y = tagline_y + 110
    draw.line((x, y, x + 80, y), fill=GOLD, width=2)
    y += 54
    draw_spaced(draw, (x, y), "PRIVATE MONOGRAPH CANVAS v4.0", FONTS["eyebrow"], GOLD, 3)
    y += 58
    draw.text((x, y), "Hello Henry,", font=FONTS["greeting"], fill=NAVY)
    y += 70

    for text in (
        "Your earlier tests confirmed that ordinary HTML can carry the Tanzer Anderson structure, but the final rendering was still being negotiated by Gmail and Outlook.",
        "This version removes that compromise. The correspondence is pre-rendered as a high-resolution monograph canvas before it enters the email client, preserving the tactile paper grain, architectural field, exact spacing, typography, and gold cursive signature as finished artwork.",
        "The delivery shell remains lightweight and dependable. It carries a complete plain-text alternative, the live Commercial Talent Sprint pathway, and the audit controls required for release—while the visual presentation can no longer be downgraded by a mail client.",
    ):
        y = paragraph(draw, text, x, y, max_width)

    callout_y = y + 2
    callout_h = 440
    draw.rounded_rectangle((x, callout_y, x + max_width, callout_y + callout_h), radius=4, fill=(238, 231, 219), outline=(201, 184, 154), width=2)
    draw_spaced(draw, (x + 34, callout_y + 30), "EXACT-RENDER STANDARD", FONTS["callout_title"], GOLD, 3)
    item_y = callout_y + 78
    for item in (
        "Visible linen and paper grain—not a flat cream fill",
        "Fixed architectural composition and true navy depth",
        "Approved gold handwritten signature as an image asset",
        "Pixel-locked spacing across Gmail, Outlook, and mobile",
    ):
        draw.ellipse((x + 36, item_y + 8, x + 48, item_y + 20), fill=GOLD)
        for line in wrap_pixels(draw, item, FONTS["callout"], max_width - 90):
            draw.text((x + 68, item_y), line, font=FONTS["callout"], fill=(62, 70, 78))
            item_y += 36
        item_y += 14

    y = callout_y + callout_h + 46
    button_w, button_h = 500, 74
    draw.rectangle((x, y, x + button_w, y + button_h), fill=NAVY)
    draw.rectangle((x + 3, y + 3, x + button_w - 3, y + button_h - 3), outline=(39, 66, 91), width=2)
    draw_spaced(draw, (x + button_w / 2, y + 26), "REVIEW THE COMMERCIAL TALENT SPRINT", FONTS["button"], (247, 244, 236), 2.5, "ma")
    draw.text((x + button_w - 42, y + 22), "→", font=FONTS["button"], fill=GOLD)

    y += button_h + 55
    draw.line((x, y, x + max_width, y), fill=(205, 193, 174), width=2)
    y += 32
    draw.text((x, y), "With appreciation,", font=font("serif", 26), fill=(70, 73, 75))
    y += 28
    draw.text((x, y), "Henry Anderson", font=FONTS["signature"], fill=GOLD)
    y += 92
    draw_spaced(draw, (x, y), "HENRY ANDERSON", FONTS["title"], NAVY, 5)
    y += 34
    for title_line in ("MANAGING DIRECTOR - STRATEGY AND BUSINESS", "DEVELOPMENT"):
        draw_spaced(draw, (x, y), title_line, FONTS["title"], GOLD, 2)
        y += 28
    draw.text((x, y + 6), "director@tanzeranderson.com", font=FONTS["email"], fill=(94, 92, 87))

    side_x = right_x + 70
    side_y = right_y + arch_h + 112
    for phrase in ("PRIVATE.", "PRECISE.", "PREPARED."):
        draw_spaced(draw, (side_x, side_y), phrase, FONTS["side_kicker"], GOLD_LIGHT, 5)
        side_y += 62
    draw.line((side_x, side_y + 8, side_x + 100, side_y + 8), fill=GOLD, width=3)
    side_y += 155
    draw.text((side_x, side_y), "TA", font=FONTS["side_big"], fill=(10, 45, 79))
    draw_spaced(draw, (side_x, footer_y - 120), "CANVAS 04 / EXACT RENDER", font("sans_semibold", 11), (83, 109, 133), 2)

    footer_text_y = footer_y + 52
    draw_spaced(draw, (card_x + 58, footer_text_y), "TANZER ANDERSON", FONTS["footer_wordmark"], NAVY, 7)
    draw_spaced(draw, (card_x + 58, footer_text_y + 44), "EXECUTIVE SEARCH & LEADERSHIP ADVISORY", FONTS["footer_small"], GOLD, 3)
    for index, value in enumerate(("director@tanzeranderson.com", "tanzeranderson.com")):
        draw.text((card_x + card_w - 58 - draw.textlength(value, font=FONTS["email"]), footer_text_y + index * 34), value, font=FONTS["email"], fill=(91, 91, 88))
    draw.line((card_x + 58, footer_y + 162, card_x + card_w - 58, footer_y + 162), fill=(211, 201, 185), width=2)
    draw_spaced(draw, (card_x + card_w / 2, footer_y + 195), "PRIVATE & CONFIDENTIAL   |   © 2026 TANZER ANDERSON", FONTS["copyright"], (143, 139, 130), 2, "ma")

    output.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(output, quality=82, optimize=True, progressive=True, subsampling=1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    render(Path(args.output))
