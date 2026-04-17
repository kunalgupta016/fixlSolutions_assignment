import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./components/context/AuthContext";
import { Toaster } from "react-hot-toast";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Desktop Sidebar tightly bound and explicitly hidden on mobile breakpoints */}
        <Sidebar className="hidden md:flex shrink-0 min-h-[calc(100vh-4rem)]" />
        
        {/* Mobile Slide-over Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            {/* Blur Backdrop */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            {/* Sliding Sidebar Panel */}
            <div className="relative w-64 h-full bg-white/95 shadow-2xl flex flex-col border-r border-white/40">
               <Sidebar 
                 className="flex-1 w-full bg-transparent min-h-full border-none shadow-none" 
                 onNavigate={() => setIsMobileMenuOpen(false)} 
               />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global Toast Notifications strictly matching our Glass aesthetics */}
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 3000,
            style: {
               background: 'rgba(255, 255, 255, 0.8)',
               backdropFilter: 'blur(10px)',
               color: '#333',
               boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes encapsulated inside our Layout Wrapper */}
          <Route element={<MainLayout />}>
            
            {/* Any authenticated role */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<EmployeeDashboard />} />
            </Route>

            {/* Admin only routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/:tab" element={<AdminDashboard />} />
            </Route>

          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
