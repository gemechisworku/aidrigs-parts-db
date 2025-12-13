/**
 * Configs Page
 * System configuration and settings
 */
import { useState } from 'react';
import PriceTiers from '../reference/PriceTiers';
import Settings from '../settings/Settings';

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
                    <Settings />
                )}

                {activeTab === 'price-tiers' && (
                    <PriceTiers embedded={true} />
                )}
            </div>
        </div>
    );
};

export default Configs;
