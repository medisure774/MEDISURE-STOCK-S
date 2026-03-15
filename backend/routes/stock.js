// =============================================
// MEDISURE PLUS — Stock Routes
// GET  /api/stock           — get all stock
// POST /api/stock/upload    — upload PDF, parse, store (admin)
// DELETE /api/stock         — clear all stock (admin)
// =============================================
const router = require('express').Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { supabase } = require('../supabase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Multer: store PDF in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are accepted'));
        }
    }
});

// GET /api/stock
router.get('/', verifyToken, async (req, res) => {
    try {
        const { query, search } = req.query;
        let dbQuery = supabase.from('stock').select('*').order('product_name', { ascending: true });

        if (search) {
            dbQuery = dbQuery.ilike('product_name', `%${search}%`);
        }

        const { data, error } = await dbQuery;

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching stock:', err);
        res.status(500).json({ error: 'Failed to fetch stock' });
    }
});

// DELETE /api/stock (clear all — admin)
router.delete('/', requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('stock').delete().not('product_name', 'is', 'null'); // Delete all rows
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Error clearing stock:', err);
        res.status(500).json({ error: 'Failed to clear stock' });
    }
});

// POST /api/stock/upload
router.post('/upload', requireAdmin, upload.single('pdf'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });

    try {
        const data = await pdfParse(req.file.buffer);
        const text = data.text;

        if (!text || text.trim().length === 0) {
            return res.status(422).json({ error: 'No text found in PDF. Use a text-based (not scanned) PDF.' });
        }

        const rows = parsePdfText(text, req.file.originalname);
        if (rows.length === 0) {
            return res.status(422).json({ error: 'Could not extract stock items from this PDF. Check the format.' });
        }

        // 1. Clear previous stock - Use a type-neutral filter to avoid UUID vs BigInt issues
        console.log('[STOCK] Clearing existing stock table...');
        const { error: deleteError } = await supabase.from('stock').delete().not('product_name', 'is', 'null');
        if (deleteError) {
            console.error('[STOCK] Delete error:', deleteError);
            throw new Error(`Failed to clear old stock: ${deleteError.message}`);
        }

        // 2. Prepare data for Supabase
        const stockItems = rows.map((r) => ({
            product_name: r.name || '',
            company: r.company || '',
            pack_size: r.pack_size || '',
            price: r.price || null,
            sku: r.sku || '',
            category: r.category || '',
            quantity: r.qty || 0,
            unit: r.unit || '',
            status: r.status || autoStatus(r.qty || 0)
        }));

        console.log(`[STOCK] Inserting ${stockItems.length} items...`);

        // 3. Bulk insert into Supabase
        const CHUNK_SIZE = 1000;
        for (let i = 0; i < stockItems.length; i += CHUNK_SIZE) {
            const chunk = stockItems.slice(i, i + CHUNK_SIZE);
            const { error: insertError } = await supabase.from('stock').insert(chunk);
            if (insertError) {
                console.error('[STOCK] Insert error at chunk', i, ':', insertError);
                throw new Error(`Failed to insert stock: ${insertError.message}`);
            }
        }

        console.log('[STOCK] Upload completed successfully');
        res.json({
            success: true,
            count: stockItems.length,
            fileName: req.file.originalname,
            uploadedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('[STOCK] Upload error details:', err);
        res.status(500).json({ error: 'Processing failed: ' + err.message });
    }
});

// Keep existing parsing logic (parsePdfText, splitLine, detectColumns, autoStatus)
function parsePdfText(text, fileName) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const headerKeywords = ['name', 'product', 'item', 'medicine', 'drug', 'qty', 'quantity', 'stock', 'balance', 'sku', 'code', 'company', 'pack', 'price', 'mrp', 'category', 'description', 'particulars'];

    let headerIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 40); i++) {
        const lc = lines[i].toLowerCase();
        const hits = headerKeywords.filter(kw => lc.includes(kw)).length;
        if (hits >= 2) { headerIdx = i; break; }
    }

    if (headerIdx === -1) {
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            if (!/date|invoice|page|bill|statement|medisure/i.test(lines[i])) {
                headerIdx = i;
                break;
            }
        }
    }
    if (headerIdx === -1) headerIdx = 0;

    const headerLine = lines[headerIdx];
    const headers = splitLine(headerLine);
    const colMap = detectColumns(headers);

    const rows = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^page\s*\d+$/i.test(line)) continue;
        if (/^(total|subtotal|grand total)/i.test(line)) continue;
        if (/s\.?no\.?|product\s*name|company|qty|price|mrp/i.test(line)) continue;

        const cells = splitLine(line);
        if (cells.length < 2) continue;

        // Implement "Final numeric value as quantity" rule
        // Paracetamol 500 10's Tab 120 -> name: "Paracetamol 500 10's Tab", qty: 120
        const rowText = line.trim();
        const parts = rowText.split(/\s+/);
        
        let qty = 0;
        let name = '';
        let price = null;
        let company = '';

        // Check if the last part is a number
        const lastPart = parts[parts.length - 1];
        if (!isNaN(lastPart) && lastPart.length > 0) {
            qty = parseFloat(lastPart);
            // Everything else is name (unless we have structured columns)
            // But requirement 3 says: final numeric value as quantity
            name = parts.slice(0, parts.length - 1).join(' ');
        } else {
            // Fallback to colMap if simple split fails
            const get = (key) => {
                const idx = colMap[key];
                if (idx === undefined || idx >= cells.length) return '';
                return (cells[idx] || '').trim();
            };
            name = get('name');
            qty = parseFloat(get('qty').replace(/[^\d.]/g, '')) || 0;
        }

        // Refine name/company if colMap is available and useful
        if (colMap.company !== undefined) company = cells[colMap.company] || '';
        if (colMap.price !== undefined) price = parseFloat(cells[colMap.price]?.replace(/[^\d.]/g, '')) || null;

        if (!name || name.length < 2) continue;

        rows.push({
            name,
            company,
            pack_size: '', // Pack size often included in name as per req
            price,
            sku: '',
            category: '',
            qty,
            unit: '',
            status: autoStatus(qty),
        });
    }

    return rows;
}

function splitLine(line) {
    return line.split(/\t|  +/).map(s => s.trim()).filter(s => s.length > 0);
}

function detectColumns(headers) {
    const map = {};
    const n = s => s.toLowerCase().replace(/[\s_\-\.]/g, '');
    headers.forEach((h, i) => {
        const norm = n(h);
        if (map.name === undefined && (norm.includes('name') || norm.includes('product') || norm.includes('item') || norm.includes('medicine') || norm.includes('drug') || norm.includes('description'))) map.name = i;
        if (map.company === undefined && (norm.includes('company') || norm.includes('brand') || norm.includes('mfg') || norm.includes('manufacturer'))) map.company = i;
        if (map.pack === undefined && (norm.includes('pack') || norm.includes('packing') || norm.includes('size') || norm.includes('uom'))) map.pack = i;
        if (map.price === undefined && (norm.includes('price') || norm.includes('mrp') || norm.includes('rate') || norm.includes('cost'))) map.price = i;
        if (map.qty === undefined && (norm.includes('qty') || norm.includes('quantity') || norm.includes('stock') || norm.includes('balance') || norm.includes('avail'))) map.qty = i;
        if (map.sku === undefined && (norm.includes('sku') || norm.includes('code') || norm.includes('itemno'))) map.sku = i;
        if (map.cat === undefined && (norm.includes('cat') || norm.includes('group') || norm.includes('type') || norm.includes('dept'))) map.cat = i;
        if (map.unit === undefined && (norm.includes('unit') || norm.includes('uom'))) map.unit = i;
        if (map.status === undefined && (norm.includes('status') || norm.includes('avail'))) map.status = i;
    });
    return map;
}

function autoStatus(qty) {
    if (qty <= 0) return 'Out of Stock';
    if (qty <= 10) return 'Low Stock';
    return 'In Stock';
}

module.exports = router;

