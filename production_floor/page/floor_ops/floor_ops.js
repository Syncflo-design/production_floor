// Production Floor — Frappe Page Controller
// Runs inside NestERP: uses frappe.call(), frappe.session, frappe.show_alert()

frappe.pages['floor-ops'].on_page_load = function(wrapper) {
  const page = frappe.ui.make_app_page({
    parent: wrapper,
    title: 'Production Floor',
    single_column: true
  });

  // Render HTML template into page body
  page.main.html(frappe.render_template('floor_ops', {}));

  // Load QR library then boot the controller
  frappe.require(
    'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
    () => floorOps.init()
  );
};

// ══════════════════════════════════════════════════════
//  FLOOR OPS CONTROLLER
// ══════════════════════════════════════════════════════
const floorOps = {
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
