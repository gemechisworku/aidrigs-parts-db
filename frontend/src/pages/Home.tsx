import { Link } from 'react-router-dom'

function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-primary-600">AidRigs</h1>
                        </div>
                        <div className="flex space-x-4">
                            <Link to="/login" className="btn-primary">
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        International Auto-Parts Database
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Comprehensive parts management system with multi-language support,
                        dynamic RBAC, pricing engine, and advanced analytics.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <Link to="/login" className="btn-primary text-lg px-8 py-3">
                            Get Started
                        </Link>
                        <Link to="/dashboard" className="btn-secondary text-lg px-8 py-3">
                            View Demo
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="card text-center">
                        <div className="text-4xl mb-4">🔧</div>
                        <h3 className="text-xl font-semibold mb-2">Parts Management</h3>
                        <p className="text-gray-600">
                            Approval-based CRUD with multi-language translations
                        </p>
                    </div>
                    <div className="card text-center">
                        <div className="text-4xl mb-4">🔐</div>
                        <h3 className="text-xl font-semibold mb-2">Dynamic RBAC</h3>
                        <p className="text-gray-600">
                            Role-based access control with granular permissions
                        </p>
                    </div>
                    <div className="card text-center">
                        <div className="text-4xl mb-4">💰</div>
                        <h3 className="text-xl font-semibold mb-2">Pricing Engine</h3>
                        <p className="text-gray-600">
                            Advanced pricing with quote history and analytics
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home
