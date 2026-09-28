import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@novalite/ui';
import { App } from './App';
import { ConfigError } from './components/ConfigError';
import { PwaUpdater } from './components/PwaUpdater';
import { AuthProvider } from './lib/auth';
import { queryClient } from './lib/query';
import { isConfigured } from './lib/supabase';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isConfigured ? (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
        <Toaster position="top-center" richColors closeButton />
        <PwaUpdater />
      </QueryClientProvider>
    ) : (
      <ConfigError />
    )}
  </StrictMode>,
);
