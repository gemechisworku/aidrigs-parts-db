import React, { useState, useEffect } from 'react';
import { approvalsAPI, PendingPart } from '../../services/approvalsApi';

const PendingApprovals: React.FC = () => {
    const [pendingParts, setPendingParts] = useState<PendingPart[]>([]);
    const [loading, setLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingPartId, setRejectingPartId] = useState<string | null>(null);

    useEffect(() => {
        loadPendingParts();
    }, []);

    const loadPendingParts = async () => {
        setLoading(true);
        try {
            const data = await approvalsAPI.getPendingParts();
            setPendingParts(data);
        } catch (error) {
            console.error('Error loading pending parts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (partId: string) => {
        if (!confirm('Are you sure you want to approve this part?')) return;
        setLoading(true);
        try {
            await approvalsAPI.approvePart(partId);
            await loadPendingParts();
            alert('Part approved successfully!');
        } catch (error: any) {
            console.error('Error approving part:', error);
            alert(error.response?.data?.detail || 'Failed to approve part');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectingPartId || !rejectionReason.trim()) return;
        setLoading(true);
        try {
            await approvalsAPI.rejectPart(rejectingPartId, rejectionReason);
            await loadPendingParts();
            setRejectingPartId(null);
            setRejectionReason('');
            alert('Part rejected');
        } catch (error: any) {
            console.error('Error rejecting part:', error);
            alert(error.response?.data?.detail || 'Failed to reject part');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                <p className="text-sm text-gray-600">Review and approve pending parts</p>
            </div>

            {loading && pendingParts.length === 0 ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            ) : pendingParts.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-500 italic">No pending parts to review</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingParts.map((part) => (
                        <div key={part.id} className="card">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{part.part_id}</h3>
                                    <p className="text-sm text-gray-600">{part.designation || 'No designation'}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Submitted: {part.submitted_at ? new Date(part.submitted_at).toLocaleString() : 'N/A'}
                                    </p>
                                    <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                                        Pending Approval
                                    </span>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleApprove(part.id)}
                                        disabled={loading}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        onClick={() => setRejectingPartId(part.id)}
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                        ✕ Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Rejection Modal */}
            {rejectingPartId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Reject Part</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Please provide a reason for rejecting this part:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="input mb-4"
                            rows={4}
                            placeholder="Enter rejection reason..."
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setRejectingPartId(null); setRejectionReason(''); }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || loading}
                                className="btn-primary bg-red-600 hover:bg-red-700"
                            >
                                {loading ? 'Rejecting...' : 'Reject Part'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingApprovals;
