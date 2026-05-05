# Production Floor — Claude session notes

This is a custom Frappe v15 app installed on a Frappe Cloud-hosted NestERP (rebranded ERPNext) site. Read this before touching anything in `production_floor/floor_ops/` — the gotchas below have already cost real time.

## Site & repo

- **Frappe Cloud site**: `https://blomoplastics.jh.frappe.cloud/desk` (dashboard at `/dashboard`)
- **GitHub**: `https://github.com/Syncflo-design/production_floor` (org: **Syncflo-design** — always use this for NestERP)
- **Local repo**: `C:/Users/User/production_floor/production_floor`
- **Helper scripts**: `C:\ClaudeCode\GitBash_Scripts/` (run from Git Bash on Windows)

## Deploy workflow

Frappe Cloud iteration cycle is **5–10 minutes per change**, so get it right per push. **All four steps matter — Deploy alone will silently rebuild against stale code.**

1. Commit + push to `Syncflo-design/production_floor` `main`.
2. Frappe Cloud → **Bench → Apps → Pull Updates** (also surfaces as "Update Available"). This is the step that fetches the new GitHub commit into the bench. **Skipping this is the #1 cause of "I pushed the fix but it's still broken."** Deploy does NOT pull on its own.
3. Frappe Cloud → **Bench → Deploy** → wait for green tick. Click into the deploy log and verify the commit hash shown matches your latest push — if it shows the previous commit, step 2 didn't run.
4. Frappe Cloud → **Site → Migrate** (only needed when fixtures, doctypes, or hooks change; for pure JS/HTML edits Migrate is optional but cheap).
5. Open `/desk/floor-ops` in **incognito** to bypass cache — Frappe caches bundled assets aggressively and a normal Ctrl+Shift+R is sometimes not enough.

Skip Migrate for JS-only changes. Never skip Pull Updates.

## ⚠️ Frappe page traps that will burn your day

### 1. Don't use `frappe.render_template('foo', {})` for desk page HTML

It will not auto-resolve a sibling `foo.html` file by name. The page will load and render blank. **Inline the HTML inside the page's `.js` file** as a string array joined with `\n`, then call `page.main.html(FLOOR_OPS_HTML)`. The pattern is in `production_floor/floor_ops/page/floor_ops/floor_ops.js`.

### 1a. The page's `.html` file is NOT dead code — it must stay safe

Frappe's build pipeline **auto-registers `floor_ops.html` as a JS template** by emitting a line like this at the top of the served page bundle:

```js
frappe.templates["floor_ops"] = '<contents of floor_ops.html, single-quoted>';
```

It does NOT escape apostrophes inside the HTML when wrapping it. So **any `'` character anywhere in `floor_ops.html` will close that wrapper string and produce a `SyntaxError` at page load** — even if your `.js` file is perfect. This burns hours because the error stack points at `<anonymous>` / `Object.eval (dom.js:30:3)` and looks like it's in your code, but it's actually in the auto-generated wrapper line at the very top of the bundle.

**Rule for `floor_ops.html`:** keep it minimal, with zero apostrophes. Current contents:

```html
<div id="floor-ops-placeholder"></div>
```

Don't restore the original styled HTML to it. The real HTML lives inside `FLOOR_OPS_HTML` in `floor_ops.js`. The `.html` file exists only because Frappe's page scaffold expects it.

### 2. Single quotes inside the inlined-HTML template literal will break parsing

Frappe's asset minifier collapses the multi-line backtick string onto one logical line and re-quotes it in a way that does **not** escape inner apostrophes. Result: `'Segoe UI'` or `onclick="floorOps.openAction('issue')"` inside a backtick template literal blows up at runtime as `SyntaxError: Unexpected identifier 'Segoe'` (or similar).

**Rules for the inlined HTML string:**
- Use **double quotes** for CSS values: `"Segoe UI"`, not `'Segoe UI'`.
- Use the **`&apos;`** HTML entity for any apostrophe that needs to be in an attribute or onclick handler: `onclick="foo(&apos;bar&apos;)"`. The browser decodes it back to a real `'` at HTML-parse time.
- Single quotes are still fine in the **JS code outside** the FLOOR_OPS_HTML constant — only the inlined HTML string is at risk.

Verify before pushing:

```bash
# Inside the FLOOR_OPS_HTML template literal, this should return nothing:
awk '/^const FLOOR_OPS_HTML = `/,/^`;/' floor_ops.js | grep -nE "'[^']+'"
```

### 3. Module naming

The app's Python package and its Frappe **module** are not the same thing.
- App / package name: `production_floor` (lowercase, in `apps.txt`, hooks `app_name`)
- Frappe module name: `Floor Ops` (in `modules.txt`, in each doctype/page JSON's `module` field)

Mixing these (e.g. setting page JSON `"module": "Production Floor"`) causes the page to fail to register cleanly. Both names need to stay distinct or Frappe gets confused.

### 4. Inline `onclick="..."` handlers need `window.floorOps`, not `const floorOps`

Frappe loads page JS via `new Function(code)`, which means the entire file runs in a **function scope**, not the global scope. So a top-level `const floorOps = {...}` is *not* a global — it's a local in that function.

Inline HTML attribute handlers like `onclick="floorOps.startScan()"` are evaluated by the browser in the **global scope**. They can't see function-local consts. Result: clicks silently fail (or throw `ReferenceError: floorOps is not defined`).

**Rule:** for any object whose methods are called from inline HTML attributes, attach it to `window`:

```js
window.floorOps = { startScan() { ... }, ... };
```

`const floorOps = {...}` followed by `window.floorOps = floorOps;` works too. Either form is fine — what's not fine is leaving it as a bare `const`.

### 5. Page roles

`floor_ops.json` requires one of: `Warehouse Operator`, `Manufacturing Manager`, `Manufacturing User`, `System Manager`. If a user can't see the page at all (404 / "not permitted"), that's the first thing to check.

## Repo structure (what lives where)

```
production_floor/                  ← repo root (this file lives here)
├── CLAUDE.md                      ← you are here
├── pyproject.toml
├── setup.py / requirements.txt / MANIFEST.in
└── production_floor/              ← Python package
    ├── hooks.py                   ← module: Floor Ops, fixtures: Workspace
    ├── modules.txt                ← "Floor Ops"
    ├── patches.txt
    └── floor_ops/                 ← Frappe module folder
        ├── page/floor_ops/
        │   ├── floor_ops.js       ← page controller + INLINED HTML (the live source)
        │   ├── floor_ops.html     ← DEAD — kept only because removing breaks nothing and history is clearer with it present
        │   └── floor_ops.json     ← page metadata; module="Floor Ops"
        └── workspace/production_floor.json
```

## Sandbox quirks (when running tools from Claude)

The Linux bash sandbox sees the repo at `/sessions/<id>/mnt/production_floor/production_floor` via a virtiofs/fuse mount. Useful to know:

- **`unlink()` is blocked** on this mount. `rm` and anything that deletes (including `git`'s lock files, packs, and ref updates) will fail with "Operation not permitted." Workaround: `truncate -s 0` to zero-out, or do the destructive step from Windows-side Git Bash instead.
- **Writes work fine.** File creation and content overwrites are OK.
- **`git status` works** (read-only); `git commit` / `git push` typically don't because git creates and tries to remove `.git/index.lock`.
- **Conclusion**: do file edits in the sandbox, do git operations from Windows Git Bash. There's a `finalize_inline.sh` template at `C:\ClaudeCode\GitBash_Scripts/` that demonstrates the pattern (cleans stale locks + surgery artifacts → adds → commits → pushes).

The Write tool also has an apparent **size cap around ~13 KB** — files larger than that get truncated mid-string. For large files: write in chunks via Write to `outputs/`, then assemble with `cat` from bash. Verify with `node --check` before committing.

## What's been built so far

- `floor_ops` page registered at `/desk/floor-ops`
- Three screens: landing (greeting + scan/select cards) → WO detail (header + materials + 3 action buttons) → action form (issue / produce / return)
- QR scan via `html5-qrcode` CDN; WO load via `frappe.client.get`
- Issue / Produce: builds Stock Entry from `make_stock_entry` template, applies overrides, inserts + submits
- Return: builds custom Stock Entry doc with Material Transfer purpose

## Common follow-on tasks (rough cost)

- Add a screen / button to existing `floor_ops` page: ~30 min once pattern is understood.
- New page following the same pattern: ~1 hour (copy `floor_ops/`, rename, adjust hooks, deploy once).
- New doctype + form view: ~30 min (declarative, no JS).
- Workflow + permissions: longer — multiple deploy cycles to validate.

## When the page renders blank, in order

1. Open DevTools → **Console** (uncheck "Pause on caught exceptions" — jQuery's `:has()` feature probe is not your bug). Look for red errors mentioning `floor_ops` or `FLOOR_OPS_HTML`.
2. **Network** tab → confirm `floor_ops.js` returns 200 with the expected size (~24 KB right now). If it's 404 or smaller, the deploy didn't pick up the latest commit.
3. Check Frappe Cloud's most recent Deploy log → confirm the commit hash matches `git log` head.
4. Open in **incognito** to rule out cache.
5. If user can't reach the page at all, check role assignment.
