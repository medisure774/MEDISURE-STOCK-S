// =============================================
// MEDISURE STOCK — MAIN APP (app.js)
// =============================================
// Uses PDF.js for PDF parsing (loaded via CDN)

const STOCK_KEY = 'medisure_stock_data';
const META_KEY = 'medisure_stock_meta';
const LOW_THRESHOLD = 10; // Qty below this = Low Stock

// ---- STATE ----
let allRows = [];   // full parsed rows
let filtRows = [];   // after search/filter
let sortCol = -1;
let sortAsc = true;

// ---- DOM ELEMENTS ----
const tbody = document.getElementById('stockTbody');
const tableCount = document.getElementById('tableCount');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const lastUpdated = document.getElementById('lastUpdated');
const emptyState = document.getElementById('emptyState');
const tableCard = document.getElementById('tableCard');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const statsTotal = document.getElementById('statsTotal');
const statsIn = document.getElementById('statsIn');
const statsLow = document.getElementById('statsLow');
const statsOut = document.getElementById('statsOut');

// ---- PDF.js WORKER SETUP ----
// Point to CDN worker so it loads correctly cross-device
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    const session = requireAuth();
    if (!session) return;

    // Show user info
    document.getElementById('userDisplay').textContent = session.displayName;
    const roleBadge = document.getElementById('roleBadge');
    roleBadge.textContent = session.role === 'admin' ? '⚙ Admin' : '👤 Employee';
    if (session.role === 'admin') roleBadge.classList.add('admin');

    // Admin-only sections
    if (isAdmin()) {
        document.getElementById('adminZone').style.display = 'block';
        uploadArea.classList.add('visible');
    }

    // Load persisted data
    loadFromStorage();

    // Search (debounced)
    let searchTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(applyFilters, 200);
    });

    // Filter dropdown
    statusFilter.addEventListener('change', applyFilters);

    // Sort headers
    document.querySelectorAll('thead th[data-col]').forEach(th => {
        th.addEventListener('click', () => sortByCol(parseInt(th.dataset.col)));
    });

    // Upload area drag-drop (admin only)
    if (isAdmin()) {
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
        });
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) processFile(e.target.files[0]);
        });
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Listen for Supabase Realtime changes (so employees see updates immediately)
    if (window.supabase) {
        window.supabase
            .channel('public:stocks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stocks' }, (payload) => {
                console.log('Stock change received!', payload);
                loadFromStorage(true); // reload from cloud
            })
            .subscribe();
    }
});

// ---- PDF PROCESSING ----
function processFile(file) {
    // Only accept PDF files
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && file.type !== 'application/pdf') {
        showToast('Please upload a valid PDF file (.pdf).', 'error');
        return;
    }

    if (typeof pdfjsLib === 'undefined') {
        showToast('PDF library not loaded. Please refresh the page and try again.', 'error');
        return;
    }

    showProgress(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const typedArray = new Uint8Array(e.target.result);
            await parsePdfFile(typedArray, file.name);
        } catch (err) {
            showProgress(false);
            showToast('Failed to read PDF: ' + err.message, 'error');
        }
    };
    reader.onerror = () => { showProgress(false); showToast('File read error.', 'error'); };
    reader.readAsArrayBuffer(file);
}

// ---- PDF TEXT EXTRACTION ----
async function parsePdfFile(typedArray, fileName) {
    try {
        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;

        // Collect all text items from all pages with their x/y positions
        let allItems = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1.0 });
            // Normalize y position so top of page = smaller y values
            textContent.items.forEach(item => {
                if (item.str.trim() !== '') {
                    allItems.push({
                        str: item.str.trim(),
                        x: Math.round(item.transform[4]),
                        // Flip Y so top of page is 0
                        y: Math.round(viewport.height - item.transform[5]),
                        page: pageNum
                    });
                }
            });
        }

        if (allItems.length === 0) {
            showProgress(false);
            showToast('No text found in this PDF. It may be a scanned/image PDF. Please use a text-based PDF.', 'error');
            return;
        }

        // Parse items into structured rows
        parsePdfItems(allItems, fileName);
    } catch (err) {
        showProgress(false);
        showToast('PDF parsing error: ' + err.message, 'error');
    }
}

// ---- SMART PDF TABLE PARSER ----
function parsePdfItems(items, fileName) {
    // Group items by page, then by Y row (items within ~8px vertically = same row)
    const Y_TOLERANCE = 8;

    // Group into horizontal lines
    let lines = [];
    items.forEach(item => {
        let found = false;
        for (const line of lines) {
            if (line.page === item.page && Math.abs(line.y - item.y) <= Y_TOLERANCE) {
                line.items.push(item);
                line.y = Math.round((line.y + item.y) / 2); // average Y
                found = true;
                break;
            }
        }
        if (!found) {
            lines.push({ y: item.y, page: item.page, items: [item] });
        }
    });

    // Sort lines: by page then by Y
    lines.sort((a, b) => a.page !== b.page ? a.page - b.page : a.y - b.y);

    // Sort items within each line by X position (left to right)
    lines.forEach(line => line.items.sort((a, b) => a.x - b.x));

    // Find header row — look for a row that contains keywords typical of stock tables
    const headerKeywords = ['name', 'product', 'item', 'medicine', 'drug', 'qty', 'quantity',
        'stock', 'balance', 'sku', 'code', 'category', 'status', 'unit', 'description'];

    let headerLineIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const rowText = lines[i].items.map(it => it.str.toLowerCase()).join(' ');
        const matchCount = headerKeywords.filter(kw => rowText.includes(kw)).length;
        if (matchCount >= 2) {
            headerLineIdx = i;
            break;
        }
    }

    // If no header found, treat first row as header
    if (headerLineIdx === -1) headerLineIdx = 0;

    const headerLine = lines[headerLineIdx];
    const headers = headerLine.items.map(it => it.str.trim());
    const colXPositions = headerLine.items.map(it => it.x);

    // Map headers to field names
    const colMap = detectPdfColumns(headers);

    // Parse data rows (everything after the header)
    const dataLines = lines.slice(headerLineIdx + 1).filter(line => {
        const text = line.items.map(it => it.str).join(' ').trim();
        // Skip empty or page-number lines
        return text.length > 0 && !/^page\s*\d+$/i.test(text);
    });

    if (dataLines.length === 0) {
        showProgress(false);
        showToast('No data rows found in the PDF table. Please check the file format.', 'warning');
        return;
    }

    // For each data line, assign text to columns by nearest X position
    allRows = [];
    dataLines.forEach((line, idx) => {
        // Assign each cell to its closest column header by X
        const cells = new Array(headers.length).fill('');
        line.items.forEach(item => {
            // Find closest header column by X distance
            let bestCol = 0;
            let bestDist = Infinity;
            colXPositions.forEach((hx, ci) => {
                const dist = Math.abs(item.x - hx);
                if (dist < bestDist) { bestDist = dist; bestCol = ci; }
            });
            cells[bestCol] = (cells[bestCol] ? cells[bestCol] + ' ' : '') + item.str;
        });

        const get = (key) => {
            const ci = colMap[key];
            return ci !== undefined ? (cells[ci] || '').trim() : '';
        };

        const qty = parseFloat(get('qty')) || 0;
        const name = get('name') || get('fallback_name') || `Item ${idx + 1}`;

        // Skip lines that look like totals or subtotals
        const rawText = cells.join(' ').toLowerCase();
        if (/total|subtotal|grand total|^[\d\s]*$/.test(rawText) && !get('name')) return;

        allRows.push({
            sno: allRows.length + 1,
            name: name,
            sku: get('sku') || '',
            category: get('cat') || '',
            qty: qty,
            unit: get('unit') || '',
            status: get('status') || autoStatus(qty),
        });
    });

    if (allRows.length === 0) {
        showProgress(false);
        showToast('Could not extract stock items from this PDF. Please ensure it has a proper table.', 'warning');
        return;
    }

    // Save to storage
    const meta = { fileName, uploadedAt: new Date().toISOString(), rowCount: allRows.length };
    localStorage.setItem(STOCK_KEY, JSON.stringify(allRows));
    localStorage.setItem(META_KEY, JSON.stringify(meta));

    if (window.supabase) {
        uploadToCloud(allRows, meta);
    } else {
        showProgress(false);
        updateLastUpdated(meta);
        applyFilters();
        updateStats();
        showToast(`✅ ${allRows.length} items loaded from "${fileName}"`, 'success');
    }
}

// ---- COLUMN DETECTION FOR PDF ----
function detectPdfColumns(headers) {
    const map = {};
    const normalize = s => s.toLowerCase().replace(/[\s_\-\.]/g, '');

    headers.forEach((h, i) => {
        const n = normalize(h);
        if (!map.sku && (n.includes('sku') || n.includes('code') || n.includes('itemno') || n.includes('partno') || n.includes('productcode'))) map.sku = i;
        if (!map.name && (n.includes('name') || n.includes('description') || n.includes('product') || n.includes('item') || n.includes('medicine') || n.includes('drug'))) map.name = i;
        if (!map.fallback_name && i === 0) map.fallback_name = i;
        if (!map.qty && (n.includes('qty') || n.includes('quantity') || n.includes('stock') || n.includes('balance') || n.includes('available'))) map.qty = i;
        if (!map.cat && (n.includes('cat') || n.includes('group') || n.includes('type') || n.includes('dept'))) map.cat = i;
        if (!map.status && (n.includes('status') || n.includes('availability'))) map.status = i;
        if (!map.unit && (n.includes('unit') || n.includes('uom') || n.includes('pack'))) map.unit = i;
    });
    return map;
}

function autoStatus(qty) {
    if (qty <= 0) return 'Out of Stock';
    if (qty <= LOW_THRESHOLD) return 'Low Stock';
    return 'In Stock';
}

// ---- CLOUD UPLOAD ----
async function uploadToCloud(rows, meta) {
    showProgress(true);
    try {
        // Clear old stocks
        const { error: deleteError } = await window.supabase
            .from('stocks')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) throw deleteError;

        // Insert new stocks in batches
        const BATCH_SIZE = 500;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE).map(r => ({
                sno: r.sno,
                name: r.name,
                sku: r.sku,
                category: r.category,
                qty: r.qty,
                unit: r.unit,
                status: r.status
            }));

            const { error: insertError } = await window.supabase
                .from('stocks')
                .insert(batch);

            if (insertError) throw insertError;
        }

        updateLastUpdated(meta);
        applyFilters();
        updateStats();
        showToast(`✅ ${rows.length} items synced to cloud from PDF.`, 'success');
    } catch (err) {
        console.error('Cloud Sync Error:', err);
        updateLastUpdated(meta);
        applyFilters();
        updateStats();
        showToast('PDF loaded locally, but cloud sync failed. Employees on other devices may not see this update.', 'warning');
    } finally {
        showProgress(false);
    }
}

// ---- LOAD FROM STORAGE ----
async function loadFromStorage(fromCloud = false) {
    // 1. Try cloud first
    if (window.supabase && (fromCloud || !allRows.length)) {
        try {
            const { data, error } = await window.supabase
                .from('stocks')
                .select('*')
                .order('sno', { ascending: true });

            if (!error && data && data.length > 0) {
                allRows = data.map(r => ({
                    ...r,
                    rawRow: [],
                    headers: []
                }));
                const lastUploaded = data.reduce((latest, item) => {
                    const d = new Date(item.uploaded_at || item.created_at);
                    return d > latest ? d : latest;
                }, new Date(0));

                updateLastUpdated({
                    fileName: 'Cloud Inventory (PDF)',
                    uploadedAt: lastUploaded.toISOString()
                });
                applyFilters();
                updateStats();
                return;
            }
        } catch (err) {
            console.warn('Cloud fetch failed, falling back to local:', err);
        }
    }

    // 2. Fallback to LocalStorage
    try {
        const raw = localStorage.getItem(STOCK_KEY);
        const meta = localStorage.getItem(META_KEY);
        if (raw) {
            allRows = JSON.parse(raw);
            if (meta) updateLastUpdated(JSON.parse(meta));
            applyFilters();
            updateStats();
        } else {
            showEmptyState(true);
        }
    } catch { showEmptyState(true); }
}

// ---- FILTERS & SEARCH ----
function applyFilters() {
    const q = searchInput.value.toLowerCase().trim();
    const status = statusFilter.value;

    filtRows = allRows.filter(row => {
        const matchSearch = !q ||
            (row.name || '').toLowerCase().includes(q) ||
            (row.sku || '').toLowerCase().includes(q) ||
            (row.category || '').toLowerCase().includes(q);

        const rowStatus = normStatus(row.status);
        const matchStatus = !status || rowStatus === status;

        return matchSearch && matchStatus;
    });

    renderTable();
}

function normStatus(s) {
    const n = (s || '').toLowerCase();
    if (n.includes('out')) return 'out';
    if (n.includes('low')) return 'low';
    if (n.includes('in') || n.includes('available')) return 'in';
    return 'in';
}

// ---- RENDER TABLE ----
function renderTable() {
    let rows = [...filtRows];

    // Apply sort
    if (sortCol >= 0) {
        rows.sort((a, b) => {
            let va, vb;
            switch (sortCol) {
                case 0: va = a.sno; vb = b.sno; break;
                case 1: va = a.name; vb = b.name; break;
                case 2: va = a.sku; vb = b.sku; break;
                case 3: va = a.category; vb = b.category; break;
                case 4: va = a.qty; vb = b.qty; break;
                case 5: va = a.status; vb = b.status; break;
                default: va = ''; vb = '';
            }
            if (typeof va === 'number') return sortAsc ? va - vb : vb - va;
            return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
    }

    tbody.innerHTML = '';

    if (rows.length === 0) {
        showEmptyState(true, allRows.length === 0);
        tableCount.textContent = '0 items';
        return;
    }

    showEmptyState(false);
    tableCount.textContent = `${rows.length} item${rows.length !== 1 ? 's' : ''}`;

    const frag = document.createDocumentFragment();
    rows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        const st = normStatus(row.status);
        const qty = row.qty;

        let qtyClass = qty > LOW_THRESHOLD ? 'qty-high' : (qty > 0 ? 'qty-mid' : 'qty-zero');
        let badgeClass = st === 'in' ? 'badge-in' : (st === 'low' ? 'badge-low' : (st === 'out' ? 'badge-out' : 'badge-na'));
        let badgeLabel = st === 'in' ? 'In Stock' : (st === 'low' ? 'Low Stock' : (st === 'out' ? 'Out of Stock' : row.status));

        tr.innerHTML = `
      <td class="row-num">${idx + 1}</td>
      <td>${escHtml(row.name)}</td>
      <td>${row.sku ? `<code style="background:#f1f5f9;padding:2px 7px;border-radius:5px;font-size:.8rem;">${escHtml(row.sku)}</code>` : '<span style="color:#cbd5e1">—</span>'}</td>
      <td>${row.category ? escHtml(row.category) : '<span style="color:#cbd5e1">—</span>'}</td>
      <td><span class="qty-chip ${qtyClass}">${qty}${row.unit ? ' ' + escHtml(row.unit) : ''}</span></td>
      <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
    `;
        frag.appendChild(tr);
    });
    tbody.appendChild(frag);
}

// ---- SORT ----
function sortByCol(col) {
    if (sortCol === col) { sortAsc = !sortAsc; }
    else { sortCol = col; sortAsc = true; }

    document.querySelectorAll('thead th[data-col]').forEach(th => {
        th.classList.remove('sorted');
        th.querySelector('.sort-icon').textContent = '⇅';
    });
    const th = document.querySelector(`thead th[data-col="${col}"]`);
    if (th) {
        th.classList.add('sorted');
        th.querySelector('.sort-icon').textContent = sortAsc ? '↑' : '↓';
    }
    renderTable();
}

// ---- STATS ----
function updateStats() {
    const total = allRows.length;
    const inCnt = allRows.filter(r => normStatus(r.status) === 'in').length;
    const low = allRows.filter(r => normStatus(r.status) === 'low').length;
    const out = allRows.filter(r => normStatus(r.status) === 'out').length;

    animateCount(statsTotal, total);
    animateCount(statsIn, inCnt);
    animateCount(statsLow, low);
    animateCount(statsOut, out);
}

function animateCount(el, target) {
    if (!el) return;
    let start = 0;
    const step = Math.ceil(target / 20);
    const timer = setInterval(() => {
        start = Math.min(start + step, target);
        el.textContent = start.toLocaleString();
        if (start >= target) clearInterval(timer);
    }, 30);
}

// ---- HELPERS ----
function showEmptyState(show, isFirstTime = false) {
    if (!emptyState || !tableCard) return;
    emptyState.style.display = show ? 'block' : 'none';
    tableCard.style.display = show ? 'none' : 'block';
    if (show && isFirstTime) {
        emptyState.innerHTML = `
      <div class="empty-icon">📦</div>
      <h3>No stock data yet</h3>
      <p>${isAdmin() ? 'Upload your daily PDF stock sheet using the upload area above to get started.' : 'No stock data has been uploaded yet. Please contact your administrator.'}</p>
    `;
    } else if (show) {
        emptyState.innerHTML = `
      <div class="empty-icon">🔍</div>
      <h3>No results found</h3>
      <p>Try adjusting your search term or filter.</p>
    `;
    }
}

function updateLastUpdated(meta) {
    if (!lastUpdated) return;
    const d = new Date(meta.uploadedAt);
    lastUpdated.innerHTML = `Last updated: <span>${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span> &nbsp;·&nbsp; <span>${meta.fileName}</span>`;
}

function showProgress(show) {
    const el = document.getElementById('uploadProgress');
    if (!el) return;
    if (show) {
        el.classList.add('show');
        let p = 0;
        const fill = el.querySelector('.progress-fill');
        const timer = setInterval(() => {
            p = Math.min(p + Math.random() * 15, 90);
            fill.style.width = p + '%';
            if (p >= 90) clearInterval(timer);
        }, 120);
        el._timer = timer;
    } else {
        const fill = el.querySelector('.progress-fill');
        clearInterval(el._timer);
        fill.style.width = '100%';
        setTimeout(() => { el.classList.remove('show'); fill.style.width = '0%'; }, 400);
    }
}

function showToast(msg, type = 'success') {
    const wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>${msg}`;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Clear stock data (admin only)
function clearData() {
    if (!confirm('Clear all stock data? This cannot be undone.')) return;
    localStorage.removeItem(STOCK_KEY);
    localStorage.removeItem(META_KEY);
    allRows = []; filtRows = [];
    tbody.innerHTML = '';
    updateStats();
    showEmptyState(true, true);
    if (lastUpdated) lastUpdated.innerHTML = '';
    showToast('Stock data cleared.', 'warning');
}
