import React, { useState } from 'react';
import { EntityType, TabConfig } from './types';
import { PartsApprovalsTab } from './components/tabs/PartsApprovalsTab';
import { TranslationsApprovalsTab } from './components/tabs/TranslationsApprovalsTab';
import { HSCodesApprovalsTab } from './components/tabs/HSCodesApprovalsTab';
import { ManufacturersApprovalsTab } from './components/tabs/ManufacturersApprovalsTab';
import { PortsApprovalsTab } from './components/tabs/PortsApprovalsTab';

// Tab registration - adding new approval type is just adding one line here!
const APPROVAL_TABS: TabConfig[] = [
    { id: 'parts', label: 'Parts', component: PartsApprovalsTab },
    { id: 'translations', label: 'Translations', component: TranslationsApprovalsTab },
    { id: 'hscodes', label: 'HS Codes', component: HSCodesApprovalsTab },
    { id: 'manufacturers', label: 'Manufacturers', component: ManufacturersApprovalsTab },
    { id: 'ports', label: 'Ports', component: PortsApprovalsTab },
];

const PendingApprovals: React.FC = () => {
    const [activeTab, setActiveTab] = useState<EntityType>('parts');
    const [tabCounts, setTabCounts] = useState<Record<EntityType, number>>({
        parts: 0,
        translations: 0,
        hscodes: 0,
        manufacturers: 0,
        ports: 0
    });

    const updateCount = (tab: EntityType, count: number) => {
        setTabCounts(prev => ({ ...prev, [tab]: count }));
    };

    const ActiveComponent = APPROVAL_TABS.find(t => t.id === activeTab)?.component;

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
                            {APPROVAL_TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-red-500 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                    {tabCounts[tab.id] > 0 && (
                                        <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-600">
                                            {tabCounts[tab.id]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {ActiveComponent && (
                        <ActiveComponent
                            isActive={true}
                            onCountChange={(count) => updateCount(activeTab, count)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PendingApprovals;
