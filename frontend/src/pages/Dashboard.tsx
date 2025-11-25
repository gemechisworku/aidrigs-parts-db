/**
 * Dashboard Page with Auth Integration
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    useEffect(() => {
        // Check API status
        fetch('/api/v1/')
            .then(res => res.ok ? setApiStatus('online') : setApiStatus('offline'))
            .catch(() => setApiStatus('offline'));
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Aid<span className="text-red-600">Rigs</span> Dashboard
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Welcome back, {user?.first_name || user?.username}!
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn-outline"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* User Info Card */}
                <div className="card mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-2xl font-bold text-red-600">
                                {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {user?.first_name} {user?.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">@{user?.username}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                        {user?.is_superuser && (
                            <span className="badge badge-primary">Admin</span>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* API Status */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">API Status</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {apiStatus === 'checking' ? '...' : apiStatus === 'online' ? 'Online' : 'Offline'}
                                </p>
                            </div>
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${apiStatus === 'online' ? 'bg-green-100' : 'bg-gray-100'
                                }`}>
                                <div className={`h-3 w-3 rounded-full ${apiStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                    }`}></div>
                            </div>
                        </div>
                    </div>

                    {/* Parts */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Parts</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Quotes */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Quotes</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Orders */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Open Orders</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate('/parts/new')}
                            className="btn-primary"
                        >
                            Add New Part
                        </button>
                        <button
                            onClick={() => navigate('/parts')}
                            className="btn-outline"
                        >
                            View All Parts
                        </button>
                        <button className="btn-secondary">
                            View Reports
                        </button>
                    </div>
                </div>

                {/* Parts Management Section */}
                <div className="card mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Parts Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate('/parts')}
                            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                        >
                            <div className="text-center">
                                <svg className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <p className="text-sm font-medium text-gray-900">View Parts</p>
                                <p className="text-xs text-gray-500 mt-1">Browse and search parts</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/parts/new')}
                            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                        >
                            <div className="text-center">
                                <svg className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <p className="text-sm font-medium text-gray-900">Add Part</p>
                                <p className="text-xs text-gray-500 mt-1">Create a new part entry</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/categories')}
                            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                        >
                            <div className="text-center">
                                <svg className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <p className="text-sm font-medium text-gray-900">Categories</p>
                                <p className="text-xs text-gray-500 mt-1">Manage part categories</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        More features coming soon in Phase 4: Parts Management
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
