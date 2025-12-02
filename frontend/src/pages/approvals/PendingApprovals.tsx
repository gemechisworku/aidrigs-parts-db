import React, { useState, useEffect } from 'react';
import { approvalsAPI, PendingPart } from '../../services/approvalsApi';
import { translationAPI, Translation } from '../../services/translationApi';
import { partsAPI, PartCreate, Manufacturer, Position, Category } from '../../services/partsApi';
import CreatableSelect from '../../components/common/CreatableSelect';

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
    const [editingPart, setEditingPart] = useState<PendingPart | null>(null);
    const [editingTranslation, setEditingTranslation] = useState<PendingTranslation | null>(null);

    // Dropdown data
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [translations, setTranslations] = useState<Translation[]>([]);

    // Part form state
    const [partFormData, setPartFormData] = useState<PartCreate>({
        part_id: '',
        mfg_id: '',
        part_name_en: '',
        position_id: '',
        drive_side: 'NA',
        designation: '',
        moq: undefined,
        weight: undefined,
        width: undefined,
        length: undefined,
        height: undefined,
        note: '',
        image_url: '',
    });

    // Translation form state
    const [transFormData, setTransFormData] = useState({
        part_name_en: '',
        part_name_pr: '',
        part_name_fr: '',
        hs_code: '',
        category_en: '',
        drive_side_specific: 'no' as 'yes' | 'no',
        alternative_names: '',
        links: '',
    });

    useEffect(() => {
        loadPendingItems();
        loadDropdownData();
    }, [activeTab]);

    const loadDropdownData = async () => {
        try {
            const [mfgs, trans, pos, cats] = await Promise.all([
                partsAPI.getManufacturers(),
                translationAPI.getTranslations({ page: 1, page_size: 1000 }),
                partsAPI.getPositions(),
                partsAPI.getCategories(),
            ]);
            setManufacturers(mfgs);
            setTranslations(trans.items.filter(t => t.approval_status === 'APPROVED'));
            setPositions(pos);
            setCategories(cats);
        } catch (error) {
            console.error('Error loading dropdown data:', error);
        }
    };

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

    // Part editing handlers
    const handleEditPart = async (part: PendingPart) => {
        try {
            // Fetch full part details
            const fullPart = await partsAPI.getPart(part.id);
            setEditingPart(part);
            setPartFormData({
                part_id: fullPart.part_id,
                mfg_id: fullPart.mfg_id || '',
                part_name_en: fullPart.part_name_en || '',
                position_id: fullPart.position_id || '',
                drive_side: fullPart.drive_side || 'NA',
                designation: fullPart.designation || '',
                moq: fullPart.moq,
                weight: fullPart.weight,
                width: fullPart.width,
                length: fullPart.length,
                height: fullPart.height,
                note: fullPart.note || '',
                image_url: fullPart.image_url || '',
            });
        } catch (error) {
            console.error('Error loading part details:', error);
            alert('Failed to load part details');
        }
    };

    const handleSavePart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPart) return;
        try {
            await partsAPI.updatePart(editingPart.id, partFormData);
            setEditingPart(null);
            await loadPendingItems();
            alert('Part updated successfully');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Error updating part');
        }
    };

    // Translation editing handlers
    const handleEditTranslation = (trans: PendingTranslation) => {
        setEditingTranslation(trans);
        setTransFormData({
            part_name_en: trans.part_name_en,
            part_name_pr: trans.part_name_pr || '',
            part_name_fr: trans.part_name_fr || '',
            hs_code: trans.hs_code || '',
            category_en: trans.category_en || '',
            drive_side_specific: trans.drive_side_specific || 'no',
            alternative_names: trans.alternative_names || '',
            links: trans.links || '',
        });
    };

    const handleSaveTranslation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTranslation) return;
        try {
            const cleanData: any = { part_name_en: transFormData.part_name_en };
            if (transFormData.part_name_pr) cleanData.part_name_pr = transFormData.part_name_pr;
            if (transFormData.part_name_fr) cleanData.part_name_fr = transFormData.part_name_fr;
            if (transFormData.hs_code) cleanData.hs_code = transFormData.hs_code;
            if (transFormData.category_en) cleanData.category_en = transFormData.category_en;
            if (transFormData.alternative_names) cleanData.alternative_names = transFormData.alternative_names;
            if (transFormData.links) cleanData.links = transFormData.links;
            cleanData.drive_side_specific = transFormData.drive_side_specific;

            await translationAPI.updateTranslation(editingTranslation.id, cleanData);
            setEditingTranslation(null);
            await loadPendingItems();
            alert('Translation updated successfully');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Error updating translation');
        }
    };

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
                                                            <div className="mt-4 grid grid-cols-3 gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditPart(part);
                                                                    }}
                                                                    disabled={loading}
                                                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                                                >
                                                                    ✏️ Edit
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleApprove(part.id, 'parts');
                                                                    }}
                                                                    disabled={loading}
                                                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                                >
                                                                    ✓ Approve
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setRejectingId(part.id);
                                                                    }}
                                                                    disabled={loading}
                                                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
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
                                                            <div className="mt-4 grid grid-cols-3 gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditTranslation(trans);
                                                                    }}
                                                                    disabled={loading}
                                                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                                                >
                                                                    ✏️ Edit
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleApprove(trans.id, 'translations');
                                                                    }}
                                                                    disabled={loading}
                                                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                                >
                                                                    ✓ Approve
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setRejectingId(trans.id);
                                                                    }}
                                                                    disabled={loading}
                                                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
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

            {/* Part Edit Modal */}
            {editingPart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">Edit Part - {editingPart.part_id}</h3>
                        <form onSubmit={handleSavePart}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Part ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Part ID * (max 12 chars)
                                    </label>
                                    <input
                                        type="text"
                                        value={partFormData.part_id}
                                        disabled
                                        className="input disabled:bg-gray-100"
                                    />
                                </div>

                                {/* Designation */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Designation
                                    </label>
                                    <input
                                        type="text"
                                        value={partFormData.designation}
                                        onChange={(e) => setPartFormData({ ...partFormData, designation: e.target.value })}
                                        className="input"
                                        maxLength={255}
                                    />
                                </div>

                                {/* Manufacturer */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Manufacturer
                                    </label>
                                    <select
                                        value={partFormData.mfg_id}
                                        onChange={(e) => setPartFormData({ ...partFormData, mfg_id: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">-- Select Manufacturer --</option>
                                        {manufacturers.map((mfg) => (
                                            <option key={mfg.id} value={mfg.id}>
                                                {mfg.mfg_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Part Name (Translation) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Part Name (EN)
                                    </label>
                                    <CreatableSelect
                                        value={partFormData.part_name_en}
                                        onChange={(value) => setPartFormData({ ...partFormData, part_name_en: value })}
                                        options={translations.map((trans) => ({
                                            value: trans.part_name_en,
                                            label: trans.part_name_en,
                                            isPending: trans.approval_status === 'PENDING_APPROVAL'
                                        }))}
                                        placeholder="Select or type part name..."
                                        className="input"
                                        name="part_name_en"
                                        id="part_name_en"
                                    />
                                </div>

                                {/* Position */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Position
                                    </label>
                                    <select
                                        value={partFormData.position_id}
                                        onChange={(e) => setPartFormData({ ...partFormData, position_id: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">-- Select Position --</option>
                                        {positions.map((pos) => (
                                            <option key={pos.id} value={pos.id}>
                                                {pos.position_en}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Drive Side */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Drive Side
                                    </label>
                                    <select
                                        value={partFormData.drive_side}
                                        onChange={(e) => setPartFormData({ ...partFormData, drive_side: e.target.value as 'NA' | 'LHD' | 'RHD' })}
                                        className="input"
                                    >
                                        <option value="NA">NA</option>
                                        <option value="LHD">LHD (Left Hand Drive)</option>
                                        <option value="RHD">RHD (Right Hand Drive)</option>
                                    </select>
                                </div>

                                {/* MOQ, Weight, Dimensions*/}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        MOQ (Minimum Order Quantity)
                                    </label>
                                    <input
                                        type="number"
                                        value={partFormData.moq || ''}
                                        onChange={(e) => setPartFormData({ ...partFormData, moq: e.target.value ? Number(e.target.value) : undefined })}
                                        className="input"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={partFormData.weight || ''}
                                        onChange={(e) => setPartFormData({ ...partFormData, weight: e.target.value ? Number(e.target.value) : undefined })}
                                        className="input"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Width (cm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={partFormData.width || ''}
                                        onChange={(e) => setPartFormData({ ...partFormData, width: e.target.value ? Number(e.target.value) : undefined })}
                                        className="input"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Length (cm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={partFormData.length || ''}
                                        onChange={(e) => setPartFormData({ ...partFormData, length: e.target.value ? Number(e.target.value) : undefined })}
                                        className="input"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Height (cm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={partFormData.height || ''}
                                        onChange={(e) => setPartFormData({ ...partFormData, height: e.target.value ? Number(e.target.value) : undefined })}
                                        className="input"
                                        min="0"
                                    />
                                </div>

                                {/* Note */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Note
                                    </label>
                                    <textarea
                                        value={partFormData.note}
                                        onChange={(e) => setPartFormData({ ...partFormData, note: e.target.value })}
                                        className="input"
                                        rows={3}
                                        maxLength={1024}
                                    />
                                </div>

                                {/* Image URL */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Image URL
                                    </label>
                                    <input
                                        type="text"
                                        value={partFormData.image_url}
                                        onChange={(e) => setPartFormData({ ...partFormData, image_url: e.target.value })}
                                        className="input"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingPart(null)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Translation Edit Modal */}
            {editingTranslation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">Edit Translation</h3>
                        <form onSubmit={handleSaveTranslation}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Part Names */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        English Name * (Primary Key)
                                    </label>
                                    <input
                                        type="text"
                                        value={transFormData.part_name_en}
                                        disabled
                                        className="input disabled:bg-gray-100"
                                        maxLength={60}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Portuguese Name
                                    </label>
                                    <input
                                        type="text"
                                        value={transFormData.part_name_pr}
                                        onChange={(e) => setTransFormData({ ...transFormData, part_name_pr: e.target.value })}
                                        className="input"
                                        maxLength={60}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        French Name
                                    </label>
                                    <input
                                        type="text"
                                        value={transFormData.part_name_fr}
                                        onChange={(e) => setTransFormData({ ...transFormData, part_name_fr: e.target.value })}
                                        className="input"
                                        maxLength={60}
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={transFormData.category_en}
                                        onChange={(e) => setTransFormData({ ...transFormData, category_en: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">-- Select Category --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.category_name_en}>
                                                {cat.category_name_en}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* HS Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        HS Code
                                    </label>
                                    <input
                                        type="text"
                                        value={transFormData.hs_code}
                                        onChange={(e) => setTransFormData({ ...transFormData, hs_code: e.target.value })}
                                        className="input"
                                        maxLength={14}
                                        placeholder="e.g., 8421.23.00"
                                    />
                                </div>

                                {/* Drive Side Specific */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Drive Side Specific
                                    </label>
                                    <select
                                        value={transFormData.drive_side_specific}
                                        onChange={(e) => setTransFormData({ ...transFormData, drive_side_specific: e.target.value as 'yes' | 'no' })}
                                        className="input"
                                    >
                                        <option value="no">No</option>
                                        <option value="yes">Yes</option>
                                    </select>
                                </div>

                                {/* Alternative Names */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alternative Names (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={transFormData.alternative_names}
                                        onChange={(e) => setTransFormData({ ...transFormData, alternative_names: e.target.value })}
                                        className="input"
                                        maxLength={60}
                                        placeholder="e.g., Oil Strainer, Filter Element"
                                    />
                                </div>

                                {/* Links */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Links (related URLs)
                                    </label>
                                    <input
                                        type="text"
                                        value={transFormData.links}
                                        onChange={(e) => setTransFormData({ ...transFormData, links: e.target.value })}
                                        className="input"
                                        maxLength={1024}
                                        placeholder="https://example.com/part-info"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingTranslation(null)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingApprovals;
