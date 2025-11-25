/**
 * Permissions Page
 * Manage system permissions
 */
const Permissions = () => {
    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Permissions Management</h1>
                    <p className="text-gray-600">Configure granular permissions for resources and actions</p>
                </div>

                {/* Coming Soon Card */}
                <div className="card">
                    <div className="text-center py-12">
                        <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Permission Management</h3>
                        <p className="text-gray-600 mb-6">This feature is under development</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                            <h4 className="font-medium text-blue-900 mb-2">Upcoming Features:</h4>
                            <ul className="text-left text-sm text-blue-800 space-y-1">
                                <li>• View all system permissions</li>
                                <li>• Permission matrix (Resource × Action)</li>
                                <li>• Assign permissions to roles</li>
                                <li>• Create custom permissions</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Permissions;
