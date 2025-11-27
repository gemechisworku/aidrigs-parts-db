/**
 * Configs Page
 * System configuration and settings
 */
import { useState } from 'react';
import PriceTiers from '../reference/PriceTiers';

const Configs = () => {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">System Configuration</h1>
                    <p className="text-gray-600">Manage system settings and features</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`${activeTab === 'general'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            General Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('price-tiers')}
                            className={`${activeTab === 'price-tiers'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Price Tiers
                        </button>
                    </nav>
                </div>

                {/* Content */}
                {activeTab === 'general' && (
                    <div className="card">
                        <div className="text-center py-12">
                            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">System Configuration</h3>
                            <p className="text-gray-600 mb-6">This feature is under development</p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                                <h4 className="font-medium text-blue-900 mb-2">Upcoming Features:</h4>
                                <ul className="text-left text-sm text-blue-800 space-y-1">
                                    <li>• Application settings (timeouts, limits, etc.)</li>
                                    <li>• Feature toggles</li>
                                    <li>• Email configuration</li>
                                    <li>• Backup and restore settings</li>
                                    <li>• Logging and monitoring</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'price-tiers' && (
                    <PriceTiers embedded={true} />
                )}
            </div>
        </div>
    );
};

export default Configs;
