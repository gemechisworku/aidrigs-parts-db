import React, { useState, useEffect } from 'react';
import { vehiclesAPI, Vehicle, VehicleCreate, VehicleEquivalence, VehiclePartCompatibility } from '../../services/vehiclesApi';
import { partsAPI } from '../../services/partsApi';

const Vehicles = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

    // Equivalences state
    const [equivalences, setEquivalences] = useState<VehicleEquivalence[]>([]);
    const [loadingEquivalences, setLoadingEquivalences] = useState(false);
    const [showEquivalenceModal, setShowEquivalenceModal] = useState(false);
    const [equivalenceForm, setEquivalenceForm] = useState({ equivalent_families: '' });

    // Parts compatibility state
    const [compatibleParts, setCompatibleParts] = useState<VehiclePartCompatibility[]>([]);
    const [loadingParts, setLoadingParts] = useState(false);
    const [showPartModal, setShowPartModal] = useState(false);
    const [partsList, setPartsList] = useState<any[]>([]);
    const [partForm, setPartForm] = useState({ part_id: '', notes: '' });

    // Vehicles list for equivalences dropdown
    const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
    const [loadingVehiclesList, setLoadingVehiclesList] = useState(false);

    // UI state for expanded items and tabs
    const [expandedEquiv, setExpandedEquiv] = useState<Set<string>>(new Set());
    const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
    const [selectedEquivTab, setSelectedEquivTab] = useState(0);

    const [formData, setFormData] = useState<VehicleCreate>({
        vin: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        engine: '',
        trim: '',
        transmission: '',
        drive_type: ''
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
            const data = await vehiclesAPI.getVehicles(search, skip, pageSize);
            setVehicles(data.items);
            setTotal(data.total);
            setTotalPages(data.pages);
        } catch (error) {
            console.error('Error loading vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingVehicle) {
                await vehiclesAPI.updateVehicle(editingVehicle.id, formData);
            } else {
                await vehiclesAPI.createVehicle(formData);
            }
            await loadData();
            closeModal();
        } catch (error: any) {
            console.error('Error saving vehicle:', error);
            alert(error.response?.data?.detail || 'Failed to save vehicle');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
        try {
            await vehiclesAPI.deleteVehicle(id);
            await loadData();
            if (selectedVehicle === id) {
                setSelectedVehicle(null);
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
        }
    };

    const openEditModal = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            engine: vehicle.engine || '',
            trim: vehicle.trim || '',
            transmission: vehicle.transmission || '',
            drive_type: vehicle.drive_type || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingVehicle(null);
        setFormData({
            vin: '',
            make: '',
            model: '',
            year: new Date().getFullYear(),
            engine: '',
            trim: '',
            transmission: '',
            drive_type: ''
        });
    };

    const handleBulkUpload = async () => {
        if (!bulkFile) return;
        setLoading(true);
        try {
            const result = await vehiclesAPI.bulkUpload(bulkFile);
            setBulkResult(result);
            await loadData();
        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert(error.response?.data?.detail || 'Failed to upload file');
        } finally {
            setLoading(false);
        }
    };

    const openDetailsView = (vehicleId: string) => {
        setSelectedVehicle(vehicleId);
        loadEquivalences(vehicleId);
        loadCompatibleParts(vehicleId);
        // Load vehicles and parts lists for display
        loadVehiclesList();
        loadPartsList();
    };

    const loadEquivalences = async (vehicleId: string) => {
        setLoadingEquivalences(true);
        try {
            const data = await vehiclesAPI.getEquivalences(vehicleId);
            setEquivalences(data);
            // Load vehicles list if not already loaded
            if (vehiclesList.length === 0) {
                await loadVehiclesList();
            }
        } catch (error) {
            console.error('Error loading equivalences:', error);
        } finally {
            setLoadingEquivalences(false);
        }
    };

    const loadCompatibleParts = async (vehicleId: string) => {
        setLoadingParts(true);
        try {
            const data = await vehiclesAPI.getCompatibleParts(vehicleId);
            setCompatibleParts(data);
            // Load parts list if not already loaded
            if (partsList.length === 0) {
                await loadPartsList();
            }
        } catch (error) {
            console.error('Error loading compatible parts:', error);
        } finally {
            setLoadingParts(false);
        }
    };

    const loadPartsList = async () => {
        try {
            const data = await partsAPI.getParts({});
            setPartsList(data.items || []);
        } catch (error) {
            console.error('Error loading parts list:', error);
        }
    };

    const loadVehiclesList = async () => {
        setLoadingVehiclesList(true);
        try {
            const data = await vehiclesAPI.getVehicles('', 0, 1000);
            setVehiclesList(data.items || []);
        } catch (error) {
            console.error('Error loading vehicles list:', error);
        } finally {
            setLoadingVehiclesList(false);
        }
    };

    const handleAddEquivalence = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle) return;

        // Check for duplicates
        const isDuplicate = equivalences.some(eq => eq.equivalent_families === equivalenceForm.equivalent_families);
        if (isDuplicate) {
            alert('This vehicle equivalence already exists!');
            return;
        }

        setLoading(true);
        try {
            await vehiclesAPI.createEquivalence(selectedVehicle, {
                vin_prefix: selectedVehicle,
                equivalent_families: equivalenceForm.equivalent_families
            });
            await loadEquivalences(selectedVehicle);
            setShowEquivalenceModal(false);
            setEquivalenceForm({ equivalent_families: '' });
        } catch (error: any) {
            console.error('Error adding equivalence:', error);
            alert(error.response?.data?.detail || 'Failed to add equivalence');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEquivalence = async (equivalenceId: string) => {
        if (!selectedVehicle) return;
        if (!window.confirm('Are you sure you want to delete this equivalence?')) return;

        try {
            await vehiclesAPI.deleteEquivalence(selectedVehicle, equivalenceId);
            await loadEquivalences(selectedVehicle);
        } catch (error) {
            console.error('Error deleting equivalence:', error);
        }
    };

    const handleAddCompatiblePart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle) return;

        // Check for duplicates
        const isDuplicate = compatibleParts.some(cp => cp.part_id === partForm.part_id);
        if (isDuplicate) {
            alert('This part compatibility already exists!');
            return;
        }

        setLoading(true);
        try {
            await vehiclesAPI.createCompatiblePart(selectedVehicle, {
                vehicle_id: selectedVehicle,
                part_id: partForm.part_id,
                notes: partForm.notes || undefined
            });
            await loadCompatibleParts(selectedVehicle);
            setShowPartModal(false);
            setPartForm({ part_id: '', notes: '' });
        } catch (error: any) {
            console.error('Error adding compatible part:', error);
            alert(error.response?.data?.detail || 'Failed to add compatible part');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCompatiblePart = async (partId: string) => {
        if (!selectedVehicle) return;
        if (!window.confirm('Are you sure you want to remove this part compatibility?')) return;

        try {
            await vehiclesAPI.deleteCompatiblePart(selectedVehicle, partId);
            await loadCompatibleParts(selectedVehicle);
        } catch (error) {
            console.error('Error deleting compatible part:', error);
        }
    };

    const openAddEquivalenceModal = async () => {
        await loadVehiclesList();
        setShowEquivalenceModal(true);
    };

    const openAddPartModal = async () => {
        await loadPartsList();
        setShowPartModal(true);
    };

    const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage vehicle catalog and compatibility</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => vehiclesAPI.downloadTemplate()}
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
                        <span>Add Vehicle</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by VIN, make, or model..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input max-w-md"
                />
            </div>

            {/* Main Content - Split View */}
            <div className="grid grid-cols-2 gap-6">
                {/* Vehicles List */}
                <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold">Vehicles</h2>
                    </div>
                    <div className="overflow-y-auto max-h-[600px]">
                        {vehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className={`px-4 py-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-all duration-150 ${selectedVehicle === vehicle.id ? 'bg-blue-50 border-l-4 border-l-blue-600 shadow-sm' : 'border-l-4 border-l-transparent'
                                    }`}
                                onClick={() => openDetailsView(vehicle.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-800">
                                                {vehicle.vin}
                                            </span>
                                            {selectedVehicle === vehicle.id && (
                                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="font-semibold text-gray-900 mt-1.5">
                                            {vehicle.year} {vehicle.make} {vehicle.model}
                                        </div>
                                        {vehicle.trim && (
                                            <div className="text-sm text-gray-600 mt-1">
                                                {vehicle.trim}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditModal(vehicle); }}
                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(vehicle.id); }}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {vehicles.length === 0 && !loading && (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg font-medium">No vehicles found</p>
                                <p className="text-sm mt-1">Add a new vehicle to get started</p>
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

                {/* Details Panel */}
                <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold">
                            {selectedVehicleData ? `${selectedVehicleData.year} ${selectedVehicleData.make} ${selectedVehicleData.model}` : 'Vehicle Details'}
                        </h2>
                    </div>
                    <div className="overflow-y-auto max-h-[600px] p-4">
                        {selectedVehicleData ? (
                            <div className="space-y-6">
                                {/* Vehicle Info */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex">
                                            <span className="text-gray-600 w-32">VIN:</span>
                                            <span className="font-mono text-gray-900">{selectedVehicleData.vin}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-600 w-32">Make:</span>
                                            <span className="text-gray-900">{selectedVehicleData.make}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-600 w-32">Model:</span>
                                            <span className="text-gray-900">{selectedVehicleData.model}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-600 w-32">Year:</span>
                                            <span className="text-gray-900">{selectedVehicleData.year}</span>
                                        </div>
                                        {selectedVehicleData.engine && (
                                            <div className="flex">
                                                <span className="text-gray-600 w-32">Engine:</span>
                                                <span className="text-gray-900">{selectedVehicleData.engine}</span>
                                            </div>
                                        )}
                                        {selectedVehicleData.trim && (
                                            <div className="flex">
                                                <span className="text-gray-600 w-32">Trim:</span>
                                                <span className="text-gray-900">{selectedVehicleData.trim}</span>
                                            </div>
                                        )}
                                        {selectedVehicleData.transmission && (
                                            <div className="flex">
                                                <span className="text-gray-600 w-32">Transmission:</span>
                                                <span className="text-gray-900">{selectedVehicleData.transmission}</span>
                                            </div>
                                        )}
                                        {selectedVehicleData.drive_type && (
                                            <div className="flex">
                                                <span className="text-gray-600 w-32">Drive Type:</span>
                                                <span className="text-gray-900">{selectedVehicleData.drive_type}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Equivalences */}
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700">Equivalent Vehicles</h3>
                                        <button
                                            onClick={openAddEquivalenceModal}
                                            className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    {loadingEquivalences ? (
                                        <p className="text-sm text-gray-500">Loading...</p>
                                    ) : equivalences.length > 0 ? (
                                        <div className="space-y-3">
                                            {/* Tabs for multiple equivalences */}
                                            {equivalences.length > 1 && (
                                                <div className="flex gap-2 flex-wrap border-b border-gray-200 pb-2">
                                                    {equivalences.map((equiv, index) => {
                                                        const equivVehicle = vehiclesList.find(v => v.id === equiv.equivalent_families);
                                                        return (
                                                            <button
                                                                key={equiv.id}
                                                                onClick={() => setSelectedEquivTab(index)}
                                                                className={`px-3 py-1.5 text-xs font-medium rounded-t ${selectedEquivTab === index
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    }`}
                                                            >
                                                                {equivVehicle ? `${equivVehicle.make} ${equivVehicle.model}` : `Equiv ${index + 1}`}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Display selected equivalence */}
                                            {equivalences.map((equiv, index) => {
                                                if (equivalences.length > 1 && index !== selectedEquivTab) return null;

                                                const equivVehicle = vehiclesList.find(v => v.id === equiv.equivalent_families);
                                                const isExpanded = expandedEquiv.has(equiv.id);

                                                return (
                                                    <div key={equiv.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                        {/* Header - always visible */}
                                                        <div
                                                            className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                                            onClick={() => {
                                                                const newExpanded = new Set(expandedEquiv);
                                                                if (isExpanded) {
                                                                    newExpanded.delete(equiv.id);
                                                                } else {
                                                                    newExpanded.add(equiv.id);
                                                                }
                                                                setExpandedEquiv(newExpanded);
                                                            }}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex-1">
                                                                    {equivVehicle ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-mono text-xs text-gray-600">{equivVehicle.vin}</span>
                                                                            <span className="text-gray-400">-</span>
                                                                            <span className="font-medium text-gray-900">{equivVehicle.make} {equivVehicle.model}</span>
                                                                            <span className="text-xs text-gray-500">({equivVehicle.year})</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-500 text-xs">Vehicle ID: {equiv.equivalent_families}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteEquivalence(equiv.id); }}
                                                                        className="text-red-600 hover:text-red-900 text-xs px-2 py-1"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                    <svg
                                                                        className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expanded details */}
                                                        {isExpanded && equivVehicle && (
                                                            <div className="p-4 bg-white border-t border-gray-200">
                                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                                    <div>
                                                                        <span className="font-medium text-gray-600">VIN:</span>
                                                                        <p className="font-mono text-gray-900 mt-0.5">{equivVehicle.vin}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-gray-600">Year:</span>
                                                                        <p className="text-gray-900 mt-0.5">{equivVehicle.year}</p>
                                                                    </div>
                                                                    {equivVehicle.trim && (
                                                                        <div>
                                                                            <span className="font-medium text-gray-600">Trim:</span>
                                                                            <p className="text-gray-900 mt-0.5">{equivVehicle.trim}</p>
                                                                        </div>
                                                                    )}
                                                                    {equivVehicle.engine && (
                                                                        <div>
                                                                            <span className="font-medium text-gray-600">Engine:</span>
                                                                            <p className="text-gray-900 mt-0.5">{equivVehicle.engine}</p>
                                                                        </div>
                                                                    )}
                                                                    {equivVehicle.transmission && (
                                                                        <div>
                                                                            <span className="font-medium text-gray-600">Transmission:</span>
                                                                            <p className="text-gray-900 mt-0.5">{equivVehicle.transmission}</p>
                                                                        </div>
                                                                    )}
                                                                    {equivVehicle.drive_type && (
                                                                        <div>
                                                                            <span className="font-medium text-gray-600">Drive Type:</span>
                                                                            <p className="text-gray-900 mt-0.5">{equivVehicle.drive_type}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No equivalent vehicles defined</p>
                                    )}
                                </div>

                                {/* Compatible Parts */}
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700">Compatible Parts</h3>
                                        <button
                                            onClick={openAddPartModal}
                                            className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    {loadingParts ? (
                                        <p className="text-sm text-gray-500">Loading...</p>
                                    ) : compatibleParts.length > 0 ? (
                                        <div className="space-y-2">
                                            {compatibleParts.map((comp) => {
                                                const part = partsList.find(p => p.id === comp.part_id);
                                                const isExpanded = expandedParts.has(comp.id);

                                                return (
                                                    <div key={comp.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                        {/* Header - always visible */}
                                                        <div
                                                            className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                                            onClick={() => {
                                                                const newExpanded = new Set(expandedParts);
                                                                if (isExpanded) {
                                                                    newExpanded.delete(comp.id);
                                                                } else {
                                                                    newExpanded.add(comp.id);
                                                                }
                                                                setExpandedParts(newExpanded);
                                                            }}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex-1">
                                                                    {part ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-mono text-xs text-gray-600">{part.part_id}</span>
                                                                            {part.designation && (
                                                                                <>
                                                                                    <span className="text-gray-400">-</span>
                                                                                    <span className="font-medium text-gray-900">{part.designation}</span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-500 text-xs">Part ID: {comp.part_id}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteCompatiblePart(comp.part_id); }}
                                                                        className="text-red-600 hover:text-red-900 text-xs px-2 py-1"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                    <svg
                                                                        className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expanded details */}
                                                        {isExpanded && part && (
                                                            <div className="p-4 bg-white border-t border-gray-200">
                                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                                    <div>
                                                                        <span className="font-medium text-gray-600">Part ID:</span>
                                                                        <p className="font-mono text-gray-900 mt-0.5">{part.part_id}</p>
                                                                    </div>
                                                                    {part.designation && (
                                                                        <div>
                                                                            <span className="font-medium text-gray-600">Designation:</span>
                                                                            <p className="text-gray-900 mt-0.5">{part.designation}</p>
                                                                        </div>
                                                                    )}
                                                                    {part.part_name_en && (
                                                                        <div>
                                                                            <span className="font-medium text-gray-600">Part Name:</span>
                                                                            <p className="text-gray-900 mt-0.5">{part.part_name_en}</p>
                                                                        </div>
                                                                    )}
                                                                    {part.manufacturer && (
                                                                        <div>
                                                                            <span className="font-medium text-gray-600">Manufacturer:</span>
                                                                            <p className="text-gray-900 mt-0.5">{part.manufacturer.mfg_name}</p>
                                                                        </div>
                                                                    )}
                                                                    {part.drive_side && part.drive_side !== 'NA' && (
                                                                        <div>
                                                                            <span className="font-medium text-gray-600">Drive Side:</span>
                                                                            <p className="text-gray-900 mt-0.5">{part.drive_side}</p>
                                                                        </div>
                                                                    )}
                                                                    {comp.notes && (
                                                                        <div className="col-span-2">
                                                                            <span className="font-medium text-gray-600">Notes:</span>
                                                                            <p className="text-gray-900 mt-0.5 italic">{comp.notes}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No compatible parts defined</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm mt-2">Select a vehicle to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="label">VIN *</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={17}
                                        minLength={17}
                                        value={formData.vin}
                                        onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                                        className="input font-mono"
                                        disabled={!!editingVehicle}
                                        placeholder="17-character VIN"
                                    />
                                </div>

                                <div>
                                    <label className="label">Make *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.make}
                                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="label">Model *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="label">Year *</label>
                                    <input
                                        type="number"
                                        required
                                        min={1900}
                                        max={2100}
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="label">Engine</label>
                                    <input
                                        type="text"
                                        value={formData.engine}
                                        onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                                        className="input"
                                        placeholder="e.g., 2.0L Turbo"
                                    />
                                </div>

                                <div>
                                    <label className="label">Trim</label>
                                    <input
                                        type="text"
                                        value={formData.trim}
                                        onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                                        className="input"
                                        placeholder="e.g., Sport"
                                    />
                                </div>

                                <div>
                                    <label className="label">Transmission</label>
                                    <input
                                        type="text"
                                        value={formData.transmission}
                                        onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                                        className="input"
                                        placeholder="e.g., CVT, Manual"
                                    />
                                </div>

                                <div>
                                    <label className="label">Drive Type</label>
                                    <select
                                        value={formData.drive_type}
                                        onChange={(e) => setFormData({ ...formData, drive_type: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">Select...</option>
                                        <option value="FWD">FWD</option>
                                        <option value="RWD">RWD</option>
                                        <option value="AWD">AWD</option>
                                        <option value="4WD">4WD</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Saving...' : editingVehicle ? 'Save Changes' : 'Create Vehicle'}
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

            {/* Add Equivalence Modal */}
            {showEquivalenceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Add Equivalence</h2>
                            <button onClick={() => setShowEquivalenceModal(false)} className="text-gray-400 hover:text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddEquivalence} className="p-6">
                            <div>
                                <label className="label">Equivalent Vehicle *</label>
                                {loadingVehiclesList ? (
                                    <p className="text-sm text-gray-500">Loading vehicles...</p>
                                ) : (
                                    <select
                                        required
                                        value={equivalenceForm.equivalent_families}
                                        onChange={(e) => setEquivalenceForm({ equivalent_families: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">Select an equivalent vehicle...</option>
                                        {vehiclesList
                                            .filter(v => v.id !== selectedVehicle)
                                            .map((vehicle) => (
                                                <option key={vehicle.id} value={vehicle.id}>
                                                    {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim ? `(${vehicle.trim})` : ''} - {vehicle.vin}
                                                </option>
                                            ))}
                                    </select>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Select a vehicle that has equivalent parts compatibility</p>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowEquivalenceModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading || loadingVehiclesList} className="btn-primary">
                                    {loading ? 'Adding...' : 'Add Equivalence'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Compatible Part Modal */}
            {showPartModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Add Compatible Part</h2>
                            <button onClick={() => setShowPartModal(false)} className="text-gray-400 hover:text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddCompatiblePart} className="p-6 space-y-4">
                            <div>
                                <label className="label">Part *</label>
                                <select
                                    required
                                    value={partForm.part_id}
                                    onChange={(e) => setPartForm({ ...partForm, part_id: e.target.value })}
                                    className="input"
                                >
                                    <option value="">Select a part...</option>
                                    {partsList.map((part: any) => (
                                        <option key={part.id} value={part.id}>
                                            {part.part_id}{part.designation ? ` - ${part.designation}` : ''}{part.part_name_en ? ` (${part.part_name_en})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Notes</label>
                                <textarea
                                    value={partForm.notes}
                                    onChange={(e) => setPartForm({ ...partForm, notes: e.target.value })}
                                    className="input"
                                    rows={3}
                                    placeholder="Optional notes about this compatibility"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowPartModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    {loading ? 'Adding...' : 'Add Part'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vehicles;
