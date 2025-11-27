import React, { useState, useEffect } from 'react';
import { partsAPI } from '../../services/partsApi';
import { Part } from '../../types/parts';
import PartPricing from './PartPricing';

interface PartDetailContentProps {
    partId: string;
    onClose?: () => void;
}

const PartDetailContent: React.FC<PartDetailContentProps> = ({ partId, onClose }) => {
    const [part, setPart] = useState<Part | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => {
        fetchPart(partId);
    }, [partId]);

    const fetchPart = async (id: string) => {
        setIsLoading(true);
        try {
            const data = await partsAPI.getPart(id);
            setPart(data);
        } catch (error) {
            console.error('Error fetching part:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading part details...</p>
            </div>
        );
    }

    if (!part) {
        return (
            <div className="text-center py-12 text-gray-500">
                Part not found
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4">
                <h3 className="text-xl font-bold text-gray-900">
                    {part.part_id}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                    {part.part_translation?.part_name_en || part.part_name_en || part.designation || 'No name'}
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`${activeTab === 'details'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`${activeTab === 'pricing'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                    >
                        Pricing
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="pt-4 max-h-[60vh] overflow-y-auto">
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
                            <dl className="grid grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Part ID</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{part.part_id}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Designation</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{part.designation || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Manufacturer</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{part.manufacturer?.mfg_name || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Part Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {part.part_translation?.part_name_en || part.part_name_en || '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Position</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{part.position?.position_en || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Drive Side</dt>
                                    <dd className="mt-1">
                                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                                            {part.drive_side || 'NA'}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">MOQ</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{part.moq || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500">Weight</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {part.weight ? `${part.weight} kg` : '-'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Dimensions */}
                        {(part.width || part.length || part.height) && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Dimensions</h4>
                                <dl className="grid grid-cols-3 gap-4">
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500">Width</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{part.width ? `${part.width} cm` : '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500">Length</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{part.length ? `${part.length} cm` : '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500">Height</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{part.height ? `${part.height} cm` : '-'}</dd>
                                    </div>
                                </dl>
                            </div>
                        )}

                        {/* Note */}
                        {part.note && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Note</h4>
                                <p className="text-sm text-gray-600">{part.note}</p>
                            </div>
                        )}

                        {/* Image */}
                        {part.image_url && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Image</h4>
                                <img
                                    src={part.image_url}
                                    alt={part.part_id}
                                    className="max-w-md rounded border border-gray-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'pricing' && (
                    <PartPricing partId={part.part_id} />
                )}
            </div>
        </div>
    );
};

export default PartDetailContent;
