/**
 * Change Requests Page
 * View and manage all change requests
 */
const ChangeRequests = () => {
    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Change Requests</h1>
                    <p className="text-gray-600">View and approve change requests from all users</p>
                </div>

                {/* Coming Soon Card */}
                <div className="card">
                    <div className="text-center py-12">
                        <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Change Request Management</h3>
                        <p className="text-gray-600 mb-6">This feature is under development</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                            <h4 className="font-medium text-blue-900 mb-2">Upcoming Features:</h4>
                            <ul className="text-left text-sm text-blue-800 space-y-1">
                                <li>• View all pending change requests</li>
                                <li>• Approve or reject requests</li>
                                <li>• Filter by type, status, and date</li>
                                <li>• Request history and audit trail</li>
                                <li>• Email notifications</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangeRequests;
