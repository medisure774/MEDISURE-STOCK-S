// =============================================
// MEDISURE PLUS — Admin Dashboard Logic
// =============================================

let allOrders = [];

async function loadAllOrders() {
    try {
        allOrders = await api.get('/orders');
        renderAdminOrders(allOrders);
        updateOrderStats();
    } catch (err) {
        showToast('Failed to load orders: ' + err.message, 'error');
    }
}

function renderAdminOrders(list) {
    const tbody = document.getElementById('adminOrdersTbody');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">No orders found.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(order => {
        const statusClass = `badge-${order.status.toLowerCase()}`;
        const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

        return `
            <tr class="fade-in">
                <td><small>${date}</small></td>
                <td><strong>${esc(order.employee_name)}</strong><br/><small>${order.employee_id}</small></td>
                <td>
                    <div style="font-weight:600;">${esc(order.product_name)}</div>
                    <small style="color:#64748b;">${esc(order.company)} | ${esc(order.pack_size)}</small>
                </td>
                <td><strong>${order.qty_requested}</strong></td>
                <td><span class="badge ${statusClass}">${order.status}</span></td>
                <td>
                    <select class="filter-select" style="padding:4px; font-size:0.75rem;" onchange="updateStatus('${order.id}', this.value)">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Approved" ${order.status === 'Approved' ? 'selected' : ''}>Approve</option>
                        <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Complete</option>
                        <option value="Rejected" ${order.status === 'Rejected' ? 'selected' : ''}>Reject</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAdminOrders() {
    const q = document.getElementById('orderSearch').value.toLowerCase();
    const filtered = allOrders.filter(o =>
        o.employee_name.toLowerCase().includes(q) ||
        o.employee_id.toLowerCase().includes(q) ||
        o.product_name.toLowerCase().includes(q)
    );
    renderAdminOrders(filtered);
}

async function updateStatus(orderId, newStatus) {
    try {
        await api.patch(`/orders/${orderId}`, { status: newStatus });
        showToast(`Order marked as ${newStatus}`);
        loadAllOrders();
    } catch (err) {
        showToast('Update failed: ' + err.message, 'error');
    }
}

function updateOrderStats() {
    document.getElementById('countTotal').textContent = allOrders.length;
    document.getElementById('countPending').textContent = allOrders.filter(o => o.status === 'Pending').length;
    document.getElementById('countApproved').textContent = allOrders.filter(o => o.status === 'Approved').length;
}

// --- Stock Upload ---
async function handleUpload(file) {
    if (!file) return;
    const progress = document.getElementById('uploadProgress');
    const pText = document.getElementById('pText');
    const pBar = document.getElementById('pBar');

    progress.style.display = 'block';
    pText.textContent = `Uploading ${file.name}...`;
    pBar.value = 30;

    try {
        const data = await api.upload('/stock/upload', file);
        pBar.value = 100;
        pText.textContent = `Successfully loaded ${data.count} items.`;
        showToast(`Stock updated: ${data.count} items`, 'success');

        // Refresh preview and stats
        loadStock();

        setTimeout(() => {
            progress.style.display = 'none';
        }, 2000);
    } catch (err) {
        showToast('Upload failed: ' + err.message, 'error');
        pText.textContent = 'Failed to upload.';
        pBar.value = 0;
    }
}

async function clearAllStock() {
    if (!confirm('Are you sure you want to PERMANENTLY delete all stock data?')) return;
    try {
        await api.delete('/stock');
        showToast('All stock data cleared', 'warning');
        loadStock();
    } catch (err) {
        showToast('Clear failed: ' + err.message, 'error');
    }
}

async function exportOrders() {
    try {
        const token = auth.getToken();
        const response = await fetch(`${window.api_base_url || 'https://medisure-api.onrender.com/api'}/orders/export`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medisure_orders_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (err) {
        showToast('Export failed', 'error');
    }
}

// --- Employee Mgmt ---
async function loadEmployees() {
    const tbody = document.getElementById('employeeTbody');
    if (!tbody) return;
    try {
        const emps = await api.get('/auth/employees');
        tbody.innerHTML = emps.map(e => `
            <tr>
                <td><code>${e.employee_id}</code></td>
                <td><strong>${esc(e.name)}</strong></td>
                <td><span class="header-badge ${e.role}">${e.role.toUpperCase()}</span></td>
                <td>
                    ${e.role !== 'admin' ? `<button class="btn btn-ghost" style="color:#991b1b" onclick="delEmployee(${e.id})">Delete</button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}

async function saveEmployee(e) {
    e.preventDefault();
    const employee_id = document.getElementById('newEmpId').value;
    const name = document.getElementById('newEmpName').value;
    const password = document.getElementById('newEmpPass').value;

    try {
        await api.post('/auth/add-employee', { employee_id, name, password, role: 'employee' });
        showToast('Employee registered');
        document.getElementById('empModal').style.display = 'none';
        loadEmployees();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function delEmployee(id) {
    if (!confirm('Delete this employee account?')) return;
    try {
        await api.delete(`/auth/employees/${id}`);
        showToast('Account removed');
        loadEmployees();
    } catch (err) { showToast(err.message, 'error'); }
}

window.loadAllOrders = loadAllOrders;
window.filterAdminOrders = filterAdminOrders;
window.updateStatus = updateStatus;
window.handleUpload = handleUpload;
window.clearAllStock = clearAllStock;
window.exportOrders = exportOrders;
window.loadEmployees = loadEmployees;
window.saveEmployee = saveEmployee;
window.delEmployee = delEmployee;
