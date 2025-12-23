import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import routes from './routes';
import AuthProvider from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { Toaster } from '@/components/ui/toaster';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        {/* Mobile Compatibility Fixes:
          1. min-h-[100dvh]: Uses dynamic viewport height to account for mobile address bars.
          2. w-full: Ensures no horizontal scrolling issues on small screens.
          3. touch-manipulation: Disables double-tap to zoom on some devices for faster clicks.
        */}
        <div className="min-h-[100dvh] w-full bg-background font-sans antialiased touch-manipulation">
          <RouteGuard>
            <Routes>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  element={route.element}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RouteGuard>

          {/* Placed outside RouteGuard so notifications persist during redirects */}
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;