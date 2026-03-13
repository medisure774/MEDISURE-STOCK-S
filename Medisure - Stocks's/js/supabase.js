// =============================================
// MEDISURE STOCK — SUPABASE CONFIG
// =============================================

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://tnyjsxwzonpkkqebqkqf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u5E73J1Eo05AlSKTUjqEJA_YZakDj32';

let supabaseClient = null;

if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    // The Supabase library from CDN defines 'supabase' globally
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.warn('Supabase credentials not set. App will fallback to localStorage.');
}

// Global accessor for the client for use in app.js
window.supabase = supabaseClient;
