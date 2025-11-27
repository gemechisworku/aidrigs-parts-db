/**
 * Price Tiers Management Page
 */
import { useState, useEffect } from 'react';
import { priceTiersAPI, PriceTier, PriceTierCreate } from '../../services/priceTiersApi';

const PriceTiers = ({ embedded = false }: { embedded?: boolean }) => {
    const [tiers, setTiers] = useState<PriceTier[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingTier, setEditingTier] = useState<PriceTier | null>(null);
    const [formData, setFormData] = useState<PriceTierCreate>({
        tier_name: '',
        description: '',
        tier_kind: ''
    });
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkResult, setBulkResult] = useState<any>(null);

    useEffect(() => {
        loadTiers();
    }, [search]);

    const loadTiers = async () => {
        setLoading(true);
        try {
            const data = await priceTiersAPI.getPriceTiers(search);
            setTiers(data);
        } catch (error) {
            console.error('Error loading price tiers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingTier) {
                await priceTiersAPI.updatePriceTier(editingTier.id, formData);
            } else {
                await priceTiersAPI.createPriceTier(formData);
            }
            await loadTiers();
            closeModal();
        } catch (error: any) {
            console.error('Error saving price tier:', error);
            alert(error.response?.data?.detail || 'Failed to save price tier');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this price tier?')) return;

        try {
            await priceTiersAPI.deletePriceTier(id);
            await loadTiers();
        } catch (error) {
            console.error('Error deleting price tier:', error);
        }
    };

    const openEditModal = (tier: PriceTier) => {
        setEditingTier(tier);
        setFormData({
            tier_name: tier.tier_name,
            description: tier.description || '',
            tier_kind: tier.tier_kind || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTier(null);
        setFormData({
            tier_name: '',
            description: '',
            tier_kind: ''
        });
    };

    const handleBulkUpload = async () => {
        if (!bulkFile) return;

        setLoading(true);
        try {
            const result = await priceTiersAPI.bulkUpload(bulkFile);
            setBulkResult(result);
            await loadTiers();
        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert(error.response?.data?.detail || 'Failed to upload file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={embedded ? "" : "p-8"}>
            <div className={embedded ? "" : "max-w-7xl mx-auto"}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Price Tiers</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => priceTiersAPI.downloadTemplate()}
                            className="btn btn-secondary"
                        >
                            Download Template
                        </button>
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="btn btn-secondary"
                        >
                            Bulk Upload
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary"
                        >
                            Add Tier
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search price tiers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input max-w-md"
                    />
                </div>

                {/* Table */}
                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="table-auto w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kind</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tiers.map((tier) => (
                                    <tr key={tier.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{tier.tier_name}</td>
                                        <td className="px-4 py-4 text-sm text-gray-700">{tier.description}</td>
                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            {tier.tier_kind && <span className="badge badge-primary">{tier.tier_kind}</span>}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-right">
                                            <button
                                                onClick={() => openEditModal(tier)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tier.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {tiers.length === 0 && !loading && (
                            <div className="text-center py-8 text-gray-500">
                                No price tiers found
                            </div>
                        )}
                    </div>
                </div>

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h2 className="text-xl font-bold mb-4">
                                {editingTier ? 'Edit Price Tier' : 'Add Price Tier'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="label">Tier Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.tier_name}
                                            onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
                                            className="input"
                                            maxLength={100}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="input"
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Tier Kind</label>
                                        <input
                                            type="text"
                                            value={formData.tier_kind}
                                            onChange={(e) => setFormData({ ...formData, tier_kind: e.target.value })}
                                            className="input"
                                            placeholder="e.g., wholesale, retail"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" onClick={closeModal} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Bulk Upload Modal */}
                {showBulkModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h2 className="text-xl font-bold mb-4">Bulk Upload Price Tiers</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Select CSV File</label>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                                        className="input"
                                    />
                                </div>
                                {bulkResult && (
                                    <div className="bg-gray-100 p-4 rounded">
                                        <p className="text-sm font-medium">Results:</p>
                                        <p className="text-sm text-green-600">Created: {bulkResult.created}</p>
                                        <p className="text-sm text-blue-600">Updated: {bulkResult.updated}</p>
                                        {bulkResult.errors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-sm text-red-600 font-medium">Errors:</p>
                                                <ul className="text-xs text-red-600 list-disc ml-4">
                                                    {bulkResult.errors.map((error: string, i: number) => (
                                                        <li key={i}>{error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => { setShowBulkModal(false); setBulkResult(null); }} className="btn btn-secondary">
                                    Close
                                </button>
                                <button onClick={handleBulkUpload} disabled={!bulkFile || loading} className="btn-primary">
                                    {loading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceTiers;
