// =============================================
// MEDISURE PLUS — API Client
// =============================================

// Hardcoded for local dev. In production, Vercel can set this via env
// or we can detect the production URL.
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://medisure-api-v1nt.onrender.com/api';

const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

        // Add auth header if token exists
        const token = localStorage.getItem('medisure_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });

            // Handle 401 Unauthorized (auto logout)
            if (response.status === 401 && !url.includes('/auth/login')) {
                auth.logout();
                return;
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            return data;
        } catch (err) {
            console.error(`API Error (${endpoint}):`, err);
            throw err;
        }
    },

    get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
    patch(endpoint, body) { return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },

    // Special method for file uploads
    async upload(endpoint, file) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('medisure_token');

        const formData = new FormData();
        formData.append('pdf', file);

        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload failed');
        return data;
    }
};

window.api = api;
