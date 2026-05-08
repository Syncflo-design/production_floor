# Production Floor — Claude session notes

> **STOP. READ THIS FIRST. DO NOT SKIP.**
>
> If you are an AI assistant of any kind (Sonnet, Opus, Haiku, future models, any vendor) working on this repo, the rules in this file are not optional. Each one is here because skipping it has already cost the user 4+ hours of debugging. Do not make assumptions about Frappe page conventions — read this file fully before touching any `.js`, `.html`, or `.json` in `production_floor/floor_ops/`.
>
> **The five non-negotiable rules:**
>
> 1. HTML for the page goes in `floor_ops.js` as a string array joined with `\n`. Not a backtick template literal. Backticks get mangled by Frappe's bundler.
> 2. `floor_ops.html` is **not** dead code. Frappe auto-registers its contents as `frappe.templates["floor_ops"] = '...';` in single quotes. Any apostrophe inside the file breaks page parsing. Keep it as `<div id="floor-ops-placeholder"></div>` — do not put real markup back in it.
> 3. The controller object must be `window.floorOps = {...}`, not `const floorOps = {...}`. Page bundles run in function scope; consts are not globals; inline `onclick` handlers can't see them.
> 4. Deploy cycle: push → Frappe Cloud Bench → **Pull Updates** (do NOT skip) → Deploy → incognito reload. Always include and bump a `BUILD_MARKER` constant in `floor_ops.js` so deploys are verifiable.
> 5. When something works after a non-trivial debug, **append the lesson to this file** before ending the session. This file is the project's only memory.
>
> Acknowledge you've read this section by referencing one of these five rules in your first response when you start working in this repo.

This is a custom Frappe v16 app installed on a Frappe Cloud-hosted NestERP (rebranded ERPNext) site. The full context, structure, and detailed gotchas follow below.

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

## Git Bash scripts for new Frappe apps — lessons learned the hard way

When generating a Git Bash script to initialise and push a **new** Frappe app repo, the following mistakes have already cost time. Do not repeat them.

### 1. The sandbox cannot run git — always hand the script to the user

The Claude sandbox mount blocks `unlink()`, so `git init`, `git commit`, and `git push` all fail with "Operation not permitted" (git creates and tries to delete `.git/index.lock`, `.git/config.lock`, etc.). **All git operations must be done from Windows Git Bash.** Never try to init or commit from the sandbox.

### 2. Never assume the branch name

Git Bash on Windows still defaults to `master` on `git init`. GitHub repos created via the web UI default to `main`. These will be different unless you force it. Always include `git branch -M main` in the script **before** the first push, and always use `--force` or `--force-with-lease` on the first push to a repo that may already have commits from a web-based init.

Full safe first-push sequence:
```bash
cd /c/Users/User/<app_folder>
rm -f .git/config.lock          # always include — sandbox leaves stale locks
git branch -M main
git add .
git commit -m "Initial commit"
git push --force -u origin main
```

### 3. `pyproject.toml` with `readme = "README.md"` requires the file to exist

`flit_core` will fail the build with `ConfigError: Description file README.md does not exist` if `pyproject.toml` references a readme that isn't in the repo. Two safe options:
- **Option A (preferred):** omit the `readme` line from `[project]` entirely.
- **Option B:** include a minimal `README.md` in the repo root.

The `pyproject.toml` template in `wo_wip` uses Option A. Always use Option A for new apps unless the user specifically wants a README rendered on PyPI/GitHub.

### 4. `.git/config` written by the sandbox is null-byte corrupted

When the sandbox writes a `.git/config` via `git config ...` commands (instead of direct file write), the resulting file is filled with null bytes and git refuses to read it (`fatal: bad config line 1`). The fix is to write the config file directly with `cat > .git/config << 'EOF' ... EOF` from the sandbox, **not** via `git config` commands. But even then, the config.lock left behind can only be deleted from Windows (`rm -f .git/config.lock` in Git Bash).

### 5. Don't path the user to a folder that doesn't exist yet

If the app zip is being delivered to `production_floor/wo_wip.zip`, the extracted folder will be `production_floor/wo_wip/` — not `~/wo_wip/`. Always verify the extraction path before writing the `cd` line in the script.

---

## When the page renders blank, in order

1. Open DevTools → **Console** (uncheck "Pause on caught exceptions" — jQuery's `:has()` feature probe is not your bug). Look for red errors mentioning `floor_ops` or `FLOOR_OPS_HTML`.
2. **Network** tab → confirm `floor_ops.js` returns 200 with the expected size (~24 KB right now). If it's 404 or smaller, the deploy didn't pick up the latest commit.
3. Check Frappe Cloud's most recent Deploy log → confirm the commit hash matches `git log` head.
4. Open in **incognito** to rule out cache.
5. If user can't reach the page at all, check role assignment.
