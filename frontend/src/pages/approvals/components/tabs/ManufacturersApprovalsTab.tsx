import React, { useState, useEffect } from 'react';
import { partsAPI, Manufacturer, ManufacturerCreate } from '../../../../services/partsApi';
import { countriesAPI, Country } from '../../../../services/countriesApi';
import { approvalsAPI } from '../../../../services/approvalsApi';
import { TabComponentProps } from '../../types';
import { RejectionModal } from '../modals/RejectionModal';

export const ManufacturersApprovalsTab: React.FC<TabComponentProps> = ({
    isActive,
    onCountChange
}) => {
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [loading, setLoading] = useState(false);
    const [rejectingManufacturer, setRejectingManufacturer] = useState<Manufacturer | null>(null);
    const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);
    const [formData, setFormData] = useState<ManufacturerCreate>({
        mfg_id: '',
        mfg_name: '',
        mfg_type: '',
        country: '',
        website: ''
    });

    useEffect(() => {
        if (isActive) {
            loadPendingManufacturers();
            loadCountries();
        }
    }, [isActive]);

    useEffect(() => {
        if (onCountChange) {
            onCountChange(manufacturers.length);
        }
    }, [manufacturers.length]);

    const loadPendingManufacturers = async () => {
        setLoading(true);
        try {
            const allPendingItems = await approvalsAPI.getPendingItems('manufacturer');
            const mfgs = allPendingItems
                .filter((item: any) => item.entity_type === 'manufacturer')
                .map((item: any) => ({
                    id: item.entity_id,
                    mfg_name: item.entity_identifier,
                    ...item.details,
                    approval_status: item.status,
                    submitted_at: item.submitted_at
                }));
            setManufacturers(mfgs);
        } catch (error) {
            console.error('Error loading pending manufacturers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (mfgId: string) => {
        setLoading(true);
        try {
            await partsAPI.approveManufacturer(mfgId);
            await loadPendingManufacturers();
            window.dispatchEvent(new Event('approvalCountChanged'));
            alert('Manufacturer approved successfully!');
        } catch (error: any) {
            console.error('Error approving manufacturer:', error);
            alert(error.response?.data?.detail || 'Failed to approve manufacturer');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!rejectingManufacturer) return;

        try {
            await partsAPI.rejectManufacturer(rejectingManufacturer.id, reason);
            await loadPendingManufacturers();
            window.dispatchEvent(new Event('approvalCountChanged'));
            alert('Manufacturer rejected');
        } catch (error: any) {
            console.error('Error rejecting manufacturer:', error);
            alert(error.response?.data?.detail || 'Failed to reject manufacturer');
            throw error;
        }
    };

    const loadCountries = async () => {
        try {
            const data = await countriesAPI.getCountries();
            setCountries(data);
        } catch (error) {
            console.error('Error loading countries:', error);
        }
    };

    const handleEditManufacturer = (mfg: Manufacturer) => {
        setEditingManufacturer(mfg);
        setFormData({
            mfg_id: mfg.mfg_id,
            mfg_name: mfg.mfg_name,
            mfg_type: mfg.mfg_type || '',
            country: mfg.country || '',
            website: mfg.website || ''
        });
    };

    const handleSaveManufacturer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingManufacturer) return;

        setLoading(true);
        try {
            await partsAPI.updateManufacturer(editingManufacturer.id, formData);
            await loadPendingManufacturers();
            setEditingManufacturer(null);
            alert('Manufacturer updated successfully');
        } catch (error: any) {
            console.error('Error updating manufacturer:', error);
            alert(error.response?.data?.detail || 'Failed to update manufacturer');
        } finally {
            setLoading(false);
        }
    };

    if (!isActive) return null;

    if (loading && manufacturers.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
            </div>
        );
    }

    if (manufacturers.length === 0) {
        return (
            <div className="card text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="mt-2 text-gray-500">No pending manufacturers to review</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {manufacturers.map((mfg) => (
                    <div key={mfg.id} className="card p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900">{mfg.mfg_name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{mfg.mfg_id}</p>
                            </div>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                            {mfg.mfg_type && (
                                <div><span className="font-medium">Type:</span> {mfg.mfg_type}</div>
                            )}
                            {mfg.country && (
                                <div><span className="font-medium">Country:</span> {mfg.country}</div>
                            )}
                            {mfg.website && (
                                <div><span className="font-medium">Website:</span> {mfg.website}</div>
                            )}
                        </div>

                        <div className="pt-3 border-t grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleEditManufacturer(mfg)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={() => handleApprove(mfg.id)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                ✓ Approve
                            </button>
                            <button
                                onClick={() => setRejectingManufacturer(mfg)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                ✕ Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <RejectionModal
                isOpen={rejectingManufacturer !== null}
                entityType="Manufacturer"
                entityName={rejectingManufacturer?.mfg_name}
                onClose={() => setRejectingManufacturer(null)}
                onReject={handleReject}
                loading={loading}
            />

            {/* Edit Modal */}
            {editingManufacturer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                        <h2 className="text-xl font-bold mb-4">Edit Manufacturer</h2>
                        <form onSubmit={handleSaveManufacturer}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* mfg_id removed */}
                                    {/* 
                                    <div>
                                        <label className="label">Manufacturer ID *</label>
                                        <input
                                            type="text"
                                            value={formData.mfg_id}
                                            className="input"
                                            disabled
                                        />
                                    </div>
                                    */}
                                    <div>
                                        <label className="label">Type</label>
                                        <select
                                            value={formData.mfg_type}
                                            onChange={(e) => setFormData({ ...formData, mfg_type: e.target.value as any })}
                                            className="input"
                                        >
                                            <option value="">Select Type...</option>
                                            <option value="OEM">OEM</option>
                                            <option value="APM">APM</option>
                                            <option value="Remanufacturers">Remanufacturers</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Name</label>
                                    <input
                                        type="text"
                                        value={formData.mfg_name}
                                        onChange={(e) => setFormData({ ...formData, mfg_name: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Country</label>
                                    <select
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">Select Country...</option>
                                        {countries.map(country => (
                                            <option key={country.code} value={country.code}>
                                                {country.name} ({country.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Website</label>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="input"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingManufacturer(null)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary"
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
