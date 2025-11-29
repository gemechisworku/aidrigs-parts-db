/**
 * Ports Management Page
 */
import { useState, useEffect } from 'react';
import { portsAPI, Port, PortCreate } from '../../services/portsApi';
import { countriesAPI, Country } from '../../services/countriesApi';

const Ports = () => {
    const [ports, setPorts] = useState<Port[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingPort, setEditingPort] = useState<Port | null>(null);
    const [formData, setFormData] = useState<PortCreate>({
        port_code: '',
        port_name: '',
        country: '',
        city: '',
        type: undefined
    });
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkResult, setBulkResult] = useState<any>(null);

    useEffect(() => {
        loadPorts();
        loadCountries();
    }, [search]);

    const loadPorts = async () => {
        setLoading(true);
        try {
            const data = await portsAPI.getPorts(search);
            setPorts(data);
        } catch (error) {
            console.error('Error loading ports:', error);
        } finally {
            setLoading(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingPort) {
                await portsAPI.updatePort(editingPort.id, formData);
            } else {
                await portsAPI.createPort(formData);
            }
            await loadPorts();
            closeModal();
        } catch (error: any) {
            console.error('Error saving port:', error);
            alert(error.response?.data?.detail || 'Failed to save port');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this port?')) return;

        try {
            await portsAPI.deletePort(id);
            await loadPorts();
        } catch (error) {
            console.error('Error deleting port:', error);
        }
    };

    const openEditModal = (port: Port) => {
        setEditingPort(port);
        setFormData({
            port_code: port.port_code,
            port_name: port.port_name || '',
            country: port.country || '',
            city: port.city || '',
            type: port.type
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPort(null);
        setFormData({
            port_code: '',
            port_name: '',
            country: '',
            city: '',
            type: undefined
        });
    };

    const handleBulkUpload = async () => {
        if (!bulkFile) return;

        setLoading(true);
        try {
            const result = await portsAPI.bulkUpload(bulkFile);
            setBulkResult(result);
            await loadPorts();
        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert(error.response?.data?.detail || 'Failed to upload file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Ports</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => portsAPI.downloadTemplate()}
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
                            Add Port
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search ports..."
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {ports.map((port) => (
                                    <tr key={port.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{port.port_code}</td>
                                        <td className="px-4 py-4 text-sm text-gray-700">{port.port_name}</td>

                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            {port.country_name || port.country || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">{port.city}</td>

                                        <td className="px-4 py-4 text-sm text-gray-700">
                                            {port.type && <span className="badge badge-primary">{port.type}</span>}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-right">
                                            <button
                                                onClick={() => openEditModal(port)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(port.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {ports.length === 0 && !loading && (
                            <div className="text-center py-8 text-gray-500">
                                No ports found
                            </div>
                        )}
                    </div>
                </div>

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h2 className="text-xl font-bold mb-4">
                                {editingPort ? 'Edit Port' : 'Add Port'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="label">Port Code *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.port_code}
                                            onChange={(e) => setFormData({ ...formData, port_code: e.target.value })}
                                            className="input"
                                            maxLength={5}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Port Name</label>
                                        <input
                                            type="text"
                                            value={formData.port_name}
                                            onChange={(e) => setFormData({ ...formData, port_name: e.target.value })}
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
                                        <label className="label">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Type</label>
                                        <select
                                            value={formData.type || ''}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                            className="input"
                                        >
                                            <option value="">Select type</option>
                                            <option value="Sea">Sea</option>
                                            <option value="Air">Air</option>
                                            <option value="Land">Land</option>
                                        </select>
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
                            <h2 className="text-xl font-bold mb-4">Bulk Upload Ports</h2>
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

export default Ports;
