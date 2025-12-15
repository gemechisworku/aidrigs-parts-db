import React, { useState, useEffect } from 'react';
import { translationAPI, Translation } from '../../../../services/translationApi';
import { approvalsAPI } from '../../../../services/approvalsApi';
import { partsAPI, Category } from '../../../../services/partsApi';
import { hsCodesAPI, HSCode } from '../../../../services/hsCodesApi';
import CreatableSelect from '../../../../components/common/CreatableSelect';
import { TabComponentProps } from '../../types';
import { RejectionModal } from '../modals/RejectionModal';

interface PendingTranslation extends Translation {
    submitted_at?: string;
}

export const TranslationsApprovalsTab: React.FC<TabComponentProps> = ({
    isActive,
    onCountChange
}) => {
    const [translations, setTranslations] = useState<PendingTranslation[]>([]);
    const [loading, setLoading] = useState(false);
    const [rejectingTranslation, setRejectingTranslation] = useState<PendingTranslation | null>(null);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTranslation, setEditingTranslation] = useState<PendingTranslation | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [hsCodes, setHsCodes] = useState<HSCode[]>([]);
    const [allTranslations, setAllTranslations] = useState<Translation[]>([]);
    const [targetTranslationId, setTargetTranslationId] = useState<string | null>(null);
    const [mergeWarning, setMergeWarning] = useState<string | null>(null);

    const [formData, setFormData] = useState({
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
        if (isActive) {
            loadPendingTranslations();
            loadCategories();
            loadHSCodes();
            loadAllTranslations();
        }
    }, [isActive]);

    useEffect(() => {
        if (onCountChange) {
            onCountChange(translations.length);
        }
    }, [translations.length]);

    const loadPendingTranslations = async () => {
        setLoading(true);
        try {
            const data = await translationAPI.getTranslations({ page_size: 1000 });
            const pending = data.items.filter(t => t.approval_status === 'PENDING_APPROVAL');
            setTranslations(pending);
        } catch (error) {
            console.error('Error loading pending translations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAllTranslations = async () => {
        try {
            const data = await translationAPI.getTranslations({ page_size: 10000 });
            setAllTranslations(data.items);
        } catch (error) {
            console.error('Error loading all translations:', error);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await partsAPI.getCategories();
            setCategories(response);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadHSCodes = async () => {
        try {
            const response = await hsCodesAPI.getHSCodes('', 0, 1000);
            setHsCodes(response.items);
        } catch (error) {
            console.error('Error loading HS codes:', error);
        }
    };

    const handleApprove = async (translationId: string) => {
        setLoading(true);
        try {
            await approvalsAPI.approveTranslation(translationId);
            await loadPendingTranslations();
            alert('Translation approved successfully!');
        } catch (error: any) {
            console.error('Error approving translation:', error);
            alert(error.response?.data?.detail || 'Failed to approve translation');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!rejectingTranslation) return;

        try {
            await approvalsAPI.rejectTranslation(rejectingTranslation.id, reason);
            await loadPendingTranslations();
            window.dispatchEvent(new Event('approvalCountChanged'));
            alert('Translation rejected');
        } catch (error: any) {
            console.error('Error rejecting translation:', error);
            alert(error.response?.data?.detail || 'Failed to reject translation');
            throw error;
        }
    };

    const handleEdit = (translation: PendingTranslation) => {
        setEditingTranslation(translation);
        setTargetTranslationId(null);
        setMergeWarning(null);
        setFormData({
            part_name_en: translation.part_name_en,
            part_name_pr: translation.part_name_pr || '',
            part_name_fr: translation.part_name_fr || '',
            hs_code: translation.hs_code || '',
            category_en: translation.category_en || '',
            drive_side_specific: translation.drive_side_specific || 'no',
            alternative_names: translation.alternative_names || '',
            links: translation.links || '',
        });
        setShowEditModal(true);
    };

    const handleNameChange = (name: string) => {
        // Check if exists
        const existing = allTranslations.find(t => t.part_name_en.toLowerCase() === name.toLowerCase());

        if (existing) {
            setTargetTranslationId(existing.id);
            setFormData({
                part_name_en: existing.part_name_en,
                part_name_pr: existing.part_name_pr || '',
                part_name_fr: existing.part_name_fr || '',
                hs_code: existing.hs_code || '',
                category_en: existing.category_en || '',
                drive_side_specific: existing.drive_side_specific || 'no',
                alternative_names: existing.alternative_names || '',
                links: existing.links || '',
            });
            setMergeWarning(`Warning: "${existing.part_name_en}" already exists. Saving will update the existing record and remove this pending request.`);
        } else {
            setTargetTranslationId(null);
            setFormData(prev => ({ ...prev, part_name_en: name }));
            setMergeWarning(null);
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTranslation) return;

        try {
            const cleanData: any = { part_name_en: formData.part_name_en };
            if (formData.part_name_pr) cleanData.part_name_pr = formData.part_name_pr;
            if (formData.part_name_fr) cleanData.part_name_fr = formData.part_name_fr;
            if (formData.hs_code) cleanData.hs_code = formData.hs_code;
            if (formData.category_en) cleanData.category_en = formData.category_en;
            if (formData.alternative_names) cleanData.alternative_names = formData.alternative_names;
            if (formData.links) cleanData.links = formData.links;
            cleanData.drive_side_specific = formData.drive_side_specific;

            if (targetTranslationId && targetTranslationId !== editingTranslation.id) {
                // Merge case: Update target, delete current
                await translationAPI.updateTranslation(targetTranslationId, cleanData);
                await translationAPI.deleteTranslation(editingTranslation.id);
                alert(`Merged into "${formData.part_name_en}" successfully.`);
            } else {
                // Normal update
                await translationAPI.updateTranslation(editingTranslation.id, cleanData);
                alert('Translation updated successfully');
            }

            setShowEditModal(false);
            setEditingTranslation(null);
            setTargetTranslationId(null);
            setMergeWarning(null);
            loadPendingTranslations();
            loadAllTranslations();
        } catch (error: any) {
            console.error('Error updating translation:', error);
            alert(error.response?.data?.detail || 'Failed to update translation');
        }
    };

    if (!isActive) return null;

    if (loading && translations.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
            </div>
        );
    }

    if (translations.length === 0) {
        return (
            <div className="card text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-gray-500">No pending translations to review</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {translations.map((trans) => (
                    <div key={trans.id} className="card hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">{trans.part_name_en}</h3>
                                {trans.part_name_pr && (
                                    <p className="text-sm text-gray-600">PT: {trans.part_name_pr}</p>
                                )}
                                {trans.part_name_fr && (
                                    <p className="text-sm text-gray-600">FR: {trans.part_name_fr}</p>
                                )}
                                {trans.hs_code && (
                                    <p className="text-xs text-gray-500 mt-1">HS Code: {trans.hs_code}</p>
                                )}
                            </div>
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleEdit(trans)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                ✎ Edit
                            </button>
                            <button
                                onClick={() => handleApprove(trans.id)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                ✓ Approve
                            </button>
                            <button
                                onClick={() => setRejectingTranslation(trans)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                ✕ Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <RejectionModal
                isOpen={rejectingTranslation !== null}
                entityType="Translation"
                entityName={rejectingTranslation?.part_name_en}
                onClose={() => setRejectingTranslation(null)}
                onReject={handleReject}
                loading={loading}
            />

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Edit Translation</h2>

                        {mergeWarning && (
                            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                                {mergeWarning}
                            </div>
                        )}

                        <form onSubmit={handleSaveEdit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Part Names */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        English Name * (Primary Key)
                                    </label>
                                    <CreatableSelect
                                        options={allTranslations.map(t => ({ value: t.part_name_en, label: t.part_name_en }))}
                                        value={formData.part_name_en}
                                        onChange={handleNameChange}
                                        placeholder="Select or create English name..."
                                        required
                                        allowCreateOption={false}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Portuguese Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.part_name_pr}
                                        onChange={(e) => setFormData({ ...formData, part_name_pr: e.target.value })}
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
                                        value={formData.part_name_fr}
                                        onChange={(e) => setFormData({ ...formData, part_name_fr: e.target.value })}
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
                                        value={formData.category_en}
                                        onChange={(e) => setFormData({ ...formData, category_en: e.target.value })}
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
                                    <CreatableSelect
                                        options={hsCodes.map(code => ({ value: code.hs_code, label: `${code.hs_code}${code.description_en ? ' - ' + code.description_en : ''}` }))}
                                        value={formData.hs_code}
                                        onChange={(value) => setFormData({ ...formData, hs_code: value })}
                                        onCreate={async (value: string) => {
                                            try {
                                                await hsCodesAPI.createHSCode({ hs_code: value });
                                                // Reload HS codes to get the newly created one
                                                await loadHSCodes();
                                                return value;
                                            } catch (error) {
                                                console.error('Error creating HS code:', error);
                                                throw error;
                                            }
                                        }}
                                        placeholder="Select or create HS code..."
                                    />
                                </div>

                                {/* Drive Side Specific */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Drive Side Specific
                                    </label>
                                    <select
                                        value={formData.drive_side_specific}
                                        onChange={(e) => setFormData({ ...formData, drive_side_specific: e.target.value as 'yes' | 'no' })}
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
                                        value={formData.alternative_names}
                                        onChange={(e) => setFormData({ ...formData, alternative_names: e.target.value })}
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
                                        value={formData.links}
                                        onChange={(e) => setFormData({ ...formData, links: e.target.value })}
                                        className="input"
                                        maxLength={1024}
                                        placeholder="https://example.com/part-info"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="btn-outline"
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
        </>
    );
};
