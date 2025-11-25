/**
 * Manufacturers List Page
 * Browse and manage manufacturers
 */
const ManufacturersList = () => {
    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manufacturers</h1>
                        <p className="text-gray-600">Browse and manage manufacturer directory</p>
                    </div>
                    <button className="btn-primary">
                        + Add Manufacturer
                    </button>
                </div>

                {/* Coming Soon Card */}
                <div className="card">
                    <div className="text-center py-12">
                        <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Manufacturer Directory</h3>
                        <p className="text-gray-600 mb-6">Full implementation coming soon</p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
                            <h4 className="font-medium text-green-900 mb-2">✓ Backend API Ready:</h4>
                            <ul className="text-left text-sm text-green-800 space-y-1">
                                <li>• View all manufacturers</li>
                                <li>• Create new manufacturers</li>
                                <li>• Edit manufacturer details</li>
                                <li>• Delete manufacturers</li>
                                <li>• Contact information (JSONB)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManufacturersList;
