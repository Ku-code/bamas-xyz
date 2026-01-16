import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Handle GitHub Pages 404.html redirect
if (window.location.search.includes('?/')) {
  const path = window.location.search.replace('?/', '').replace(/~and~/g, '&');
  window.history.replaceState(null, '', path);
}

// Error handling for root rendering
try {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your HTML.');
  }

  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error('Failed to render app:', error);
  
  // Show error message to user
  document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; color: #fff; font-family: system-ui, sans-serif; padding: 20px;">
      <div style="text-align: center; max-width: 600px;">
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #ef4444;">Application Error</h1>
        <p style="margin-bottom: 16px; color: #9ca3af;">Failed to load the application. Please check the browser console for details.</p>
        <p style="margin-bottom: 24px; color: #6b7280; font-size: 14px;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button 
          onclick="window.location.reload()" 
          style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;"
        >
          Reload Page
        </button>
      </div>
    </div>
  `;
}
