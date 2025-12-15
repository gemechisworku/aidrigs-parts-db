import React, { useState, useEffect } from 'react';
import { hsCodesAPI, HSCode } from '../../../../services/hsCodesApi';
import { TabComponentProps } from '../../types';
import { RejectionModal } from '../modals/RejectionModal';

export const HSCodesApprovalsTab: React.FC<TabComponentProps> = ({
    isActive,
    onCountChange
}) => {
    const [hsCodes, setHSCodes] = useState<HSCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [rejectingHSCode, setRejectingHSCode] = useState<HSCode | null>(null);
    const [editingHSCode, setEditingHSCode] = useState<HSCode | null>(null);
    const [formData, setFormData] = useState({
        hs_code: '',
        description_en: '',
        description_fr: '',
        description_pt: ''
    });

    useEffect(() => {
        if (isActive) {
            loadPendingHSCodes();
        }
    }, [isActive]);

    useEffect(() => {
        if (onCountChange) {
            onCountChange(hsCodes.length);
        }
    }, [hsCodes.length]);

    const loadPendingHSCodes = async () => {
        setLoading(true);
        try {
            const data = await hsCodesAPI.getHSCodes('', 0, 1000, 'PENDING_APPROVAL');
            setHSCodes(data.items);
        } catch (error) {
            console.error('Error loading pending HS codes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (hsCode: string) => {
        setLoading(true);
        try {
            await hsCodesAPI.approveHSCode(hsCode, { review_notes: '' });
            await loadPendingHSCodes();
            window.dispatchEvent(new Event('approvalCountChanged'));
            alert('HS Code approved successfully!');
        } catch (error: any) {
            console.error('Error approving HS code:', error);
            alert(error.response?.data?.detail || 'Failed to approve HS code');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!rejectingHSCode) return;

        try {
            await hsCodesAPI.rejectHSCode(rejectingHSCode.hs_code, reason);
            await loadPendingHSCodes();
            window.dispatchEvent(new Event('approvalCountChanged'));
            alert('HS Code rejected');
        } catch (error: any) {
            console.error('Error rejecting HS code:', error);
            alert(error.response?.data?.detail || 'Failed to reject HS code');
            throw error;
        }
    };

    const handleEditHSCode = (hsCode: HSCode) => {
        setEditingHSCode(hsCode);
        setFormData({
            hs_code: hsCode.hs_code,
            description_en: hsCode.description_en || '',
            description_fr: hsCode.description_fr || '',
            description_pt: hsCode.description_pt || ''
        });
    };

    const handleSaveHSCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingHSCode) return;

        setLoading(true);
        try {
            await hsCodesAPI.updateHSCode(editingHSCode.hs_code, formData);
            await loadPendingHSCodes();
            setEditingHSCode(null);
            alert('HS Code updated successfully');
        } catch (error: any) {
            console.error('Error updating HS code:', error);
            alert(error.response?.data?.detail || 'Failed to update HS code');
        } finally {
            setLoading(false);
        }
    };

    if (!isActive) return null;

    if (loading && hsCodes.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
            </div>
        );
    }

    if (hsCodes.length === 0) {
        return (
            <div className="card text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-gray-500">No pending HS codes to review</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {hsCodes.map((hsCode) => (
                    <div key={hsCode.hs_code} className="card p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900">{hsCode.hs_code}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {hsCode.description_en || 'No description'}
                                </p>
                            </div>
                        </div>


                        {hsCode.description_fr && (
                            <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">French:</span> {hsCode.description_fr}
                            </div>
                        )}


                        <div className="pt-3 border-t grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleEditHSCode(hsCode)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={() => handleApprove(hsCode.hs_code)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => setRejectingHSCode(hsCode)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <RejectionModal
                isOpen={rejectingHSCode !== null}
                entityType="HS Code"
                entityName={rejectingHSCode?.hs_code}
                onClose={() => setRejectingHSCode(null)}
                onReject={handleReject}
                loading={loading}
            />

            {/* Edit Modal */}
            {editingHSCode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                        <h2 className="text-xl font-bold mb-4">Edit HS Code</h2>
                        <form onSubmit={handleSaveHSCode}>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">HS Code *</label>
                                    <input
                                        type="text"
                                        value={formData.hs_code}
                                        className="input"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="label">Description (English)</label>
                                    <textarea
                                        value={formData.description_en}
                                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                        className="input"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="label">Description (French)</label>
                                    <textarea
                                        value={formData.description_fr}
                                        onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                                        className="input"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="label">Description (Portuguese BR)</label>
                                    <textarea
                                        value={formData.description_pt}
                                        onChange={(e) => setFormData({ ...formData, description_pt: e.target.value })}
                                        className="input"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingHSCode(null)}
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
