import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Navbar with hamburger menu */}
                <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <Navbar />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    <Outlet />

                    {/* Footer */}
                    <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-auto">
                        <p className="text-sm text-gray-500 text-center">
                            © 2025 AidRigs Parts DB. All rights reserved.
                        </p>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default Layout;
