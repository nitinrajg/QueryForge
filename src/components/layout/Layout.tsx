import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/**
 * Root application layout.
 * Provides sticky header, dynamic route content via <Outlet />, and responsive footer.
 */
export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFF] dark:bg-[#0B1020] text-[#0F172A] dark:text-[#E6E9F5] transition-colors duration-200">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

