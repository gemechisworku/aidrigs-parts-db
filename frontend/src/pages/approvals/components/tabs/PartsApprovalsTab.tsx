import React, { useState, useEffect } from 'react';
import { approvalsAPI, PendingPart } from '../../../../services/approvalsApi';
import { TabComponentProps } from '../../types';
import { RejectionModal } from '../modals/RejectionModal';

export const PartsApprovalsTab: React.FC<TabComponentProps> = ({
    isActive,
    onCountChange,
    onRefreshNeeded
}) => {
    const [parts, setParts] = useState<PendingPart[]>([]);
    const [loading, setLoading] = useState(false);
    const [rejectingPart, setRejectingPart] = useState<PendingPart | null>(null);

    useEffect(() => {
        if (isActive) {
            loadPendingParts();
        }
    }, [isActive]);

    useEffect(() => {
        if (onCountChange) {
            onCountChange(parts.length);
        }
    }, [parts.length]);

    const loadPendingParts = async () => {
        setLoading(true);
        try {
            const data = await approvalsAPI.getPendingParts();
            setParts(data);
        } catch (error) {
            console.error('Error loading pending parts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (partId: string) => {
        setLoading(true);
        try {
            await approvalsAPI.approvePart(partId);
            await loadPendingParts();
            onRefreshNeeded?.();
            // Dispatch event to update menu counter
            window.dispatchEvent(new Event('approvalCountChanged'));
            alert('Part approved successfully!');
        } catch (error: any) {
            console.error('Error approving part:', error);
            alert(error.response?.data?.detail || 'Failed to approve part');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!rejectingPart) return;

        try {
            await approvalsAPI.rejectPart(rejectingPart.id, reason);
            await loadPendingParts();
            onRefreshNeeded?.();
            window.dispatchEvent(new Event('approvalCountChanged'));
            alert('Part rejected');
        } catch (error: any) {
            console.error('Error rejecting part:', error);
            alert(error.response?.data?.detail || 'Failed to reject part');
            throw error;
        }
    };

    if (!isActive) return null;

    if (loading && parts.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
            </div>
        );
    }

    if (parts.length === 0) {
        return (
            <div className="card text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-gray-500">No pending parts to review</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parts.map((part) => (
                    <div key={part.id} className="card hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">{part.part_id}</h3>
                                <p className="text-sm text-gray-600">{part.designation || 'No designation'}</p>
                                {part.submitted_at && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Submitted: {new Date(part.submitted_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleApprove(part.id)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                ✓ Approve
                            </button>
                            <button
                                onClick={() => setRejectingPart(part)}
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
                isOpen={rejectingPart !== null}
                entityType="Part"
                entityName={rejectingPart?.part_id}
                onClose={() => setRejectingPart(null)}
                onReject={handleReject}
                loading={loading}
            />
        </>
    );
};
