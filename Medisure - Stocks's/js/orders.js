// =============================================
// MEDISURE PLUS — Order & Cart logic
// =============================================

let cart = [];

function addToCart(productId) {
    const product = allStock.find(s => s.id == productId || s.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty_requested += 1;
    } else {
        cart.push({
            id: product.id,
            product_name: product.name,
            company: product.company,
            pack_size: product.pack_size,
            price: product.price,
            qty_requested: 1
        });
    }

    updateCartCount();
    showToast(`Added ${product.name} to cart`);
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.qty_requested, 0);
    document.getElementById('cartCount').textContent = count;
}

function renderCart() {
    const container = document.getElementById('cartItems');
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:#64748b;">Your cart is empty.</p>';
        document.getElementById('placeOrderBtn').disabled = true;
        return;
    }

    document.getElementById('placeOrderBtn').disabled = false;
    container.innerHTML = cart.map((item, idx) => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; border-bottom:1px solid #f1f5f9;">
            <div>
                <div style="font-weight:600; font-size:0.95rem;">${item.product_name}</div>
                <div style="font-size:0.8rem; color:#64748b;">${item.company} | ${item.pack_size}</div>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="display:flex; align-items:center; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden;">
                    <button onclick="updateQty(${idx}, -1)" style="border:none; background:#f8fafc; padding:4px 10px; cursor:pointer;">-</button>
                    <span style="padding:4px 12px; min-width:30px; text-align:center; font-weight:600;">${item.qty_requested}</span>
                    <button onclick="updateQty(${idx}, 1)" style="border:none; background:#f8fafc; padding:4px 10px; cursor:pointer;">+</button>
                </div>
                <button onclick="removeItem(${idx})" style="color:#b91c1c; background:none; border:none; cursor:pointer; font-size:1.2rem;">✕</button>
            </div>
        </div>
    `).join('');
}

function updateQty(idx, delta) {
    cart[idx].qty_requested += delta;
    if (cart[idx].qty_requested < 1) cart[idx].qty_requested = 1;
    renderCart();
    updateCartCount();
}

function removeItem(idx) {
    cart.splice(idx, 1);
    renderCart();
    updateCartCount();
}

async function submitOrder() {
    const btn = document.getElementById('placeOrderBtn');
    const notes = document.getElementById('orderNotes').value;

    btn.disabled = true;
    btn.textContent = 'Placing Order...';

    try {
        await api.post('/orders', { items: cart, notes });
        showToast('Order placed successfully!', 'success');
        cart = [];
        updateCartCount();
        closeCart();
        document.getElementById('orderNotes').value = '';
        loadMyOrders(); // Refresh order history view
    } catch (err) {
        showToast('Failed to place order: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Place Order';
    }
}

async function loadMyOrders() {
    const tbody = document.getElementById('ordersTbody');
    const countEl = document.getElementById('orderCount');
    if (!tbody) return;

    try {
        const orders = await api.get('/orders');
        countEl.textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">No orders placed yet.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const statusClass = `badge-${order.status.toLowerCase()}`;
            const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            const time = new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            return `
                <tr class="fade-in">
                    <td><div style="font-weight:500;">${date}</div><small style="color:#64748b;">${time}</small></td>
                    <td>
                        <div style="font-weight:600;">${order.product_name}</div>
                        <small style="color:#64748b;">${order.company || ''}</small>
                    </td>
                    <td><strong>${order.qty_requested}</strong></td>
                    <td><span class="badge ${statusClass}">${order.status}</span></td>
                    <td><small style="color:#64748b;">${new Date(order.updated_at).toLocaleDateString('en-IN')}</small></td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Failed to load orders:', err);
    }
}

window.addToCart = addToCart;
window.updateQty = updateQty;
window.removeItem = removeItem;
window.submitOrder = submitOrder;
window.loadMyOrders = loadMyOrders;
