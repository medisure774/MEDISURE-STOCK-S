// =============================================
// MEDISURE PLUS — Order Routes
// GET    /api/orders       — get orders (User: own, Admin: all)
// POST   /api/orders       — place order
// PATCH  /api/orders/:id   — update status (Admin)
// GET    /api/orders/export — CSV export (Admin)
// =============================================
const router = require('express').Router();
const { supabase } = require('../supabase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/orders
router.get('/', verifyToken, async (req, res) => {
    try {
        let dbQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });

        if (req.user.role !== 'admin') {
            dbQuery = dbQuery.eq('employee_id', req.user.employee_id);
        }

        const { data, error } = await dbQuery;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// POST /api/orders
router.post('/', verifyToken, async (req, res) => {
    const { items, notes } = req.body; // items is an array of { product_name, company, pack_size, price, qty_requested }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order items are required' });
    }

    try {
        // 1. Validate Stock Availability for ALL items first
        for (const item of items) {
            const { data: stockItem, error: fetchError } = await supabase
                .from('stock')
                .select('product_name, quantity')
                .eq('product_name', item.product_name)
                .single();

            if (fetchError || !stockItem) {
                return res.status(404).json({ error: `Product "${item.product_name}" not found in stock.` });
            }

            if (stockItem.quantity < item.qty_requested) {
                return res.status(400).json({ error: 'Insufficient stock available.' });
            }
        }

        // 2. Prepare order data
        const orderItems = items.map(item => ({
            employee_id: req.user.employee_id,
            employee_name: req.user.name,
            product_name: item.product_name,
            company: item.company || '',
            pack_size: item.pack_size || '',
            price: item.price || 0,
            quantity: item.qty_requested,
            notes: notes || '',
            status: 'pending'
        }));

        // 3. Insert into orders table
        const { error: insertError } = await supabase.from('orders').insert(orderItems);
        if (insertError) throw insertError;

        // 4. Deduct quantity from stock table
        // We do this after successful order insertion
        for (const item of items) {
            const { error: updateError } = await supabase.rpc('decrement_stock', {
                p_name: item.product_name,
                p_amount: item.qty_requested
            });

            // If RPC is not available, we use a standard update
            if (updateError) {
                console.warn('[ORDERS] RPC decrement failed, falling back to standard update:', updateError.message);
                
                // Fallback: Fetch latest again to be safe and update
                const { data: current } = await supabase
                    .from('stock')
                    .select('quantity')
                    .eq('product_name', item.product_name)
                    .single();
                
                const newQty = Math.max(0, (current?.quantity || 0) - item.qty_requested);
                
                await supabase
                    .from('stock')
                    .update({ quantity: newQty })
                    .eq('product_name', item.product_name);
            }
        }

        res.status(201).json({ success: true, message: 'Order placed successfully and stock updated.' });
    } catch (err) {
        console.error('Error processing order:', err);
        res.status(500).json({ error: 'Failed to place order: ' + err.message });
    }
});

// PATCH /api/orders/:id
router.patch('/:id', requireAdmin, async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    try {
        const { data, error } = await supabase
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Order not found' });

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Failed to update status: ' + err.message });
    }
});

// GET /api/orders/export (CSV)
router.get('/export', requireAdmin, async (req, res) => {
    try {
        const { data: rows, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        let csv = 'Order ID,Date,Employee,Product,Company,Pack,Price,Qty,Status,Notes\n';
        rows.forEach(r => {
            const row = [
                r.id,
                r.created_at,
                `"${r.employee_name}"`,
                `"${r.product_name}"`,
                `"${r.company}"`,
                `"${r.pack_size}"`,
                r.price,
                r.quantity,
                r.status,
                `"${r.notes || ''}"`
            ];
            csv += row.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=medisure_orders.csv');
        res.status(200).send(csv);
    } catch (err) {
        console.error('Error exporting orders:', err);
        res.status(500).json({ error: 'Failed to export orders' });
    }
});

module.exports = router;

