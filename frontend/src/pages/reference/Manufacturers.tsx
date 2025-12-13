import React, { useState, useEffect } from 'react';
import { manufacturersAPI, Manufacturer, ManufacturerCreate } from '../../services/manufacturersApi';
import { countriesAPI, Country } from '../../services/countriesApi';

const Manufacturers = () => {
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMfg, setEditingMfg] = useState<Manufacturer | null>(null);
    const [formData, setFormData] = useState<ManufacturerCreate>({
        mfg_id: '',
        mfg_name: '',
        mfg_type: 'OEM',
        country: '',
        website: '',
        certification: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [mfgData, countryData] = await Promise.all([
                manufacturersAPI.getManufacturers(),
                countriesAPI.getCountries()
            ]);
            setManufacturers(mfgData);
            setCountries(countryData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingMfg) {
                await manufacturersAPI.updateManufacturer(editingMfg.id, formData);
            } else {
                await manufacturersAPI.createManufacturer(formData);
            }
            // Reload manufacturers only
            const data = await manufacturersAPI.getManufacturers();
            setManufacturers(data);
            closeModal();
        } catch (error: any) {
            console.error('Error saving manufacturer:', error);
            alert(error.response?.data?.detail || 'Failed to save manufacturer');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this manufacturer?')) return;
        try {
            await manufacturersAPI.deleteManufacturer(id);
            const data = await manufacturersAPI.getManufacturers();
            setManufacturers(data);
        } catch (error) {
            console.error('Error deleting manufacturer:', error);
        }
    };

    const openEditModal = (mfg: Manufacturer) => {
        setEditingMfg(mfg);
        setFormData({
            mfg_id: mfg.mfg_id,
            mfg_name: mfg.mfg_name,
            mfg_type: mfg.mfg_type,
            country: mfg.country || '',
            website: mfg.website || '',
            certification: mfg.certification || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingMfg(null);
        setFormData({
            mfg_id: '',
            mfg_name: '',
            mfg_type: 'OEM',
            country: '',
            website: '',
            certification: ''
        });
    };

    const getCountryName = (code: string) => {
        const country = countries.find(c => c.code === code);
        return country ? country.name : code;
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manufacturers</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage OEM, APM, and Remanufacturers</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Manufacturer</span>
                </button>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table-auto w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {/* ID column removed */}
                                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th> */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {manufacturers.map((mfg) => (
                                <tr key={mfg.id} className="hover:bg-gray-50 transition-colors">
                                    {/* ID cell removed */}
                                    {/* 
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {mfg.mfg_id}
                                    </td>
                                    */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {mfg.mfg_name}
                                        {mfg.certification && (
                                            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {mfg.certification}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full 
                                            ${mfg.mfg_type === 'OEM' ? 'bg-green-100 text-green-800' :
                                                mfg.mfg_type === 'APM' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {mfg.mfg_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {mfg.country ? (
                                            <div className="flex items-center space-x-2">
                                                <span>{getCountryName(mfg.country)}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900">
                                        {mfg.website ? (
                                            <a href={mfg.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1">
                                                <span>Visit</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <button
                                            onClick={() => openEditModal(mfg)}
                                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(mfg.id)}
                                            className="text-red-600 hover:text-red-900 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {manufacturers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <p className="text-lg font-medium text-gray-900">No manufacturers found</p>
                                            <p className="text-sm text-gray-500">Get started by adding a new manufacturer.</p>
                                            <button
                                                onClick={() => setShowModal(true)}
                                                className="mt-2 btn-primary"
                                            >
                                                Add Manufacturer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingMfg ? 'Edit Manufacturer' : 'Add Manufacturer'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* mfg_id input removed */}
                                {/* 
                                <div>
                                    <label className="label">Manufacturer ID</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={10}
                                        value={formData.mfg_id}
                                        onChange={(e) => setFormData({ ...formData, mfg_id: e.target.value.toUpperCase() })}
                                        className="input uppercase font-mono"
                                        disabled={!!editingMfg}
                                        placeholder="e.g., CAT"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Unique identifier (max 10 chars)</p>
                                </div>
                                */}
                                <div>
                                    <label className="label">Type</label>
                                    <select
                                        required
                                        value={formData.mfg_type}
                                        onChange={(e) => setFormData({ ...formData, mfg_type: e.target.value as any })}
                                        className="input"
                                    >
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
                                    required
                                    value={formData.mfg_name}
                                    onChange={(e) => setFormData({ ...formData, mfg_name: e.target.value })}
                                    className="input"
                                    placeholder="Full Manufacturer Name"
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

                            <div className="grid grid-cols-2 gap-4">
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
                                <div>
                                    <label className="label">Certification</label>
                                    <input
                                        type="text"
                                        value={formData.certification}
                                        onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                                        className="input"
                                        placeholder="e.g., ISO 9001"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingMfg ? 'Save Changes' : 'Create Manufacturer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Manufacturers;
