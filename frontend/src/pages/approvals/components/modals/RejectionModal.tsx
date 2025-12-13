import React, { useState } from 'react';

interface RejectionModalProps {
    isOpen: boolean;
    entityType: string;
    entityName?: string;
    onClose: () => void;
    onReject: (reason: string) => Promise<void>;
    loading?: boolean;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
    isOpen,
    entityType,
    entityName,
    onClose,
    onReject,
    loading = false
}) => {
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!rejectionReason.trim()) return;

        setSubmitting(true);
        try {
            await onReject(rejectionReason);
            setRejectionReason('');
            onClose();
        } catch (error) {
            console.error('Rejection error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setRejectionReason('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                <h3 className="text-lg font-bold mb-4">
                    Reject {entityType}{entityName ? `: ${entityName}` : ''}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                    Please provide a reason for rejection:
                </p>
                <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="input mb-4 w-full"
                    rows={4}
                    placeholder="Enter rejection reason..."
                    autoFocus
                    disabled={submitting || loading}
                />
                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="btn-secondary"
                        disabled={submitting || loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!rejectionReason.trim() || submitting || loading}
                        className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                        {submitting || loading ? 'Rejecting...' : 'Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
};
