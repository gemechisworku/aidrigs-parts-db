import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

interface HealthStatus {
    status: string
    service: string
    version: string
}

function Dashboard() {
    const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch health status from backend
        fetch('/api/v1/')
            .then((res) => res.json())
            .then((data) => {
                setHealthStatus(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error('Failed to fetch health status:', err)
                setLoading(false)
            })
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <Link to="/">
                                <h1 className="text-2xl font-bold text-primary-600">AidRigs</h1>
                            </Link>
                            <span className="ml-4 text-gray-500">Dashboard</span>
                        </div>
                        <div className="flex space-x-4">
                            <button className="btn-secondary">Profile</button>
                            <Link to="/login" className="btn-primary">
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-2">
                        Welcome to the AidRigs Parts Database System
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card">
                        <div className="text-sm text-gray-500 mb-1">Total Parts</div>
                        <div className="text-3xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="card">
                        <div className="text-sm text-gray-500 mb-1">Suppliers</div>
                        <div className="text-3xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="card">
                        <div className="text-sm text-gray-500 mb-1">Vehicles</div>
                        <div className="text-3xl font-bold text-gray-900">0</div>
                    </div>
                    <div className="card">
                        <div className="text-sm text-gray-500 mb-1">Quotes</div>
                        <div className="text-3xl font-bold text-gray-900">0</div>
                    </div>
                </div>

                {/* API Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Backend API Status</h2>
                        {loading ? (
                            <p className="text-gray-600">Loading...</p>
                        ) : healthStatus ? (
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    <span className="text-gray-700">Connected</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <div>Service: {healthStatus.service}</div>
                                    <div>Version: {healthStatus.version}</div>
                                    <div>Message: {healthStatus.message}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center text-red-600">
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                <span>Unable to connect to backend</span>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                        <div className="space-y-2">
                            <button className="w-full btn-primary text-left">
                                ➕ Add New Part
                            </button>
                            <button className="w-full btn-secondary text-left">
                                📦 Manage Suppliers
                            </button>
                            <button className="w-full btn-secondary text-left">
                                🚗 Vehicle Catalog
                            </button>
                            <button className="w-full btn-secondary text-left">
                                💰 Create Quote
                            </button>
                        </div>
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="mt-8 card">
                    <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
                    <ul className="space-y-2 text-gray-600">
                        <li>✓ Parts & Translation Management</li>
                        <li>✓ Dynamic RBAC System</li>
                        <li>✓ Supplier Management</li>
                        <li>✓ Vehicle Cross-References</li>
                        <li>✓ Pricing Engine & Quotes</li>
                        <li>✓ Advanced Search & Filtering</li>
                        <li>✓ Audit Logging</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
