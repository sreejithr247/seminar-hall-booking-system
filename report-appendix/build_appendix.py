#!/usr/bin/env python3
"""
Merge DB SQL, backend Go, and frontend sources into A4-oriented HTML and
optionally print to PDF via Chromium-based browsers (Edge/Chrome) headless.

Default: **curated** bundle (~20–25 A4 pages): most important code segments only
(schema core, auth, request/approval stack, key UI). Use --full for complete sources.

GitHub URL: environment variable REPORT_GITHUB_URL, else `git remote get-url origin`.
"""
from __future__ import annotations

import argparse
import html
import io
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "output"

# Curated excerpts for the project report (paths relative to repo root).
# Each entry: (relative_path, ranges | None).
#   ranges=None → whole file
#   ranges=[(start, end), ...] → 1-indexed inclusive line ranges; omitted spans become "// ..." / "-- ..."
#
# Target: ~20–25 pages covering schema, wiring, auth, booking-request flow, and key UI.

CURATED_DB_FILES: list[tuple[str, list[tuple[int, int]] | None]] = [
    ("DB/Tables.sql", None),  # full schema DDL
]

CURATED_BACKEND_FILES: list[tuple[str, list[tuple[int, int]] | None]] = [
    ("backend/main.go", None),
    ("backend/internal/config/config.go", None),
    ("backend/internal/database/database.go", None),
    ("backend/internal/router/router.go", None),
    ("backend/internal/middleware/auth.go", None),
    ("backend/internal/models/user.go", None),
    ("backend/internal/models/booking.go", [(1, 73)]),  # skip AvailabilitySlot
    ("backend/internal/handlers/auth_handler.go", [(1, 87)]),  # Login / Logout / GetMe
    ("backend/internal/services/auth_service.go", [(1, 63)]),  # Login + JWT
    ("backend/internal/handlers/request_handler.go", [(1, 85)]),  # CreateRequest
    ("backend/internal/services/request_service.go", [(1, 86)]),  # CreateRequest + overlap check
    ("backend/internal/repositories/request_repository.go", [(1, 40), (145, 153)]),  # Create + UpdateDeptStatus
    ("backend/internal/handlers/coordinator_handler.go", None),
    ("backend/internal/services/coordinator_service.go", [(1, 22), (40, 79)]),  # ReviewRequest
    # CheckOverlap (skip the one-line explanatory comment to avoid a near-empty last backend page)
    ("backend/internal/repositories/booking_repository.go", [(1, 18), (126, 138), (140, 145)]),
]

CURATED_FRONTEND_FILES: list[tuple[str, list[tuple[int, int]] | None]] = [
    ("frontend/lib/api.ts", None),
    ("frontend/lib/auth-context.tsx", None),
    ("frontend/lib/types.ts", [(1, 109)]),  # core domain types; skip report DTOs
    ("frontend/lib/services.ts", [(1, 30), (70, 84)]),  # authApi + requestsApi
    ("frontend/app/login/page.tsx", [(1, 45)]),  # auth submit logic
    ("frontend/app/requester/request-new/page.tsx", [(1, 55)]),  # form state + submit
    ("frontend/app/coordinator/pending/page.tsx", [(1, 50)]),  # pending list + approve/reject
    ("frontend/app/halls/[id]/calendar/page.tsx", [(1, 68)]),  # availability fetch + events
]


def css_a4(*, curated: bool) -> str:
    # Tighter type + smaller top/right/bottom margins save pages; left margin is ~2× typical bind side.
    # Extra bottom margin leaves room for page numbers stamped onto the PDF after print.
    body_pt = "7.5pt" if curated else "8.5pt"
    h1_pt = "10.5pt" if curated else "12pt"
    path_pt = "7.5pt" if curated else "8.5pt"
    # Slightly denser curated leading so short orphans (e.g. last 2 lines of a file) fit
    # on the previous page instead of sitting alone before a part page-break.
    line_h = "1.14" if curated else "1.24"
    if curated:
        margins = "9mm 8mm 12mm 30mm"  # top right bottom left
    else:
        margins = "12mm 10mm 14mm 36mm"
    return f"""
@page {{ size: A4; margin: {margins}; }}
* {{ box-sizing: border-box; }}
body {{
  font-family: "Cascadia Mono", "Consolas", "Courier New", monospace;
  font-size: {body_pt};
  line-height: {line_h};
  color: #111;
  max-width: 100%;
}}
h1 {{ font-size: {h1_pt}; margin: 0 0 0.3em; }}
.github-notice {{
  font-size: {body_pt};
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 0.4em 0.65em;
  margin-bottom: 0.7em;
  page-break-inside: avoid;
}}
.github-notice strong {{ font-weight: 600; }}
.meta {{ font-size: {body_pt}; color: #444; margin-bottom: 0.55em; }}
.file-block {{ margin-bottom: 0.45em; }}
.file-path {{
  font-weight: bold;
  font-size: {path_pt};
  margin: 0.4em 0 0.15em;
  padding-bottom: 0.1em;
  border-bottom: 1px solid #ccc;
  page-break-after: avoid;
}}
.part-heading {{
  font-size: {h1_pt};
  margin: 0.75em 0 0.25em;
  padding-bottom: 0.12em;
  border-bottom: 2px solid #888;
  page-break-before: always;
  page-break-after: avoid;
}}
.part-heading.part-first {{
  page-break-before: avoid;
  margin-top: 0;
}}
.part-meta {{
  font-size: {body_pt};
  color: #444;
  margin: 0 0 0.55em;
}}
pre {{
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  orphans: 3;
  widows: 3;
}}
"""


def get_github_url() -> str:
    env = os.environ.get("REPORT_GITHUB_URL", "").strip()
    if env:
        return env.rstrip("/")
    try:
        out = subprocess.run(
            ["git", "-C", str(ROOT), "remote", "get-url", "origin"],
            capture_output=True,
            text=True,
            check=True,
            timeout=5,
        )
        u = out.stdout.strip()
        if u.startswith("git@github.com:"):
            path = u.replace("git@github.com:", "").replace(".git", "")
            return f"https://github.com/{path}"
        if u.endswith(".git"):
            return u[:-4]
        return u
    except (subprocess.CalledProcessError, OSError, subprocess.TimeoutExpired):
        return "https://github.com/YOUR_USERNAME/seminar-hall-booking-system"


def github_notice_html(*, curated: bool) -> str:
    url = html.escape(get_github_url())
    scope = (
        "Included the most important code segments only (core schema, routing, JWT auth, "
        "request creation, department approval, overlap checks, and key UI logic). "
        "Omitted lines are marked with // ... or -- .... Full sources are on GitHub."
        if curated
        else "This PDF lists the full merged sources as configured."
    )
    return f"""  <div class="github-notice">
    <strong>Full source code</strong> — {scope}
    Repository: <a href="{url}">{url}</a>.
  </div>
"""


def wrap_document(
    title: str,
    subtitle: str,
    inner: str,
    *,
    curated: bool,
    include_github_notice: bool,
) -> str:
    notice = github_notice_html(curated=curated) if include_github_notice else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{html.escape(title)}</title>
  <style>{css_a4(curated=curated)}</style>
</head>
<body>
  <h1>{html.escape(title)}</h1>
  <p class="meta">{html.escape(subtitle)}</p>
{notice}{inner}
</body>
</html>
"""


def ellipsis_comment(relative: str) -> str:
    rel = relative.replace("\\", "/").lower()
    if rel.endswith(".sql"):
        return "-- ..."
    return "// ..."


def format_ranges_label(ranges: list[tuple[int, int]] | None) -> str:
    if ranges is None:
        return ""
    parts = [f"L{a}–{b}" if a != b else f"L{a}" for a, b in ranges]
    return " (excerpt: " + ", ".join(parts) + ")"


def extract_file_content(
    path: Path,
    relative: str,
    ranges: list[tuple[int, int]] | None,
) -> str:
    """Return whole file or joined line-range excerpts with ellipsis markers."""
    lines = read_utf8(path).splitlines()
    n = len(lines)
    if ranges is None:
        return ("\n".join(lines) + "\n") if lines else ""

    chunks: list[str] = []
    ell = ellipsis_comment(relative)
    for i, (start, end) in enumerate(ranges):
        if start < 1 or end < start or start > n:
            sys.stderr.write(f"Invalid range {start}-{end} for {relative} ({n} lines)\n")
            sys.exit(1)
        end_clamped = min(end, n)
        if i > 0 or start > 1:
            chunks.append(ell)
        chunks.append("\n".join(lines[start - 1 : end_clamped]))
        if i == len(ranges) - 1 and end_clamped < n:
            chunks.append(ell)
    return "\n".join(chunks) + "\n"


def file_section(relative: str, content: str, *, ranges: list[tuple[int, int]] | None = None) -> str:
    rel = relative.replace("\\", "/")
    label = html.escape(rel + format_ranges_label(ranges))
    body = html.escape(content, quote=False)
    return f'  <section class="file-block"><div class="file-path">{label}</div><pre>{body}</pre></section>\n'


def curated_sections(entries: list[tuple[str, list[tuple[int, int]] | None]]) -> str:
    parts: list[str] = []
    for rel, ranges in entries:
        p = ROOT / rel
        if not p.is_file():
            sys.stderr.write(f"Curated: missing {p}\n")
            sys.exit(1)
        content = extract_file_content(p, rel, ranges)
        parts.append(file_section(rel, content, ranges=ranges))
    return "\n".join(parts)


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def try_print_to_pdf(html_path: Path, pdf_path: Path) -> bool:
    """Print HTML to PDF via headless Chromium. Writes to a temp file then replaces the target."""
    html_uri = html_path.as_uri()
    candidates = []
    pf = os.environ.get("PROGRAMFILES", r"C:\Program Files")
    pfx86 = os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)")
    candidates.append(Path(pf) / "Microsoft" / "Edge" / "Application" / "msedge.exe")
    candidates.append(Path(pfx86) / "Microsoft" / "Edge" / "Application" / "msedge.exe")
    candidates.append(Path(pf) / "Google" / "Chrome" / "Application" / "chrome.exe")
    tmp = pdf_path.with_name(pdf_path.stem + ".__write__.pdf")
    for exe in candidates:
        if not exe.is_file():
            continue
        try:
            if tmp.is_file():
                tmp.unlink()
        except OSError:
            pass
        try:
            subprocess.run(
                [
                    str(exe),
                    "--headless=new",
                    "--disable-gpu",
                    "--no-pdf-header-footer",
                    f"--print-to-pdf={tmp.resolve()}",
                    html_uri,
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=600,
            )
            if not tmp.is_file() or tmp.stat().st_size == 0:
                continue
            try:
                os.replace(tmp, pdf_path)
            except OSError as e:
                sys.stderr.write(
                    f"Could not replace {pdf_path}: {e}\n"
                    f"Close any app that has this PDF open, then run again. "
                    f"New PDF is at: {tmp}\n"
                )
                return tmp.is_file() and tmp.stat().st_size > 0
            return True
        except (subprocess.CalledProcessError, OSError, subprocess.TimeoutExpired):
            try:
                if tmp.is_file():
                    tmp.unlink()
            except OSError:
                pass
            continue
    return False


def stamp_pdf_overlays(
    pdf_path: Path,
    *,
    page_start: int | None,
    curated: bool = True,
) -> None:
    """Overlay a thin page border and optional centred bottom page numbers.

    Left border sits just outside the code (near the wide bind margin);
    other sides stay near the physical page edge.
    """
    from pypdf import PdfReader, PdfWriter
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    reader = PdfReader(str(pdf_path))
    writer = PdfWriter()
    page_w, page_h = A4
    mm = 72.0 / 25.4
    # ~10mm from bottom edge, matches the extra bottom margin in css_a4.
    num_y = 28
    # Asymmetric frame: left hugs the code; top/right/bottom stay in the outer gutter.
    # Chromium content starts ~32–34mm left; keep ~4–5mm clearance so the rule
    # does not clip the first glyph (stroke width + anti-alias included).
    if curated:
        inset_top, inset_right, inset_bottom, inset_left = 7 * mm, 5 * mm, 8 * mm, 28 * mm
    else:
        inset_top, inset_right, inset_bottom, inset_left = 8 * mm, 6 * mm, 8 * mm, 34 * mm
    border_width = 0.75

    for i, page in enumerate(reader.pages):
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=A4)
        c.setStrokeColorRGB(0.13, 0.13, 0.13)
        c.setLineWidth(border_width)
        c.rect(
            inset_left,
            inset_bottom,
            page_w - inset_left - inset_right,
            page_h - inset_top - inset_bottom,
            stroke=1,
            fill=0,
        )
        if page_start is not None:
            c.setFillColorRGB(0.07, 0.07, 0.07)
            c.setFont("Courier", 9)
            # Centre within the framed content area (not the full page).
            c.drawCentredString((inset_left + page_w - inset_right) / 2, num_y, str(page_start + i))
        c.save()
        packet.seek(0)
        overlay = PdfReader(packet).pages[0]
        # Scale overlay to the printed page box (Chrome A4 is usually exact A4).
        pw = float(page.mediabox.width)
        ph = float(page.mediabox.height)
        if abs(pw - page_w) > 1 or abs(ph - page_h) > 1:
            overlay.scale_by(min(pw / page_w, ph / page_h))
        page.merge_page(overlay)
        writer.add_page(page)

    out_tmp = pdf_path.with_name(pdf_path.stem + ".__stamped__.pdf")
    try:
        with out_tmp.open("wb") as f:
            writer.write(f)
        os.replace(out_tmp, pdf_path)
    except OSError:
        if out_tmp.is_file():
            try:
                out_tmp.unlink()
            except OSError:
                pass
        raise


def stamp_page_numbers(pdf_path: Path, *, page_start: int) -> None:
    """Backward-compatible alias: border + page numbers."""
    stamp_pdf_overlays(pdf_path, page_start=page_start, curated=True)

def read_utf8(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def go_sort_key(p: Path) -> tuple:
    s = str(p.relative_to(ROOT / "backend")).replace("\\", "/")
    if s == "main.go":
        return (0, s)
    if s.startswith("cmd/"):
        return (1, s)
    return (2, s)


def database_inner(*, full: bool) -> str:
    if not full:
        return curated_sections(CURATED_DB_FILES)
    parts = []
    tables = ROOT / "DB" / "Tables.sql"
    seed = ROOT / "DB" / "SeedHalls.sql"
    if not tables.is_file():
        sys.stderr.write(f"Missing {tables}\n")
        sys.exit(1)
    parts.append(file_section("DB/Tables.sql", read_utf8(tables)))
    if seed.is_file():
        parts.append(file_section("DB/SeedHalls.sql", read_utf8(seed)))
    return "\n".join(parts)


def database_subtitle(*, full: bool) -> str:
    if not full:
        return "Seminar Hall Booking System — full Tables.sql DDL"
    seed = ROOT / "DB" / "SeedHalls.sql"
    if seed.is_file():
        return "Seminar Hall Booking System — Tables.sql and seed data"
    return "Seminar Hall Booking System — DDL only"


def build_database(*, full: bool) -> tuple[str, str]:
    inner = database_inner(full=full)
    subtitle = database_subtitle(full=full)
    doc = wrap_document(
        "Project Coding — Database schema (PostgreSQL)",
        subtitle,
        inner,
        curated=not full,
        include_github_notice=True,
    )
    return "01-database", doc


def backend_file_list(*, full: bool) -> list[Path]:
    if full:
        backend = ROOT / "backend"
        go_files = sorted(backend.rglob("*.go"), key=go_sort_key)
        if not go_files:
            sys.stderr.write("No .go files under backend/\n")
            sys.exit(1)
        return go_files
    files = []
    for rel, _ranges in CURATED_BACKEND_FILES:
        p = ROOT / rel
        if not p.is_file():
            sys.stderr.write(f"Curated backend: missing {p}\n")
            sys.exit(1)
        files.append(p)
    return files


def backend_inner(*, full: bool) -> str:
    if not full:
        return curated_sections(CURATED_BACKEND_FILES)
    files = backend_file_list(full=True)
    parts = [file_section(str(f.relative_to(ROOT)), read_utf8(f)) for f in files]
    return "\n".join(parts)


def backend_subtitle(*, full: bool) -> str:
    if not full:
        return "Seminar Hall Booking System — key Go segments (auth, requests, approval; full repo on GitHub)"
    return "Seminar Hall Booking System — all .go sources"


def build_backend(*, full: bool) -> tuple[str, str]:
    inner = backend_inner(full=full)
    sub = backend_subtitle(full=full)
    doc = wrap_document(
        "Project Coding — Backend source (Go)",
        sub,
        inner,
        curated=not full,
        include_github_notice=True,
    )
    return "02-backend", doc


def frontend_file_list(*, full: bool) -> list[Path]:
    fe = ROOT / "frontend"
    if full:
        exts = {".ts", ".tsx", ".js", ".mjs", ".cjs", ".css", ".json"}
        skip_dirs = {"node_modules", ".next", "dist", ".git"}
        files: list[Path] = []
        for dirpath, dirnames, filenames in os.walk(fe):
            dirnames[:] = [d for d in dirnames if d not in skip_dirs]
            for name in filenames:
                p = Path(dirpath) / name
                if p.suffix.lower() not in exts:
                    continue
                if p.name == "package-lock.json":
                    continue
                files.append(p)
        files.sort(key=lambda p: str(p.relative_to(fe)).replace("\\", "/"))
        return files
    files = []
    for rel, _ranges in CURATED_FRONTEND_FILES:
        p = ROOT / rel
        if not p.is_file():
            sys.stderr.write(f"Curated frontend: missing {p}\n")
            sys.exit(1)
        files.append(p)
    return files


def frontend_inner(*, full: bool) -> str:
    if not full:
        return curated_sections(CURATED_FRONTEND_FILES)
    files = frontend_file_list(full=True)
    if not files:
        sys.stderr.write("No frontend source files collected.\n")
        sys.exit(1)
    parts = [file_section(str(f.relative_to(ROOT)), read_utf8(f)) for f in files]
    return "\n".join(parts)


def frontend_subtitle(*, full: bool) -> str:
    if not full:
        return "Seminar Hall Booking System — key Next.js/TS segments (full repo on GitHub)"
    return "Seminar Hall Booking System — application sources (excludes node_modules, .next, package-lock)"


def build_frontend(*, full: bool) -> tuple[str, str]:
    inner = frontend_inner(full=full)
    sub = frontend_subtitle(full=full)
    doc = wrap_document(
        "Project Coding — Frontend source (Next.js / TypeScript)",
        sub,
        inner,
        curated=not full,
        include_github_notice=True,
    )
    return "03-frontend", doc


def build_combined(*, full: bool) -> tuple[str, str]:
    """Single document: database, then backend, then frontend."""
    curated = not full
    inner = f"""  <h2 class="part-heading part-first">Database schema (PostgreSQL)</h2>
  <p class="part-meta">{html.escape(database_subtitle(full=full))}</p>
{database_inner(full=full)}
  <h2 class="part-heading">Backend source (Go)</h2>
  <p class="part-meta">{html.escape(backend_subtitle(full=full))}</p>
{backend_inner(full=full)}
  <h2 class="part-heading">Frontend source (Next.js / TypeScript)</h2>
  <p class="part-meta">{html.escape(frontend_subtitle(full=full))}</p>
{frontend_inner(full=full)}
"""
    main_sub = (
        "Seminar Hall Booking System — important code segments (schema, backend, frontend; full repo on GitHub)"
        if not full
        else "Seminar Hall Booking System — database, backend, and frontend in one volume"
    )
    doc = wrap_document(
        "4.1 Project Coding — Database, backend, and frontend",
        main_sub,
        inner,
        curated=curated,
        include_github_notice=True,
    )
    return "00-combined", doc


def validate_outputs(expected_bases: list[str]) -> bool:
    """Check merged HTML/PDF exist, A4 CSS present, PDFs non-trivial size."""
    ok = True
    for base in expected_bases:
        html_path = OUT / f"{base}.html"
        pdf_path = OUT / f"{base}.pdf"
        if not html_path.is_file():
            print(f"Validation FAIL: missing {html_path}", file=sys.stderr)
            ok = False
            continue
        text = html_path.read_text(encoding="utf-8")
        if "@page" not in text or "A4" not in text:
            print(f"Validation FAIL: {html_path} missing A4 @page rule", file=sys.stderr)
            ok = False
        if "monospace" not in text:
            print(f"Validation FAIL: {html_path} missing monospace body style", file=sys.stderr)
            ok = False
        if not pdf_path.is_file():
            print(
                f"Validation WARN: {pdf_path} missing — open the HTML in a browser and Print to PDF.",
                file=sys.stderr,
            )
            ok = False
            continue
        if pdf_path.stat().st_size < 400:
            print(f"Validation FAIL: {pdf_path} too small", file=sys.stderr)
            ok = False
    return ok


def main() -> None:
    parser = argparse.ArgumentParser(description="Build A4 HTML/PDF Project Coding documents for the report.")
    parser.add_argument(
        "--full",
        action="store_true",
        help="Include all backend/frontend sources; include DB seed SQL. Default is curated (~20–25 pages).",
    )
    parser.add_argument(
        "--page-start",
        type=int,
        default=40,
        metavar="N",
        help="First PDF page number (centred bottom). Default: 40. Ignored with --no-page-numbers.",
    )
    parser.add_argument(
        "--no-page-numbers",
        action="store_true",
        help="Do not print page numbers in the PDF footer.",
    )
    args = parser.parse_args()
    full = args.full
    page_start: int | None = None if args.no_page_numbers else args.page_start
    if page_start is not None and page_start < 1:
        parser.error("--page-start must be >= 1 (or use --no-page-numbers)")

    OUT.mkdir(parents=True, exist_ok=True)
    mode = "full" if full else "curated"
    print(f"Mode: {mode}")
    if page_start is None:
        print("Page numbers: off")
    else:
        print(f"Page numbers: centred bottom, starting at {page_start}")

    builds = [
        build_combined(full=full),
        build_database(full=full),
        build_backend(full=full),
        build_frontend(full=full),
    ]
    bases = [b[0] for b in builds]
    pdf_ok = 0
    for base, document in builds:
        html_path = OUT / f"{base}.html"
        pdf_path = OUT / f"{base}.pdf"
        write_text(html_path, document)
        print(f"Wrote {html_path}")
        if try_print_to_pdf(html_path, pdf_path):
            try:
                stamp_pdf_overlays(pdf_path, page_start=page_start, curated=not full)
                if page_start is not None:
                    print(f"Wrote {pdf_path} (headless print, border, pages {page_start}+)")
                else:
                    print(f"Wrote {pdf_path} (headless print, border)")
            except Exception as e:
                print(f"Wrote {pdf_path} (headless print)")
                sys.stderr.write(f"Could not stamp border/page numbers on {pdf_path}: {e}\n")
                sys.stderr.write("Install deps: pip install -r report-appendix/requirements.txt\n")
            pdf_ok += 1
        else:
            print(
                f"Could not auto-generate {pdf_path}. Open {html_path} in a browser and use Print → Save as PDF (A4). Turn off headers and footers in the print dialog so no date or file path appears.",
                file=sys.stderr,
            )
    print(f"Done. PDFs generated automatically: {pdf_ok}/{len(builds)}.")
    combined_pdf = (OUT / "00-combined.pdf").resolve()
    print(f"Combined PDF path: {combined_pdf}")
    if validate_outputs(bases):
        print("Validation OK: A4 CSS, monospace, and PDF outputs present.")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
