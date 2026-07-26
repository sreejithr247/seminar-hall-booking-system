# Report output — Project Coding (A4)

Generates merged **HTML** and **PDF** documents titled **Project Coding** (not “Appendix”) for the database schema, backend (Go), and frontend (Next.js).

## Default: curated (shorter report)

```bash
python build_appendix.py
```

- **Database:** `DB/Tables.sql` only (no seed file).
- **Backend:** representative Go files (routing, config, DB, middleware, models, auth/request/hall/coordinator stacks). Admin/management and `cmd/*` are omitted; see GitHub for the rest.
- **Frontend:** representative pages and `lib/*`, configs; omits duplicate admin screens, landing `page.tsx`, `utils.ts`, and large lockfiles.
- **Layout:** A4 with a **wider left margin** (bind side) and tighter top/right/bottom; smaller type in curated mode to save pages.
- **PDF:** headless Edge/Chrome uses **`--no-pdf-header-footer`** so there is **no date/time header or file-name footer** in generated PDFs.
- **Page numbers:** stamped centred at the bottom after PDF generation, starting at **40** by default (`--page-start N`, or `--no-page-numbers`). Requires `pip install -r report-appendix/requirements.txt`.
- Each document starts with a **GitHub notice** (URL from `git remote origin` or **`REPORT_GITHUB_URL`**).

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

Edit **`CURATED_BACKEND_FILES`** and **`CURATED_FRONTEND_FILES`** at the top of `build_appendix.py` to change the curated file lists.
