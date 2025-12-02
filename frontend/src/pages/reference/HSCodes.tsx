import React, { useState, useEffect } from 'react';
import { hsCodesAPI, HSCode, HSCodeCreate, HSCodeTariff, HSCodeTariffCreate } from '../../services/hsCodesApi';
import { countriesAPI, Country } from '../../services/countriesApi';

const HSCodes = () => {
    const [hsCodes, setHSCodes] = useState<HSCode[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showTariffModal, setShowTariffModal] = useState(false);
    const [editingHS, setEditingHS] = useState<HSCode | null>(null);
    const [selectedHS, setSelectedHS] = useState<string | null>(null);
    const [tariffs, setTariffs] = useState<HSCodeTariff[]>([]);
    const [formData, setFormData] = useState<HSCodeCreate>({
        hs_code: '',
        description_en: '',
        description_pr: '',
        description_pt: ''
    });
    const [tariffFormData, setTariffFormData] = useState<HSCodeTariffCreate>({
        hs_code: '',
        country_name: '',
        tariff_rate: undefined,
        last_updated: undefined
    });
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkResult, setBulkResult] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [search, page]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setPage(1);
    }, [search]);

    const loadData = async () => {
        setLoading(true);
        try {
            const skip = (page - 1) * pageSize;
            const [hsCodesData, countriesData] = await Promise.all([
                hsCodesAPI.getHSCodes(search, skip, pageSize, 'APPROVED'),
                countriesAPI.getCountries()
            ]);
            setHSCodes(hsCodesData.items);
            setTotal(hsCodesData.total);
            setTotalPages(hsCodesData.pages);
            setCountries(countriesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTariffs = async (hsCode: string) => {
        try {
            const data = await hsCodesAPI.getTariffs(hsCode);
            setTariffs(data);
        } catch (error) {
            console.error('Error loading tariffs:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingHS) {
                await hsCodesAPI.updateHSCode(editingHS.hs_code, formData);
            } else {
                await hsCodesAPI.createHSCode(formData);
            }
            await loadData();
            closeModal();
        } catch (error: any) {
            console.error('Error saving HS code:', error);
            alert(error.response?.data?.detail || 'Failed to save HS code');
        } finally {
            setLoading(false);
        }
    };

    const handleTariffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await hsCodesAPI.createTariff(tariffFormData);
            if (selectedHS) {
                await loadTariffs(selectedHS);
            }
            closeTariffModal();
        } catch (error: any) {
            console.error('Error saving tariff:', error);
            alert(error.response?.data?.detail || 'Failed to save tariff');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (hsCode: string) => {
        if (!window.confirm('Are you sure you want to delete this HS code?')) return;
        try {
            await hsCodesAPI.deleteHSCode(hsCode);
            await loadData();
        } catch (error) {
            console.error('Error deleting HS code:', error);
        }
    };

    const handleDeleteTariff = async (hsCode: string, countryName: string) => {
        if (!window.confirm('Are you sure you want to delete this tariff?')) return;
        try {
            await hsCodesAPI.deleteTariff(hsCode, countryName);
            await loadTariffs(hsCode);
        } catch (error) {
            console.error('Error deleting tariff:', error);
        }
    };

    const openEditModal = (hs: HSCode) => {
        setEditingHS(hs);
        setFormData({
            hs_code: hs.hs_code,
            description_en: hs.description_en || '',
            description_pr: hs.description_pr || '',
            description_pt: hs.description_pt || ''
        });
        setShowModal(true);
    };

    const openTariffsView = async (hsCode: string) => {
        setSelectedHS(hsCode);
        await loadTariffs(hsCode);
    };

    const openNewTariffModal = () => {
        if (!selectedHS) return;
        setTariffFormData({
            hs_code: selectedHS,
            country_name: '',
            tariff_rate: undefined,
            last_updated: undefined
        });
        setShowTariffModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingHS(null);
        setFormData({
            hs_code: '',
            description_en: '',
            description_pr: '',
            description_pt: ''
        });
    };

    const closeTariffModal = () => {
        setShowTariffModal(false);
        setTariffFormData({
            hs_code: selectedHS || '',
            country_name: '',
            tariff_rate: undefined,
            last_updated: undefined
        });
    };

    const handleBulkUpload = async () => {
        if (!bulkFile) return;
        setLoading(true);
        try {
            const result = await hsCodesAPI.bulkUpload(bulkFile);
            setBulkResult(result);
            await loadData();
        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert(error.response?.data?.detail || 'Failed to upload file');
        } finally {
            setLoading(false);
        }
    };

    const getCountryName = (code: string) => {
        const country = countries.find(c => c.name === code || c.code === code);
        return country ? country.name : code;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">HS Codes</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage Harmonized System codes and tariffs</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => hsCodesAPI.downloadTemplate()}
                        className="btn btn-secondary flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download Template</span>
                    </button>
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="btn btn-secondary"
                    >
                        Bulk Upload
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add HS Code</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search HS codes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input max-w-md"
                />
            </div>

            {/* Main Content - Split View */}
            <div className="grid grid-cols-2 gap-6">
                {/* HS Codes List */}
                <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold">HS Codes</h2>
                    </div>
                    <div className="overflow-y-auto max-h-[600px]">
                        {hsCodes.map((hs) => (
                            <div
                                key={hs.hs_code}
                                className={`px-4 py-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-all duration-150 ${selectedHS === hs.hs_code ? 'bg-blue-50 border-l-4 border-l-blue-600 shadow-sm' : 'border-l-4 border-l-transparent'
                                    }`}
                                onClick={() => openTariffsView(hs.hs_code)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-800">
                                                {hs.hs_code}
                                            </span>
                                            {selectedHS === hs.hs_code && (
                                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-700 mt-1.5 leading-relaxed">{hs.description_en || 'No description'}</div>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditModal(hs); }}
                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(hs.hs_code); }}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {hsCodes.length === 0 && !loading && (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg font-medium">No HS codes found</p>
                                <p className="text-sm mt-1">Add a new HS code to get started</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1 text-sm">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tariffs Panel */}
                <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">
                            {selectedHS ? `Tariffs for ${selectedHS}` : 'Tariffs'}
                        </h2>
                        {selectedHS && (
                            <button
                                onClick={openNewTariffModal}
                                className="btn btn-sm btn-primary"
                            >
                                Add Tariff
                            </button>
                        )}
                    </div>
                    <div className="overflow-y-auto max-h-[600px]">
                        {selectedHS ? (
                            <>
                                {tariffs.map((tariff) => (
                                    <div key={`${tariff.hs_code}-${tariff.country_name}`} className="px-4 py-3 border-b border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900">{getCountryName(tariff.country_name)}</div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    Rate: {tariff.tariff_rate ? `${tariff.tariff_rate}%` : 'N/A'}
                                                </div>
                                                {tariff.last_updated && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Updated: {new Date(tariff.last_updated).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteTariff(tariff.hs_code, tariff.country_name)}
                                                className="text-red-600 hover:text-red-900 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {tariffs.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <p className="text-sm">No tariffs defined for this HS code</p>
                                        <button
                                            onClick={openNewTariffModal}
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Add first tariff
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-sm mt-2">Select an HS code to view tariffs</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create/Edit HS Code Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingHS ? 'Edit HS Code' : 'Add HS Code'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="label">HS Code</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={14}
                                    value={formData.hs_code}
                                    onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                                    className="input font-mono"
                                    disabled={!!editingHS}
                                    placeholder="e.g., 8471.30.00.00"
                                />
                            </div>

                            <div>
                                <label className="label">Description (English)</label>
                                <textarea
                                    value={formData.description_en}
                                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                    className="input"
                                    rows={3}
                                    placeholder="English description"
                                />
                            </div>

                            <div>
                                <label className="label">Description (Portuguese)</label>
                                <textarea
                                    value={formData.description_pr}
                                    onChange={(e) => setFormData({ ...formData, description_pr: e.target.value })}
                                    className="input"
                                    rows={3}
                                    placeholder="Portuguese description"
                                />
                            </div>

                            <div>
                                <label className="label">Description (Other)</label>
                                <textarea
                                    value={formData.description_pt}
                                    onChange={(e) => setFormData({ ...formData, description_pt: e.target.value })}
                                    className="input"
                                    rows={3}
                                    placeholder="Additional description"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Saving...' : editingHS ? 'Save Changes' : 'Create HS Code'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Tariff Modal */}
            {showTariffModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Add Tariff</h2>
                            <button onClick={closeTariffModal} className="text-gray-400 hover:text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleTariffSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="label">Country</label>
                                <select
                                    required
                                    value={tariffFormData.country_name}
                                    onChange={(e) => setTariffFormData({ ...tariffFormData, country_name: e.target.value })}
                                    className="input"
                                >
                                    <option value="">Select Country...</option>
                                    {countries.map(country => (
                                        <option key={country.code} value={country.name}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Tariff Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={tariffFormData.tariff_rate || ''}
                                    onChange={(e) => setTariffFormData({ ...tariffFormData, tariff_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    className="input"
                                    placeholder="e.g., 5.5"
                                />
                            </div>

                            <div>
                                <label className="label">Last Updated</label>
                                <input
                                    type="date"
                                    value={tariffFormData.last_updated || ''}
                                    onChange={(e) => setTariffFormData({ ...tariffFormData, last_updated: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={closeTariffModal} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Adding...' : 'Add Tariff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Bulk Upload</h2>
                            <button onClick={() => { setShowBulkModal(false); setBulkResult(null); }} className="text-gray-400 hover:text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
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
                                            <ul className="text-xs text-red-600 list-disc ml-4 max-h-32 overflow-y-auto">
                                                {bulkResult.errors.map((error: string, i: number) => (
                                                    <li key={i}>{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button onClick={() => { setShowBulkModal(false); setBulkResult(null); }} className="btn btn-secondary">
                                    Close
                                </button>
                                <button onClick={handleBulkUpload} disabled={!bulkFile || loading} className="btn-primary">
                                    {loading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HSCodes;
