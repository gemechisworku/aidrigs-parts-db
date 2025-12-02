import React, { useState, useEffect } from 'react';
import { approvalsAPI, PendingPart } from '../../services/approvalsApi';
import { translationAPI, Translation } from '../../services/translationApi';
import { partsAPI } from '../../services/partsApi';

type EntityType = 'parts' | 'translations';

interface PendingTranslation extends Translation {
    submitted_at?: string;
    rejection_reason?: string;
}

const PendingApprovals: React.FC = () => {
    const [activeTab, setActiveTab] = useState<EntityType>('parts');
    const [pendingParts, setPendingParts] = useState<PendingPart[]>([]);
    const [pendingTranslations, setPendingTranslations] = useState<PendingTranslation[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Modal states
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [editingPartId, setEditingPartId] = useState<string | null>(null);
    const [editingTranslationId, setEditingTranslationId] = useState<string | null>(null);

    useEffect(() => {
        loadPendingItems();
    }, [activeTab]);

    const loadPendingItems = async () => {
        setLoading(true);
        try {
            if (activeTab === 'parts') {
                const data = await approvalsAPI.getPendingParts();
                setPendingParts(data);
            } else {
                // Fetch pending translations
                const allTranslations = await translationAPI.getTranslations({ page_size: 1000 });
                const pending = allTranslations.items.filter(t => t.approval_status === 'PENDING_APPROVAL');
                setPendingTranslations(pending);
            }
        } catch (error) {
            console.error('Error loading pending items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, type: EntityType) => {
        setLoading(true);
        try {
            if (type === 'parts') {
                await approvalsAPI.approvePart(id);
            } else {
                await approvalsAPI.approveTranslation(id);
            }
            await loadPendingItems();
            alert(`${type === 'parts' ? 'Part' : 'Translation'} approved successfully!`);
        } catch (error: any) {
            console.error('Error approving:', error);
            alert(error.response?.data?.detail || 'Failed to approve');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectingId || !rejectionReason.trim()) return;
        setLoading(true);
        try {
            if (activeTab === 'parts') {
                await approvalsAPI.rejectPart(rejectingId, rejectionReason);
            } else {
                await approvalsAPI.rejectTranslation(rejectingId, rejectionReason);
            }
            await loadPendingItems();
            setRejectingId(null);
            setRejectionReason('');
            alert(`${activeTab === 'parts' ? 'Part' : 'Translation'} rejected`);
        } catch (error: any) {
            console.error('Error rejecting:', error);
            alert(error.response?.data?.detail || 'Failed to reject');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedItems.size === 0 || !confirm(`Approve ${selectedItems.size} items?`)) return;
        setLoading(true);
        try {
            await Promise.all(
                Array.from(selectedItems).map(id => handleApprove(id, activeTab))
            );
            setSelectedItems(new Set());
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const selectAll = () => {
        if (activeTab === 'parts') {
            setSelectedItems(new Set(pendingParts.map(p => p.id)));
        } else {
            setSelectedItems(new Set(pendingTranslations.map(t => t.id)));
        }
    };

    const deselectAll = () => setSelectedItems(new Set());

    const pendingCount = {
        parts: pendingParts.length,
        translations: pendingTranslations.length
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
                                onClick={() => { setActiveTab('parts'); setSelectedItems(new Set()); }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'parts'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Parts
                                {pendingCount.parts > 0 && (
                                    <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-600">
                                        {pendingCount.parts}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => { setActiveTab('translations'); setSelectedItems(new Set()); }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'translations'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Translations
                                {pendingCount.translations > 0 && (
                                    <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-600">
                                        {pendingCount.translations}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedItems.size > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-900">
                            {selectedItems.size} item(s) selected
                        </span>
                        <div className="flex gap-2">
                            <button onClick={deselectAll} className="btn-outline text-sm">
                                Deselect All
                            </button>
                            <button onClick={handleBulkApprove} className="btn-primary text-sm bg-green-600 hover:bg-green-700">
                                Approve Selected
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading && (activeTab === 'parts' ? pendingParts.length === 0 : pendingTranslations.length === 0) ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        <p className="mt-2 text-gray-600">Loading...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'parts' && (
                            <>
                                {pendingParts.length === 0 ? (
                                    <div className="card text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500">No pending parts to review</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3 flex justify-between items-center text-sm text-gray-600">
                                            <span>{pendingParts.length} pending part(s)</span>
                                            <button onClick={selectAll} className="text-blue-600 hover:text-blue-800">
                                                Select All
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {pendingParts.map((part) => (
                                                <div
                                                    key={part.id}
                                                    className={`card hover:shadow-lg transition-shadow cursor-pointer ${selectedItems.has(part.id) ? 'ring-2 ring-blue-500' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.has(part.id)}
                                                            onChange={() => toggleSelection(part.id)}
                                                            className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <h3 className="text-lg font-semibold text-gray-900">{part.part_id}</h3>
                                                                    <p className="text-sm text-gray-600">{part.designation || 'No designation'}</p>
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Submitted: {part.submitted_at ? new Date(part.submitted_at).toLocaleDateString() : 'N/A'}
                                                                    </p>
                                                                </div>
                                                                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                                                    Pending
                                                                </span>
                                                            </div>
                                                            <div className="mt-4 flex gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleApprove(part.id, 'parts');
                                                                    }}
                                                                    disabled={loading}
                                                                    className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                                >
                                                                    ✓ Approve
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setRejectingId(part.id);
                                                                    }}
                                                                    disabled={loading}
                                                                    className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                                                                >
                                                                    ✕ Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {activeTab === 'translations' && (
                            <>
                                {pendingTranslations.length === 0 ? (
                                    <div className="card text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500">No pending translations to review</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3 flex justify-between items-center text-sm text-gray-600">
                                            <span>{pendingTranslations.length} pending translation(s)</span>
                                            <button onClick={selectAll} className="text-blue-600 hover:text-blue-800">
                                                Select All
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {pendingTranslations.map((trans) => (
                                                <div
                                                    key={trans.id}
                                                    className={`card hover:shadow-lg transition-shadow cursor-pointer ${selectedItems.has(trans.id) ? 'ring-2 ring-blue-500' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.has(trans.id)}
                                                            onChange={() => toggleSelection(trans.id)}
                                                            className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <h3 className="text-lg font-semibold text-gray-900">{trans.part_name_en}</h3>
                                                                    {trans.part_name_pr && (
                                                                        <p className="text-sm text-gray-600">PT: {trans.part_name_pr}</p>
                                                                    )}
                                                                    {trans.part_name_fr && (
                                                                        <p className="text-sm text-gray-600">FR: {trans.part_name_fr}</p>
                                                                    )}
                                                                </div>
                                                                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                                                    Pending
                                                                </span>
                                                            </div>
                                                            <div className="mt-4 flex gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleApprove(trans.id, 'translations');
                                                                    }}
                                                                    disabled={loading}
                                                                    className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                                >
                                                                    ✓ Approve
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setRejectingId(trans.id);
                                                                    }}
                                                                    disabled={loading}
                                                                    className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                                                                >
                                                                    ✕ Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectingId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Reject {activeTab === 'parts' ? 'Part' : 'Translation'}</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Please provide a reason for rejection:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="input mb-4"
                            rows={4}
                            placeholder="Enter rejection reason..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || loading}
                                className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading ? 'Rejecting...' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingApprovals;
