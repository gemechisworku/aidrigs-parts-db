/**
 * Dashboard Page with Auth Integration
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi, DashboardStats } from '../services/dashboardApi';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await dashboardApi.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const StatCard = ({ title, value, icon, color, subValue }: { title: string, value: number | string, icon: JSX.Element, color: string, subValue?: string }) => (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
                        {icon}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd>
                                <div className="text-lg font-medium text-gray-900">{value}</div>
                                {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );

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

                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Parts"
                        value={loading ? '...' : (stats?.total_parts || 0)}
                        icon={
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        }
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Translations"
                        value={loading ? '...' : (stats?.total_translations || 0)}
                        subValue={loading ? '' : `${stats?.pending_translations || 0} pending review`}
                        icon={
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                        }
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Manufacturers"
                        value={loading ? '...' : (stats?.total_manufacturers || 0)}
                        icon={
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        }
                        color="bg-purple-500"
                    />
                    <StatCard
                        title="Pending Approvals"
                        value={loading ? '...' : (stats?.pending_approvals || 0)}
                        icon={
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        color="bg-yellow-500"
                    />
                </div>

                {/* Quick Actions & Links */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Quick Actions */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => navigate('/parts')}
                                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex-shrink-0 bg-red-100 rounded-full p-2 group-hover:bg-red-200">
                                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="text-sm font-medium text-gray-900">Parts Catalog</p>
                                        <p className="text-xs text-gray-500">Browse and manage parts</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate('/translation')}
                                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex-shrink-0 bg-green-100 rounded-full p-2 group-hover:bg-green-200">
                                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                        </svg>
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="text-sm font-medium text-gray-900">Standardize Names</p>
                                        <p className="text-xs text-gray-500">Review and merge translations</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate('/manufacturers')}
                                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex-shrink-0 bg-purple-100 rounded-full p-2 group-hover:bg-purple-200">
                                        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="text-sm font-medium text-gray-900">Manage Manufacturers</p>
                                        <p className="text-xs text-gray-500">Add or edit manufacturers</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate('/admin/approvals')}
                                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex-shrink-0 bg-yellow-100 rounded-full p-2 group-hover:bg-yellow-200">
                                        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="text-sm font-medium text-gray-900">Pending Approvals</p>
                                        <p className="text-xs text-gray-500">Review submitted items</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Important Links & Resources */}
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow rounded-lg p-6 h-full">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
                            <ul className="space-y-4">
                                <li>
                                    <button
                                        onClick={() => navigate('/user-guide')}
                                        className="flex items-start text-left group"
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            <svg className="h-5 w-5 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 group-hover:text-red-600">User Guide</p>
                                            <p className="text-xs text-gray-500">Comprehensive documentation on how to use the system.</p>
                                        </div>
                                    </button>
                                </li>
                                <li>
                                    <a href="#" className="flex items-start text-left group">
                                        <div className="flex-shrink-0 mt-1">
                                            <svg className="h-5 w-5 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 group-hover:text-red-600">Support</p>
                                            <p className="text-xs text-gray-500">Contact the technical team for assistance.</p>
                                        </div>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
