/**
 * Parts Catalog Page  
 * Full CRUD for vehicle parts with modal form and dropdown selectors
 */
import { useState, useEffect } from 'react';
import { partsAPI, Part, PartCreate, Manufacturer, Position } from '../../services/partsApi';
import { translationAPI, Translation } from '../../services/translationApi';

const PartsList = () => {
    const [parts, setParts] = useState<Part[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [translations, setTranslations] = useState<Translation[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterMfg, setFilterMfg] = useState('');
    const [filterDriveSide, setFilterDriveSide] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Modal states
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingPart, setEditingPart] = useState<Part | null>(null);

    // Form state
    const [formData, setFormData] = useState<PartCreate>({
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

    useEffect(() => {
        loadParts();
        loadDropdownData();
    }, [page, search, filterMfg, filterDriveSide]);

    const loadDropdownData = async () => {
        try {
            const [mfgs, trans, pos] = await Promise.all([
                partsAPI.getManufacturers(),
                translationAPI.getTranslations({ page: 1, page_size: 1000 }),
                partsAPI.getPositions(),
            ]);
            setManufacturers(mfgs);
            setTranslations(trans.items);
            setPositions(pos);
        } catch (error) {
            console.error('Error loading dropdown data:', error);
        }
    };

    const loadParts = async () => {
        setLoading(true);
        try {
            const response = await partsAPI.getParts({
                search,
                mfg_id: filterMfg || undefined,
                drive_side: filterDriveSide || undefined,
                page,
                page_size: 20,
            });
            setParts(response.items);
            setTotal(response.total);
            setTotalPages(response.pages);
        } catch (error) {
            console.error('Error loading parts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPart) {
                await partsAPI.updatePart(editingPart.id, formData);
            } else {
                await partsAPI.createPart(formData);
            }
            setShowFormModal(false);
            resetForm();
            loadParts();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Error saving part');
        }
    };

    const resetForm = () => {
        setFormData({
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
        setEditingPart(null);
    };

    const handleEdit = (part: Part) => {
        setEditingPart(part);
        setFormData({
            part_id: part.part_id,
            mfg_id: part.mfg_id || '',
            part_name_en: part.part_name_en || '',
            position_id: part.position_id || '',
            drive_side: part.drive_side || 'NA',
            designation: part.designation || '',
            moq: part.moq,
            weight: part.weight,
            width: part.width,
            length: part.length,
            height: part.height,
            note: part.note || '',
            image_url: part.image_url || '',
        });
        setShowFormModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this part?')) return;
        try {
            await partsAPI.deletePart(id);
            loadParts();
        } catch (error) {
            alert('Error deleting part');
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Parts Catalog</h1>
                        <p className="text-gray-600">Manage vehicle parts inventory</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowFormModal(true);
                        }}
                        className="btn-primary"
                    >
                        + Add Part
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="card mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Search by Part ID or Designation..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input"
                            />
                        </div>
                        <div>
                            <select
                                value={filterMfg}
                                onChange={(e) => setFilterMfg(e.target.value)}
                                className="input"
                            >
                                <option value="">All Manufacturers</option>
                                {manufacturers.map((mfg) => (
                                    <option key={mfg.id} value={mfg.id}>
                                        {mfg.mfg_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <select
                                value={filterDriveSide}
                                onChange={(e) => setFilterDriveSide(e.target.value)}
                                className="input"
                            >
                                <option value="">All Drive Sides</option>
                                <option value="NA">NA</option>
                                <option value="LHD">LHD</option>
                                <option value="RHD">RHD</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        {total} total parts
                    </div>
                </div>

                {/* Parts Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    ) : parts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No parts found. Add your first part!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drive Side</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {parts.map((part) => (
                                        <tr key={part.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {part.part_id}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {part.designation || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {part.manufacturer?.mfg_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {part.part_translation?.part_name_en || part.part_name_en || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {part.position?.position_en || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                                                    {part.drive_side}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <button
                                                    onClick={() => handleEdit(part)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(part.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 flex justify-between items-center border-t">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="btn-outline disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="btn-outline disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingPart ? 'Edit Part' : 'Add Part'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Part ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Part ID * (max 12 chars)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.part_id}
                                        onChange={(e) => setFormData({ ...formData, part_id: e.target.value })}
                                        required
                                        disabled={!!editingPart}
                                        className="input disabled:bg-gray-100"
                                        maxLength={12}
                                    />
                                </div>

                                {/* Designation */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Designation
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
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
                                        value={formData.mfg_id}
                                        onChange={(e) => setFormData({ ...formData, mfg_id: e.target.value })}
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
                                    <select
                                        value={formData.part_name_en}
                                        onChange={(e) => setFormData({ ...formData, part_name_en: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">-- Select Part Name --</option>
                                        {translations.map((trans) => (
                                            <option key={trans.id} value={trans.part_name_en}>
                                                {trans.part_name_en}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Position */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Position
                                    </label>
                                    <select
                                        value={formData.position_id}
                                        onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
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
                                        value={formData.drive_side}
                                        onChange={(e) => setFormData({ ...formData, drive_side: e.target.value as 'NA' | 'LHD' | 'RHD' })}
                                        className="input"
                                    >
                                        <option value="NA">NA</option>
                                        <option value="LHD">LHD (Left Hand Drive)</option>
                                        <option value="RHD">RHD (Right Hand Drive)</option>
                                    </select>
                                </div>

                                {/* MOQ */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        MOQ (Minimum Order Quantity)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.moq || ''}
                                        onChange={(e) => setFormData({ ...formData, moq: e.target.value ? Number(e.target.value) : undefined })}
                                        className="input"
                                        min="0"
                                    />
                                </div>

                                {/* Physical Dimensions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.weight || ''}
                                        onChange={(e) => setFormData({ ...formData, weight: e.target.value ? Number(e.target.value) : undefined })}
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
                                        value={formData.width || ''}
                                        onChange={(e) => setFormData({ ...formData, width: e.target.value ? Number(e.target.value) : undefined })}
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
                                        value={formData.length || ''}
                                        onChange={(e) => setFormData({ ...formData, length: e.target.value ? Number(e.target.value) : undefined })}
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
                                        value={formData.height || ''}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : undefined })}
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
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        className="input"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingPart ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartsList;
