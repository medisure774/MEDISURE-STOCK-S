// =============================================
// MEDISURE PLUS — Auth Routes
// POST /api/auth/login
// POST /api/auth/add-employee  (admin only)
// GET  /api/auth/employees     (admin only)
// DELETE /api/auth/employees/:id (admin only)
// =============================================
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../supabase');
const { verifyToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { employee_id, password } = req.body;
    if (!employee_id || !password) {
        return res.status(400).json({ error: 'Employee ID and password are required' });
    }

    try {
        console.log(`[AUTH] Attempting login for: ${employee_id}`);
        const { data: user, error } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', employee_id.trim())
            .single();

        if (error) {
            console.error('[AUTH] Supabase error:', error.message);
            return res.status(401).json({ error: `Connection Error: ${error.message}` });
        }

        if (!user) {
            console.warn(`[AUTH] User not found: "${employee_id.trim()}"`);
            return res.status(401).json({ error: 'Invalid Employee ID (User Not Found)' });
        }

        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) {
            console.warn(`[AUTH] Password mismatch for: "${employee_id.trim()}"`);
            return res.status(401).json({ error: 'Invalid Password' });
        }

        console.log(`[AUTH] Login successful: ${user.name} (${user.role})`);
        const token = jwt.sign(
            { id: user.id, employee_id: user.employee_id, name: user.name, role: user.role },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            token,
            user: { id: user.id, employee_id: user.employee_id, name: user.name, role: user.role }
        });
    } catch (err) {
        console.error('[AUTH] Internal error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/employees (admin: list all employees)
router.get('/employees', requireAdmin, async (req, res) => {
    try {
        const { data: rows, error } = await supabase
            .from('employees')
            .select('id, employee_id, name, role')
            .order('id', { ascending: true });

        if (error) throw error;
        res.json(rows);
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// POST /api/auth/add-employee (admin: add employee)
router.post('/add-employee', requireAdmin, async (req, res) => {
    const { employee_id, name, password, role } = req.body;
    if (!employee_id || !name || !password) {
        return res.status(400).json({ error: 'employee_id, name and password are required' });
    }

    try {
        const { data: existing } = await supabase
            .from('employees')
            .select('id')
            .eq('employee_id', employee_id)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Employee ID already exists' });
        }

        const hash = bcrypt.hashSync(password, 10);
        const { data, error } = await supabase
            .from('employees')
            .insert([{
                employee_id,
                name,
                password: hash,
                role: role || 'employee'
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            id: data.id,
            employee_id: data.employee_id,
            name: data.name,
            role: data.role
        });
    } catch (err) {
        console.error('Error adding employee:', err);
        res.status(500).json({ error: 'Failed to add employee' });
    }
});

// DELETE /api/auth/employees/:id (admin: remove employee)
router.delete('/employees/:id', requireAdmin, async (req, res) => {
    try {
        const { data: emp, error: fetchError } = await supabase
            .from('employees')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError || !emp) return res.status(404).json({ error: 'Employee not found' });
        if (emp.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin account' });

        const { error: deleteError } = await supabase
            .from('employees')
            .delete()
            .eq('id', req.params.id);

        if (deleteError) throw deleteError;
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting employee:', err);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

module.exports = router;

