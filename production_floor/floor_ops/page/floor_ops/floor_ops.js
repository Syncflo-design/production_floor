// Production Floor — Frappe Page Controller (HTML inlined)
// Runs inside NestERP: uses frappe.call(), frappe.session, frappe.show_alert()
// HTML is embedded directly to avoid frappe.render_template lookup issues.
// Build marker — search the served file for this string to verify deploy:
const BUILD_MARKER = "build-2026-05-05-B";

const FLOOR_OPS_HTML = [
  '<div id="floor-ops-root">',
  '',
  '  <style>',
  '    #floor-ops-root {',
  '      --navy:  #1F4E79;',
  '      --blue:  #2E75B6;',
  '      --lite:  #D5E8F0;',
  '      --green: #1D6B2E;',
  '      --gbg:   #E8F5EB;',
  '      --amber: #7B4F00;',
  '      --abg:   #FFF3CD;',
  '      --red:   #8B0000;',
  '      --rbg:   #FFE0E0;',
  '      --grey:  #F5F5F5;',
  '      --radius: 12px;',
  '      --shadow: 0 2px 12px rgba(0,0,0,0.08);',
  '      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
  '    }',
  '',
  '    .fo-screen { display: none; padding: 20px 16px; max-width: 540px; margin: 0 auto; }',
  '    .fo-screen.active { display: block; }',
  '',
  '    .fo-greeting {',
  '      background: var(--navy); color: #fff;',
  '      border-radius: var(--radius); padding: 20px 24px;',
  '      margin-bottom: 20px; box-shadow: var(--shadow);',
  '    }',
  '    .fo-greeting h2 { font-size: 20px; margin-bottom: 2px; }',
  '    .fo-greeting p  { font-size: 13px; opacity: 0.75; }',
  '',
  '    .fo-card {',
  '      background: #fff; border-radius: var(--radius);',
  '      padding: 18px 20px; margin-bottom: 14px;',
  '      box-shadow: var(--shadow);',
  '      border: 2px solid transparent;',
  '      cursor: pointer; display: flex; align-items: center; gap: 16px;',
  '      transition: border-color 0.15s, transform 0.1s;',
  '    }',
  '    .fo-card:hover { border-color: var(--blue); transform: translateY(-1px); }',
  '    .fo-card .fo-icon {',
  '      font-size: 32px; width: 52px; height: 52px;',
  '      background: var(--lite); border-radius: 10px;',
  '      display: flex; align-items: center; justify-content: center; flex-shrink: 0;',
  '    }',
  '    .fo-card h3 { font-size: 16px; color: var(--navy); margin-bottom: 2px; }',
  '    .fo-card p  { font-size: 13px; color: #666; }',
  '',
  '    #fo-select-wrap {',
  '      background: #fff; border-radius: var(--radius);',
  '      padding: 18px 20px; box-shadow: var(--shadow);',
  '      margin-bottom: 14px; display: none;',
  '    }',
  '    #fo-select-wrap label { font-weight: 600; font-size: 14px; display: block; margin-bottom: 8px; }',
  '    #fo-wo-dropdown {',
  '      width: 100%; padding: 12px; font-size: 15px;',
  '      border: 2px solid #ddd; border-radius: 8px; color: #1a1a1a;',
  '      background: #fff;',
  '    }',
  '    #fo-wo-dropdown:focus { outline: none; border-color: var(--blue); }',
  '    #fo-go-btn {',
  '      width: 100%; margin-top: 12px; padding: 14px;',
  '      background: var(--navy); color: #fff;',
  '      border: none; border-radius: 8px;',
  '      font-size: 16px; font-weight: 700; cursor: pointer;',
  '    }',
  '    #fo-go-btn:hover { background: var(--blue); }',
  '',
  '    #fo-scanner-wrap {',
  '      background: #000; border-radius: var(--radius);',
  '      overflow: hidden; margin-bottom: 14px; display: none;',
  '    }',
  '    #fo-qr-reader { width: 100%; }',
  '    #fo-scan-status { text-align: center; padding: 10px; color: #ccc; font-size: 13px; background: #111; }',
  '    #fo-cancel-scan {',
  '      width: 100%; padding: 12px; background: #333; color: #fff;',
  '      border: none; font-size: 15px; cursor: pointer;',
  '    }',
  '',
  '    .fo-wo-header {',
  '      background: var(--navy); color: #fff;',
  '      border-radius: var(--radius); padding: 18px 20px;',
  '      margin-bottom: 14px; box-shadow: var(--shadow);',
  '    }',
  '    .fo-wo-num  { font-size: 12px; opacity: 0.65; margin-bottom: 2px; }',
  '    .fo-wo-item { font-size: 20px; font-weight: 700; margin-bottom: 10px; }',
  '    .fo-meta    { display: flex; gap: 18px; flex-wrap: wrap; }',
  '    .fo-meta-item { font-size: 13px; }',
  '    .fo-meta-item span { display: block; font-size: 11px; opacity: 0.65; }',
  '    .fo-badge {',
  '      display: inline-block; margin-top: 10px;',
  '      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;',
  '    }',
  '    .fo-badge.not-started { background: #ddd; color: #555; }',
  '    .fo-badge.in-process  { background: var(--abg); color: var(--amber); }',
  '    .fo-badge.completed   { background: var(--gbg); color: var(--green); }',
  '',
  '    .fo-section {',
  '      background: #fff; border-radius: var(--radius);',
  '      padding: 16px 20px; margin-bottom: 14px; box-shadow: var(--shadow);',
  '    }',
  '    .fo-section h3 {',
  '      font-size: 11px; font-weight: 700; text-transform: uppercase;',
  '      letter-spacing: 0.5px; color: #888; margin-bottom: 12px;',
  '    }',
  '    .fo-mat-row {',
  '      display: flex; justify-content: space-between; align-items: center;',
  '      padding: 10px 0; border-bottom: 1px solid #f0f0f0;',
  '    }',
  '    .fo-mat-row:last-child { border-bottom: none; }',
  '    .fo-mat-code { font-weight: 600; font-size: 14px; }',
  '    .fo-mat-name { font-size: 12px; color: #888; }',
  '    .fo-mat-qty  { font-size: 15px; font-weight: 700; color: var(--navy); }',
  '    .fo-mat-uom  { font-size: 11px; color: #888; font-weight: 400; }',
  '',
  '    .fo-actions { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }',
  '    .fo-action-btn {',
  '      border: none; border-radius: var(--radius); padding: 18px 20px;',
  '      font-size: 17px; font-weight: 700; cursor: pointer;',
  '      display: flex; align-items: center; gap: 14px; text-align: left;',
  '      transition: opacity 0.15s, transform 0.1s;',
  '    }',
  '    .fo-action-btn:hover { opacity: 0.92; transform: translateY(-1px); }',
  '    .fo-action-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }',
  '    .fo-action-btn .fo-btn-sub { font-size: 12px; font-weight: 400; opacity: 0.8; margin-top: 2px; }',
  '    .btn-issue   { background: var(--blue);  color: #fff; }',
  '    .btn-produce { background: var(--green); color: #fff; }',
  '    .btn-return  { background: var(--amber); color: #fff; }',
  '',
  '    .fo-action-hdr {',
  '      border-radius: var(--radius); padding: 14px 18px;',
  '      margin-bottom: 14px; font-size: 16px; font-weight: 700; color: #fff;',
  '    }',
  '    .fo-action-hdr.issue   { background: var(--blue); }',
  '    .fo-action-hdr.produce { background: var(--green); }',
  '    .fo-action-hdr.return  { background: var(--amber); }',
  '',
  '    .fo-qty-row {',
  '      display: flex; align-items: center; gap: 12px;',
  '      padding: 12px 0; border-bottom: 1px solid #f0f0f0;',
  '    }',
  '    .fo-qty-row:last-child { border-bottom: none; }',
  '    .fo-qty-row .fo-qty-label { flex: 1; }',
  '    .fo-qty-row .fo-qty-label strong { display: block; font-size: 14px; }',
  '    .fo-qty-row .fo-qty-label small  { color: #888; font-size: 12px; }',
  '    .fo-qty-row input {',
  '      width: 90px; padding: 10px; text-align: center;',
  '      border: 2px solid #ddd; border-radius: 8px;',
  '      font-size: 16px; font-weight: 700; color: var(--navy);',
  '    }',
  '    .fo-qty-row input:focus { outline: none; border-color: var(--blue); }',
  '',
  '    .fo-single-qty { text-align: center; padding: 10px 0 20px; }',
  '    .fo-single-qty label { display: block; font-size: 14px; color: #666; margin-bottom: 8px; }',
  '    .fo-single-qty input {',
  '      width: 160px; padding: 16px; text-align: center;',
  '      border: 2px solid #ddd; border-radius: 12px;',
  '      font-size: 28px; font-weight: 700; color: var(--navy);',
  '    }',
  '    .fo-single-qty input:focus { outline: none; border-color: var(--green); }',
  '    .fo-single-qty .fo-unit { color: #888; font-size: 13px; margin-top: 6px; }',
  '',
  '    #fo-confirm-btn {',
  '      width: 100%; padding: 18px; font-size: 18px; font-weight: 700;',
  '      border: none; border-radius: var(--radius);',
  '      background: var(--navy); color: #fff; cursor: pointer; margin-top: 16px;',
  '    }',
  '    #fo-confirm-btn:hover { background: var(--blue); }',
  '    #fo-confirm-btn:disabled { background: #999; cursor: not-allowed; }',
  '',
  '    #fo-back-btn {',
  '      background: none; border: none; color: var(--blue);',
  '      font-size: 14px; font-weight: 600; cursor: pointer;',
  '      padding: 0 0 12px 0; display: none;',
  '    }',
  '    #fo-back-btn:hover { text-decoration: underline; }',
  '',
  '    .fo-spinner {',
  '      display: inline-block; width: 18px; height: 18px;',
  '      border: 3px solid rgba(255,255,255,0.4); border-top-color: #fff;',
  '      border-radius: 50%; animation: fo-spin 0.7s linear infinite;',
  '      vertical-align: middle; margin-right: 8px;',
  '    }',
  '    @keyframes fo-spin { to { transform: rotate(360deg); } }',
  '  </style>',
  '',
  '  <button id="fo-back-btn" onclick="floorOps.back()">← Back</button>',
  '',
  '  <div class="fo-screen active" id="fo-screen-landing">',
  '    <div class="fo-greeting">',
  '      <h2 id="fo-greeting-text">Good day!</h2>',
  '      <p id="fo-greeting-date"></p>',
  '    </div>',
  '',
  '    <div class="fo-card" onclick="floorOps.startScan()">',
  '      <div class="fo-icon">📷</div>',
  '      <div>',
  '        <h3>Scan Work Order</h3>',
  '        <p>Point camera at QR code on job card</p>',
  '      </div>',
  '    </div>',
  '',
  '    <div class="fo-card" onclick="floorOps.showDropdown()">',
  '      <div class="fo-icon">📋</div>',
  '      <div>',
  '        <h3>Select Work Order</h3>',
  '        <p>Choose from open jobs list</p>',
  '      </div>',
  '    </div>',
  '',
  '    <div id="fo-scanner-wrap">',
  '      <div id="fo-qr-reader"></div>',
  '      <div id="fo-scan-status">Initialising camera…</div>',
  '      <button id="fo-cancel-scan" onclick="floorOps.stopScan()">✕ Cancel</button>',
  '    </div>',
  '',
  '    <div id="fo-select-wrap">',
  '      <label>Open Work Orders</label>',
  '      <select id="fo-wo-dropdown"><option value="">Loading…</option></select>',
  '      <button id="fo-go-btn" onclick="floorOps.loadFromDropdown()">Open →</button>',
  '    </div>',
  '  </div>',
  '',
  '  <div class="fo-screen" id="fo-screen-wo">',
  '    <div class="fo-wo-header" id="fo-wo-header"></div>',
  '    <div class="fo-section">',
  '      <h3>Materials Required</h3>',
  '      <div id="fo-materials-list"></div>',
  '    </div>',
  '    <div class="fo-actions">',
  '      <button class="fo-action-btn btn-issue"   id="fo-btn-issue"   onclick="floorOps.openAction(&apos;issue&apos;)">',
  '        <span style="font-size:28px">📦</span>',
  '        <div><div>Issue to Production</div><div class="fo-btn-sub">Move raw materials to floor</div></div>',
  '      </button>',
  '      <button class="fo-action-btn btn-produce" id="fo-btn-produce" onclick="floorOps.openAction(&apos;produce&apos;)">',
  '        <span style="font-size:28px">✅</span>',
  '        <div><div>Record Production</div><div class="fo-btn-sub">Confirm finished goods completed</div></div>',
  '      </button>',
  '      <button class="fo-action-btn btn-return"  id="fo-btn-return"  onclick="floorOps.openAction(&apos;return&apos;)">',
  '        <span style="font-size:28px">↩️</span>',
  '        <div><div>Return Materials</div><div class="fo-btn-sub">Send unused stock back to store</div></div>',
  '      </button>',
  '    </div>',
  '  </div>',
  '',
  '  <div class="fo-screen" id="fo-screen-action">',
  '    <div class="fo-action-hdr" id="fo-action-hdr"></div>',
  '    <div class="fo-section" id="fo-action-body"></div>',
  '    <button id="fo-confirm-btn" onclick="floorOps.confirm()">Confirm</button>',
  '  </div>',
  '',
  '</div>'
].join('\n');

frappe.pages['floor-ops'].on_page_load = function(wrapper) {
  const page = frappe.ui.make_app_page({
    parent: wrapper,
    title: 'Production Floor',
    single_column: true
  });

  // Inject inlined HTML directly — no template lookup needed
  page.main.html(FLOOR_OPS_HTML);

  // Load QR library then boot the controller
  frappe.require(
    'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
    () => floorOps.init()
  );
};

// ══════════════════════════════════════════════════════
//  FLOOR OPS CONTROLLER
// ══════════════════════════════════════════════════════
// Attach to window so inline onclick handlers ("floorOps.startScan()") can find it.
// Page bundle JS runs in a function scope; const declarations are NOT globals.
window.floorOps = {
  currentWO: null,
  currentAction: null,
  qrScanner: null,

  // ── Init ──────────────────────────────────────────
  init() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = frappe.session.user_fullname?.split(' ')[0] || '';
    document.getElementById('fo-greeting-text').textContent = `${greeting}${name ? ', ' + name : ''}!`;
    document.getElementById('fo-greeting-date').textContent =
      now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  },

  // ── Screen nav ────────────────────────────────────
  show(screenId) {
    document.querySelectorAll('.fo-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    document.getElementById('fo-back-btn').style.display =
      screenId === 'fo-screen-landing' ? 'none' : 'block';
  },

  back() {
    this.stopScan();
    const current = document.querySelector('.fo-screen.active')?.id;
    if (current === 'fo-screen-action') {
      this.show('fo-screen-wo');
    } else {
      this.show('fo-screen-landing');
      document.getElementById('fo-select-wrap').style.display = 'none';
      document.getElementById('fo-scanner-wrap').style.display = 'none';
    }
  },

  // ── QR Scanner ────────────────────────────────────
  startScan() {
    document.getElementById('fo-scanner-wrap').style.display = 'block';
    document.getElementById('fo-select-wrap').style.display = 'none';
    document.getElementById('fo-scan-status').textContent = 'Initialising camera…';

    this.qrScanner = new Html5Qrcode('fo-qr-reader');
    this.qrScanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decoded) => { this.stopScan(); this.loadWO(decoded.trim()); },
      () => { document.getElementById('fo-scan-status').textContent = 'Scanning… point at QR code on job card'; }
    ).catch(() => {
      document.getElementById('fo-scan-status').textContent = '⚠️ Camera unavailable — use the dropdown instead';
    });
  },

  stopScan() {
    if (this.qrScanner) { this.qrScanner.stop().catch(() => {}); this.qrScanner = null; }
    document.getElementById('fo-scanner-wrap').style.display = 'none';
  },

  // ── Dropdown ──────────────────────────────────────
  async showDropdown() {
    this.stopScan();
    document.getElementById('fo-select-wrap').style.display = 'block';
    const sel = document.getElementById('fo-wo-dropdown');
    sel.innerHTML = '<option value="">Loading…</option>';

    try {
      const wos = await this.call('frappe.client.get_list', {
        doctype: 'Work Order',
        filters: [['docstatus', '=', 1], ['status', 'in', ['Not Started', 'In Process']]],
        fields: ['name', 'production_item', 'qty', 'status', 'planned_start_date'],
        limit_page_length: 50,
        order_by: 'planned_start_date asc'
      });
      if (!wos.length) {
        sel.innerHTML = '<option value="">No open work orders</option>';
        return;
      }
      sel.innerHTML = '<option value="">— Select a Work Order —</option>' +
        wos.map(w =>
          `<option value="${w.name}">${w.name} · ${w.production_item} · Qty ${w.qty} · ${w.status}</option>`
        ).join('');
    } catch(e) {
      sel.innerHTML = '<option value="">Error loading</option>';
      frappe.show_alert({ message: 'Could not load work orders: ' + e.message, indicator: 'red' });
    }
  },

  loadFromDropdown() {
    const name = document.getElementById('fo-wo-dropdown').value;
    if (!name) { frappe.show_alert({ message: 'Please select a work order', indicator: 'orange' }); return; }
    this.loadWO(name);
  },

  // ── Load WO ───────────────────────────────────────
  async loadWO(name) {
    frappe.show_alert({ message: 'Loading ' + name + '…', indicator: 'blue' });
    try {
      const wo = await this.call('frappe.client.get', { doctype: 'Work Order', name });
      if (!wo) throw new Error('Not found: ' + name);
      this.currentWO = wo;
      this.renderWO(wo);
      this.show('fo-screen-wo');
    } catch(e) {
      frappe.show_alert({ message: 'Error: ' + e.message, indicator: 'red' });
    }
  },

  renderWO(wo) {
    const cls = { 'Not Started': 'not-started', 'In Process': 'in-process', 'Completed': 'completed' }[wo.status] || '';
    document.getElementById('fo-wo-header').innerHTML = `
      <div class="fo-wo-num">${wo.name}</div>
      <div class="fo-wo-item">${wo.production_item}</div>
      <div class="fo-meta">
        <div class="fo-meta-item"><span>Ordered</span>${wo.qty} ${wo.stock_uom || 'Nos'}</div>
        <div class="fo-meta-item"><span>Transferred</span>${wo.material_transferred_for_manufacturing || 0}</div>
        <div class="fo-meta-item"><span>Produced</span>${wo.produced_qty || 0}</div>
        <div class="fo-meta-item"><span>Start Date</span>${(wo.planned_start_date || '').split(' ')[0] || '—'}</div>
      </div>
      <span class="fo-badge ${cls}">${wo.status}</span>
    `;

    const items = wo.required_items || [];
    document.getElementById('fo-materials-list').innerHTML = items.length
      ? items.map(i => `
          <div class="fo-mat-row">
            <div><div class="fo-mat-code">${i.item_code}</div><div class="fo-mat-name">${i.item_name || ''}</div></div>
            <div class="fo-mat-qty">${i.required_qty} <span class="fo-mat-uom">${i.uom || ''}</span></div>
          </div>`).join('')
      : '<p style="color:#888;text-align:center;padding:16px">No material requirements found</p>';

    const done = wo.status === 'Completed';
    const notStarted = wo.status === 'Not Started';
    document.getElementById('fo-btn-issue').disabled   = done;
    document.getElementById('fo-btn-produce').disabled = notStarted || done;
    document.getElementById('fo-btn-return').disabled  = notStarted || done;
  },

  // ── Action screen ─────────────────────────────────
  openAction(type) {
    this.currentAction = type;
    const titles = {
      issue:   { label: '📦  Issue to Production', cls: 'issue' },
      produce: { label: '✅  Record Production',   cls: 'produce' },
      return:  { label: '↩️  Return Materials',    cls: 'return' }
    };
    const t = titles[type];
    const hdr = document.getElementById('fo-action-hdr');
    hdr.innerHTML = t.label;
    hdr.className = 'fo-action-hdr ' + t.cls;

    const body = document.getElementById('fo-action-body');
    const items = this.currentWO.required_items || [];

    if (type === 'produce') {
      const remaining = (this.currentWO.qty || 0) - (this.currentWO.produced_qty || 0);
      body.innerHTML = `
        <h3>Quantity Produced</h3>
        <div class="fo-single-qty">
          <label>Units of <strong>${this.currentWO.production_item}</strong> completed</label>
          <input type="number" id="fo-produce-qty" value="${remaining}" min="1" max="${remaining}">
          <div class="fo-unit">${this.currentWO.stock_uom || 'Nos'} (max ${remaining})</div>
        </div>
      `;
    } else {
      body.innerHTML = `
        <h3>${type === 'issue' ? 'Quantities to Issue' : 'Quantities to Return'}</h3>
        ${items.map((i, idx) => `
          <div class="fo-qty-row">
            <div class="fo-qty-label">
              <strong>${i.item_code}</strong>
              <small>${i.required_qty} ${i.uom || ''} required</small>
            </div>
            <input type="number" id="fo-mat-${idx}" value="${i.required_qty}" min="0" step="0.1">
          </div>`).join('')}
      `;
    }
    this.show('fo-screen-action');
  },

  // ── Confirm → API ─────────────────────────────────
  async confirm() {
    const btn = document.getElementById('fo-confirm-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="fo-spinner"></span> Processing…';
    try {
      if (this.currentAction === 'issue')   await this.doIssue();
      if (this.currentAction === 'produce') await this.doProduce();
      if (this.currentAction === 'return')  await this.doReturn();
    } catch(e) {
      frappe.show_alert({ message: 'Error: ' + (e.message || e), indicator: 'red' });
    } finally {
      btn.disabled = false;
      btn.textContent = 'Confirm';
    }
  },

  async doIssue() {
    const items = this.currentWO.required_items || [];
    const qty = parseFloat(document.getElementById('fo-mat-0')?.value) || this.currentWO.qty;

    const template = await this.call(
      'erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry',
      { work_order_id: this.currentWO.name, purpose: 'Material Transfer for Manufacture', qty }
    );

    const today = frappe.datetime.get_today();
    const overrides = items.map((_, idx) => ({
      qty: parseFloat(document.getElementById('fo-mat-' + idx)?.value) || 0
    }));
    template.items = template.items.map((ti, i) => ({ ...ti, qty: overrides[i]?.qty ?? ti.qty }));
    template.set_posting_time = 1;
    template.posting_date = today;

    const saved = await this.call('frappe.client.insert', { doc: template });
    await this.call('frappe.client.submit', { doc: saved });

    frappe.show_alert({ message: '✅ Issued — ' + saved.name, indicator: 'green' });
    setTimeout(() => { this.loadWO(this.currentWO.name); this.show('fo-screen-wo'); }, 1800);
  },

  async doProduce() {
    const qty = parseFloat(document.getElementById('fo-produce-qty').value);
    if (!qty) { frappe.show_alert({ message: 'Enter a quantity', indicator: 'orange' }); return; }

    const template = await this.call(
      'erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry',
      { work_order_id: this.currentWO.name, purpose: 'Manufacture', qty }
    );
    template.set_posting_time = 1;
    template.posting_date = frappe.datetime.get_today();

    const saved = await this.call('frappe.client.insert', { doc: template });
    await this.call('frappe.client.submit', { doc: saved });

    frappe.show_alert({ message: '✅ Production recorded — ' + saved.name, indicator: 'green' });
    setTimeout(() => { this.loadWO(this.currentWO.name); this.show('fo-screen-wo'); }, 1800);
  },

  async doReturn() {
    const items = this.currentWO.required_items || [];
    const returnItems = items.map((i, idx) => ({
      item_code: i.item_code, item_name: i.item_name,
      qty: parseFloat(document.getElementById('fo-mat-' + idx)?.value) || 0,
      uom: i.uom, basic_rate: i.rate || 0,
      s_warehouse: this.currentWO.wip_warehouse,
      t_warehouse: i.source_warehouse || 'Raw Materials Store - BPD'
    })).filter(i => i.qty > 0);

    if (!returnItems.length) { frappe.show_alert({ message: 'Enter quantities to return', indicator: 'orange' }); return; }

    const doc = {
      doctype: 'Stock Entry',
      stock_entry_type: 'Material Transfer',
      purpose: 'Material Transfer',
      company: this.currentWO.company,
      work_order: this.currentWO.name,
      set_posting_time: 1,
      posting_date: frappe.datetime.get_today(),
      items: returnItems
    };
    const saved = await this.call('frappe.client.insert', { doc });
    await this.call('frappe.client.submit', { doc: saved });

    frappe.show_alert({ message: '✅ Materials returned — ' + saved.name, indicator: 'green' });
    setTimeout(() => { this.loadWO(this.currentWO.name); this.show('fo-screen-wo'); }, 1800);
  },

  // ── Frappe call wrapper ───────────────────────────
  call(method, args) {
    return new Promise((resolve, reject) => {
      frappe.call({
        method, args,
        callback: r => resolve(r.message),
        error: e => reject(new Error(e.message || 'API error'))
      });
    });
  }
};
