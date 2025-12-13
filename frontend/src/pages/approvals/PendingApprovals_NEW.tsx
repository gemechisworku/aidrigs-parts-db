import React, { useState } from 'react';
import { PortsApprovalsTab } from './components/tabs/PortsApprovalsTab';

// For now, we're only extracting Ports tab. Other tabs remain in this file temporarily.
type EntityType = 'parts' | 'translations' | 'hscodes' | 'ports';

interface TabCounts {
    parts: number;
    translations: number;
    hscodes: number;
    ports: number;
}

const PendingApprovals: React.FC = () => {
    const [activeTab, setActiveTab] = useState<EntityType>('parts');
    const [tabCounts, setTabCounts] = useState<TabCounts>({
        parts: 0,
        translations: 0,
        hscodes: 0,
        ports: 0
    });

    const updateCount = (tab: EntityType, count: number) => {
        setTabCounts(prev => ({ ...prev, [tab]: count }));
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
                    <p className="text-gray-600 mt-1">Review and approve pending items</p>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('parts')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'parts'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Parts
                                {tabCounts.parts > 0 && (
                                    <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-600">
                                        {tabCounts.parts}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('translations')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'translations'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Translations
                                {tabCounts.translations > 0 && (
                                    <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-600">
                                        {tabCounts.translations}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('hscodes')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'hscodes'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                HS Codes
                                {tabCounts.hscodes > 0 && (
                                    <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-600">
                                        {tabCounts.hscodes}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('ports')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'ports'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Ports
                                {tabCounts.ports > 0 && (
                                    <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-600">
                                        {tabCounts.ports}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'parts' && (
                        <div className="text-center py-12 text-gray-500">
                            Parts tab - To be extracted to modular component
                        </div>
                    )}

                    {activeTab === 'translations' && (
                        <div className="text-center py-12 text-gray-500">
                            Translations tab - To be extracted to modular component
                        </div>
                    )}

                    {activeTab === 'hscodes' && (
                        <div className="text-center py-12 text-gray-500">
                            HS Codes tab - To be extracted to modular component
                        </div>
                    )}

                    {activeTab === 'ports' && (
                        <PortsApprovalsTab
                            isActive={true}
                            onCountChange={(count) => updateCount('ports', count)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PendingApprovals;
