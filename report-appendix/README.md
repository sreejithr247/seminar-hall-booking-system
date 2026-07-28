# Report output — Project Coding (A4)

Generates merged **HTML** and **PDF** documents titled **Project Coding** (not “Appendix”) for the database schema, backend (Go), and frontend (Next.js).

## Default: curated (~20–25 pages)

```bash
python build_appendix.py
```

Includes **only the most important code segments** for the project report (omitted spans marked `// ...` or `-- ...`):

- **Database:** full `DB/Tables.sql` (no separate seed file).
- **Backend:** entry/config/DB, router, JWT middleware, core models, auth login, request create stack, coordinator review, overlap check.
- **Frontend:** API client, auth context, domain types, auth/requests API helpers, login/request/approval/calendar logic excerpts.
- **Layout:** A4 with a **wider left margin** (bind side) and compact type to fit report length.
- **PDF:** headless Edge/Chrome uses **`--no-pdf-header-footer`** so there is **no date/time header or file-name footer**.
- **Page numbers:** stamped centred at the bottom after PDF generation, starting at **40** by default (`--page-start N`, or `--no-page-numbers`). Requires `pip install -r report-appendix/requirements.txt`.
- **Page border:** a thin rectangular frame is stamped on every PDF page; the **left** edge sits just outside the code (bind margin stays outside the frame).
- Each document starts with a **GitHub notice** (URL from `git remote origin` or **`REPORT_GITHUB_URL`**).

Edit **`CURATED_DB_FILES`**, **`CURATED_BACKEND_FILES`**, and **`CURATED_FRONTEND_FILES`** at the top of `build_appendix.py` to change which files/line ranges are included. Use `None` for a whole file, or `[(start, end), ...]` for 1-indexed excerpts.

## Full dump (longer)

```bash
python build_appendix.py --full
```

- **Database:** `Tables.sql` + `SeedHalls.sql` (if present).
- **Backend:** every `backend/**/*.go`.
- **Frontend:** all app sources (`*.ts`, `*.tsx`, etc.), excluding `node_modules`, `.next`, and `package-lock.json`.

## Output

Under `output/`:

- **`00-combined.html` / `00-combined.pdf`** — single document with **database, then backend, then frontend** (same content as the three parts below).
- `01-database.html` / `01-database.pdf`
- `02-backend.html` / `02-backend.pdf`
- `03-frontend.html` / `03-frontend.pdf`

If headless PDF fails, open the `.html` in a browser, **Print → Save as PDF**, choose A4, and **disable headers and footers** in the print dialog.

## Customize the GitHub link

```bash
export REPORT_GITHUB_URL=https://github.com/you/your-repo
python build_appendix.py
```
