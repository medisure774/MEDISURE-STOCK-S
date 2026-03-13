// =============================================
// MEDISURE PLUS — Stock Management (Frontend)
// =============================================

let allStock = [];
let filteredStock = [];

async function loadStock() {
    try {
        allStock = await api.get('/stock');
        applyFilters();
        updateStockStats();
    } catch (err) {
        showToast('Failed to load stock: ' + err.message, 'error');
    }
}

function applyFilters() {
    const searchEl = document.getElementById('stockSearch');
    const filterEl = document.getElementById('stockFilter');

    const query = searchEl ? searchEl.value.toLowerCase() : '';
    const status = filterEl ? filterEl.value : '';

    filteredStock = allStock.filter(item => {
        const matchesQuery = !query ||
            item.name.toLowerCase().includes(query) ||
            (item.company && item.company.toLowerCase().includes(query)) ||
            (item.category && item.category.toLowerCase().includes(query));

        const matchesStatus = !status || item.status === status;

        return matchesQuery && matchesStatus;
    });

    renderStockTable();
}

function renderStockTable() {
    const tbody = document.getElementById('stockTbody');
    if (!tbody) return;

    if (filteredStock.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">No matching products found.</td></tr>';
        return;
    }

    tbody.innerHTML = filteredStock.map(item => {
        const statusClass = item.status === 'In Stock' ? 'badge-in' : (item.status === 'Low Stock' ? 'badge-low' : 'badge-out');
        const qtyClass = item.qty > 10 ? 'qty-high' : (item.qty > 0 ? 'qty-mid' : 'qty-zero');

        return `
            <tr class="fade-in">
                <td><strong>${esc(item.name)}</strong></td>
                <td>${esc(item.company || '—')}</td>
                <td><small>${esc(item.pack_size || '—')}</small></td>
                <td>${item.price ? `₹${item.price}` : '—'}</td>
                <td><span class="qty-chip ${qtyClass}">${item.qty} ${esc(item.unit || '')}</span></td>
                <td><span class="badge ${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="addToCart('${item.id}')" ${item.qty <= 0 ? 'disabled' : ''}>
                        ＋ Add
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStockStats() {
    const statsTotal = document.getElementById('statsTotal');
    if (statsTotal) {
        statsTotal.textContent = allStock.length;
    }
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function showToast(msg, type = 'success') {
    const wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

// Global exposure
window.loadStock = loadStock;
window.applyFilters = applyFilters;
window.showToast = showToast;
