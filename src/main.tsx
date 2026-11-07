import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

// Guard: show a clear message if Supabase env vars are missing (e.g. Vercel
// deployment without environment variables configured).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  container.innerHTML = `
    <div style="font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:16px;padding:24px;text-align:center;background:#f6f8f7">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b42318" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0">Missing Environment Variables</h1>
      <p style="color:#555;max-width:420px;margin:0;line-height:1.6">
        <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> are not set.<br/>
        Go to <strong>Vercel → Project → Settings → Environment Variables</strong> and add them, then redeploy.
      </p>
    </div>`;
} else {
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
