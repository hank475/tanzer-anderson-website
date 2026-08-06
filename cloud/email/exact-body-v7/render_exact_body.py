from __future__ import annotations

import argparse
import base64
import html
import json
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

CANVAS_W = 1024
CANVAS_H = 1536
EMAIL_W = 680
EMAIL_H = 1020


def esc(value: object) -> str:
    return html.escape(str(value))


def required(record: dict, key: str) -> str:
    value = str(record.get(key, "")).strip()
    if not value:
        raise SystemExit(f"Missing required field: {key}")
    return value


def render_markup(record: dict, photo_data_uri: str) -> str:
    first = required(record, "first_name")
    role = required(record, "role")
    subtitle = required(record, "subtitle")
    intro = required(record, "intro")
    role_copy = required(record, "role_copy")
    cta = required(record, "cta")
    footer_note = str(record.get("footer_note", "One role.<br>Research before submission."))

    rings = record.get("rings")
    if not isinstance(rings, list) or len(rings) != 4:
        raise SystemExit("rings must contain exactly four four-field entries")
    cards = "".join(
        f'<div class="card"><div class="cardhead">{esc(item[0])}</div>'
        f'<div class="cardsub">{esc(item[1])}</div>'
        f'<div class="cardbody"><b>{esc(item[2])}</b><br>{esc(item[3])}</div></div>'
        for item in rings
    )

    funnel = record.get("funnel")
    if not isinstance(funnel, list) or len(funnel) != 5:
        raise SystemExit("funnel must contain exactly five values")
    labels = ["mapped", "direct", "aligned", "priority", "first contact"]
    pieces: list[str] = []
    for index, value in enumerate(funnel):
        pieces.append(
            f'<div class="metric"><b>{esc(value)}</b><span>{labels[index]}</span></div>'
        )
        if index < 4:
            pieces.append('<div class="arrow">→</div>')
    funnel_html = "".join(pieces)

    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{box-sizing:border-box}}html,body{{margin:0;width:{CANVAS_W}px;height:{CANVAS_H}px;overflow:hidden}}
body{{font-family:Arial,Helvetica,sans-serif;background:#e9e2d7;color:#17283a}}
.page{{position:relative;width:{CANVAS_W}px;height:{CANVAS_H}px;background:linear-gradient(120deg,#f8f4eb,#efe8db);overflow:hidden}}
.paper{{position:absolute;inset:0;background-image:radial-gradient(circle at 15% 10%,rgba(255,255,255,.8),transparent 28%),repeating-linear-gradient(0deg,rgba(122,105,76,.025) 0,rgba(122,105,76,.025) 1px,transparent 1px,transparent 4px)}}
.header{{position:absolute;left:0;right:0;top:0;height:176px;background:linear-gradient(135deg,#06182f,#0a203a);color:#fff;padding:42px 58px 28px 94px;box-shadow:0 10px 24px rgba(5,20,38,.23);z-index:3}}
.fold{{position:absolute;top:0;left:0;width:78px;height:198px;background:#f3eee4;clip-path:polygon(0 0,100% 0,48% 100%,0 86%);filter:drop-shadow(5px 4px 5px rgba(0,0,0,.2));z-index:4}}
.brandrow{{display:flex;align-items:center;gap:26px}}.crest{{width:76px;height:92px;border:2px solid #bd9148;border-radius:4px 4px 32px 32px;color:#bd9148;display:flex;align-items:center;justify-content:center;font:32px Georgia,serif;letter-spacing:2px}}
.brand{{font:38px/1.18 Georgia,'Times New Roman',serif;letter-spacing:10px}}.tag{{margin-top:11px;font-size:13px;letter-spacing:5px;color:#c59a55;font-weight:700}}
.emboss{{position:absolute;right:62px;top:55px;font:90px Georgia,serif;color:#08192f;text-shadow:1px 1px 0 #102842,-1px -1px 0 #030d1c}}
.content{{position:absolute;left:0;top:176px;width:714px;height:1188px;padding:34px 34px 24px 50px;z-index:2}}
.photo{{position:absolute;right:0;top:176px;width:310px;height:1188px;overflow:hidden;background:#dbe4ec;z-index:1}}
.photo img{{width:100%;height:100%;object-fit:cover;object-position:62% center;display:block}}
.greeting{{font:22px/30px Georgia,serif;margin:0 0 16px}}.intro{{font:22px/31px Georgia,serif;margin:0;color:#17283a;max-width:610px}}
.rule{{width:64px;border-top:2px solid #b38a48;margin:22px 0 13px}}
.proof{{text-align:center;color:#946c2c;font:30px Georgia,serif;letter-spacing:2px;margin-top:4px}}
.subtitle{{text-align:center;font:17px Arial,sans-serif;color:#071b33;margin-top:4px}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}}.card{{border:1px solid #d2c6b4;background:rgba(255,251,243,.95);min-height:132px;padding:0 13px 13px}}
.cardhead{{background:#071b33;color:#fff;margin:0 -13px 8px;padding:10px 11px;font-size:15px;line-height:19px;font-weight:800}}.cardsub{{font-size:14px;color:#956b2b;font-style:italic;margin-bottom:8px}}.cardbody{{font-size:15px;line-height:21px;color:#223244}}
.funnel{{display:flex;align-items:center;justify-content:space-between;border:1px solid #d2c6b4;background:#eee5d7;margin-top:14px;padding:12px 14px}}.metric{{text-align:center;min-width:77px}}.metric b{{font:27px Georgia,serif;display:block}}.metric span{{font-size:12px;display:block;margin-top:3px}}.arrow{{font-size:24px;color:#405268}}
.lower{{display:grid;grid-template-columns:1.05fr .95fr;gap:18px;margin-top:17px}}.diff h3,.role h3{{font-size:14px;color:#956b2b;letter-spacing:1.5px;margin:0 0 8px}}.diff ul{{margin:0;padding-left:20px;font-size:14px;line-height:22px}}.role{{font-size:14px;line-height:21px}}.role b{{font-size:15px}}
.boundary{{margin-top:14px;background:#071b33;color:#f5efe4;padding:14px 18px;font:17px/24px Georgia,serif;border-radius:2px}}
.sign{{margin-top:14px}}.warm{{font:18px Georgia,serif;color:#5f6263}}.sig{{font:52px/50px 'Z003','URW Chancery L',cursive;font-style:italic;color:#0a2b4b;transform:skewX(-7deg);transform-origin:left center;margin-top:-2px}}
.name{{font-size:14px;font-weight:800;margin-top:4px}}.title{{font-size:12px;font-weight:800;letter-spacing:.7px;margin-top:3px}}.contact{{font-size:13px;line-height:19px;margin-top:3px;color:#3b5269}}
.footer{{position:absolute;left:0;right:0;bottom:0;height:172px;background:linear-gradient(135deg,#06182f,#0a203a);z-index:4;padding:27px 72px;color:#fff}}
.ctarow{{display:flex;align-items:center;justify-content:space-between}}.button{{width:420px;height:70px;background:linear-gradient(#d9b878,#c99d51);border:1px solid #e1c58d;color:#0b2139;display:flex;align-items:center;justify-content:center;font:26px Georgia,serif;letter-spacing:.5px}}
.cal{{display:flex;gap:20px;align-items:center;font-size:20px;line-height:26px}}.icon{{width:58px;height:58px;border:3px solid #c59a55;border-radius:7px;color:#c59a55;display:flex;align-items:center;justify-content:center;font-size:31px}}
.footline{{text-align:center;margin-top:22px;font-size:13px;letter-spacing:6px;color:#c59a55;font-weight:700}}
</style></head><body><div class="page"><div class="paper"></div><div class="fold"></div>
<div class="header"><div class="brandrow"><div class="crest">TA</div><div><div class="brand">TANZER<br>ANDERSON</div><div class="tag">INSIGHT. STRATEGY. IMPACT.</div></div></div><div class="emboss">TA</div></div>
<div class="content"><p class="greeting">Dear {esc(first)},</p><p class="intro">{esc(intro)}</p><div class="rule"></div><div class="proof">PROOF OF CONCEPT</div><div class="subtitle">{esc(role)} — {esc(subtitle)}</div><div class="grid">{cards}</div><div class="funnel">{funnel_html}</div>
<div class="lower"><div class="diff"><h3>OUR DIFFERENTIATION</h3><ul><li>Direct + adjacent talent-market architecture</li><li>Evidence-backed strengths, gaps and source links</li><li>Operating-scale and environment fit</li><li>Targeted, low-noise approach strategy</li></ul></div><div class="role"><h3>THE ROLE WE WOULD MAP</h3><b>{esc(role)}</b><br>{esc(role_copy)}</div></div>
<div class="boundary">No résumé dump and no candidate submission outside your approved process. If the work is useful, we can discuss whether Tanzer Anderson belongs in the appropriate search-firm rotation.</div><div class="sign"><div class="warm">Warmly,</div><div class="sig">Henry Anderson</div><div class="name">Henry Anderson</div><div class="title">MANAGING DIRECTOR - STRATEGY AND BUSINESS DEVELOPMENT</div><div class="contact">Tanzer Anderson<br>director@tanzeranderson.com &nbsp; | &nbsp; tanzeranderson.com</div></div></div>
<div class="photo"><img src="{photo_data_uri}"></div><div class="footer"><div class="ctarow"><div class="button">{esc(cta)} &nbsp; →</div><div class="cal"><div class="icon">✉</div><div>{footer_note}</div></div></div><div class="footline">INSIGHT. STRATEGY. IMPACT.</div></div></div></body></html>'''


def build_email_html(jpeg_path: Path, first_name: str, subject: str) -> str:
    image_data = base64.b64encode(jpeg_path.read_bytes()).decode("ascii")
    safe_subject = subject.replace(" ", "%20")
    return (
        '<!doctype html><html><body style="margin:0;padding:0;background:#e9e2d7;">'
        f'<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Dear {esc(first_name)}, a Tanzer Anderson proof-of-concept talent map.</div>'
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#e9e2d7;"><tr><td align="center" style="padding:12px 4px;">'
        f'<a href="mailto:director@tanzeranderson.com?subject={safe_subject}" style="text-decoration:none;border:0;">'
        f'<img src="data:image/jpeg;base64,{image_data}" width="680" height="1020" alt="Tanzer Anderson proof-of-concept correspondence for {esc(first_name)}" style="display:block;width:680px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">'
        '</a></td></tr></table></body></html>'
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--record", required=True)
    parser.add_argument("--photo", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--chromium", default="/usr/bin/chromium")
    args = parser.parse_args()

    record_path = Path(args.record)
    photo_path = Path(args.photo)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    record = json.loads(record_path.read_text(encoding="utf-8"))
    slug = required(record, "slug")
    photo_data_uri = "data:image/jpeg;base64," + base64.b64encode(photo_path.read_bytes()).decode("ascii")
    markup = render_markup(record, photo_data_uri)

    full_png = output_dir / f"{slug}-full.png"
    final_jpeg = output_dir / f"{slug}.jpg"
    final_html = output_dir / f"{slug}-email.html"

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=args.chromium,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        page = browser.new_page(viewport={"width": CANVAS_W, "height": CANVAS_H})
        page.set_content(markup, wait_until="load")
        page.screenshot(path=str(full_png), full_page=False)
        browser.close()

    image = Image.open(full_png).convert("RGB").resize((EMAIL_W, EMAIL_H), Image.Resampling.LANCZOS)
    image.save(final_jpeg, quality=55, optimize=True, progressive=True, subsampling=2)

    email_markup = build_email_html(final_jpeg, required(record, "first_name"), required(record, "subject"))
    final_html.write_text(email_markup, encoding="utf-8")

    receipt = {
        "policy": "TA_EXACT_BODY_V7",
        "slug": slug,
        "jpeg_bytes": final_jpeg.stat().st_size,
        "html_bytes": final_html.stat().st_size,
        "attachment": False,
        "cid_dependency": False,
        "full_height_glass_panel": True,
        "external_send": False,
        "qa_pass": final_html.stat().st_size < 97280,
    }
    (output_dir / f"{slug}-receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    if not receipt["qa_pass"]:
        raise SystemExit(f"HTML exceeds V7 limit: {receipt['html_bytes']} bytes")
    print(json.dumps(receipt, indent=2))


if __name__ == "__main__":
    main()
