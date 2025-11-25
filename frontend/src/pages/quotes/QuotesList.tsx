/**
 * Quotes Page
 * Manage customer quotes, cost analysis, and pricing
 */
const QuotesList = () => {
    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotes</h1>
                        <p className="text-gray-600">Manage customer quotes and pricing</p>
                    </div>
                    <button className="btn-primary">
                        + New Quote
                    </button>
                </div>

                {/* Coming Soon Card */}
                <div className="card">
                    <div className="text-center py-12">
                        <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Quote Management</h3>
                        <p className="text-gray-600 mb-6">This feature is under development</p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                            <h4 className="font-medium text-blue-900 mb-2">Upcoming Features:</h4>
                            <ul className="text-left text-sm text-blue-800 space-y-1">
                                <li>• Create and manage customer quotes</li>
                                <li>• Cost analysis and markup calculation</li>
                                <li>• Price management</li>
                                <li>• PDF export and email sending</li>
                                <li>• Quote versioning and history</li>
                                <li>• Quote approval workflow</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotesList;
