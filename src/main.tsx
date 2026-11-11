import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.js';
import { AuthProvider } from './shared/context/AuthContext.js';
import { ThemeProvider } from './shared/context/ThemeContext.js';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
    <StrictMode>
        <ThemeProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
    </StrictMode>
);
