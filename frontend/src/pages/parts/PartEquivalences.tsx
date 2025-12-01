import React, { useState, useEffect } from 'react';
import { partsAPI } from '../../services/partsApi';
import { Part } from '../../types/parts';

interface PartEquivalencesProps {
    partId: string;
}

interface Equivalence {
    part_id: string;
    equivalent_part_id: string;
    equivalent_part: Part;
}

const PartEquivalences: React.FC<PartEquivalencesProps> = ({ partId }) => {
    const [equivalences, setEquivalences] = useState<Equivalence[]>([]);
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedPartId, setSelectedPartId] = useState('');
    const [bulkPartIds, setBulkPartIds] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPart, setCurrentPart] = useState<Part | null>(null);

    useEffect(() => {
        loadEquivalences();
        loadParts();
        loadCurrentPart();
    }, [partId]);

    const loadCurrentPart = async () => {
        try {
            const data = await partsAPI.getPart(partId);
            setCurrentPart(data);
        } catch (error) {
            console.error('Error loading current part:', error);
        }
    };

    const loadEquivalences = async () => {
        setLoading(true);
        try {
            const data = await partsAPI.getEquivalences(partId);
            setEquivalences(data);
        } catch (error) {
            console.error('Error loading equivalences:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadParts = async () => {
        try {
            const data = await partsAPI.getParts({ page: 1, page_size: 100 });
            setParts(data.items);
        } catch (error) {
            console.error('Error loading parts:', error);
        }
    };

    const handleAddEquivalence = async () => {
        if (!selectedPartId) return;
        setLoading(true);
        try {
            await partsAPI.createEquivalence(partId, selectedPartId);
            await loadEquivalences();
            setShowAddModal(false);
            setSelectedPartId('');
        } catch (error: any) {
            console.error('Error adding equivalence:', error);
            alert(error.response?.data?.detail || 'Failed to add equivalence');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAdd = async () => {
        const partIds = bulkPartIds.split('\n')
            .map(id => id.trim())
            .filter(id => id.length > 0);

        if (partIds.length === 0) return;

        setLoading(true);
        try {
            const result = await partsAPI.bulkCreateEquivalences(partId, partIds);
            await loadEquivalences();
            setShowBulkModal(false);
            setBulkPartIds('');

            // Build detailed message
            let message = `Successfully added ${result.created} equivalence${result.created !== 1 ? 's' : ''}.`;

            if (result.auto_created_parts && result.auto_created_parts.length > 0) {
                message += `\n\n✨ Auto-created ${result.auto_created_parts.length} new part${result.auto_created_parts.length !== 1 ? 's' : ''} (pending approval):\n${result.auto_created_parts.join('\n')}`;
            }

            if (result.skipped > 0) {
                message += `\n\nSkipped ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''}.`;
            }

            if (result.errors && result.errors.length > 0) {
                message += `\n\n⚠️ Errors:\n${result.errors.join('\n')}`;
            }

            alert(message);
        } catch (error: any) {
            console.error('Error adding multiple equivalences:', error);
            alert(error.response?.data?.detail || 'Failed to add equivalences');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (equivalentPartId: string) => {
        if (!confirm('Are you sure you want to delete this equivalence?')) return;
        setLoading(true);
        try {
            await partsAPI.deleteEquivalence(partId, equivalentPartId);
            await loadEquivalences();
        } catch (error: any) {
            console.error('Error deleting equivalence:', error);
            alert(error.response?.data?.detail || 'Failed to delete equivalence');
        } finally {
            setLoading(false);
        }
    };

    // Get list of already added equivalent part IDs to filter them out
    const existingEquivalentIds = new Set(equivalences.map(eq => eq.equivalent_part_id));

    const filteredParts = parts.filter(p =>
        p.id !== partId &&
        !existingEquivalentIds.has(p.id) &&  // Exclude already added equivalences
        (p.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.designation?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-900">Part Equivalences</h4>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Add Multiple
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Equivalence
                    </button>
                </div>
            </div>

            {/* Equivalences List */}
            {loading ? (
                <div className="text-center py-4">Loading...</div>
            ) : equivalences.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-sm text-gray-500 italic">No equivalences added yet</p>
                    <button onClick={() => setShowAddModal(true)} className="text-xs text-blue-600 hover:underline mt-1">
                        Add an equivalence
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {equivalences.map((eq) => (
                        <div key={eq.equivalent_part_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-sm text-gray-900">{eq.equivalent_part.part_id}</p>
                                <p className="text-xs text-gray-500">{eq.equivalent_part.designation || 'No designation'}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(eq.equivalent_part_id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Add Equivalence</h3>
                        <input
                            type="text"
                            placeholder="Search parts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input mb-3"
                        />
                        <select
                            value={selectedPartId}
                            onChange={(e) => setSelectedPartId(e.target.value)}
                            className="input mb-4"
                        >
                            <option value="">Select a part...</option>
                            {filteredParts.map((part) => (
                                <option key={part.id} value={part.id}>
                                    {part.part_id} - {part.designation || 'No designation'}
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowAddModal(false); setSearchTerm(''); }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEquivalence}
                                disabled={!selectedPartId || loading}
                                className="btn-primary"
                            >
                                {loading ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Multiple Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Add Multiple Equivalences</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Enter Part IDs (one per line). {currentPart && <span className="font-medium">Current part: {currentPart.part_id}</span>}
                            <br />
                            <span className="text-xs italic">Parts that don't exist will be auto-created with pending approval status.</span>
                        </p>
                        <textarea
                            value={bulkPartIds}
                            onChange={(e) => setBulkPartIds(e.target.value)}
                            className="input mb-4"
                            rows={10}
                            placeholder="e.g.&#10;PART001&#10;PART002&#10;ABC-123"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowBulkModal(false); setBulkPartIds(''); }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkAdd}
                                disabled={!bulkPartIds.trim() || loading}
                                className="btn-primary"
                            >
                                {loading ? 'Adding...' : 'Add All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartEquivalences;
