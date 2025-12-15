import React, { useState, useEffect } from 'react';
import { portsAPI, Port, PortCreate } from '../../../../services/portsApi';
import { countriesAPI, Country } from '../../../../services/countriesApi';
import { approvalsAPI } from '../../../../services/approvalsApi';
import { TabComponentProps } from '../../types';
import { RejectionModal } from '../modals/RejectionModal';

export const PortsApprovalsTab: React.FC<TabComponentProps> = ({
    isActive,
    onCountChange,
    onRefreshNeeded
}) => {
    const [ports, setPorts] = useState<Port[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [rejectingPort, setRejectingPort] = useState<Port | null>(null);
    const [editingPort, setEditingPort] = useState<Port | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);
    const [formData, setFormData] = useState<PortCreate>({
        port_code: '',
        port_name: '',
        country: '',
        city: '',
        type: undefined
    });

    // Load pending ports when tab becomes active
    useEffect(() => {
        if (isActive) {
            loadPendingPorts();
            loadCountries();
        }
    }, [isActive]);

    // Report count changes to parent
    useEffect(() => {
        if (onCountChange) {
            onCountChange(ports.length);
        }
    }, [ports.length]);

    const loadPendingPorts = async () => {
        setLoading(true);
        try {
            const allPendingItems = await approvalsAPI.getPendingItems('port');
            const portsData = allPendingItems
                .filter((item: any) => item.entity_type === 'port')
                .map((item: any) => ({
                    id: item.entity_id,
                    port_code: item.details.port_code,
                    port_name: item.details.port_name,
                    ...item.details,
                    approval_status: item.status,
                    submitted_at: item.submitted_at,
                    created_at: item.submitted_at,
                    updated_at: item.submitted_at
                }));
            setPorts(portsData);
        } catch (error) {
            console.error('Error loading pending ports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (portId: string) => {
        setLoading(true);
        try {
            await approvalsAPI.approvePort(portId);
            await loadPendingPorts();
            onRefreshNeeded?.();
            window.dispatchEvent(new Event('approvalCountChanged'));
            alert('Port approved successfully!');
        } catch (error: any) {
            console.error('Error approving port:', error);
            alert(error.response?.data?.detail || 'Failed to approve port');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!rejectingPort) return;

        try {
            await approvalsAPI.rejectPort(rejectingPort.id, reason);
            await loadPendingPorts();
            onRefreshNeeded?.();
            window.dispatchEvent(new Event('approvalCountChanged'));
            alert('Port rejected');
        } catch (error: any) {
            console.error('Error rejecting port:', error);
            alert(error.response?.data?.detail || 'Failed to reject port');
            throw error;
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

    const handleEditPort = (port: Port) => {
        setEditingPort(port);
        setFormData({
            port_code: port.port_code,
            port_name: port.port_name || '',
            country: port.country || '',
            city: port.city || '',
            type: port.type
        });
    };

    const handleSavePort = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPort) return;

        setLoading(true);
        try {
            await portsAPI.updatePort(editingPort.id, formData);
            await loadPendingPorts();
            setEditingPort(null);
            alert('Port updated successfully');
        } catch (error: any) {
            console.error('Error updating port:', error);
            alert(error.response?.data?.detail || 'Failed to update port');
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

    if (!isActive) return null;

    if (loading && ports.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
            </div>
        );
    }

    if (ports.length === 0) {
        return (
            <div className="card text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-gray-500">No pending ports to review</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ports.map((port) => (
                    <div key={port.id} className="card p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900">
                                    {port.port_name || port.port_code}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">{port.port_code}</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={selectedItems.has(port.id)}
                                onChange={() => toggleSelection(port.id)}
                                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                            {port.country && (
                                <div><span className="font-medium">Country:</span> {port.country}</div>
                            )}
                            {port.city && (
                                <div><span className="font-medium">City:</span> {port.city}</div>
                            )}
                            {port.type && (
                                <div><span className="font-medium">Type:</span> {port.type}</div>
                            )}
                            {port.submitted_at && (
                                <div className="text-xs text-gray-500 mt-2">
                                    Submitted: {new Date(port.submitted_at).toLocaleDateString()}
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleEditPort(port)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={() => handleApprove(port.id)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                ✓ Approve
                            </button>
                            <button
                                onClick={() => setRejectingPort(port)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                ✕ Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <RejectionModal
                isOpen={rejectingPort !== null}
                entityType="Port"
                entityName={rejectingPort?.port_name || rejectingPort?.port_code}
                onClose={() => setRejectingPort(null)}
                onReject={handleReject}
                loading={loading}
            />

            {/* Edit Modal */}
            {editingPort && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Edit Port</h2>
                        <form onSubmit={handleSavePort}>
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
                                        disabled
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
                                <button
                                    type="button"
                                    onClick={() => setEditingPort(null)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary"
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
