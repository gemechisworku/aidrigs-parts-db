/**
 * My Requests Page
 * View user's own submitted requests
 */
import { useAuth } from '../../contexts/AuthContext';

const MyRequests = () => {
    const { user } = useAuth();

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Requests</h1>
                    <p className="text-gray-600">Track your submitted change requests</p>
                </div>

                {/* Coming Soon Card */}
                <div className="card">
                    <div className="text-center py-12">
                        <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Requests</h3>
                        <p className="text-gray-600 mb-6">Logged in as: <span className="font-medium">{user?.email}</span></p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                            <h4 className="font-medium text-blue-900 mb-2">Upcoming Features:</h4>
                            <ul className="text-left text-sm text-blue-800 space-y-1">
                                <li>• View your submitted requests</li>
                                <li>• Track approval status</li>
                                <li>• Edit pending requests</li>
                                <li>• Request history</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyRequests;
